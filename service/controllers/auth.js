import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

import {
  storeRefreshToken,
  getRefreshToken,
  invalidateRefreshToken,
} from "#queries/authTokens";

import { invalidRefreshToken } from "#utils/errors";
import { getYearInMilliseconds } from "#utils/helperFunctions";
import { logoutAdminQuery } from "#queries/admins";

const JWT_KEY = process.env.JWT_KEY;

export const issueAccessToken = async ({ admin_id, adminRole }) => {
  const payload = {
    sub: admin_id,
    adminRole,
    iat: Math.floor(Date.now() / 1000),
    jti: uuidv4(),
  };

  const signedToken = jwt.sign(payload, JWT_KEY, {
    expiresIn: "9999 years",
    issuer: "online.usupport.adminApi",
    audience: "online.usupport.app",
    algorithm: "HS256",
  });

  return {
    token: signedToken,
    expiresIn: new Date(new Date().getTime() + 9999 * getYearInMilliseconds()),
  };
};

export const issueRefreshToken = async ({ admin_id }) => {
  const refreshToken = uuidv4();

  storeRefreshToken(admin_id, refreshToken).catch((err) => {
    throw err;
  });

  return refreshToken;
};

export const refreshAccessToken = async ({ language, refreshToken }) => {
  const refreshTokenData = await getRefreshToken(refreshToken)
    .then((res) => {
      if (res.rowCount === 0) {
        throw invalidRefreshToken(language);
      } else {
        return res.rows[0];
      }
    })
    .catch((err) => {
      throw err;
    });

  const now = new Date().getTime();
  const expiresIn = new Date(refreshTokenData.expires_at).getTime(); // valid for 1 hour

  if (!refreshTokenData || refreshTokenData.used) {
    throw invalidRefreshToken(language);
  } else if (expiresIn < now) {
    await invalidateRefreshToken(refreshToken).catch((err) => {
      throw err;
    });
    throw invalidRefreshToken(language);
  } else {
    await invalidateRefreshToken(refreshToken).catch((err) => {
      throw err;
    });
    const newAccessToken = await issueAccessToken({
      admin_id: refreshTokenData.admin_id,
      adminRole: refreshTokenData.admin_role,
    });
    const newRefreshToken = await issueRefreshToken({
      admin_id: refreshTokenData.admin_id,
    });

    return {
      ...newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
};

export const logoutAdmin = async ({
  country,
  language,
  admin_id,
  jwt: jwtFromHeaders,
}) => {
  const decoded = jwt.decode(jwtFromHeaders);

  const isSameID = decoded.sub === admin_id;

  if (!isSameID) throw incorrectCredentials(language);

  await logoutAdminQuery({
    poolCountry: country,
    token: jwtFromHeaders,
  }).catch((err) => {
    console.log("Error logging out user", err);
    throw err;
  });

  return { success: true };
};
