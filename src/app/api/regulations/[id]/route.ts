import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/regulations/[id] - Get single regulation
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const regulation = await db.getRegulationById(id);

    if (!regulation) {
      return NextResponse.json(
        { error: 'Regulation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(regulation);
  } catch (error: any) {
    console.error('Error fetching regulation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch regulation', details: error.message },
      { status: 500 }
    );
  }
}
