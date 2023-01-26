import express from "express";

import {
  getCountryStatistics,
  getGlobalStatistics,
  getSecurityCheck,
  getInformationPortalSuggestions,
  getClientRatings,
  getContactForms,
  getProviderStatistics,
} from "#controllers/statistics";

import {
  getCountryStatisticsSchema,
  getGlobalStatisticsSchema,
  getSecurityCheckSchema,
  getInformationPortalSuggestionsSchema,
  getClientRatingsSchema,
  getContactFormsSchema,
  getProviderStatisticsSchema,
} from "#schemas/statisticsSchemas";

const router = express.Router();

router.route("/global").get(async (req, res, next) => {
  /**
   * #route   GET /admin/v1/statistics/global
   * #desc    Get global statistics
   */
  const language = req.header("x-language-alpha-2");

  return await getGlobalStatisticsSchema
    .noUnknown(true)
    .strict(true)
    .validate({ language })
    .then(getGlobalStatistics)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.route("/country").get(async (req, res, next) => {
  /**
   * #route   GET /admin/v1/country/faqs
   * #desc    Get all faqs for a country
   */
  const language = req.header("x-language-alpha-2");

  const { countryId } = req.query;

  return await getCountryStatisticsSchema
    .noUnknown(true)
    .strict(true)
    .validate({ language, countryId })
    .then(getCountryStatistics)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.route("/security-check").get(async (req, res, next) => {
  /**
   * #route   GET /admin/v1/statistics/security-check
   * #desc    Get security check answers for all consultations that had issues
   */
  const language = req.header("x-language-alpha-2");
  const country = req.header("x-country-alpha-2");

  return await getSecurityCheckSchema
    .noUnknown(true)
    .strict(true)
    .validate({ language, country })
    .then(getSecurityCheck)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.route("/information-portal-suggestions").get(async (req, res, next) => {
  /**
   * #route   GET /admin/v1/statistics/information-portal-suggestions
   * #desc    Get information portal suggestions
   */

  const country = req.header("x-country-alpha-2");
  const language = req.header("x-language-alpha-2");

  return await getInformationPortalSuggestionsSchema
    .noUnknown(true)
    .strict(true)
    .validate({ language, country })
    .then(getInformationPortalSuggestions)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.route("/client-ratings").get(async (req, res, next) => {
  /**
   * #route   GET /admin/v1/statistics/client-ratings
   * #desc    Get information portal suggestions
   */

  const country = req.header("x-country-alpha-2");
  // const language = req.header("x-language-alpha-2");

  return await getClientRatingsSchema
    .noUnknown(true)
    .strict(true)
    .validate({ country })
    .then(getClientRatings)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.route("/contact-forms").get(async (req, res, next) => {
  /**
   * #route   GET /admin/v1/statistics/contact-forms
   * #desc    Get contact forms
   */

  const country = req.header("x-country-alpha-2");
  const language = req.header("x-language-alpha-2");

  return await getContactFormsSchema
    .noUnknown(true)
    .strict(true)
    .validate({ country, language })
    .then(getContactForms)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.route("/provider-activities").get(async (req, res, next) => {
  /**
   * #route   GET /admin/v1/statistics/provider-activities
   * #desc    Get contact forms
   */

  const country = req.header("x-country-alpha-2");
  const language = req.header("x-language-alpha-2");

  const { providerId } = req.query;

  return await getProviderStatisticsSchema
    .noUnknown(true)
    .strict(true)
    .validate({ country, language, providerId })
    .then(getProviderStatistics)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

export { router };
