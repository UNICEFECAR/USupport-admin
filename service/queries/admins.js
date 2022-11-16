import { getDBPool } from "#utils/dbConfig";

export const getAdminUserByEmail = async (poolCountry, email) =>
  await getDBPool("masterDb", poolCountry).query(
    `
        SELECT admin_id, name, surname, phone_prefix, phone, email, role, password 
        FROM admin
        WHERE email = $1
        ORDER BY created_at DESC
        LIMIT 1;
    `,
    [email]
  );

export const getAdminUserByID = async (poolCountry, admin_id) =>
  await getDBPool("masterDb", poolCountry).query(
    `
        SELECT admin_id, name, surname, phone_prefix, phone, email, role
        FROM admin
        WHERE admin_id = $1
        ORDER BY created_at DESC
        LIMIT 1;
    `,
    [admin_id]
  );

export const createAdminUser = async (props) =>
  await getDBPool("masterDb", props.poolCountry).query(
    `
      WITH newAdmin AS (

          INSERT INTO admin (name, surname, phone_prefix, phone, email, password, role)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING * 

      ), adminCountryLink AS (

          INSERT INTO admin_country_links (admin_id, country_id)
          SELECT admin_id, $8 FROM newAdmin
          RETURNING * 

      )

      SELECT * FROM newAdmin;
    `,
    [
      props.name,
      props.surname,
      props.phonePrefix,
      props.phone,
      props.email,
      props.hashedPass,
      props.role,
      props.adminCountryId,
    ]
  );

export const updateAdminUserPassword = async ({
  poolCountry,
  password,
  admin_id,
}) =>
  await getDBPool("masterDb", poolCountry).query(
    `
      UPDATE admin
      SET password = $1
      WHERE admin_id = $2;        
    `,
    [password, admin_id]
  );
