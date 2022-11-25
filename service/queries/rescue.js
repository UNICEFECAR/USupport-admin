import { getDBPool } from "#utils/dbConfig";

export const storeForgotPasswordTokenQuery = async ({
  admin_id,
  forgotPassToken,
}) =>
  await getDBPool("masterDb").query(
    `
        INSERT INTO password_reset (admin_id, reset_token, expires_at)
        VALUES ($1, $2, NOW() + INTERVAL '1 DAY')
        RETURNING *;
    `,
    [admin_id, forgotPassToken]
  );

export const getForgotPasswordTokenQuery = async ({ forgotPassToken }) =>
  await getDBPool("masterDb").query(
    `
        SELECT * 
        FROM password_reset
        WHERE reset_token = $1; 
    `,
    [forgotPassToken]
  );

export const invalidatePasswordResetTokenQuery = async ({ token }) =>
  await getDBPool("masterDb").query(
    `
        UPDATE password_reset
        SET used = true
        WHERE reset_token = $1;
    `,
    [token]
  );
