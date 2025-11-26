import { getDBPool } from "#utils/dbConfig";

export const createOrganizationQuery = async ({
  name,
  websiteUrl,
  address,
  phone,
  email,
  createdBy,
  country: poolCountry,
  location,
  description,
  districtId,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      INSERT INTO organization (
        name, created_by, website_url, address, phone, email,
        geolocation, description, district_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, ST_Point($7, $8), $9, $10)
      RETURNING *, ST_X(geolocation) as longitude, ST_Y(geolocation) as latitude
    `,
    [
      name,
      createdBy,
      websiteUrl,
      address,
      phone,
      email,
      location?.longitude,
      location?.latitude,
      description,
      districtId,
    ]
  );
};

export const editOrganizationQuery = async ({
  name,
  organizationId,
  country: poolCountry,
  websiteUrl,
  address,
  phone,
  email,
  location,
  description,
  districtId,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      UPDATE organization
      SET
        name = $1,
        website_url = $2,
        address = $3,
        phone = $4,
        email = $5,
        geolocation = ST_Point($6, $7),
        description = $8,
        district_id = CASE WHEN $9::uuid IS NULL THEN district_id ELSE $9::uuid END
      WHERE organization_id = $10
      RETURNING *, ST_X(geolocation) as longitude, ST_Y(geolocation) as latitude;
    `,
    [
      name,
      websiteUrl,
      address,
      phone,
      email,
      location?.longitude,
      location?.latitude,
      description,
      districtId || null,
      organizationId,
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

export const getAllOrganizationsQuery = async ({ country: poolCountry }) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
    SELECT 
      organization.*,
      ST_X(organization.geolocation) as longitude, 
      ST_Y(organization.geolocation) as latitude,
      district.name as district,
      COALESCE(specialisations_agg.specialisations, '[]'::json) as specialisations,
      COALESCE(payment_methods_agg.payment_methods, '[]'::json) as payment_methods,
      COALESCE(user_interactions_agg.user_interactions, '[]'::json) as user_interactions,
      COALESCE(property_types_agg.property_types, '[]'::json) as property_types
    FROM organization
    LEFT JOIN district ON organization.district_id = district.district_id
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
    LEFT JOIN (
      SELECT 
        organization_id,
        JSON_AGG(JSON_BUILD_OBJECT(
          'id', organization_payment_method_links.payment_method_id,
          'name', payment_method.name
        )) as payment_methods
      FROM organization_payment_method_links
      LEFT JOIN payment_method ON (
        organization_payment_method_links.payment_method_id = payment_method.payment_method_id
      )
      GROUP BY organization_id
    ) payment_methods_agg ON organization.organization_id = payment_methods_agg.organization_id
    LEFT JOIN (
      SELECT 
        organization_id,
        JSON_AGG(JSON_BUILD_OBJECT(
          'id', organization_user_interaction_links.user_interaction_id,
          'name', user_interaction.name
        )) as user_interactions
      FROM organization_user_interaction_links
      LEFT JOIN user_interaction ON (
        organization_user_interaction_links.user_interaction_id = user_interaction.user_interaction_id
      )
      GROUP BY organization_id
    ) user_interactions_agg ON organization.organization_id = user_interactions_agg.organization_id
    LEFT JOIN (
      SELECT 
        organization_id,
        JSON_AGG(JSON_BUILD_OBJECT(
          'id', organization_property_type_links.organization_property_type_id,
          'name', organization_property_type.name
        )) as property_types
      FROM organization_property_type_links
      LEFT JOIN organization_property_type ON (
        organization_property_type_links.organization_property_type_id = organization_property_type.organization_property_type_id
      )
      GROUP BY organization_id
    ) property_types_agg ON organization.organization_id = property_types_agg.organization_id
    `
  );
};

export const getAllOrganizationsWithDetailsQuery = async ({
  country: poolCountry,
  search,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      SELECT 
        organization.organization_id, 
        organization.name,
        organization.website_url,
        organization.address,
        organization.phone,
        organization.email,
        organization.description,
        organization.created_by,
        organization.created_at,
        organization.district_id,
        ST_X(organization.geolocation) as longitude, 
        ST_Y(organization.geolocation) as latitude,
        district.name as district,
        COALESCE(providers_agg.providers, '[]'::json) as providers,
        COALESCE(specialisations_agg.specialisations, '[]'::json) as specialisations,
        COALESCE(payment_methods_agg.payment_methods, '[]'::json) as payment_methods,
        COALESCE(user_interactions_agg.user_interactions, '[]'::json) as user_interactions,
        COALESCE(property_types_agg.property_types, '[]'::json) as property_types
      FROM organization
      LEFT JOIN district ON organization.district_id = district.district_id
      LEFT JOIN (
        SELECT 
          organization_id,
          JSON_AGG(provider_detail_id) as providers
        FROM organization_provider_links
        WHERE is_deleted = false OR is_deleted IS NULL
        GROUP BY organization_id
      ) providers_agg ON organization.organization_id = providers_agg.organization_id
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
      LEFT JOIN (
        SELECT 
          organization_id,
          JSON_AGG(JSON_BUILD_OBJECT(
            'id', organization_payment_method_links.payment_method_id,
            'name', payment_method.name
          )) as payment_methods
        FROM organization_payment_method_links
        LEFT JOIN payment_method ON (
          organization_payment_method_links.payment_method_id = payment_method.payment_method_id
        )
        GROUP BY organization_id
      ) payment_methods_agg ON organization.organization_id = payment_methods_agg.organization_id
      LEFT JOIN (
        SELECT 
          organization_id,
          JSON_AGG(JSON_BUILD_OBJECT(
            'id', organization_user_interaction_links.user_interaction_id,
            'name', user_interaction.name
          )) as user_interactions
        FROM organization_user_interaction_links
        LEFT JOIN user_interaction ON (
          organization_user_interaction_links.user_interaction_id = user_interaction.user_interaction_id
        )
        GROUP BY organization_id
      ) user_interactions_agg ON organization.organization_id = user_interactions_agg.organization_id
      LEFT JOIN (
        SELECT 
          organization_id,
          JSON_AGG(JSON_BUILD_OBJECT(
            'id', organization_property_type_links.organization_property_type_id,
            'name', organization_property_type.name
          )) as property_types
        FROM organization_property_type_links
        LEFT JOIN organization_property_type ON (
          organization_property_type_links.organization_property_type_id = organization_property_type.organization_property_type_id
        )
        GROUP BY organization_id
      ) property_types_agg ON organization.organization_id = property_types_agg.organization_id
      WHERE ($1::text IS NULL OR organization.name ILIKE $1::text) AND organization.is_deleted = FALSE
    `,
    search ? [`%${search}%`] : [null]
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
        organization.website_url,
        organization.address,
        organization.phone,
        organization.email,
        organization.description,
        organization.created_at, 
        organization.district_id,
        ST_X(organization.geolocation) as longitude, 
        ST_Y(organization.geolocation) as latitude,
        district.name as district,
        COALESCE(providers_agg.providers, '[]'::json) as providers,
        COALESCE(specialisations_agg.specialisations, '[]'::json) as specialisations,
        COALESCE(payment_methods_agg.payment_methods, '[]'::json) as payment_methods,
        COALESCE(user_interactions_agg.user_interactions, '[]'::json) as user_interactions,
        COALESCE(property_types_agg.property_types, '[]'::json) as property_types
      FROM organization 
      LEFT JOIN district ON organization.district_id = district.district_id
      LEFT JOIN (
        SELECT 
          organization_id,
          JSON_AGG(JSON_BUILD_OBJECT(
            'provider_detail_id', provider_detail_id,
            'provider_join_date', created_at
          )) as providers
        FROM organization_provider_links
        WHERE organization_id = $1 AND (is_deleted = false OR is_deleted IS NULL)
        GROUP BY organization_id
      ) providers_agg ON organization.organization_id = providers_agg.organization_id
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
      LEFT JOIN (
        SELECT 
          organization_id,
          JSON_AGG(JSON_BUILD_OBJECT(
            'id', organization_payment_method_links.payment_method_id,
            'name', payment_method.name
          )) as payment_methods
        FROM organization_payment_method_links
        LEFT JOIN payment_method ON (
          organization_payment_method_links.payment_method_id = payment_method.payment_method_id
        )
        WHERE organization_payment_method_links.organization_id = $1
        GROUP BY organization_id
      ) payment_methods_agg ON organization.organization_id = payment_methods_agg.organization_id
      LEFT JOIN (
        SELECT 
          organization_id,
          JSON_AGG(JSON_BUILD_OBJECT(
            'id', organization_user_interaction_links.user_interaction_id,
            'name', user_interaction.name
          )) as user_interactions
        FROM organization_user_interaction_links
        LEFT JOIN user_interaction ON (
          organization_user_interaction_links.user_interaction_id = user_interaction.user_interaction_id
        )
        WHERE organization_user_interaction_links.organization_id = $1
        GROUP BY organization_id
      ) user_interactions_agg ON organization.organization_id = user_interactions_agg.organization_id
      LEFT JOIN (
        SELECT 
          organization_id,
          JSON_AGG(JSON_BUILD_OBJECT(
            'id', organization_property_type_links.organization_property_type_id,
            'name', organization_property_type.name
          )) as property_types
        FROM organization_property_type_links
        LEFT JOIN organization_property_type ON (
          organization_property_type_links.organization_property_type_id = organization_property_type.organization_property_type_id
        )
        WHERE organization_property_type_links.organization_id = $1
        GROUP BY organization_id
      ) property_types_agg ON organization.organization_id = property_types_agg.organization_id
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
  weekdays,
  weekends,
  timeZone,
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
          AND EXTRACT(HOUR FROM consultation.time AT TIME ZONE COALESCE($8, 'UTC')) >= $4
          AND EXTRACT(HOUR FROM consultation.time AT TIME ZONE COALESCE($8, 'UTC')) <= $5
          -- Filter by weekdays/weekends based on the provided conditions
          AND (
            ($6 = true AND EXTRACT(DOW FROM consultation.time AT TIME ZONE COALESCE($8, 'UTC')) BETWEEN 1 AND 5) OR  -- Weekdays (Monday to Friday)
            ($7 = true AND EXTRACT(DOW FROM consultation.time AT TIME ZONE COALESCE($8, 'UTC')) IN (0, 6)) -- Weekends (Saturday, Sunday)
          )
      GROUP BY 
          provider_detail_id;
    `,
    [
      organizationId,
      startDate,
      endDate,
      startTime,
      endTime,
      weekdays,
      weekends,
      timeZone,
    ]
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
        COALESCE(payment_methods_agg.payment_methods, '[]'::json) as payment_methods,
        COALESCE(user_interactions_agg.user_interactions, '[]'::json) as user_interactions
      FROM organization
      LEFT JOIN district ON organization.district_id = district.district_id
      LEFT JOIN (
        SELECT 
          organization_id,
          JSON_AGG(JSON_BUILD_OBJECT(
            'id', organization_payment_method_links.payment_method_id,
            'name', payment_method.name
          )) as payment_methods
        FROM organization_payment_method_links
        LEFT JOIN payment_method ON (
          organization_payment_method_links.payment_method_id = payment_method.payment_method_id
        )
        GROUP BY organization_id
      ) payment_methods_agg ON organization.organization_id = payment_methods_agg.organization_id
      LEFT JOIN (
        SELECT 
          organization_id,
          JSON_AGG(JSON_BUILD_OBJECT(
            'id', organization_user_interaction_links.user_interaction_id,
            'name', user_interaction.name
          )) as user_interactions
        FROM organization_user_interaction_links
        LEFT JOIN user_interaction ON (
          organization_user_interaction_links.user_interaction_id = user_interaction.user_interaction_id
        )
        GROUP BY organization_id
      ) user_interactions_agg ON organization.organization_id = user_interactions_agg.organization_id
      WHERE organization.organization_id = ANY($1);
    `,
    [organizationIds]
  );
};

// Specialization Queries
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
      DELETE FROM organization_specialisation_links 
      WHERE organization_id = $1 AND organization_specialisation_id = ANY($2::uuid[]);
    `,
    [organizationId, specialisationIds]
  );
};

// User Interaction Queries
export const getUserInteractionsQuery = async ({ country: poolCountry }) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      SELECT * FROM user_interaction;
    `
  );
};

