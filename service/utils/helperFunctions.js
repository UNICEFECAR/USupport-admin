import bcrypt from "bcryptjs";
import { updateAdminUserPassword } from "#queries/admins";
import fetch from "node-fetch";

const PROVIDER_URL = process.env.PROVIDER_URL;
const PROVIDER_LOCAL_HOST = "http://localhost:3002";

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
    : `${clientData.nickname.slice(0, 1)}.`;
};

export const getYearInMilliseconds = () => {
  const minute = 1000 * 60;
  const hour = minute * 60;
  const day = hour * 24;
  const year = day * 365;

  return year;
};

export const formatSpecializations = (specializations) => {
  if (specializations?.length > 0) {
    return specializations.replace("{", "").replace("}", "").split(",");
  }
};

export const generatePassword = (length) => {
  const letterPattern = /[a-zA-Z0-9]/;
  const passwordPattern = new RegExp(
    "^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}"
  );

  const getRandomByte = () => {
    return Math.floor(Math.random() * 256);
  };

  const tempPassword = () =>
    Array.apply(null, { length: length })
      .map(() => {
        let result, isDone;
        while (!isDone) {
          result = String.fromCharCode(getRandomByte());
          if (letterPattern.test(result)) {
            isDone = true;
            return result;
          }
        }
      })
      .join("");

  let password = tempPassword();
  if (passwordPattern.test(password)) return password;
  else return generatePassword(length);
};

export const removeProvidersCacheRequest = async ({
  providerIds,
  country,
  language,
}) => {
  const response = await fetch(
    `${PROVIDER_URL}/provider/v1/provider/remove-cache`,
    {
      method: "PUT",
      headers: {
        "x-language-alpha-2": language,
        "x-country-alpha-2": country,
        host: PROVIDER_LOCAL_HOST,
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        providerDetailIds: providerIds,
      }),
    }
  ).catch(console.log);

  const result = await response.json();

  if (result.error) {
    throw result.error;
  }

  return result;
};
