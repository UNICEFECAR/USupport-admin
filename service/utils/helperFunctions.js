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

export const generate4DigitCode = () => {
  return Math.floor(Math.random() * 9000 + 1000);
};

export const getClientInitials = (clientData) => {
  return clientData.name && clientData.surname
    ? `${clientData.name.slice(0, 1)}.${clientData.surname.slice(0, 1)}.`
    : clientData.nickname;
};
