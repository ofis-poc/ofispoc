import { NextRequest, NextResponse } from 'next/server';
import { getCaseById } from '@/lib/storage';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/cases/[id] - Fetch a single case by ID
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const caseItem = await getCaseById(id);
    
    if (!caseItem) {
      return NextResponse.json(
        { success: false, error: `Case with ID ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: caseItem });
  } catch (error) {
    console.error('Error fetching single case in API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch case details' },
      { status: 500 }
    );
  }
}
