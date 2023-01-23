import { getDBPool } from "#utils/dbConfig";

export const storeAuthOTP = async (poolCountry, admin_id, otp) =>
  await getDBPool("masterDb", poolCountry).query(
    `
        INSERT INTO auth_otp (otp, admin_id)
        VALUES ($1, $2)
        RETURNING *;
    `,
    [otp, admin_id]
  );

export const getAuthOTP = async (poolCountry, otp, admin_id) =>
  await getDBPool("masterDb", poolCountry).query(
    `
        SELECT *
        FROM auth_otp
        WHERE otp = $1 
          AND admin_id = $2
          AND used = false;
    `,
    [otp, admin_id]
  );

export const getUserLastAuthOTP = async (poolCountry, admin_id) =>
  await getDBPool("masterDb", poolCountry).query(
    `
        SELECT *
        FROM auth_otp
        WHERE admin_id = $1
        ORDER BY created_at DESC
        LIMIT 1;
    `,
    [admin_id]
  );

export const changeOTPToUsed = async (poolCountry, otp_id) =>
  await getDBPool("masterDb", poolCountry).query(
    `
        UPDATE auth_otp
        SET used = true
        WHERE id = $1;
    `,
    [otp_id]
  );
