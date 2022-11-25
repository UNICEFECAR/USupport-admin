import express from "express";

import { changeAdminUserPassword, updateAdminData } from "#controllers/admin";

import {
  changePasswordSchema,
  updateAdminDataSchema,
} from "#schemas/adminSchemas";
import { securedRoute } from "#middlewares/auth";

const router = express.Router();

router.get("/", securedRoute, async (req, res) => {
  /**
   * #route   GET /admin/v1/admin
   * #desc    Get current admin user
   */
  return res.status(200).send(req.user);
});

router.put("/", securedRoute, async (req, res, next) => {
  /**
   * #route   PUT /admin/v1/admin
   * #desc    Update current admin data
   */
  const language = req.header("x-language-alpha-2");

  const admin_id = req.user.admin_id;
  const currentEmail = req.user.email;

  const payload = req.body;

  return await updateAdminDataSchema
    .noUnknown(true)
    .strict()
    .validate({ language, admin_id, currentEmail, ...payload })
    .then(updateAdminData)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.patch("/password", securedRoute, async (req, res, next) => {
  /**
   * #route   PATCH /admin/v1/admin/password
   * #desc    Update admin user's password
   */
  const language = req.header("x-language-alpha-2");

  const admin_id = req.user.admin_id;
  const payload = req.body;

  return await changePasswordSchema
    .noUnknown(true)
    .strict(true)
    .validate({ ...payload, language, admin_id })
    .then(changeAdminUserPassword)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

export { router };
