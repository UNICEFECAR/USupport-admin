import { getDBPool } from "#utils/dbConfig";

export const createOrganizationQuery = async ({
  name,
  createdBy,
  country: poolCountry,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
            INSERT INTO organization (name, created_by)
            VALUES ($1, $2)
            RETURNING *
        `,
    [name, createdBy]
  );
};

export const getAllOrganizationsQuery = async ({ country: poolCountry }) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
            SELECT * FROM organization
         `
  );
};

export const assignProviderToOrganizationQuery = async ({
  organizationId,
  providerDetailIds, // Now an array of provider IDs
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

export const getAllOrganizationsWithDetailsQuery = async ({
  country: poolCountry,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
            SELECT organization.organization_id, organization.name,organization.created_at, JSON_AGG(
            organization_provider_links.provider_detail_id
            ) AS providers
            FROM organization
              JOIN organization_provider_links ON (organization.organization_id = organization_provider_links.organization_id AND organization_provider_links.is_deleted = false)
            GROUP BY organization.organization_id
            ORDER BY organization.created_at DESC;
         `
  );
};

export const getOrganizationByIdQuery = async ({
  organizationId,
  country: poolCountry,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
            SELECT organization.organization_id, organization.name, organization.created_at,
            JSON_AGG(
                JSON_BUILD_OBJECT(
                  'provider_detail_id', organization_provider_links.provider_detail_id,
                  'provider_join_date', organization_provider_links.created_at
                )
              ) AS providers
            FROM organization 
              JOIN organization_provider_links ON (
                                                  organization.organization_id = organization_provider_links.organization_id 
                                                  AND
                                                  organization_provider_links.is_deleted = false
                                                  )
            WHERE organization.organization_id = $1
            GROUP BY organization.organization_id;
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

export const editOrganizationQuery = async ({
  name,
  organizationId,
  country: poolCountry,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
          UPDATE organization
          SET
            name = $1
          WHERE organization_id = $2
          RETURNING *;
    `,
    [name, organizationId]
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
              is_deleted = true
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
            SELECT * FROM organization
            WHERE organization_id = ANY($1);
         `,
    [organizationIds]
  );
};
