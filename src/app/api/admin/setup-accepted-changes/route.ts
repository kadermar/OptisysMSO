import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST() {
  try {
    // Create table to track accepted regulation changes
    await sql`
      CREATE TABLE IF NOT EXISTS accepted_regulation_changes (
        id SERIAL PRIMARY KEY,
        regulation_id VARCHAR(20) NOT NULL REFERENCES regulations(regulation_id),
        procedure_id VARCHAR(20) NOT NULL REFERENCES procedures(procedure_id),
        step_id VARCHAR(30) NOT NULL REFERENCES procedure_steps(step_id),
        change_description TEXT NOT NULL,
        change_type VARCHAR(50) NOT NULL,
        accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        accepted_by VARCHAR(20),
        procedure_version VARCHAR(10) NOT NULL,
        UNIQUE(regulation_id, procedure_id, step_id, change_type)
      )
    `;

    // Create indexes for efficient querying
    await sql`CREATE INDEX IF NOT EXISTS idx_accepted_changes_regulation ON accepted_regulation_changes(regulation_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_accepted_changes_procedure ON accepted_regulation_changes(procedure_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_accepted_changes_step ON accepted_regulation_changes(step_id)`;

    return NextResponse.json({
      success: true,
      message: 'Accepted regulation changes table created successfully'
    });
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Setup failed', details: error.message },
      { status: 500 }
    );
  }
}
