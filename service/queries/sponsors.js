import { getDBPool } from "#utils/dbConfig";

export const getSponsorByEmail = ({ poolCountry, email }) => {
  const pool = getDBPool("piiDb", poolCountry);
  return pool.query(
    `
        SELECT * FROM sponsor WHERE email = $1
    `,
    [email]
  );
};

export const getAllSponsorsQuery = ({ poolCountry }) => {
  const pool = getDBPool("piiDb", poolCountry);
  return pool.query(
    `
        SELECT sponsor.sponsor_id, sponsor.name, email, phone_prefix, phone, image, 
               COUNT(*) FILTER (WHERE active = true) AS active_campaigns, COUNT(*) FILTER (WHERE coupon_code IS NOT NULL) AS total_campaigns
        FROM sponsor
           LEFT JOIN campaign ON sponsor.sponsor_id = campaign.sponsor_id
        GROUP BY sponsor.sponsor_id
        `
  );
};

export const getSponsorAndCampaignDataByIdQuery = ({
  poolCountry,
  sponsor_id,
}) => {
  const pool = getDBPool("piiDb", poolCountry);
  return pool.query(
    `
        SELECT sponsor.*, json_agg(campaign.*) as campaigns_data
        FROM sponsor
            LEFT JOIN campaign ON sponsor.sponsor_id = campaign.sponsor_id
        WHERE sponsor.sponsor_id = $1
        GROUP BY sponsor.sponsor_id
    `,
    [sponsor_id]
  );
};

export const getCampignByCouponCode = ({ poolCountry, couponCode }) => {
  const pool = getDBPool("piiDb", poolCountry);
  return pool.query(
    `
        SELECT * FROM campaign WHERE coupon_code = $1
    `,
    [couponCode]
  );
};

export const createSponsorQuery = ({
  poolCountry,
  name,
  email,
  phonePrefix,
  phone,
  image,
}) => {
  const pool = getDBPool("piiDb", poolCountry);
  return pool.query(
    `
        INSERT INTO sponsor (name, email, phone_prefix, phone, image) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `,
    [name, email, phonePrefix, phone, image]
  );
};

export const updateSponsorQuery = ({
  poolCountry,
  sponsor_id,
  name,
  email,
  phonePrefix,
  phone,
  image,
}) => {
  const pool = getDBPool("piiDb", poolCountry);
  return pool.query(
    `
        UPDATE sponsor
        SET name = $1, email = $2, phone_prefix = $3, phone = $4, image = $5
        WHERE sponsor_id = $6
        RETURNING *
    `,
    [name, email, phonePrefix, phone, image, sponsor_id]
  );
};

export const createCampaignForSponsorQuery = async ({
  poolCountry,
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
  const pool = getDBPool("piiDb", poolCountry);
  const pricePerCoupon = (budget / numberOfCoupons).toFixed(2);
  return pool.query(
    `
        INSERT INTO campaign
        (sponsor_id, name, coupon_code, budget, no_coupons, price_per_coupon, max_coupons_per_client, start_date, end_date, terms_and_conditions, active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, to_timestamp($8), to_timestamp($9), $10, $11)
        RETURNING *
    `,
    [
      sponsor_id,
      name,
      couponCode,
      budget,
      numberOfCoupons,
      pricePerCoupon,
      maxCouponsPerClient,
      startDate,
      endDate,
      termsAndConditions,
      active,
    ]
  );
};

export const getUsedCouponsForCampaignQuery = async ({
  poolCountry,
  campaignIds,
}) => {
  const pool = getDBPool("clinicalDb", poolCountry);
  return pool.query(
    `
        SELECT transaction_log.campaign_id, transaction_log.consultation_id, COUNT(*) AS used_coupons
        FROM transaction_log
          JOIN consultation ON consultation.consultation_id = transaction_log.consultation_id AND (consultation.status = 'finished' OR consultation.status = 'scheduled')
        WHERE transaction_log.campaign_id = ANY($1)
        GROUP BY transaction_log.campaign_id, transaction_log.consultation_id
    `,
    [campaignIds]
  );
};

export const getCouponsDataForCampaignQuery = async ({
  poolCountry,
  campaignId,
}) => {
  const pool = getDBPool("clinicalDb", poolCountry);
  return pool.query(
    `
        SELECT transaction_log.consultation_id, transaction_log.created_at, type, consultation.provider_detail_id, consultation.client_detail_id
        FROM transaction_log
          INNER JOIN consultation on consultation.consultation_id = transaction_log.consultation_id AND (consultation.status = 'finished' OR consultation.status = 'scheduled')
        WHERE transaction_log.campaign_id = $1
    `,
    [campaignId]
  );
};

export const getMulltipleProviderIdsByConsultationIds = async ({
  poolCountry,
  consultationIds,
}) => {
  const pool = getDBPool("clinicalDb", poolCountry);
  return pool.query(
    `
        SELECT provider_detail_id
        FROM consultation
        WHERE consultation_id = ANY($1)
    `,
    [consultationIds]
  );
};

export const updateCampaignDataQuery = async ({
  poolCountry,
  campaignId,
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
  const pool = getDBPool("piiDb", poolCountry);
  const pricePerCoupon = budget / numberOfCoupons;
  return pool.query(
    `
        UPDATE campaign
        SET name = $1, coupon_code = $2, budget = $3, no_coupons = $4, price_per_coupon = $5, max_coupons_per_client = $6, start_date = to_timestamp($7), end_date = to_timestamp($8), terms_and_conditions = $9, active = $10
        WHERE campaign_id = $11
        RETURNING *
    `,
    [
      name,
      couponCode,
      budget,
      numberOfCoupons,
      pricePerCoupon,
      maxCouponsPerClient,
      startDate,
      endDate,
      termsAndConditions,
      active,
      campaignId,
    ]
  );
};

export const getCampaignNamesByIds = async ({ poolCountry, campaignIds }) => {
  return getDBPool("piiDb", poolCountry).query(
    `
        SELECT campaign_id, name
        FROM campaign
        WHERE campaign_id = ANY($1)
    `,
    [campaignIds]
  );
};

export const getCampaignDataByIdQuery = async ({ poolCountry, campaignId }) => {
  return getDBPool("piiDb", poolCountry).query(
    `
        SELECT *
        FROM campaign
        WHERE campaign_id = $1
    `,
    [campaignId]
  );
};
