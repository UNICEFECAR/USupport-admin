import * as yup from "yup";

export const createSponsorSchema = yup.object().shape({
  country: yup.string().required(),
  language: yup.string().required(),
  name: yup.string().required(),
  email: yup.string().email().required(),
  phonePrefix: yup.string().notRequired(),
  phone: yup.string().notRequired(),
  image: yup.string().notRequired(),
});

export const updateSponsorSchema = yup.object().shape({
  country: yup.string().required(),
  language: yup.string().required(),
  sponsor_id: yup.string().uuid().required(),
  name: yup.string().required(),
  email: yup.string().email().required(),
  phonePrefix: yup.string().notRequired(),
  phone: yup.string().notRequired(),
  image: yup.string().notRequired(),
});

export const getAllSponsorsSchema = yup.object().shape({
  country: yup.string().required(),
});

export const createCampaignForSponsorSchema = yup.object().shape({
  country: yup.string().required(),
  language: yup.string().required(),
  sponsor_id: yup.string().uuid().required(),
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

export const updateCampaignDataSchema = yup.object().shape({
  country: yup.string().required(),
  campaign_id: yup.string().uuid().required(),
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

export const getSponsorDataByIdSchema = yup.object().shape({
  country: yup.string().required(),
  sponsor_id: yup.string().uuid().required(),
});

export const getCouponsDataForCampaignSchema = yup.object().shape({
  country: yup.string().required(),
  campaign_id: yup.string().uuid().required(),
});
