import { getDBPool } from "#utils/dbConfig";

export const storeRefreshToken = async (admin_id, refreshToken) =>
  await getDBPool("masterDb").query(
    `
      INSERT INTO refresh_token (admin_id, token, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '60 MINUTE')
      RETURNING *;
    `,
    [admin_id, refreshToken]
  );

export const getRefreshToken = async (token) =>
  await getDBPool("masterDb").query(
    `
      SELECT refresh_token.admin_id, expires_at, used, admin.role as admin_role
      FROM refresh_token
        JOIN admin ON admin.admin_id = refresh_token.admin_id
      WHERE token = $1
      ORDER BY refresh_token.created_at DESC
      LIMIT 1;
    `,
    [token]
  );

export const invalidateRefreshToken = async (token) =>
  await getDBPool("masterDb").query(
    `
      UPDATE refresh_token
      SET used = true
      WHERE token = $1;
    `,
    [token]
  );
