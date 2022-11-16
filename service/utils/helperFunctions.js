import bcrypt from "bcryptjs";
import { updateAdminUserPassword } from "#queries/admins";

export const updatePassword = async ({ poolCountry, admin_id, password }) => {
  const salt = await bcrypt.genSalt(12);
  const hashedPass = await bcrypt.hash(password, salt);

  await updateAdminUserPassword({
    poolCountry,
    admin_id,
    password: hashedPass,
  }).catch((err) => {
    throw err;
  });
};
