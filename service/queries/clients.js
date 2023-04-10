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

export const getMultipleClientsDataByIDs = async ({
  poolCountry,
  clientDetailIds,
}) =>
  await getDBPool("piiDb", poolCountry).query(
    `
      SELECT name, surname, nickname, email, client_detail_id, sex, year_of_birth, urban_rural
      FROM client_detail
      WHERE client_detail_id = ANY($1);
    `,
    [clientDetailIds]
  );
