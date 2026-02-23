import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/procedures/[id]/versions - List all versions
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const versions = await db.getProcedureVersionHistory(id);
    return NextResponse.json(versions);
  } catch (error: any) {
    console.error('Error fetching versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch versions', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/procedures/[id]/versions - Create new version
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      newVersion,
      createdBy,
      changeReason,
      ciSignalId,
      modifiedSteps
    } = body;

    // Validation
    if (!newVersion || !createdBy || !changeReason || !modifiedSteps) {
      return NextResponse.json(
        { error: 'Missing required fields: newVersion, createdBy, changeReason, modifiedSteps' },
        { status: 400 }
      );
    }

    const versionId = await db.createProcedureVersion({
      procedureId: id,
      newVersion,
      createdBy,
      changeReason,
      ciSignalId,
      modifiedSteps
    });

    return NextResponse.json({
      success: true,
      versionId,
      message: `Version ${newVersion} created successfully`
    });
  } catch (error: any) {
    console.error('Error creating version:', error);
    return NextResponse.json(
      { error: 'Failed to create version', details: error.message },
      { status: 500 }
    );
  }
}
