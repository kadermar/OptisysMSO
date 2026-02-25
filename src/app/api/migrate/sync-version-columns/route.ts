import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * POST /api/migrate/sync-version-columns
 * Syncs the old 'version' column with 'current_version' column in procedures table
 * This prevents confusion when both columns exist
 */
export async function POST(request: Request) {
  try {
    console.log('Syncing version columns in procedures table...');

    // Update the old version column to match current_version
    const result = await sql`
      UPDATE procedures
      SET version = current_version
      WHERE version IS DISTINCT FROM current_version
      RETURNING procedure_id, name, version, current_version
    `;

    console.log(`Updated ${result.rows.length} procedures`);

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${result.rows.length} procedures`,
      updated: result.rows
    });

  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({
      error: 'Failed to sync version columns',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * GET /api/migrate/sync-version-columns
 * Check which procedures have mismatched version columns
 */
export async function GET(request: Request) {
  try {
    const result = await sql`
      SELECT
        procedure_id,
        name,
        version as old_version,
        current_version,
        CASE
          WHEN version = current_version THEN 'in_sync'
          ELSE 'out_of_sync'
        END as status
      FROM procedures
      ORDER BY procedure_id
    `;

    const outOfSync = result.rows.filter(row => row.status === 'out_of_sync');

    return NextResponse.json({
      total: result.rows.length,
      in_sync: result.rows.length - outOfSync.length,
      out_of_sync: outOfSync.length,
      procedures: result.rows,
      out_of_sync_details: outOfSync
    });

  } catch (error: any) {
    console.error('Check error:', error);
    return NextResponse.json({
      error: 'Failed to check sync status',
      details: error.message
    }, { status: 500 });
  }
}
