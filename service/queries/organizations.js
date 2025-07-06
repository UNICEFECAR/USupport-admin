import { getDBPool } from "#utils/dbConfig";

export const createOrganizationQuery = async ({
  name,
  unitName,
  websiteUrl,
  address,
  phone,
  email,
  createdBy,
  country: poolCountry,
  location,
  description,
  districtId,
  paymentMethod,
  userInteraction,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      INSERT INTO organization (
        name, created_by, unit_name, website_url, address, phone, email, 
        geolocation, description, district_id, payment_method_id, user_interaction_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, ST_Point($8, $9), $10, $11, $12, $13)
      RETURNING *, ST_X(geolocation) as longitude, ST_Y(geolocation) as latitude
    `,
    [
      name,
      createdBy,
      unitName,
      websiteUrl,
      address,
      phone,
      email,
      location?.longitude,
      location?.latitude,
      description,
      districtId,
      paymentMethod,
      userInteraction,
    ]
  );
};

export const getProviderOrganizationLinkQuery = async ({
  organizationId,
  providerDetailIds,
  country: poolCountry,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
          SELECT *
          FROM organization_provider_links
          WHERE organization_id = $1 AND provider_detail_id = ANY($2::uuid[]);
    `,
    [organizationId, providerDetailIds]
  );
};

export const assignProviderToOrganizationQuery = async ({
  organizationId,
  providerDetailIds,
  country: poolCountry,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      WITH provider_data AS (
        SELECT UNNEST($2::uuid[]) AS provider_detail_id
      ),
      existing_links AS (
        SELECT provider_detail_id
        FROM organization_provider_links
        WHERE organization_id = $1 AND organization_provider_links.is_deleted = false
      )
      INSERT INTO organization_provider_links (organization_id, provider_detail_id)
      SELECT $1, provider_data.provider_detail_id
      FROM provider_data
      WHERE provider_data.provider_detail_id NOT IN (SELECT provider_detail_id FROM existing_links)
      RETURNING *;
    `,
    [organizationId, providerDetailIds]
  );
};

export const reassignProviderToOrganizationQuery = async ({
  organizationId,
  providerDetailIds,
  country: poolCountry,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      INSERT INTO organization_provider_links (organization_id, provider_detail_id, created_at)
      SELECT $1, unnest($2::uuid[]), NOW()
      ON CONFLICT (organization_id, provider_detail_id) DO UPDATE SET
        created_at = NOW()
    `,
    [organizationId, providerDetailIds]
  );
};

