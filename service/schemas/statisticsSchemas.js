import * as yup from "yup";

export const getCountryStatisticsSchema = yup.object().shape({
  language: yup.string().required(),
  countryId: yup.string().uuid().required(),
});

export const getGlobalStatisticsSchema = yup.object().shape({
  language: yup.string().required(),
});

export const getSecurityCheckSchema = yup.object().shape({
  language: yup.string().required(),
  country: yup.string().required(),
});

export const getInformationPortalSuggestionsSchema = yup.object().shape({
  language: yup.string().required(),
  country: yup.string().required(),
});

export const getClientRatingsSchema = yup.object().shape({
  country: yup.string().required(),
});

export const getContactFormsSchema = yup.object().shape({
  language: yup.string().required(),
  country: yup.string().required(),
});

export const getProviderStatisticsSchema = yup.object().shape({
  language: yup.string().required(),
  country: yup.string().required(),
  providerId: yup.string().uuid().required(),
});
