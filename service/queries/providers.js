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
}) =>
  await getDBPool("piiDb", poolCountry).query(
    `
      SELECT provider_detail."provider_detail_id", "name", patronym, surname, nickname, email, phone_prefix, phone, image, specializations, street, city, postcode, education, sex, consultation_price, description, video_link, status
      FROM provider_detail
        JOIN "user" ON "user".provider_detail_id = provider_detail.provider_detail_id AND "user".deleted_at IS NULL
      WHERE consultation_price >= $3 AND
            CASE WHEN $4 = 'any' THEN status = ANY(ARRAY['active', 'inactive']) ELSE status = $4 END 
            AND 
            CASE WHEN $5 = 'any' THEN specializations IS NOT NULL ELSE specializations::text[] @> ARRAY[$5] END
            AND
            CASE WHEN $6 = true THEN consultation_price = 0 ELSE consultation_price > 0 
            END
      ORDER BY provider_detail.name ASC
      LIMIT $1
      OFFSET $2;
    `,
    [limit, offset, price, status, specialization, free]
  );
