import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * POST /api/procedures/cleanup-orphaned-steps
 * Remove orphaned steps created with incorrect IDs (e.g., STEP-006, STEP-007)
 * These are steps with step_number = 0 or generic step IDs that don't match the procedure's naming convention
 */
export async function POST(request: Request) {
  try {
    const { procedureId } = await request.json();

    if (procedureId) {
      // Cleanup specific procedure
      return await cleanupProcedure(procedureId);
    } else {
      // Cleanup all procedures
      const procedures = await sql`
        SELECT procedure_id FROM procedures ORDER BY procedure_id
      `;

      const results = [];
      for (const proc of procedures.rows) {
        const result = await cleanupProcedure(proc.procedure_id);
        if (result.deletedSteps > 0 || result.deletedVersionSteps > 0) {
          results.push({
            procedure_id: proc.procedure_id,
            ...result
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Cleaned up ${results.length} procedures`,
        results
      });
    }

  } catch (error: any) {
    console.error('Cleanup error:', error);
    return NextResponse.json({
      error: 'Cleanup failed',
      details: error.message
    }, { status: 500 });
  }
}

async function cleanupProcedure(procedureId: string) {
  // Find orphaned steps in procedure_step_versions
  // These are steps with step_number = 0 or generic IDs like "STEP-006"
  const orphanedVersionSteps = await sql`
    SELECT DISTINCT psv.step_id, psv.step_number, psv.step_name, pv.version
    FROM procedure_step_versions psv
    JOIN procedure_versions pv ON psv.version_id = pv.version_id
    WHERE psv.procedure_id = ${procedureId}
      AND (
        psv.step_number = 0
        OR psv.step_id ~ '^STEP-[0-9]+$'  -- Matches generic STEP-XXX pattern
      )
    ORDER BY pv.version, psv.step_number
  `;

  // Find orphaned steps in procedure_steps
  const orphanedSteps = await sql`
    SELECT step_id, step_number, step_name
    FROM procedure_steps
    WHERE procedure_id = ${procedureId}
      AND (
        step_number = 0
        OR step_id ~ '^STEP-[0-9]+$'
      )
  `;

  const deletedVersionStepIds = [];
  const deletedStepIds = [];

  // Delete from procedure_step_versions
  for (const step of orphanedVersionSteps.rows) {
    await sql`
      DELETE FROM procedure_step_versions
      WHERE step_id = ${step.step_id}
        AND procedure_id = ${procedureId}
    `;
    deletedVersionStepIds.push(step.step_id);
  }

  // Delete from procedure_steps
  for (const step of orphanedSteps.rows) {
    await sql`
      DELETE FROM procedure_steps
      WHERE step_id = ${step.step_id}
        AND procedure_id = ${procedureId}
    `;
    deletedStepIds.push(step.step_id);
  }

  return {
    deletedSteps: deletedStepIds.length,
    deletedVersionSteps: deletedVersionStepIds.length,
    deletedStepIds,
    deletedVersionStepIds: [...new Set(deletedVersionStepIds)] // Unique IDs
  };
}

/**
 * GET /api/procedures/cleanup-orphaned-steps
 * Check for orphaned steps without deleting them
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const procedureId = searchParams.get('procedureId');

    let query;
    if (procedureId) {
      query = sql`
        SELECT
          psv.procedure_id,
          psv.step_id,
          psv.step_number,
          psv.step_name,
          pv.version,
          'version_history' as location
        FROM procedure_step_versions psv
        JOIN procedure_versions pv ON psv.version_id = pv.version_id
        WHERE psv.procedure_id = ${procedureId}
          AND (psv.step_number = 0 OR psv.step_id ~ '^STEP-[0-9]+$')
        UNION ALL
        SELECT
          ps.procedure_id,
          ps.step_id,
          ps.step_number,
          ps.step_name,
          ps.current_version as version,
          'current_steps' as location
        FROM procedure_steps ps
        WHERE ps.procedure_id = ${procedureId}
          AND (ps.step_number = 0 OR ps.step_id ~ '^STEP-[0-9]+$')
        ORDER BY procedure_id, version, step_number
      `;
    } else {
      query = sql`
        SELECT
          psv.procedure_id,
          psv.step_id,
          psv.step_number,
          psv.step_name,
          pv.version,
          'version_history' as location
        FROM procedure_step_versions psv
        JOIN procedure_versions pv ON psv.version_id = pv.version_id
        WHERE psv.step_number = 0 OR psv.step_id ~ '^STEP-[0-9]+$'
        UNION ALL
        SELECT
          ps.procedure_id,
          ps.step_id,
          ps.step_number,
          ps.step_name,
          ps.current_version as version,
          'current_steps' as location
        FROM procedure_steps ps
        WHERE ps.step_number = 0 OR ps.step_id ~ '^STEP-[0-9]+$'
        ORDER BY procedure_id, version, step_number
      `;
    }

    const result = await query;

    return NextResponse.json({
      total: result.rows.length,
      orphaned_steps: result.rows
    });

  } catch (error: any) {
    console.error('Check error:', error);
    return NextResponse.json({
      error: 'Check failed',
      details: error.message
    }, { status: 500 });
  }
}
