import express from "express";

import { createOrganization } from "#controllers/organizations";
import { createOrganizationSchema } from "#schemas/organizationsSchemas";

const router = express.Router();

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

export { router };
