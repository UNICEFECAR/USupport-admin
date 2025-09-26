import * as yup from "yup";

export const FACTOR_TYPES = ["social", "biological", "psychological"];

export const createBaselineAssessmentThresholdSchema = yup.object().shape({
  country: yup.string().required(),
  factor: yup.string().oneOf(FACTOR_TYPES).required(),
  below: yup.number().integer().min(0).required(),
  above: yup.number().integer().min(0).required(),
});

export const updateBaselineAssessmentThresholdByIdSchema = yup.object().shape({
  country: yup.string().required(),
  baselineAssessmentThresholdId: yup.string().uuid().required(),
  factor: yup.string().oneOf(FACTOR_TYPES).required(),
  below: yup.number().integer().min(0).required(),
  above: yup.number().integer().min(0).required(),
});

export const getBaselineAssessmentThresholdByFactorSchema = yup.object().shape({
  country: yup.string().required(),
  factor: yup.string().oneOf(FACTOR_TYPES).required(),
});

export const getCompletedBaselineAssessmentsAnalysisSchema = yup
  .object()
  .shape({
    country: yup.string().required(),
    language: yup.string().required(),
    startDate: yup.string().nullable().notRequired(),
    endDate: yup.string().nullable().notRequired(),
  });
