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

import { getClientDetailsByUserIds } from "#queries/user";

import { getCountryIdByAlpha2CodeQuery } from "#queries/countries";

import {
  getScheduledConsultationsWithClientIdForCountryQuery,
  getClientsAndProvidersLoggedIn15DaysQuery,
  getPositivePlatformRatingsFromClientsQuery,
  getPositivePlatformRatingsFromProvidersQuery,
  getCountryEventsQuery,
} from "#queries/statistics";

import {
  getAllProviderNamesQuery,
  getAllProvidersQuery,
} from "#queries/providers";

import { formatSpecializations, updatePassword } from "#utils/helperFunctions";
import {
  emailUsed,
  adminNotFound,
  incorrectPassword,
  countryNotFound,
} from "#utils/errors";

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

export const getPlatformMetrics = async ({
  country,
  language,
  startDate,
  endDate,
}) => {
  const countryId = await getCountryIdByAlpha2CodeQuery({ country }).then(
    (res) => {
      if (res.rowCount === 0) {
        throw countryNotFound(language);
      }
      return res.rows[0].country_id;
    }
  );
  const countryEvents = await getCountryEventsQuery({
    countryId,
    startDate,
    endDate,
  }).then((res) => {
    return res.rows || [];
  });

  const consultations =
    await getScheduledConsultationsWithClientIdForCountryQuery({
      poolCountry: country,
      startDate,
      endDate,
    })
      .then((res) => {
        return res.rows;
      })
      .catch((err) => {
        console.log("❌ Error getting consultations in", err);
        return [];
      });

  const {
    totalProviders,
    activeProviders,
    activeClientDetailIds,
    clientDemographics,
  } = await getClientsAndProvidersLoggedIn15DaysQuery({
    poolCountry: country,
    startDate,
    endDate,
  })
    .then((res) => {
      if (res.rowCount === 0) {
        return {
          totalProviders: 0,
          activeClients: 0,
          activeProviders: 0,
          clientDemographics: [],
        };
      }
      const result = res.rows[0];
      return {
        activeClientDetailIds: result.active_client_detail_ids,
        activeProviders: result.providers_no,
        totalProviders: result.total_providers_no,
        clientDemographics: result.client_demographics,
      };
    })
    .catch((err) => {
      console.log(
        "❌ Error getting clients and providers logged in 15 days: ",
        err
      );
      return {
        activeClientDetailIds: [],
        activeProviders: 0,
        clientDemographics: [],
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

  const accessLogsClientDetailMap = new Map();

  if (uniqueUserIds.length > 0) {
    const clientDetails = await getClientDetailsByUserIds({
      poolCountry: country,
      userIds: uniqueUserIds,
    })
      .then((res) => {
        return res.rows || [];
      })
      .catch((err) => {
        console.log("❌ Error getting client details in", err);
        return [];
      });

    // Create map for fast lookup
    clientDetails.forEach((row) => {
      accessLogsClientDetailMap.set(row.user_id, row.client_detail_id);
    });
  }

  const positiveClientRatings =
    await getPositivePlatformRatingsFromClientsQuery({
      poolCountry: country,
      startDate,
      endDate,
    }).then((res) => {
      if (!res.rowCount) return [];
      return res.rows;
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
  let totalProviderAccess = 0;

  const createDemographicsObject = () => ({
    count: 0,
    demographics: {
      year_of_birth: {},
      urban_rural: {},
      sex: {},
    },
    clientDetailIds: new Set(),
  });

  const createCounterObject = () => ({
    count: 0,
  });

  const emailRegisterClickCounter = createCounterObject();
  const anonymousRegisterClickCounter = createCounterObject();
  const guestRegisterClickCounter = createCounterObject();
  const mobileEmailRegisterClickCounter = createCounterObject();

  const mobileAnonymousRegisterClickCounter = createCounterObject();
  const mobileGuestRegisterClickCounter = createCounterObject();

  const scheduledConsultationsDemographics = createDemographicsObject();
  const mobileScheduledConsultationsDemographics = createDemographicsObject();

  const scheduleButtonClickDemographics = createDemographicsObject();
  const joinConsultationClickDemographics = createDemographicsObject();
  const mobileScheduleButtonClickDemographics = createDemographicsObject();
  const mobileJoinConsultationClickDemographics = createDemographicsObject();

  const globalVisitCounter = {
    count: 0,
    visitorIds: new Set(),
  };

  const eventMap = new Map([
    ["web_email_register_click", emailRegisterClickCounter],
    ["web_anonymous_register_click", anonymousRegisterClickCounter],
    ["web_guest_register_click", guestRegisterClickCounter],
    ["mobile_email_register_click", mobileEmailRegisterClickCounter],
    ["mobile_anonymous_register_click", mobileAnonymousRegisterClickCounter],
    ["mobile_guest_register_click", mobileGuestRegisterClickCounter],
    ["global_visit", globalVisitCounter],
  ]);

  const eventDemographicsMap = new Map([
    ["web_schedule_button_click", scheduleButtonClickDemographics],
    ["web_join_consultation_click", joinConsultationClickDemographics],
    ["mobile_schedule_button_click", mobileScheduleButtonClickDemographics],
    ["mobile_join_consultation_click", mobileJoinConsultationClickDemographics],
    ["web_consultation_scheduled", scheduledConsultationsDemographics],
    ["mobile_consultation_scheduled", mobileScheduledConsultationsDemographics],
  ]);

  for (const event of countryEvents) {
    const demographicsToUpdate = eventDemographicsMap.get(event.event_type);
    const clientDetails = demographicsById.get(event.client_detail_id);
    if (demographicsToUpdate && clientDetails) {
      const { year_of_birth, urban_rural, sex } = clientDetails;
      const yob = year_of_birth || "missing";
      const ur = urban_rural || "missing";
      const s = sex || "missing";

      demographicsToUpdate.count++;

      inc(demographicsToUpdate.demographics.year_of_birth, yob);
      inc(demographicsToUpdate.demographics.urban_rural, ur);
      inc(demographicsToUpdate.demographics.sex, s);

      demographicsToUpdate.clientDetailIds.add(event.client_detail_id);
    } else {
      const objectToUpdate = eventMap.get(event.event_type);
      if (objectToUpdate) {
        objectToUpdate.count++;
        if (event.visitor_id && objectToUpdate.visitorIds) {
          objectToUpdate.visitorIds?.add(event.visitor_id);
        }
      }
    }
  }

  const clientAccessVisitorIds = new Set();
  const mobileAccessVisitorIds = new Set();
  const providerAccessVisitorIds = new Set();
  const websiteAccessVisitorIds = new Set();

  const totalClientAccessDemographics = createDemographicsObject();
  const uniqueClientAccessDemographics = createDemographicsObject();
  const totalMobileAccessDemographics = createDemographicsObject();
  const uniqueMobileAccessDemographics = createDemographicsObject();

  // Access Logs computation
  accessLogs.map((log) => {
    let demographics;

    const clientDetailId = accessLogsClientDetailMap.get(log.user_id);
    const visitorId = log.visitor_id;

    if (clientDetailId) {
      demographics = demographicsById.get(clientDetailId);
    }

    if (log.platform === "client") {
      clientAccessVisitorIds.add(visitorId);

      if (demographics) {
        const { year_of_birth, urban_rural, sex } = demographics;
        totalClientAccessDemographics.count++;

        const yob = year_of_birth || "missing";
        const ur = urban_rural || "missing";
        const s = sex || "missing";

        if (
          !uniqueClientAccessDemographics.clientDetailIds.has(clientDetailId)
        ) {
          inc(totalClientAccessDemographics.demographics.year_of_birth, yob);
          inc(totalClientAccessDemographics.demographics.urban_rural, ur);
          inc(totalClientAccessDemographics.demographics.sex, s);

          inc(uniqueClientAccessDemographics.demographics.year_of_birth, yob);
          inc(uniqueClientAccessDemographics.demographics.urban_rural, ur);
          inc(uniqueClientAccessDemographics.demographics.sex, s);

          uniqueClientAccessDemographics.count++;
          uniqueClientAccessDemographics.clientDetailIds.add(clientDetailId);
        }
      }
    } else if (log.platform === "provider") {
      totalProviderAccess++;
      providerAccessVisitorIds.add(visitorId);
    } else if (log.platform === "mobile") {
      mobileAccessVisitorIds.add(visitorId);
      totalMobileAccessDemographics.count++;
      if (demographics) {
        const { year_of_birth: yob, urban_rural: ur, sex: s } = demographics;

        if (
          !uniqueMobileAccessDemographics.clientDetailIds.has(clientDetailId)
        ) {
          inc(totalMobileAccessDemographics.demographics.year_of_birth, yob);
          inc(totalMobileAccessDemographics.demographics.urban_rural, ur);
          inc(totalMobileAccessDemographics.demographics.sex, s);

          uniqueMobileAccessDemographics.count++;
          uniqueMobileAccessDemographics.clientDetailIds.add(clientDetailId);
          inc(uniqueMobileAccessDemographics.demographics.year_of_birth, yob);
          inc(uniqueMobileAccessDemographics.demographics.urban_rural, ur);
          inc(uniqueMobileAccessDemographics.demographics.sex, s);
        }
      }
    } else {
      websiteAccessVisitorIds.add(visitorId);
      totalWebsiteAccess++;
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
    mobile: {
      scheduled: 0,
      finished: 0,
      active: 0,
      canceled: 0,
      "late-canceled": 0,
      demographics: {
        year_of_birth: {},
        urban_rural: {},
        sex: {},
      },
    },
    web: {
      scheduled: 0,
      finished: 0,
      active: 0,
      canceled: 0,
      "late-canceled": 0,
      demographics: {
        year_of_birth: {},
        urban_rural: {},
        sex: {},
      },
    },
  };

  const uniqueConsultationsData = createDemographicsObject();

  const totalCouponConsultationsData = {
    uniqueClientDetailIds: new Set(),
    count: 0,
    demographics: {
      year_of_birth: {},
      urban_rural: {},
      sex: {},
    },
  };

  const attendedConsultationsData = createDemographicsObject();

  for (let i = 0; i < consultations.length; i++) {
    const c = consultations[i];
    const d = demographicsById.get(c.client_detail_id);

    consultationsData.count++;

    if (!consultationsData[c.booked_from]) {
      consultationsData[c.booked_from] = {
        count: 0,
        demographics: {
          year_of_birth: {},
          urban_rural: {},
          sex: {},
        },
      };
    }
    consultationsData[c.booked_from][c.status] =
      (consultationsData[c.booked_from][c.status] || 0) + 1;
    consultationsData[c.booked_from].count++;

    if (!d) {
      console.log(
        "❌ No demographics found for client detail id: ",
        c.client_detail_id
      );
      continue;
    }

    const { year_of_birth, urban_rural, sex } = d;
    const yob = year_of_birth || "missing";
    const ur = urban_rural || "missing";
    const s = sex || "missing";

    const hasClientJoined = c.client_join_time || c.client_leave_time;

    if (
      hasClientJoined &&
      !attendedConsultationsData.clientDetailIds.has(c.client_detail_id)
    ) {
      attendedConsultationsData.count++;
      inc(attendedConsultationsData.demographics.year_of_birth, yob);
      inc(attendedConsultationsData.demographics.urban_rural, ur);
      inc(attendedConsultationsData.demographics.sex, s);
      attendedConsultationsData.clientDetailIds.add(c.client_detail_id);
    }

    if (!uniqueConsultationsData.clientDetailIds.has(c.client_detail_id)) {
      // In the web/mobile consultations demographichs we only count the consultations that are scheduled, finished or active
      if (["scheduled", "finished", "active"].includes(c.status)) {
        inc(consultationsData[c.booked_from].demographics.year_of_birth, yob);
        inc(consultationsData[c.booked_from].demographics.urban_rural, ur);
        inc(consultationsData[c.booked_from].demographics.sex, s);
      }

      inc(consultationsData.demographics.year_of_birth, yob);
      inc(consultationsData.demographics.urban_rural, ur);
      inc(consultationsData.demographics.sex, s);
      consultationsData.uniqueClientDetailIds.add(c.client_detail_id);
      uniqueConsultationsData.clientDetailIds.add(c.client_detail_id);
    }

    if (c.campaign_id) {
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
    }
  }

  const allClientsDemographics = {
    count: clientDemographics.length,
    demographics: {
      year_of_birth: {},
      urban_rural: {},
      sex: {},
    },
  };

  clientDemographics.forEach((d) => {
    const { year_of_birth, urban_rural, sex } = d;
    const yob = year_of_birth || "missing";
    const ur = urban_rural || "missing";
    const s = sex || "missing";

    inc(allClientsDemographics.demographics.year_of_birth, yob);
    inc(allClientsDemographics.demographics.urban_rural, ur);
    inc(allClientsDemographics.demographics.sex, s);
  });

  const activeClientsDemographics = createDemographicsObject();

  activeClientDetailIds.forEach((id) => {
    const d = demographicsById.get(id);
    if (!d) return;

    const { year_of_birth, urban_rural, sex } = d;
    const yob = year_of_birth || "missing";
    const ur = urban_rural || "missing";
    const s = sex || "missing";

    activeClientsDemographics.count++;
    inc(activeClientsDemographics.demographics.year_of_birth, yob);
    inc(activeClientsDemographics.demographics.urban_rural, ur);
    inc(activeClientsDemographics.demographics.sex, s);
  });

  const positiveClientRatingsDemographics = createDemographicsObject();

  positiveClientRatings.forEach((item) => {
    const d = demographicsById.get(item.client_detail_id);
    if (!d) return;

    const { year_of_birth, urban_rural, sex } = d;
    const yob = year_of_birth || "missing";
    const ur = urban_rural || "missing";
    const s = sex || "missing";

    positiveClientRatingsDemographics.count++;
    inc(positiveClientRatingsDemographics.demographics.year_of_birth, yob);
    inc(positiveClientRatingsDemographics.demographics.urban_rural, ur);
    inc(positiveClientRatingsDemographics.demographics.sex, s);
  });

  const cancelledConsultations =
    consultationsData.mobile.canceled + consultationsData.web.canceled;
  const lateCancelledConsultations =
    consultationsData.mobile["late-canceled"] +
    consultationsData.web["late-canceled"];

  const mobileScheduledConsultations = {
    count:
      consultationsData.mobile.scheduled +
      consultationsData.mobile.finished +
      consultationsData.mobile.active,
    demographics: consultationsData.mobile.demographics,
  };
  const webScheduledConsultations = {
    count:
      consultationsData.web.scheduled +
      consultationsData.web.active +
      consultationsData.web.finished,
    demographics: consultationsData.web.demographics,
  };
  console.log(consultationsData);
  return {
    globalWebsiteVisits: {
      count: globalVisitCounter.count,
      uniqueCount: globalVisitCounter.visitorIds.size,
    },

    totalConsultations: {
      ...consultationsData,
      // uniqueCount: consultationsData.uniqueClientDetailIds.size,
    },
    cancelledConsultations: cancelledConsultations,
    lateCancelledConsultations: lateCancelledConsultations,
    // uniqueClientsConsultations: uniqueConsultationsData,
    scheduledConsultations: webScheduledConsultations,
    mobileScheduledConsultations: mobileScheduledConsultations,
    // scheduledConsultations: scheduledConsultationsDemographics,
    // mobileScheduledConsultations: mobileScheduledConsultationsDemographics,

    scheduleButtonClick: scheduleButtonClickDemographics,
    mobileScheduleButtonClick: mobileScheduleButtonClickDemographics,
    clientsAttendedConsultations: attendedConsultationsData,

    totalCouponConsultations: {
      ...totalCouponConsultationsData,
      // uniqueCount: totalCouponConsultationsData.uniqueClientDetailIds.size,
    },
    totalProviders,
    activeProviders,

    allClients: allClientsDemographics,
    activeClients: activeClientsDemographics,

    totalWebsiteAccess,
    uniqueWebsiteAccess: websiteAccessVisitorIds.size,

    totalClientAccess: totalClientAccessDemographics,
    uniqueClientAccess: clientAccessVisitorIds.size,

    totalProviderAccess,
    uniqueProviderAccess: providerAccessVisitorIds.size,
    totalMobileAccess: totalMobileAccessDemographics,
    uniqueMobileAccess: mobileAccessVisitorIds.size,

    emailRegisterClick: emailRegisterClickCounter.count,
    mobileEmailRegisterClick: mobileEmailRegisterClickCounter.count,

    anonymousRegisterClick: anonymousRegisterClickCounter.count,
    mobileAnonymousRegisterClick: mobileAnonymousRegisterClickCounter.count,

    guestRegisterClick: guestRegisterClickCounter.count,
    mobileGuestRegisterClick: mobileGuestRegisterClickCounter.count,

    joinConsultationClick: joinConsultationClickDemographics,
    mobileJoinConsultationClick: mobileJoinConsultationClickDemographics,

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
