import bcrypt from "bcryptjs";
import fetch from "node-fetch";
import AWS from "aws-sdk";

import {
  getAdminUserByID,
  checkIfEmailIsUsedQuery,
  updateAdminDataQuery,
  updateAdminDataByIdQuery,
  getAllGlobalAdminsQuery,
  getAllCountryAdminsQuery,
  deleteAdminDataByIdQuery,
  getPlatformAccessLogsQuery,
} from "#queries/admins";

import {
  getScheduledConsultationsWithClientIdForCountryQuery,
  getClientsAndProvidersLoggedIn15DaysQuery,
  getPositivePlatformRatingsFromClientsQuery,
  getPositivePlatformRatingsFromProvidersQuery,
} from "#queries/statistics";

import {
  getAllProviderNamesQuery,
  getAllProvidersQuery,
} from "#queries/providers";

import { formatSpecializations, updatePassword } from "#utils/helperFunctions";
import { emailUsed, adminNotFound, incorrectPassword } from "#utils/errors";

const PROVIDER_LOCAL_HOST = "http://localhost:3002";

const PROVIDER_URL = process.env.PROVIDER_URL;

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION;
const AWS_KZ_CLINICAL_DB_SNAPHOTS_BUCKET_NAME =
  process.env.AWS_KZ_CLINICAL_DB_SNAPHOTS_BUCKET_NAME;
const AWS_KZ_PII_DB_SNAPHOTS_BUCKET_NAME =
  process.env.AWS_KZ_PII_DB_SNAPHOTS_BUCKET_NAME;

//PSKZ envs
const PSKZ_ACCESS_KEY_ID = process.env.PSKZ_ACCESS_KEY_ID;
const PSKZ_SECRET_ACCESS_KEY = process.env.PSKZ_SECRET_ACCESS_KEY;

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

export const getAllProviders = async (props) => {
  const newOffset = props.offset === 1 ? 0 : (props.offset - 1) * props.limit;
  return await getAllProvidersQuery({
    ...props,
    poolCountry: props.country,
    offset: newOffset,
  })
    .then(async (res) => {
      const providers = res.rows;
      for (let i = 0; i < providers.length; i++) {
        const provider = providers[i];
        providers[i].specializations = formatSpecializations(
          provider.specializations
        );
        providers[i].organizations =
          provider.organizations?.map((x) => x.organization_name).join(", ") ||
          "";
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

export const PSKZUploadController = async ({ payload }) => {
  console.log(payload);
  let response = {
    status: "succes",
    message: "Successfully uploaded",
    data: payload,
  };
  try {
    if (
      payload.bucket === AWS_KZ_CLINICAL_DB_SNAPHOTS_BUCKET_NAME ||
      payload.bucket === AWS_KZ_PII_DB_SNAPHOTS_BUCKET_NAME
    ) {
      const sourceS3 = new AWS.S3({
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
        region: AWS_REGION,
      });

      const destinationS3 = new AWS.S3({
        accessKeyId: PSKZ_ACCESS_KEY_ID,
        secretAccessKey: PSKZ_SECRET_ACCESS_KEY,
        endpoint: `archive.pscloud.io`,
      });

      const getObjectParams = {
        Bucket: payload.bucket,
        Key: payload.key,
      };

      // Get the content of the object from the source bucket
      const getObjectResult = await sourceS3
        .getObject(getObjectParams)
        .promise();
      const fileContent = getObjectResult.Body.toString();

      // Store the file in the destination bucket
      const putObjectParams = {
        Bucket: payload.bucket,
        Key: payload.key,
        Body: fileContent,
      };
      await destinationS3.putObject(putObjectParams).promise();
    } else {
      response = {
        status: "error",
        message: "Invalid bucket name",
        data: payload,
      };
    }
  } catch (err) {
    console.log("ERROR", err);
    throw err;
  }

  return response;
};

export const getPlatformMetrics = async ({ country }) => {
  const consultations =
    await getScheduledConsultationsWithClientIdForCountryQuery({
      poolCountry: country,
    }).then((res) => {
      return res.rows;
    });

  const totalConsultations = consultations.length;
  const uniqueClientsConsultations = new Set(
    consultations.map((item) => item.client_detail_id)
  ).size;

  const uniqueClientsThatUsedCoupon = new Set();

  const totalCouponConsultations = consultations.filter((item) => {
    if (item.campaign_id) {
      uniqueClientsThatUsedCoupon.add(item.client_detail_id);
    }
    return !!item.campaign_id;
  }).length;

  const { activeClients, activeProviders } =
    await getClientsAndProvidersLoggedIn15DaysQuery({
      poolCountry: country,
    }).then((res) => {
      if (res.rowCount === 0) {
        return {
          activeClients: 0,
          activeProviders: 0,
        };
      }
      const result = res.rows[0];
      return {
        activeClients: result.clients_no,
        activeProviders: result.providers_no,
      };
    });

  const accessLogs = await getPlatformAccessLogsQuery({
    poolCountry: country,
  }).then((res) => res.rows || []);

  let totalWebsiteAccess = 0;
  let totalClientAccess = 0;
  let totalProviderAccess = 0;

  let uniqueWebsiteAccess = new Set();
  let uniqueClientAccess = new Set();
  let uniqueProviderAccess = new Set();

  accessLogs.map((log) => {
    if (log.platform === "client") {
      totalClientAccess++;

      if (log.user_id) {
        uniqueClientAccess.add(log.user_id);
      } else {
        uniqueClientAccess.add(log.ip_address);
      }
    } else if (log.platform === "provider") {
      totalProviderAccess++;
      if (log.user_id) {
        uniqueProviderAccess.add(log.user_id);
      } else {
        uniqueProviderAccess.add(log.ip_address);
      }
    } else {
      totalWebsiteAccess++;
      uniqueWebsiteAccess.add(log.ip_address);
    }
  });

  const positiveClientRatings =
    await getPositivePlatformRatingsFromClientsQuery({
      poolCountry: country,
    }).then((res) => {
      return res.rows ? res.rows[0].count : 0;
    });

  const positiveProviderRatings =
    await getPositivePlatformRatingsFromProvidersQuery({
      poolCountry: country,
    }).then((res) => {
      return res.rows ? res.rows[0].count : 0;
    });

  return {
    totalConsultations,
    uniqueClientsConsultations,
    activeClients,
    activeProviders,
    totalWebsiteAccess,
    totalClientAccess,
    totalProviderAccess,
    uniqueWebsiteAccess: uniqueWebsiteAccess.size,
    uniqueClientAccess: uniqueClientAccess.size,
    uniqueProviderAccess: uniqueProviderAccess.size,
    uniqueClientsThatUsedCoupon: uniqueClientsThatUsedCoupon.size,
    totalCouponConsultations,
    positiveClientRatings,
    positiveProviderRatings,
  };
};

export const getAllProviderNames = async ({ country }) => {
  return await getAllProviderNamesQuery({
    poolCountry: country,
  })
    .then((res) => {
      return res.rows || [];
    })
    .catch((err) => {
      throw err;
    });
};