export const getAllOrganizationsQuery = async ({ country: poolCountry }) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
    SELECT 
      organization.*,
      ST_X(organization.geolocation) as longitude, 
      ST_Y(organization.geolocation) as latitude,
      district.name as district,
      payment_method.name as payment_method,
      user_interaction.name as user_interaction,
      COALESCE(work_with_agg.work_with, '[]'::json) as work_with,
      COALESCE(specialisations_agg.specialisations, '[]'::json) as specialisations
    FROM organization
    LEFT JOIN district ON organization.district_id = district.district_id
    LEFT JOIN payment_method ON organization.payment_method_id = payment_method.payment_method_id
    LEFT JOIN user_interaction ON organization.user_interaction_id = user_interaction.user_interaction_id
    LEFT JOIN (
      SELECT 
        organization_id,
        JSON_AGG(JSON_BUILD_OBJECT(
          'id', organization_work_with_links.organization_work_with_id,
          'topic', organization_work_with.topic
        )) as work_with
      FROM organization_work_with_links
      LEFT JOIN organization_work_with ON (
        organization_work_with_links.organization_work_with_id = organization_work_with.organization_work_with_id
      )
      GROUP BY organization_id
    ) work_with_agg ON organization.organization_id = work_with_agg.organization_id
    LEFT JOIN (
      SELECT 
        organization_id,
        JSON_AGG(JSON_BUILD_OBJECT(
          'id', organization_specialisation_links.organization_specialisation_id,
          'name', organization_specialisation.name
        )) as specialisations
      FROM organization_specialisation_links
      LEFT JOIN organization_specialisation ON (
        organization_specialisation_links.organization_specialisation_id = organization_specialisation.organization_specialisation_id
      )
      GROUP BY organization_id
    ) specialisations_agg ON organization.organization_id = specialisations_agg.organization_id
    `
  );
};

export const getAllOrganizationsWithDetailsQuery = async ({
  country: poolCountry,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      SELECT 
        organization.organization_id, 
        organization.name,
        organization.unit_name,
        organization.website_url,
        organization.address,
        organization.phone,
        organization.email,
        organization.description,
        organization.created_by,
        organization.created_at,
        organization.district_id,
        organization.payment_method_id,
        organization.user_interaction_id,
        ST_X(organization.geolocation) as longitude, 
        ST_Y(organization.geolocation) as latitude,
        district.name as district,
        payment_method.name as payment_method,
        user_interaction.name as user_interaction,
        COALESCE(providers_agg.providers, '[]'::json) as providers,
        COALESCE(work_with_agg.work_with, '[]'::json) as work_with,
        COALESCE(specialisations_agg.specialisations, '[]'::json) as specialisations
      FROM organization
      LEFT JOIN district ON organization.district_id = district.district_id
      LEFT JOIN payment_method ON organization.payment_method_id = payment_method.payment_method_id
      LEFT JOIN user_interaction ON organization.user_interaction_id = user_interaction.user_interaction_id
      LEFT JOIN (
        SELECT 
          organization_id,
          JSON_AGG(provider_detail_id) as providers
        FROM organization_provider_links
        GROUP BY organization_id
      ) providers_agg ON organization.organization_id = providers_agg.organization_id
      LEFT JOIN (
        SELECT 
          organization_id,
          JSON_AGG(JSON_BUILD_OBJECT(
            'id', organization_work_with_links.organization_work_with_id,
            'topic', organization_work_with.topic
          )) as work_with
        FROM organization_work_with_links
        LEFT JOIN organization_work_with ON (
          organization_work_with_links.organization_work_with_id = organization_work_with.organization_work_with_id
        )
        GROUP BY organization_id
      ) work_with_agg ON organization.organization_id = work_with_agg.organization_id
      LEFT JOIN (
        SELECT 
          organization_id,
          JSON_AGG(JSON_BUILD_OBJECT(
            'id', organization_specialisation_links.organization_specialisation_id,
            'name', organization_specialisation.name
          )) as specialisations
        FROM organization_specialisation_links
        LEFT JOIN organization_specialisation ON (
          organization_specialisation_links.organization_specialisation_id = organization_specialisation.organization_specialisation_id
        )
        GROUP BY organization_id
      ) specialisations_agg ON organization.organization_id = specialisations_agg.organization_id
      WHERE organization.is_deleted = FALSE
    `
  );
};

