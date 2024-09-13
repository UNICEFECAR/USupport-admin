import {
  assignProviderToOrganizationQuery,
  createOrganizationQuery,
  editOrganizationQuery,
  getAllOrganizationsQuery,
  getAllOrganizationsWithDetailsQuery,
  getConsultationsForOrganizationsQuery,
  getOrganizationByIdQuery,
  getProviderConsultationsForOrganizationQuery,
} from "#queries/organizations";
import { getMultipleProvidersDataByIDs } from "#queries/providers";
import {
  organizationExists,
  providerAlreadyAssignedToOrg,
} from "#utils/errors";

export const createOrganization = async (data) => {
  return await createOrganizationQuery(data)
    .then((res) => {
      return res.rows[0];
    })
    .catch((err) => {
      // Check if the error is due to duplicate organization name
      if (err.code === "23505") {
        throw organizationExists(data.language);
      }
      throw err;
    });
};

export const editOrganization = async (data) => {
  return await editOrganizationQuery(data)
    .then((res) => {
      return res.rows[0];
    })
    .catch((err) => {
      throw err;
    });
};

export const assignProviderToOrganization = async (data) => {
  return await assignProviderToOrganizationQuery(data)
    .then((res) => {
      if (res.rows.length === 0) {
        throw providerAlreadyAssignedToOrg(data.language);
      }
      return res.rows[0];
    })
    .catch((err) => {
      throw err;
    });
};

export const getAllOrganizations = async (data) => {
  return await getAllOrganizationsQuery(data)
    .then((res) => {
      return res.rows || [];
    })
    .catch((err) => {
      throw err;
    });
};

export const getAllOrganizationsWithDetails = async (data) => {
  const organizations = await getAllOrganizationsWithDetailsQuery(data)
    .then((res) => {
      return res.rows || [];
    })
    .catch((err) => {
      throw err;
    });

  const ids = organizations.map((org) => org.organization_id);

  const consultations = await getConsultationsForOrganizationsQuery({
    country: data.country,
    organizationIds: ids,
  })
    .then((res) => {
      return res.rows || [];
    })
    .catch((err) => {
      throw err;
    });

  const organizationsWithDetails = organizations.map((org) => {
    const consultationsForOrg = consultations.find(
      (x) => x.organization_id === org.organization_id
    );
    if (!consultationsForOrg) {
      return {
        ...org,
        totalConsultations: 0,
        uniqueProviders: 0,
        uniqueClients: 0,
      };
    }

    return {
      ...org,
      totalConsultations: consultationsForOrg.consultations_count,
      uniqueProviders: org.providers.length,
      uniqueClients: consultationsForOrg.clients_count,
    };
  });

  return organizationsWithDetails;
};

export const getOrganizationById = async (data) => {
  const organization = await getOrganizationByIdQuery(data).then((res) => {
    if (res.rows.length === 0) {
      throw organizationNotFound(data.language);
    }
    return res.rows[0];
  });

  const providerDetailIds = organization.providers.map(
    (x) => x.provider_detail_id
  );

  const providersData = await getMultipleProvidersDataByIDs({
    providerDetailIds,
    poolCountry: data.country,
  }).then((res) => {
    return res.rows;
  });

  const providerConsultationsForOrg =
    await getProviderConsultationsForOrganizationQuery({
      organizationId: organization.organization_id,
      country: data.country,
    }).then((res) => {
      return res.rows;
    });

  for (let i = 0; i < organization.providers.length; i++) {
    const provider = organization.providers[i];

    const dataForProvider = providersData.find(
      (x) => x.provider_detail_id === provider.provider_detail_id
    );

    const consultationsDataForProvider = providerConsultationsForOrg.find(
      (x) => x.provider_detail_id === provider.provider_detail_id
    );

    organization.providers[i] = {
      ...provider,
      ...dataForProvider,
      ...consultationsDataForProvider,
    };
  }

  return organization;
};
