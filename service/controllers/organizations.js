import { createOrganizationQuery } from "#queries/organizations";

export const createOrganization = async (data) => {
  return await createOrganizationQuery(data)
    .then((res) => {
      return res.rows[0];
    })
    .catch((err) => {
      // Check if the error is due to duplicate organization name
      if (err.code === "23505") {
        throw new Error("Organization already exists");
      }
      throw err;
    });
};
