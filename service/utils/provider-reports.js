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

  // Create CSV header matching the sample format
  const headerColumns = [
    t("provider_name", language),
    t("provider_uuid", language),
    t("provider_email", language),
    t("total_slots", language),
    t("slot_type", language),
    t("organization_campaign", language),
    t("total_slots_campaign_organization", language),
    t("from", language),
    t("to", language),
    t("booked", language),
    t("from", language),
    t("to", language),
  ];

  csvContent += headerColumns.map((col) => `"${col}"`).join(",") + "\n";

  // Create a map of all providers with their data
  const providerDataMap = new Map();

  // Initialize all providers
  providers.forEach((provider) => {
    providerDataMap.set(provider.provider_detail_id, {
      uuid: provider.provider_detail_id,
      name: `${provider.name} ${provider.surname || ""}`.trim(),
      email: provider.email,
      normalSlots: [],
      campaignSlotsById: new Map(), // Map<campaign_id, {name, slots[]}>
      organizationSlotsById: new Map(), // Map<organization_id, {name, slots[]}>
      normalConsultations: [],
      campaignConsultationsById: new Map(), // Map<campaign_id, consultations[]>
      organizationConsultationsById: new Map(), // Map<organization_id, consultations[]>
    });
  });

  // Process availability data
  availability.forEach((record) => {
    const providerId = record.provider_detail_id;
    if (!providerDataMap.has(providerId)) return;

    const providerData = providerDataMap.get(providerId);

    // Process normal slots
    if (record.slots && record.slots.length > 0) {
      record.slots.forEach((slot) => {
        const slotDate = new Date(slot);
        if (slotDate >= startDate && slotDate <= endDate) {
          providerData.normalSlots.push(slotDate);
        }
      });
    }

    // Process campaign slots
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
        const slotTime = slot.time ? new Date(slot.time) : new Date(slot);
        if (slotTime >= startDate && slotTime <= endDate) {
          const campaignId = slot.campaign_id;
          const rawCampaignName = slot.campaign_name;
          const campaignName =
            rawCampaignName && rawCampaignName !== "Unknown Campaign"
              ? rawCampaignName
              : t("unknown_campaign", language);

          if (campaignId) {
            if (!providerData.campaignSlotsById.has(campaignId)) {
              providerData.campaignSlotsById.set(campaignId, {
                name: campaignName,
                slots: [],
              });
            }
            providerData.campaignSlotsById.get(campaignId).slots.push(slotTime);
          }
        }
      });
    }

    // Process organization slots
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
        const slotTime = slot.time ? new Date(slot.time) : new Date(slot);
        if (slotTime >= startDate && slotTime <= endDate) {
          const organizationId = slot.organization_id;
          const rawOrganizationName = slot.organization_name;
          const organizationName =
            rawOrganizationName &&
            rawOrganizationName !== "Unknown Organization"
              ? rawOrganizationName
              : t("unknown_organization", language);

          if (organizationId) {
            if (!providerData.organizationSlotsById.has(organizationId)) {
              providerData.organizationSlotsById.set(organizationId, {
                name: organizationName,
                slots: [],
              });
            }
            providerData.organizationSlotsById
              .get(organizationId)
              .slots.push(slotTime);
          }
        }
      });
    }
  });

  // Process consultation data from providers
  providers.forEach((provider) => {
    const providerData = providerDataMap.get(provider.provider_detail_id);
    if (!providerData) return;

    // Helper to parse date from string format "DD/MM/YYYY - HH:MM"
    const parseConsultationDate = (dateTimeString) => {
      const parts = dateTimeString.split(" - ");
      if (parts.length === 2) {
        const dateParts = parts[0].split("/");
        const timeParts = parts[1].split(":");
        if (dateParts.length === 3 && timeParts.length === 2) {
          return new Date(
            parseInt(dateParts[2]),
            parseInt(dateParts[1]) - 1,
            parseInt(dateParts[0]),
            parseInt(timeParts[0]),
            parseInt(timeParts[1])
          );
        }
      }
      return null;
    };

    // Process normal consultations - accept strings (legacy) or objects with time
    if (
      provider.normal_consultations_details &&
      provider.normal_consultations_details.length > 0
    ) {
      provider.normal_consultations_details.forEach((entry) => {
        let date = null;
        if (typeof entry === "string") {
          date = parseConsultationDate(entry);
        } else if (entry && entry.time) {
          date = parseTime(entry.time);
        }
        if (date && date >= startDate && date <= endDate) {
          providerData.normalConsultations.push(date);
        }
      });
    }

    // Process campaign consultations - grouped by campaign_id
    if (
      provider.campaign_consultations_details &&
      provider.campaign_consultations_details.length > 0
    ) {
      provider.campaign_consultations_details.forEach((consultation) => {
        const date = consultation.time;
        const campaignId = consultation.campaign_id;

        if (date && campaignId && date >= startDate && date <= endDate) {
          if (!providerData.campaignConsultationsById.has(campaignId)) {
            providerData.campaignConsultationsById.set(campaignId, []);
          }
          providerData.campaignConsultationsById.get(campaignId).push(date);
        }
      });
    }

    // Process organization consultations - grouped by organization_id
    if (
      provider.organization_consultations_details &&
      provider.organization_consultations_details.length > 0
    ) {
      provider.organization_consultations_details.forEach((consultation) => {
        const date = consultation.time;
        const organizationId = consultation.organization_id;

        if (date && organizationId && date >= startDate && date <= endDate) {
          if (!providerData.organizationConsultationsById.has(organizationId)) {
            providerData.organizationConsultationsById.set(organizationId, []);
          }
          providerData.organizationConsultationsById
            .get(organizationId)
            .push(date);
        }
      });
    }
  });

  // Helper function to format period - returns [from, to] dates
  const formatPeriod = (dates) => {
    if (!dates || dates.length === 0) return ["-", "-"];
    const earliest = new Date(Math.min(...dates.map((d) => d.getTime())));
    const latest = new Date(Math.max(...dates.map((d) => d.getTime())));
    return [formatDateToDDMMYYYY(earliest), formatDateToDDMMYYYY(latest)];
  };

  // Generate CSV rows
  providers.forEach((provider) => {
    const providerData = providerDataMap.get(provider.provider_detail_id);
    if (!providerData) return;

    // Calculate total slots for this provider
    let totalProviderSlots = providerData.normalSlots.length;
    providerData.campaignSlotsById.forEach(
      (data) => (totalProviderSlots += data.slots.length)
    );
    providerData.organizationSlotsById.forEach(
      (data) => (totalProviderSlots += data.slots.length)
    );

    const rows = [];

    // Add normal slots row (always show if there are normal slots OR if provider has no other slot types)
    if (
      providerData.normalSlots.length > 0 ||
      (providerData.campaignSlotsById.size === 0 &&
        providerData.organizationSlotsById.size === 0)
    ) {
      const slotsPeriod =
        providerData.normalSlots.length > 0
          ? formatPeriod(providerData.normalSlots)
          : ["-", "-"];
      const consultationsPeriod =
        providerData.normalConsultations.length > 0
          ? formatPeriod(providerData.normalConsultations)
          : ["-", "-"];

      rows.push([
        providerData.name,
        providerData.uuid,
        providerData.email,
        totalProviderSlots,
        // If there are no slots at all, show '-' for Slot Type
        providerData.normalSlots.length > 0
          ? t("slot_type_normal", language)
          : "-",
        "-",
        providerData.normalSlots.length,
        ...slotsPeriod,
        providerData.normalConsultations.length,
        ...consultationsPeriod,
      ]);
    }

    // Add campaign slots rows (sorted by campaign name)
    const campaignEntries = Array.from(
      providerData.campaignSlotsById.entries()
    ).sort((a, b) => a[1].name.localeCompare(b[1].name));

    campaignEntries.forEach(([campaignId, campaignData]) => {
      const consultations =
        providerData.campaignConsultationsById.get(campaignId) || [];

      const slotsPeriod = formatPeriod(campaignData.slots);
      const consultationsPeriod =
        consultations.length > 0 ? formatPeriod(consultations) : ["-", "-"];

      rows.push([
        providerData.name,
        providerData.uuid,
        providerData.email,
        totalProviderSlots,
        t("slot_type_campaign", language),
        campaignData.name,
        campaignData.slots.length,
        ...slotsPeriod,
        consultations.length,
        ...consultationsPeriod,
      ]);
    });

    // Add organization slots rows (sorted by organization name)
    const organizationEntries = Array.from(
      providerData.organizationSlotsById.entries()
    ).sort((a, b) => a[1].name.localeCompare(b[1].name));

    organizationEntries.forEach(([organizationId, organizationData]) => {
      const consultations =
        providerData.organizationConsultationsById.get(organizationId) || [];

      const slotsPeriod = formatPeriod(organizationData.slots);
      const consultationsPeriod =
        consultations.length > 0 ? formatPeriod(consultations) : ["-", "-"];

      rows.push([
        providerData.name,
        providerData.uuid,
        providerData.email,
        totalProviderSlots,
        t("slot_type_organization", language),
        organizationData.name,
        organizationData.slots.length,
        ...slotsPeriod,
        consultations.length,
        ...consultationsPeriod,
      ]);
    });

    // Add all rows for this provider to CSV
    rows.forEach((row) => {
      csvContent += row.map((cell) => `"${cell}"`).join(",") + "\n";
    });
  });

  return csvContent;
};

