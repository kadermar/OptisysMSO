import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: signalId } = await params;
    const { userId, affectedSteps } = await request.json();

    if (!userId || !affectedSteps || affectedSteps.length === 0) {
      return NextResponse.json(
        { error: 'userId and affectedSteps are required' },
        { status: 400 }
      );
    }

    // Apply the accepted recommendation and create new procedure version
    const versionId = await db.applyAcceptedRecommendation(
      signalId,
      userId,
      affectedSteps
    );

    return NextResponse.json({
      success: true,
      message: 'Changes applied successfully',
      versionId,
      signalId,
      status: 'implemented'
    });

  } catch (error: any) {
    console.error('Error applying CI signal changes:', error);
    return NextResponse.json(
      { error: 'Failed to apply changes', details: error.message },
      { status: 500 }
    );
  }
}
