import {
  getClientsNoForCountryQuery,
  getProvidersNoForCountryQuery,
  getPublishedArticlesNoForCountryQuery,
  getScheduledConsultationsNoForCountryQuery,
  getSecurityCheckAnswersQuery,
  getInformationPortalSuggestionsQuery,
  getClientRatingsQuery,
  getContactFormsQuery,
  getProviderStatisticsQuery,
  getProviderPlatformRatingsQuery,
  getPlatformSuggestionsForTypeQuery,
  getSOSCenterClicksQuery,
} from "#queries/statistics";

import {
  getAllActiveCountries,
  getCountryAlpha2CodeByIdQuery,
} from "#queries/countries";

import {
  getClientDataById,
  getMultipleClientsDataByIDs,
} from "#queries/clients";

import { getProviderDataById } from "#queries/providers";
import { getCampaignNamesByIds } from "#queries/sponsors";

import { getOrganizationsByIdsQuery } from "#queries/organizations";

import { countryNotFound } from "#utils/errors";
import { getClientInitials } from "#utils/helperFunctions";

export const getCountryStatistics = async ({ language, countryId }) => {
  const country = await getCountryAlpha2CodeByIdQuery({ countryId }).then(
    (result) => {
      if (result.rows.length === 0) {
        throw countryNotFound(language);
      }
      return result.rows[0].alpha2;
    }
  );

  const clientsNo = await getClientsNoForCountryQuery({
    poolCountry: country,
  })
    .then((result) => result.rows[0].clients_no)
    .catch((error) => {
      throw error;
    });

  const providersNo = await getProvidersNoForCountryQuery({
    poolCountry: country,
  })
    .then((result) => result.rows[0].providers_no)
    .catch((error) => {
      throw error;
    });

  const publishedArticlesNo = await getPublishedArticlesNoForCountryQuery({
    countryId,
  })
    .then((result) => result.rows[0].article_ids?.length)
    .catch((error) => {
      throw error;
    });

  const scheduledConsultationsNo =
    await getScheduledConsultationsNoForCountryQuery({
      poolCountry: country,
    })
      .then((result) => result.rows[0].consultations_no)
      .catch((error) => {
        throw error;
      });

  return {
    clientsNo,
    providersNo,
    publishedArticlesNo,
    scheduledConsultationsNo,
  };
};

export const getGlobalStatistics = async ({ language }) => {
  const activeCountries = await getAllActiveCountries().then((result) =>
    result.rows.map((country) => {
      return { alpha2: country.alpha2, countryId: country.country_id };
    })
  );

  let globalStatistics = {
    clientsNo: 0,
    providersNo: 0,
    publishedArticlesNo: 0,
    scheduledConsultationsNo: 0,
  };

  for (let i = 0; i < activeCountries.length; i++) {
    const country = activeCountries[i];
    const currentCountryStatistics = await getCountryStatistics({
      language,
      countryId: country.countryId,
    });

    globalStatistics.clientsNo += Number(currentCountryStatistics.clientsNo);
    globalStatistics.providersNo += Number(
      currentCountryStatistics.providersNo
    );
    globalStatistics.publishedArticlesNo += Number(
      currentCountryStatistics.publishedArticlesNo
    );
    globalStatistics.scheduledConsultationsNo += Number(
      currentCountryStatistics.scheduledConsultationsNo
    );
  }

  return globalStatistics;
};

