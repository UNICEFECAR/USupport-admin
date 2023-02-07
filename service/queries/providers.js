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
      SELECT name, surname, patronym, email, provider_detail_id
      FROM provider_detail
      WHERE provider_detail_id = ANY($1);
    `,
    [providerDetailIds]
  );
