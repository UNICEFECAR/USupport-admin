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
        FROM "user" u
        LEFT JOIN provider_detail pd ON pd.provider_detail_id = u.provider_detail_id
        WHERE u.type = 'provider'
          AND u.deleted_at IS NULL
          AND pd.status = 'active';
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
  startDate,
  endDate,
}) => {
  return await getDBPool("clinicalDb", poolCountry).query(
    `
      SELECT client_detail_id, campaign_id
      FROM consultation
      WHERE status = 'scheduled' 
        AND ($1::double precision IS NULL OR created_at >= to_timestamp($1))
        AND ($2::double precision IS NULL OR created_at <= to_timestamp($2));
    `,
    [startDate, endDate]
  );
};

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
  startDate,
  endDate,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
    SELECT 
    COUNT(*) FILTER (WHERE type = 'provider') AS providers_no,
    COALESCE(
    ARRAY_AGG(client_detail_id) FILTER (
      WHERE type = 'client' AND client_detail_id IS NOT NULL
    ),
    '{}'
  ) AS client_detail_ids
    FROM "user"
    WHERE deleted_at is NULL 
      AND last_login > now() - interval '15 days'
      AND ($1::double precision IS NULL OR last_login >= to_timestamp($1))
      AND ($2::double precision IS NULL OR last_login <= to_timestamp($2));
      `,
    [startDate, endDate]
  );
};

export const getMoodTrackerReportQuery = async ({
  poolCountry,
  startDate,
  endDate,
}) =>
  await getDBPool("clinicalDb", poolCountry).query(
    `
WITH filtered AS (
    SELECT mood, client_detail_id, is_critical
    FROM mood_tracker
    WHERE is_deleted = false
      AND ($1::timestamptz IS NULL OR time >= $1::timestamptz)
      AND ($2::timestamptz IS NULL OR time <= $2::timestamptz)
),
total_stats AS (
    SELECT 'total'::text AS row_type,
           NULL::text AS mood,
           COUNT(*) AS total_count,
           COUNT(DISTINCT client_detail_id) AS unique_clients,
           COUNT(*) FILTER (WHERE is_critical = true) AS critical_count
    FROM filtered
),
mood_stats AS (
    SELECT 'mood'::text AS row_type,
           mood::text AS mood,
           COUNT(*) AS total_count,
           COUNT(DISTINCT client_detail_id) AS unique_clients,
           COUNT(*) FILTER (WHERE is_critical = true) AS critical_count
    FROM filtered
    GROUP BY mood
),
combined AS (
    SELECT * FROM total_stats
    UNION ALL
    SELECT * FROM mood_stats
)
SELECT *
FROM combined
ORDER BY 
    CASE WHEN row_type = 'total' THEN 0 ELSE 1 END,
    mood NULLS LAST;


    `,
    [startDate, endDate]
  );

export const getPositivePlatformRatingsFromClientsQuery = async ({
  poolCountry,
  startDate,
  endDate,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
    SELECT client_detail_id 
    FROM client_rating
    WHERE rating > 3
      AND ($1::double precision IS NULL OR created_at >= to_timestamp($1))
      AND ($2::double precision IS NULL OR created_at <= to_timestamp($2))
    
    `,
    [startDate, endDate]
  );
};

export const getPositivePlatformRatingsFromProvidersQuery = async ({
  poolCountry,
  startDate,
  endDate,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
    SELECT COUNT(*)
    FROM provider_rating
    WHERE rating > 3
      AND ($1::double precision IS NULL OR created_at >= to_timestamp($1))
      AND ($2::double precision IS NULL OR created_at <= to_timestamp($2))
    `,
    [startDate, endDate]
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

export const getSOSCenterClicksQuery = async ({ poolCountry }) =>
  await getDBPool("clinicalDb", poolCountry).query(
    `
      SELECT 
        sos_center_id,
        is_main,
        platform,
        created_at,
        client_detail_id
      FROM sos_center_click
      ORDER BY sos_center_id, is_main, created_at DESC
    `
  );

export const getAllActiveProvidersQuery = async ({ poolCountry }) =>
  await getDBPool("piiDb", poolCountry).query(
    `
      SELECT 
        pd.provider_detail_id,
        pd.name,
        pd.surname,
        pd.email,
        pd.specializations,
        pd.consultation_price,
        pd.status
      FROM provider_detail pd
      INNER JOIN "user" u ON u.provider_detail_id = pd.provider_detail_id 
        AND u.deleted_at IS NULL 
        AND pd.status = 'active'
      ORDER BY pd.name ASC
    `
  );

export const getAvailabilitySlotsInRangeQuery = async ({
  poolCountry,
  startDate,
  endDate,
}) =>
  await getDBPool("piiDb", poolCountry).query(
    `
      WITH date_range AS (
        SELECT 
          $1::timestamptz as target_start,
          $2::timestamptz as target_end
      ),
      week_boundaries AS (
        SELECT 
          -- Find the Monday of the week containing startDate
          date_trunc('week', (SELECT target_start FROM date_range)) as week_start,
          -- Find the Monday of the week containing endDate, then add 6 days to get end of that week
          date_trunc('week', (SELECT target_end FROM date_range)) + interval '6 days' + interval '23 hours 59 minutes 59 seconds' as week_end
      )
      SELECT 
        a.availability_id,
        a.provider_detail_id,
        a.slots,
        a.start_date,
        a.campaign_slots,
        a.organization_slots
      FROM availability a, week_boundaries wb
      WHERE a.start_date >= wb.week_start 
        AND a.start_date <= wb.week_end
        AND (
          (a.slots IS NOT NULL AND array_length(a.slots, 1) > 0) OR
          (a.campaign_slots IS NOT NULL AND jsonb_typeof(a.campaign_slots) = 'array' AND jsonb_array_length(a.campaign_slots) > 0) OR
          (a.campaign_slots IS NOT NULL AND jsonb_typeof(a.campaign_slots) = 'object' AND a.campaign_slots != '{}')
        )
      ORDER BY a.provider_detail_id ASC, a.start_date ASC
    `,
    [startDate, endDate]
  );

export const getBookedConsultationsInRangeQuery = async ({
  poolCountry,
  startDate,
  endDate,
}) =>
  await getDBPool("clinicalDb", poolCountry).query(
    `
      SELECT 
        c.consultation_id,
        c.provider_detail_id,
        c.client_detail_id,
        c.time,
        c.status,
        c.campaign_id,
        c.created_at
      FROM consultation c
      WHERE c.time >= $1::timestamptz 
        AND c.time <= $2::timestamptz
        AND c.status IN ('scheduled', 'finished', 'active', 'late-canceled', 'canceled', 'suggested')
      ORDER BY c.provider_detail_id ASC, c.time ASC
    `,
    [startDate, endDate]
  );
