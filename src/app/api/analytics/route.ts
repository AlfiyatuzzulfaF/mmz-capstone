import { fetchAnalyticsOverview } from '@/services/booking.service';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics
 * Mengambil ringkasan metrik 4 kartu KPI Scorecard, peringkat paket terlaris, dan rasio pemakaian Studio 1 vs Studio 2.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const analyticsData = await fetchAnalyticsOverview(startDate, endDate);

    return NextResponse.json({
      success: true,
      data: analyticsData,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Gagal mengambil data analitik';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
