import * as yup from "yup";
import { t } from "#translations/index";

export const PASSWORD_REGEX = new RegExp(
  "^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}"
);

export const refreshAccessTokenSchema = yup.object().shape({
  language: yup.string().required(),
  refreshToken: yup.string().uuid().required(),
});

export const adminLoginSchema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().required(),
  role: yup.string().oneOf(["global", "country", "regional"]).required(),
  otp: yup.string().length(4).required(),
});

export const createAdminSchema = (language) =>
  yup.object().shape(
    {
      adminCountryId: yup.string().when("role", {
        is: "country",
        then: yup.string().uuid().required(),
      }),
      adminRegionId: yup.string().when("role", {
        is: "regional",
        then: yup.string().uuid().required(),
      }),
      name: yup.string().required(),
      surname: yup.string().required(),
      phonePrefix: yup.string(),
      phone: yup.string(),
      email: yup.string().email().required(),
      password: yup
        .string()
        .matches(PASSWORD_REGEX)
        .required()
        .label(t("password_validation_error", language)),
      role: yup.string().oneOf(["global", "country", "regional"]).required(),
      isActive: yup.boolean().required(),
    },
    ["adminCountryId", "adminRegionId"]
  );

export const admin2FARequestSchema = yup.object().shape({
  password: yup.string().required(),
  email: yup.string().email().required(),
});
