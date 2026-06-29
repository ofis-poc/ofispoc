import { NextRequest, NextResponse } from 'next/server';
import { publishSurvey } from '@/lib/surveys';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/surveys/[id]/publish - Publish a survey (Draft -> Published)
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const success = await publishSurvey(id);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: `Failed to publish survey with ID ${id}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: `Survey ${id} published successfully` });
  } catch (error) {
    console.error('Error publishing survey in API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to publish survey' },
      { status: 500 }
    );
  }
}
