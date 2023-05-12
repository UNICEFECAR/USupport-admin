import { getDBPool } from "#utils/dbConfig";

export const getAdminUserByEmail = async (email, role) =>
  await getDBPool("masterDb").query(
    `
        SELECT admin_id, name, surname, phone, email, role, password, is_active
        FROM admin
        WHERE email = $1 AND role = $2
        ORDER BY created_at DESC
        LIMIT 1;
    `,
    [email, role]
  );

export const getAdminUserByID = async (admin_id) =>
  await getDBPool("masterDb").query(
    `
        SELECT admin_id, name, surname, phone, email, role, password, is_active
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
      INSERT INTO admin (name, surname, phone, email, password, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `,
    [
      props.name,
      props.surname,
      props.phone,
      props.email,
      props.hashedPass,
      props.role,
      props.isActive,
    ]
  );

export const checkIfEmailIsUsedQuery = async ({ email, role }) =>
  await getDBPool("masterDb").query(
    `
    SELECT email
    FROM admin
    WHERE email = $1 AND role = $2
    `,
    [email, role]
  );

export const updateAdminDataQuery = async ({
  admin_id,
  name,
  surname,
  email,
  phone,
}) =>
  await getDBPool("masterDb").query(
    `
      UPDATE admin
      SET name = $1, 
          surname = $2, 
          email = $3, 
          phone = $4
      WHERE admin_id = $5
      RETURNING *;
    `,
    [name, surname, email, phone, admin_id]
  );

export const updateAdminDataByIdQuery = async ({
  adminId,
  name,
  surname,
  email,
  phone,
  isActive,
}) =>
  await getDBPool("masterDb").query(
    `
      UPDATE admin
      SET name = $1,
          surname = $2,
          email = $3,
          phone = $4,
          is_active = $5
      WHERE admin_id = $6
      RETURNING *;
    `,
    [name, surname, email, phone, isActive, adminId]
  );

export const deleteAdminDataByIdQuery = async ({ adminId }) =>
  await getDBPool("masterDb").query(
    `
      UPDATE admin
      SET name = 'DELETED',
          surname = 'DELETED',
          phone = 'DELETED',
          email = 'DELETED',
          is_active = false,
          deleted_at = NOW()
      WHERE admin_id = $1
      RETURNING *;
    `,
    [adminId]
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
      SELECT admin_id, name, surname, phone, email, role, is_active
      FROM admin
      WHERE role = 'global' AND deleted_at IS NULL
      ORDER BY created_at DESC;
    `
  );

export const getAllCountryAdminsQuery = async ({ countryId }) =>
  await getDBPool("masterDb").query(
    `
      SELECT admin.admin_id, name, surname, phone, email, role, is_active
      FROM admin
        INNER JOIN admin_country_links ON admin.admin_id = admin_country_links.admin_id
      WHERE role = 'country' AND admin_country_links.country_id = $1  AND admin.deleted_at IS NULL
      ORDER BY admin.created_at DESC;
    `,
    [countryId]
  );

export const updateProviderStatusQuery = async ({
  poolCountry,
  providerDetailId,
  status,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
        UPDATE provider_detail
        SET status = $1
        WHERE provider_detail_id = $2
        RETURNING *;
      `,
    [status, providerDetailId]
  );
};
