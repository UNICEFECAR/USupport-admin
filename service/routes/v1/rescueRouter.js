import express from "express";

import {
  sendForgotPasswordEmail,
  resetForgotPassword,
} from "#controllers/rescue";

import {
  initForgotPasswordSchema,
  resetForgotPasswordSchema,
} from "#schemas/rescueSchemas";

const router = express.Router();

router.route("/forgot-password-link").post(async (req, res, next) => {
  /**
   * #route   POST /admin/v1/rescue/forgot-password-link
   * #desc    Send forgot password email
   */
  const language = req.header("x-language-alpha-2");
  const { email, role } = req.body;

  return await initForgotPasswordSchema
    .noUnknown(true)
    .strict(true)
    .validate({ language, email, role })
    .then(sendForgotPasswordEmail)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.route("/forgot-password").post(async (req, res, next) => {
  /**
   * #route   POST /admin/v1/rescue/forgot-password
   * #desc    Reset forgot password with token
   */
  const language = req.header("x-language-alpha-2");
  const payload = req.body;

  return await resetForgotPasswordSchema
    .noUnknown(true)
    .strict(true)
    .validate({ ...payload, language })
    .then(resetForgotPassword)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

export { router };
