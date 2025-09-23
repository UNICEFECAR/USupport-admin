import { getDBPool } from "#utils/dbConfig";

export const getClientDetailsByUserIds = async ({ poolCountry, userIds }) => {
  if (!userIds || userIds.length === 0) {
    return { rows: [], rowCount: 0 };
  }

  return await getDBPool("piiDb", poolCountry).query(
    `
      SELECT
        user_id,
        client_detail_id
      FROM "user"
      WHERE user_id = ANY($1)
        AND type = 'client'
        AND deleted_at IS NULL;
      `,
    [userIds]
  );
};
