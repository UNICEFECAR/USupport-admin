import {
  getAllBaselineAssessmentThresholdsQuery,
  getBaselineAssessmentThresholdByFactorQuery,
  createBaselineAssessmentThresholdQuery,
  updateBaselineAssessmentThresholdByIdQuery,
  getAllCompletedBaselineAssessmentsWithAnswersQuery,
} from "#queries/baselineAssessment";

import { baselineAssessmentThresholdNotFound as notFound } from "#utils/errors";
import { calculateBaselineAssessmentScore } from "#utils/helperFunctions";

export const getAllBaselineAssessmentThresholds = async ({ country }) => {
  return await getAllBaselineAssessmentThresholdsQuery(country)
    .then((res) => {
      if (res.rowCount === 0) {
        return [];
      }
      return res.rows;
    })
    .catch((err) => {
      throw err;
    });
};

export const getBaselineAssessmentThresholdByFactor = async ({
  factor,
  language,
}) => {
  return await getBaselineAssessmentThresholdByFactorQuery({ factor })
    .then((res) => {
      if (res.rowCount === 0) {
        throw notFound(language, "baseline_assessment_threshold_not_found");
      }
      return res.rows[0];
    })
    .catch((err) => {
      throw err;
    });
};

export const createBaselineAssessmentThreshold = async ({
  factor,
  below,
  above,
  language,
}) => {
  // Check if threshold for this factor already exists
  try {
    const existingThreshold = await getBaselineAssessmentThresholdByFactorQuery(
      { factor }
    );
    if (existingThreshold.rowCount > 0) {
      // throw duplicateEntry(
      //   language,
      //   "baseline_assessment_threshold_already_exists"
      // );
    }
  } catch (error) {
    // If it's not a database error (i.e., no existing threshold found), continue
    if (error.status !== 404) {
      throw error;
    }
  }

  // Validate that below value is less than above value
  if (below >= above) {
    throw new Error("Below value must be less than above value");
  }

  return await createBaselineAssessmentThresholdQuery({ factor, below, above })
    .then((res) => {
      return res.rows[0];
    })
    .catch((err) => {
      throw err;
    });
};

export const updateBaselineAssessmentThresholdById = async ({
  baselineAssessmentThresholdId,
  factor,
  below,
  above,
  language,
  country,
}) => {
  // Validate that below value is less than above value
  if (below >= above) {
    throw new Error("Below value must be less than above value");
  }

  return await updateBaselineAssessmentThresholdByIdQuery({
    baselineAssessmentThresholdId,
    factor,
    below,
    above,
    country,
  })
    .then((res) => {
      if (res.rowCount === 0) {
        throw notFound(language);
      }

      return res.rows[0];
    })
    .catch((err) => {
      throw err;
    });
};

/**
 * Calculate median value for an array of numbers
 */
const calculateMedian = (values) => {
  if (values.length === 0) return 0;

  const sortedValues = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sortedValues.length / 2);

  if (sortedValues.length % 2 === 0) {
    return (sortedValues[middle - 1] + sortedValues[middle]) / 2;
  } else {
    return sortedValues[middle];
  }
};

