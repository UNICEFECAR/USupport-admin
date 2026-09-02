export const PEER_SUPPORT = "peer_support";

export const BASE_PROVIDER_SPECIALIZATIONS = [
  "psychologist",
  "psychotherapist",
  "psychiatrist",
];

export const ARMENIA_ONLY_SPECIALIZATIONS = [PEER_SUPPORT];

export const getProviderSpecializationsForCountry = (country) => {
  const specializations = [...BASE_PROVIDER_SPECIALIZATIONS];

  if (country?.toUpperCase() === "AM") {
    specializations.push(...ARMENIA_ONLY_SPECIALIZATIONS);
  }

  return specializations;
};

export const getAdminSpecializationFilterOptions = (country) => {
  const options = [...BASE_PROVIDER_SPECIALIZATIONS];

  if (country?.toUpperCase() === "AM") {
    options.push(...ARMENIA_ONLY_SPECIALIZATIONS);
  }

  return [...options, "any"];
};
