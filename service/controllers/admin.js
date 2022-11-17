import bcrypt from "bcryptjs";

import { getAdminUserByID } from "#queries/admins";

import { updatePassword } from "#utils/helperFunctions";
import { adminNotFound, incorrectPassword } from "#utils/errors";

export const getAdminUser = async ({ country, language, admin_id }) => {
  return await getAdminUserByID(country, admin_id)
    .then((res) => {
      if (res.rowCount === 0) {
        throw adminNotFound(language);
      } else {
        return res.rows[0];
      }
    })
    .catch((err) => {
      throw err;
    });
};

export const changeAdminUserPassword = async ({
  country,
  language,
  admin_id,
  oldPassword,
  newPassword,
}) => {
  const adminData = await getAdminUser({ country, language, admin_id });
  const validatePassword = await bcrypt.compare(
    oldPassword,
    adminData.password
  );

  if (!validatePassword) {
    throw incorrectPassword(language);
  }

  await updatePassword({
    poolCountry: country,
    admin_id,
    password: newPassword,
  });

  return { success: true };
};
