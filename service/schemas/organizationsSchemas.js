import * as yup from "yup";

export const createOrganizationSchema = yup.object().shape({
  name: yup.string().required(),
  createdBy: yup.string().uuid().required(),
  country: yup.string().nullable().required(),
  language: yup.string().nullable().required(),
  unitName: yup.string().nullable().notRequired(),
  websiteUrl: yup.string().nullable().notRequired(),
  address: yup.string().nullable().notRequired(),
  location: yup.object().shape({
    latitude: yup.number().nullable().notRequired(),
    longitude: yup.number().nullable().notRequired(),
  }),
  phone: yup.string().nullable().notRequired(),
  email: yup.string().nullable().notRequired(),
  district: yup.string().uuid().nullable().notRequired(),
  description: yup.string().nullable().notRequired(),
  paymentMethods: yup.array().of(yup.string().uuid()).notRequired(),
  userInteractions: yup.array().of(yup.string().uuid()).notRequired(),
  propertyType: yup.array().of(yup.string().uuid()).notRequired(),
  specialisations: yup.array().of(yup.string().uuid()).notRequired(),
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

export const getOrganizationsWithDetailsSchema = yup.object().shape({
  country: yup.string().required(),
  search: yup.string().nullable().notRequired(),
  startDate: yup.string().nullable().notRequired(),
  endDate: yup.string().nullable().notRequired(),
  timeZone: yup.string().nullable().notRequired(),
});

export const editOrganizationSchema = createOrganizationSchema
  .omit(["createdBy"])
  .shape({
    organizationId: yup.string().uuid().required(),
  });

export const organizationCountrySchema = yup.object().shape({
  country: yup.string().required(),
});

export const deleteOrganizationSchema = yup.object().shape({
  country: yup.string().required(),
  organizationId: yup.string().uuid().required(),
  language: yup.string().required(),
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
  timeZone: yup.string().nullable().notRequired(),
});

export const removeProviderFromOrganizationSchema =
  assignProviderToOrganizationSchema.omit(["providerDetailIds"]).shape({
    providerDetailId: yup.string().uuid().required(),
  });

export const organizationMetadataSchema = yup.object().shape({
  country: yup.string().required(),
  type: yup
    .string()
    .oneOf([
      "districts",
      "payment-methods",
      "user-interactions",
      "specialisations",
      "property-types",
      "all",
    ])
    .required(),
});