export const getOrganizationByIdQuery = async ({
  organizationId,
  country: poolCountry,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      SELECT 
        organization.organization_id, 
        organization.name, 
        organization.unit_name,
        organization.website_url,
        organization.address,
        organization.phone,
        organization.email,
        organization.description,
        organization.created_at, 
        organization.district_id,
        organization.payment_method_id,
        organization.user_interaction_id,
        ST_X(organization.geolocation) as longitude, 
        ST_Y(organization.geolocation) as latitude,
        district.name as district,
        payment_method.name as payment_method,
        user_interaction.name as user_interaction,
        COALESCE(providers_agg.providers, '[]'::json) as providers,
        COALESCE(work_with_agg.work_with, '[]'::json) as work_with,
        COALESCE(specialisations_agg.specialisations, '[]'::json) as specialisations
      FROM organization 
      LEFT JOIN district ON organization.district_id = district.district_id
      LEFT JOIN payment_method ON organization.payment_method_id = payment_method.payment_method_id
      LEFT JOIN user_interaction ON organization.user_interaction_id = user_interaction.user_interaction_id
      LEFT JOIN (
        SELECT 
          organization_id,
          JSON_AGG(JSON_BUILD_OBJECT(
            'provider_detail_id', provider_detail_id,
            'provider_join_date', created_at
          )) as providers
        FROM organization_provider_links
        WHERE organization_id = $1
        GROUP BY organization_id
      ) providers_agg ON organization.organization_id = providers_agg.organization_id
      LEFT JOIN (
        SELECT 
          organization_id,
          JSON_AGG(JSON_BUILD_OBJECT(
            'id', organization_work_with_links.organization_work_with_id,
            'topic', organization_work_with.topic
          )) as work_with
        FROM organization_work_with_links
        LEFT JOIN organization_work_with ON (
          organization_work_with_links.organization_work_with_id = organization_work_with.organization_work_with_id
        )
        WHERE organization_work_with_links.organization_id = $1
        GROUP BY organization_id
      ) work_with_agg ON organization.organization_id = work_with_agg.organization_id
      LEFT JOIN (
        SELECT 
          organization_id,
          JSON_AGG(JSON_BUILD_OBJECT(
            'id', organization_specialisation_links.organization_specialisation_id,
            'name', organization_specialisation.name
          )) as specialisations
        FROM organization_specialisation_links
        LEFT JOIN organization_specialisation ON (
          organization_specialisation_links.organization_specialisation_id = organization_specialisation.organization_specialisation_id
        )
        WHERE organization_specialisation_links.organization_id = $1
        GROUP BY organization_id
      ) specialisations_agg ON organization.organization_id = specialisations_agg.organization_id
      WHERE organization.organization_id = $1;
         `,
    [organizationId]
  );
};

export const getConsultationsForOrganizationsQuery = async ({
  organizationIds,
  country: poolCountry,
}) => {
  return await getDBPool("clinicalDb", poolCountry).query(
    `
          SELECT 
              organization_id,
              COUNT(DISTINCT consultation_id) AS consultations_count,
              COUNT(DISTINCT client_detail_id) AS clients_count
          FROM 
              consultation
          WHERE 
              organization_id = ANY($1)
              AND
              (consultation.status = 'scheduled' OR consultation.status = 'finished')
          GROUP BY 
              organization_id;
    `,
    [organizationIds]
  );
};

export const getProviderConsultationsForOrganizationQuery = async ({
  organizationId,
  country: poolCountry,
  startDate,
  endDate,
  startTime,
  endTime,
  weekdays, // Boolean to include or exclude weekdays
  weekends, // Boolean to include or exclude weekends
}) => {
  return await getDBPool("clinicalDb", poolCountry).query(
    `
      SELECT 
          provider_detail_id,
          COUNT(DISTINCT consultation_id) AS consultations_count,
          COUNT(DISTINCT client_detail_id) AS clients_count,
          JSON_AGG(consultation) as consultations
      FROM 
          consultation
      WHERE 
          organization_id = $1 
          AND (consultation.status = 'scheduled' OR consultation.status = 'finished')
          AND consultation.time >= to_timestamp($2)
          AND consultation.time <= to_timestamp($3)
          AND EXTRACT(HOUR FROM consultation.time) >= $4
          AND EXTRACT(HOUR FROM consultation.time) <= $5
          -- Filter by weekdays/weekends based on the provided conditions
          AND (
            ($6 = true AND EXTRACT(DOW FROM consultation.time) BETWEEN 1 AND 5) OR  -- Weekdays (Monday to Friday)
            ($7 = true AND EXTRACT(DOW FROM consultation.time) IN (0, 6)) -- Weekends (Saturday, Sunday)
          )
      GROUP BY 
          provider_detail_id;
    `,
    [organizationId, startDate, endDate, startTime, endTime, weekdays, weekends]
  );
};

export const checkProvidersFutureConsultationsForOrgQuery = async ({
  providerDetailIds,
  organizationId,
  country: poolCountry,
}) => {
  return await getDBPool("clinicalDb", poolCountry).query(
    `
      SELECT 
          provider_detail_id,
          COUNT(DISTINCT consultation_id) AS count
      FROM 
          consultation
      WHERE 
          organization_id = $1 
          AND provider_detail_id = ANY($2::uuid[])
          AND status = 'scheduled'
          AND time > NOW()
      GROUP BY 
          provider_detail_id;
    `,
    [organizationId, providerDetailIds]
  );
};

export const editOrganizationQuery = async ({
  name,
  organizationId,
  country: poolCountry,
  unitName,
  websiteUrl,
  address,
  phone,
  email,
  location,
  description,
  district,
  paymentMethod,
  userInteraction,
}) => {
  console.log(organizationId);

  return await getDBPool("piiDb", poolCountry).query(
    `
          UPDATE organization
          SET
            name = $1,
            unit_name = $2,
            website_url = $3,
            address = $4,
            phone = $5,
            email = $6,
            geolocation = ST_Point($7, $8),
            description = $9,
            -- check for null values and check data types
            district_id = CASE WHEN $10::uuid IS NULL THEN district_id ELSE $10::uuid END,
            payment_method_id = CASE WHEN $11::uuid IS NULL THEN payment_method_id ELSE $11::uuid END,
            user_interaction_id = CASE WHEN $12::uuid IS NULL THEN user_interaction_id ELSE $12::uuid END
          WHERE organization_id = $13
          RETURNING *, ST_X(geolocation) as longitude, ST_Y(geolocation) as latitude;
    `,
    [
      name,
      unitName,
      websiteUrl,
      address,
      phone,
      email,
      location?.longitude,
      location?.latitude,
      description,
      district || null,
      paymentMethod || null,
      userInteraction || null,
      organizationId,
    ]
  );
};

export const removeProviderFromOrganizationQuery = async ({
  organizationId,
  providerDetailId,
  country: poolCountry,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
        UPDATE organization_provider_links
        SET deleted_at = NOW(),
            is_deleted = true,
            periods = CASE 
                -- If periods is already an array, append the new object to the array
                WHEN jsonb_typeof(periods) = 'array' THEN periods || jsonb_build_object(
                    'enrolled_at', created_at,
                    'removed_at', NOW()
                )
                -- If periods is NULL or not an array, create a new array with the current periods and the new object
                ELSE jsonb_build_array(
                    periods, 
                    jsonb_build_object(
                        'enrolled_at', created_at,
                        'removed_at', NOW()
                    )
                )
            END
        WHERE organization_id = $1 AND provider_detail_id = $2
        RETURNING *;
    `,
    [organizationId, providerDetailId]
  );
};

