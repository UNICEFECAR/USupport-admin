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
    const adminUser = req.user;

    const accessToken = await issueAccessToken({
      admin_id: adminUser.admin_id,
      adminRole: adminUser.role,
    });
    const refreshToken = await issueRefreshToken({
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
    const adminUser = req.user;

    const accessToken = await issueAccessToken({
      admin_id: adminUser.admin_id,
      adminRole: adminUser.role,
    });
    const refreshToken = await issueRefreshToken({
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
  const language = req.header("x-language-alpha-2");

  const payload = req.body;

  return await refreshAccessTokenSchema
    .noUnknown(true)
    .strict()
    .validate({ language, ...payload })
    .then(refreshAccessToken)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.post(
  "/2fa",
  passport.authenticate("2fa-request", { session: false }),
  async (req, res) => {
    /**
     * #route   POST /admin/v1/auth/2fa
     * #desc    Request 2fa OTP
     */

    return res.status(200).send(req.user);
  }
);

export { router };
