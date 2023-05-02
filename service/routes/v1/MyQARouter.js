import express from "express";

import {
  getQuestionReportsSchema,
  deleteQuestionSchema,
  getAllQuestionsSchema,
} from "#schemas/myQASchemas";

import {
  getQuestionReports,
  deleteQuestion,
  activateQuestion,
  getAllQuestions,
} from "#controllers/myQA";

const router = express.Router();

router.get("/archived", async (req, res, next) => {
  /**
   * #route   GET /admin/v1/my-qa/archived
   * #desc    Get reports for archived questions
   */
  const country = req.header("x-country-alpha-2");
  const language = req.header("x-language-alpha-2");

  return await getQuestionReportsSchema
    .noUnknown(true)
    .strict(true)
    .validate({ country, language })
    .then(getQuestionReports)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.put("/delete-question", async (req, res, next) => {
  /**
   * #route   PUT /admin/v1/my-qa/delete-question
   * #desc    Delete a question
   */
  const country = req.header("x-country-alpha-2");
  const language = req.header("x-language-alpha-2");
  const admin_id = req.header("x-admin-id");

  const { questionId } = req.body;

  return await deleteQuestionSchema
    .noUnknown(true)
    .strict(true)
    .validate({
      country,
      language,
      admin_id,
      questionId,
    })
    .then(deleteQuestion)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.put("/activate-question", async (req, res, next) => {
  /**
   * #route   PUT /admin/v1/my-qa/activate-question
   * #desc    Activate a question
   */
  const country = req.header("x-country-alpha-2");
  const language = req.header("x-language-alpha-2");
  const admin_id = req.header("x-admin-id");

  const { questionId } = req.body;

  return await deleteQuestionSchema
    .noUnknown(true)
    .strict(true)
    .validate({
      country,
      language,
      admin_id,
      questionId,
    })
    .then(activateQuestion)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.get("/questions", async (req, res, next) => {
  /**
   * #route   GET /admin/v1/my-qa/questions
   * #desc    Get  questions
   */
  const country = req.header("x-country-alpha-2");

  const { type } = req.query;

  return await getAllQuestionsSchema
    .noUnknown(true)
    .strict(true)
    .validate({ country, type })
    .then(getAllQuestions)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

export { router };
