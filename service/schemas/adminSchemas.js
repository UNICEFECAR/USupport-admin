import * as yup from "yup";

import { PASSWORD_REGEX } from "./authSchemas.js";

export const getAdminUserByIdSchema = yup.object().shape({
  country: yup.string().required(),
  language: yup.string().required(),
  admin_id: yup.string().uuid().required(),
});

export const changePasswordSchema = yup.object().shape({
  country: yup.string().required(),
  language: yup.string().required(),
  admin_id: yup.string().uuid().required(),
  oldPassword: yup.string().required(),
  newPassword: yup.string().matches(PASSWORD_REGEX).required(),
});
