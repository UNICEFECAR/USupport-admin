import {
  assignProviderToOrganizationQuery,
  createOrganizationQuery,
  getAllOrganizationsQuery,
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
