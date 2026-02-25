import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * GET /api/test/verify-all-procedures
 * Verify that all procedures have proper version history and change preservation
 */
export async function GET(request: Request) {
  try {
    // Get all procedures with multiple versions
    const procedures = await sql`
      SELECT
        p.procedure_id,
        p.name,
        p.current_version,
        p.version_count,
        COUNT(DISTINCT pv.version_id) as actual_version_count
      FROM procedures p
      LEFT JOIN procedure_versions pv ON p.procedure_id = pv.procedure_id
      GROUP BY p.procedure_id, p.name, p.current_version, p.version_count
      ORDER BY p.procedure_id
    `;

    const results = [];

    for (const proc of procedures.rows) {
      const analysis: any = {
        procedure_id: proc.procedure_id,
        name: proc.name,
        current_version: proc.current_version,
        declared_versions: parseInt(proc.version_count),
        actual_versions: parseInt(proc.actual_version_count),
        steps: []
      };

      // Get all versions for this procedure
      const versions = await sql`
        SELECT version_id, version, created_at
        FROM procedure_versions
        WHERE procedure_id = ${proc.procedure_id}
        ORDER BY created_at
      `;

      analysis.version_history = versions.rows.map(v => v.version);

      // For each step, check if changes are preserved across versions
      const steps = await sql`
        SELECT DISTINCT step_id, step_number, step_name
        FROM procedure_step_versions
        WHERE procedure_id = ${proc.procedure_id}
        ORDER BY step_number
      `;

      for (const step of steps.rows) {
        const stepHistory = await sql`
          SELECT
            pv.version,
            pv.created_at,
            psv.step_content,
            psv.description,
            psv.change_type
          FROM procedure_versions pv
          JOIN procedure_step_versions psv ON pv.version_id = psv.version_id
          WHERE pv.procedure_id = ${proc.procedure_id}
            AND psv.step_id = ${step.step_id}
          ORDER BY pv.created_at
        `;

        const stepAnalysis: any = {
          step_id: step.step_id,
          step_number: step.step_number,
          step_name: step.step_name,
          versions_present: stepHistory.rows.length,
          changes: [],
          issues: []
        };

        // Analyze changes between consecutive versions
        for (let i = 1; i < stepHistory.rows.length; i++) {
          const prev = stepHistory.rows[i - 1];
          const curr = stepHistory.rows[i];

          const contentChanged = prev.step_content !== curr.step_content;
          const changeType = curr.change_type;

          stepAnalysis.changes.push({
            from: prev.version,
            to: curr.version,
            change_type: changeType,
            content_changed: contentChanged
          });

          // Check for potential issues
          if (changeType === 'unchanged' && contentChanged) {
            // Content changed but marked as unchanged - this could indicate an issue
            stepAnalysis.issues.push({
              type: 'content_mismatch',
              versions: `${prev.version} → ${curr.version}`,
              description: 'Content changed but marked as unchanged',
              severity: 'warning'
            });
          }

          if (changeType === 'modified' && !contentChanged) {
            // Marked as modified but content didn't change
            stepAnalysis.issues.push({
              type: 'unnecessary_modification',
              versions: `${prev.version} → ${curr.version}`,
              description: 'Marked as modified but content unchanged',
              severity: 'info'
            });
          }

          // Check for unexpected content reversion
          if (i > 1 && changeType === 'unchanged') {
            // For unchanged steps, content should match the previous version
            if (contentChanged) {
              // Check if it reverted to an even earlier version
              const original = stepHistory.rows[0];
              if (curr.step_content === original.step_content && prev.step_content !== original.step_content) {
                stepAnalysis.issues.push({
                  type: 'content_reversion',
                  versions: `${prev.version} → ${curr.version}`,
                  description: 'Content reverted to original despite being marked unchanged',
                  severity: 'error'
                });
              }
            }
          }
        }

        analysis.steps.push(stepAnalysis);
      }

      // Count issues
      const allIssues = analysis.steps.flatMap((s: any) => s.issues);
      analysis.total_issues = allIssues.length;
      analysis.errors = allIssues.filter((i: any) => i.severity === 'error').length;
      analysis.warnings = allIssues.filter((i: any) => i.severity === 'warning').length;
      analysis.status = analysis.errors > 0 ? 'has_errors' :
                        analysis.warnings > 0 ? 'has_warnings' : 'ok';

      results.push(analysis);
    }

    // Summary statistics
    const summary = {
      total_procedures: results.length,
      procedures_with_errors: results.filter(r => r.errors > 0).length,
      procedures_with_warnings: results.filter(r => r.warnings > 0).length,
      procedures_ok: results.filter(r => r.status === 'ok').length,
      total_steps_analyzed: results.reduce((sum, r) => sum + r.steps.length, 0),
      total_issues: results.reduce((sum, r) => sum + r.total_issues, 0)
    };

    return NextResponse.json({
      summary,
      procedures: results,
      procedures_with_issues: results.filter(r => r.total_issues > 0)
    });

  } catch (error: any) {
    console.error('Verification error:', error);
    return NextResponse.json({
      error: 'Verification failed',
      details: error.message
    }, { status: 500 });
  }
}
