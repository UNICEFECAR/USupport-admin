import {
  activateQuestionQuery,
  deleteQuestionQuery,
  getAllQuestionsQuery,
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

        const questionIds = Array.from(
          new Set(reports.map((report) => report.question_id))
        );
        const finalReports = [];
        // For each question id find the latest report
        questionIds.forEach((id) => {
          // Because there can be multiple reports for the same question we need to return only the latest one.
          // The reports are sorted by creation date so the first report in the array is the latest one.
          const report = reports.find((report) => report.question_id === id);
          finalReports.push(report);
        });

        for (let i = 0; i < finalReports.length; i++) {
          const providerDetail = providersDetails.find(
            (provider) =>
              provider.provider_detail_id === reports[i].provider_detail_id
          );

          finalReports[i].providerData = providerDetail;

          delete reports[i].provider_detail_id;
        }
        return finalReports;
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

export const getAllQuestions = async ({ country, type, languageId }) => {
  const questions = await getAllQuestionsQuery({
    poolCountry: country,
    type,
    languageId,
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

  if (type !== "unanswered") {
    // Get the details for all the providers
    const providerIds = Array.from(
      new Set(questions.map((x) => x.provider_detail_id))
    );
    const providersDetails = await getMultipleProvidersDataByIDs({
      poolCountry: country,
      providerDetailIds: providerIds,
    }).then((res) => {
      if (res.rowCount === 0) {
        return [];
      } else {
        return res.rows;
      }
    });

    for (let i = 0; i < questions.length; i++) {
      questions[i].providerData = providersDetails.find(
        (x) => x.provider_detail_id === questions[i].provider_detail_id
      );

      questions[i].tags = questions[i].tags.filter((x) => x);
      questions[i].likes = questions[i].likes?.length || 0;
      questions[i].dislikes = questions[i].dislikes?.length || 0;
    }
  }

  return questions;
};
