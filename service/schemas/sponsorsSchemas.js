import * as yup from "yup";

export const countrySchema = yup.object().shape({
  country: yup.string().required(),
});

export const getSponsorDataByIdSchema = countrySchema.shape({
  sponsor_id: yup.string().uuid().required(),
});

export const getCouponsDataForCampaignSchema = countrySchema.shape({
  campaign_id: yup.string().uuid().required(),
});

export const sponsorSchema = countrySchema.shape({
  language: yup.string().required(),
  name: yup.string().required(),
  email: yup.string().email().required(),
  phonePrefix: yup.string().notRequired(),
  phone: yup.string().notRequired(),
  image: yup.string().notRequired(),
});

export const updateSponsorSchema = sponsorSchema.shape({
  sponsor_id: yup.string().uuid().required(),
});

export const campaignSchema = countrySchema.shape({
  language: yup.string().required(),
  name: yup.string().required(),
  couponCode: yup.string().required(),
  budget: yup.number().required(),
  numberOfCoupons: yup.number().positive().required(),
  maxCouponsPerClient: yup.number().positive().required(),
  startDate: yup.string().required(),
  endDate: yup.string().required(),
  termsAndConditions: yup.string().required(),
  active: yup.boolean().required(),
});

export const createCampaignSchema = campaignSchema.shape({
  sponsor_id: yup.string().uuid().required(),
});

export const updateCampaignSchema = campaignSchema.shape({
  campaign_id: yup.string().uuid().required(),
});

export const getCampaignByIdSchema = countrySchema.shape({
  campaign_id: yup.string().uuid().required(),
  language: yup.string().required(),
});
