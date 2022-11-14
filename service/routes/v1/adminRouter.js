import express from "express";

import { getAdminUser } from "#controllers/admin";
import { getAdminUserByIdSchema } from "#schemas/adminSchemas";
import { securedRoute } from "#middlewares/auth";

const router = express.Router();

router.get("/", securedRoute, async (req, res, next) => {
  /**
   * #route   GET /admin/v1/admin
   * #desc    Get current admin user
   */
  const country = req.header("x-country-alpha-2");
  const language = req.header("x-language-alpha-2");
  const { admin_id } = req.user;

  return await getAdminUserByIdSchema
    .noUnknown(true)
    .strict(true)
    .validate({ country, language, admin_id })
    .then(getAdminUser)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

export { router };
