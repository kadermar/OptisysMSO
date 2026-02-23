import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { question, dashboardData } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });

    // Fetch full procedure details and step-level metrics directly from DB.
    // Previously used HTTP self-calls which required NEXT_PUBLIC_BASE_URL (exposed
    // in the client bundle) and silently broke in production when not configured.
    const procedureContext = await Promise.all(
      (dashboardData.procedures?.slice(0, 5) || []).map(async (p: any) => {
        try {
          const [fullProcedure, stepMetrics] = await Promise.all([
            db.getProcedureWithSteps(p.procedure_id),
            db.getProcedureStepAnalysis(p.procedure_id, '2024-01-01', '2025-12-31'),
          ]);

          return {
            ...p,
            steps: fullProcedure?.steps || [],
            description: (fullProcedure as any)?.description,
            stepMetrics,
          };
        } catch (err) {
          console.error(`Failed to fetch procedure ${p.procedure_id}:`, err);
          return p;
        }
      })
    );

    // Prepare context from dashboard data
    const context = `
You are Opti, an expert operations intelligence assistant for OptiSys - an advanced operations management platform. Your role is to provide comprehensive, insightful analysis of operational data, procedures, and performance metrics.

IMPORTANT INSTRUCTIONS:
- Provide detailed, thorough answers that fully address the user's question
- When analyzing data, include relevant metrics, trends, and statistical insights
- Explain the significance of findings and what they mean for operational performance
- When asked about procedures, provide complete step-by-step breakdowns with context about criticality and safety requirements
- Offer actionable insights and recommendations based on the data patterns you observe
- Use clear formatting with bullet points, numbered lists, and sections when appropriate
- Be conversational yet professional - explain concepts clearly as if speaking to an operations manager
- Highlight both positive trends and areas of concern
- Connect related information to provide holistic understanding
- Include specific numbers and percentages to support your analysis

KEY TERMINOLOGY - PAY CLOSE ATTENTION:
- "PROCEDURE COMPLIANCE" = Overall rate of work orders where ALL steps were completed (reported as compliance_rate at procedure level)
- "STEP ADHERENCE" = Rate at which a SPECIFIC STEP was completed across work orders (reported as completion_rate at step level)
- When asked about "procedure step" or "step", refer to STEP ADHERENCE metrics (completion_rate)
- When asked about "procedure" without "step", refer to PROCEDURE COMPLIANCE metrics
- A procedure can have low compliance but high step adherence if different work orders skip different steps

ALL PROCEDURES (sorted by total incidents):
${dashboardData.procedures?.sort((a: any, b: any) => (b.total_incidents || 0) - (a.total_incidents || 0)).map((p: any) => {
  const procDetail = procedureContext.find((pc: any) => pc.procedure_id === p.procedure_id);
  return `
PROCEDURE: ${p.name} (${p.procedure_id})
Category: ${p.category}
Compliance Rate: ${p.compliance_rate}% (work orders where ALL steps completed)
Total Incidents: ${p.total_incidents || 0}
  - Compliant Incidents: ${p.compliant_incidents || 0}
  - Non-Compliant Incidents: ${p.noncompliant_incidents || 0}
