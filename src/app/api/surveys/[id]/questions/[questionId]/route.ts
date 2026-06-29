import { NextRequest, NextResponse } from 'next/server';
import { deleteQuestion } from '@/lib/surveys';

interface RouteParams {
  params: Promise<{ id: string; questionId: string }>;
}

// DELETE /api/surveys/[id]/questions/[questionId] - Delete a survey question by ID
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { questionId } = await params;
    const success = await deleteQuestion(questionId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: `Failed to delete question with ID ${questionId}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: `Question ${questionId} deleted successfully` });
  } catch (error) {
    console.error('Error deleting survey question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete survey question' },
      { status: 500 }
    );
  }
}