export const getOrganizationUserInteractionLinksQuery = async ({
  poolCountry,
  organizationId,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      SELECT 
        organization_user_interaction_links.user_interaction_id,
        user_interaction.name
      FROM organization_user_interaction_links
      LEFT JOIN user_interaction ON (
        organization_user_interaction_links.user_interaction_id = user_interaction.user_interaction_id
      )
      WHERE organization_user_interaction_links.organization_id = $1;
    `,
    [organizationId]
  );
};

export const createOrganizationUserInteractionQuery = async ({
  poolCountry,
  organizationId,
  userInteractionIds,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      INSERT INTO organization_user_interaction_links (organization_id, user_interaction_id)
      SELECT $1, unnest($2::uuid[])
      RETURNING *;
    `,
    [organizationId, userInteractionIds]
  );
};

export const deleteOrganizationUserInteractionQuery = async ({
  poolCountry,
  organizationId,
  userInteractionIds,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      DELETE FROM organization_user_interaction_links 
      WHERE organization_id = $1 AND user_interaction_id = ANY($2::uuid[]);
    `,
    [organizationId, userInteractionIds]
  );
};

// Payment Method Queries
export const getPaymentMethodsQuery = async ({ country: poolCountry }) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      SELECT * FROM payment_method;
    `
  );
};

