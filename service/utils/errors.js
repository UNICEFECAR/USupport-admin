import { t } from "#translations/index";

export const platformNotFound = (language) => {
  const error = new Error();
  error.message = t("platform_not_found_error", language);
  error.name = "PLATFORM NOT FOUND";
  error.status = 404;
  return error;
};

export const adminNotFound = (language) => {
  const error = new Error();
  error.message = t("admin_not_found_error", language);
  error.name = "ADMIN NOT FOUND";
  error.status = 404;
  return error;
};

export const emailUsed = (language) => {
  const error = new Error();
  error.message = t("email_already_used_error", language);
  error.name = "EMAIL ALREADY USED";
  error.status = 409;
  return error;
};

export const incorrectEmail = (language) => {
  const error = new Error();
  error.message = t("incorrect_email_error", language);
  error.name = "INCORRECT EMAIl";
  error.status = 404;
  return error;
};

export const incorrectPassword = (language) => {
  const error = new Error();
  error.message = t("incorrect_password_error", language);
  error.name = "INCORRECT PASSWORD";
  error.status = 404;
  return error;
};

export const notAuthenticated = (language) => {
  const error = new Error();
  error.message = t("not_authenticated_error", language);
  error.name = "NOT AUTHENTICATED";
  error.status = 401;
  return error;
};

export const invalidRefreshToken = (language) => {
  const error = new Error();
  error.message = t("invalid_refresh_token_error", language);
  error.name = "REFRESH TOKEN NOT VALID";
  error.status = 401;
  return error;
};

export const invalidResetPasswordToken = (language) => {
  const error = new Error();
  error.message = t("invalid_reset_password_token_error", language);
  error.name = "INVALID RESET PASSWORD TOKEN";
  error.status = 409;
  return error;
};

export const countryNotFound = (language) => {
  const error = new Error();
  error.message = t("country_not_found_error", language);
  error.name = "COUNTRY NOT FOUND";
  error.status = 404;
  return error;
};

export const accountDeactivated = (language) => {
  const error = new Error();
  error.message = t("account_deactivated_error", language);
  error.name = "ACCOUNT DEACTIVATED";
  error.status = 401;
  return error;
};

export const invalidOTP = (language) => {
  const error = new Error();
  error.message = t("invalid_admin_otp_error", language);
  error.name = "INVALID OTP";
  error.status = 401;
  return error;
};

export const tooManyOTPRequests = (language) => {
  const error = new Error();
  error.message = t("too_many_otp_requests_error", language);
  error.name = "TOO MANY OTP REQUESTS";
  error.status = 429;
  return error;
};

export const sponsorEmailAlreadyExists = (language) => {
  const error = new Error();
  error.message = t("sponsor_email_already_exists_error", language);
  error.name = "SPONSOR EMAIL ALREADY EXISTS";
  error.status = 409;
  return error;
};

export const campaignCodeAlreadyExists = (language) => {
  const error = new Error();
  error.message = t("campaign_code_already_exists_error", language);
  error.name = "CAMPAIGN CODE ALREADY EXISTS";
  error.status = 409;
  return error;
};

export const campaignNotFound = (language) => {
  const error = new Error();
  error.message = t("campaign_not_found_error", language);
  error.name = "CAMPAIGN NOT FOUND";
  error.status = 404;
  return error;
};

export const providerNotFound = (language) => {
  const error = new Error();
  error.message = t("provider_not_found_error", language);
  error.name = "PROVIDER NOT FOUND";
  error.status = 404;
  return error;
};

export const questionCantBeDeleted = (language) => {
  const error = new Error();
  error.message = t("question_cant_be_deleted_error", language);
  error.name = "QUESTION CANT BE DELETED";
  error.status = 409;
  return error;
};

export const questionCantBeActivated = (language) => {
  const error = new Error();
  error.message = t("question_cant_be_activated_error", language);
  error.name = "QUESTION CANT BE ACTIVATED";
  error.status = 400;
  return error;
};
