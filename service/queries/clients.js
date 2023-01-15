import { getDBPool } from "#utils/dbConfig";

export const getClientDataById = async ({ clientId, poolCountry }) =>
  await getDBPool("piiDb", poolCountry).query(
    `
        SELECT name, surname, nickname
        FROM client_detail
        WHERE client_detail_id = $1;
    `,
    [clientId]
  );
