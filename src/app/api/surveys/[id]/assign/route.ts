import { NextRequest, NextResponse } from 'next/server';
import { assignSurvey, publishSurvey } from '@/lib/surveys';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/surveys/[id]/assign - Assign survey to farmers and trigger n8n webhook
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: surveyId } = await params;
    const body = await req.json();

    if (!body || !body.phoneNumbers || !Array.isArray(body.phoneNumbers) || body.phoneNumbers.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one farmer phone number is required' }, { status: 400 });
    }

    const { phoneNumbers } = body as { phoneNumbers: string[] };

    // 1. First, make sure the survey status is set to Published in PostgreSQL
    const published = await publishSurvey(surveyId);
    if (!published) {
      return NextResponse.json({ success: false, error: 'Failed to publish survey metadata' }, { status: 500 });
    }

    // 2. Insert assignments into survey_assignments (ignoring duplicates)
    const assigned = await assignSurvey(surveyId, phoneNumbers);
    if (!assigned) {
      return NextResponse.json({ success: false, error: 'Failed to save assignments in database' }, { status: 500 });
    }

    // 3. Trigger the n8n webhook (fire-and-forget)
    const webhookUrl = process.env.N8N_WEBHOOK_SURVEY_URL || 'https://n8n-render-production-f98e.up.railway.app/webhook-test/03d72e4d-3fa8-4f1d-af9c-7cd50718a8be';

    console.log(`Triggering n8n webhook (background) at: ${webhookUrl} for survey ${surveyId}`);

    // Fire-and-forget trigger in the background
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        surveyId: surveyId,
        assignmentTable: 'survey_assignments',
        responseTable: 'survey_responses'
      })
    }).catch(err => {
      console.error('Background webhook trigger failed:', err);
    });

    return NextResponse.json({
      success: true,
      message: `Survey assigned to ${phoneNumbers.length} farmers`,
      webhookTriggered: true
    });

  } catch (error) {
    const err = error as Error;
    console.error('Error in survey assignment API:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to complete survey assignment' }, { status: 500 });
  }
}