export const getSecurityCheck = async ({ country }) => {
  const securityChecks = await getSecurityCheckAnswersQuery({
    poolCountry: country,
  })
    .then((res) => {
      if (res.rowCount === 0) {
        return [];
      } else {
        return res.rows;
      }
    })
    .catch((err) => {
      throw err;
    });

  const getIssueNumber = (answers) => {
    let counter = 0;
    if (answers?.provider_attend === false) {
      counter++;
    }
    if (answers.contacts_disclosure === true) {
      counter++;
    }
    if (answers.suggest_outside_meeting === true) {
      counter++;
    }
    if (answers.identity_coercion === true) {
      counter++;
    }
    if (answers.unsafe_feeling === true) {
      counter++;
    }
    if (
      answers.feeling === "very_dissatisfied" ||
      answers.feeling === "dissatisfied" ||
      answers.feeling === "neutral"
    ) {
      counter++;
    }
    if (answers.addressed_needs < 6) {
      counter++;
    }
    if (answers.improve_wellbeing < 6) {
      counter++;
    }
    if (answers.feelings_now < 6) {
      counter++;
    }

    return counter;
  };

  const providerDetailsCache = {};
  const clientDetailsCache = {};
  for (let i = 0; i < securityChecks.length; i++) {
    const securityCheck = securityChecks[i];
    const providerId = securityCheck.provider_detail_id;
    const clientId = securityCheck.client_detail_id;

    if (providerDetailsCache[providerId]) {
      securityChecks[i].providerData = providerDetailsCache[providerId];
    } else {
      const providerData = await getProviderDataById({
        providerId,
        poolCountry: country,
      })
        .then((res) => {
          if (res.rowCount === 0) {
            return [];
          } else {
            return res.rows[0];
          }
        })
        .catch((err) => {
          throw err;
        });

      providerDetailsCache[providerId] = providerData;
      securityChecks[i].providerData = providerData;
    }

    securityChecks[i].numberOfIssues = getIssueNumber(securityCheck);

    if (clientDetailsCache[clientId]) {
      const clientData = clientDetailsCache[clientId];
      securityChecks[i].clientName = getClientInitials(clientData);
    } else {
      const clientData = await getClientDataById({
        clientId,
        poolCountry: country,
      })
        .then((res) => {
          if (res.rowCount === 0) {
            return [];
          } else {
            return res.rows[0];
          }
        })
        .catch((err) => {
          throw err;
        });
      clientDetailsCache[clientId] = clientData;
      securityChecks[i].clientName = getClientInitials(clientData);
    }
  }

  return securityChecks;
};

export const getInformationPortalSuggestions = async ({ country }) => {
  const suggestions = await getInformationPortalSuggestionsQuery({
    poolCountry: country,
  })
    .then((res) => {
      if (res.rowCount === 0) {
        return [];
      } else {
        return res.rows;
      }
    })
    .catch((err) => {
      throw err;
    });

  return suggestions;
};

export const getClientRatings = async ({ country }) => {
  const clientRatings = await getClientRatingsQuery({
    poolCountry: country,
  })
    .then((res) => {
      if (res.rowCount === 0) {
        return [];
      } else {
        return res.rows;
      }
    })
    .catch((err) => {
      throw err;
    });

  return clientRatings;
};

export const getContactForms = async ({ country }) => {
  return await getContactFormsQuery({
    poolCountry: country,
  })
    .then((res) => {
      if (res.rowCount === 0) {
        return [];
      } else {
        return res.rows;
      }
    })
    .catch((err) => {
      throw err;
    });
};

export const getProviderStatistics = async ({ country, providerId }) => {
  const consultations = await getProviderStatisticsQuery({
    poolCountry: country,
    providerId,
  })
    .then((res) => {
      if (res.rowCount === 0) {
        return [];
      } else {
        return res.rows;
      }
    })
    .catch((err) => {
      throw err;
    });

  // Make sure that there are no duplicate client id's
  const clientDetailIds = Array.from(
    new Set(consultations.map((x) => x.client_detail_id))
  );

  const clientDetails = await getMultipleClientsDataByIDs({
    poolCountry: country,
    clientDetailIds,
  })
    .then((res) => {
      if (res.rowCount === 0) {
        return [];
      } else {
        return res.rows;
      }
    })
    .catch((err) => {
      throw err;
    });

  const campaignIds = Array.from(
    new Set(consultations.map((x) => x.campaign_id))
  );

  const campaignNames = await getCampaignNamesByIds({
    poolCountry: country,
    campaignIds,
  })
    .then((res) => {
      if (res.rowCount === 0) {
        return [];
      } else {
        return res.rows;
      }
    })
    .catch((err) => {
      throw err;
    });

  const organizations = await getOrganizationsByIdsQuery({
    organizationIds: Array.from(
      new Set(consultations.map((x) => x.organization_id))
    ),
    country,
  })
    .then((res) => {
      return res.rows || [];
    })
    .catch((err) => {
      throw err;
    });

  consultations.forEach((consultation, index) => {
    const clientData = clientDetails.find(
      (x) => x.client_detail_id === consultation.client_detail_id
    );

    const campaignName = campaignNames.find(
      (x) => x.campaign_id === consultation.campaign_id
    )?.name;

    const organizationName = organizations.find(
      (x) => x.organization_id === consultation.organization_id
    )?.name;

    consultations[index].clientName = getClientInitials(clientData);
    consultations[index].campaign_name = campaignName;
    consultations[index].organization_name = organizationName;
  });

  return consultations;
};

