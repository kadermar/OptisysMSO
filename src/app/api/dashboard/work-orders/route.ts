import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      procedure_id,
      facility_id,
      worker_id,
      completedSteps, // Array of step_ids that were completed
      totalSteps, // Total number of steps in the procedure
      hasIncident, // Boolean indicating if there was an incident
      isCompliant, // Boolean indicating if all steps were completed
      qualityScore, // Calculated quality score based on completion
      durationHours, // Duration of the work order in hours
      downtimeHours, // Downtime of the work order in hours
    } = body;

    if (!procedure_id || !facility_id || !worker_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate a collision-free work order ID using a UUID fragment.
    // The previous MAX()+1 approach had a race condition under concurrent requests.
    const nextWoId = `WO-${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;

    // Calculate completion percentage (0-100 scale)
    const completionPercentage = totalSteps > 0
      ? ((completedSteps?.length || 0) / totalSteps) * 100
      : 0;

    // Create the work order
    const workOrderResult = await sql`
      INSERT INTO work_orders (
        wo_id,
        procedure_id,
        facility_id,
        worker_id,
        scheduled_date,
        compliant,
        quality_score,
        duration_hours,
        downtime_hours,
        safety_incident,
        rework_required,
        equipment_trip,
        total_steps,
        completed_steps,
        completion_percentage
      )
      VALUES (
        ${nextWoId},
        ${procedure_id},
        ${facility_id},
        ${worker_id},
        CURRENT_DATE,
        ${isCompliant},
        ${qualityScore},
        ${durationHours || 0},
        ${downtimeHours || 0},
        ${hasIncident},
        ${!isCompliant},
        false,
        ${totalSteps || 0},
        ${completedSteps?.length || 0},
        ${completionPercentage}
      )
      RETURNING wo_id
    `;

    const workOrderId = workOrderResult.rows[0].wo_id;

    // Get ALL steps for this procedure
    const allStepsResult = await sql`
      SELECT step_id, step_number, procedure_id
      FROM procedure_steps
      WHERE procedure_id = ${procedure_id}
      ORDER BY step_number
    `;

    // Create compliance checkpoints for ALL steps (both completed and skipped)
    const completedStepSet = new Set(completedSteps || []);

    for (const step of allStepsResult.rows) {
      const isCompleted = completedStepSet.has(step.step_id);

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
          ${workOrderId},
          ${step.procedure_id},
          ${step.step_id},
          ${step.step_number},
          ${isCompleted},
          ${!isCompleted},
          ${isCompleted},
          0
        )
      `;
    }

    return NextResponse.json({
      success: true,
      wo_id: workOrderId,
      message: 'Work order created successfully'
    });
  } catch (error) {
    console.error('Error creating work order:', error);
    return NextResponse.json(
      { error: 'Failed to create work order' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const procedureId = searchParams.get('procedure_id');
    const startDate = searchParams.get('startDate') || '2024-01-01';
    // Use current date + 1 year as default end date to ensure new work orders are always included
    const defaultEndDate = new Date();
    defaultEndDate.setFullYear(defaultEndDate.getFullYear() + 1);
    const endDate = searchParams.get('endDate') || defaultEndDate.toISOString().split('T')[0];

    let query;
    if (procedureId) {
      query = sql`
        SELECT
          wo.*,
          w.name as worker_name,
          w.experience_level,
          f.name as facility_name,
          p.name as procedure_name,
          p.category as procedure_category
        FROM work_orders wo
        LEFT JOIN workers w ON wo.worker_id = w.worker_id
        LEFT JOIN facilities f ON wo.facility_id = f.facility_id
        LEFT JOIN procedures p ON wo.procedure_id = p.procedure_id
        WHERE wo.procedure_id = ${procedureId}
          AND wo.scheduled_date >= ${startDate}::date
          AND wo.scheduled_date <= ${endDate}::date
        ORDER BY wo.scheduled_date DESC
        LIMIT 50
      `;
    } else {
      query = sql`
        SELECT
          wo.*,
          w.name as worker_name,
          w.experience_level,
          f.name as facility_name,
          p.name as procedure_name,
          p.category as procedure_category
        FROM work_orders wo
        LEFT JOIN workers w ON wo.worker_id = w.worker_id
        LEFT JOIN facilities f ON wo.facility_id = f.facility_id
        LEFT JOIN procedures p ON wo.procedure_id = p.procedure_id
        WHERE wo.scheduled_date >= ${startDate}::date
          AND wo.scheduled_date <= ${endDate}::date
        ORDER BY wo.scheduled_date DESC
      `;
    }

    const result = await query;
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching work orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work orders' },
      { status: 500 }
    );
  }
}
