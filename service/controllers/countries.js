import {
  getWebsiteCountryFaqsQuery,
  getClientCountryFaqsQuery,
  getProviderCountryFaqsQuery,
  addWebsiteCountryFaqsQuery,
  addClientCountryFaqsQuery,
  addProviderCountryFaqsQuery,
  deleteWebsiteCountryFaqsQuery,
  deleteClientCountryFaqsQuery,
  deleteProviderCountryFaqsQuery,
  getCountrySosCentersQuery,
  addCountrySosCentersQuery,
  deleteCountrySosCentersQuery,
  getCountryArticlesQuery,
  addCountryArticlesQuery,
  deleteCountryArticlesQuery,
  updateCountryMinMaxClientAgeQuery,
} from "#queries/countries";

import { platformNotFound, countryNotFound } from "#utils/errors";

export const getCountryFaqs = async ({ country, language, platform }) => {
  let platformSpecificQuery = "";

  switch (platform) {
    case "website":
      platformSpecificQuery = getWebsiteCountryFaqsQuery;
      break;
    case "client":
      platformSpecificQuery = getClientCountryFaqsQuery;
      break;
    case "provider":
      platformSpecificQuery = getProviderCountryFaqsQuery;
      break;
    default:
      throw platformNotFound(language);
  }

  return await platformSpecificQuery({ country })
    .then((res) => {
      return res.rows[0][`faq_${platform}_ids`];
    })
    .catch((err) => {
      throw err;
    });
};

export const addCountryFaqs = async ({ country, language, platform, id }) => {
  let platformSpecificQuery = "";

  switch (platform) {
    case "website":
      platformSpecificQuery = addWebsiteCountryFaqsQuery;
      break;
    case "client":
      platformSpecificQuery = addClientCountryFaqsQuery;
      break;
    case "provider":
      platformSpecificQuery = addProviderCountryFaqsQuery;
      break;
    default:
      throw platformNotFound(language);
  }

  return await platformSpecificQuery({ id, country })
    .then((res) => {
      return res.rows[0][`faq_${platform}_ids`];
    })
    .catch((err) => {
      throw err;
    });
};

export const deleteCountryFaqs = async ({
  country,
  language,
  platform,
  id,
}) => {
  let platformSpecificQuery = "";

  switch (platform) {
    case "website":
      platformSpecificQuery = deleteWebsiteCountryFaqsQuery;
      break;
    case "client":
      platformSpecificQuery = deleteClientCountryFaqsQuery;
      break;
    case "provider":
      platformSpecificQuery = deleteProviderCountryFaqsQuery;
      break;
    default:
      throw platformNotFound(language);
  }

  return await platformSpecificQuery({ id, country })
    .then((res) => {
      return res.rows[0][`faq_${platform}_ids`];
    })
    .catch((err) => {
      throw err;
    });
};

export const getCountrySosCenters = async ({ country }) => {
  return await getCountrySosCentersQuery({ country })
    .then((res) => {
      return res.rows[0][`sos_center_ids`];
    })
    .catch((err) => {
      throw err;
    });
};

export const addCountrySosCenters = async ({ country, id }) => {
  return await addCountrySosCentersQuery({ country, id })
    .then((res) => {
      return res.rows[0][`sos_center_ids`];
    })
    .catch((err) => {
      throw err;
    });
};

export const deleteCountrySosCenters = async ({ country, id }) => {
  return await deleteCountrySosCentersQuery({ country, id })
    .then((res) => {
      return res.rows[0][`sos_center_ids`];
    })
    .catch((err) => {
      throw err;
    });
};

export const getCountryArticles = async ({ country }) => {
  return await getCountryArticlesQuery({ country })
    .then((res) => {
      return res.rows[0][`article_ids`];
    })
    .catch((err) => {
      throw err;
    });
};

export const addCountryArticles = async ({ country, id }) => {
  return await addCountryArticlesQuery({ country, id })
    .then((res) => {
      return res.rows[0][`article_ids`];
    })
    .catch((err) => {
      throw err;
    });
};

export const deleteCountryArticles = async ({ country, id }) => {
  return await deleteCountryArticlesQuery({ country, id })
    .then((res) => {
      return res.rows[0][`article_ids`];
    })
    .catch((err) => {
      throw err;
    });
};

export const updateCountryMinMaxClientAge = async ({
  country,
  language,
  minClientAge,
  maxClientAge,
}) => {
  return await updateCountryMinMaxClientAgeQuery({
    country,
    language,
    minClientAge,
    maxClientAge,
  })
    .then((res) => {
      if (res.rowCount === 0) {
        throw countryNotFound(language);
      } else {
        return res.rows[0];
      }
    })
    .catch((err) => {
      throw err;
    });
};
