import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Enable caching for this route
export const revalidate = 60; // Revalidate every 60 seconds

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || '2024-01-01';
    const endDate = searchParams.get('endDate') || '2025-12-31';

    const facilities = await db.getFacilityPerformance(startDate, endDate);
    return NextResponse.json(facilities, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error fetching facility performance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch facility performance' },
      { status: 500 }
    );
  }
}
