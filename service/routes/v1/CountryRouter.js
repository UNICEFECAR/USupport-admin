import express from "express";

import {
  getCountryFaqs,
  addCountryFaqs,
  deleteCountryFaqs,
  getCountrySosCenters,
  addCountrySosCenters,
  deleteCountrySosCenters,
  getCountryArticles,
  addCountryArticles,
  deleteCountryArticles,
  getCountryVideos,
  addCountryVideos,
  deleteCountryVideos,
  updateCountryMinMaxClientAge,
  getCountryPodcasts,
  addCountryPodcasts,
  deleteCountryPodcasts,
} from "#controllers/countries";

import {
  countryFAQSchema,
  countryFAQByIDSchema,
  countrySchema,
  countrySOSCentersByIDSchema,
  countryArticlesByIDSchema,
  updateCountryMinMaxClientAgeSchema,
} from "#schemas/countrySchemas";

const router = express.Router();

router
  .route("/faqs")
  .get(async (req, res, next) => {
    /**
     * #route   GET /admin/v1/country/faqs
     * #desc    Get all faqs for a country
     */
    const country = req.header("x-country-alpha-2");
    const language = req.header("x-language-alpha-2");
    const { platform } = req.query;

    return await countryFAQSchema
      .noUnknown(true)
      .strict(true)
      .validate({ country, language, platform })
      .then(getCountryFaqs)
      .then((result) => res.status(200).send(result))
      .catch(next);
  })
  .put(async (req, res, next) => {
    /**
     * #route   PUT /admin/v1/country/faqs
     * #desc    Add an faq to a country
     */
    const country = req.header("x-country-alpha-2");
    const language = req.header("x-language-alpha-2");
    const payload = req.body;

    return await countryFAQByIDSchema
      .noUnknown(true)
      .strict(true)
      .validate({ ...payload, country, language })
      .then(addCountryFaqs)
      .then((result) => res.status(200).send(result))
      .catch(next);
  })
  .delete(async (req, res, next) => {
    /**
     * #route   DELETE /admin/v1/country/faqs
     * #desc    Delete an FAQ from a country
     */
    const country = req.header("x-country-alpha-2");
    const language = req.header("x-language-alpha-2");
    const payload = req.body;

    return await countryFAQByIDSchema
      .noUnknown(true)
      .strict(true)
      .validate({ ...payload, country, language })
      .then(deleteCountryFaqs)
      .then((result) => res.status(200).send(result))
      .catch(next);
  });

router
  .route("/sos-centers")
  .get(async (req, res, next) => {
    /**
     * #route   GET /admin/v1/country/sos-centers
     * #desc    Get all sos centers for a country
     */
    const country = req.header("x-country-alpha-2");

    return await countrySchema
      .noUnknown(true)
      .strict(true)
      .validate({ country })
      .then(getCountrySosCenters)
      .then((result) => res.status(200).send(result))
      .catch(next);
  })
  .put(async (req, res, next) => {
    /**
     * #route   PUT /admin/v1/country/sos-centers
     * #desc    Add given sos center to a country
     */
    const country = req.header("x-country-alpha-2");
    const payload = req.body;

    return await countrySOSCentersByIDSchema
      .noUnknown(true)
      .strict(true)
      .validate({ ...payload, country })
      .then(addCountrySosCenters)
      .then((result) => res.status(200).send(result))
      .catch(next);
  })
  .delete(async (req, res, next) => {
    /**
     * #route   DELETE /admin/v1/country/sos-centers
     * #desc    Delete given sos center from a country
     */
    const country = req.header("x-country-alpha-2");
    const payload = req.body;

    return await countrySOSCentersByIDSchema
      .noUnknown(true)
      .strict(true)
      .validate({ ...payload, country })
      .then(deleteCountrySosCenters)
      .then((result) => res.status(200).send(result))
      .catch(next);
  });

