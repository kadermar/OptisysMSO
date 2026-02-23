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

    // Create index on status and priority for filtering
    await sql`
      CREATE INDEX IF NOT EXISTS idx_regulations_status ON regulations(status)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_regulations_priority ON regulations(priority)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_regulations_created_at ON regulations(created_at DESC)
    `;

    return NextResponse.json({
      success: true,
      message: 'Regulations table created successfully'
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    );
  }
}
