import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: signalId } = await params;
    const { parsedData } = await request.json();

    if (!parsedData) {
      return NextResponse.json(
        { error: 'parsedData is required' },
        { status: 400 }
      );
    }

    // Cache the parsed recommendations in the database
    await db.cacheParsedRecommendation(signalId, parsedData);

    return NextResponse.json({
      success: true,
      message: 'Recommendations cached successfully'
    });

  } catch (error: any) {
    console.error('Error caching parsed recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to cache recommendations', details: error.message },
      { status: 500 }
    );
  }
}
