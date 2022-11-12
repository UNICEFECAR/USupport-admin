import { getDBPool } from "#utils/dbConfig";

export const getWebsiteCountryFaqsQuery = async ({ country }) => {
  return await getDBPool("masterDb").query(
    `
      SELECT "faq_website_ids"
      FROM "country"
      WHERE "alpha2" = $1
      ORDER BY "created_at" DESC
      LIMIT 1
    `,
    [country]
  );
};

export const addWebsiteCountryFaqsQuery = async ({ id, country }) => {
  return await getDBPool("masterDb").query(
    `
      UPDATE country
      SET faq_website_ids = (SELECT array_agg(distinct e) FROM UNNEST(faq_website_ids || $1::VARCHAR) e)
      WHERE alpha2 = $2
      RETURNING *
    `,
    [id, country]
  );
};

export const deleteWebsiteCountryFaqsQuery = async ({ id, country }) => {
  return await getDBPool("masterDb").query(
    `
      UPDATE country
      SET faq_website_ids = array_remove(faq_website_ids, $1::VARCHAR)
      WHERE alpha2 = $2
      RETURNING *
    `,
    [id, country]
  );
};

export const getClientCountryFaqsQuery = async ({ country }) => {
  return await getDBPool("masterDb").query(
    `
      SELECT "faq_client_ids"
      FROM "country"
      WHERE "alpha2" = $1
      ORDER BY "created_at" DESC
      LIMIT 1
    `,
    [country]
  );
};

export const addClientCountryFaqsQuery = async ({ id, country }) => {
  return await getDBPool("masterDb").query(
    `
      UPDATE country
      SET faq_client_ids = (SELECT array_agg(distinct e) FROM UNNEST(faq_client_ids || $1::VARCHAR) e)
      WHERE alpha2 = $2
      RETURNING *
    `,
    [id, country]
  );
};

export const deleteClientCountryFaqsQuery = async ({ id, country }) => {
  return await getDBPool("masterDb").query(
    `
      UPDATE country
      SET faq_client_ids = array_remove(faq_client_ids, $1::VARCHAR)
      WHERE alpha2 = $2
      RETURNING *
    `,
    [id, country]
  );
};

export const getProviderCountryFaqsQuery = async ({ country }) => {
  return await getDBPool("masterDb").query(
    `
      SELECT "faq_provider_ids"
      FROM "country"
      WHERE "alpha2" = $1
      ORDER BY "created_at" DESC
      LIMIT 1
    `,
    [country]
  );
};

export const addProviderCountryFaqsQuery = async ({ id, country }) => {
  return await getDBPool("masterDb").query(
    `
      UPDATE country
      SET faq_provider_ids = (SELECT array_agg(distinct e) FROM UNNEST(faq_provider_ids || $1::VARCHAR) e)
      WHERE alpha2 = $2
      RETURNING *
    `,
    [id, country]
  );
};

export const deleteProviderCountryFaqsQuery = async ({ id, country }) => {
  return await getDBPool("masterDb").query(
    `
      UPDATE country
      SET faq_provider_ids = array_remove(faq_provider_ids, $1::VARCHAR)
      WHERE alpha2 = $2
      RETURNING *
    `,
    [id, country]
  );
};

export const getCountrySosCentersQuery = async ({ country }) => {
  return await getDBPool("masterDb").query(
    `
      SELECT "sos_center_ids"
      FROM "country"
      WHERE "alpha2" = $1
      ORDER BY "created_at" DESC
      LIMIT 1
    `,
    [country]
  );
};

export const addCountrySosCentersQuery = async ({ id, country }) => {
  return await getDBPool("masterDb").query(
    `
      UPDATE country
      SET sos_center_ids = (SELECT array_agg(distinct e) FROM UNNEST(sos_center_ids || $1::VARCHAR) e)
      WHERE alpha2 = $2
      RETURNING *
    `,
    [id, country]
  );
};

export const deleteCountrySosCentersQuery = async ({ id, country }) => {
  return await getDBPool("masterDb").query(
    `
      UPDATE country
      SET sos_center_ids = array_remove(sos_center_ids, $1::VARCHAR)
      WHERE alpha2 = $2
      RETURNING *
    `,
    [id, country]
  );
};

export const getCountryArticlesQuery = async ({ country }) => {
  return await getDBPool("masterDb").query(
    `
      SELECT "article_ids"
      FROM "country"
      WHERE "alpha2" = $1
      ORDER BY "created_at" DESC
      LIMIT 1
    `,
    [country]
  );
};

export const addCountryArticlesQuery = async ({ id, country }) => {
  return await getDBPool("masterDb").query(
    `
      UPDATE country
      SET article_ids = (SELECT array_agg(distinct e) FROM UNNEST(article_ids || $1::VARCHAR) e)
      WHERE alpha2 = $2
      RETURNING *
    `,
    [id, country]
  );
};

export const deleteCountryArticlesQuery = async ({ id, country }) => {
  return await getDBPool("masterDb").query(
    `
      UPDATE country
      SET article_ids = array_remove(article_ids, $1::VARCHAR)
      WHERE alpha2 = $2
      RETURNING *
    `,
    [id, country]
  );
};
