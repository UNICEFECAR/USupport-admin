import express from "express";

import {
  getAllBaselineAssessmentThresholds,
  getBaselineAssessmentThresholdByFactor,
  createBaselineAssessmentThreshold,
  updateBaselineAssessmentThresholdById,
  getCompletedBaselineAssessmentsAnalysis,
} from "#controllers/baselineAssessment";

import {
  createBaselineAssessmentThresholdSchema,
  updateBaselineAssessmentThresholdByIdSchema,
  getBaselineAssessmentThresholdByFactorSchema,
  getCompletedBaselineAssessmentsAnalysisSchema,
} from "#schemas/baselineAssessmentSchemas";

const router = express.Router();

router
  .route("/")
  .get(async (req, res, next) => {
    /**
     * #route   GET /admin/v1/baseline-assessment
     * #desc    Get all baseline assessment thresholds
     */
    const language = req.header("x-language-alpha-2");
    const country = req.header("x-country-alpha-2");

    return await getAllBaselineAssessmentThresholds({ country })
      .then((result) => res.status(200).send(result))
      .catch(next);
  })
  .post(async (req, res, next) => {
    /**
     * #route   POST /admin/v1/baseline-assessment
     * #desc    Create a new baseline assessment threshold
     */
    const language = req.header("x-language-alpha-2");
    const country = req.header("x-country-alpha-2");
    const { factor, below, above } = req.body;

    return await createBaselineAssessmentThresholdSchema
      .noUnknown(true)
      .strict(true)
      .validate({ factor, below, above, country })
      .then((validatedData) =>
        createBaselineAssessmentThreshold({ ...validatedData, language })
      )
      .then((result) => res.status(201).send(result))
      .catch(next);
  });

router.route("/factor/:factor").get(async (req, res, next) => {
  /**
   * #route   GET /admin/v1/baseline-assessment/factor/:factor
   * #desc    Get baseline assessment threshold by factor
   */
  const language = req.header("x-language-alpha-2");
  const country = req.header("x-country-alpha-2");
  const { factor } = req.params;

  return await getBaselineAssessmentThresholdByFactorSchema
    .noUnknown(true)
    .strict(true)
    .validate({ factor, country })
    .then((validatedData) =>
      getBaselineAssessmentThresholdByFactor({ ...validatedData, language })
    )
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.route("/:id").put(async (req, res, next) => {
  /**
   * #route   PUT /admin/v1/baseline-assessment/:id
   * #desc    Update baseline assessment threshold by UUID
   */
  const language = req.header("x-language-alpha-2");
  const country = req.header("x-country-alpha-2");
  const { id: baselineAssessmentThresholdId } = req.params;
  const { factor, below, above } = req.body;

  return await updateBaselineAssessmentThresholdByIdSchema
    .noUnknown(true)
    .strict(true)
    .validate({
      baselineAssessmentThresholdId,
      factor,
      below,
      above,
      country,
    })
    .then((validatedData) =>
      updateBaselineAssessmentThresholdById({ ...validatedData, language })
    )
    .then((result) => res.status(200).send(result))
    .catch(next);
});

router.route("/analysis").get(async (req, res, next) => {
  /**
   * #route   GET /admin/v1/baseline-assessment/analysis
   * #desc    Get analysis of all completed baseline assessments with median calculations
   */
  const language = req.header("x-language-alpha-2");
  const country = req.header("x-country-alpha-2");
  const { startDate, endDate } = req.query;

  return await getCompletedBaselineAssessmentsAnalysisSchema
    .noUnknown(true)
    .strict(true)
    .validate({ country, language, startDate, endDate })
    .then(getCompletedBaselineAssessmentsAnalysis)
    .then((result) => res.status(200).send(result))
    .catch(next);
});

export { router };
