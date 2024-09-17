import { getMultipleClientsDataByIDs } from "#queries/clients";
import {
  assignProviderToOrganizationQuery,
  createOrganizationQuery,
  editOrganizationQuery,
  getAllOrganizationsQuery,
  getAllOrganizationsWithDetailsQuery,
  getConsultationsForOrganizationsQuery,
  getOrganizationByIdQuery,
  getProviderConsultationsForOrganizationQuery,
  removeProviderFromOrganizationQuery,
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
      startDate: data.startDate,
      endDate: data.endDate,
      startTime: data.startTime,
      endTime: data.endTime,
      weekdays: data.weekdays,
      weekends: data.weekends,
    }).then((res) => {
      return res.rows;
    });

  const allClientIds = Array.from(
    new Set(
      providerConsultationsForOrg.reduce((acc, x) => {
        if (x.consultations) {
          const ids = x.consultations.map((y) => y.client_detail_id);
          acc.push(...ids);
        }
        return acc;
      }, [])
    )
  );

  const allClients = await getMultipleClientsDataByIDs({
    poolCountry: data.country,
    clientDetailIds: allClientIds,
  })
    .then((res) => {
      return res.rows || [];
    })
    .catch((err) => {
      throw err;
    });

  for (let i = 0; i < organization.providers.length; i++) {
    const provider = organization.providers[i];

    const dataForProvider = providersData.find(
      (x) => x.provider_detail_id === provider.provider_detail_id
    );

    const consultationsDataForProvider = providerConsultationsForOrg.find(
      (x) => x.provider_detail_id === provider.provider_detail_id
    ) || {
      consultations_count: 0,
      clients_count: 0,
      consultations: [],
    };

    consultationsDataForProvider.consultations =
      consultationsDataForProvider.consultations.map((x) => {
        const consultationClient = allClients.find(
          (y) => y.client_detail_id === x.client_detail_id
        );
        return {
          ...x,
          clientName: `${consultationClient.name || ""} ${
            consultationClient.surname || ""
          }`,
        };
      });

    organization.providers[i] = {
      ...provider,
      ...dataForProvider,
      ...consultationsDataForProvider,
    };
  }

  return organization;
};

export const removeProviderFromOrganization = async (data) => {
  return await removeProviderFromOrganizationQuery(data)
    .then((res) => {
      return res.rows[0];
    })
    .catch((err) => {
      throw err;
    });
};
