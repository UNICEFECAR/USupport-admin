import bcrypt from "bcryptjs";
import { updateAdminUserPassword } from "#queries/admins";

export const updatePassword = async ({ admin_id, password }) => {
  const salt = await bcrypt.genSalt(12);
  const hashedPass = await bcrypt.hash(password, salt);

  await updateAdminUserPassword({
    admin_id,
    password: hashedPass,
  }).catch((err) => {
    throw err;
  });
};
