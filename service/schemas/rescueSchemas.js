import * as yup from "yup";

import { PASSWORD_REGEX, ADMIN_ROLES } from "./authSchemas.js";

export const initForgotPasswordSchema = yup.object().shape({
  language: yup.string().required(),
  email: yup.string().email().required(),
  role: yup.string().oneOf(ADMIN_ROLES).required(),
});

export const resetForgotPasswordSchema = yup.object().shape({
  language: yup.string().required(),
  token: yup.string().required(),
  password: yup.string().matches(PASSWORD_REGEX).required(),
});
