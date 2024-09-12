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
            SELECT organization.*, organization_provider_links.provider_detail_id
            FROM organization
              JOIN organization_provider_links ON organization.id = organization_provider_links.organization_id
            ORDER BY organization.created_at DESC;
         `
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
              COUNT(DISTINCT provider_detail_id) AS providers_count,
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
