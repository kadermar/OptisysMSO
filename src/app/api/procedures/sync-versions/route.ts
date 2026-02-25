import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * POST /api/procedures/sync-versions
 * Syncs the procedures table's current_version field with the latest version from procedure_versions
 */
export async function POST(request: Request) {
  try {
    console.log('Starting procedure version sync...');

    // Get all procedures with their latest version from procedure_versions
    const result = await sql`
      WITH latest_versions AS (
        SELECT
          pv.procedure_id,
          pv.version,
          pv.version_id
        FROM procedure_versions pv
        WHERE pv.is_current = TRUE
      )
      UPDATE procedures p
      SET
        current_version = lv.version,
        version_count = (
          SELECT COUNT(*)
          FROM procedure_versions pv2
          WHERE pv2.procedure_id = p.procedure_id
        )
      FROM latest_versions lv
      WHERE p.procedure_id = lv.procedure_id
      RETURNING p.procedure_id, p.name, p.current_version, p.version_count
    `;

    console.log(`Synced ${result.rows.length} procedures`);

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${result.rows.length} procedures`,
      synced: result.rows
    });

  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({
      error: 'Failed to sync versions',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * GET /api/procedures/sync-versions
 * Check which procedures are out of sync
 */
export async function GET(request: Request) {
  try {
    const result = await sql`
      SELECT
        p.procedure_id,
        p.name,
        p.current_version as procedures_version,
        pv.version as latest_version,
        p.version_count as procedures_count,
        (SELECT COUNT(*) FROM procedure_versions pv2 WHERE pv2.procedure_id = p.procedure_id) as actual_count,
        CASE
          WHEN p.current_version = pv.version THEN 'in_sync'
          ELSE 'out_of_sync'
        END as status
      FROM procedures p
      LEFT JOIN procedure_versions pv
        ON p.procedure_id = pv.procedure_id
        AND pv.is_current = TRUE
      ORDER BY p.procedure_id
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
