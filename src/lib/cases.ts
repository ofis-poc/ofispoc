import { query } from './db';
import { Case, CaseStats } from '@/types';
import * as storage from './storage';

const usePostgres = !!process.env.DATABASE_URL;

interface DbRow {
  case_id: string;
  phone_no: string;
  image_url: string;
  ai_response_farmer: string;
  ai_response_dashboard: string;
  status: 'EXPERT_REVIEW_REQUIRED' | 'RESOLVED' | 'HIGH_CONFIDENCE';
  created_at: string | Date | null;
  expert_diagnosis?: string | null;
  expert_recommendation?: string | null;
  message_to_farmer?: string | null;
  resolved_at?: string | Date | null;
}

/**
 * Maps a database row back to the TypeScript Case model.
 */
function rowToCase(row: DbRow): Case {
  return {
    caseId: row.case_id,
    phoneNo: row.phone_no,
    imageUrl: row.image_url,
    aiResponseFarmer: row.ai_response_farmer,
    aiResponseDashboard: row.ai_response_dashboard,
    status: row.status,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    expertDiagnosis: row.expert_diagnosis || undefined,
    expertRecommendation: row.expert_recommendation || undefined,
    messageToFarmer: row.message_to_farmer || undefined,
    resolvedAt: row.resolved_at ? new Date(row.resolved_at).toISOString() : undefined,
  };
}

/**
 * Fetch all cases from the database ordered by creation date descending.
 */
export async function getCases(): Promise<Case[]> {
  if (!usePostgres) {
    return storage.getCases();
  }
  try {
    const rows = await query<DbRow>('SELECT * FROM "ofis-farmer".cases ORDER BY created_at DESC');
    return rows.map(rowToCase);
  } catch (error) {
    console.error('Error in getCases database helper:', error);
    throw error;
  }
}

/**
 * Fetch a single case by its unique case_id.
 */
export async function getCaseById(id: string): Promise<Case | null> {
  if (!usePostgres) {
    return storage.getCaseById(id);
  }
  try {
    const rows = await query<DbRow>('SELECT * FROM "ofis-farmer".cases WHERE case_id = $1', [id]);
    if (rows.length === 0) return null;
    return rowToCase(rows[0]);
  } catch (error) {
    console.error(`Error in getCaseById database helper for case ${id}:`, error);
    throw error;
  }
}

/**
 * Insert a new case or update an existing case (upsert) based on case_id.
 */
export async function saveCase(caseData: Case): Promise<boolean> {
  if (!usePostgres) {
    return storage.saveCase(caseData);
  }
  const sql = `
    INSERT INTO "ofis-farmer".cases (
      case_id, phone_no, image_url, ai_response_farmer, ai_response_dashboard, 
      status, expert_diagnosis, expert_recommendation, message_to_farmer, created_at, resolved_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (case_id)
    DO UPDATE SET
      phone_no = EXCLUDED.phone_no,
      image_url = EXCLUDED.image_url,
      ai_response_farmer = EXCLUDED.ai_response_farmer,
      ai_response_dashboard = EXCLUDED.ai_response_dashboard,
      status = EXCLUDED.status,
      expert_diagnosis = EXCLUDED.expert_diagnosis,
      expert_recommendation = EXCLUDED.expert_recommendation,
      message_to_farmer = EXCLUDED.message_to_farmer,
      resolved_at = EXCLUDED.resolved_at
  `;

  const params = [
    caseData.caseId,
    caseData.phoneNo,
    caseData.imageUrl,
    caseData.aiResponseFarmer,
    caseData.aiResponseDashboard,
    caseData.status,
    caseData.expertDiagnosis || null,
    caseData.expertRecommendation || null,
    caseData.messageToFarmer || null,
    caseData.createdAt ? new Date(caseData.createdAt) : new Date(),
    caseData.resolvedAt ? new Date(caseData.resolvedAt) : null,
  ];

  try {
    await query(sql, params);
    return true;
  } catch (error) {
    console.error(`Database insertion failure for case ${caseData.caseId}:`, error);
    return false;
  }
}

/**
 * Update attributes of an existing case.
 */
export async function updateCase(id: string, updates: Partial<Case>): Promise<Case | null> {
  if (!usePostgres) {
    return storage.updateCase(id, updates);
  }
  try {
    const caseItem = await getCaseById(id);
    if (!caseItem) return null;

    const updatedCase = {
      ...caseItem,
      ...updates,
    };

    const success = await saveCase(updatedCase);
    return success ? updatedCase : null;
  } catch (error) {
    console.error(`Error in updateCase database helper for case ${id}:`, error);
    throw error;
  }
}

interface DbStatsRow {
  total_cases: string;
  pending_reviews: string;
  resolved_cases: string;
  high_confidence_cases: string;
}

/**
 * Calculate dashboard summary statistics.
 */
export async function getStats(): Promise<CaseStats> {
  if (!usePostgres) {
    return storage.getStats();
  }
  const sql = `
    SELECT 
      COUNT(*) as total_cases,
      COUNT(*) FILTER (WHERE status = 'EXPERT_REVIEW_REQUIRED') as pending_reviews,
      COUNT(*) FILTER (WHERE status = 'RESOLVED') as resolved_cases,
      COUNT(*) FILTER (WHERE status = 'HIGH_CONFIDENCE') as high_confidence_cases
    FROM "ofis-farmer".cases
  `;
  try {
    const rows = await query<DbStatsRow>(sql);
    if (rows.length === 0) {
      return { totalCases: 0, pendingReviews: 0, resolvedCases: 0, highConfidenceCases: 0 };
    }
    const r = rows[0];
    return {
      totalCases: parseInt(r.total_cases || '0', 10),
      pendingReviews: parseInt(r.pending_reviews || '0', 10),
      resolvedCases: parseInt(r.resolved_cases || '0', 10),
      highConfidenceCases: parseInt(r.high_confidence_cases || '0', 10),
    };
  } catch (error) {
    console.error('Failed to calculate stats from database:', error);
    return { totalCases: 0, pendingReviews: 0, resolvedCases: 0, highConfidenceCases: 0 };
  }
}
