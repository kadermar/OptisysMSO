import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/ci-signals/[id] - Get specific signal
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const signal = await db.getCISignal(id);

    if (!signal) {
      return NextResponse.json(
        { error: 'Signal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(signal);
  } catch (error: any) {
    console.error('Error fetching signal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signal', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/ci-signals/[id] - Update signal status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, reviewedBy, reviewNotes } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const updatedSignal = await db.updateCISignalStatus(
      id,
      status,
      reviewedBy,
      reviewNotes
    );

    return NextResponse.json(updatedSignal);
  } catch (error: any) {
    console.error('Error updating signal:', error);
    return NextResponse.json(
      { error: 'Failed to update signal', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/ci-signals/[id] - Delete a CI signal
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if signal exists
    const signal = await db.getCISignal(id);
    if (!signal) {
      return NextResponse.json(
        { error: 'Signal not found' },
        { status: 404 }
      );
    }

    // Delete the signal
    const deleted = await db.deleteCISignal(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete signal' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Signal deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting signal:', error);
    return NextResponse.json(
      { error: 'Failed to delete signal', details: error.message },
      { status: 500 }
    );
  }
}
