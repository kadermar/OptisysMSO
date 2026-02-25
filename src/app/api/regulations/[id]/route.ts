import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Enable caching for this route
export const revalidate = 300; // Revalidate every 5 minutes

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

    return NextResponse.json(regulation, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error: any) {
    console.error('Error fetching regulation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch regulation', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/regulations/[id] - Delete a regulation
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if regulation exists
    const regulation = await db.getRegulationById(id);
    if (!regulation) {
      return NextResponse.json(
        { error: 'Regulation not found' },
        { status: 404 }
      );
    }

    // Delete the regulation
    const deleted = await db.deleteRegulation(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete regulation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Regulation deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting regulation:', error);
    return NextResponse.json(
      { error: 'Failed to delete regulation', details: error.message },
      { status: 500 }
    );
  }
}
