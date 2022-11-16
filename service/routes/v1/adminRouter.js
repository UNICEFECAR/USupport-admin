import express from "express";

import { changeAdminUserPassword } from "#controllers/admin";

import { changePasswordSchema } from "#schemas/adminSchemas";
import { securedRoute } from "#middlewares/auth";

const router = express.Router();

router.get("/", securedRoute, async (req, res) => {
  /**
   * #route   GET /admin/v1/admin
   * #desc    Get current admin user
   */
  return res.status(200).send(req.user);
});

router.patch("/password", securedRoute, async (req, res, next) => {
  /**
   * #route   PATCH /admin/v1/admin/password
   * #desc    Update admin user's password
   */
  const country = req.header("x-country-alpha-2");
  const language = req.header("x-language-alpha-2");

  const admin_id = req.user.admin_id;
  const payload = req.body;

  return await changePasswordSchema
    .noUnknown(true)
    .strict(true)
    .validate({ country, language, admin_id, ...payload })
    .then(changeAdminUserPassword)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

export { router };
