import {
  getAllSponsorsQuery,
  createSponsorQuery,
  updateSponsorQuery,
  createCampaignForSponsorQuery,
  getSponsorAndCampaignDataByIdQuery,
  getUsedCouponsForCampaignQuery,
  getCouponsDataForCampaignQuery,
  updateCampaignDataQuery,
  getSponsorByEmail,
  getCampignByCouponCode,
  getCampaignDataByIdQuery,
} from "#queries/sponsors";

import {
  sponsorEmailAlreadyExists,
  campaignCodeAlreadyExists,
  campaignNotFound,
} from "#utils/errors";

import { getMultipleProvidersDataByIDs } from "#queries/providers";
import { getMultipleClientsDataByIDs } from "#queries/clients";
import { getClientInitials } from "#utils/helperFunctions";

export const getAllSponsors = async ({ country }) => {
  return await getAllSponsorsQuery({ poolCountry: country })
    .then((res) => {
      if (res.rowCount === 0) {
        return [];
      } else {
        return res.rows;
      }
    })
    .catch((err) => {
      throw err;
    });
};

export const createSponsor = async ({
  country,
  name,
  email,
  phone,
  image,
  language,
}) => {
  const sponsorEmailExists = await getSponsorByEmail({
    poolCountry: country,
    email,
  })
    .then((res) => {
      if (res.rowCount === 0) {
        return false;
      } else {
        return true;
      }
    })
    .catch((err) => {
      throw err;
    });

  if (sponsorEmailExists) {
    throw sponsorEmailAlreadyExists(language);
  }

  return await createSponsorQuery({
    poolCountry: country,
    name,
    email,
    phone,
    image,
  })
    .then((res) => {
      if (res.rowCount === 0) {
        return [];
      } else {
        return res.rows[0];
      }
    })
    .catch((err) => {
      throw err;
    });
};

export const updateSponsor = async ({
  country,
  sponsor_id,
  name,
  email,
  phone,
  image,
}) => {
  return await updateSponsorQuery({
    poolCountry: country,
    sponsor_id,
    name,
    email,
    phone,
    image,
  })
    .then((res) => {
      if (res.rowCount === 0) {
        // TODO: Add error here
        return [];
      } else {
        return res.rows;
      }
    })
    .catch((err) => {
      throw err;
    });
};

export const createCampaignForSponsor = async ({
  language,
  country,
  sponsor_id,
  name,
  couponCode,
  budget,
  numberOfCoupons,
  maxCouponsPerClient,
  startDate,
  endDate,
  termsAndConditions,
  active,
}) => {
  const doesCampaignCodeExist = await getCampignByCouponCode({
    poolCountry: country,
    couponCode,
  })
    .then((res) => {
      if (res.rowCount === 0) {
        return false;
      } else {
        return true;
      }
    })
    .catch((err) => {
      throw err;
    });

  if (doesCampaignCodeExist) {
    throw campaignCodeAlreadyExists(language);
  }

  return await createCampaignForSponsorQuery({
    poolCountry: country,
    sponsor_id,
    name,
    couponCode,
    budget,
    numberOfCoupons,
    maxCouponsPerClient,
    startDate,
    endDate,
    termsAndConditions,
    active,
  })
    .then((res) => {
      if (res.rowCount === 0) {
        return [];
      } else {
        return res.rows[0];
      }
    })
    .catch((err) => {
      throw err;
    });
};

