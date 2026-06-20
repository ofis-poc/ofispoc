/**
 * Validates the case payload before saving it to the database.
 * 
 * Requirements:
 * 1. Required fields: caseId, phoneNo, imageUrl, aiResponseFarmer, aiResponseDashboard, status
 * 2. Data types:
 *    - caseId: string
 *    - phoneNo: string
 *    - imageUrl: string
 *    - aiResponseFarmer: string
 *    - status: string
 * 3. Handle aiResponseDashboard safely:
 *    - If already a string, store as-is.
 *    - If object/array, serialize using JSON.stringify().
 *    - If null/undefined, store empty string.
 * 4. Strict validation:
 *    - Reject payload if typeof aiResponseFarmer !== "string"
 */
import { Case } from '@/types';

export function validateCasePayload(payload: unknown): { isValid: boolean; errors: string[]; validatedPayload?: Case } {
  const errors: string[] = [];

  if (!payload || typeof payload !== 'object') {
    return { isValid: false, errors: ['Payload must be a valid JSON object'] };
  }

  const body = payload as Record<string, unknown>;

  // 1. Strict check for aiResponseFarmer
  if ('aiResponseFarmer' in body) {
    if (typeof body.aiResponseFarmer !== 'string') {
      errors.push(`Strict validation failure: 'aiResponseFarmer' must be a string. Got '${typeof body.aiResponseFarmer}'.`);
    }
  } else {
    errors.push("Missing required field: 'aiResponseFarmer'");
  }

  // 2. Validate other required fields and types
  const stringFields = ['caseId', 'phoneNo', 'imageUrl', 'status'];
  for (const field of stringFields) {
    if (!(field in body) || body[field] === undefined || body[field] === null) {
      errors.push(`Missing required field: '${field}'`);
    } else if (typeof body[field] !== 'string') {
      errors.push(`Field '${field}' must be a string. Got '${typeof body[field]}'.`);
    }
  }

  // 3. Handle aiResponseDashboard safely
  let validatedDashboard = '';
  if (!('aiResponseDashboard' in body) || body.aiResponseDashboard === null || body.aiResponseDashboard === undefined) {
    validatedDashboard = '';
  } else if (typeof body.aiResponseDashboard === 'string') {
    validatedDashboard = body.aiResponseDashboard;
  } else if (typeof body.aiResponseDashboard === 'object') {
    try {
      validatedDashboard = JSON.stringify(body.aiResponseDashboard);
    } catch (e) {
      const err = e as Error;
      errors.push(`Field 'aiResponseDashboard' is an object/array but could not be JSON stringified: ${err.message}`);
    }
  } else {
    // If it's a number, boolean, etc., convert to string
    validatedDashboard = String(body.aiResponseDashboard);
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Return the validated and normalized payload
  return {
    isValid: true,
    errors: [],
    validatedPayload: {
      caseId: body.caseId as string,
      phoneNo: body.phoneNo as string,
      imageUrl: body.imageUrl as string,
      aiResponseFarmer: body.aiResponseFarmer as string,
      aiResponseDashboard: validatedDashboard,
      status: body.status as Case['status'],
      createdAt: (body.createdAt as string) || new Date().toISOString(),
      expertDiagnosis: (body.expertDiagnosis as string) || undefined,
      expertRecommendation: (body.expertRecommendation as string) || undefined,
      messageToFarmer: (body.messageToFarmer as string) || undefined,
      resolvedAt: (body.resolvedAt as string) || undefined,
    }
  };
}
