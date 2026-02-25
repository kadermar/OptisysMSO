import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Enable caching for this route
export const revalidate = 300; // Revalidate every 5 minutes (regulations change less frequently)

// GET /api/regulations - List all regulations
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const regulations = await db.getRegulations({ status, priority });
    return NextResponse.json(regulations, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error: any) {
    console.error('Error fetching regulations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch regulations', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/regulations - Create new regulation
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      title,
      source,
      effectiveDate,
      priority,
      affectedProcedures,
      summary,
      documentText,
      keyChanges
    } = body;

    // Validation
    if (!title || !source || !effectiveDate || !priority || !affectedProcedures || !summary) {
      return NextResponse.json(
        { error: 'Missing required fields: title, source, effectiveDate, priority, affectedProcedures, summary' },
        { status: 400 }
      );
    }

    if (!Array.isArray(affectedProcedures) || affectedProcedures.length === 0) {
      return NextResponse.json(
        { error: 'affectedProcedures must be a non-empty array' },
        { status: 400 }
      );
    }

    const regulationId = await db.createRegulation({
      title,
      source,
      effectiveDate,
      priority,
      affectedProcedures,
      summary,
      documentText,
      keyChanges: keyChanges || [],
      createdBy: 'MSO-001' // J. Berg
    });

    return NextResponse.json({
      success: true,
      regulationId,
      message: 'Regulation created successfully'
    });
  } catch (error: any) {
    console.error('Error creating regulation:', error);
    return NextResponse.json(
      { error: 'Failed to create regulation', details: error.message },
      { status: 500 }
    );
  }
}
