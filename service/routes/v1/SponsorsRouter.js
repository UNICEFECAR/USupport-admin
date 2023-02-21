import express from "express";

import {
  getAllSponsors,
  createSponsor,
  updateSponsor,
  createCampaignForSponsor,
  getSponsorDataById,
  getCouponsDataForCampaign,
  updateCampaignData,
} from "#controllers/sponsors";

import {
  countrySchema,
  sponsorSchema,
  updateSponsorSchema,
  createCampaignSchema,
  getSponsorDataByIdSchema,
  getCouponsDataForCampaignSchema,
  updateCampaignSchema,
} from "#schemas/sponsorsSchemas";

const router = express.Router();

router
  .route("/")
  .get(async (req, res, next) => {
    const country = req.header("x-country-alpha-2");

    return await countrySchema
      .noUnknown(true)
      .strict(true)
      .validate({ country })
      .then(getAllSponsors)
      .then((result) => res.status(200).send(result))
      .catch(next);
  })
  .post(async (req, res, next) => {
    const country = req.header("x-country-alpha-2");
    const language = req.header("x-language-alpha-2");

    const payload = req.body;

    return await sponsorSchema
      .noUnknown(true)
      .strict(true)
      .validate({ ...payload, country, language })
      .then(createSponsor)
      .then((result) => res.status(200).send(result))
      .catch(next);
  })
  .put(async (req, res, next) => {
    const country = req.header("x-country-alpha-2");
    const language = req.header("x-language-alpha-2");

    const sponsor_id = req.body.sponsorId;

    delete req.body.sponsorId;

    const payload = req.body;

    return await updateSponsorSchema
      .noUnknown(true)
      .strict(true)
      .validate({ ...payload, country, language, sponsor_id })
      .then(updateSponsor)
      .then((result) => res.status(200).send(result))
      .catch(next);
  });

router.route("/by-id").get(async (req, res, next) => {
  const country = req.header("x-country-alpha-2");

  const sponsor_id = req.query.sponsorId;

  return await getSponsorDataByIdSchema
    .noUnknown(true)
    .strict(true)
    .validate({ country, sponsor_id })
    .then(getSponsorDataById)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.route("/create-campaign").post(async (req, res, next) => {
  const country = req.header("x-country-alpha-2");
  const language = req.header("x-language-alpha-2");

  const sponsor_id = req.body.sponsorId;
  delete req.body["sponsorId"];

  const payload = req.body;

  return await createCampaignSchema
    .noUnknown(true)
    .strict(true)
    .validate({ ...payload, country, language, sponsor_id })
    .then(createCampaignForSponsor)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.route("/update-campaign").put(async (req, res, next) => {
  const country = req.header("x-country-alpha-2");
  const language = req.header("x-language-alpha-2");

  const campaign_id = req.body.campaignId;
  delete req.body["campaignId"];

  const payload = req.body;

  return await updateCampaignSchema
    .noUnknown(true)
    .strict(true)
    .validate({ ...payload, country, language, campaign_id })
    .then(updateCampaignData)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.route("/coupons-data").get(async (req, res, next) => {
  const country = req.header("x-country-alpha-2");

  const campaign_id = req.query.campaignId;

  return await getCouponsDataForCampaignSchema
    .noUnknown(true)
    .strict(true)
    .validate({ country, campaign_id })
    .then(getCouponsDataForCampaign)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

export { router };