export const getCompletedBaselineAssessmentsAnalysis = async ({
  country,
  language,
  startDate: providedStartDate,
  endDate: providedEndDate,
}) => {
  try {
    const startDate = providedStartDate ? new Date(providedStartDate) : null;
    const endDate = providedEndDate ? new Date(providedEndDate) : null;

    if (startDate && endDate && startDate > endDate) {
      throw new Error("Start date cannot be after end date");
    }

    // Get all completed baseline assessments with their answers
    const assessmentsResult =
      await getAllCompletedBaselineAssessmentsWithAnswersQuery({
        country,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
      });

    if (assessmentsResult.rowCount === 0) {
      return {
        totalAssessments: 0,
        message: "No completed baseline assessments found",
      };
    }

    const assessments = assessmentsResult.rows;
    const totalAssessments = assessments.length;

    const firstAssessment = assessments[0];

    const { psychologicalQuestions, biologicalQuestions, socialQuestions } =
      firstAssessment.answers.reduce(
        (acc, answer) => {
          if (answer.dimension === "psychological") {
            acc.psychologicalQuestions.push(answer.question_id);
          } else if (answer.dimension === "biological") {
            acc.biologicalQuestions.push(answer.question_id);
          } else if (answer.dimension === "social") {
            acc.socialQuestions.push(answer.question_id);
          }
          return acc;
        },
        {
          psychologicalQuestions: [],
          biologicalQuestions: [],
          socialQuestions: [],
        }
      );

    let result = {};

    if (totalAssessments < 10) {
      const { psychologicalValues, biologicalValues, socialValues } =
        assessments.reduce(
          (acc, assessment) => {
            acc.psychologicalValues.push(assessment.psychological_score);
            acc.biologicalValues.push(assessment.biological_score);
            acc.socialValues.push(assessment.social_score);
            return acc;
          },
          { psychologicalValues: [], biologicalValues: [], socialValues: [] }
        );

      result = {
        totalAssessments,
        isSplit: false,
        analysis: {
          psychological: {
            median: calculateMedian(psychologicalValues),
            count: psychologicalValues.length * psychologicalQuestions.length,
          },
          biological: {
            median: calculateMedian(biologicalValues),
            count: biologicalValues.length * biologicalQuestions.length,
          },
          social: {
            median: calculateMedian(socialValues),
            count: socialValues.length * socialQuestions.length,
          },
        },
        assessments: assessments,
      };
    } else {
      const splitIndex = Math.floor(totalAssessments / 2);
      const firstHalf = assessments.slice(0, splitIndex);
      const secondHalf = assessments.slice(splitIndex);

      const firstHalfFirstAssessment = firstHalf[0];
      const firstHalfLastAssessment = firstHalf[firstHalf.length - 1];

      const secondHalfFirstAssessment = secondHalf[0];
      const secondHalfLastAssessment = secondHalf[secondHalf.length - 1];

      const firstHalfFirstDate = firstHalfFirstAssessment.created_at;
      const firstHalfLastDate = firstHalfLastAssessment.created_at;

      const secondHalfFirstDate = secondHalfFirstAssessment.created_at;
      const secondHalfLastDate = secondHalfLastAssessment.created_at;

      const { firstHalfPsychological, firstHalfBiological, firstHalfSocial } =
        firstHalf.reduce(
          (acc, assessment) => {
            acc.firstHalfPsychological.push(assessment.psychological_score);
            acc.firstHalfBiological.push(assessment.biological_score);
            acc.firstHalfSocial.push(assessment.social_score);
            return acc;
          },
          {
            firstHalfPsychological: [],
            firstHalfBiological: [],
            firstHalfSocial: [],
          }
        );

      const {
        secondHalfPsychological,
        secondHalfBiological,
        secondHalfSocial,
      } = secondHalf.reduce(
        (acc, assessment) => {
          acc.secondHalfPsychological.push(assessment.psychological_score);
          acc.secondHalfBiological.push(assessment.biological_score);
          acc.secondHalfSocial.push(assessment.social_score);
          return acc;
        },
        {
          secondHalfPsychological: [],
          secondHalfBiological: [],
          secondHalfSocial: [],
        }
      );

      result = {
        totalAssessments,
        isSplit: true,
        splitAt: splitIndex,
        analysis: {
          firstHalf: {
            firstDate: firstHalfFirstDate,
            lastDate: firstHalfLastDate,
            count: firstHalf.length,
            psychological: {
              median: calculateMedian(firstHalfPsychological),
              count: firstHalfPsychological.length,
            },
            biological: {
              median: calculateMedian(firstHalfBiological),
              count: firstHalfBiological.length,
            },
            social: {
              median: calculateMedian(firstHalfSocial),
              count: firstHalfSocial.length,
            },
          },
          secondHalf: {
            firstDate: secondHalfFirstDate,
            lastDate: secondHalfLastDate,
            count: secondHalf.length,
            psychological: {
              median: calculateMedian(secondHalfPsychological),
              count: secondHalfPsychological.length,
            },
            biological: {
              median: calculateMedian(secondHalfBiological),
              count: secondHalfBiological.length,
            },
            social: {
              median: calculateMedian(secondHalfSocial),
              count: secondHalfSocial.length,
            },
          },
        },
        assessments: {
          firstHalf: firstHalf,
          secondHalf: secondHalf,
        },
      };
    }

    const nonAnonimizedAssesments = assessments.filter(
      (assessment) => assessment.client_detail_id !== null
    );
    const nonAnonimizedWithScore = await Promise.all(
      nonAnonimizedAssesments.map(async (assessment) => {
        return {
          clientDetailId: assessment.client_detail_id,
          baselineAssessmentId: assessment.baseline_assessment_id,
          score: await calculateBaselineAssessmentScore(
            {
              psychological: assessment.psychological_score,
              biological: assessment.biological_score,
              social: assessment.social_score,
            },
            country
          ),
        };
      })
    );

    const factorsOverview = nonAnonimizedWithScore.reduce(
      (acc, assessment) => {
        // if the score is low, add 1 to the low count, if the score is high add 1 to the high count
        if (assessment.score.psychological === "low") {
          acc.psychologicalLow++;
        } else if (assessment.score.psychological === "high") {
          acc.psychologicalHigh++;
        }
        if (assessment.score.biological === "low") {
          acc.biologicalLow++;
        } else if (assessment.score.biological === "high") {
          acc.biologicalHigh++;
        }
        if (assessment.score.social === "low") {
          acc.socialLow++;
        } else if (assessment.score.social === "high") {
          acc.socialHigh++;
        }
        return acc;
      },
      {
        psychologicalLow: 0,
        psychologicalHigh: 0,
        biologicalLow: 0,
        biologicalHigh: 0,
        socialLow: 0,
        socialHigh: 0,
      }
    );

    result.analysis.psychological.belowCount = factorsOverview.psychologicalLow;
    result.analysis.psychological.aboveCount =
      factorsOverview.psychologicalHigh;

    result.analysis.biological.belowCount = factorsOverview.biologicalLow;
    result.analysis.biological.aboveCount = factorsOverview.biologicalHigh;

    result.analysis.social.belowCount = factorsOverview.socialLow;
    result.analysis.social.aboveCount = factorsOverview.socialHigh;

    console.log(factorsOverview);
    return result;
  } catch (err) {
    console.log("Error in getCompletedBaselineAssessmentsAnalysis:", err);
    throw err;
  }
};
