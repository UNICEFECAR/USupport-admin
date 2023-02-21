import * as yup from "yup";

export const PLATFORM_TYPES = ["website", "client", "provider"];

export const countrySchema = yup.object().shape({
  country: yup.string().required(),
});

export const countryFAQSchema = countrySchema.shape({
  language: yup.string().required(),
  platform: yup.string().oneOf(PLATFORM_TYPES).required(),
});

export const countryFAQByIDSchema = countryFAQSchema.shape({
  id: yup.string().required(),
});

export const countrySOSCentersByIDSchema = countrySchema.shape({
  id: yup.string().required(),
});

export const countryArticlesByIDSchema = countrySchema.shape({
  id: yup.string().required(),
});

export const updateCountryMinMaxClientAgeSchema = countrySchema.shape({
  language: yup.string().required(),
  minClientAge: yup.number().required(),
  maxClientAge: yup.number().required(),
});
