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

export const getAllProvidersQuery = async ({ poolCountry }) =>
  await getDBPool("piiDb", poolCountry).query(
    `
      SELECT provider_detail."provider_detail_id", "name", patronym, surname, nickname, email, phone_prefix, phone, image, specializations, street, city, postcode, education, sex, consultation_price, description, video_link, status
      FROM provider_detail
        JOIN "user" ON "user".provider_detail_id = provider_detail.provider_detail_id AND "user".deleted_at IS NULL
      ORDER BY provider_detail.name ASC;
    `
  );
