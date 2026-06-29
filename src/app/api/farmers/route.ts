import { NextResponse } from 'next/server';
import { getFarmers } from '@/lib/surveys';

// GET /api/farmers - Fetch all listed farmers
export async function GET() {
  try {
    const farmers = await getFarmers();
    return NextResponse.json({ success: true, data: farmers });
  } catch (error) {
    console.error('Error fetching listed farmers in API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch farmers from database' },
      { status: 500 }
    );
  }
}
