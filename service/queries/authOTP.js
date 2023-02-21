import { getDBPool } from "#utils/dbConfig";

export const storeAuthOTP = async (admin_id, otp) =>
  await getDBPool("masterDb").query(
    `
        INSERT INTO auth_otp (otp, admin_id)
        VALUES ($1, $2)
        RETURNING *;
    `,
    [otp, admin_id]
  );

export const getAuthOTP = async (otp, admin_id) =>
  await getDBPool("masterDb").query(
    `
        SELECT *
        FROM auth_otp
        WHERE otp = $1 
          AND admin_id = $2
          AND used = false;
    `,
    [otp, admin_id]
  );

export const getAdminLastAuthOTP = async (admin_id) =>
  await getDBPool("masterDb").query(
    `
        SELECT *
        FROM auth_otp
        WHERE admin_id = $1
        ORDER BY created_at DESC
        LIMIT 1;
    `,
    [admin_id]
  );

export const changeOTPToUsed = async (otp_id) =>
  await getDBPool("masterDb").query(
    `
        UPDATE auth_otp
        SET used = true
        WHERE id = $1;
    `,
    [otp_id]
  );
