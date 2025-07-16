import { getDBPool } from "#utils/dbConfig";

export const getAllActiveCountries = async () =>
  await getDBPool("masterDb").query(
    `
      SELECT * 
      FROM "country"
      WHERE "is_active" = true
      ORDER BY "name" DESC
        
    `
  );

export const getCountryAlpha2CodeByIdQuery = async ({ countryId }) =>
  await getDBPool("masterDb").query(
    `
      SELECT alpha2 
      FROM "country"
      WHERE country_id = $1
      LIMIT 1;
    `,
    [countryId]
  );

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

export const updateCountryMinMaxClientAgeQuery = async ({
  country,
  minClientAge,
  maxClientAge,
}) =>
  await getDBPool("masterDb").query(
    `
      UPDATE "country"
      SET "min_client_age" = $2, "max_client_age" = $3
      WHERE "alpha2" = $1
      RETURNING *;
    `,
    [country, minClientAge, maxClientAge]
  );

export const getCountryVideosQuery = async ({ country }) => {
  return await getDBPool("masterDb").query(
    `
      SELECT "video_ids"
      FROM "country"
      WHERE "alpha2" = $1
      ORDER BY "created_at" DESC
      LIMIT 1
    `,
    [country]
  );
};

export const addCountryVideosQuery = async ({ id, country }) => {
  return await getDBPool("masterDb").query(
    `
      UPDATE country
      SET video_ids = (SELECT array_agg(distinct e) FROM UNNEST(video_ids || $1::VARCHAR) e)
      WHERE alpha2 = $2
      RETURNING *
    `,
    [id, country]
  );
};

export const deleteCountryVideosQuery = async ({ id, country }) => {
  return await getDBPool("masterDb").query(
    `
      UPDATE country
      SET video_ids = array_remove(video_ids, $1::VARCHAR)
      WHERE alpha2 = $2
      RETURNING *
    `,
    [id, country]
  );
};

/**
 * Get all podcasts for a country
 * @param {Object} data
 * @param {string} data.country - The country code
 * @returns {Promise<Array>} - Array of podcast IDs
 */
export const getCountryPodcastsQuery = async (data) => {
  const { country } = data;

  return await getDBPool("masterDb").query(
    `
    SELECT podcast_ids
    FROM country
    WHERE alpha2 = $1;
    `,
    [country]
  );
};

/**
 * Add podcast to a country
 * @param {Object} data
 * @param {string} data.country - The country code
 * @param {string} data.id - The podcast ID
 * @returns {Promise<Array>} - Updated array of podcast IDs
 */
export const addCountryPodcastsQuery = async (data) => {
  const { country, id } = data;

  return await getDBPool("masterDb").query(
    `
    UPDATE country
    SET podcast_ids = array_append(COALESCE(podcast_ids, ARRAY[]::integer[]), $2::integer)
    WHERE alpha2 = $1
    RETURNING podcast_ids;
    `,
    [country, id]
  );
};

/**
 * Delete podcast from a country
 * @param {Object} data
 * @param {string} data.country - The country code
 * @param {string} data.id - The podcast ID
 * @returns {Promise<Array>} - Updated array of podcast IDs
 */
export const deleteCountryPodcastsQuery = async (data) => {
  const { country, id } = data;

  return await getDBPool("masterDb").query(
    `
    UPDATE country
    SET podcast_ids = array_remove(podcast_ids, $2::integer)
    WHERE alpha2 = $1
    RETURNING podcast_ids;
    `,
    [country, id]
  );
};

/**
 * Update content type active status for a country
 * @param {Object} data
 * @param {string} data.country - The country code
 * @param {string} data.contentType - The content type (videos or podcasts)
 * @param {boolean} data.isActive - Whether the content type should be active
 * @returns {Promise<Object>} - Updated country data
 */
export const updateCountryContentActiveStatusQuery = async ({
  country,
  contentType,
  isActive,
}) => {
  const columnName =
    contentType === "videos" ? "videos_active" : "podcasts_active";

  return await getDBPool("masterDb").query(
    `
      UPDATE country
      SET ${columnName} = $2
      WHERE alpha2 = $1
      RETURNING *;
    `,
    [country, isActive]
  );
};
