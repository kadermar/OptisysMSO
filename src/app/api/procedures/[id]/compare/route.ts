import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/procedures/[id]/compare?before=1.0&after=1.3&startDate=2024-01-01&endDate=2024-12-31
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const beforeVersion = searchParams.get('before');
    const afterVersion = searchParams.get('after');
    const startDate = searchParams.get('startDate') || '2024-01-01';
    const endDate = searchParams.get('endDate') || '2024-12-31';

    if (!beforeVersion || !afterVersion) {
      return NextResponse.json(
        { error: 'Both before and after versions required' },
        { status: 400 }
      );
    }

    const comparison = await db.compareVersionMetrics(
      id,
      beforeVersion,
      afterVersion,
      startDate,
      endDate
    );

    return NextResponse.json(comparison);
  } catch (error: any) {
    console.error('Error comparing versions:', error);
    return NextResponse.json(
      { error: 'Failed to compare versions', details: error.message },
      { status: 500 }
    );
  }
}
