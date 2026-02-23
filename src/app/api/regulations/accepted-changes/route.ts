import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/regulations/accepted-changes - Log accepted change
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      regulationId,
      procedureId,
      stepId,
      changeDescription,
      changeType,
      acceptedBy,
      procedureVersion
    } = body;

    if (!regulationId || !procedureId || !stepId || !changeType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await db.logAcceptedChange({
      regulationId,
      procedureId,
      stepId,
      changeDescription,
      changeType,
      acceptedBy: acceptedBy || 'MSO-001',
      procedureVersion: procedureVersion || '1.0'
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error logging accepted change:', error);
    return NextResponse.json(
      { error: 'Failed to log accepted change', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/regulations/accepted-changes?regulationId=REG-2024-001&procedureId=PROC-101
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const regulationId = searchParams.get('regulationId');
    const procedureId = searchParams.get('procedureId');

    if (regulationId) {
      const changes = await db.getAcceptedChanges(regulationId);
      return NextResponse.json(changes);
    } else if (procedureId) {
      const changes = await db.getAcceptedChangesByProcedure(procedureId);
      return NextResponse.json(changes);
    } else {
      return NextResponse.json(
        { error: 'regulationId or procedureId is required' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error fetching accepted changes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accepted changes', details: error.message },
      { status: 500 }
    );
  }
}