export const getProviderPlatformRatings = async ({ country }) => {
  return await getProviderPlatformRatingsQuery({
    poolCountry: country,
  })
    .then((res) => {
      if (res.rowCount === 0) {
        return [];
      } else {
        return res.rows;
      }
    })
    .catch((err) => {
      throw err;
    });
};

export const getPlatformSuggestionsForType = async ({
  country,
  language,
  type,
}) => {
  const poolCountry = country;

  const platformSuggestions = await getPlatformSuggestionsForTypeQuery({
    poolCountry,
    type,
  }).then((result) => {
    if (result.rows.length === 0) {
      return [];
    }

    return result.rows.map((x) => {
      return {
        suggestion: x.suggestion,
        type: x.type,
        name: x.name,
        surname: x.surname,
        nickname: x.nickname,
        email: x.email,
        createdAt: x.created_at,
      };
    });
  });

  return platformSuggestions;
};

export const getSOSCenterClicks = async ({ country, language }) => {
  const poolCountry = country;

  const clicksData = await getSOSCenterClicksQuery({
    poolCountry,
  }).then((result) => {
    if (result.rows.length === 0) {
      return [];
    }

    // Group clicks by SOS center
    const groupedClicks = {};

    result.rows.forEach((row) => {
      const key = `${row.sos_center_id}_${row.is_main}`;

      if (!groupedClicks[key]) {
        groupedClicks[key] = {
          sosCenterId: row.sos_center_id,
          isMain: row.is_main,
          timestamps: [],
          platformBreakdown: {},
          clientIds: new Set(),
        };
      }

      groupedClicks[key].timestamps.push({
        timestamp: row.created_at,
        platform: row.platform,
      });
      groupedClicks[key].clientIds.add(row.client_detail_id);

      // Count clicks by platform
      if (!groupedClicks[key].platformBreakdown[row.platform]) {
        groupedClicks[key].platformBreakdown[row.platform] = 0;
      }
      groupedClicks[key].platformBreakdown[row.platform]++;
    });

    // Convert to array and add calculated fields
    return Object.values(groupedClicks)
      .map((group) => ({
        sosCenterId: group.sosCenterId,
        isMain: group.isMain,
        clickCount: group.timestamps.length,
        uniqueUsers: group.clientIds.size,
        timestamps: group.timestamps.sort((a, b) => {
          return new Date(b.timestamp) - new Date(a.timestamp);
        }),
        platformBreakdown: group.platformBreakdown,
        firstClickAt: new Date(
          Math.min(...group.timestamps.map((t) => new Date(t)))
        ),
        lastClickAt: new Date(
          Math.max(...group.timestamps.map((t) => new Date(t)))
        ),
      }))
      .sort((a, b) => {
        if (a.isMain) return -1;
        if (b.isMain) return -1;
        return b.clickCount - a.clickCount;
      }); // Sort by click count descending, but put the main on top
  });

  return {
    totalClicks: clicksData.reduce((sum, center) => sum + center.clickCount, 0),
    totalUniqueCenters: clicksData.length,
    clicksByCenter: clicksData,
  };
};
