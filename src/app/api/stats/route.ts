import { NextResponse } from 'next/server';
import { getCases, getStats } from '@/lib/cases';

export async function GET() {
  try {
    const stats = await getStats();
    const cases = await getCases();

    // 1. Group cases by status for chart data
    const casesByStatus = [
      { name: 'Pending Review', value: stats.pendingReviews, color: '#FF9800' },
      { name: 'Resolved', value: stats.resolvedCases, color: '#2E7D32' },
      { name: 'High Confidence', value: stats.highConfidenceCases, color: '#2196F3' },
    ];

    // 2. Weekly volume trend (past 7 days)
    const dailyVolumeMap: { [key: string]: { date: string; pending: number; resolved: number; total: number } } = {};
    
    // Initialize past 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const key = d.toISOString().split('T')[0];
      dailyVolumeMap[key] = { date: dateStr, pending: 0, resolved: 0, total: 0 };
    }

    // Populate with actual data
    cases.forEach((c) => {
      const caseDate = c.createdAt.split('T')[0];
      if (dailyVolumeMap[caseDate]) {
        if (c.status === 'RESOLVED') {
          dailyVolumeMap[caseDate].resolved += 1;
        } else {
          dailyVolumeMap[caseDate].pending += 1;
        }
        dailyVolumeMap[caseDate].total += 1;
      }
    });

    const trendData = Object.values(dailyVolumeMap);

    // 3. Crop/Disease breakdown
    const cropCounts: { [key: string]: number } = {};
    cases.forEach((c) => {
      let crop = 'Other';
      const diag = String(c.aiResponseDashboard || '').toLowerCase();
      
      if (diag.includes('cacao') || diag.includes('cocoa') || diag.includes('black pod')) {
        crop = 'Cacao';
      } else if (diag.includes('tomato') || diag.includes('blight')) {
        crop = 'Tomato';
      } else if (diag.includes('maize') || diag.includes('corn') || diag.includes('rust')) {
        crop = 'Maize';
      } else if (diag.includes('coffee')) {
        crop = 'Coffee';
      } else if (diag.includes('cassava') || diag.includes('mosaic')) {
        crop = 'Cassava';
      } else if (diag.includes('rice') || diag.includes('blast')) {
        crop = 'Rice';
      }
      
      cropCounts[crop] = (cropCounts[crop] || 0) + 1;
    });

    const cropData = Object.entries(cropCounts).map(([name, value]) => ({
      name,
      value,
    }));

    return NextResponse.json({
      success: true,
      stats,
      charts: {
        casesByStatus,
        trendData,
        cropData,
      },
    });
  } catch (error) {
    console.error('Error generating statistics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve stats data from database' },
      { status: 500 }
    );
  }
}
