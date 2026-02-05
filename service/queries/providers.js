import { getDBPool } from "#utils/dbConfig";

export const getProviderDataById = async ({ providerId, poolCountry }) =>
  await getDBPool("piiDb", poolCountry).query(
    `
        SELECT name, surname, patronym
        FROM provider_detail
        WHERE provider_detail_id = $1;
    `,
    [providerId]
  );

export const getMultipleProvidersDataByIDs = async ({
  poolCountry,
  providerDetailIds,
}) =>
  await getDBPool("piiDb", poolCountry).query(
    `
      SELECT name, surname, patronym, email, provider_detail_id, image
      FROM provider_detail
      WHERE provider_detail_id = ANY($1);
    `,
    [providerDetailIds]
  );

export const getAllProvidersQuery = async ({
  poolCountry,
  limit,
  offset,
  price,
  status,
  specialization,
  free,
  sort_name,
  sort_email,
  sort_consultationPrice,
  sort_status,
  search,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
        SELECT provider_detail."provider_detail_id", provider_detail."name", patronym, surname, nickname,
               provider_detail.email, provider_detail.phone, image, specializations, street,
               provider_detail.city, postcode, education, sex, consultation_price, 
               provider_detail.description, video_link, status,
         JSON_AGG(
                JSON_BUILD_OBJECT(
                    'organization_id', organization_provider_links.organization_id,
                    'organization_name', organization.name)
                  ) AS organizations
        FROM provider_detail
          JOIN "user" ON "user".provider_detail_id = provider_detail.provider_detail_id AND "user".deleted_at IS NULL
          LEFT JOIN organization_provider_links ON (organization_provider_links.provider_detail_id = provider_detail.provider_detail_id AND organization_provider_links.is_deleted = false)
          LEFT JOIN organization ON organization.organization_id = organization_provider_links.organization_id
        WHERE consultation_price >= $3
        AND (
          CASE WHEN $4 = 'any' THEN status = ANY(ARRAY['active', 'inactive']) ELSE status = $4 END 
          AND CASE WHEN $5 = 'any' THEN specializations IS NOT NULL ELSE specializations::text[] @> ARRAY[$5] END
          AND CASE WHEN $6 = true THEN consultation_price = 0 ELSE consultation_price >= 0 END
          AND (
            $11::text[] IS NULL OR
            (
              SELECT COUNT(DISTINCT search_term) 
              FROM unnest($11::text[]) AS search_term
              WHERE provider_detail.name::text ILIKE '%' || search_term || '%'
                 OR provider_detail.surname ILIKE '%' || search_term || '%'
                 OR provider_detail.patronym ILIKE '%' || search_term || '%'
                 OR provider_detail.email ILIKE '%' || search_term || '%'
            ) = array_length($11::text[], 1)
          )
        )
        GROUP BY provider_detail.provider_detail_id
        ORDER BY 
          CASE WHEN $7 = 'asc' THEN provider_detail.name ELSE NULL END ASC,
          CASE WHEN $7 = 'desc' THEN provider_detail.name ELSE NULL END DESC,
          CASE WHEN $8 = 'asc' THEN provider_detail.email ELSE NULL END ASC,
          CASE WHEN $8 = 'desc' THEN provider_detail.email ELSE NULL END DESC,
          CASE WHEN $9 = 'asc' THEN provider_detail.consultation_price ELSE NULL END ASC,
          CASE WHEN $9 = 'desc' THEN provider_detail.consultation_price ELSE NULL END DESC,
          CASE WHEN $10 = 'asc' THEN provider_detail.status ELSE NULL END ASC,
          CASE WHEN $10 = 'desc' THEN provider_detail.status ELSE NULL END DESC
        LIMIT $1
        OFFSET $2;
      `,
    [
      limit,
      offset,
      price,
      status,
      specialization,
      free,
      sort_name,
      sort_email,
      sort_consultationPrice,
      sort_status,
      search,
    ]
  );
};

export const getAllProviderNamesQuery = async ({ poolCountry }) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      SELECT provider_detail.provider_detail_id, name, surname, patronym
      FROM provider_detail
          JOIN "user" ON "user".provider_detail_id = provider_detail.provider_detail_id AND "user".deleted_at IS NULL
      ORDER BY NAME ASC;
    `
  );
};
