import * as yup from "yup";

export const createOrganizationSchema = yup.object().shape({
  name: yup.string().required(),
  createdBy: yup.string().uuid().required(),
  country: yup.string().required(),
  language: yup.string().required(),
});

export const getAllOrganizationsSchema = yup.object().shape({
  country: yup.string().required(),
});
