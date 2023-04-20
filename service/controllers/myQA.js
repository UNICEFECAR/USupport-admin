import {
  activateQuestionQuery,
  deleteQuestionQuery,
  getQuestionReportsQuery,
} from "#queries/myQA";

import { getMultipleProvidersDataByIDs } from "#queries/providers";

import { questionCantBeDeleted, questionCantBeActivated } from "#utils/errors";

export const getQuestionReports = async ({ country }) => {
  return await getQuestionReportsQuery({ poolCountry: country })
    .then(async (res) => {
      if (res.rowCount === 0) {
        return [];
      } else {
        const reports = res.rows;

        const providerIds = Array.from(
          new Set(reports.map((report) => report.provider_detail_id))
        );

        const providersDetails = await getMultipleProvidersDataByIDs({
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

        for (let i = 0; i < reports.length; i++) {
          const providerDetail = providersDetails.find(
            (provider) =>
              provider.provider_detail_id === reports[i].provider_detail_id
          );

          reports[i].providerData = providerDetail;

          delete reports[i].provider_detail_id;
        }
        return reports;
      }
    })
    .catch((err) => {
      throw err;
    });
};

export const deleteQuestion = async ({
  country,
  language,
  questionId,
  admin_id,
}) => {
  return await deleteQuestionQuery({
    poolCountry: country,
    language,
    questionId,
    admin_id,
  })
    .then((res) => {
      if (res.rowCount === 0) {
        throw questionCantBeDeleted(language);
      } else {
        return { success: true };
      }
    })
    .catch((err) => {
      throw err;
    });
};

export const activateQuestion = async ({
  country,
  language,
  questionId,
  admin_id,
}) => {
  return await activateQuestionQuery({
    poolCountry: country,
    language,
    questionId,
    admin_id,
  })
    .then((res) => {
      if (res.rowCount === 0) {
        throw questionCantBeActivated(language);
      } else {
        return { success: true };
      }
    })
    .catch((err) => {
      throw err;
    });
};
