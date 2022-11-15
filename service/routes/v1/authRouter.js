import express from "express";
import passport from "passport";

import {
  issueAccessToken,
  issueRefreshToken,
  refreshAccessToken,
} from "#controllers/auth";

import { refreshAccessTokenSchema } from "#schemas/authSchemas";

const router = express.Router();

router.post(
  "/signup",
  passport.authenticate("signup", { session: false }),
  async (req, res) => {
    /**
     * #route   POST /user/v1/auth/signup
     * #desc    Create a new user and create a JWT session
     */
    const country = req.header("x-country-alpha-2");
    const adminUser = req.user;

    const accessToken = await issueAccessToken({
      admin_id: adminUser.admin_id,
    });
    const refreshToken = await issueRefreshToken({
      country,
      admin_id: adminUser.admin_id,
    });

    const result = {
      admin: adminUser,
      token: { ...accessToken, refreshToken },
    };

    return res.status(200).send(result);
  }
);

router.post(
  "/login",
  passport.authenticate("login", { session: false }),
  async (req, res) => {
    /**
     * #route   POST /admin/v1/auth/login
     * #desc    Login an admin using JWT token
     */
    const country = req.header("x-country-alpha-2");
    const adminUser = req.user;

    const accessToken = await issueAccessToken({
      admin_id: adminUser.admin_id,
    });
    const refreshToken = await issueRefreshToken({
      country,
      admin_id: adminUser.admin_id,
    });

    const result = {
      admin: adminUser,
      token: { ...accessToken, refreshToken },
    };

    return res.status(200).send(result);
  }
);

router.post("/refresh-token", async (req, res, next) => {
  /**
   * #route   POST /admin/v1/auth/refresh-token
   * #desc    Refresh access token
   */
  const country = req.header("x-country-alpha-2");
  const language = req.header("x-language-alpha-2");

  const payload = req.body;

  return await refreshAccessTokenSchema
    .noUnknown(true)
    .strict()
    .validate({ country, language, ...payload })
    .then(refreshAccessToken)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

export { router };
