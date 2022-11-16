import { getDBPool } from "#utils/dbConfig";

export const storeForgotPasswordTokenQuery = async ({
  poolCountry,
  admin_id,
  forgotPassToken,
}) =>
  await getDBPool("masterDb", poolCountry).query(
    `
        INSERT INTO password_reset (admin, reset_token, expires_at)
        VALUES ($1, $2, NOW() + INTERVAL '1 DAY')
        RETURNING *;
    `,
    [admin_id, forgotPassToken]
  );

export const getForgotPasswordTokenQuery = async ({
  poolCountry,
  forgotPassToken,
}) =>
  await getDBPool("masterDb", poolCountry).query(
    `
        SELECT * 
        FROM password_reset
        WHERE reset_token = $1; 
    `,
    [forgotPassToken]
  );

export const invalidatePasswordResetTokenQuery = async ({
  poolCountry,
  token,
}) =>
  await getDBPool("masterDb", poolCountry).query(
    `
        UPDATE password_reset
        SET used = true
        WHERE reset_token = $1;
    `,
    [token]
  );
