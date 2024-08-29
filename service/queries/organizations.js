import { getDBPool } from "#utils/dbConfig";

export const createOrganizationQuery = async ({
  name,
  createdBy,
  country: poolCountry,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
            INSERT INTO organization (name, created_by)
            VALUES ($1, $2)
            RETURNING *
        `,
    [name, createdBy]
  );
};
