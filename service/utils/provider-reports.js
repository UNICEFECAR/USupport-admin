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
}) => {
  const dateRangeHeader = `${formatDateToDDMMYYYY(
    startDate
  )} - ${formatDateToDDMMYYYY(endDate)}`;

  let csvContent = `"Provider Availability Report"\n`;
  csvContent += `"Date Range: ${dateRangeHeader}"\n`;
  csvContent += `"Total Providers: ${providers.length}"\n`;
  csvContent += "\n"; // Empty line for separation

  // Add CSV headers
  csvContent += `"Provider Name","Provider Email","Total Slots","Campaign Slots","Normal Slots","Normal Slots (Details)","Campaign Slots (Details)"\n`;

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
    }
  });

  // Generate CSV content for each provider (including those with no slots)
  providers.forEach((provider) => {
    const data = providerAvailabilityMap.get(provider.provider_detail_id);
    const normalSlotsCount = data.normalSlots.length;
    const campaignSlotsCount = data.campaignSlots.length;
    const totalSlots = normalSlotsCount + campaignSlotsCount;

    if (totalSlots > 0) {
      const maxSlots = Math.max(normalSlotsCount, campaignSlotsCount);
      let providerInfoShown = false;

      for (let i = 0; i < maxSlots; i++) {
        const normalSlot = i < normalSlotsCount ? data.normalSlots[i] : "";
        const campaignSlot =
          i < campaignSlotsCount ? data.campaignSlots[i] : "";

        if (!providerInfoShown) {
          csvContent += `"${data.provider.name}","${data.provider.email}","${totalSlots}","${campaignSlotsCount}","${normalSlotsCount}","${normalSlot}","${campaignSlot}"\n`;
          providerInfoShown = true;
        } else {
          csvContent += `"","","","","","${normalSlot}","${campaignSlot}"\n`;
        }
      }
    } else {
      // Provider with no slots
      csvContent += `"${data.provider.name}","${data.provider.email}","0","0","0","No normal slots","No campaign slots"\n`;
    }

    csvContent += "\n"; // Empty line between providers
  });

  return csvContent;
};
