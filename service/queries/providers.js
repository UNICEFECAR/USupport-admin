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
