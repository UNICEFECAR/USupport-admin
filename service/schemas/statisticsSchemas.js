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

export const getMoodTrackerReportSchema = getStatsSchema.shape({
  startDate: yup.string().optional(),
  endDate: yup.string().optional(),
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

export const getSOSCenterClicksSchema = getStatsSchema;

export const getProviderAvailabilityReportSchema = yup.object().shape({
  country: yup.string().required(),
  language: yup.string().required(),
  startDate: yup.string().optional(),
  endDate: yup.string().optional(),
  startHour: yup.number().min(0).max(23).required(),
  endHour: yup.number().min(0).max(23).required(),
  timezone: yup.string().required(),
});
