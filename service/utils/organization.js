import {
  // createOrganizationWorkWithLinksQuery,
  // getOrganizationWorkWithLinksQuery,
  // deleteOrganizationWorkWithLinksQuery,
  createOrganizationSpecialisationsLinksQuery,
  deleteOrganizationSpecialisationsLinksQuery,
  getOrganizationSpecialisationsLinksQuery,
  createOrganizationUserInteractionQuery,
  deleteOrganizationUserInteractionQuery,
  createOrganizationPaymentMethodQuery,
  deleteOrganizationPaymentMethodQuery,
  createOrganizationPropertyTypeQuery,
  deleteOrganizationPropertyTypeQuery,
  getOrganizationPaymentMethodLinksQuery,
  getOrganizationUserInteractionLinksQuery,
  getOrganizationPropertyTypeLinksQuery,
} from "#queries/organizations";

const LINK_CONFIGS = {
  // workWith: {
  //   createQuery: createOrganizationWorkWithLinksQuery,
  //   getQuery: getOrganizationWorkWithLinksQuery,
  //   deleteQuery: deleteOrganizationWorkWithLinksQuery,
  //   dataKey: "workWithIds",
  //   idField: "organization_work_with_id",
  // },
  specialisations: {
    createQuery: createOrganizationSpecialisationsLinksQuery,
    getQuery: getOrganizationSpecialisationsLinksQuery,
    deleteQuery: deleteOrganizationSpecialisationsLinksQuery,
    dataKey: "specialisationIds",
    idField: "organization_specialisation_id",
  },
  paymentMethods: {
    createQuery: createOrganizationPaymentMethodQuery,
    getQuery: getOrganizationPaymentMethodLinksQuery,
    deleteQuery: deleteOrganizationPaymentMethodQuery,
    dataKey: "paymentMethodIds",
    idField: "payment_method_id",
  },
  userInteractions: {
    createQuery: createOrganizationUserInteractionQuery,
    getQuery: getOrganizationUserInteractionLinksQuery,
    deleteQuery: deleteOrganizationUserInteractionQuery,
    dataKey: "userInteractionIds",
    idField: "user_interaction_id",
  },
  propertyType: {
    createQuery: createOrganizationPropertyTypeQuery,
    getQuery: getOrganizationPropertyTypeLinksQuery,
    deleteQuery: deleteOrganizationPropertyTypeQuery,
    dataKey: "propertyTypeIds",
    idField: "organization_property_type_id",
  },
};

export const createOrganizationLinks = async (
  linkType,
  { country, organizationId, ids }
) => {
  if (!ids || ids.length === 0) {
    return;
  }

  const config = LINK_CONFIGS[linkType];
  if (!config) {
    throw new Error(`Unknown link type: ${linkType}`);
  }

  const queryParams = {
    poolCountry: country,
    organizationId,
    [config.dataKey]: ids,
  };

  await config.createQuery(queryParams);
};

export const updateOrganizationLinks = async (
  linkType,
  { country, organizationId, newIds }
) => {
  if (newIds === undefined) {
    return;
  }

  const config = LINK_CONFIGS[linkType];
  if (!config) {
    throw new Error(`Unknown link type: ${linkType}`);
  }

  const existingLinks = await config.getQuery({
    poolCountry: country,
    organizationId,
  });

  const existingIds = existingLinks.rows.map((link) => link[config.idField]);
  const newIdsArray = newIds || [];

  const idsToAdd = newIdsArray.filter((id) => !existingIds.includes(id));
  const idsToRemove = existingIds.filter((id) => !newIdsArray.includes(id));

  if (idsToAdd.length > 0) {
    await config.createQuery({
      poolCountry: country,
      organizationId,
      [config.dataKey]: idsToAdd,
    });
  }

  if (idsToRemove.length > 0) {
    await config.deleteQuery({
      poolCountry: country,
      organizationId,
      [config.dataKey]: idsToRemove,
    });
  }
};

export const handleOrganizationLinksCreation = async (data, organizationId) => {
  const linkTypes = [
    // "workWith",
    "specialisations",
    "paymentMethods",
    "userInteractions",
    "propertyType",
  ];

  for (const linkType of linkTypes) {
    if (data[linkType] && data[linkType].length > 0) {
      await createOrganizationLinks(linkType, {
        country: data.country,
        organizationId,
        ids: data[linkType],
      });
    }
  }
};

export const handleOrganizationLinksUpdate = async (data, organizationId) => {
  const linkTypes = [
    // "workWith",
    "specialisations",
    "paymentMethods",
    "userInteractions",
    "propertyType",
  ];

  for (const linkType of linkTypes) {
    await updateOrganizationLinks(linkType, {
      country: data.country,
      organizationId,
      newIds: data[linkType],
    });
  }
};