export const getOrganizationsByIdsQuery = async ({
  organizationIds,
  country: poolCountry,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      SELECT 
        organization.*,
        ST_X(organization.geolocation) as longitude, 
        ST_Y(organization.geolocation) as latitude,
        district.name as district,
        payment_method.name as payment_method,
        user_interaction.name as user_interaction
      FROM organization
      LEFT JOIN district ON organization.district_id = district.district_id
      LEFT JOIN payment_method ON organization.payment_method_id = payment_method.payment_method_id
      LEFT JOIN user_interaction ON organization.user_interaction_id = user_interaction.user_interaction_id
      WHERE organization.organization_id = ANY($1);
         `,
    [organizationIds]
  );
};

export const getOrganizationWorkWithQuery = async ({ country }) => {
  return await getDBPool("piiDb", country).query(
    `
      SELECT *
      FROM organization_work_with;
    `
  );
};

export const createOrganizationWorkWithLinksQuery = async ({
  poolCountry,
  organizationId,
  workWithIds,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      INSERT INTO organization_work_with_links (organization_id, organization_work_with_id)
      SELECT $1, unnest($2::uuid[])
      RETURNING *;
    `,
    [organizationId, workWithIds]
  );
};

export const deleteOrganizationWorkWithLinksQuery = async ({
  poolCountry,
  organizationId,
  workWithIds,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      DELETE FROM organization_work_with_links 
      WHERE organization_id = $1 AND organization_work_with_id = ANY($2::uuid[]);
    `,
    [organizationId, workWithIds]
  );
};

export const getOrganizationWorkWithLinksQuery = async ({
  poolCountry,
  organizationId,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      SELECT 
        organization_work_with_links.organization_work_with_id,
        organization_work_with.topic
      FROM organization_work_with_links
      LEFT JOIN organization_work_with ON (
        organization_work_with_links.organization_work_with_id = organization_work_with.organization_work_with_id
      )
      WHERE organization_work_with_links.organization_id = $1;
    `,
    [organizationId]
  );
};

