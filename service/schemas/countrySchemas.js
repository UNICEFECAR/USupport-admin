import * as yup from "yup";

export const getCountryFaqsSchema = yup.object().shape({
  country: yup.string().required(),
  language: yup.string().required(),
  platform: yup.string().oneOf(["website", "client", "provider"]).required(),
});

export const addCountryFaqsSchema = yup.object().shape({
  country: yup.string().required(),
  language: yup.string().required(),
  platform: yup.string().oneOf(["website", "client", "provider"]).required(),
  id: yup.string().required(),
});

export const deleteCountryFaqsSchema = yup.object().shape({
  country: yup.string().required(),
  language: yup.string().required(),
  platform: yup.string().oneOf(["website", "client", "provider"]).required(),
  id: yup.string().required(),
});

export const getCountrySosCentersSchema = yup.object().shape({
  country: yup.string().required(),
});

export const addCountrySosCentersSchema = yup.object().shape({
  country: yup.string().required(),
  id: yup.string().required(),
});

export const deleteCountrySosCentersSchema = yup.object().shape({
  country: yup.string().required(),
  id: yup.string().required(),
});

export const getCountryArticlesSchema = yup.object().shape({
  country: yup.string().required(),
});

export const addCountryArticlesSchema = yup.object().shape({
  country: yup.string().required(),
  id: yup.string().required(),
});

export const deleteCountryArticlesSchema = yup.object().shape({
  country: yup.string().required(),
  id: yup.string().required(),
});
