import express from "express";

import {
  getCountryStatistics,
  getGlobalStatistics,
  getSecurityCheck,
  getInformationPortalSuggestions,
  getClientRatings,
  getContactForms,
  getProviderStatistics,
  getProviderPlatformRatings,
  getPlatformSuggestionsForType,
  getSOSCenterClicks,
  getProviderAvailabilityReport,
  getMoodTrackerReport,
  getPlayAndHealVisits,
} from "#controllers/statistics";

import {
  getCountryStatisticsSchema,
  getProviderStatisticsSchema,
  getStatsSchema,
  languageSchema,
  countrySchema,
  getPlatformSuggestionsForTypeSchema,
  getSOSCenterClicksSchema,
  getProviderAvailabilityReportSchema,
  getMoodTrackerReportSchema,
} from "#schemas/statisticsSchemas";

import { securedRoute } from "#middlewares/auth";

const router = express.Router();

router.route("/global").get(async (req, res, next) => {
  /**
   * #route   GET /admin/v1/statistics/global
   * #desc    Get global statistics
   */
  const language = req.header("x-language-alpha-2");

  return await languageSchema
    .noUnknown(true)
    .strict(true)
    .validate({ language })
    .then(getGlobalStatistics)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.route("/country").get(async (req, res, next) => {
  /**
   * #route   GET /admin/v1/statistics/country
   * #desc    Get all statistics for a country
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

  return await getStatsSchema
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

  return await getStatsSchema
    .noUnknown(true)
    .strict(true)
    .validate({ language, country })
    .then(getInformationPortalSuggestions)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.route("/platform-suggestions").get(async (req, res, next) => {
  /**
   * #route   GET /admin/v1/statistics/platform-suggestions
   * #desc    Get platform suggestions
   */

  const country = req.header("x-country-alpha-2");
  const language = req.header("x-language-alpha-2");
  const { type } = req.query;

  return await getPlatformSuggestionsForTypeSchema
    .noUnknown(true)
    .strict(true)
    .validate({ language, country, type })
    .then(getPlatformSuggestionsForType)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.route("/client-ratings").get(async (req, res, next) => {
  /**
   * #route   GET /admin/v1/statistics/client-ratings
   * #desc    Get information portal suggestions
   */
  const country = req.header("x-country-alpha-2");

  return await countrySchema
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

  return await getStatsSchema
    .noUnknown(true)
    .strict(true)
    .validate({ country, language })
    .then(getContactForms)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.route("/mood-tracker-report").get(async (req, res, next) => {
  /**
   * #route   GET /admin/v1/statistics/mood-tracker-report
   * #desc    Get mood tracker aggregated statistics
   */

  const country = req.header("x-country-alpha-2");
  const language = req.header("x-language-alpha-2");
  const { startDate, endDate } = req.query;

  return await getMoodTrackerReportSchema
    .noUnknown(true)
    .strict(true)
    .validate({ country, language, startDate, endDate })
    .then(getMoodTrackerReport)
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

router.get("/provider-ratings", async (req, res, next) => {
  /**
   * #route   GET /admin/v1/statistics/provider-ratings
   * #desc    Get provider ratings
   */

  const country = req.header("x-country-alpha-2");
  const language = req.header("x-language-alpha-2");

  return await getStatsSchema
    .noUnknown(true)
    .strict(true)
    .validate({ country, language })
    .then(getProviderPlatformRatings)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.get("/sos-center-clicks", async (req, res, next) => {
  /**
   * #route   GET /admin/v1/statistics/sos-center-clicks
   * #desc    Get aggregated SOS center click statistics
   */

  const country = req.header("x-country-alpha-2");
  const language = req.header("x-language-alpha-2");

  return await getSOSCenterClicksSchema
    .noUnknown(true)
    .strict(true)
    .validate({ country, language })
    .then(getSOSCenterClicks)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.get(
  "/providers/availability/report",
  securedRoute,
  async (req, res, next) => {
    /**
     * #route   GET /admin/v1/statistics/providers/availabity
     * #desc    Get providers availabity for the next 30 days report and download as CSV
     */

    const country = req.header("x-country-alpha-2");
    const language = req.header("x-language-alpha-2");
    const { startDate, endDate } = req.query;

    return await getProviderAvailabilityReportSchema
      .noUnknown(true)
      .strict(true)
      .validate({ country, language, startDate, endDate })
      .then(getProviderAvailabilityReport)
      .then((result) => {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${result.fileName}"`
        );
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Pragma", "no-cache");

        // Send the CSV data
        res.status(200).send(result.csvData);
      })
      .catch(next);
  }
);

router.get("/playandheal-visits", async (req, res, next) => {
  /**
   * #route   GET /admin/v1/statistics/playandheal-visits
   * #desc    Get country events for Play&Heal visits (web and QR)
   */
  const country = req.header("x-country-alpha-2");
  const language = req.header("x-language-alpha-2");

  return await getStatsSchema
    .noUnknown(true)
    .strict(true)
    .validate({ country, language })
    .then(getPlayAndHealVisits)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

export { router };
