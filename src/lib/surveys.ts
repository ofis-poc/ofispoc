import { query } from './db';
import { Survey, SurveyQuestion, Farmer } from '@/types';


interface DbSurveyRow {
  id: string;
  name: string;
  description: string | null;
  status: 'Draft' | 'Published';
  languages: string[];
  created_at: Date | string;
  question_count?: string | number;
}

interface DbQuestionRow {
  id: string;
  survey_id: string;
  question_en: string;
  question_hi: string | null;
  question_es: string | null;
  question_th: string | null;
  options_en: string[] | null;
  options_hi: string[] | null;
  options_es: string[] | null;
  options_th: string[] | null;
  question_type: string;
  question_order: number;
  required: boolean;
}

function mapRowToSurvey(row: DbSurveyRow): Survey {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    status: row.status,
    languages: Array.isArray(row.languages) ? row.languages : ['English'],
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
    questionCount: row.question_count !== undefined ? parseInt(String(row.question_count), 10) : 0,
  };
}

function mapRowToQuestion(row: DbQuestionRow): SurveyQuestion {
  return {
    id: row.id,
    surveyId: row.survey_id,
    questionEn: row.question_en,
    questionHi: row.question_hi || undefined,
    questionEs: row.question_es || undefined,
    questionTh: row.question_th || undefined,
    optionsEn: Array.isArray(row.options_en) ? row.options_en : undefined,
    optionsHi: Array.isArray(row.options_hi) ? row.options_hi : undefined,
    optionsEs: Array.isArray(row.options_es) ? row.options_es : undefined,
    optionsTh: Array.isArray(row.options_th) ? row.options_th : undefined,
    questionType: row.question_type as any,
    questionOrder: row.question_order,
    required: !!row.required,
  };
}

/**
 * Fetch all surveys from PostgreSQL with question counts.
 */
export async function getSurveys(): Promise<Survey[]> {
  try {
    const sql = `
      SELECT s.*, COUNT(q.id) as question_count 
      FROM "ofis-farmer".surveys s 
      LEFT JOIN "ofis-farmer".survey_questions q ON s.id = q.survey_id 
      GROUP BY s.id, s.name, s.description, s.status, s.languages, s.created_at
      ORDER BY s.created_at DESC
    `;
    const rows = await query<DbSurveyRow>(sql);
    return rows.map(mapRowToSurvey);
  } catch (error) {
    console.error('Error fetching surveys from DB:', error);
    throw error;
  }
}

/**
 * Fetch a single survey and its questions by ID.
 */
export async function getSurveyById(id: string): Promise<Survey | null> {
  try {
    const sql = `
      SELECT s.*, COUNT(q.id) as question_count 
      FROM "ofis-farmer".surveys s 
      LEFT JOIN "ofis-farmer".survey_questions q ON s.id = q.survey_id 
      WHERE s.id = $1
      GROUP BY s.id, s.name, s.description, s.status, s.languages, s.created_at
    `;
    const surveys = await query<DbSurveyRow>(sql, [id]);
    if (surveys.length === 0) return null;

    const survey = mapRowToSurvey(surveys[0]);
    const questions = await getQuestionsBySurveyId(id);
    survey.questions = questions;

    return survey;
  } catch (error) {
    console.error(`Error fetching survey ${id} from DB:`, error);
    throw error;
  }
}

/**
 * Save (insert or update) a survey in PostgreSQL.
 */
export async function saveSurvey(survey: Survey): Promise<boolean> {
  const sql = `
    INSERT INTO "ofis-farmer".surveys (id, name, description, status, languages, created_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      status = EXCLUDED.status,
      languages = EXCLUDED.languages
  `;
  const params = [
    survey.id,
    survey.name,
    survey.description || null,
    survey.status,
    survey.languages,
    survey.createdAt ? new Date(survey.createdAt) : new Date()
  ];
  try {
    await query(sql, params);
    return true;
  } catch (error) {
    console.error(`Error saving survey ${survey.id} to DB:`, error);
    return false;
  }
}

/**
 * Delete a survey by ID.
 */
export async function deleteSurvey(id: string): Promise<boolean> {
  try {
    await query('DELETE FROM "ofis-farmer".surveys WHERE id = $1', [id]);
    return true;
  } catch (error) {
    console.error(`Error deleting survey ${id} from DB:`, error);
    return false;
  }
}

/**
 * Duplicate a survey and its questions.
 */
