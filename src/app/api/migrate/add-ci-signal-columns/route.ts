import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    console.log('Adding parsed_recommendations and suggested_step_changes columns to ci_signals table...');

    // Add parsed_recommendations column if it doesn't exist
    await sql`
      ALTER TABLE ci_signals
      ADD COLUMN IF NOT EXISTS parsed_recommendations JSONB
    `;

    // Add suggested_step_changes column if it doesn't exist
    await sql`
      ALTER TABLE ci_signals
      ADD COLUMN IF NOT EXISTS suggested_step_changes JSONB
    `;

    console.log('✅ Migration completed successfully');

    return NextResponse.json({
      success: true,
      message: 'CI signal columns added successfully'
    });

  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    );
  }
}
