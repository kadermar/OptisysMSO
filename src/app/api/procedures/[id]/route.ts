import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { db } from '@/lib/db';

// Enable caching for this route
export const revalidate = 120; // Revalidate every 2 minutes (procedures change moderately)

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: procedureId } = await params;

    // Fetch procedure details
    const procedureResult = await sql`
      SELECT *
      FROM procedures
      WHERE procedure_id = ${procedureId}
    `;

    if (procedureResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Procedure not found' },
        { status: 404 }
      );
    }

    // Fetch procedure steps
    const stepsResult = await sql`
      SELECT *
      FROM procedure_steps
      WHERE procedure_id = ${procedureId}
      ORDER BY step_number ASC
    `;

    const procedure = {
      ...procedureResult.rows[0],
      steps: stepsResult.rows,
    };

    return NextResponse.json(procedure, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240',
      },
    });
  } catch (error) {
    console.error('Error fetching procedure details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch procedure details' },
      { status: 500 }
    );
  }
}

// DELETE /api/procedures/[id] - Delete a procedure
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: procedureId } = await params;

    // Check if procedure exists
    const procedureResult = await sql`
      SELECT procedure_id FROM procedures WHERE procedure_id = ${procedureId}
    `;

    if (procedureResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Procedure not found' },
        { status: 404 }
      );
    }

    // Delete the procedure (cascade will handle related records)
    const deleted = await db.deleteProcedure(procedureId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete procedure' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Procedure deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting procedure:', error);
    return NextResponse.json(
      { error: 'Failed to delete procedure', details: error.message },
      { status: 500 }
    );
  }
}
