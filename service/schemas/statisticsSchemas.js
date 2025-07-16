import * as yup from "yup";

export const languageSchema = yup.object().shape({
  language: yup.string().required(),
});

export const countrySchema = yup.object().shape({
  country: yup.string().required(),
});

export const getCountryStatisticsSchema = languageSchema.shape({
  countryId: yup.string().uuid().required(),
});

export const getStatsSchema = languageSchema.concat(countrySchema);

export const getProviderStatisticsSchema = getStatsSchema.shape({
  providerId: yup.string().uuid().required(),
});

export const getPlatformSuggestionsForTypeSchema = getStatsSchema.shape({
  type: yup
    .string()
    .oneOf([
      "information-portal",
      "my-qa",
      "consultations",
      "organizations",
      "mood-tracker",
      "all",
    ]),
});
