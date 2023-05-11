import bcrypt from "bcryptjs";
import fetch from "node-fetch";

import {
  getAdminUserByID,
  checkIfEmailIsUsedQuery,
  updateAdminDataQuery,
  updateAdminDataByIdQuery,
  getAllGlobalAdminsQuery,
  getAllCountryAdminsQuery,
  deleteAdminDataByIdQuery,
  updateProviderStatusQuery,
} from "#queries/admins";

import { getAllProvidersQuery } from "#queries/providers";

import { formatSpecializations, updatePassword } from "#utils/helperFunctions";
import {
  emailUsed,
  adminNotFound,
  incorrectPassword,
  providerNotFound,
} from "#utils/errors";

const PROVIDER_LOCAL_HOST = "http://localhost:3002";

const PROVIDER_URL = process.env.PROVIDER_URL;

export const getAdminUser = async ({ language, admin_id }) => {
  return await getAdminUserByID(admin_id)
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

export const getAllAdmins = async ({ type, countryId }) => {
  if (type === "global") {
    return await getAllGlobalAdminsQuery().then((res) => res.rows);
  } else if (type === "country") {
    return await getAllCountryAdminsQuery({ countryId }).then(
      (res) => res.rows
    );
  }
};

export const updateAdminData = async ({
  language,
  admin_id,
  role,
  name,
  surname,
  email,
  currentEmail,
  phone,
  phonePrefix,
}) => {
  // Check if email is changed
  if (email !== currentEmail) {
    // Check if email is already taken
    await checkIfEmailIsUsedQuery({
      email,
      role,
    })
      .then((res) => {
        if (res.rowCount > 0) {
          throw emailUsed(language);
        }
      })
      .catch((err) => {
        throw err;
      });
  }

  return await updateAdminDataQuery({
    admin_id,
    name,
    surname,
    phone,
    phonePrefix,
    email,
  })
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

export const updateAdminDataById = async ({
  language,
  adminId,
  role,
  name,
  surname,
  email,
  phonePrefix,
  phone,
  isActive,
}) => {
  const currentEmail = await getAdminUserByID(adminId)
    .then((res) => {
      if (res.rowCount === 0) {
        throw adminNotFound(language);
      } else {
        return res.rows[0].email;
      }
    })
    .catch((err) => {
      throw err;
    });

  // Check if email is changed
  if (email !== currentEmail) {
    // Check if email is already taken
    await checkIfEmailIsUsedQuery({
      email,
      role,
    })
      .then((res) => {
        if (res.rowCount > 0) {
          throw emailUsed(language);
        }
      })
      .catch((err) => {
        throw err;
      });
  }

  return await updateAdminDataByIdQuery({
    adminId,
    name,
    surname,
    email,
    phonePrefix,
    phone,
    isActive,
  })
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

export const deleteAdminDataById = async ({ language, adminId }) => {
  return await deleteAdminDataByIdQuery({
    adminId,
  })
    .then(async (res) => {
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

export const changeAdminUserPassword = async ({
  language,
  admin_id,
  oldPassword,
  newPassword,
}) => {
  const adminData = await getAdminUser({ language, admin_id });
  const validatePassword = await bcrypt.compare(
    oldPassword,
    adminData.password
  );

  if (!validatePassword) {
    throw incorrectPassword(language);
  }

  await updatePassword({
    admin_id,
    password: newPassword,
  });

  return { success: true };
};

export const getAllProviders = async ({
  country,
  limit,
  offset,
  price,
  status,
  free,
  specialization,
}) => {
  const newOffset = offset === 1 ? 0 : (offset - 1) * limit;

  return await getAllProvidersQuery({
    poolCountry: country,
    limit,
    offset: newOffset,
    price,
    status,
    free,
    specialization,
  })
    .then((res) => {
      const providers = res.rows;
      for (let i = 0; i < providers.length; i++) {
        providers[i].specializations = formatSpecializations(
          providers[i].specializations
        );
      }

      return providers;
    })
    .catch((err) => {
      throw err;
    });
};

export const updateProviderStatus = async ({
  language,
  country,
  providerDetailId,
  status,
}) => {
  const response = await fetch(
    `${PROVIDER_URL}/provider/v1/provider/update-status`,
    {
      method: "PUT",
      headers: {
        host: PROVIDER_LOCAL_HOST,
        "x-language-alpha-2": language,
        "x-country-alpha-2": country,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        providerDetailId,
        status,
      }),
    }
  ).catch((err) => {
    throw err;
  });

  const result = await response.json();

  if (result.error) {
    throw result.error;
  }

  return result;
};
