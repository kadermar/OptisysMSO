import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: procedureId } = await params;
    const { searchParams } = new URL(request.url);
    const stepNumber = searchParams.get('stepNumber');

    if (stepNumber) {
      // Get history for a specific step across all versions
      const history = await sql`
        SELECT
          pv.version,
          pv.created_at,
          pv.created_by,
          pv.change_reason,
          psv.step_id,
          psv.step_number,
          psv.step_name,
          psv.step_content,
          psv.description,
          psv.change_type,
          psv.changed_fields
        FROM procedure_versions pv
        JOIN procedure_step_versions psv ON pv.version_id = psv.version_id
        WHERE pv.procedure_id = ${procedureId}
          AND psv.step_number = ${parseInt(stepNumber)}
        ORDER BY pv.created_at
      `;

      // Compare content changes between versions
      const changes = [];
      for (let i = 1; i < history.rows.length; i++) {
        const prev = history.rows[i - 1];
        const curr = history.rows[i];

        const contentChanged = prev.step_content !== curr.step_content;
        const descriptionChanged = prev.description !== curr.description;

        changes.push({
          from_version: prev.version,
          to_version: curr.version,
          change_type: curr.change_type,
          content_changed: contentChanged,
          description_changed: descriptionChanged,
          content_preserved: !contentChanged && curr.change_type === 'unchanged'
        });
      }

      return NextResponse.json({
        procedure_id: procedureId,
        step_number: parseInt(stepNumber),
        versions: history.rows,
        changes
      });
    } else {
      // Get all versions with step counts
      const versions = await sql`
        SELECT
          pv.version_id,
          pv.version,
          pv.created_at,
          pv.created_by,
          pv.change_reason,
          pv.is_current,
          COUNT(psv.step_id) as total_steps,
          COUNT(psv.step_id) FILTER (WHERE psv.change_type = 'modified') as modified_steps,
          COUNT(psv.step_id) FILTER (WHERE psv.change_type = 'unchanged') as unchanged_steps,
          COUNT(psv.step_id) FILTER (WHERE psv.change_type = 'added') as added_steps,
          COUNT(psv.step_id) FILTER (WHERE psv.change_type = 'removed') as removed_steps
        FROM procedure_versions pv
        LEFT JOIN procedure_step_versions psv ON pv.version_id = psv.version_id
        WHERE pv.procedure_id = ${procedureId}
        GROUP BY pv.version_id, pv.version, pv.created_at, pv.created_by, pv.change_reason, pv.is_current
        ORDER BY pv.created_at
      `;

      return NextResponse.json({
        procedure_id: procedureId,
        versions: versions.rows
      });
    }

  } catch (error: any) {
    console.error('Version history error:', error);
    return NextResponse.json({
      error: 'Failed to fetch version history',
      details: error.message
    }, { status: 500 });
  }
}
