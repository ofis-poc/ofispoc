import { NextRequest, NextResponse } from 'next/server';
import { getSurveyById, saveSurvey, deleteSurvey } from '@/lib/surveys';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/surveys/[id] - Fetch a single survey by ID
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const survey = await getSurveyById(id);
    
    if (!survey) {
      return NextResponse.json(
        { success: false, error: `Survey with ID ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: survey });
  } catch (error) {
    console.error('Error fetching single survey in API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch survey details' },
      { status: 500 }
    );
  }
}

// DELETE /api/surveys/[id] - Delete a survey by ID
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const success = await deleteSurvey(id);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: `Failed to delete survey with ID ${id}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: `Survey ${id} deleted successfully` });
  } catch (error) {
    console.error('Error deleting survey in API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete survey' },
      { status: 500 }
    );
  }
}
