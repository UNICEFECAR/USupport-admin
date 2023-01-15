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
        SELECT consultation_security_check_id, contacts_disclosure, suggest_outside_meeting, identity_coercion, unsafe_feeling, more_details, client_detail_id, provider_detail_id, time
        FROM consultation_security_check
          INNER JOIN consultation ON consultation_security_check.consultation_id = consultation.consultation_id
        WHERE contacts_disclosure = true
        OR suggest_outside_meeting = true
        OR identity_coercion = true
        OR unsafe_feeling = true;
      `
  );
