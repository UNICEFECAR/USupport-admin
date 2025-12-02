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
  getAllActiveProvidersQuery,
  getAvailabilitySlotsInRangeQuery,
  getBookedConsultationsInRangeQuery,
  getMoodTrackerReportQuery,
  getPlayAndHealVisitsQuery,
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

import {
  getOrganizationsByIdsQuery,
  getAllProviderOrganizationLinksQuery,
} from "#queries/organizations";

import { countryNotFound } from "#utils/errors";
import { normalizeDate, getClientInitials } from "#utils/helperFunctions";
import {
  generateAvailabilityCSV,
  getHourInTimezone,
  formatDateTimeInTimezone,
  isValidTimeZone,
  buildUtcRangeForLocalHours,
} from "#utils/provider-reports";

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
    if (answers.provider_attend === true && answers.addressed_needs < 6) {
      counter++;
    }
    if (answers.provider_attend === true && answers.improve_wellbeing < 6) {
      counter++;
    }
    if (answers.provider_attend === true && answers.feelings_now < 6) {
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
  return await getPlatformSuggestionsForTypeQuery({
    poolCountry: country,
    type,
  })
    .then((res) => {
      return res.rows;
    })
    .catch((err) => {
      throw err;
    });
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

export const getMoodTrackerReport = async ({ country, startDate, endDate }) => {
  const normalizedStartDate = normalizeDate(startDate, "start");
  const normalizedEndDate = normalizeDate(endDate, "end");

  const result = await getMoodTrackerReportQuery({
    poolCountry: country,
    startDate: normalizedStartDate,
    endDate: normalizedEndDate,
  })
    .then((res) => res.rows)
    .catch((err) => {
      throw err;
    });

  const totalStats = result.find((row) => row.row_type === "total") || {
    total_count: 0,
    unique_clients: 0,
    critical_count: 0,
  };

  const moodBreakdown = result
    .filter((row) => row.row_type === "mood")
    .map((row) => ({
      mood: row.mood,
      totalCount: Number(row.total_count) || 0,
      uniqueClients: Number(row.unique_clients) || 0,
      criticalCount: Number(row.critical_count) || 0,
    }));

  return {
    totalCount: Number(totalStats.total_count) || 0,
    uniqueClients: Number(totalStats.unique_clients) || 0,
    criticalCount: Number(totalStats.critical_count) || 0,
    moodBreakdown,
  };
};

export const getProviderAvailabilityReport = async ({
  country,
  startDate: providedStartDate,
  endDate: providedEndDate,
  startHour,
  endHour,
  language = "en",
  timezone,
}) => {
  const now = new Date();

  if (!isValidTimeZone(timezone)) {
    throw new Error("Invalid timezone");
  }

  // Build precise UTC range based on local dates and selected hours
  const { startUtcISO: normalizedStartDate, endUtcISO: normalizedEndDate } =
    buildUtcRangeForLocalHours(
      providedStartDate || now,
      providedEndDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      startHour,
      endHour,
      timezone
    );

  const startDate = new Date(normalizedStartDate);
  const endDate = new Date(normalizedEndDate);

  try {
    const [
      providersResult,
      availabilityResult,
      consultationsResult,
      providerOrgLinksResult,
    ] = await Promise.all([
      getAllActiveProvidersQuery({ poolCountry: country }),
      getAvailabilitySlotsInRangeQuery({
        poolCountry: country,
        startDate: startDate,
        endDate: endDate,
      }),
      getBookedConsultationsInRangeQuery({
        poolCountry: country,
        startDate: startDate,
        endDate: endDate,
      }),
      getAllProviderOrganizationLinksQuery({ country }),
    ]);

    const providersMap = new Map();
    const availabilityRecords = [];
    const allProviders = providersResult.rows;
    const allAvailability = availabilityResult.rows;
    const allConsultations = consultationsResult.rows;
    const providerOrganizationLinks = providerOrgLinksResult.rows || [];

    allProviders.forEach((provider) => {
      providersMap.set(provider.provider_detail_id, {
        provider_detail_id: provider.provider_detail_id,
        name: provider.name,
        surname: provider.surname,
        email: provider.email,
        specializations: provider.specializations,
        consultation_price: provider.consultation_price,
        status: provider.status,
        total_availability_slots: 0,
        earliest_availability: null,
        latest_availability: null,
        normal_consultations_booked: 0,
        campaign_consultations_booked: 0,
        organization_consultations_booked: 0,
        normal_consultations_details: [],
        campaign_consultations_details: [],
        organization_consultations_details: [],
      });
    });

    allAvailability.forEach((availability) => {
      const providerId = availability.provider_detail_id;
      const provider = providersMap.get(providerId);

      //Filter slots by time in the provided timezone
      const filteredSlotsByTime = availability.slots?.filter((x) => {
        const hr = getHourInTimezone(x, timezone);
        return hr >= startHour && hr <= endHour;
      });

      // Ensure campaign_slots and organization_slots are arrays before filtering
      const campaignSlotsArray = Array.isArray(availability.campaign_slots)
        ? availability.campaign_slots
        : [];
      const organizationSlotsArray = Array.isArray(
        availability.organization_slots
      )
        ? availability.organization_slots
        : [];

      const filteredCampaignSlotsByTime = campaignSlotsArray
        ?.filter((x) => x && Object.keys(x).length > 0 && x.time)
        ?.filter((x) => {
          const hr = getHourInTimezone(x.time, timezone);
          return hr >= startHour && hr <= endHour;
        });
      const filteredOrganizationSlotsByTime = organizationSlotsArray
        ?.filter((x) => x && Object.keys(x).length > 0 && x.time)
        ?.filter((x) => {
          const hr = getHourInTimezone(x.time, timezone);
          return hr >= startHour && hr <= endHour;
        });

      const normalSlotsCount = filteredSlotsByTime?.length || 0;
      const campaignSlotsCount = filteredCampaignSlotsByTime?.length || 0;
      const organizationSlotsCount =
        filteredOrganizationSlotsByTime?.length || 0;

      const totalFilteredSlots =
        normalSlotsCount + campaignSlotsCount + organizationSlotsCount;

      const hasSlots = totalFilteredSlots > 0;

      if (provider && hasSlots && availability.start_date) {
        provider.total_availability_slots += totalFilteredSlots;

        if (
          !provider.earliest_availability ||
          new Date(availability.start_date) <
            new Date(provider.earliest_availability)
        ) {
          provider.earliest_availability = availability.start_date;
        }
        if (
          !provider.latest_availability ||
          new Date(availability.start_date) >
            new Date(provider.latest_availability)
        ) {
          provider.latest_availability = availability.start_date;
        }

        availabilityRecords.push({
          ...availability,
          slots: filteredSlotsByTime,
          campaign_slots: filteredCampaignSlotsByTime,
          organization_slots: filteredOrganizationSlotsByTime,
          name: provider.name,
          surname: provider.surname,
          email: provider.email,
        });
      }
    });

    //Filter consultations by time range
    const filteredConsultations = allConsultations.filter((x) => {
      const hr = getHourInTimezone(x.time, timezone);
      return hr >= startHour && hr <= endHour;
    });

    // Process consultations data
    filteredConsultations.forEach((consultation) => {
      const providerId = consultation.provider_detail_id;
      const provider = providersMap.get(providerId);

      if (provider && consultation.time) {
        const consultationDateTime = new Date(consultation.time);
        const dateTimeString = formatDateTimeInTimezone(
          consultationDateTime,
          timezone
        );

        // Categorize consultation: campaign, organization, or normal
        if (consultation.campaign_id) {
          provider.campaign_consultations_booked++;
          provider.campaign_consultations_details.push({
            dateTimeString,
            campaign_id: consultation.campaign_id,
            time: consultationDateTime,
          });
        } else if (consultation.organization_id) {
          provider.organization_consultations_booked++;
          provider.organization_consultations_details.push({
            dateTimeString,
            organization_id: consultation.organization_id,
            time: consultationDateTime,
          });
        } else {
          provider.normal_consultations_booked++;
          provider.normal_consultations_details.push({
            dateTimeString,
            time: consultationDateTime,
          });
        }
      }
    });

    const providers = Array.from(providersMap.values());

    // Build map of provider -> Map<organizationId, organizationName>
    const providerOrganizationsMap = new Map();
    providerOrganizationLinks.forEach((link) => {
      const providerId = link.provider_detail_id;
      const organizationId = link.organization_id;
      const organizationName = link.organization_name;
      if (!providerId || !organizationId) return;

      if (!providerOrganizationsMap.has(providerId)) {
        providerOrganizationsMap.set(providerId, new Map());
      }
      providerOrganizationsMap
        .get(providerId)
        .set(organizationId, organizationName);
    });

    const csvData = generateAvailabilityCSV({
      availability: availabilityRecords,
      providers,
      providerOrganizations: providerOrganizationsMap,
      startDate,
      endDate,
      language,
    });

    const startDateString = startDate.toISOString().split("T")[0];
    const endDateString = endDate.toISOString().split("T")[0];
    const fileName = `provider-availability-report-${country}-${startDateString}-to-${endDateString}.csv`;

    return {
      success: true,
      message: "Availability report generated successfully",
      csvData,
      fileName,
      totalProviders: providers.length,
      totalSlots: availabilityRecords.length,
      dateRange: {
        start: startDateString,
        end: endDateString,
      },
    };
  } catch (error) {
    console.error("Error generating availability report:", error);
    throw error;
  }
};

export const getPlayAndHealVisits = async () => {
  return await getPlayAndHealVisitsQuery()
    .then((res) => res.rows || [])
    .catch((err) => {
      throw err;
    });
};