export const updateCampaignData = async ({
  country,
  campaign_id,
  name,
  couponCode,
  budget,
  numberOfCoupons,
  maxCouponsPerClient,
  startDate,
  endDate,
  termsAndConditions,
  active,
}) => {
  console.log(active, "active in controller");
  // TODO: Check if the campaign's coupon code is changed
  // And if it is check if it already exists

  // const doesCampaignCodeExist = await getCampignByCouponCode({
  //   poolCountry: country,
  //   couponCode,
  // })
  //   .then((res) => {
  //     if (res.rowCount === 0) {
  //       return false;
  //     } else {
  //       return true;
  //     }
  //   })
  //   .catch((err) => {
  //     throw err;
  //   });

  // if (doesCampaignCodeExist) {
  //   throw campaignCodeAlreadyExists(language);
  // }

  return await updateCampaignDataQuery({
    poolCountry: country,
    campaignId: campaign_id,
    name,
    couponCode,
    budget,
    numberOfCoupons,
    maxCouponsPerClient,
    startDate,
    endDate,
    termsAndConditions,
    active,
  })
    .then((res) => {
      if (res.rowCount === 0) {
        return [];
      } else {
        return res.rows[0];
      }
    })
    .catch((err) => {
      throw err;
    });
};

export const getSponsorDataById = async ({ country, sponsor_id }) => {
  const sponsorData = await getSponsorAndCampaignDataByIdQuery({
    poolCountry: country,
    sponsor_id,
  })
    .then((res) => {
      if (res.rowCount === 0) {
        return [];
      } else {
        return res.rows[0];
      }
    })
    .catch((err) => {
      throw err;
    });

  sponsorData.campaigns_data = sponsorData.campaigns_data?.filter(
    (x) => x !== null
  );

  // Create an array of unique campaign ids
  const campaignIds = Array.from(
    new Set(sponsorData.campaigns_data.map((x) => x?.campaign_id))
  );

  // Get all used coupons for the campaigns
  const couponData = await getUsedCouponsForCampaignQuery({
    poolCountry: country,
    campaignIds,
  }).then((res) => {
    if (res.rowCount === 0) {
      return [];
    } else {
      return res.rows;
    }
  });
  sponsorData.campaigns_data.forEach((data, index) => {
    const coupons = couponData.filter(
      (x) => x.campaign_id === data.campaign_id
    );

    sponsorData.campaigns_data[index].coupons = [...coupons];
  });

  return sponsorData;
};

export const getCouponsDataForCampaign = async ({ country, campaign_id }) => {
  const couponData = await getCouponsDataForCampaignQuery({
    poolCountry: country,
    campaignId: campaign_id,
  }).then((res) => {
    if (res.rowCount === 0) {
      return [];
    } else {
      return res.rows;
    }
  });

  const providerIds = Array.from(
    new Set(couponData.map((x) => x.provider_detail_id))
  );

  const clientIds = Array.from(
    new Set(couponData.map((x) => x.client_detail_id))
  );

  const providersData = await getMultipleProvidersDataByIDs({
    poolCountry: country,
    providerDetailIds: providerIds,
  })
    .then((res) => {
      if (res.rowCount === 0) {
        return [];
      } else {
        return res.rows;
      }
    })
    .catch((err) => {
      throw err;
    });

  const clientsData = await getMultipleClientsDataByIDs({
    poolCountry: country,
    clientDetailIds: clientIds,
  }).then((res) => {
    if (res.rowCount === 0) {
      return [];
    } else {
      return res.rows;
    }
  });

  couponData.forEach((data, index) => {
    const providerData = providersData.find(
      (x) => x.provider_detail_id === data.provider_detail_id
    );

    const clientData = clientsData.find(
      (x) => x.client_detail_id === data.client_detail_id
    );

    const clientName = getClientInitials(clientData);

    couponData[index].provider_data = { ...providerData };
    couponData[index].client_data = {
      name: clientName,
      place_of_living: clientData.urban_rural,
      year_of_birth: clientData.year_of_birth,
      sex: clientData.sex,
    };
  });

  return couponData;
};

export const getCampaignDataById = async ({
  country,
  campaign_id,
  language,
}) => {
  return await getCampaignDataByIdQuery({
    poolCountry: country,
    campaignId: campaign_id,
  }).then((res) => {
    if (res.rowCount === 0) {
      throw campaignNotFound(language);
    } else {
      return res.rows[0];
    }
  });
};
