import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST() {
  try {
    // Create regulations table
    await sql`
      CREATE TABLE IF NOT EXISTS regulations (
        regulation_id VARCHAR(20) PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        source VARCHAR(200) NOT NULL,
        effective_date DATE NOT NULL,
        priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
        affected_procedures JSONB NOT NULL DEFAULT '[]'::jsonb,
        status VARCHAR(30) CHECK (status IN ('pending_review', 'in_review', 'approved', 'implemented', 'rejected')) DEFAULT 'pending_review',
        summary TEXT NOT NULL,
        document_text TEXT,
        key_changes JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(20),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_regulations_status ON regulations(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_regulations_priority ON regulations(priority)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_regulations_created_at ON regulations(created_at DESC)`;

    // Get first 5 procedures for seeding
    const procResult = await sql`
      SELECT procedure_id FROM procedures ORDER BY procedure_id LIMIT 5
    `;
    const procedureIds = procResult.rows.map(r => r.procedure_id);

    if (procedureIds.length >= 5) {
      // Seed initial regulations
      const reg1 = await sql`
        INSERT INTO regulations (
          regulation_id, title, source, effective_date, priority,
          affected_procedures, status, summary, document_text, key_changes, created_by
        ) VALUES (
          'REG-2024-001',
          'Updated OSHA Safety Requirements for Equipment Maintenance',
          'OSHA Standard 1910.147(c)(4)',
          '2024-06-01',
          'high',
          ${JSON.stringify(procedureIds.slice(0, 3))}::jsonb,
          'pending_review',
          'OSHA has updated the lockout/tagout requirements to include additional verification steps for mechanical maintenance procedures. All affected procedures must be updated to include the new verification protocols.',
          'OCCUPATIONAL SAFETY AND HEALTH ADMINISTRATION
Standard 1910.147(c)(4) - The Control of Hazardous Energy (Lockout/Tagout)

SECTION 1: GENERAL REQUIREMENTS
This standard covers the servicing and maintenance of machines and equipment in which the unexpected energization or start-up of the machines or equipment, or release of stored energy, could harm employees.

SECTION 2: ENERGY CONTROL PROCEDURE
(c)(4) The employer shall develop, document, and utilize procedures for the control of potentially hazardous energy when employees are engaged in the activities covered by this section.

NEW REQUIREMENTS (Effective June 1, 2024):
(c)(4)(i) Procedures shall include a verification step to be performed by a second qualified person before equipment is returned to service.

(c)(4)(ii) The verification must confirm that:
  A. All energy isolating devices have been properly applied
  B. All locks and tags are in place and properly affixed
  C. All affected employees have been notified
  D. All tools and materials have been removed from the work area
  E. Equipment guards and safety devices have been reinstalled

(c)(4)(iii) Documentation of the verification must be maintained for a minimum of 3 years.',
          ${JSON.stringify([
            'Addition of mandatory two-person verification step',
            'New documentation requirements for lockout/tagout',
            '3-year record retention requirement',
            'Enhanced training requirements for all personnel'
          ])}::jsonb,
          'MSO-001'
        )
        ON CONFLICT (regulation_id) DO NOTHING
      `;

      const reg2 = await sql`
        INSERT INTO regulations (
          regulation_id, title, source, effective_date, priority,
          affected_procedures, status, summary, document_text, key_changes, created_by
        ) VALUES (
          'REG-2024-002',
          'ISO 9001:2024 Quality Management System Update',
          'ISO 9001:2024 Section 8.5.1',
          '2024-08-15',
          'high',
          ${JSON.stringify(procedureIds.slice(2, 5))}::jsonb,
          'pending_review',
          'ISO 9001:2024 introduces enhanced quality documentation and traceability requirements. All operational procedures must include detailed quality metrics, deviation tracking, and process parameter documentation.',
          'INTERNATIONAL ORGANIZATION FOR STANDARDIZATION
ISO 9001:2024 - Quality Management Systems

SECTION 8.5.1: Control of production and service provision

The organization shall implement production and service provision under controlled conditions.

NEW REQUIREMENTS (Effective August 15, 2024):
(8.5.1.1) Enhanced Documentation Requirements
Organizations must now document:
  A. Quality metrics at each critical control point
  B. Dimensional accuracy and measurement data
  C. Process parameters and environmental conditions
  D. Root cause analysis for all deviations
  E. Traceability links to quality management system',
          ${JSON.stringify([
            'Enhanced quality metric documentation requirements',
            'Mandatory deviation tracking with root cause analysis',
            'Process parameter recording obligations',
            'Traceability system integration'
          ])}::jsonb,
          'MSO-001'
        )
        ON CONFLICT (regulation_id) DO NOTHING
      `;

      const reg3 = await sql`
        INSERT INTO regulations (
          regulation_id, title, source, effective_date, priority,
          affected_procedures, status, summary, document_text, key_changes, created_by
        ) VALUES (
          'REG-2024-003',
          'Environmental Compliance Reporting Standards',
          'ISO 14001:2024',
          '2024-09-01',
          'medium',
          ${JSON.stringify([procedureIds[1], procedureIds[3]])}::jsonb,
          'pending_review',
          'ISO 14001:2024 introduces new environmental documentation requirements for operational procedures. Additional data collection and reporting steps must be integrated into existing workflows.',
          'INTERNATIONAL ORGANIZATION FOR STANDARDIZATION
ISO 14001:2024 - Environmental Management Systems

SECTION 8.1.1: Operational planning and control

NEW REQUIREMENTS (Effective September 1, 2024):
Organizations must document environmental aspects of each operational process:
  A. Baseline environmental metrics (energy, water, materials)
  B. Resource consumption at each process step
  C. Ambient conditions affecting environmental impact
  D. Waste generation and disposal methods
  E. Carbon footprint calculations where applicable',
          ${JSON.stringify([
            'Mandatory environmental data collection steps',
            'Real-time monitoring requirements',
            'Quantifiable performance indicators',
            'Enhanced reporting obligations'
          ])}::jsonb,
          'MSO-001'
        )
        ON CONFLICT (regulation_id) DO NOTHING
      `;
    }

    return NextResponse.json({
      success: true,
      message: 'Regulations table created and seeded with initial data'
    });
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Setup failed', details: error.message },
      { status: 500 }
    );
  }
}
