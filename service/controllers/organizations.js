import {
  createOrganizationQuery,
  getAllOrganizationsQuery,
} from "#queries/organizations";
import { organizationExists } from "#utils/errors";

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

export const getAllOrganizations = async (data) => {
  return await getAllOrganizationsQuery(data)
    .then((res) => {
      return res.rows || [];
    })
    .catch((err) => {
      throw err;
    });
};
