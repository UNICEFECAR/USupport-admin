import * as yup from "yup";

export const getQuestionReportsSchema = yup.object().shape({
  country: yup.string().required(),
  language: yup.string().required(),
});

export const deleteQuestionSchema = getQuestionReportsSchema.shape({
  admin_id: yup.string().uuid().required(),
  questionId: yup.string().uuid().required(),
});

export const getAllQuestionsSchema = yup.object().shape({
  country: yup.string().required(),
  type: yup.string().oneOf(["answered", "unanswered"]).required(),
  languageId: yup.string().required(),
});
