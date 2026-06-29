import { NextRequest, NextResponse } from 'next/server';
import { duplicateSurvey } from '@/lib/surveys';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/surveys/[id]/duplicate - Duplicate a survey and its questions
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const survey = await duplicateSurvey(id);
    
    if (!survey) {
      return NextResponse.json(
        { success: false, error: `Failed to duplicate survey with ID ${id}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: survey });
  } catch (error) {
    console.error('Error duplicating survey in API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to duplicate survey' },
      { status: 500 }
    );
  }
}
