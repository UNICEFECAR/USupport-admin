import bcrypt from "bcryptjs";
import { updateAdminUserPassword } from "#queries/admins";
import fetch from "node-fetch";
import { getAllBaselineAssessmentThresholdsQuery } from "#queries/baselineAssessment";

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

const countriesMap = {
  kz: "kazakhstan",
  pl: "poland",
  ro: "romania",
  am: "armenia",
};

export const getCountryLabelFromAlpha2 = (alpha2) => {
  return countriesMap[alpha2.toLocaleLowerCase()];
};

/**
 *
 * @param {Object} scores {psychological: number, biological: number, social: number}
 * @param {string} country
 * @returns {Object} {psychologicalProfile: string, biologicalProfile: string, socialProfile: string}
 */
export const calculateBaselineAssessmentScore = async (scores, country) => {
  const {
    psychological: psychologicalScore,
    biological: biologicalScore,
    social: socialScore,
  } = scores;

  const baselineAssessmentThresholds =
    await getAllBaselineAssessmentThresholdsQuery(country)
      .then((res) => {
        return res.rows.reduce(
          (acc, threshold) => {
            acc[threshold.factor] = {
              below: threshold.below,
              above: threshold.above,
            };
            return acc;
          },
          { psychological: {}, biological: {}, social: {} }
        );
      })
      .catch((err) => {
        throw err;
      });

  const getScoreProfile = (score, factor) => {
    const thresholds = baselineAssessmentThresholds[factor];
    if (score < thresholds.below) {
      return "low";
    } else if (score >= thresholds.below && score <= thresholds.above) {
      return "moderate";
    } else if (score > thresholds.above) {
      return "high";
    }
  };

  const psychological = getScoreProfile(psychologicalScore, "psychological");
  const biological = getScoreProfile(biologicalScore, "biological");
  const social = getScoreProfile(socialScore, "social");

  return { psychological, biological, social };
};
