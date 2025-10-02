import { getDBPool } from "#utils/dbConfig";

export const getAllBaselineAssessmentThresholdsQuery = async (country) =>
  await getDBPool("clinicalDb", country).query(
    `
      SELECT baseline_assessment_threshold_id, factor, below, above, created_at, updated_at
      FROM "baseline_assessment_threshold"
      ORDER BY "factor" ASC
    `
  );

export const getBaselineAssessmentThresholdByFactorQuery = async ({
  factor,
  country,
}) =>
  await getDBPool("clinicalDb", country).query(
    `
      SELECT baseline_assessment_threshold_id, factor, below, above, created_at, updated_at
      FROM "baseline_assessment_threshold"
      WHERE "factor" = $1
      LIMIT 1
    `,
    [factor]
  );

export const createBaselineAssessmentThresholdQuery = async ({
  factor,
  below,
  above,
}) =>
  await getDBPool("clinicalDb").query(
    `
      INSERT INTO "baseline_assessment_threshold" (factor, below, above)
      VALUES ($1, $2, $3)
      RETURNING baseline_assessment_threshold_id, factor, below, above, created_at, updated_at
    `,
    [factor, below, above]
  );

export const getBaselineAssessmentThresholdByIdQuery = async ({
  baselineAssessmentThresholdId,
  country,
}) =>
  await getDBPool("clinicalDb", country).query(
    `
     SELECT * FROM "baseline_assessment_threshold"
     WHERE baseline_assessment_threshold_id = $1
     LIMIT 1`,
    [baselineAssessmentThresholdId]
  );

export const updateBaselineAssessmentThresholdByIdQuery = async ({
  baselineAssessmentThresholdId,
  factor,
  below,
  above,
  country,
}) =>
  await getDBPool("clinicalDb", country).query(
    `
      UPDATE "baseline_assessment_threshold" 
      SET factor = $2, below = $3, above = $4, updated_at = NOW()
      WHERE baseline_assessment_threshold_id = $1
      RETURNING baseline_assessment_threshold_id, factor, below, above, created_at, updated_at
    `,
    [baselineAssessmentThresholdId, factor, below, above]
  );

export const getAllCompletedBaselineAssessmentsWithAnswersQuery = async ({
  country,
  startDate,
  endDate,
}) => {
  const query = `
      SELECT 
        ss.baseline_assessment_id,
        ss.client_detail_id,
        ss.completed_at,
        ss.psychological_score,
        ss.biological_score,
        ss.social_score,
        ss.created_at,
        json_agg(
          json_build_object(
            'question_id', sa.question_id,
            'answer_value', sa.answer_value,
            'dimension', sq.dimension
          ) ORDER BY sq.position
        ) as answers
      FROM baseline_assessment_session ss
      INNER JOIN baseline_assessment_answer sa 
        ON ss.baseline_assessment_id = sa.baseline_assessment_id
      INNER JOIN baseline_assessment_question sq 
        ON sa.question_id = sq.question_id
      WHERE ss.status = 'completed'
        AND ($1::timestamptz IS NULL OR ss.created_at >= $1)
        AND ($2::timestamptz IS NULL OR ss.created_at <= $2)
      GROUP BY 
        ss.baseline_assessment_id, 
        ss.client_detail_id,
        ss.completed_at, 
        ss.psychological_score, 
        ss.biological_score, 
        ss.social_score
      ORDER BY ss.created_at ASC
    `;

  return await getDBPool("clinicalDb", country).query(query, [
    startDate || null,
    endDate || null,
  ]);
};
