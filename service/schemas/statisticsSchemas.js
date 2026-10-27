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

export const getVisitEventsSchema = getStatsSchema.shape({
  startDate: yup
    .string()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: yup
    .string()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

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

export const getConsultationProblemReportsSchema = getStatsSchema.shape({
  adminId: yup.string().uuid().required(),
  page: yup.number().integer().min(1).max(100000).required(),
  reporterType: yup.string().oneOf(["client", "provider"]),
  source: yup.string().oneOf(["web", "ios_app", "android_app", "unknown"]),
  from: yup.string().matches(/^\d{4}-\d{2}-\d{2}$/),
  to: yup.string().matches(/^\d{4}-\d{2}-\d{2}$/),
});

export const getConsultationProblemReportSchema = getStatsSchema.shape({
  adminId: yup.string().uuid().required(),
  reportId: yup.string().uuid().required(),
});
