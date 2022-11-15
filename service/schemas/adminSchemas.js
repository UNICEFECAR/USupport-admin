import * as yup from "yup";

export const getAdminUserByIdSchema = yup.object().shape({
  country: yup.string().required(),
  language: yup.string().required(),
  admin_id: yup.string().uuid().required(),
});
