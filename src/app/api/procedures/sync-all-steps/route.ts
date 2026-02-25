import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * POST /api/procedures/sync-all-steps
 * Syncs all procedures' steps to match their current versions
 */
export async function POST(request: Request) {
  try {
    // Get all procedures
    const procedures = await sql`
      SELECT procedure_id, name, current_version
      FROM procedures
      ORDER BY procedure_id
    `;

    const results = [];

    for (const proc of procedures.rows) {
      try {
        // Get the version_id for the current version
        const versionResult = await sql`
          SELECT version_id
          FROM procedure_versions
          WHERE procedure_id = ${proc.procedure_id}
            AND version = ${proc.current_version}
            AND is_current = TRUE
        `;

        if (versionResult.rows.length === 0) {
          results.push({
            procedure_id: proc.procedure_id,
            name: proc.name,
            status: 'skipped',
            reason: 'No version record found'
          });
          continue;
        }

        const versionId = versionResult.rows[0].version_id;

        // Get all step versions for this version
        const stepVersions = await sql`
          SELECT
            step_id,
            step_number,
            step_name,
            step_content,
            description,
            typical_duration_minutes,
            criticality,
            verification_required,
            change_type
          FROM procedure_step_versions
          WHERE version_id = ${versionId}
          ORDER BY step_number
        `;

        let updated = 0;
        let inserted = 0;
        let deleted = 0;

        // Update each step
        for (const stepVersion of stepVersions.rows) {
          const existingStep = await sql`
            SELECT step_id FROM procedure_steps WHERE step_id = ${stepVersion.step_id}
          `;

          if (existingStep.rows.length > 0) {
            // Update existing step
            await sql`
              UPDATE procedure_steps
              SET
                step_name = ${stepVersion.step_name},
                step_content = ${stepVersion.step_content || stepVersion.description},
                description = ${stepVersion.description},
                typical_duration_minutes = ${stepVersion.typical_duration_minutes},
                criticality = ${stepVersion.criticality},
                verification_required = ${stepVersion.verification_required},
                current_version = ${proc.current_version},
                last_modified_at = CURRENT_TIMESTAMP
              WHERE step_id = ${stepVersion.step_id}
            `;
            updated++;
          } else if (stepVersion.change_type === 'added') {
            // Insert new step
            await sql`
              INSERT INTO procedure_steps (
                step_id,
                procedure_id,
                step_number,
                step_name,
                step_content,
                description,
                typical_duration_minutes,
                criticality,
                verification_required,
                current_version,
                created_at
              ) VALUES (
                ${stepVersion.step_id},
                ${proc.procedure_id},
                ${stepVersion.step_number},
                ${stepVersion.step_name},
                ${stepVersion.step_content || stepVersion.description},
                ${stepVersion.description},
                ${stepVersion.typical_duration_minutes},
                ${stepVersion.criticality},
                ${stepVersion.verification_required},
                ${proc.current_version},
                CURRENT_TIMESTAMP
              )
            `;
            inserted++;
          }
        }

        // Remove steps marked as removed
        const removedSteps = await sql`
          SELECT step_id
          FROM procedure_step_versions
          WHERE version_id = ${versionId}
            AND change_type = 'removed'
        `;

        for (const removed of removedSteps.rows) {
          await sql`
            DELETE FROM procedure_steps
            WHERE step_id = ${removed.step_id}
          `;
          deleted++;
        }

        results.push({
          procedure_id: proc.procedure_id,
          name: proc.name,
          current_version: proc.current_version,
          status: 'synced',
          updated,
          inserted,
          deleted
        });

      } catch (error: any) {
        results.push({
          procedure_id: proc.procedure_id,
          name: proc.name,
          status: 'error',
          error: error.message
        });
      }
    }

    const successful = results.filter(r => r.status === 'synced').length;
    const failed = results.filter(r => r.status === 'error').length;
    const skipped = results.filter(r => r.status === 'skipped').length;

    return NextResponse.json({
      success: true,
      message: `Synced ${successful} procedures (${failed} failed, ${skipped} skipped)`,
      summary: {
        total: procedures.rows.length,
        successful,
        failed,
        skipped
      },
      results
    });

  } catch (error: any) {
    console.error('Bulk sync error:', error);
    return NextResponse.json({
      error: 'Failed to sync procedures',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * GET /api/procedures/sync-all-steps
 * Check which procedures need syncing
 */
export async function GET(request: Request) {
  try {
    const result = await sql`
      SELECT
        p.procedure_id,
        p.name,
        p.current_version,
        COUNT(DISTINCT ps.step_id) FILTER (WHERE ps.current_version != p.current_version) as out_of_sync_steps,
        COUNT(DISTINCT ps.step_id) as total_steps
      FROM procedures p
      LEFT JOIN procedure_steps ps ON p.procedure_id = ps.procedure_id
      GROUP BY p.procedure_id, p.name, p.current_version
      ORDER BY p.procedure_id
    `;

    const needsSync = result.rows.filter(r => parseInt(r.out_of_sync_steps) > 0);

    return NextResponse.json({
      total: result.rows.length,
      needs_sync: needsSync.length,
      procedures: result.rows,
      procedures_needing_sync: needsSync
    });

  } catch (error: any) {
    console.error('Check error:', error);
    return NextResponse.json({
      error: 'Failed to check sync status',
      details: error.message
    }, { status: 500 });
  }
}
