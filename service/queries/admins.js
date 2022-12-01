import { getDBPool } from "#utils/dbConfig";

export const getAdminUserByEmail = async (email) =>
  await getDBPool("masterDb").query(
    `
        SELECT admin_id, name, surname, phone_prefix, phone, email, role, password, is_active
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
        SELECT admin_id, name, surname, phone_prefix, phone, email, role, password, is_active
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
      INSERT INTO admin (name, surname, phone_prefix, phone, email, password, role, is_active)
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
      props.isActive,
    ]
  );

export const checkIfEmailIsUsedQuery = async ({ email }) =>
  await getDBPool("masterDb").query(
    `
    SELECT email
    FROM admin
    WHERE email = $1
    `,
    [email]
  );

export const updateAdminDataQuery = async ({
  admin_id,
  name,
  surname,
  email,
  phonePrefix,
  phone,
}) =>
  await getDBPool("masterDb").query(
    `
      UPDATE admin
      SET name = $1, 
          surname = $2, 
          email = $3, 
          phone_prefix = $4,
          phone = $5
      WHERE admin_id = $6
      RETURNING *;
    `,
    [name, surname, email, phonePrefix, phone, admin_id]
  );

export const updateAdminDataByIdQuery = async ({
  adminId,
  name,
  surname,
  email,
  phonePrefix,
  phone,
  isActive,
}) =>
  await getDBPool("masterDb").query(
    `
      UPDATE admin
      SET name = $1,
          surname = $2,
          email = $3,
          phone_prefix = $4,
          phone = $5,
          is_active = $6
      WHERE admin_id = $7
      RETURNING *;
    `,
    [name, surname, email, phonePrefix, phone, isActive, adminId]
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

export const getAllGlobalAdminsQuery = async () =>
  await getDBPool("masterDb").query(
    `
      SELECT admin_id, name, surname, phone_prefix, phone, email, role, is_active
      FROM admin
      WHERE role = 'global'
      ORDER BY created_at DESC;
    `
  );

export const getAllCountryAdminsQuery = async ({ countryId }) =>
  await getDBPool("masterDb").query(
    `
      SELECT admin.admin_id, name, surname, phone_prefix, phone, email, role, is_active
      FROM admin
        INNER JOIN admin_country_links ON admin.admin_id = admin_country_links.admin_id
      WHERE role = 'country' AND admin_country_links.country_id = $1
      ORDER BY admin.created_at DESC;
    `,
    [countryId]
  );