router
  .route("/articles")
  .get(async (req, res, next) => {
    /**
     * #route   GET /admin/v1/country/articles
     * #desc    Get all articles for a country
     */
    const country = req.header("x-country-alpha-2");

    return await countrySchema
      .noUnknown(true)
      .strict(true)
      .validate({ country })
      .then(getCountryArticles)
      .then((result) => res.status(200).send(result))
      .catch(next);
  })
  .put(async (req, res, next) => {
    /**
     * #route   PUT /admin/v1/country/articles
     * #desc    Add given articles to a country
     */
    const country = req.header("x-country-alpha-2");
    const payload = req.body;

    return await countryArticlesByIDSchema
      .noUnknown(true)
      .strict(true)
      .validate({ ...payload, country })
      .then(addCountryArticles)
      .then((result) => res.status(200).send(result))
      .catch(next);
  })
  .delete(async (req, res, next) => {
    /**
     * #route   DELETE /admin/v1/country/articles
     * #desc    Delete given articles to a country
     */
    const country = req.header("x-country-alpha-2");
    const payload = req.body;

    return await countryArticlesByIDSchema
      .noUnknown(true)
      .strict(true)
      .validate({ ...payload, country })
      .then(deleteCountryArticles)
      .then((result) => res.status(200).send(result))
      .catch(next);
  });

router
  .route("/videos")
  .get(async (req, res, next) => {
    /**
     * #route   GET /admin/v1/country/videos
     * #desc    Get all videos for a country
     */
    const country = req.header("x-country-alpha-2");

    return await countrySchema
      .noUnknown(true)
      .strict(true)
      .validate({ country })
      .then(getCountryVideos)
      .then((result) => res.status(200).send(result))
      .catch(next);
  })
  .put(async (req, res, next) => {
    /**
     * #route   PUT /admin/v1/country/videos
     * #desc    Add given video to a country
     */
    const country = req.header("x-country-alpha-2");
    const payload = req.body;

    return await countryArticlesByIDSchema // Reusing the articles schema for videos
      .noUnknown(true)
      .strict(true)
      .validate({ ...payload, country })
      .then(addCountryVideos)
      .then((result) => res.status(200).send(result))
      .catch(next);
  })
  .delete(async (req, res, next) => {
    /**
     * #route   DELETE /admin/v1/country/videos
     * #desc    Delete given video from a country
     */
    const country = req.header("x-country-alpha-2");
    const payload = req.body;

    return await countryArticlesByIDSchema // Reusing the articles schema for videos
      .noUnknown(true)
      .strict(true)
      .validate({ ...payload, country })
      .then(deleteCountryVideos)
      .then((result) => res.status(200).send(result))
      .catch(next);
  });

router
  .route("/podcasts")
  .get(async (req, res, next) => {
    /**
     * #route   GET /admin/v1/country/podcasts
     * #desc    Get all podcasts for a country
     */
    const country = req.header("x-country-alpha-2");

    return await countrySchema
      .noUnknown(true)
      .strict(true)
      .validate({ country })
      .then(getCountryPodcasts)
      .then((result) => res.status(200).send(result))
      .catch(next);
  })
  .put(async (req, res, next) => {
    /**
     * #route   PUT /admin/v1/country/podcasts
     * #desc    Add given podcast to a country
     */
    const country = req.header("x-country-alpha-2");
    const payload = req.body;

    return await countryArticlesByIDSchema // Reusing the articles schema for podcasts
      .noUnknown(true)
      .strict(true)
      .validate({ ...payload, country })
      .then(addCountryPodcasts)
      .then((result) => res.status(200).send(result))
      .catch(next);
  })
  .delete(async (req, res, next) => {
    /**
     * #route   DELETE /admin/v1/country/podcasts
     * #desc    Delete given podcast from a country
     */
    const country = req.header("x-country-alpha-2");
    const payload = req.body;

    return await countryArticlesByIDSchema // Reusing the articles schema for podcasts
      .noUnknown(true)
      .strict(true)
      .validate({ ...payload, country })
      .then(deleteCountryPodcasts)
      .then((result) => res.status(200).send(result))
      .catch(next);
  });

router.put("/min-max-client-age", async (req, res, next) => {
  /**
   * #route   PUT /admin/v1/country/min-max-client-age
   * #desc    Update the country min and max client age
   */

  const country = req.header("x-country-alpha-2");
  const language = req.header("x-language-alpha-2");
  const payload = req.body;

  return await updateCountryMinMaxClientAgeSchema
    .noUnknown(true)
    .strict(true)
    .validate({ ...payload, country, language })
    .then(updateCountryMinMaxClientAge)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

export { router };
