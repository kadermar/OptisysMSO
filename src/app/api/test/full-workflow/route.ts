import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from '@vercel/postgres';

/**
 * POST /api/test/full-workflow
 * Complete workflow test: Create procedure → Modify Step A → Modify Step B → Verify Step A changes preserved
 */
export async function POST(request: Request) {
  try {
    const testProcedureId = 'TEST-WORKFLOW-002';
    const timeline = [];
    let testPassed = true;
    const failures = [];

    // Cleanup
    await sql`DELETE FROM procedure_step_versions WHERE procedure_id = ${testProcedureId}`;
    await sql`DELETE FROM procedure_versions WHERE procedure_id = ${testProcedureId}`;
    await sql`DELETE FROM procedure_steps WHERE procedure_id = ${testProcedureId}`;
    await sql`DELETE FROM procedures WHERE procedure_id = ${testProcedureId}`;

    timeline.push({
      phase: 'Setup',
      action: 'Cleanup existing test data',
      status: 'complete'
    });

    // ============ PHASE 1: Create Procedure ============
    await sql`
      INSERT INTO procedures (
        procedure_id, name, category, target_metric, description,
        version, current_version, version_count, total_steps,
        avg_duration_minutes, regulatory_requirement, created_at
      ) VALUES (
        ${testProcedureId},
        'Test: Full Workflow Verification',
        'Testing',
        'Quality',
        'Complete workflow test for change preservation',
        '1.0', '1.0', 1, 5, 60, false, CURRENT_TIMESTAMP
      )
    `;

    // Create 5 steps
    const initialSteps = [
      { id: 'WF-STEP-1', num: 1, name: 'Prepare equipment', content: 'Initial: Gather tools and PPE' },
      { id: 'WF-STEP-2', num: 2, name: 'Safety check', content: 'Initial: Verify lockout/tagout' },
      { id: 'WF-STEP-3', num: 3, name: 'Inspection', content: 'Initial: Visual inspection of components' },
      { id: 'WF-STEP-4', num: 4, name: 'Testing', content: 'Initial: Run diagnostic tests' },
      { id: 'WF-STEP-5', num: 5, name: 'Documentation', content: 'Initial: Record findings' }
    ];

    for (const step of initialSteps) {
      await sql`
        INSERT INTO procedure_steps (
          step_id, procedure_id, step_number, step_name, step_content,
          description, typical_duration_minutes, criticality,
          verification_required, current_version, created_at
        ) VALUES (
          ${step.id}, ${testProcedureId}, ${step.num}, ${step.name}, ${step.content},
          ${step.content}, 12, 'Medium', false, '1.0', CURRENT_TIMESTAMP
        )
      `;
    }

    timeline.push({
      phase: 'Phase 1',
      action: 'Created procedure with 5 steps',
      version: '1.0',
      steps: initialSteps.map(s => `${s.name}: "${s.content}"`),
      status: 'complete'
    });

    // ============ PHASE 2: Create v1.0 Baseline ============
    await db.createProcedureVersion({
      procedureId: testProcedureId,
      newVersion: '1.0',
      createdBy: 'TEST-USER',
      changeReason: 'Initial baseline',
      modifiedSteps: initialSteps.map(s => ({
        stepId: s.id,
        changeType: 'unchanged' as const
      }))
    });

    timeline.push({
      phase: 'Phase 2',
      action: 'Created version 1.0 baseline',
      version: '1.0',
      status: 'complete'
    });

    // ============ PHASE 3: Modify Step 2 (Safety check) ============
    const step2ModifiedContent = 'v1.1 MODIFIED: Verify LOTO and test atmospheric monitoring equipment';

    await db.createProcedureVersion({
      procedureId: testProcedureId,
      newVersion: '1.1',
      createdBy: 'TEST-USER',
      changeReason: 'Enhanced safety check procedure',
      modifiedSteps: [
        { stepId: 'WF-STEP-1', changeType: 'unchanged' as const },
        {
          stepId: 'WF-STEP-2',
          changeType: 'modified' as const,
          stepContent: step2ModifiedContent,
          description: step2ModifiedContent
        },
        { stepId: 'WF-STEP-3', changeType: 'unchanged' as const },
        { stepId: 'WF-STEP-4', changeType: 'unchanged' as const },
        { stepId: 'WF-STEP-5', changeType: 'unchanged' as const }
      ]
    });

    timeline.push({
      phase: 'Phase 3',
      action: 'Modified Step 2 (Safety check)',
      version: '1.1',
      modified_step: 'WF-STEP-2',
      new_content: step2ModifiedContent,
      status: 'complete'
    });

    // Verify Step 2 was updated
    const step2Check = await sql`
      SELECT step_content, current_version FROM procedure_steps WHERE step_id = 'WF-STEP-2'
    `;

    if (step2Check.rows[0].step_content !== step2ModifiedContent) {
      testPassed = false;
      failures.push('Step 2 content not updated in procedure_steps after v1.1');
    }

    // ============ PHASE 4: Modify Step 4 (Testing) ============
    const step4ModifiedContent = 'v1.2 MODIFIED: Run full diagnostic suite including pressure and flow tests';

    await db.createProcedureVersion({
      procedureId: testProcedureId,
      newVersion: '1.2',
      createdBy: 'TEST-USER',
      changeReason: 'Enhanced testing procedures',
      modifiedSteps: [
        { stepId: 'WF-STEP-1', changeType: 'unchanged' as const },
        { stepId: 'WF-STEP-2', changeType: 'unchanged' as const }, // Should preserve v1.1 changes!
        { stepId: 'WF-STEP-3', changeType: 'unchanged' as const },
        {
          stepId: 'WF-STEP-4',
          changeType: 'modified' as const,
          stepContent: step4ModifiedContent,
          description: step4ModifiedContent
        },
        { stepId: 'WF-STEP-5', changeType: 'unchanged' as const }
      ]
    });

    timeline.push({
      phase: 'Phase 4',
      action: 'Modified Step 4 (Testing), Step 2 marked as unchanged',
      version: '1.2',
      modified_step: 'WF-STEP-4',
      unchanged_step: 'WF-STEP-2',
      new_content: step4ModifiedContent,
      status: 'complete'
    });

    // ============ PHASE 5: Verify Step 2 Changes Preserved ============
    const step2InV12 = await sql`
      SELECT psv.step_content, psv.change_type
      FROM procedure_step_versions psv
      JOIN procedure_versions pv ON psv.version_id = pv.version_id
      WHERE pv.procedure_id = ${testProcedureId}
        AND pv.version = '1.2'
        AND psv.step_id = 'WF-STEP-2'
    `;

    const step2ContentInV12 = step2InV12.rows[0]?.step_content;
    const step2Preserved = step2ContentInV12 === step2ModifiedContent;

    if (!step2Preserved) {
      testPassed = false;
      failures.push(`Step 2 content not preserved in v1.2. Expected: "${step2ModifiedContent}", Got: "${step2ContentInV12}"`);
    }

    timeline.push({
      phase: 'Phase 5',
      action: 'Verified Step 2 changes preserved in v1.2',
      expected: step2ModifiedContent,
      actual: step2ContentInV12,
      preserved: step2Preserved,
      status: step2Preserved ? 'success' : 'failed'
    });

    // ============ PHASE 6: Full History Verification ============
    const fullHistory = await sql`
      SELECT
        pv.version,
        pv.change_reason,
        json_agg(
          json_build_object(
            'step_id', psv.step_id,
            'step_number', psv.step_number,
            'step_name', psv.step_name,
            'step_content', LEFT(psv.step_content, 50),
            'change_type', psv.change_type
          ) ORDER BY psv.step_number
        ) as steps
      FROM procedure_versions pv
      LEFT JOIN procedure_step_versions psv ON pv.version_id = psv.version_id
      WHERE pv.procedure_id = ${testProcedureId}
      GROUP BY pv.version_id, pv.version, pv.change_reason, pv.created_at
      ORDER BY pv.created_at
    `;

    // Get specific step history for Step 2 and Step 4
    const step2History = await sql`
      SELECT pv.version, psv.step_content, psv.change_type
      FROM procedure_versions pv
      JOIN procedure_step_versions psv ON pv.version_id = psv.version_id
      WHERE pv.procedure_id = ${testProcedureId}
        AND psv.step_id = 'WF-STEP-2'
      ORDER BY pv.created_at
    `;

    const step4History = await sql`
      SELECT pv.version, psv.step_content, psv.change_type
      FROM procedure_versions pv
      JOIN procedure_step_versions psv ON pv.version_id = psv.version_id
      WHERE pv.procedure_id = ${testProcedureId}
        AND psv.step_id = 'WF-STEP-4'
      ORDER BY pv.created_at
    `;

    timeline.push({
      phase: 'Phase 6',
      action: 'Collected full version history',
      status: 'complete'
    });

    return NextResponse.json({
      test_passed: testPassed,
      failures: failures.length > 0 ? failures : null,
      test_procedure_id: testProcedureId,
      timeline,
      verification: {
        step_2_preservation: {
          original_content: 'Initial: Verify lockout/tagout',
          v11_modified_to: step2ModifiedContent,
          v12_preserved_as: step2ContentInV12,
          correctly_preserved: step2Preserved
        },
        step_4_changes: {
          original_content: 'Initial: Run diagnostic tests',
          v12_modified_to: step4ModifiedContent
        }
      },
      detailed_history: {
        all_versions: fullHistory.rows,
        step_2_evolution: step2History.rows,
        step_4_evolution: step4History.rows
      }
    });

  } catch (error: any) {
    console.error('Workflow test error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
