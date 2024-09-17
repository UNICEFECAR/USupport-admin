import * as yup from "yup";

export const createOrganizationSchema = yup.object().shape({
  name: yup.string().required(),
  createdBy: yup.string().uuid().required(),
  country: yup.string().required(),
  language: yup.string().required(),
});

export const assignProviderToOrganizationSchema = yup.object().shape({
  organizationId: yup.string().uuid().required(),
  providerDetailIds: yup.array().of(yup.string().uuid().required()).required(),
  country: yup.string().required(),
  language: yup.string().required(),
});

export const getAllOrganizationsSchema = yup.object().shape({
  country: yup.string().required(),
});

export const editOrganizationSchema = createOrganizationSchema
  .omit(["createdBy"])
  .shape({
    organizationId: yup.string().uuid().required(),
  });

export const getOrganizationByIdSchema = yup.object().shape({
  country: yup.string().required(),
  language: yup.string().required(),
  organizationId: yup.string().uuid().required(),
  // Filters
  startDate: yup.string().notRequired(),
  endDate: yup.string().notRequired(),
  startTime: yup.number().notRequired(),
  endTime: yup.number().notRequired(),
  weekdays: yup.boolean().notRequired(),
  weekends: yup.boolean().notRequired(),
  search: yup.string().notRequired(),
});

export const removeProviderFromOrganizationSchema =
  assignProviderToOrganizationSchema.omit(["providerDetailIds"]).shape({
    providerDetailId: yup.string().uuid().required(),
  });
