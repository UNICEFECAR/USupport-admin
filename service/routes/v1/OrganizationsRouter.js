import express from "express";

import {
  assignProviderToOrganization,
  createOrganization,
  getAllOrganizations,
  getAllOrganizationsWithDetails,
} from "#controllers/organizations";
import {
  assignProviderToOrganizationSchema,
  createOrganizationSchema,
  getAllOrganizationsSchema,
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

export { router };