export const getDistrictsQuery = async ({ country: poolCountry }) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      SELECT * FROM district;
    `
  );
};

export const getPaymentMethodsQuery = async ({ country: poolCountry }) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      SELECT * FROM payment_method;
    `
  );
};

export const getUserInteractionsQuery = async ({ country: poolCountry }) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      SELECT * FROM user_interaction;
    `
  );
};

export const getOrganizationSpecialisationsQuery = async ({
  country: poolCountry,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      SELECT * FROM organization_specialisation;
    `
  );
};

export const getOrganizationSpecialisationsLinksQuery = async ({
  poolCountry,
  organizationId,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      SELECT 
        organization_specialisation_links.organization_specialisation_id,
        organization_specialisation.name
      FROM organization_specialisation_links
      LEFT JOIN organization_specialisation ON (
        organization_specialisation_links.organization_specialisation_id = organization_specialisation.organization_specialisation_id
      )
      WHERE organization_specialisation_links.organization_id = $1;
    `,
    [organizationId]
  );
};

export const createOrganizationSpecialisationsLinksQuery = async ({
  poolCountry,
  organizationId,
  specialisationIds,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      INSERT INTO organization_specialisation_links (organization_id, organization_specialisation_id)
      SELECT $1, unnest($2::uuid[])
      RETURNING *;
    `,
    [organizationId, specialisationIds]
  );
};

export const deleteOrganizationSpecialisationsLinksQuery = async ({
  poolCountry,
  organizationId,
  specialisationIds,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      DELETE FROM organization_specialisation_links WHERE organization_id = $1 AND organization_specialisation_id = ANY($2::uuid[]);
    `,
    [organizationId, specialisationIds]
  );
};

export const getOrganizationMetadataQuery = async ({
  country: poolCountry,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
    WITH work_with AS (
      SELECT 
        organization_work_with_id,
        topic
      FROM organization_work_with
    ),
    districts AS (
      SELECT 
        district_id,
        name
      FROM district
    ),
    payment_methods AS (
      SELECT 
        payment_method_id,
        name
      FROM payment_method
    ),
    user_interactions AS (
      SELECT 
        user_interaction_id,
        name
      FROM user_interaction
    ),
    specialisations AS (
      SELECT 
        organization_specialisation_id,
        name
      FROM organization_specialisation
    )
    SELECT 
      JSON_AGG(DISTINCT work_with.*) as work_with,
      JSON_AGG(DISTINCT districts.*) as districts,
      JSON_AGG(DISTINCT payment_methods.*) as payment_methods,
      JSON_AGG(DISTINCT user_interactions.*) as user_interactions,
      JSON_AGG(DISTINCT specialisations.*) as specialisations
    FROM work_with
    CROSS JOIN districts
    CROSS JOIN payment_methods
    CROSS JOIN user_interactions
    CROSS JOIN specialisations;
    `
  );
};

export const deleteOrganizationQuery = async ({
  country: poolCountry,
  organizationId,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      UPDATE organization
      SET is_deleted = true, deleted_at = NOW()
      WHERE organization_id = $1
      RETURNING *;
    `,
    [organizationId]
  );
};

export const getProvidersForOrganizationQuery = async ({
  country: poolCountry,
  organizationId,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    ` 
    SELECT organization_provider_links.*, provider_detail.* 
	  FROM organization_provider_links
	  LEFT JOIN provider_detail ON organization_provider_links.provider_detail_id = provider_detail.provider_detail_id
	  WHERE organization_id = $1
    `,
    [organizationId]
  );
};
