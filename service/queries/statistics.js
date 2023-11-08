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

export const getSecurityCheckAnswersQuery = async ({ poolCountry }) =>
  await getDBPool("clinicalDb", poolCountry).query(
    `
        SELECT consultation_security_check_id, contacts_disclosure, suggest_outside_meeting, identity_coercion, unsafe_feeling, more_details, client_detail_id, provider_detail_id, time, consultation_security_check.created_at
        FROM consultation_security_check
          INNER JOIN consultation ON consultation_security_check.consultation_id = consultation.consultation_id
        WHERE contacts_disclosure = true
        OR suggest_outside_meeting = true
        OR identity_coercion = true
        OR unsafe_feeling = true;
      `
  );

export const getInformationPortalSuggestionsQuery = async ({ poolCountry }) =>
  await getDBPool("piiDb", poolCountry).query(
    `
      SELECT suggestion, information_portal_suggestion.created_at, name, surname, nickname, email  
      FROM information_portal_suggestion
        INNER JOIN client_detail ON information_portal_suggestion.client_detail_id = client_detail.client_detail_id
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
      SELECT client_detail_id, provider_detail_id, time, status, price, type, campaign_id, created_at
      FROM consultation
      WHERE provider_detail_id = $1 AND (status = 'finished' OR status = 'scheduled')
    `,
    [providerId]
  );
