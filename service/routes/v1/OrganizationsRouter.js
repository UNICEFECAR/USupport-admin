import express from "express";

import {
  assignProviderToOrganization,
  createOrganization,
  editOrganization,
  getAllOrganizations,
  getAllOrganizationsWithDetails,
  getOrganizationById,
  removeProviderFromOrganization,
} from "#controllers/organizations";
import {
  assignProviderToOrganizationSchema,
  createOrganizationSchema,
  editOrganizationSchema,
  getAllOrganizationsSchema,
  getOrganizationByIdSchema,
  removeProviderFromOrganizationSchema,
} from "#schemas/organizationsSchemas";

const router = express.Router();

router.get("/all", async (req, res, next) => {
  const country = req.header("x-country-alpha-2");

  return await getAllOrganizationsSchema
    .noUnknown(true)
    .strict(true)
    .validate({ country })
    .then(getAllOrganizations)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.get("/all/details", async (req, res, next) => {
  const country = req.header("x-country-alpha-2");

  return await getAllOrganizationsSchema
    .noUnknown(true)
    .strict(true)
    .validate({ country })
    .then(getAllOrganizationsWithDetails)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.get("/:organizationId", async (req, res, next) => {
  const country = req.header("x-country-alpha-2");
  const language = req.header("x-language-alpha-2");
  const organizationId = req.params.organizationId;

  return await getOrganizationByIdSchema
    .noUnknown(true)
    .strict(true)
    .validate({ organizationId, country, language })
    .then(getOrganizationById)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.post("/", async (req, res, next) => {
  const country = req.header("x-country-alpha-2");
  const language = req.header("x-language-alpha-2");
  const createdBy = req.header("x-admin-id");

  return await createOrganizationSchema
    .noUnknown(true)
    .strict(true)
    .validate({ name: req.body.name, country, language, createdBy })
    .then(createOrganization)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.put("/", async (req, res, next) => {
  const country = req.header("x-country-alpha-2");
  const language = req.header("x-language-alpha-2");

  return await editOrganizationSchema
    .noUnknown(true)
    .strict(true)
    .validate({ ...req.body, language, country })
    .then(editOrganization)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.post("/assign-provider", async (req, res, next) => {
  const country = req.header("x-country-alpha-2");
  const language = req.header("x-language-alpha-2");

  return await assignProviderToOrganizationSchema
    .noUnknown(true)
    .strict(true)
    .validate({ ...req.body, country, language })
    .then(assignProviderToOrganization)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.put("/remove-provider", async (req, res, next) => {
  const country = req.header("x-country-alpha-2");
  const language = req.header("x-language-alpha-2");

  return await removeProviderFromOrganizationSchema
    .noUnknown(true)
    .strict(true)
    .validate({ ...req.body, country, language })
    .then(removeProviderFromOrganization)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

export { router };
