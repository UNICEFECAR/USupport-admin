import { getDBPool } from "#utils/dbConfig";

export const getProviderDataById = async ({ providerId, poolCountry, languageId }) =>
  await getDBPool("piiDb", poolCountry).query(
    `
        SELECT
          COALESCE(pdt.name, provider_detail.name) AS name,
          COALESCE(pdt.surname, provider_detail.surname) AS surname,
          COALESCE(pdt.patronym, provider_detail.patronym) AS patronym
        FROM provider_detail
        LEFT JOIN provider_detail_translations pdt
          ON pdt.provider_detail_id = provider_detail.provider_detail_id
          AND pdt.language_id = $2::UUID
        WHERE provider_detail.provider_detail_id = $1;
    `,
    [providerId, languageId]
  );

export const getMultipleProvidersDataByIDs = async ({
  poolCountry,
  providerDetailIds,
  languageId,
}) =>
  await getDBPool("piiDb", poolCountry).query(
    `
      SELECT
        provider_detail.provider_detail_id,
        COALESCE(pdt.name, provider_detail.name) AS name,
        COALESCE(pdt.surname, provider_detail.surname) AS surname,
        COALESCE(pdt.patronym, provider_detail.patronym) AS patronym,
        provider_detail.email,
        provider_detail.image
      FROM provider_detail
      LEFT JOIN provider_detail_translations pdt
        ON pdt.provider_detail_id = provider_detail.provider_detail_id
        AND pdt.language_id = $2::UUID
      WHERE provider_detail.provider_detail_id = ANY($1);
    `,
    [providerDetailIds, languageId]
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
  languageId,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
        SELECT provider_detail."provider_detail_id",
               COALESCE(pdt.name, provider_detail."name") AS name,
               COALESCE(pdt.patronym, provider_detail.patronym) AS patronym,
               COALESCE(pdt.surname, provider_detail.surname) AS surname,
               provider_detail.nickname,
               provider_detail.email, provider_detail.phone, provider_detail.image,
               provider_detail.specializations,
               COALESCE(pdt.street, provider_detail.street) AS street,
               COALESCE(pdt.city, provider_detail.city) AS city,
               provider_detail.postcode,
               COALESCE(pdt.education, provider_detail.education) AS education,
               provider_detail.sex, provider_detail.consultation_price,
               COALESCE(pdt.description, provider_detail.description) AS description,
               provider_detail.video_link, provider_detail.status,
         JSON_AGG(
                JSON_BUILD_OBJECT(
                    'organization_id', organization_provider_links.organization_id,
                    'organization_name', organization.name)
                  ) AS organizations
        FROM provider_detail
          JOIN "user" ON "user".provider_detail_id = provider_detail.provider_detail_id AND "user".deleted_at IS NULL
          LEFT JOIN provider_detail_translations pdt
            ON pdt.provider_detail_id = provider_detail.provider_detail_id
            AND pdt.language_id = $12::UUID
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
              SELECT COUNT(*)
              FROM unnest($11::text[]) AS search_term
              WHERE provider_detail.name::text ILIKE '%' || search_term || '%'
                 OR provider_detail.surname ILIKE '%' || search_term || '%'
                 OR provider_detail.patronym ILIKE '%' || search_term || '%'
                 OR provider_detail.email ILIKE '%' || search_term || '%'
                 OR EXISTS (
                   SELECT 1 FROM provider_detail_translations pdt_search
                   WHERE pdt_search.provider_detail_id = provider_detail.provider_detail_id
                     AND (
                       pdt_search.name::text ILIKE '%' || search_term || '%'
                       OR pdt_search.surname ILIKE '%' || search_term || '%'
                       OR pdt_search.patronym ILIKE '%' || search_term || '%'
                     )
                 )
            ) = array_length($11::text[], 1)
          )
        )
        GROUP BY provider_detail.provider_detail_id,
                 pdt.provider_detail_id,
                 pdt.name, pdt.patronym, pdt.surname, pdt.education, pdt.description, pdt.city, pdt.street
        ORDER BY
          CASE WHEN $7 = 'asc' THEN COALESCE(pdt.name, provider_detail.name) ELSE NULL END ASC,
          CASE WHEN $7 = 'desc' THEN COALESCE(pdt.name, provider_detail.name) ELSE NULL END DESC,
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
      languageId,
    ]
  );
};

export const getAllProviderNamesQuery = async ({ poolCountry, languageId }) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      SELECT provider_detail.provider_detail_id,
             COALESCE(pdt.name, provider_detail.name) AS name,
             COALESCE(pdt.surname, provider_detail.surname) AS surname,
             COALESCE(pdt.patronym, provider_detail.patronym) AS patronym
      FROM provider_detail
          JOIN "user" ON "user".provider_detail_id = provider_detail.provider_detail_id AND "user".deleted_at IS NULL
          LEFT JOIN provider_detail_translations pdt
            ON pdt.provider_detail_id = provider_detail.provider_detail_id
            AND pdt.language_id = $1::UUID
      ORDER BY COALESCE(pdt.name, provider_detail.name) ASC;
    `,
    [languageId]
  );
};

export const getLanguageIdByAlpha2Query = async (alpha2) =>
  await getDBPool("masterDb").query(
    `SELECT language_id FROM language WHERE alpha2 = $1 LIMIT 1`,
    [alpha2]
  );
