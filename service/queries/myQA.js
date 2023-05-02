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

export const getAllQuestionsQuery = async ({ poolCountry, type }) => {
  return await getDBPool("clinicalDb", poolCountry).query(
    `
      SELECT 
        question.question, 
        question.created_at as question_created_at, 
        question.question_id as question_id,
        answer.answer_id as answer_id,
        answer.created_at as answer_created_at, 
        answer.title AS answer_title, 
        answer.text AS answer_text, 
        answer.provider_detail_id,
        answer.likes,
        answer.dislikes,
        array_agg(tags.tag) as tags
      FROM question
          LEFT JOIN answer on question.question_id = answer.question_id
          LEFT JOIN answer_tags_links on answer_tags_links.answer_id = answer.answer_id
          LEFT JOIN tags on answer_tags_links.tag_id = tags.tag_id
      WHERE  question.status = 'active' AND
           CASE WHEN $1 = 'answered' THEN answer.answer_id IS NOT NULL
                ELSE answer.answer_id IS NULL END
      GROUP BY question.question, answer.answer_id, question.created_at, question.question_id
      ORDER BY question.created_at DESC;
      `,
    [type]
  );
};
