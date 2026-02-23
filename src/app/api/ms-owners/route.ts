import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/ms-owners - List all MS owners
export async function GET(request: Request) {
  try {
    const owners = await db.getMSOwners();
    return NextResponse.json(owners);
  } catch (error: any) {
    console.error('Error fetching MS owners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MS owners', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/ms-owners - Create new MS owner
export async function POST(request: Request) {
  try {
    const { name, email, department } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const owner = await db.createMSOwner({ name, email, department });
    return NextResponse.json(owner);
  } catch (error: any) {
    console.error('Error creating MS owner:', error);
    return NextResponse.json(
      { error: 'Failed to create MS owner', details: error.message },
      { status: 500 }
    );
  }
}
