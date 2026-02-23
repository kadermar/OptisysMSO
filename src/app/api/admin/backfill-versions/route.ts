import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST() {
  try {
    // Get all procedures that don't have version 1.0
    const procedures = await sql`
      SELECT p.*
      FROM procedures p
      LEFT JOIN procedure_versions pv ON p.procedure_id = pv.procedure_id AND pv.version = '1.0'
      WHERE pv.version_id IS NULL
    `;

    console.log(`Found ${procedures.rows.length} procedures without version 1.0`);

    for (const proc of procedures.rows) {
      // Get all steps for this procedure
      const steps = await sql`
        SELECT *
        FROM procedure_steps
        WHERE procedure_id = ${proc.procedure_id}
        ORDER BY step_number ASC
      `;

      // Create version 1.0 record
      const versionResult = await sql`
        INSERT INTO procedure_versions (
          procedure_id, version, created_by, change_reason,
          name, category, target_metric, description, total_steps,
          avg_duration_minutes, regulatory_requirement, is_current, status
        ) VALUES (
          ${proc.procedure_id}, '1.0', 'SYSTEM',
          'Initial baseline version - procedure created in system',
          ${proc.name}, ${proc.category}, ${proc.target_metric || null},
          ${proc.description || null}, ${proc.total_steps},
          ${proc.avg_duration_minutes || null}, ${proc.regulatory_requirement || false},
          FALSE, 'active'
        )
        RETURNING version_id
      `;

      const versionId = versionResult.rows[0].version_id;

      // Create step versions for all steps
      for (const step of steps.rows) {
        await sql`
          INSERT INTO procedure_step_versions (
            version_id, step_id, procedure_id, step_number,
            step_name, step_content, criticality, change_type
          ) VALUES (
            ${versionId}, ${step.step_id}, ${proc.procedure_id},
            ${step.step_number}, ${step.step_name},
            ${step.description || step.step_name}, ${step.criticality || 'medium'},
            'unchanged'
          )
        `;
      }

      console.log(`Created version 1.0 for ${proc.procedure_id} (${proc.name})`);
    }

    // Now update any procedures that have versions to mark the latest as current
    await sql`
      UPDATE procedure_versions pv1
      SET is_current = TRUE
      FROM (
        SELECT procedure_id, MAX(version) as max_version
        FROM procedure_versions
        GROUP BY procedure_id
      ) pv2
      WHERE pv1.procedure_id = pv2.procedure_id
        AND pv1.version = pv2.max_version
    `;

    // Mark all others as not current
    await sql`
      UPDATE procedure_versions pv1
      SET is_current = FALSE
      FROM (
        SELECT procedure_id, MAX(version) as max_version
        FROM procedure_versions
        GROUP BY procedure_id
      ) pv2
      WHERE pv1.procedure_id = pv2.procedure_id
        AND pv1.version != pv2.max_version
    `;

    return NextResponse.json({
      success: true,
      message: `Backfilled version 1.0 for ${procedures.rows.length} procedures`,
      count: procedures.rows.length
    });
  } catch (error: any) {
    console.error('Backfill error:', error);
    return NextResponse.json(
      { error: 'Backfill failed', details: error.message },
      { status: 500 }
    );
  }
}
