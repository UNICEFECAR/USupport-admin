import { t } from "#translations/index";

export const platformNotFound = (language) => {
  const error = new Error();
  error.message = t("platform_not_found_error", language);
  error.name = "PLATFORM NOT FOUND";
  error.status = 404;
  return error;
};
