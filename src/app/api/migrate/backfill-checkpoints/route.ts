import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST() {
  console.log('Starting checkpoint backfill...');

  try {
    // Get all work orders
    const workOrders = await sql`
      SELECT wo_id, procedure_id, completed_steps, total_steps
      FROM work_orders
      ORDER BY scheduled_date DESC
    `;

    console.log(`Found ${workOrders.rows.length} work orders to process`);

    let processedCount = 0;
    let checkpointsCreated = 0;

    for (const workOrder of workOrders.rows) {
      // Get all steps for this procedure
      const allSteps = await sql`
        SELECT step_id, step_number, procedure_id
        FROM procedure_steps
        WHERE procedure_id = ${workOrder.procedure_id}
        ORDER BY step_number
      `;

      // Get existing checkpoints for this work order
      const existingCheckpoints = await sql`
        SELECT step_id
        FROM compliance_checkpoints
        WHERE wo_id = ${workOrder.wo_id}
      `;

      const existingStepIds = new Set(
        existingCheckpoints.rows.map((cp: any) => cp.step_id)
      );

      // Calculate which steps should have been completed
      // If completed_steps = total_steps, all were completed
      // Otherwise, we need to mark some as not completed
      const completionRate = workOrder.completed_steps / workOrder.total_steps;
      const numStepsToComplete = Math.round(allSteps.rows.length * completionRate);

      // Create checkpoints for missing steps
      for (let i = 0; i < allSteps.rows.length; i++) {
        const step = allSteps.rows[i];

        // Skip if checkpoint already exists
        if (existingStepIds.has(step.step_id)) {
          continue;
        }

        // Determine if this step should be marked as completed
        // Earlier steps are more likely to be completed
        const isCompleted = i < numStepsToComplete;

        await sql`
          INSERT INTO compliance_checkpoints (
            wo_id,
            procedure_id,
            step_id,
            step_number,
            completed,
            deviation_noted,
            meets_spec,
            duration_minutes
          )
          VALUES (
            ${workOrder.wo_id},
            ${step.procedure_id},
            ${step.step_id},
            ${step.step_number},
            ${isCompleted},
            ${!isCompleted},
            ${isCompleted},
            0
          )
        `;

        checkpointsCreated++;
      }

      processedCount++;
      if (processedCount % 10 === 0) {
        console.log(`Processed ${processedCount}/${workOrders.rows.length} work orders, created ${checkpointsCreated} checkpoints`);
      }
    }

    console.log('\n✓ Backfill complete!');
    console.log(`Total work orders processed: ${processedCount}`);
    console.log(`Total checkpoints created: ${checkpointsCreated}`);

    return NextResponse.json({
      success: true,
      workOrdersProcessed: processedCount,
      checkpointsCreated: checkpointsCreated
    });

  } catch (error) {
    console.error('Error during backfill:', error);
    return NextResponse.json(
      { error: 'Failed to backfill checkpoints' },
      { status: 500 }
    );
  }
}
