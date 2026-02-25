import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// Enable caching for this route
export const revalidate = 60; // Revalidate every 60 seconds

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || '2024-01-01';
    const endDate = searchParams.get('endDate') || '2025-12-31';

    const result = await sql`
      SELECT
        w.worker_id,
        w.name as worker_name,
        w.experience_level,
        w.facility_id,
        f.name as platform,
        COUNT(wo.wo_id) as work_order_count,
        ROUND(CAST(AVG(CASE WHEN wo.compliant THEN 1.0 ELSE 0.0 END) * 100 AS NUMERIC), 1) as compliance_rate,
        SUM(CASE WHEN wo.safety_incident THEN 1 ELSE 0 END) as incident_count,
        SUM(CASE WHEN wo.rework_required THEN 1 ELSE 0 END) as rework_count,
        ROUND(CAST(AVG(wo.quality_score) AS NUMERIC), 1) as avg_quality_score,
        ROUND(CAST(AVG(wo.duration_hours) AS NUMERIC), 1) as avg_duration_hours
      FROM workers w
      LEFT JOIN facilities f ON w.facility_id = f.facility_id
      LEFT JOIN work_orders wo ON w.worker_id = wo.worker_id
      WHERE wo.scheduled_date >= ${startDate}::date
        AND wo.scheduled_date <= ${endDate}::date
      GROUP BY w.worker_id, w.name, w.experience_level, w.facility_id, f.name
      HAVING COUNT(wo.wo_id) > 0
      ORDER BY compliance_rate DESC
    `;

    return NextResponse.json(result.rows, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error fetching worker performance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch worker performance' },
      { status: 500 }
    );
  }
}
