import * as yup from "yup";

export const getCountryStatisticsSchema = yup.object().shape({
  language: yup.string().required(),
  countryId: yup.string().uuid().required(),
});

export const getStatsSchema = yup.object().shape({
  language: yup.string().nullable().required(),
  country: yup.string().nullable().required(),
});

export const getProviderStatisticsSchema = getStatsSchema.shape({
  providerId: yup.string().uuid().required(),
});
