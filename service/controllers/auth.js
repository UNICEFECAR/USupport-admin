import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

import {
  storeRefreshToken,
  getRefreshToken,
  invalidateRefreshToken,
} from "#queries/authTokens";

import { invalidRefreshToken } from "#utils/errors";

const JWT_KEY = process.env.JWT_KEY;

export const issueAccessToken = async ({ admin_id, adminRole }) => {
  const payload = {
    sub: admin_id,
    adminRole,
    iat: Math.floor(Date.now() / 1000),
  };

  const signedToken = jwt.sign(payload, JWT_KEY, {
    expiresIn: "30m",
    issuer: "online.usupport.adminApi",
    audience: "online.usupport.app",
    algorithm: "HS256",
  });

  return {
    token: signedToken,
    expiresIn: new Date(new Date().getTime() + 30 * 60000), // 30m expiration
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