export const checkIfStartTimeIsBetweenStartAndEndTime = (
  startTime,
  endTime,
  currentTime
) => {
  const startTimeDate = new Date(startTime);
  const endTimeDate = new Date(endTime);
  const currentTimeDate = new Date(currentTime);

  return currentTimeDate >= startTimeDate && currentTimeDate <= endTimeDate;
};

export const normalizeDate = (value, type) => {
  if (!value) return null;

  // Convert to number if it's a string or number (Unix timestamp in seconds or milliseconds)
  let timestamp = typeof value === "string" ? Number(value) : value;

  // If the value is a Unix timestamp in seconds (less than a reasonable millisecond timestamp)
  // Convert to milliseconds. Timestamps less than 10000000000 are likely in seconds
  if (!isNaN(timestamp) && timestamp < 10000000000) {
    timestamp = timestamp * 1000;
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (type === "start") {
    date.setUTCHours(0, 0, 0, 0);
  } else {
    date.setUTCHours(23, 59, 59, 999);
  }

  return date.toISOString();
};

export const parseTime = (value) => {
  if (!value) return new Date();

  if (value instanceof Date) return value;

  if (typeof value === "string" && /[^\d]/.test(value)) {
    return new Date(value);
  }

  let timestamp = typeof value === "string" ? Number(value) : value;

  if (!isNaN(timestamp) && timestamp < 10000000000) {
    timestamp = timestamp * 1000;
  }

  return new Date(timestamp);
};

/**
 * Returns the hour (0-23) for a UTC instant when viewed in the given IANA timezone
 * Works without external libraries using Intl.DateTimeFormat
 */
export const getHourInTimezone = (value, timezone) => {
  const date = parseTime(value);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hourPart = parts.find((p) => p.type === "hour");
  return Number(hourPart?.value || 0);
};

/**
 * Convert a given instant to an ISO string representing the UTC moment corresponding to
 * the start/end of that local day in the provided timezone.
 * This handles DST correctly by iteratively reconciling the local components.
 */
export const normalizeDateInTimezone = (value, type, timezone) => {
  if (!value) return null;

  let timestamp = typeof value === "string" ? Number(value) : value;
  if (!isNaN(timestamp) && timestamp < 10000000000) {
    timestamp = timestamp * 1000;
  }

  const inputDate = new Date(timestamp);

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const toParts = (d) => {
    const partsArr = formatter.formatToParts(d);
    const obj = {};
    partsArr.forEach((p) => {
      if (p.type !== "literal") obj[p.type] = p.value;
    });
    return {
      year: Number(obj.year),
      month: Number(obj.month),
      day: Number(obj.day),
      hour: Number(obj.hour),
      minute: Number(obj.minute),
      second: Number(obj.second),
    };
  };

  const parts = toParts(inputDate);
  const target = {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: type === "start" ? 0 : 23,
    minute: type === "start" ? 0 : 59,
    second: type === "start" ? 0 : 59,
    ms: type === "start" ? 0 : 999,
  };

  // Initial UTC guess for the desired local time
  let guess = Date.UTC(
    target.year,
    target.month - 1,
    target.day,
    target.hour,
    target.minute,
    target.second,
    target.ms
  );

  // Iteratively adjust until the formatted local time matches the target components
  for (let i = 0; i < 6; i++) {
    const cur = toParts(new Date(guess));
    const desiredLocal = Date.UTC(
      target.year,
      target.month - 1,
      target.day,
      target.hour,
      target.minute,
      target.second,
      target.ms
    );
    const currentLocal = Date.UTC(
      cur.year,
      cur.month - 1,
      cur.day,
      cur.hour,
      cur.minute,
      cur.second,
      target.ms
    );
    const delta = desiredLocal - currentLocal;
    if (delta === 0) break;
    guess += delta;
  }

  return new Date(guess).toISOString();
};

/**
 * Formats a Date/epoch into 'DD/MM/YYYY - HH:MM' in a given timezone.
 */
export const formatDateTimeInTimezone = (value, timezone) => {
  const date = parseTime(value);
  const partsArr = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const parts = {};
  partsArr.forEach((p) => {
    if (p.type !== "literal") parts[p.type] = p.value;
  });
  return `${parts.day}/${parts.month}/${parts.year} - ${parts.hour}:${parts.minute}`;
};

/**
 * Validates an IANA timezone string
 */
export const isValidTimeZone = (timezone) => {
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: timezone }).format(new Date());
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Resolve a local wall-clock time (derived from a given date and explicit hh:mm:ss.ms)
 * to its corresponding UTC ISO string, for a specific timezone. DST-safe.
 */
