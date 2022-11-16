import { nanoid } from "nanoid";

import { getAdminUserByEmail } from "#queries/admins";
import {
  storeForgotPasswordTokenQuery,
  getForgotPasswordTokenQuery,
  invalidatePasswordResetTokenQuery,
} from "#queries/rescue";

import { updatePassword } from "#utils/helperFunctions";

import { adminNotFound, invalidResetPasswordToken } from "#utils/errors";

export const sendForgotPasswordEmail = async ({ country, language, email }) => {
  const adminUser = await getAdminUserByEmail(country, email)
    .then((raw) => {
      if (raw.rowCount === 0) {
        throw adminNotFound(language);
      } else {
        return raw.rows[0];
      }
    })
    .catch((err) => {
      throw err;
    });

  const forgotPassToken = nanoid(16);

  await storeForgotPasswordTokenQuery({
    poolCountry: country,
    admin_id: adminUser.admin_id,
    forgotPassToken,
  });

  //   TODO: Send email with forgot pass token and don't return it in the request

  return { forgotPassToken };
};

export const resetForgotPassword = async ({
  country,
  language,
  token,
  password,
}) => {
  const tokenData = await getForgotPasswordTokenQuery({
    poolCountry: country,
    forgotPassToken: token,
  })
    .then((raw) => raw.rows[0])
    .catch((err) => {
      throw err;
    });

  const now = new Date().getTime();
  const tokenExpiresIn = new Date(tokenData.expires_at).getTime();

  if (!tokenData || tokenExpiresIn < now || tokenData.used) {
    throw invalidResetPasswordToken(language);
  }

  await updatePassword({
    poolCountry: country,
    admin_id: tokenData.admin_id,
    password,
  });

  await invalidatePasswordResetTokenQuery({ poolCountry: country, token });

  return { success: true };
};
