import { getDBPool } from "#utils/dbConfig";

export const getQuestionReportsQuery = async ({ poolCountry }) => {
  return await getDBPool("clinicalDb", poolCountry).query(
    `
            SELECT question.question_id, question.question, question_report_log.reason, question_report_log.additional_text, question_report_log.provider_detail_id, question_report_log.created_at
            FROM question
                JOIN question_report_log ON question.question_id = question_report_log.question_id AND question_report_log.action = 'archive'
            WHERE question.status = 'archived'
            GROUP BY question.question_id, question_report_log.reason, question_report_log.additional_text, question_report_log.provider_detail_id, question_report_log.created_at
            ORDER BY question_report_log.created_at DESC
        `
  );
};

export const deleteQuestionQuery = async ({
  poolCountry,
  questionId,
  admin_id,
}) => {
  return await getDBPool("clinicalDb", poolCountry).query(
    `
        WITH inserted AS (
            UPDATE question
            SET status = 'deleted'
            FROM (SELECT 1 FROM question WHERE question_id = $1 AND status = 'archived') q
            WHERE question.question_id = $1
            RETURNING question.question_id
        )
        INSERT INTO question_report_log (question_id, admin_id, action)
        SELECT $1, $2, 'delete'
        WHERE EXISTS (SELECT 1 FROM inserted);
    `,
    [questionId, admin_id]
  );
};

export const activateQuestionQuery = async ({
  poolCountry,
  questionId,
  admin_id,
}) => {
  return await getDBPool("clinicalDb", poolCountry).query(
    `
        WITH inserted AS (
            UPDATE question
            SET status = 'active'
            FROM (SELECT 1 FROM question WHERE question_id = $1 AND (status = 'archived' OR status = 'deleted')) q
            WHERE question.question_id = $1
            RETURNING question.question_id
        )
        INSERT INTO question_report_log (question_id, admin_id, action)
        SELECT $1, $2, 'activate'
        WHERE EXISTS (SELECT 1 FROM inserted);
     `,
    [questionId, admin_id]
  );
};
