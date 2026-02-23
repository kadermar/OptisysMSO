import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/ci-signals?procedureId=PROC-104&severity=high&status=open
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      procedureId: searchParams.get('procedureId') || undefined,
      severity: searchParams.get('severity') || undefined,
      status: searchParams.get('status') || undefined
    };

    const signals = await db.getOpenCISignals(filters);
    return NextResponse.json(signals);
  } catch (error: any) {
    console.error('Error fetching CI signals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CI signals', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/ci-signals - Create new CI signal (called by analytics engine)
export async function POST(request: Request) {
  try {
    const signalData = await request.json();

    // Validation
    const required = [
      'procedureId', 'signalType', 'severity', 'title', 'description',
      'evidence', 'recommendationText', 'detectionPeriodStart',
      'detectionPeriodEnd', 'sampleSize', 'estimatedImpact'
    ];

    for (const field of required) {
      if (!signalData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const signal = await db.generateCISignal(signalData);
    return NextResponse.json(signal);
  } catch (error: any) {
    console.error('Error creating CI signal:', error);
    return NextResponse.json(
      { error: 'Failed to create CI signal', details: error.message },
      { status: 500 }
    );
  }
}
