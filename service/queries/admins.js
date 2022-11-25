import { getDBPool } from "#utils/dbConfig";

export const getAdminUserByEmail = async (email) =>
  await getDBPool("masterDb").query(
    `
        SELECT admin_id, name, surname, phone_prefix, phone, email, role, password 
        FROM admin
        WHERE email = $1
        ORDER BY created_at DESC
        LIMIT 1;
    `,
    [email]
  );

export const getAdminUserByID = async (admin_id) =>
  await getDBPool("masterDb").query(
    `
        SELECT admin_id, name, surname, phone_prefix, phone, email, role, password
        FROM admin
        WHERE admin_id = $1
        ORDER BY created_at DESC
        LIMIT 1;
    `,
    [admin_id]
  );

export const createAdminUser = async (props) =>
  await getDBPool("masterDb").query(
    `
      INSERT INTO admin (name, surname, phone_prefix, phone, email, password, role)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `,
    [
      props.name,
      props.surname,
      props.phonePrefix,
      props.phone,
      props.email,
      props.hashedPass,
      props.role,
    ]
  );

export const updateAdminUserPassword = async ({ password, admin_id }) =>
  await getDBPool("masterDb").query(
    `
      UPDATE admin
      SET password = $1
      WHERE admin_id = $2;        
    `,
    [password, admin_id]
  );

export const createAdminToCountryLink = async ({ adminId, countryId }) =>
  await getDBPool("masterDb").query(
    `
        INSERT INTO admin_country_links (admin_id, country_id)
        VALUES ($1, $2)
        RETURNING *;
    `,
    [adminId, countryId]
  );

export const createAdminToRegionLink = async ({ adminId, regionId }) =>
  await getDBPool("masterDb").query(
    `
        INSERT INTO admin_region_links (admin_id, region_id)
        VALUES ($1, $2)
        RETURNING *;
    `,
    [adminId, regionId]
  );
