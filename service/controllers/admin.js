import { getAdminUserByID } from "#queries/admins";

import { adminNotFound } from "#utils/errors";

export const getAdminUser = async ({ country, language, admin_id }) => {
  return await getAdminUserByID({ country, admin_id })
    .then((res) => {
      if (res.rowCount === 0) {
        throw adminNotFound(language);
      } else {
        return res.rows[0];
      }
    })
    .catch((err) => {
      throw err;
    });
};
