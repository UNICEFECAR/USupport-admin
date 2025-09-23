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
import { getClientDemographicsByDetailIds } from "#queries/clients";
import { getClientDetailsByUserIds } from "#queries/user";

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
        endpoint: "archive.pscloud.io",
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

export const getPlatformMetrics = async ({ country, startDate, endDate }) => {
  const allClientDetailIds = new Set();

  const consultations =
    await getScheduledConsultationsWithClientIdForCountryQuery({
      poolCountry: country,
      startDate,
      endDate,
    })
      .then((res) => {
        res.rows.forEach((item) => {
          allClientDetailIds.add(item.client_detail_id);
        });
        return res.rows;
      })
      .catch((err) => {
        console.log("❌ Error getting consultations in", err);
        return [];
      });

  const { activeProviders, activeClientDetailIds } =
    await getClientsAndProvidersLoggedIn15DaysQuery({
      poolCountry: country,
      startDate,
      endDate,
    }).then((res) => {
      if (res.rowCount === 0) {
        return {
          activeClients: 0,
          activeProviders: 0,
        };
      }

      const result = res.rows[0];
      result.client_detail_ids.forEach((id) => {
        allClientDetailIds.add(id);
      });

      return {
        activeClientDetailIds: result.client_detail_ids,
        activeProviders: result.providers_no,
      };
    });

  const accessLogs = await getPlatformAccessLogsQuery({
    poolCountry: country,
    startDate,
    endDate,
  }).then((res) => {
    return res.rows || [];
  });

  // Get client details for user_ids found in access logs
  const uniqueUserIds = [
    ...new Set(accessLogs.map((log) => log.user_id).filter(Boolean)),
  ];

  const clientDetailMap = new Map();

  if (uniqueUserIds.length > 0) {
    const clientDetails = await getClientDetailsByUserIds({
      poolCountry: country,
      userIds: uniqueUserIds,
    }).then((res) => {
      return res.rows || [];
    });

    // Create map for fast lookup
    clientDetails.forEach((row) => {
      clientDetailMap.set(row.user_id, row.client_detail_id);
      allClientDetailIds.add(row.client_detail_id);
    });
  }

  const positiveClientRatings =
    await getPositivePlatformRatingsFromClientsQuery({
      poolCountry: country,
      startDate,
      endDate,
    }).then((res) => {
      if (!res.rowCount) return [];
      res.rows.forEach((item) => {
        allClientDetailIds.add(item.client_detail_id);
      });
      return res.rows;
    });

  const clientDemographics = await getClientDemographicsByDetailIds({
    poolCountry: country,
    clientDetailIds: Array.from(allClientDetailIds),
  }).then((res) => {
    return res.rows || [];
  });

  const demographicsById = new Map(
    clientDemographics.map((d) => [d.client_detail_id, d])
  );

  const positiveProviderRatings =
    await getPositivePlatformRatingsFromProvidersQuery({
      poolCountry: country,
      startDate,
      endDate,
    }).then((res) => {
      return res.rows ? res.rows[0].count : 0;
    });

  const inc = (obj, key) => {
    obj[key] = (obj[key] || 0) + 1;
  };

  let totalWebsiteAccess = 0;
  let totalClientAccess = 0;
  let totalMobileAccess = 0;
  let totalProviderAccess = 0;

  let uniqueWebsiteAccess = new Set();
  let uniqueClientAccess = new Set();
  let uniqueProviderAccess = new Set();
  let uniqueMobileAccess = new Set();

  const totalClientAccessDemographics = {
    count: 0,
    demographics: {
      year_of_birth: {},
      urban_rural: {},
      sex: {},
    },
  };

  const uniqueClientAccessDemographics = {
    clientDetailIds: new Set(),
    count: 0,
    demographics: {
      year_of_birth: {},
      urban_rural: {},
      sex: {},
    },
  };

  const totalMobileAccessDemographics = {
    count: 0,
    demographics: {
      year_of_birth: {},
      urban_rural: {},
      sex: {},
    },
  };

  const uniqueMobileAccessDemographics = {
    clientDetailIds: new Set(),
    count: 0,
    demographics: {
      year_of_birth: {},
      urban_rural: {},
      sex: {},
    },
  };

  // Access Logs computation
  accessLogs.map((log) => {
    let demographics;

    const clientDetailId = clientDetailMap.get(log.user_id);

    if (clientDetailId) {
      demographics = demographicsById.get(clientDetailId);
    }

    if (log.platform === "client") {
      totalClientAccess++;

      if (demographics) {
        const { year_of_birth: yob, urban_rural: ur, sex: s } = demographics;
        totalClientAccessDemographics.count++;
        inc(totalClientAccessDemographics.demographics.year_of_birth, yob);
        inc(totalClientAccessDemographics.demographics.urban_rural, ur);
        inc(totalClientAccessDemographics.demographics.sex, s);

        if (
          !uniqueClientAccessDemographics.clientDetailIds.has(clientDetailId)
        ) {
          uniqueClientAccessDemographics.count++;
          uniqueClientAccessDemographics.clientDetailIds.add(clientDetailId);
          inc(uniqueClientAccessDemographics.demographics.year_of_birth, yob);
          inc(uniqueClientAccessDemographics.demographics.urban_rural, ur);
          inc(uniqueClientAccessDemographics.demographics.sex, s);
        }
      }

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
    } else if (log.platform === "mobile") {
      if (demographics) {
        const { year_of_birth: yob, urban_rural: ur, sex: s } = demographics;
        totalMobileAccessDemographics.count++;
        inc(totalMobileAccessDemographics.demographics.year_of_birth, yob);
        inc(totalMobileAccessDemographics.demographics.urban_rural, ur);
        inc(totalMobileAccessDemographics.demographics.sex, s);

        if (
          !uniqueMobileAccessDemographics.clientDetailIds.has(clientDetailId)
        ) {
          uniqueMobileAccessDemographics.count++;
          uniqueMobileAccessDemographics.clientDetailIds.add(clientDetailId);
          inc(uniqueMobileAccessDemographics.demographics.year_of_birth, yob);
          inc(uniqueMobileAccessDemographics.demographics.urban_rural, ur);
          inc(uniqueMobileAccessDemographics.demographics.sex, s);
        }
      }

      totalMobileAccess++;
      uniqueMobileAccess.add(log.ip_address);
    } else {
      totalWebsiteAccess++;
      uniqueWebsiteAccess.add(log.ip_address);
    }
  });

  const consultationsData = {
    uniqueClientDetailIds: new Set(),
    count: 0,
    demographics: {
      year_of_birth: {},
      urban_rural: {},
      sex: {},
    },
  };

  const uniqueConsultationsData = {
    clientDetailIds: new Set(),
    count: 0,
    demographics: {
      year_of_birth: {},
      urban_rural: {},
      sex: {},
    },
  };

  const totalCouponConsultationsData = {
    uniqueClientDetailIds: new Set(),
    count: 0,
    demographics: {
      year_of_birth: {},
      urban_rural: {},
      sex: {},
    },
  };

  const uniqueCouponConsultationsData = {
    clientDetailIds: new Set(),
    count: 0,
    demographics: {
      year_of_birth: {},
      urban_rural: {},
      sex: {},
    },
  };

  const uniqueClientsThatUsedCoupon = new Set();

  for (let i = 0; i < consultations.length; i++) {
    const c = consultations[i];
    const d = demographicsById.get(c.client_detail_id);
    if (!d || !d.year_of_birth) continue;

    const { year_of_birth: yob, urban_rural: ur, sex: s } = d;

    consultationsData.count++;

    if (!uniqueConsultationsData.clientDetailIds.has(c.client_detail_id)) {
      inc(consultationsData.demographics.year_of_birth, yob);
      inc(consultationsData.demographics.urban_rural, ur);
      inc(consultationsData.demographics.sex, s);
      consultationsData.uniqueClientDetailIds.add(c.client_detail_id);
    }

    if (c.campaign_id) {
      uniqueClientsThatUsedCoupon.add(c.client_detail_id);
      totalCouponConsultationsData.count++;
      if (
        !totalCouponConsultationsData.uniqueClientDetailIds.has(
          c.client_detail_id
        )
      ) {
        inc(totalCouponConsultationsData.demographics.year_of_birth, yob);
        inc(totalCouponConsultationsData.demographics.urban_rural, ur);
        inc(totalCouponConsultationsData.demographics.sex, s);
        totalCouponConsultationsData.uniqueClientDetailIds.add(
          c.client_detail_id
        );
      }

      if (
        !uniqueCouponConsultationsData.clientDetailIds.has(c.client_detail_id)
      ) {
        uniqueCouponConsultationsData.clientDetailIds.add(c.client_detail_id);
        inc(uniqueCouponConsultationsData.demographics.year_of_birth, yob);
        inc(uniqueCouponConsultationsData.demographics.urban_rural, ur);
        inc(uniqueCouponConsultationsData.demographics.sex, s);
        uniqueCouponConsultationsData.count++;
      }
    }
  }

  const activeClientsDemographics = {
    count: 0,
    demographics: {
      year_of_birth: {},
      urban_rural: {},
      sex: {},
    },
  };

  activeClientDetailIds.forEach((id) => {
    const d = demographicsById.get(id);
    if (!d || !d.year_of_birth) return;
    activeClientsDemographics.count++;
    inc(activeClientsDemographics.demographics.year_of_birth, d.year_of_birth);
    inc(activeClientsDemographics.demographics.urban_rural, d.urban_rural);
    inc(activeClientsDemographics.demographics.sex, d.sex);
  });

  const positiveClientRatingsDemographics = {
    count: 0,
    demographics: {
      year_of_birth: {},
      urban_rural: {},
      sex: {},
    },
  };

  positiveClientRatings.forEach((item) => {
    const d = demographicsById.get(item.client_detail_id);
    if (!d || !d.year_of_birth) return;
    positiveClientRatingsDemographics.count++;
    inc(
      positiveClientRatingsDemographics.demographics.year_of_birth,
      d.year_of_birth
    );
    inc(
      positiveClientRatingsDemographics.demographics.urban_rural,
      d.urban_rural
    );
    inc(positiveClientRatingsDemographics.demographics.sex, d.sex);
  });

  const uniqueClientsThatUsedCouponDemographics = {
    clientDetailIds: new Set(),
    count: 0,
    demographics: {
      year_of_birth: {},
      urban_rural: {},
      sex: {},
    },
  };

  uniqueClientsThatUsedCoupon.forEach((id) => {
    const d = demographicsById.get(id);
    if (!d || !d.year_of_birth) return;
    uniqueClientsThatUsedCouponDemographics.count++;
    if (!uniqueClientsThatUsedCouponDemographics.clientDetailIds.has(id)) {
      uniqueClientsThatUsedCouponDemographics.clientDetailIds.add(id);
      inc(
        uniqueClientsThatUsedCouponDemographics.demographics.year_of_birth,
        d.year_of_birth
      );
      inc(
        uniqueClientsThatUsedCouponDemographics.demographics.urban_rural,
        d.urban_rural
      );
      inc(uniqueClientsThatUsedCouponDemographics.demographics.sex, d.sex);
    }
  });

  return {
    totalConsultations: {
      ...consultationsData,
      uniqueCount: consultationsData.uniqueClientDetailIds.size,
    },
    // uniqueClientsConsultations: uniqueConsultationsData,
    totalCouponConsultations: {
      ...totalCouponConsultationsData,
      uniqueCount: totalCouponConsultationsData.uniqueClientDetailIds.size,
    },
    // uniqueClientsThatUsedCoupon: uniqueClientsThatUsedCouponDemographics,
    activeClients: activeClientsDemographics,
    activeProviders,
    totalWebsiteAccess,
    totalClientAccess: totalClientAccessDemographics,
    totalProviderAccess,
    totalMobileAccess: totalMobileAccessDemographics,
    uniqueMobileAccess: uniqueMobileAccessDemographics,
    uniqueWebsiteAccess: uniqueWebsiteAccess.size,
    uniqueClientAccess: uniqueClientAccessDemographics,
    uniqueProviderAccess: uniqueProviderAccess.size,
    positiveClientRatings: positiveClientRatingsDemographics,
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