export async function duplicateSurvey(surveyId: string): Promise<Survey | null> {
  try {
    const sourceSurvey = await getSurveyById(surveyId);
    if (!sourceSurvey) return null;

    const newId = `survey_${Date.now()}`;
    const newSurvey: Survey = {
      id: newId,
      name: `${sourceSurvey.name} (Copy)`,
      description: sourceSurvey.description,
      status: 'Draft',
      languages: sourceSurvey.languages,
      createdAt: new Date().toISOString(),
    };

    const saved = await saveSurvey(newSurvey);
    if (!saved) return null;

    if (sourceSurvey.questions && sourceSurvey.questions.length > 0) {
      for (const q of sourceSurvey.questions) {
        const newQId = `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const duplicatedQ: SurveyQuestion = {
          ...q,
          id: newQId,
          surveyId: newId,
        };
        await saveQuestion(duplicatedQ);
      }
    }

    return getSurveyById(newId);
  } catch (error) {
    console.error(`Error duplicating survey ${surveyId}:`, error);
    return null;
  }
}

/**
 * Publish a survey by setting status = 'Published'.
 */
export async function publishSurvey(surveyId: string): Promise<boolean> {
  try {
    await query('UPDATE "ofis-farmer".surveys SET status = \'Published\' WHERE id = $1', [surveyId]);
    return true;
  } catch (error) {
    console.error(`Error publishing survey ${surveyId}:`, error);
    return false;
  }
}

/**
 * Get all questions for a survey ordered by order.
 */
export async function getQuestionsBySurveyId(surveyId: string): Promise<SurveyQuestion[]> {
  try {
    const rows = await query<DbQuestionRow>(
      'SELECT * FROM "ofis-farmer".survey_questions WHERE survey_id = $1 ORDER BY question_order ASC',
      [surveyId]
    );
    return rows.map(mapRowToQuestion);
  } catch (error) {
    console.error(`Error fetching questions for survey ${surveyId}:`, error);
    throw error;
  }
}

/**
 * Save (insert or update) a question in PostgreSQL.
 */
export async function saveQuestion(q: SurveyQuestion): Promise<boolean> {
  const sql = `
    INSERT INTO "ofis-farmer".survey_questions (
      id, survey_id, question_en, question_hi, question_es, question_th,
      options_en, options_hi, options_es, options_th, question_type, question_order, required
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    ON CONFLICT (id) DO UPDATE SET
      question_en = EXCLUDED.question_en,
      question_hi = EXCLUDED.question_hi,
      question_es = EXCLUDED.question_es,
      question_th = EXCLUDED.question_th,
      options_en = EXCLUDED.options_en,
      options_hi = EXCLUDED.options_hi,
      options_es = EXCLUDED.options_es,
      options_th = EXCLUDED.options_th,
      question_type = EXCLUDED.question_type,
      question_order = EXCLUDED.question_order,
      required = EXCLUDED.required
  `;
  const params = [
    q.id,
    q.surveyId,
    q.questionEn,
    q.questionHi || null,
    q.questionEs || null,
    q.questionTh || null,
    q.optionsEn || null,
    q.optionsHi || null,
    q.optionsEs || null,
    q.optionsTh || null,
    q.questionType,
    q.questionOrder,
    q.required
  ];
  try {
    await query(sql, params);
    return true;
  } catch (error) {
    console.error(`Error saving question ${q.id} to DB:`, error);
    return false;
  }
}

/**
 * Delete a question by ID.
 */
export async function deleteQuestion(id: string): Promise<boolean> {
  try {
    await query('DELETE FROM "ofis-farmer".survey_questions WHERE id = $1', [id]);
    return true;
  } catch (error) {
    console.error(`Error deleting question ${id} from DB:`, error);
    return false;
  }
}

interface DbFarmerRow {
  id: number;
  phone_no: string;
  name: string | null;
  language: string;
}

/**
 * Fetch all registered farmers.
 */
export async function getFarmers(): Promise<Farmer[]> {
  try {
    const rows = await query<DbFarmerRow>('SELECT * FROM "ofis-farmer".listed_farmers ORDER BY name ASC, phone_no ASC');
    return rows.map(r => ({
      id: r.id,
      phoneNo: r.phone_no,
      name: r.name || undefined,
      language: r.language
    }));
  } catch (error) {
    console.error('Error fetching listed farmers from DB:', error);
    throw error;
  }
}

/**
 * Assign a survey to multiple farmers in PostgreSQL.
 * Skips duplicates based on unique (survey_id, phone_no).
 */
export async function assignSurvey(surveyId: string, phoneNumbers: string[]): Promise<boolean> {
  try {
    const sql = `
      INSERT INTO "ofis-farmer".survey_assignments (survey_id, phone_no, status)
      VALUES ($1, $2, 'PENDING')
      ON CONFLICT (survey_id, phone_no) DO NOTHING
    `;

    for (const phone of phoneNumbers) {
      await query(sql, [surveyId, phone]);
    }
    return true;
  } catch (error) {
    console.error(`Error assigning survey ${surveyId} in DB:`, error);
    return false;
  }
}

