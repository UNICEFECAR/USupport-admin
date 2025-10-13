import { t } from "#translations/index";

/**
 * Combines provider data with their availability data for legacy compatibility
 * @param {Array} providersRows - Array of provider objects from getAllActiveProvidersQuery
 * @param {Array} availabilityRows - Array of availability objects from getAvailabilitySlotsInRangeQuery
 * @returns {Array} Combined array with provider details merged into availability records
 */
export const combineProvidersWithAvailability = (
  providersRows,
  availabilityRows
) => {
  // Create a map of providers for quick lookup
  const providerMap = new Map();
  providersRows.forEach((provider) => {
    providerMap.set(provider.provider_detail_id, provider);
  });

  // Create combined records (only for providers with availability)
  const combinedRows = availabilityRows.map((availability) => ({
    ...availability,
    ...providerMap.get(availability.provider_detail_id),
  }));

  return combinedRows;
};

const formatDateToDDMMYYYY = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
};

export const generateAvailabilityCSV = ({
  availability,
  providers,
  startDate,
  endDate,
  language = "en",
}) => {
  let csvContent = "\uFEFF";

  // Collect all unique organization and campaign names from availability data
  const organizationNames = new Map(); // Map of org_id -> org_name
  const campaignNames = new Map(); // Map of campaign_id -> campaign_name
  const organizationOrder = []; // Keep track of order for consistent column ordering
  const campaignOrder = []; // Keep track of order for consistent column ordering

  // Extract organization and campaign names from availability data
  availability.forEach((record) => {
    // Extract organization names from organization_slots
    if (
      record.organization_slots &&
      typeof record.organization_slots === "object"
    ) {
      let organizationSlotsList = [];
      if (Array.isArray(record.organization_slots)) {
        organizationSlotsList = record.organization_slots;
      } else if (typeof record.organization_slots === "object") {
        Object.values(record.organization_slots).forEach((value) => {
          if (Array.isArray(value)) {
            organizationSlotsList = organizationSlotsList.concat(value);
          }
        });
      }
      organizationSlotsList.forEach((slot) => {
        if (slot.organization_id && slot.organization_name) {
          if (!organizationNames.has(slot.organization_id)) {
            organizationNames.set(slot.organization_id, slot.organization_name);
            organizationOrder.push(slot.organization_id);
          }
        }
      });
    }

    // Extract campaign names from campaign_slots
    if (record.campaign_slots && typeof record.campaign_slots === "object") {
      let campaignSlotsList = [];
      if (Array.isArray(record.campaign_slots)) {
        campaignSlotsList = record.campaign_slots;
      } else if (typeof record.campaign_slots === "object") {
        Object.values(record.campaign_slots).forEach((value) => {
          if (Array.isArray(value)) {
            campaignSlotsList = campaignSlotsList.concat(value);
          }
        });
      }
      campaignSlotsList.forEach((slot) => {
        if (slot.campaign_id && slot.campaign_name) {
          if (!campaignNames.has(slot.campaign_id)) {
            campaignNames.set(slot.campaign_id, slot.campaign_name);
            campaignOrder.push(slot.campaign_id);
          }
        }
      });
    }
  });

  // Create headers with better organization - group related columns together
  let headerColumns = [
    // Provider Information Section
    t("provider_name", language),
    t("provider_email", language),

    // Slot Summary Section
    t("total_slots", language),

    // Individual Slot Types Section
    t("normal_slots", language),
    t("campaign_slots", language),
    t("organization_slots", language),
  ];

  // Add organization-specific columns with actual names (limit to first 2)
  organizationOrder.slice(0, 2).forEach((orgId) => {
    const orgName = organizationNames.get(orgId);
    headerColumns.push(orgName || `Organization ${orgId.substring(0, 8)}`);
  });

  // Add consultation summary section
  headerColumns.push(
    t("normal_consultations_booked", language),
    t("campaign_consultations_booked", language)
  );

  // Generate CSV header
  csvContent += headerColumns.map((col) => `"${col}"`).join(",") + "\n";

  // Create a map of all providers with their basic info
  const providerAvailabilityMap = new Map();

  // Initialize all providers (including those with no availability)
  providers.forEach((provider) => {
    providerAvailabilityMap.set(provider.provider_detail_id, {
      provider: {
        name: `${provider.name} ${provider.surname || ""}`.trim(),
        email: provider.email,
      },
      normalSlots: [],
      campaignSlots: [],
      organizationSlots: [],
      // Store slots by organization/campaign ID for detailed tracking
      organizationSlotsByOrg: new Map(),
      campaignSlotsByCampaign: new Map(),
      normalConsultationsBooked: provider.normal_consultations_booked || 0,
      campaignConsultationsBooked: provider.campaign_consultations_booked || 0,
      normalConsultationsDetails: provider.normal_consultations_details || [],
      campaignConsultationsDetails:
        provider.campaign_consultations_details || [],
    });
  });

  // Add availability slots for providers that have them (filtered by date range)
  availability.forEach((record) => {
    const providerId = record.provider_detail_id;
    if (providerAvailabilityMap.has(providerId)) {
      const providerData = providerAvailabilityMap.get(providerId);

      // Process normal slots - filter by date range
      if (record.slots && record.slots.length > 0) {
        record.slots.forEach((slot) => {
          const slotDate = new Date(slot);
          if (slotDate >= startDate && slotDate <= endDate) {
            providerData.normalSlots.push({ time: slot });
          }
        });
      }

      // Process campaign slots - filter by date range and group by campaign ID
      if (record.campaign_slots && typeof record.campaign_slots === "object") {
        let campaignSlotsList = [];

        if (Array.isArray(record.campaign_slots)) {
          campaignSlotsList = record.campaign_slots;
        } else if (
          record.campaign_slots &&
          typeof record.campaign_slots === "object"
        ) {
          Object.values(record.campaign_slots).forEach((value) => {
            if (Array.isArray(value)) {
              campaignSlotsList = campaignSlotsList.concat(value);
            }
          });
        }

        campaignSlotsList.forEach((slot) => {
          const slotTime = slot.time ? new Date(slot.time) : new Date(slot);
          if (slotTime >= startDate && slotTime <= endDate) {
            providerData.campaignSlots.push(slot);

            // Group by campaign ID
            if (slot.campaign_id) {
              if (!providerData.campaignSlotsByCampaign.has(slot.campaign_id)) {
                providerData.campaignSlotsByCampaign.set(slot.campaign_id, []);
              }
              providerData.campaignSlotsByCampaign
                .get(slot.campaign_id)
                .push(slot);
            }
          }
        });
      }

      // Process organization slots - filter by date range and group by organization ID
      if (
        record.organization_slots &&
        typeof record.organization_slots === "object"
      ) {
        let organizationSlotsList = [];

        if (Array.isArray(record.organization_slots)) {
          organizationSlotsList = record.organization_slots;
        } else if (
          record.organization_slots &&
          typeof record.organization_slots === "object"
        ) {
          Object.values(record.organization_slots).forEach((value) => {
            if (Array.isArray(value)) {
              organizationSlotsList = organizationSlotsList.concat(value);
            }
          });
        }

        organizationSlotsList.forEach((slot) => {
          const slotTime = slot.time ? new Date(slot.time) : new Date(slot);
          if (slotTime >= startDate && slotTime <= endDate) {
            providerData.organizationSlots.push(slot);

            // Group by organization ID
            if (slot.organization_id) {
              if (
                !providerData.organizationSlotsByOrg.has(slot.organization_id)
              ) {
                providerData.organizationSlotsByOrg.set(
                  slot.organization_id,
                  []
                );
              }
              providerData.organizationSlotsByOrg
                .get(slot.organization_id)
                .push(slot);
            }
          }
        });
      }
    }
  });

  // Calculate totals for summary
  let totalNormalSlots = 0;
  let totalCampaignSlots = 0;
  let totalOrganizationSlots = 0;
  let totalNormalConsultations = 0;
  let totalCampaignConsultations = 0;

  // Helper function to format slot information for a provider
  const formatProviderSlotsInfo = (slots) => {
    if (!slots || slots.length === 0) {
      return "N/A";
    }

    const earliest = new Date(
      Math.min(...slots.map((slot) => new Date(slot.time || slot)))
    );
    const latest = new Date(
      Math.max(...slots.map((slot) => new Date(slot.time || slot)))
    );

    const earliestFormatted = formatDateToDDMMYYYY(earliest);
    const latestFormatted = formatDateToDDMMYYYY(latest);

    return `${slots.length} total slots From ${earliestFormatted} to ${latestFormatted}`;
  };

  // Generate individual provider rows
  providers.forEach((provider) => {
    const data = providerAvailabilityMap.get(provider.provider_detail_id);

    const normalSlotsCount = data.normalSlots.length;
    const campaignSlotsCount = data.campaignSlots.length;
    const organizationSlotsCount = data.organizationSlots.length;
    const totalSlots =
      normalSlotsCount + campaignSlotsCount + organizationSlotsCount;

    // Format slot information for this provider
    const normalSlotsInfo = formatProviderSlotsInfo(data.normalSlots);
    const campaignSlotsInfo = formatProviderSlotsInfo(data.campaignSlots);
    const organizationSlotsInfo = formatProviderSlotsInfo(
      data.organizationSlots
    );

    // Create row data following the new organized column structure
    let rowData = [
      // Provider Information Section
      data.provider.name,
      data.provider.email,

      // Slot Summary Section
      totalSlots,

      // Individual Slot Types Section
      normalSlotsInfo,
      campaignSlotsInfo,
      organizationSlotsInfo,
    ];

    // Add organization-specific columns (up to 2 organizations) using the order from headers
    organizationOrder.slice(0, 2).forEach((orgId) => {
      const orgSlots = data.organizationSlotsByOrg.get(orgId) || [];
      const orgSlotsInfo = formatProviderSlotsInfo(orgSlots);
      rowData.push(orgSlotsInfo);
    });

    // Add consultation summary section
    rowData.push(
      data.normalConsultationsBooked,
      data.campaignConsultationsBooked
    );

    csvContent += rowData.map((cell) => `"${cell}"`).join(",") + "\n";
  });

  // Calculate totals for summary
  providers.forEach((provider) => {
    const data = providerAvailabilityMap.get(provider.provider_detail_id);

    totalNormalSlots += data.normalSlots.length;
    totalCampaignSlots += data.campaignSlots.length;
    totalOrganizationSlots += data.organizationSlots.length;
    totalNormalConsultations += data.normalConsultationsBooked;
    totalCampaignConsultations += data.campaignConsultationsBooked;
  });

  // Generate summary row at the bottom
  const totalSlots =
    totalNormalSlots + totalCampaignSlots + totalOrganizationSlots;

  // Format slot information for summary - show only totals
  const normalSlotsInfo = totalNormalSlots > 0 ? `${totalNormalSlots}` : "N/A";
  const campaignSlotsInfo =
    totalCampaignSlots > 0 ? `${totalCampaignSlots}` : "N/A";
  const organizationSlotsInfo =
    totalOrganizationSlots > 0 ? `${totalOrganizationSlots}` : "N/A";

  // Create summary row data following the new organized column structure
  let summaryRowData = [
    // Provider Information Section (empty for summary)
    "", // Provider name
    "", // Provider email

    // Slot Summary Section
    totalSlots,

    // Individual Slot Types Section
    normalSlotsInfo,
    campaignSlotsInfo,
    organizationSlotsInfo,
  ];

  // Add organization summary columns using the order from headers
  organizationOrder.slice(0, 2).forEach((orgId) => {
    let totalOrgSlots = 0;
    providers.forEach((provider) => {
      const data = providerAvailabilityMap.get(provider.provider_detail_id);
      const orgSlots = data.organizationSlotsByOrg.get(orgId) || [];
      totalOrgSlots += orgSlots.length;
    });

    const orgSummaryInfo = totalOrgSlots > 0 ? `${totalOrgSlots}` : "N/A";
    summaryRowData.push(orgSummaryInfo);
  });

  // Add consultation summary section
  summaryRowData.push(totalNormalConsultations, totalCampaignConsultations);

  csvContent += summaryRowData.map((cell) => `"${cell}"`).join(",") + "\n";

  return csvContent;
};
