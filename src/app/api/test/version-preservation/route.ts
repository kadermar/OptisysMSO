import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from '@vercel/postgres';

/**
 * POST /api/test/version-preservation
 * Test that changes to steps are preserved across versions when other steps are modified
 */
export async function POST(request: Request) {
  try {
    const testProcedureId = 'TEST-PRESERVE-001';
    const testLog = [];

    // Clean up any existing test data
    await sql`DELETE FROM procedure_step_versions WHERE procedure_id = ${testProcedureId}`;
    await sql`DELETE FROM procedure_versions WHERE procedure_id = ${testProcedureId}`;
    await sql`DELETE FROM procedure_steps WHERE procedure_id = ${testProcedureId}`;
    await sql`DELETE FROM procedures WHERE procedure_id = ${testProcedureId}`;

    testLog.push('✓ Cleaned up existing test data');

    // 1. Create test procedure
    await sql`
      INSERT INTO procedures (
        procedure_id, name, category, target_metric, description,
        version, current_version, version_count, total_steps,
        avg_duration_minutes, regulatory_requirement, created_at
      ) VALUES (
        ${testProcedureId},
        'Test: Change Preservation',
        'Testing',
        'Accuracy',
        'Test procedure to verify change preservation',
        '1.0',
        '1.0',
        1,
        3,
        30,
        false,
        CURRENT_TIMESTAMP
      )
    `;

    testLog.push('✓ Created test procedure');

    // 2. Create initial steps
    await sql`
      INSERT INTO procedure_steps (
        step_id, procedure_id, step_number, step_name, step_content,
        description, typical_duration_minutes, criticality,
        verification_required, current_version, created_at
      ) VALUES
        ('TEST-STEP-1', ${testProcedureId}, 1, 'Step One', 'Original content for step 1',
         'Original description 1', 10, 'Medium', false, '1.0', CURRENT_TIMESTAMP),
        ('TEST-STEP-2', ${testProcedureId}, 2, 'Step Two', 'Original content for step 2',
         'Original description 2', 10, 'Medium', false, '1.0', CURRENT_TIMESTAMP),
        ('TEST-STEP-3', ${testProcedureId}, 3, 'Step Three', 'Original content for step 3',
         'Original description 3', 10, 'Medium', false, '1.0', CURRENT_TIMESTAMP)
    `;

    testLog.push('✓ Created 3 initial steps with original content');

    // 3. Create version 1.0 (baseline)
    await db.createProcedureVersion({
      procedureId: testProcedureId,
      newVersion: '1.0',
      createdBy: 'TEST-USER',
      changeReason: 'Initial baseline',
      modifiedSteps: [
        { stepId: 'TEST-STEP-1', changeType: 'unchanged' },
        { stepId: 'TEST-STEP-2', changeType: 'unchanged' },
        { stepId: 'TEST-STEP-3', changeType: 'unchanged' }
      ]
    });

    testLog.push('✓ Created version 1.0 baseline');

    // 4. Create version 1.1 - Modify Step 2 only
    const step2ModifiedContent = 'MODIFIED content for step 2 (v1.1)';
    await db.createProcedureVersion({
      procedureId: testProcedureId,
      newVersion: '1.1',
      createdBy: 'TEST-USER',
      changeReason: 'Modified Step 2',
      modifiedSteps: [
        { stepId: 'TEST-STEP-1', changeType: 'unchanged' },
        {
          stepId: 'TEST-STEP-2',
          changeType: 'modified',
          stepContent: step2ModifiedContent,
          description: step2ModifiedContent
        },
        { stepId: 'TEST-STEP-3', changeType: 'unchanged' }
      ]
    });

    testLog.push('✓ Created version 1.1: Modified Step 2');

    // 5. Verify Step 2 was updated in procedure_steps
    const step2AfterV11 = await sql`
      SELECT step_content, current_version FROM procedure_steps WHERE step_id = 'TEST-STEP-2'
    `;
    const step2V11Content = step2AfterV11.rows[0].step_content;
    testLog.push(`✓ Step 2 content in procedure_steps after v1.1: "${step2V11Content}"`);

    // 6. Create version 1.2 - Modify Step 3 only, Step 2 is unchanged
    const step3ModifiedContent = 'MODIFIED content for step 3 (v1.2)';
    await db.createProcedureVersion({
      procedureId: testProcedureId,
      newVersion: '1.2',
      createdBy: 'TEST-USER',
      changeReason: 'Modified Step 3, Step 2 unchanged',
      modifiedSteps: [
        { stepId: 'TEST-STEP-1', changeType: 'unchanged' },
        { stepId: 'TEST-STEP-2', changeType: 'unchanged' }, // ← Should preserve v1.1 changes!
        {
          stepId: 'TEST-STEP-3',
          changeType: 'modified',
          stepContent: step3ModifiedContent,
          description: step3ModifiedContent
        }
      ]
    });

    testLog.push('✓ Created version 1.2: Modified Step 3, Step 2 marked as unchanged');

    // 7. Check what content was stored for Step 2 in version 1.2
    const step2InV12 = await sql`
      SELECT psv.step_content, psv.change_type, pv.version
      FROM procedure_step_versions psv
      JOIN procedure_versions pv ON psv.version_id = pv.version_id
      WHERE psv.step_id = 'TEST-STEP-2'
        AND pv.version = '1.2'
    `;

    const step2V12Content = step2InV12.rows[0]?.step_content;
    const step2V12ChangeType = step2InV12.rows[0]?.change_type;

    testLog.push(`✓ Step 2 in v1.2: "${step2V12Content}" (change_type: ${step2V12ChangeType})`);

    // 8. Verification
    const success = step2V12Content === step2ModifiedContent;

    if (success) {
      testLog.push('✅ SUCCESS: Step 2\'s v1.1 changes were preserved in v1.2!');
    } else {
      testLog.push(`❌ FAIL: Expected "${step2ModifiedContent}", got "${step2V12Content}"`);
    }

    // 9. Get full history for Step 2
    const step2History = await sql`
      SELECT pv.version, psv.step_content, psv.change_type
      FROM procedure_versions pv
      JOIN procedure_step_versions psv ON pv.version_id = psv.version_id
      WHERE pv.procedure_id = ${testProcedureId}
        AND psv.step_id = 'TEST-STEP-2'
      ORDER BY pv.created_at
    `;

    return NextResponse.json({
      success,
      test_procedure_id: testProcedureId,
      log: testLog,
      step_2_history: step2History.rows,
      verification: {
        v11_content: step2ModifiedContent,
        v12_content: step2V12Content,
        preserved: success
      }
    });

  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error.message
    }, { status: 500 });
  }
}
