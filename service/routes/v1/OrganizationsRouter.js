import express from "express";

import {
  assignProviderToOrganization,
  createOrganization,
  editOrganization,
  getAllOrganizations,
  getAllOrganizationsWithDetails,
  getOrganizationById,
  removeProviderFromOrganization,
  getOrganizationMetadata,
  deleteOrganization,
} from "#controllers/organizations";
import {
  assignProviderToOrganizationSchema,
  createOrganizationSchema,
  editOrganizationSchema,
  getAllOrganizationsSchema,
  getOrganizationByIdSchema,
  removeProviderFromOrganizationSchema,
  organizationCountrySchema,
  deleteOrganizationSchema,
  getOrganizationsWithDetailsSchema,
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

  const { search, startDate, endDate, timeZone } = req.query;

  return await getOrganizationsWithDetailsSchema
    .noUnknown(true)
    .strict(true)
    .validate({
      country,
      search: search || null,
      startDate: startDate || null,
      endDate: endDate || null,
      timeZone: timeZone || null,
    })
    .then(getAllOrganizationsWithDetails)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.get("/metadata", async (req, res, next) => {
  const country = req.header("x-country-alpha-2");

  return await organizationCountrySchema
    .noUnknown(true)
    .strict(true)
    .validate({ country })
    .then(getOrganizationMetadata)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router
  .route("/:organizationId")
  .get(async (req, res, next) => {
    const country = req.header("x-country-alpha-2");
    const language = req.header("x-language-alpha-2");
    const organizationId = req.params.organizationId;

    const {
      startDate,
      endDate,
      startTime,
      endTime,
      weekdays,
      weekends,
      search,
      timeZone,
    } = req.query;

    return await getOrganizationByIdSchema
      .noUnknown(true)
      .strict(true)
      .validate({
        organizationId,
        country,
        language,
        startDate,
        endDate,
        startTime: Number(startTime),
        endTime: Number(endTime),
        weekdays: !!Number(weekdays),
        weekends: !!Number(weekends),
        search: search || "",
        timeZone: timeZone || null,
      })
      .then(getOrganizationById)
      .then((result) => res.status(200).send(result))
      .catch(next);
  })
  .delete(async (req, res, next) => {
    const country = req.header("x-country-alpha-2");
    const language = req.header("x-language-alpha-2");
    const organizationId = req.params.organizationId;

    return await deleteOrganizationSchema
      .noUnknown(true)
      .strict(true)
      .validate({
        organizationId,
        country,
        language,
      })
      .then(deleteOrganization)
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
    .validate({
      country,
      language,
      createdBy,
      ...req.body,
    })
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
