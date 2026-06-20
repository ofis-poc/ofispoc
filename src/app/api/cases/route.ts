import { NextRequest, NextResponse } from 'next/server';
import { getCases, saveCase } from '@/lib/cases';
import { validateCasePayload } from '@/lib/validation';
import { Case } from '@/types';

// GET /api/cases - Fetch all cases
export async function GET() {
  try {
    const cases = await getCases();
    
    // Sort by createdAt descending (newest first)
    const sortedCases = [...cases].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ success: true, data: sortedCases });
  } catch (error) {
    console.error('Error fetching cases in API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cases from database' },
      { status: 500 }
    );
  }
}

// POST /api/cases - Create a new case (called by n8n webhook)
export async function POST(req: NextRequest) {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch (e) {
    const err = e as Error;
    console.error('Failed to parse request JSON body:', err.message);
    return NextResponse.json(
      { success: false, error: 'Malformed JSON payload' },
      { status: 400 }
    );
  }

  // 1. Run strict runtime validation
  const validationResult = validateCasePayload(body);
  
  if (!validationResult.isValid) {
    console.warn('❌ API Validation Failure:', {
      payload: body,
      errors: validationResult.errors
    });
    return NextResponse.json(
      { 
        success: false, 
        error: 'Validation failed', 
        details: validationResult.errors 
      },
      { status: 400 }
    );
  }

  // Use the validated/normalized payload from the validator
  const newCase: Case = validationResult.validatedPayload as Case;

  try {
    const success = await saveCase(newCase);

    if (!success) {
      console.error('❌ Database insertion failure for case:', newCase.caseId);
      return NextResponse.json(
        { success: false, error: 'Failed to save case to database' },
        { status: 500 }
      );
    }

    console.log(`✅ Case ${newCase.caseId} successfully stored in PostgreSQL.`);
    return NextResponse.json({ success: true, data: newCase }, { status: 201 });
  } catch (error) {
    const err = error as Error;
    console.error('❌ Exception during case creation in API:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create case in database' },
      { status: 500 }
    );
  }
}
