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

import { countryNotFound } from "#utils/errors";

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

    if (clientDetailsCache[clientId]) {
      securityChecks[i].clientData = clientDetailsCache[clientId];
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
      securityChecks[i].clientData = clientData;
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

  consultations.forEach((consultation, index) => {
    const clientData = clientDetails.find(
      (x) => x.client_detail_id === consultation.client_detail_id
    );
    consultations[index].clientData = clientData;
  });

  return consultations;
};
