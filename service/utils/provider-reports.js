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

const formatTimeFromSlot = (slot) => {
  const date = new Date(slot);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const formatSlotDateTime = (slot) => {
  const date = formatDateToDDMMYYYY(slot);
  const time = formatTimeFromSlot(slot);
  return `${date} - ${time}`;
};

export const generateAvailabilityCSV = ({
  availability,
  providers,
  startDate,
  endDate,
  language = "en",
}) => {
  const dateRangeHeader = `${formatDateToDDMMYYYY(
    startDate
  )} - ${formatDateToDDMMYYYY(endDate)}`;

  let csvContent = `"${t("provider_availability_report", language)}"\n`;
  csvContent += `"${t("date_range", language)}: ${dateRangeHeader}"\n`;
  csvContent += `"${t("total_providers", language)}: ${providers.length}"\n`;
  csvContent += "\n"; // Empty line for separation

  // Add CSV headers
  csvContent += `"${t("provider_name", language)}","${t(
    "provider_email",
    language
  )}","${t("total_slots", language)}","${t("campaign_slots", language)}","${t(
    "organization_slots",
    language
  )}","${t("normal_slots", language)}","${t(
    "normal_slots_details",
    language
  )}","${t("campaign_slots_details", language)}","${t(
    "organization_slots_details",
    language
  )}","${t("normal_consultations_booked", language)}","${t(
    "normal_consultations_details",
    language
  )}","${t("campaign_consultations_booked", language)}","${t(
    "campaign_consultations_details",
    language
  )}","${t("organization_consultations_booked", language)}","${t(
    "organization_consultations_details",
    language
  )}"\n`;

  // First, create a map of all providers with their basic info
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
      normalConsultationsBooked: provider.normal_consultations_booked || 0,
      campaignConsultationsBooked: provider.campaign_consultations_booked || 0,
      organizationConsultationsBooked:
        provider.organization_consultations_booked || 0,
      normalConsultationsDetails: provider.normal_consultations_details || [],
      campaignConsultationsDetails:
        provider.campaign_consultations_details || [],
      organizationConsultationsDetails:
        provider.organization_consultations_details || [],
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
            providerData.normalSlots.push(formatSlotDateTime(slot));
          }
        });
      }

      // Process campaign slots - filter by date range
      if (record.campaign_slots && typeof record.campaign_slots === "object") {
        // campaign_slots is JSONB, could be an object with slot arrays or direct array
        let campaignSlotsList = [];

        if (Array.isArray(record.campaign_slots)) {
          campaignSlotsList = record.campaign_slots;
        } else if (
          record.campaign_slots &&
          typeof record.campaign_slots === "object"
        ) {
          // If it's an object, extract all slot arrays from it
          Object.values(record.campaign_slots).forEach((value) => {
            if (Array.isArray(value)) {
              campaignSlotsList = campaignSlotsList.concat(value);
            }
          });
        }

        campaignSlotsList.forEach((slot) => {
          // Handle different slot formats (timestamp vs object with time property)
          const slotTime = slot.time ? new Date(slot.time) : new Date(slot);
          if (slotTime >= startDate && slotTime <= endDate) {
            providerData.campaignSlots.push(formatSlotDateTime(slotTime));
          }
        });
      }

      // Process organization slots - filter by date range
      if (
        record.organization_slots &&
        typeof record.organization_slots === "object"
      ) {
        // organization_slots is JSONB, could be an object with slot arrays or direct array
        let organizationSlotsList = [];

        if (Array.isArray(record.organization_slots)) {
          organizationSlotsList = record.organization_slots;
        } else if (
          record.organization_slots &&
          typeof record.organization_slots === "object"
        ) {
          // If it's an object, extract all slot arrays from it
          Object.values(record.organization_slots).forEach((value) => {
            if (Array.isArray(value)) {
              organizationSlotsList = organizationSlotsList.concat(value);
            }
          });
        }

        organizationSlotsList.forEach((slot) => {
          // Handle different slot formats (timestamp vs object with time property)
          const slotTime = slot.time ? new Date(slot.time) : new Date(slot);
          if (slotTime >= startDate && slotTime <= endDate) {
            providerData.organizationSlots.push(formatSlotDateTime(slotTime));
          }
        });
      }
    }
  });

  // Generate CSV content for each provider (including those with no slots)
  providers.forEach((provider) => {
    const data = providerAvailabilityMap.get(provider.provider_detail_id);
    const normalSlotsCount = data.normalSlots.length;
    const campaignSlotsCount = data.campaignSlots.length;
    const organizationSlotsCount = data.organizationSlots.length;
    const totalSlots =
      normalSlotsCount + campaignSlotsCount + organizationSlotsCount;

    const normalConsultationsCount = data.normalConsultationsBooked;
    const campaignConsultationsCount = data.campaignConsultationsBooked;
    const organizationConsultationsCount = data.organizationConsultationsBooked;
    const normalConsultationsDetailsCount =
      data.normalConsultationsDetails.length;
    const campaignConsultationsDetailsCount =
      data.campaignConsultationsDetails.length;
    const organizationConsultationsDetailsCount =
      data.organizationConsultationsDetails.length;

    // Find the maximum number of rows needed for all details
    const maxRows = Math.max(
      normalSlotsCount,
      campaignSlotsCount,
      organizationSlotsCount,
      normalConsultationsDetailsCount,
      campaignConsultationsDetailsCount,
      organizationConsultationsDetailsCount,
      1 // At least one row for provider info
    );

    if (
      totalSlots > 0 ||
      normalConsultationsCount > 0 ||
      campaignConsultationsCount > 0 ||
      organizationConsultationsCount > 0
    ) {
      let providerInfoShown = false;

      for (let i = 0; i < maxRows; i++) {
        const normalSlot = i < normalSlotsCount ? data.normalSlots[i] : "";
        const campaignSlot =
          i < campaignSlotsCount ? data.campaignSlots[i] : "";
        const organizationSlot =
          i < organizationSlotsCount ? data.organizationSlots[i] : "";
        const normalConsultation =
          i < normalConsultationsDetailsCount
            ? data.normalConsultationsDetails[i]
            : "";
        const campaignConsultation =
          i < campaignConsultationsDetailsCount
            ? data.campaignConsultationsDetails[i]
            : "";
        const organizationConsultation =
          i < organizationConsultationsDetailsCount
            ? data.organizationConsultationsDetails[i]
            : "";

        if (!providerInfoShown) {
          csvContent += `"${data.provider.name}","${data.provider.email}","${totalSlots}","${campaignSlotsCount}","${organizationSlotsCount}","${normalSlotsCount}","${normalSlot}","${campaignSlot}","${organizationSlot}","${normalConsultationsCount}","${normalConsultation}","${campaignConsultationsCount}","${campaignConsultation}","${organizationConsultationsCount}","${organizationConsultation}"\n`;
          providerInfoShown = true;
        } else {
          csvContent += `"","","","","","","${normalSlot}","${campaignSlot}","${organizationSlot}","","${normalConsultation}","","${campaignConsultation}","","${organizationConsultation}"\n`;
        }
      }
    } else {
      // Provider with no slots or consultations
      csvContent += `"${data.provider.name}","${
        data.provider.email
      }","0","0","0","0","${t("no_normal_slots", language)}","${t(
        "no_campaign_slots",
        language
      )}","${t("no_organization_slots", language)}","0","${t(
        "no_normal_consultations",
        language
      )}","0","${t("no_campaign_consultations", language)}","0","${t(
        "no_organization_consultations",
        language
      )}"\n`;
    }

    csvContent += "\n"; // Empty line between providers
  });

  return csvContent;
};