${procDetail?.description ? `Description: ${procDetail.description}` : ''}
${procDetail?.steps?.length > 0 ? `\nPROCEDURE STEPS (${procDetail.steps.length} total):
${procDetail.steps.map((s: any) => `  Step ${s.step_number}: ${s.description}${s.criticality ? ` [${s.criticality} criticality]` : ''}${s.safety_requirements ? `\n    Safety: ${s.safety_requirements}` : ''}`).join('\n')}` : ''}
${procDetail?.stepMetrics?.length > 0 ? `\nSTEP-LEVEL ADHERENCE METRICS:
${procDetail.stepMetrics.map((sm: any) => `  Step ${sm.step_number} (${sm.step_name}):
    - Adherence: ${sm.completion_rate}% (completed in ${sm.completed_count}/${sm.checkpoint_count} work orders)
    - Quality: ${sm.quality_rate}% (${sm.quality_issue_count} issues)
    - Criticality: ${sm.criticality}
    - Avg Duration: ${sm.avg_duration_minutes} min (variance: ${sm.duration_variance} min)`).join('\n')}` : ''}`;
}).join('\n---\n')}

SUMMARY METRICS:
- Total Work Orders: ${dashboardData.summary?.totalWorkOrders || 0}
- Overall Compliance: ${dashboardData.summary?.overallCompliance || 0}%
- Incident Reduction: ${dashboardData.summary?.incidentReduction || 0}%

FACILITIES (${dashboardData.facilities?.length || 0} total):
${dashboardData.facilities?.map((f: any) =>
  `- ${f.name} (${f.performance_tier}): ${f.compliance_rate}% compliance, ${f.total_incidents} incidents`
).join('\n')}

WORKERS (${dashboardData.workers?.length || 0} total):
${dashboardData.workers?.map((w: any) =>
  `- ${w.worker_name} (${w.experience_level}): ${w.compliance_rate}% compliance, ${w.incident_count} incidents`
).join('\n')}

Analyze the data comprehensively and provide a detailed, insightful response to the user's question. Include relevant context, trends, and actionable recommendations.
`;

    // Call OpenAI API for the main answer
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: context,
        },
        {
          role: 'user',
          content: question,
        },
      ],
      max_tokens: 4096,
      temperature: 0.7,
    });

    // Extract the text response
    const answer = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Use AI to identify relevant sources
    const sourceIdentification = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a data analyst. Given a user question and available data sources, identify which specific sources are DIRECTLY relevant to answering the question. Only include sources that were actually used or referenced.',
        },
        {
          role: 'user',
          content: `Question: "${question}"\n\nAvailable sources:\nProcedures: ${dashboardData.procedures?.map((p: any) => p.name).join(', ')}\nFacilities: ${dashboardData.facilities?.map((f: any) => f.name).join(', ')}\nWorkers: ${dashboardData.workers?.map((w: any) => w.worker_name).join(', ')}\n\nRespond with a JSON object listing only the relevant source names:\n{"procedures": [], "facilities": [], "workers": []}`,
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    let relevantSourceNames = { procedures: [], facilities: [], workers: [] };
    try {
      const sourceResponse = sourceIdentification.choices[0]?.message?.content || '{}';
      const jsonMatch = sourceResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        relevantSourceNames = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse source identification:', e);
    }

    // Filter relevant procedures and fetch their full details directly from DB
    const relevantProcedures = dashboardData.procedures?.filter((p: any) =>
      (relevantSourceNames.procedures || []).some((name: string) =>
        p.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(p.name.toLowerCase())
      )
    ) || [];

    const proceduresWithDetails = await Promise.all(
      relevantProcedures.map(async (p: any) => {
        try {
          const [fullProcedure, stepMetrics] = await Promise.all([
            db.getProcedureWithSteps(p.procedure_id),
            db.getProcedureStepAnalysis(p.procedure_id, '2024-01-01', '2025-12-31'),
          ]);

          return {
            id: p.procedure_id,
            name: p.name,
            type: 'procedure',
            category: p.category,
            compliance_rate: p.compliance_rate,
            compliant_incidents: p.compliant_incidents,
            noncompliant_incidents: p.noncompliant_incidents,
            total_incidents: p.total_incidents,
            metrics: `${p.compliance_rate}% compliance`,
            steps: fullProcedure?.steps || [],
            stepMetrics,
            description: (fullProcedure as any)?.description,
            safety_critical: (fullProcedure as any)?.safety_critical,
          };
        } catch (err) {
          console.error(`Failed to fetch procedure ${p.procedure_id}:`, err);
          return {
            id: p.procedure_id,
            name: p.name,
            type: 'procedure',
            category: p.category,
            compliance_rate: p.compliance_rate,
            compliant_incidents: p.compliant_incidents,
            noncompliant_incidents: p.noncompliant_incidents,
            total_incidents: p.total_incidents,
            metrics: `${p.compliance_rate}% compliance`,
            steps: [],
            stepMetrics: [],
          };
        }
      })
    );

    // Filter and prepare detailed sources
    const sources = {
      procedures: proceduresWithDetails,
      facilities: dashboardData.facilities?.filter((f: any) =>
        (relevantSourceNames.facilities || []).some((name: string) =>
          f.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(f.name.toLowerCase())
        )
      ).map((f: any) => ({
        id: f.facility_id,
        name: f.name,
        type: 'facility',
        performance_tier: f.performance_tier,
        compliance_rate: f.compliance_rate,
        total_incidents: f.total_incidents,
        avg_quality_score: f.avg_quality_score,
        metrics: `${f.compliance_rate}% compliance, ${f.performance_tier} tier`
      })) || [],
      workers: dashboardData.workers?.filter((w: any) =>
        (relevantSourceNames.workers || []).some((name: string) =>
          w.worker_name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(w.worker_name.toLowerCase())
        )
      ).map((w: any) => ({
        id: w.worker_id,
        name: w.worker_name,
        type: 'worker',
        experience_level: w.experience_level,
        compliance_rate: w.compliance_rate,
        incident_count: w.incident_count,
        avg_quality_score: w.avg_quality_score,
        metrics: `${w.compliance_rate}% compliance, ${w.experience_level}`
      })) || [],
      summary: {
        totalWorkOrders: dashboardData.summary?.totalWorkOrders || 0,
        overallCompliance: dashboardData.summary?.overallCompliance || 0,
        incidentReduction: dashboardData.summary?.incidentReduction || 0
      }
    };

    return NextResponse.json({ answer, sources });
  } catch (error) {
    console.error('Error in AI Assistant:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
