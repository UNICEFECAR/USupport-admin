import { getDBPool } from "#utils/dbConfig";

export const storeRefreshToken = async (poolCountry, admin_id, refreshToken) =>
  await getDBPool("masterDb", poolCountry).query(
    `
      INSERT INTO refresh_token (admin_id, token, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '7 DAYS')
      RETURNING *;
    `,
    [admin_id, refreshToken]
  );

export const getRefreshToken = async (poolCountry, token) =>
  await getDBPool("masterDb", poolCountry).query(
    `
      SELECT"refresh_token.admin_id, expires_at, used
      FROM refresh_token
        JOIN admin_id ON admin.admin_id = refresh_token.admin_id
      WHERE token = $1
      ORDER BY refresh_token.created_at DESC
      LIMIT 1;
    `,
    [token]
  );

export const invalidateRefreshToken = async (poolCountry, token) =>
  await getDBPool("masterDb", poolCountry).query(
    `
      UPDATE refresh_token
      SET used = true
      WHERE token = $1;
    `,
    [token]
  );