export const getOrganizationPaymentMethodLinksQuery = async ({
  poolCountry,
  organizationId,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      SELECT 
        organization_payment_method_links.payment_method_id,
        payment_method.name
      FROM organization_payment_method_links
      LEFT JOIN payment_method ON (
        organization_payment_method_links.payment_method_id = payment_method.payment_method_id
      )
      WHERE organization_payment_method_links.organization_id = $1;
    `,
    [organizationId]
  );
};

export const createOrganizationPaymentMethodQuery = async ({
  poolCountry,
  organizationId,
  paymentMethodIds,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      INSERT INTO organization_payment_method_links (organization_id, payment_method_id)
      SELECT $1, unnest($2::uuid[])
      RETURNING *;
    `,
    [organizationId, paymentMethodIds]
  );
};

export const deleteOrganizationPaymentMethodQuery = async ({
  poolCountry,
  organizationId,
  paymentMethodIds,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      DELETE FROM organization_payment_method_links 
      WHERE organization_id = $1 AND payment_method_id = ANY($2::uuid[]);
    `,
    [organizationId, paymentMethodIds]
  );
};

// Property Type Queries
export const getOrganizationPropertyTypeLinksQuery = async ({
  poolCountry,
  organizationId,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      SELECT 
        organization_property_type_links.organization_property_type_id,
        organization_property_type.name
      FROM organization_property_type_links
      LEFT JOIN organization_property_type ON (
        organization_property_type_links.organization_property_type_id = organization_property_type.organization_property_type_id
      )
      WHERE organization_property_type_links.organization_id = $1;
    `,
    [organizationId]
  );
};

