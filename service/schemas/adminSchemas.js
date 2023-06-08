import * as yup from "yup";

import { PASSWORD_REGEX, ADMIN_ROLES } from "./authSchemas.js";

export const countrySchema = yup.object().shape({
  country: yup.string().required(),
});

export const getAdminByIdSchema = yup.object().shape({
  language: yup.string().required(),
  admin_id: yup.string().uuid().required(),
});

export const changePasswordSchema = getAdminByIdSchema.shape({
  oldPassword: yup.string().required(),
  newPassword: yup.string().matches(PASSWORD_REGEX).required(),
});

export const updateAdminDataSchema = getAdminByIdSchema.shape({
  role: yup.string().oneOf(ADMIN_ROLES).required(),
  name: yup.string().required(),
  surname: yup.string().required(),
  email: yup.string().email().required(),
  phone: yup.string(),
  currentEmail: yup.string().email().required(),
});

export const updateAdminDataByIdSchema = yup.object().shape({
  language: yup.string().required(),
  adminId: yup.string().uuid().required(),
  role: yup.string().oneOf(ADMIN_ROLES).required(),
  name: yup.string().required(),
  surname: yup.string().required(),
  email: yup.string().email().required(),
  phone: yup.string(),
  isActive: yup.boolean().required(),
});

export const deleteAdminDataByIdSchema = yup.object().shape({
  language: yup.string().required(),
  adminId: yup.string().uuid().required(),
});

export const getAllAdminsSchema = yup.object().shape({
  type: yup.string().oneOf(ADMIN_ROLES).required(),
  countryId: yup.string().when("type", {
    is: "country",
    then: yup.string().required(),
  }),
});

export const updateProviderStatusSchema = countrySchema.shape({
  language: yup.string().required(),
  providerDetailId: yup.string().uuid().required(),
  status: yup.string().oneOf(["active", "inactive"]).required(),
});

export const getAllProvidersSchema = countrySchema.shape({
  limit: yup.number().required(),
  offset: yup.number().required(),
  price: yup.number().nullable(true),
  status: yup.string().oneOf(["active", "inactive", "any"]).nullable(true),
  free: yup.boolean().nullable(true),
  specialization: yup
    .string()
    .oneOf(["psychologist", "psychotherapist", "psychiatrist", "any"])
    .nullable(true),
  sort_name: yup.string().oneOf([null, "asc", "desc"]).nullable(true),
  sort_email: yup.string().oneOf([null, "asc", "desc"]).nullable(true),
  sort_consultationPrice: yup
    .string()
    .oneOf([null, "asc", "desc"])
    .nullable(true),
  sort_status: yup.string().oneOf([null, "asc", "desc"]).nullable(true),
  search: yup.string().nullable(true),
});
