import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/surveys/[id]/questions/reorder - Reorder multiple questions of a survey
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: surveyId } = await params;
    const body = await req.json();

    if (!body || !Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Expected an array of question order updates' }, { status: 400 });
    }

    // Run updates
    // Body is expected to be e.g. [{ id: 'q1', questionOrder: 1 }, { id: 'q2', questionOrder: 2 }]
    for (const update of body) {
      const { id, questionOrder } = update as { id: string; questionOrder: number };
      if (!id || typeof questionOrder !== 'number') continue;
      
      await query(
        'UPDATE "ofis-farmer".survey_questions SET question_order = $1 WHERE id = $2 AND survey_id = $3',
        [questionOrder, id, surveyId]
      );
    }

    return NextResponse.json({ success: true, message: 'Questions reordered successfully' });
  } catch (error) {
    const err = error as Error;
    console.error('Error reordering survey questions:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to reorder questions' }, { status: 500 });
  }
}
