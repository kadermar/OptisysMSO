import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    console.log('Starting demo data seeding...');

    // Step 1: Create MS Owner "J. Berg" if doesn't exist
    console.log('Creating MS Owner: J. Berg...');
    const ownerCheck = await sql`
      SELECT ms_owner_id FROM ms_owners WHERE ms_owner_id = 'MSO-001'
    `;

    if (ownerCheck.rows.length === 0) {
      await sql`
        INSERT INTO ms_owners (ms_owner_id, name, email, role)
        VALUES ('MSO-001', 'J. Berg', 'j.berg@optisys.com', 'Management System Owner')
      `;
      console.log('✓ MS Owner J. Berg created');
    } else {
      console.log('✓ MS Owner J. Berg already exists');
    }

    // Step 2: Backfill all procedures to version 1.0
    console.log('Backfilling procedures to version 1.0...');
    const procedures = await sql`SELECT * FROM procedures`;
    let proceduresBackfilled = 0;

    for (const proc of procedures.rows) {
      // Check if version already exists
      const versionCheck = await sql`
        SELECT version_id FROM procedure_versions
        WHERE procedure_id = ${proc.procedure_id} AND version = '1.0'
      `;

      if (versionCheck.rows.length === 0) {
        // Create version 1.0
        const versionResult = await sql`
          INSERT INTO procedure_versions (
            procedure_id, version, created_by, change_reason,
            name, category, target_metric, description, total_steps,
            avg_duration_minutes, regulatory_requirement, is_current, status
          ) VALUES (
            ${proc.procedure_id}, '1.0', 'MSO-001', 'Initial version baseline',
            ${proc.name}, ${proc.category}, ${proc.target_metric}, ${proc.description || ''},
            ${proc.total_steps}, ${proc.avg_duration_minutes}, ${proc.regulatory_requirement || false},
            TRUE, 'active'
          )
          RETURNING version_id
        `;

        const versionId = versionResult.rows[0].version_id;

        // Get all steps for this procedure
        const steps = await sql`
          SELECT * FROM procedure_steps
          WHERE procedure_id = ${proc.procedure_id}
          ORDER BY step_number
        `;

        // Create step versions
        for (const step of steps.rows) {
          await sql`
            INSERT INTO procedure_step_versions (
              version_id, step_id, procedure_id, step_number, step_name,
              step_content, typical_duration_minutes, criticality, description,
              verification_required, change_type
            ) VALUES (
              ${versionId}, ${step.step_id}, ${step.procedure_id}, ${step.step_number},
              ${step.step_name}, ${step.description || step.step_name}, ${step.typical_duration_minutes},
              ${step.criticality}, ${step.description}, ${step.verification_required || false},
              'unchanged'
            )
          `;
        }

        proceduresBackfilled++;
      }
    }

    console.log(`✓ Backfilled ${proceduresBackfilled} procedures to version 1.0`);

    // Update procedures table
    await sql`
      UPDATE procedures SET
        current_version = '1.0',
        version_count = 1,
        last_modified_by = 'MSO-001'
      WHERE current_version IS NULL OR current_version = ''
    `;

    // Step 3: Generate CI Signal #0047 for PROC-104, Step 5
    console.log('Generating CI Signal #0047...');

    // Check if signal already exists
    const signalCheck = await sql`
      SELECT signal_id FROM ci_signals WHERE signal_id = '#0047'
    `;

    if (signalCheck.rows.length === 0) {
      // Find PROC-104, Step 5
      const proc104Steps = await sql`
        SELECT ps.*, p.name as procedure_name
        FROM procedure_steps ps
        INNER JOIN procedures p ON ps.procedure_id = p.procedure_id
        WHERE ps.procedure_id = 'PROC-104'
        ORDER BY ps.step_number
      `;

      if (proc104Steps.rows.length === 0) {
        console.log('⚠ PROC-104 not found, skipping CI Signal creation');
      } else {
        // Get Step 5 (or any step if less than 5 steps)
        const step5 = proc104Steps.rows.length >= 5
          ? proc104Steps.rows[4]
          : proc104Steps.rows[proc104Steps.rows.length - 1];

        await sql`
          INSERT INTO ci_signals (
            signal_id, procedure_id, step_id, signal_type, severity,
            title, description, evidence, recommendation_text, suggested_change,
            detection_period_start, detection_period_end, sample_size,
            estimated_impact_score, status, flagged_for_review
          ) VALUES (
            '#0047',
            'PROC-104',
            ${step5.step_id},
            'high_skip_rate',
            'high',
            'Step ambiguity causing high skip rate and rework',
            'Analytics have detected that this step is being skipped in 68% of executions. Worker feedback indicates the instruction language is ambiguous, leading to uncertainty and step omission. This pattern correlates with a 22% increase in rework rates.',
            ${JSON.stringify({
              skip_rate: 68,
              total_executions: 30,
              skipped_count: 20,
              rework_correlation: 22,
              avg_task_duration: 52,
              compliance_rate: 74,
              quality_score: 6.8
            })},
            'Clarify instruction language with specific measurements and add verification checkpoint before proceeding to next step.',
            'Replace ambiguous language with specific values and add verification step.',
            '2024-01-01',
            '2024-12-31',
            30,
            85.5,
            'open',
            TRUE
          )
        `;

        console.log('✓ CI Signal #0047 created for PROC-104');
      }
    } else {
      console.log('✓ CI Signal #0047 already exists');
    }

    // Step 4: Update work_orders to reference version 1.0
    console.log('Updating work orders to reference version 1.0...');
    const woUpdateResult = await sql`
      UPDATE work_orders
      SET procedure_version = '1.0'
      WHERE procedure_version IS NULL OR procedure_version = ''
    `;
    console.log(`✓ Updated ${woUpdateResult.rowCount} work orders`);

    console.log('Demo data seeding completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Demo data seeded successfully',
      details: {
        ms_owner_created: ownerCheck.rows.length === 0,
        procedures_backfilled: proceduresBackfilled,
        ci_signal_created: signalCheck.rows.length === 0,
        work_orders_updated: woUpdateResult.rowCount
      }
    });

  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json({
      error: 'Seeding failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

// GET endpoint to check seeding status
export async function GET(request: Request) {
  try {
    const msOwnerCheck = await sql`
      SELECT * FROM ms_owners WHERE ms_owner_id = 'MSO-001'
    `;

    const ciSignalCheck = await sql`
      SELECT * FROM ci_signals WHERE signal_id = '#0047'
    `;

    const versionCheck = await sql`
      SELECT COUNT(*) as count FROM procedure_versions WHERE version = '1.0'
    `;

    const woCheck = await sql`
      SELECT COUNT(*) as count FROM work_orders WHERE procedure_version = '1.0'
    `;

    return NextResponse.json({
      seeded: msOwnerCheck.rows.length > 0 && ciSignalCheck.rows.length > 0,
      ms_owner_exists: msOwnerCheck.rows.length > 0,
      ci_signal_exists: ciSignalCheck.rows.length > 0,
      procedures_versioned: parseInt(versionCheck.rows[0].count),
      work_orders_versioned: parseInt(woCheck.rows[0].count),
      details: {
        ms_owner: msOwnerCheck.rows[0],
        ci_signal: ciSignalCheck.rows[0]
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Status check failed',
      details: error.message
    }, { status: 500 });
  }
}
