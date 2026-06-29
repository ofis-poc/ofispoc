import { NextRequest, NextResponse } from 'next/server';
import { getQuestionsBySurveyId, saveQuestion } from '@/lib/surveys';
import { SurveyQuestion } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/surveys/[id]/questions - Get all questions for a survey
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: surveyId } = await params;
    const questions = await getQuestionsBySurveyId(surveyId);
    return NextResponse.json({ success: true, data: questions });
  } catch (error) {
    console.error(`Error fetching questions for survey:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch survey questions' },
      { status: 500 }
    );
  }
}

// POST /api/surveys/[id]/questions - Create or update a survey question
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: surveyId } = await params;
    const body = await req.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    const {
      id,
      questionEn,
      questionHi,
      questionEs,
      questionTh,
      optionsEn,
      optionsHi,
      optionsEs,
      optionsTh,
      questionType,
      questionOrder,
      required
    } = body as Partial<SurveyQuestion>;

    if (!questionEn) {
      return NextResponse.json({ success: false, error: 'English Question text is required' }, { status: 400 });
    }
    if (!questionType) {
      return NextResponse.json({ success: false, error: 'Question Type is required' }, { status: 400 });
    }

    const questionId = id || `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const questionData: SurveyQuestion = {
      id: questionId,
      surveyId,
      questionEn,
      questionHi: questionHi || undefined,
      questionEs: questionEs || undefined,
      questionTh: questionTh || undefined,
      optionsEn: Array.isArray(optionsEn) ? optionsEn : undefined,
      optionsHi: Array.isArray(optionsHi) ? optionsHi : undefined,
      optionsEs: Array.isArray(optionsEs) ? optionsEs : undefined,
      optionsTh: Array.isArray(optionsTh) ? optionsTh : undefined,
      questionType,
      questionOrder: typeof questionOrder === 'number' ? questionOrder : 0,
      required: required ?? false
    };

    const success = await saveQuestion(questionData);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to save question to database' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: questionData }, { status: 201 });
  } catch (error) {
    const err = error as Error;
    console.error('Error saving survey question:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to save question' }, { status: 500 });
  }
}
