import { NextRequest, NextResponse } from 'next/server';
import { getCases, saveCase } from '@/lib/storage';
import { Case } from '@/lib/types';

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
      { success: false, error: 'Failed to fetch cases' },
      { status: 500 }
    );
  }
}

// POST /api/cases - Create a new case (called by n8n webhook)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    const { caseId, phoneNo, imageUrl, aiResponseFarmer, aiResponseDashboard } = body;
    
    if (!caseId || !phoneNo || !imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: caseId, phoneNo, and imageUrl are required.' },
        { status: 400 }
      );
    }

    const newCase: Case = {
      caseId,
      phoneNo,
      imageUrl,
      aiResponseFarmer: aiResponseFarmer || 'Diagnosis is in progress. An expert will review your case shortly.',
      aiResponseDashboard: aiResponseDashboard || 'AI Analysis pending.',
      status: (body.status || 'EXPERT_REVIEW_REQUIRED') as Case['status'],
      createdAt: body.createdAt || new Date().toISOString(),
    };

    const success = await saveCase(newCase);

    if (!success) {
      throw new Error('Storage adapter failed to write the case');
    }

    return NextResponse.json({ success: true, data: newCase }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating case in API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create case' },
      { status: 500 }
    );
  }
}
