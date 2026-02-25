import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: signalId } = await params;

    // Get impact metrics from database
    const impactMetrics = await db.getCISignalImpactMetrics(signalId);

    if (!impactMetrics) {
      return NextResponse.json(
        { error: 'Impact metrics not available for this signal. Signal may not be implemented yet.' },
        { status: 404 }
      );
    }

    return NextResponse.json(impactMetrics);

  } catch (error: any) {
    console.error('Error fetching CI signal impact metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch impact metrics', details: error.message },
      { status: 500 }
    );
  }
}
