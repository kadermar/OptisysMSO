import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: Request) {
  try {
    // Get all work orders
    const workOrdersResult = await sql`
      SELECT wo_id, procedure_id, compliant
      FROM work_orders
    `;

    let totalCheckpoints = 0;

    for (const workOrder of workOrdersResult.rows) {
      // Get all steps for this procedure
      const stepsResult = await sql`
        SELECT step_id, step_number, criticality
        FROM procedure_steps
        WHERE procedure_id = ${workOrder.procedure_id}
        ORDER BY step_number
      `;

      const steps = stepsResult.rows;
      if (steps.length === 0) continue;

      // Determine completion rate based on work order compliance
      // Compliant work orders: 80-100% completion
      // Non-compliant work orders: 40-80% completion
      const minCompletion = workOrder.compliant ? 0.8 : 0.4;
      const maxCompletion = workOrder.compliant ? 1.0 : 0.8;
      const completionRate = minCompletion + Math.random() * (maxCompletion - minCompletion);
      
      const numToComplete = Math.floor(steps.length * completionRate);
      
      // Shuffle and select steps to mark as completed
      const shuffledSteps = [...steps].sort(() => Math.random() - 0.5);
      const completedSteps = shuffledSteps.slice(0, numToComplete);
      
      // Create compliance checkpoints for each completed step
      for (const step of completedSteps) {
        const completed = true;
        const meetsSpec = workOrder.compliant ? Math.random() > 0.1 : Math.random() > 0.4;
        const deviationNoted = !meetsSpec || Math.random() < 0.15;
        const durationMinutes = Math.floor(5 + Math.random() * 25);

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
            ${workOrder.procedure_id},
            ${step.step_id},
            ${step.step_number},
            ${completed},
            ${deviationNoted},
            ${meetsSpec},
            ${durationMinutes}
          )
          ON CONFLICT DO NOTHING
        `;
        
        totalCheckpoints++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Backfill completed. Created ${totalCheckpoints} compliance checkpoints for ${workOrdersResult.rows.length} work orders.`,
      workOrdersProcessed: workOrdersResult.rows.length,
      checkpointsCreated: totalCheckpoints,
    });
  } catch (error) {
    console.error('Error backfilling checkpoints:', error);
    return NextResponse.json(
      { error: 'Failed to backfill checkpoints' },
      { status: 500 }
    );
  }
}
