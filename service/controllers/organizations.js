import {
  assignProviderToOrganizationQuery,
  createOrganizationQuery,
  getAllOrganizationsQuery,
  getConsultationsForOrganizationsQuery,
} from "#queries/organizations";
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
  const organizations = await getAllOrganizationsQuery(data)
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
      uniqueProviders: consultationsForOrg.providers_count,
      uniqueClients: consultationsForOrg.clients_count,
    };
  });

  return organizationsWithDetails;
};
