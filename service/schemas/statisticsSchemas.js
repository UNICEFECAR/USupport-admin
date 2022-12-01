import * as yup from "yup";

export const getCountryStatisticsSchema = yup.object().shape({
  language: yup.string().required(),
  countryId: yup.string().uuid().required(),
});

export const getGlobalStatisticsSchema = yup.object().shape({
  language: yup.string().required(),
});
