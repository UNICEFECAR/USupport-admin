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
  providerDetailId,
  country: poolCountry,
}) => {
  return await getDBPool("piiDb", poolCountry).query(
    `
          WITH existing_link AS (
            SELECT 1
            FROM organization_provider_links
            WHERE organization_id = $1 AND provider_detail_id = $2
          )
          INSERT INTO organization_provider_links (organization_id, provider_detail_id)
          SELECT $1, $2
          WHERE NOT EXISTS (SELECT * FROM existing_link)
          RETURNING *;

         `,
    [organizationId, providerDetailId]
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
              JOIN organization_provider_links ON organization.organization_id = organization_provider_links.organization_id
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
              JOIN organization_provider_links ON organization.organization_id = organization_provider_links.organization_id
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
}) => {
  return await getDBPool("clinicalDb", poolCountry).query(
    `
          SELECT 
              provider_detail_id,
              COUNT(DISTINCT consultation_id) AS consultations_count,
              COUNT(DISTINCT client_detail_id) AS clients_count
          FROM 
              consultation
          WHERE 
              organization_id = $1 AND (consultation.status = 'scheduled' OR consultation.status = 'finished')
          GROUP BY 
              provider_detail_id;
    `,
    [organizationId]
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
