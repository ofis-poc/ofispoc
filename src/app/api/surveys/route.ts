import { NextRequest, NextResponse } from 'next/server';
import { getSurveys, saveSurvey } from '@/lib/surveys';
import { Survey } from '@/types';

// GET /api/surveys - Fetch all surveys
export async function GET() {
  try {
    const surveys = await getSurveys();
    return NextResponse.json({ success: true, data: surveys });
  } catch (error) {
    console.error('Error fetching surveys in API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch surveys from database' },
      { status: 500 }
    );
  }
}

// POST /api/surveys - Create or update a survey
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Basic verification
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    const { id, name, description, languages, status, createdAt } = body as Partial<Survey>;
    
    if (!name) {
      return NextResponse.json({ success: false, error: 'Survey Name is required' }, { status: 400 });
    }

    const surveyId = id || `survey_${Date.now()}`;
    const surveyData: Survey = {
      id: surveyId,
      name,
      description: description || undefined,
      languages: Array.isArray(languages) ? languages : ['English'],
      status: status || 'Draft',
      createdAt: createdAt || new Date().toISOString(),
    };

    const success = await saveSurvey(surveyData);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to save survey' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: surveyData }, { status: 201 });
  } catch (error) {
    const err = error as Error;
    console.error('Error saving survey in API:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to save survey' }, { status: 500 });
  }
}
