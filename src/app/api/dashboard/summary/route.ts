import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Enable caching for this route
export const revalidate = 60; // Revalidate every 60 seconds

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || '2024-01-01';
    const endDate = searchParams.get('endDate') || '2025-12-31';

    const summary = await db.getDashboardSummary(startDate, endDate);

    // Calculate incident rates
    const compliantIncidentRate = summary.compliant_count > 0
      ? (summary.compliant_incidents / summary.compliant_count) * 100
      : 0;

    const nonCompliantIncidentRate = (summary.total_work_orders - summary.compliant_count) > 0
      ? (summary.noncompliant_incidents / (summary.total_work_orders - summary.compliant_count)) * 100
      : 0;

    const incidentReduction = compliantIncidentRate > 0
      ? nonCompliantIncidentRate / compliantIncidentRate
      : 0;

    return NextResponse.json({
      totalWorkOrders: parseInt(summary.total_work_orders),
      overallCompliance: parseFloat(summary.compliance_rate),
      incidentReduction: incidentReduction.toFixed(1),
      compliantIncidentRate: compliantIncidentRate.toFixed(1),
      nonCompliantIncidentRate: nonCompliantIncidentRate.toFixed(1),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard summary' },
      { status: 500 }
    );
  }
}