export const createOrganizationPropertyTypeQuery = async ({
  poolCountry,
  organizationId,
  propertyTypeIds,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      INSERT INTO organization_property_type_links (organization_id, organization_property_type_id)
      SELECT $1, unnest($2::uuid[])
      RETURNING *;
    `,
    [organizationId, propertyTypeIds]
  );
};

export const deleteOrganizationPropertyTypeQuery = async ({
  poolCountry,
  organizationId,
  propertyTypeIds,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      DELETE FROM organization_property_type_links 
      WHERE organization_id = $1 AND organization_property_type_id = ANY($2::uuid[]);
    `,
    [organizationId, propertyTypeIds]
  );
};

// District Queries
export const getDistrictsQuery = async ({ country: poolCountry }) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      SELECT * FROM district;
    `
  );
};

// Metadata Query
export const getOrganizationMetadataQuery = async ({
  country: poolCountry,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
    WITH districts AS (
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
    ),
    property_types AS (
      SELECT 
        organization_property_type_id,
        name
      FROM organization_property_type
    )
    SELECT 
      JSON_AGG(DISTINCT districts.*) as districts,
      JSON_AGG(DISTINCT payment_methods.*) as payment_methods,
      JSON_AGG(DISTINCT user_interactions.*) as user_interactions,
      JSON_AGG(DISTINCT specialisations.*) as specialisations,
      JSON_AGG(DISTINCT property_types.*) as property_types
    FROM districts
    CROSS JOIN payment_methods
    CROSS JOIN user_interactions
    CROSS JOIN specialisations
    CROSS JOIN property_types;
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
      SET 
        name = 'DELETED_' || organization_id::text,
        email = 'DELETED',
        website_url = 'DELETED',
        address = 'DELETED', 
        phone = 'DELETED',
        description = 'DELETED',
        geolocation = NULL,
        is_deleted = true,
        deleted_at = NOW(),
        updated_at = NOW()
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

export const getAllProviderOrganizationLinksQuery = async ({
  country: poolCountry,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      SELECT 
        opl.provider_detail_id,
        opl.organization_id,
        o.name as organization_name
      FROM organization_provider_links opl
      INNER JOIN organization o ON o.organization_id = opl.organization_id
      WHERE (opl.is_deleted = false OR opl.is_deleted IS NULL)
        AND o.is_deleted = false;
    `
  );
};

export const checkOrganizationNameExistsQuery = async ({
  name,
  country: poolCountry,
  excludeId = null,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
      SELECT COUNT(*) as count
      FROM organization
      WHERE LOWER(name) = LOWER($1) 
        AND is_deleted = $2 
        AND CASE 
          WHEN $3::uuid IS NULL THEN TRUE 
          ELSE organization_id != $3::uuid 
        END
    `,
    [name, false, excludeId]
  );
};
