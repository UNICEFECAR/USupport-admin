import express from "express";
import passport from "passport";

import {
  issueAccessToken,
  issueRefreshToken,
  logoutAdmin,
  refreshAccessToken,
} from "#controllers/auth";

import {
  deletePasskey,
  generatePasskeyAuthenticationOptions,
  generatePasskeyRegistrationOptions,
  getAvailableMethods,
  getMfaSettings,
  listPasskeys,
  requestEmailOtpForSession,
  updateMfaSettings,
  verifyEmailOtpForSession,
  verifyPasskeyAuthentication,
  verifyPasskeyRegistration,
} from "#controllers/mfa";

import { createMfaSession } from "#utils/mfaSession";

import {
  logoutAdminSchema,
  mfaEmailVerifySchema,
  mfaSessionSchema,
  mfaSettingsSchema,
  passkeyRegisterOptionsSchema,
  passkeyRegisterVerifySchema,
  refreshAccessTokenSchema,
} from "#schemas/authSchemas";
import { securedRoute } from "#middlewares/auth";

const router = express.Router();

const handleCredentialsLogin = async (req, res) => {
  const adminUser = req.user;

  if (adminUser.role !== "country" || !adminUser.mfa_enabled) {
    delete adminUser.password;

    const accessToken = await issueAccessToken({
      admin_id: adminUser.admin_id,
      adminRole: adminUser.role,
    });
    const refreshToken = await issueRefreshToken({
      admin_id: adminUser.admin_id,
    });

    return res.status(200).send({
      mfaRequired: false,
      admin: adminUser,
      token: { ...accessToken, refreshToken },
    });
  }

  const mfaSessionId = await createMfaSession({
    adminId: adminUser.admin_id,
  });
  const availableMethods = await getAvailableMethods(adminUser.admin_id);

  return res.status(200).send({
    mfaRequired: true,
    mfaSessionId,
    availableMethods,
  });
};

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
  "/login/credentials",
  passport.authenticate("login-credentials", { session: false }),
  async (req, res, next) => {
    /**
     * #route   POST /admin/v1/auth/login/credentials
     * #desc    Validate password and start MFA or issue tokens
     */
    try {
      return await handleCredentialsLogin(req, res);
    } catch (error) {
      return next(error);
    }
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

router.get("/mfa/settings", securedRoute, async (req, res, next) => {
  const language = req.header("x-language-alpha-2");

  return getMfaSettings({
    adminId: req.user.admin_id,
    adminRole: req.user.role,
    language,
  })
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.patch("/mfa/settings", securedRoute, async (req, res, next) => {
  const language = req.header("x-language-alpha-2");

  return mfaSettingsSchema
    .noUnknown(true)
    .strict()
    .validate(req.body)
    .then(({ enabled, password }) =>
      updateMfaSettings({
        adminId: req.user.admin_id,
        adminRole: req.user.role,
        enabled,
        password,
        language,
      })
    )
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.post("/mfa/passkey/options", async (req, res, next) => {
  const language = req.header("x-language-alpha-2");

  return mfaSessionSchema
    .noUnknown(true)
    .strict()
    .validate(req.body)
    .then(({ mfaSessionId }) =>
      generatePasskeyAuthenticationOptions({ mfaSessionId, language })
    )
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.post("/mfa/passkey/verify", async (req, res, next) => {
  const language = req.header("x-language-alpha-2");
  const { mfaSessionId, ...assertion } = req.body;

  return mfaSessionSchema
    .noUnknown(false)
    .validate({ mfaSessionId })
    .then(() =>
      verifyPasskeyAuthentication({
        mfaSessionId,
        response: assertion,
        language,
      })
    )
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.post("/mfa/email/request", async (req, res, next) => {
  const language = req.header("x-language-alpha-2");

  return mfaSessionSchema
    .noUnknown(true)
    .strict()
    .validate(req.body)
    .then(({ mfaSessionId }) =>
      requestEmailOtpForSession({ mfaSessionId, language })
    )
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.post("/mfa/email/verify", async (req, res, next) => {
  const language = req.header("x-language-alpha-2");

  return mfaEmailVerifySchema
    .noUnknown(true)
    .strict()
    .validate(req.body)
    .then(({ mfaSessionId, otp }) =>
      verifyEmailOtpForSession({ mfaSessionId, otp, language })
    )
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.post("/mfa/passkey/register/options", securedRoute, async (req, res, next) => {
  return passkeyRegisterOptionsSchema
    .noUnknown(true)
    .strict()
    .validate(req.body || {})
    .then(() =>
      generatePasskeyRegistrationOptions({ adminId: req.user.admin_id })
    )
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.post("/mfa/passkey/register/verify", securedRoute, async (req, res, next) => {
  const language = req.header("x-language-alpha-2");
  const { name, ...attestation } = req.body;

  return passkeyRegisterVerifySchema
    .noUnknown(false)
    .validate(req.body)
    .then(() =>
      verifyPasskeyRegistration({
        adminId: req.user.admin_id,
        response: attestation,
        friendlyName: name,
        language,
      })
    )
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.get("/mfa/passkey/credentials", securedRoute, async (req, res, next) => {
  return listPasskeys(req.user.admin_id)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.delete(
  "/mfa/passkey/credentials/:id",
  securedRoute,
  async (req, res, next) => {
    const language = req.header("x-language-alpha-2");

    return deletePasskey({
      adminId: req.user.admin_id,
      passkeyId: req.params.id,
      language,
    })
      .then((result) => res.status(200).send(result))
      .catch(next);
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
    .validate({ ...payload, language })
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

router.route("/logout").post(securedRoute, async (req, res, next) => {
  /**
   * #route   POST /admin/v1/auth/logout
   * #desc    Logout admin and blacklist JWT token
   */
  const country = req.header("x-country-alpha-2");
  const language = req.header("x-language-alpha-2");
  const admin_id = req.user.admin_id;
  const jwt = req.header("authorization").split(" ")[1];

  return await logoutAdminSchema
    .noUnknown(true)
    .strict(true)
    .validate({ country, language, admin_id, jwt })
    .then(logoutAdmin)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

export { router };
