import { nanoid } from "nanoid";

import { getAdminUserByEmail } from "#queries/admins";
import {
  storeForgotPasswordTokenQuery,
  getForgotPasswordTokenQuery,
  invalidatePasswordResetTokenQuery,
} from "#queries/rescue";

import { updatePassword } from "#utils/helperFunctions";
import { produceRaiseNotification } from "#utils/kafkaProducers";

import { invalidResetPasswordToken } from "#utils/errors";

export const sendForgotPasswordEmail = async ({ language, email, role }) => {
  const adminUser = await getAdminUserByEmail(email, role)
    .then((raw) => {
      if (raw.rowCount === 0) {
        return null;
      } else {
        return raw.rows[0];
      }
    })
    .catch((err) => {
      throw err;
    });

  if (!adminUser) return { success: true };

  const forgotPasswordToken = nanoid(16);

  await storeForgotPasswordTokenQuery({
    admin_id: adminUser.admin_id,
    forgotPassToken: forgotPasswordToken,
  });

  produceRaiseNotification({
    channels: ["email"],
    emailArgs: {
      emailType: "forgotPassword",
      recipientEmail: adminUser.email,
      data: {
        forgotPasswordToken,
        platform: `${adminUser.role}-admin`,
      },
    },
    language,
  }).catch(console.log);

  return { success: true };
};

export const resetForgotPassword = async ({ language, token, password }) => {
  const tokenData = await getForgotPasswordTokenQuery({
    forgotPassToken: token,
  })
    .then((raw) => raw.rows[0])
    .catch((err) => {
      throw err;
    });

  const now = new Date().getTime();
  const tokenExpiresIn = new Date(tokenData?.expires_at).getTime();

  if (!tokenData || tokenExpiresIn < now || tokenData.used) {
    throw invalidResetPasswordToken(language);
  }

  await updatePassword({
    admin_id: tokenData.admin_id,
    password,
  });

  await invalidatePasswordResetTokenQuery({ token });

  return { success: true };
};
