import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * POST /api/procedures/[id]/sync-steps
 * Syncs procedure_steps table with the current version from procedure_step_versions
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: procedureId } = await params;

    // Get current version
    const proc = await sql`
      SELECT current_version FROM procedures WHERE procedure_id = ${procedureId}
    `;

    if (proc.rows.length === 0) {
      return NextResponse.json({ error: 'Procedure not found' }, { status: 404 });
    }

    const currentVersion = proc.rows[0].current_version;

    // Get the version_id for the current version
    const versionResult = await sql`
      SELECT version_id
      FROM procedure_versions
      WHERE procedure_id = ${procedureId}
        AND version = ${currentVersion}
        AND is_current = TRUE
    `;

    if (versionResult.rows.length === 0) {
      return NextResponse.json({
        error: 'Current version not found in procedure_versions',
        current_version: currentVersion
      }, { status: 404 });
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

    console.log(`Found ${stepVersions.rows.length} steps in version ${currentVersion}`);

    // Update each step in procedure_steps
    const updates = [];
    for (const stepVersion of stepVersions.rows) {
      // Check if step exists in procedure_steps
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
            current_version = ${currentVersion},
            last_modified_at = CURRENT_TIMESTAMP
          WHERE step_id = ${stepVersion.step_id}
        `;

        updates.push({
          step_id: stepVersion.step_id,
          step_number: stepVersion.step_number,
          step_name: stepVersion.step_name,
          action: 'updated'
        });
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
            ${procedureId},
            ${stepVersion.step_number},
            ${stepVersion.step_name},
            ${stepVersion.step_content || stepVersion.description},
            ${stepVersion.description},
            ${stepVersion.typical_duration_minutes},
            ${stepVersion.criticality},
            ${stepVersion.verification_required},
            ${currentVersion},
            CURRENT_TIMESTAMP
          )
        `;

        updates.push({
          step_id: stepVersion.step_id,
          step_number: stepVersion.step_number,
          step_name: stepVersion.step_name,
          action: 'inserted'
        });
      }
    }

    // Remove steps that were marked as removed
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

      updates.push({
        step_id: removed.step_id,
        action: 'deleted'
      });
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${updates.length} steps to version ${currentVersion}`,
      procedure_id: procedureId,
      current_version: currentVersion,
      version_id: versionId,
      updates
    });

  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({
      error: 'Failed to sync steps',
      details: error.message
    }, { status: 500 });
  }
}
