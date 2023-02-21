import * as yup from "yup";

import { PASSWORD_REGEX, ADMIN_ROLES } from "./authSchemas.js";

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
  phonePrefix: yup.string(),
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
  phonePrefix: yup.string(),
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
