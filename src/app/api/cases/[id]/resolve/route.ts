import { NextRequest, NextResponse } from 'next/server';
import { updateCase } from '@/lib/cases';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/cases/[id]/resolve - Resolve a case with expert response
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    const { expertDiagnosis, expertRecommendation, messageToFarmer, phoneNo } = body;
    
    if (!messageToFarmer) {
      return NextResponse.json(
        { success: false, error: 'messageToFarmer (Message to Farmer) is required to resolve a case' },
        { status: 400 }
      );
    }

    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    let webhookSent = false;
    let webhookError = null;

    if (webhookUrl) {
      try {
        console.log(`Sending response to n8n webhook at: ${webhookUrl}`);
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            caseId: id,
            phoneNo: phoneNo,
            message: messageToFarmer,
          }),
        });

        if (response.ok) {
          webhookSent = true;
        } else {
          const errorText = await response.text();
          webhookError = `n8n webhook returned status ${response.status}: ${errorText}`;
          console.error(webhookError);
        }
      } catch (err) {
        const errorObj = err as Error;
        webhookError = `Failed to contact n8n webhook: ${errorObj.message}`;
        console.error(webhookError);
      }
    } else {
      console.log('N8N_WEBHOOK_URL is not configured. Simulating successful webhook request.');
      webhookSent = true; // Simulate success in development
    }

    // If webhook failed and we are in production, we might want to fail or proceed.
    // Let's proceed and update the DB but return a warning if webhook failed,
    // so the dashboard remains functional even if the webhook endpoint is offline.
    const resolvedData = {
      status: 'RESOLVED' as const,
      expertDiagnosis: expertDiagnosis || 'Unspecified',
      expertRecommendation: expertRecommendation || 'Unspecified',
      messageToFarmer,
      resolvedAt: new Date().toISOString(),
    };

    const updatedCase = await updateCase(id, resolvedData);

    if (!updatedCase) {
      return NextResponse.json(
        { success: false, error: `Failed to update case with ID ${id} in database` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedCase,
      webhookSent,
      webhookWarning: webhookError,
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error resolving case in API:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to resolve case' },
      { status: 500 }
    );
  }
}