export const resolveLocalTimeToUtcISO = (
  value,
  { hour = 0, minute = 0, second = 0, ms = 0 },
  timezone
) => {
  let timestamp = typeof value === "string" ? Number(value) : value;
  if (!isNaN(timestamp) && timestamp < 10000000000) {
    timestamp = timestamp * 1000;
  }
  const inputDate = new Date(timestamp);

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const toParts = (d) => {
    const partsArr = formatter.formatToParts(d);
    const obj = {};
    partsArr.forEach((p) => {
      if (p.type !== "literal") obj[p.type] = p.value;
    });
    return {
      year: Number(obj.year),
      month: Number(obj.month),
      day: Number(obj.day),
      hour: Number(obj.hour),
      minute: Number(obj.minute),
      second: Number(obj.second),
    };
  };

  const base = toParts(inputDate);

  // Initial UTC guess for the desired local time
  let guess = Date.UTC(
    base.year,
    base.month - 1,
    base.day,
    hour,
    minute,
    second,
    ms
  );

  // Iteratively adjust until the formatted local time matches the target components
  for (let i = 0; i < 6; i++) {
    const cur = toParts(new Date(guess));
    const desiredLocal = Date.UTC(
      base.year,
      base.month - 1,
      base.day,
      hour,
      minute,
      second,
      ms
    );
    const currentLocal = Date.UTC(
      cur.year,
      cur.month - 1,
      cur.day,
      cur.hour,
      cur.minute,
      cur.second,
      ms
    );
    const delta = desiredLocal - currentLocal;
    if (delta === 0) break;
    guess += delta;
  }

  return new Date(guess).toISOString();
};

/**
 * Build a UTC [start, end) range from local dates and hours in a timezone.
 * End is exclusive: endHour+1 at 00 minutes.
 */
export const buildUtcRangeForLocalHours = (
  startDateValue,
  endDateValue,
  startHour,
  endHour,
  timezone
) => {
  // Start at selected local day and hour
  const startUtcISO = resolveLocalTimeToUtcISO(
    startDateValue,
    { hour: Number(startHour) || 0, minute: 0, second: 0, ms: 0 },
    timezone
  );

  // End exclusive: endHour + 1 at 00:00; let Date.UTC roll into next day if 24
  const endExclusiveHour = (Number(endHour) || 0) + 1;
  const endUtcISO = resolveLocalTimeToUtcISO(
    endDateValue,
    { hour: endExclusiveHour, minute: 0, second: 0, ms: 0 },
    timezone
  );

  return { startUtcISO, endUtcISO };
};
