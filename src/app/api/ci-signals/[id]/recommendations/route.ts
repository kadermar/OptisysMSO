import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: signalId } = await params;

    // Get cached parsed recommendations from database
    const cachedData = await db.getParsedRecommendations(signalId);

    if (!cachedData || !cachedData.parsed_recommendations) {
      return NextResponse.json({
        actionableItems: [],
        suggestedStepChanges: []
      });
    }

    return NextResponse.json({
      actionableItems: cachedData.parsed_recommendations || [],
      suggestedStepChanges: cachedData.suggested_step_changes || []
    });

  } catch (error: any) {
    console.error('Error fetching cached recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations', details: error.message },
      { status: 500 }
    );
  }
}
