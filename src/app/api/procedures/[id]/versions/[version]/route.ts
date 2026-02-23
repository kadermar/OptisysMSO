import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/procedures/[id]/versions/[version] - Get specific version details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  try {
    const { id, version } = await params;
    const versionData = await db.getProcedureVersion(id, version);

    if (!versionData) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(versionData);
  } catch (error: any) {
    console.error('Error fetching version:', error);
    return NextResponse.json(
      { error: 'Failed to fetch version', details: error.message },
      { status: 500 }
    );
  }
}
