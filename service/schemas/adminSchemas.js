import * as yup from "yup";

import { PASSWORD_REGEX } from "./authSchemas.js";

export const getAdminUserByIdSchema = yup.object().shape({
  language: yup.string().required(),
  admin_id: yup.string().uuid().required(),
});

export const changePasswordSchema = yup.object().shape({
  language: yup.string().required(),
  admin_id: yup.string().uuid().required(),
  oldPassword: yup.string().required(),
  newPassword: yup.string().matches(PASSWORD_REGEX).required(),
});

export const updateAdminDataSchema = yup.object().shape({
  language: yup.string().required(),
  admin_id: yup.string().uuid().required(),
  name: yup.string().required(),
  surname: yup.string().required(),
  phonePrefix: yup.string(),
  phone: yup.string(),
  email: yup.string().email().required(),
  currentEmail: yup.string().email().required(),
});
