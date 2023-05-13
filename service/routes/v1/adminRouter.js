import express from "express";

import {
  changeAdminUserPassword,
  updateAdminData,
  getAdminUser,
  updateAdminDataById,
  getAllAdmins,
  deleteAdminDataById,
  getAllProviders,
  updateProviderStatus,
} from "#controllers/admin";

import {
  changePasswordSchema,
  updateAdminDataSchema,
  getAdminByIdSchema,
  updateAdminDataByIdSchema,
  getAllAdminsSchema,
  deleteAdminDataByIdSchema,
  updateProviderStatusSchema,
  getAllProvidersSchema,
} from "#schemas/adminSchemas";

import { securedRoute } from "#middlewares/auth";

const router = express.Router();

router
  .route("/")
  .get(securedRoute, async (req, res) => {
    /**
     * #route   GET /admin/v1/admin
     * #desc    Get current admin user
     */
    return res.status(200).send(req.user);
  })
  .put(securedRoute, async (req, res, next) => {
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
      .validate({ ...payload, language, admin_id, currentEmail })
      .then(updateAdminData)
      .then((result) => res.status(200).send(result))
      .catch(next);
  });

router
  .route("/by-id")
  .get(securedRoute, async (req, res, next) => {
    /**
     * #route   GET /admin/v1/admin/by-id
     * #desc    Get admin by id
     */

    const language = req.header("x-language-alpha-2");
    const admin_id = req.query.adminId;

    return await getAdminByIdSchema
      .noUnknown(true)
      .strict()
      .validate({ language, admin_id })
      .then(getAdminUser)
      .then((result) => res.status(200).send(result))
      .catch(next);
  })
  .put(securedRoute, async (req, res, next) => {
    /**
     * #route   PUT /admin/v1/admin/by-id
     * #desc    Update admin data by id
     */
    const language = req.header("x-language-alpha-2");
    const payload = req.body;

    return await updateAdminDataByIdSchema
      .noUnknown(true)
      .strict()
      .validate({ ...payload, language })
      .then(updateAdminDataById)
      .then((result) => res.status(200).send(result))
      .catch(next);
  })
  .delete(securedRoute, async (req, res, next) => {
    /**
     * #route   DELETE /admin/v1/admin/by-id
     * #desc    Delete admin data by id
     */
    const language = req.header("x-language-alpha-2");
    const payload = req.body;

    return await deleteAdminDataByIdSchema
      .noUnknown(true)
      .strict()
      .validate({ ...payload, language })
      .then(deleteAdminDataById)
      .then((result) => res.status(200).send(result))
      .catch(next);
  });

router.get("/all", securedRoute, async (req, res, next) => {
  /**
   * #route   GET /admin/v1/admin/all
   * #desc    Get all all global admins or country admins for a given country
   */
  const type = req.query.type;
  const countryId = req.query.countryId;

  return await getAllAdminsSchema
    .noUnknown(true)
    .strict()
    .validate({
      type,
      countryId,
    })
    .then(getAllAdmins)
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

router.get("/all-providers", securedRoute, async (req, res, next) => {
  /**
   * #route   GET /admin/v1/admin/all-providers
   * #desc    Get all providers
   */
  const country = req.header("x-country-alpha-2");
  const { limit, offset, price, status, free, specialization } = req.query;

  return await getAllProvidersSchema
    .noUnknown(true)
    .strict(true)
    .validate({
      limit: Number(limit),
      offset: Number(offset),
      country,
      price: price ? Number(price) : 0,
      status: status ? status : "any",
      free: free === "true" ? true : false,
      specialization: specialization ? specialization : "any",
    })
    .then(getAllProviders)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.put("/update-provider-status", securedRoute, async (req, res, next) => {
  /**
   * #route   PUT /admin/v1/admin/update-provider-status
   * #desc    Change provider status
   */

  const language = req.header("x-language-alpha-2");
  const country = req.header("x-country-alpha-2");

  const { status, providerDetailId } = req.body;

  return await updateProviderStatusSchema
    .noUnknown(true)
    .strict(true)
    .validate({ country, language, providerDetailId, status })
    .then(updateProviderStatus)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

export { router };
