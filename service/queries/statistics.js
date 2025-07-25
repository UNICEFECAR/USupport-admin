import { getDBPool } from "#utils/dbConfig";

export const getClientsNoForCountryQuery = async ({ poolCountry }) =>
  await getDBPool("piiDb", poolCountry).query(
    `
      SELECT COUNT(*) AS clients_no
      FROM "user"
      WHERE type = 'client' AND deleted_at is NULL;
    `
  );

export const getProvidersNoForCountryQuery = async ({ poolCountry }) =>
  await getDBPool("piiDb", poolCountry).query(
    `
      SELECT COUNT(*) AS providers_no
      FROM "user"
      WHERE type = 'provider' AND deleted_at is NULL;
    `
  );

export const getPublishedArticlesNoForCountryQuery = async ({ countryId }) =>
  await getDBPool("masterDb").query(
    `
        SELECT article_ids
        FROM country
        WHERE country_id = $1;
      `,
    [countryId]
  );

export const getScheduledConsultationsNoForCountryQuery = async ({
  poolCountry,
}) =>
  await getDBPool("clinicalDb", poolCountry).query(
    `
      SELECT COUNT(*) AS consultations_no
      FROM consultation
      WHERE status = 'scheduled';
    `
  );

export const getScheduledConsultationsWithClientIdForCountryQuery = async ({
  poolCountry,
}) =>
  await getDBPool("clinicalDb", poolCountry).query(
    `
      SELECT client_detail_id, campaign_id
      FROM consultation
      WHERE status = 'scheduled';
    `
  );

export const getSecurityCheckAnswersQuery = async ({ poolCountry }) =>
  await getDBPool("clinicalDb", poolCountry).query(
    `
        SELECT consultation_security_check_id, contacts_disclosure, suggest_outside_meeting, identity_coercion, unsafe_feeling, provider_attend, feeling, addressed_needs, improve_wellbeing, feelings_now, additional_comment ,more_details, client_detail_id, provider_detail_id, time, consultation_security_check.created_at
        FROM consultation_security_check
          INNER JOIN consultation ON consultation_security_check.consultation_id = consultation.consultation_id
        WHERE contacts_disclosure = true
        OR suggest_outside_meeting = true
        OR identity_coercion = true
        OR unsafe_feeling = true
        OR provider_attend = false
        OR feeling = 'very_dissatisfied'
        OR feeling = 'dissatisfied'
        OR feeling = 'neutral'
        OR addressed_needs < 6
        OR improve_wellbeing < 6
        OR feelings_now < 6;
      `
  );

export const getInformationPortalSuggestionsQuery = async ({ poolCountry }) =>
  await getDBPool("piiDb", poolCountry).query(
    `
      SELECT suggestion, platform_suggestion.created_at, name, surname, nickname, email  
      FROM platform_suggestion
        INNER JOIN client_detail ON platform_suggestion.client_detail_id = client_detail.client_detail_id
    `
  );

export const getClientRatingsQuery = async ({ poolCountry }) =>
  await getDBPool("piiDb", poolCountry).query(
    `
      SELECT rating, comment, client_rating.created_at
      FROM client_rating
    `
  );

export const getContactFormsQuery = async ({ poolCountry }) =>
  await getDBPool("piiDb", poolCountry).query(
    `
      SELECT * FROM contact_form 
    `
  );

export const getProviderStatisticsQuery = async ({ poolCountry, providerId }) =>
  await getDBPool("clinicalDb", poolCountry).query(
    `  
      SELECT client_detail_id, provider_detail_id, time, status, price, campaign_id, created_at, organization_id
      FROM consultation
      WHERE provider_detail_id = $1 AND (status = 'finished' OR status = 'late-canceled' OR (status = 'scheduled' AND now() > time + interval '1 hour'))
    `,
    [providerId]
  );

export const getClientsAndProvidersLoggedIn15DaysQuery = async ({
  poolCountry,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
    SELECT 
    COUNT(*) FILTER (WHERE type = 'client') AS clients_no,
    COUNT(*) FILTER (WHERE type = 'provider') AS providers_no
    FROM "user"
    WHERE deleted_at is NULL AND last_login > now() - interval '15 days';
      `
  );
};

export const getPositivePlatformRatingsFromClientsQuery = async ({
  poolCountry,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
    SELECT COUNT(*)
    FROM client_rating
    WHERE rating > 3
    `
  );
};

export const getPositivePlatformRatingsFromProvidersQuery = async ({
  poolCountry,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
    SELECT COUNT(*)
    FROM provider_rating
    WHERE rating > 3
    `
  );
};

export const getProviderPlatformRatingsQuery = async ({ poolCountry }) =>
  await getDBPool("piiDb", poolCountry).query(
    `
      SELECT rating, comment, provider_rating.created_at
      FROM provider_rating
    `
  );

export const getPlatformSuggestionsForTypeQuery = async ({
  poolCountry,
  type,
}) =>
  await getDBPool("piiDb", poolCountry).query(
    `
      SELECT suggestion, platform_suggestion.created_at, type, name, surname, nickname, email
      FROM platform_suggestion
        INNER JOIN client_detail ON platform_suggestion.client_detail_id = client_detail.client_detail_id
      WHERE ($1::text IS NULL or type = $1)
    `,
    [type === "all" ? null : type]
  );
