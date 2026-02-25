import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: procedureId } = await params;

    // Get current procedure info
    const proc = await sql`
      SELECT procedure_id, name, version, current_version, version_count
      FROM procedures
      WHERE procedure_id = ${procedureId}
    `;

    if (proc.rows.length === 0) {
      return NextResponse.json({ error: 'Procedure not found' }, { status: 404 });
    }

    const currentVersion = proc.rows[0].current_version;

    // Get all versions for this procedure
    const versions = await sql`
      SELECT version_id, version, created_at, created_by, change_reason, is_current
      FROM procedure_versions
      WHERE procedure_id = ${procedureId}
      ORDER BY created_at DESC
    `;

    // Get current steps from procedure_steps table
    const currentSteps = await sql`
      SELECT
        step_id,
        step_number,
        step_name,
        LEFT(step_content, 100) as step_content_preview,
        LEFT(description, 100) as description_preview,
        current_version as step_current_version,
        last_modified_at,
        last_modified_by
      FROM procedure_steps
      WHERE procedure_id = ${procedureId}
      ORDER BY step_number
    `;

    // Get the current version's step versions
    const currentVersionSteps = await sql`
      SELECT
        psv.step_id,
        psv.step_number,
        psv.step_name,
        LEFT(psv.step_content, 100) as step_content_preview,
        LEFT(psv.description, 100) as description_preview,
        psv.change_type,
        pv.version
      FROM procedure_step_versions psv
      JOIN procedure_versions pv ON psv.version_id = pv.version_id
      WHERE pv.procedure_id = ${procedureId}
        AND pv.version = ${currentVersion}
      ORDER BY psv.step_number
    `;

    // Compare each step
    const comparison = currentSteps.rows.map(currentStep => {
      const versionStep = currentVersionSteps.rows.find(vs => vs.step_id === currentStep.step_id);

      return {
        step_id: currentStep.step_id,
        step_number: currentStep.step_number,
        step_name: currentStep.step_name,
        current_step_version: currentStep.step_current_version,
        expected_version: currentVersion,
        version_matches: currentStep.step_current_version === currentVersion,
        content_matches: versionStep
          ? currentStep.step_content_preview === versionStep.step_content_preview
          : null,
        change_type: versionStep?.change_type,
        current_content: currentStep.step_content_preview,
        versioned_content: versionStep?.step_content_preview,
        last_modified: currentStep.last_modified_at,
        last_modified_by: currentStep.last_modified_by
      };
    });

    return NextResponse.json({
      procedure: proc.rows[0],
      versions: versions.rows,
      current_steps_count: currentSteps.rows.length,
      version_steps_count: currentVersionSteps.rows.length,
      comparison,
      issues: comparison.filter(c => !c.version_matches || c.content_matches === false)
    });

  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json({
      error: 'Failed to debug version',
      details: error.message
    }, { status: 500 });
  }
}
