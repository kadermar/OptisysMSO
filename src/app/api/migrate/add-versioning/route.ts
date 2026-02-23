import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: Request) {
  try {
    console.log('Starting versioning migration...');

    // Step 1: Create ms_owners table
    console.log('Creating ms_owners table...');
    await sql`
      CREATE TABLE IF NOT EXISTS ms_owners (
        ms_owner_id VARCHAR(20) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(100) DEFAULT 'Management System Owner',
        can_edit_procedures BOOLEAN DEFAULT TRUE,
        can_approve_changes BOOLEAN DEFAULT TRUE,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for ms_owners
    await sql`CREATE INDEX IF NOT EXISTS idx_ms_owners_active ON ms_owners(active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ms_owners_email ON ms_owners(email)`;

    // Step 2: Create ci_signals table
    console.log('Creating ci_signals table...');
    await sql`
      CREATE TABLE IF NOT EXISTS ci_signals (
        signal_id VARCHAR(20) PRIMARY KEY,
        procedure_id VARCHAR(20) NOT NULL,
        step_id VARCHAR(30),
        signal_type VARCHAR(50) NOT NULL CHECK (signal_type IN (
          'high_skip_rate', 'deviation_pattern', 'quality_issue',
          'duration_variance', 'safety_correlation', 'rework_pattern'
        )),
        severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'accepted', 'rejected', 'implemented')),
        detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        detection_period_start DATE NOT NULL,
        detection_period_end DATE NOT NULL,
        sample_size INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        evidence JSONB NOT NULL,
        recommendation_text TEXT NOT NULL,
        suggested_change TEXT,
        flagged_for_review BOOLEAN DEFAULT TRUE,
        reviewed_by VARCHAR(20),
        reviewed_at TIMESTAMP,
        review_notes TEXT,
        implemented_in_version VARCHAR(10),
        implemented_at TIMESTAMP,
        estimated_impact_score DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for ci_signals
    await sql`CREATE INDEX IF NOT EXISTS idx_ci_signals_procedure ON ci_signals(procedure_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ci_signals_step ON ci_signals(step_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ci_signals_status ON ci_signals(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ci_signals_severity ON ci_signals(severity)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ci_signals_flagged ON ci_signals(flagged_for_review)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ci_signals_detected ON ci_signals(detected_at)`;

    // Step 3: Create procedure_versions table
    console.log('Creating procedure_versions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS procedure_versions (
        version_id SERIAL PRIMARY KEY,
        procedure_id VARCHAR(20) NOT NULL,
        version VARCHAR(10) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(20),
        change_reason TEXT NOT NULL,
        ci_signal_id VARCHAR(20),
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        target_metric VARCHAR(100),
        description TEXT,
        total_steps INTEGER NOT NULL,
        avg_duration_minutes INTEGER,
        regulatory_requirement BOOLEAN DEFAULT FALSE,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'archived')),
        superseded_by VARCHAR(10),
        is_current BOOLEAN DEFAULT TRUE,
        notes TEXT,
        UNIQUE(procedure_id, version)
      )
    `;

    // Create indexes for procedure_versions
    await sql`CREATE INDEX IF NOT EXISTS idx_proc_versions_procedure ON procedure_versions(procedure_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_proc_versions_current ON procedure_versions(is_current)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_proc_versions_created ON procedure_versions(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_proc_versions_owner ON procedure_versions(created_by)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_proc_versions_signal ON procedure_versions(ci_signal_id)`;

    // Step 4: Create procedure_step_versions table
    console.log('Creating procedure_step_versions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS procedure_step_versions (
        step_version_id SERIAL PRIMARY KEY,
        version_id INTEGER NOT NULL,
        step_id VARCHAR(30) NOT NULL,
        procedure_id VARCHAR(20) NOT NULL,
        step_number INTEGER NOT NULL,
        step_name VARCHAR(255) NOT NULL,
        step_content TEXT,
        typical_duration_minutes INTEGER,
        criticality VARCHAR(20) CHECK (criticality IN ('Low', 'Medium', 'High', 'Critical')),
        description TEXT,
        verification_required BOOLEAN DEFAULT FALSE,
        change_type VARCHAR(20) CHECK (change_type IN ('unchanged', 'modified', 'added', 'removed')),
        changed_fields JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(version_id, step_id)
      )
    `;

    // Create indexes for procedure_step_versions
    await sql`CREATE INDEX IF NOT EXISTS idx_step_versions_version ON procedure_step_versions(version_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_step_versions_step ON procedure_step_versions(step_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_step_versions_change ON procedure_step_versions(change_type)`;

    // Step 5: Alter procedures table (add columns if they don't exist)
    console.log('Altering procedures table...');

    // Check if columns exist first, add only if they don't
    const procColumnsCheck = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'procedures' AND column_name IN ('current_version', 'version_count', 'last_modified_by')
    `;

    const existingProcColumns = new Set(procColumnsCheck.rows.map(r => r.column_name));

    if (!existingProcColumns.has('current_version')) {
      await sql`ALTER TABLE procedures ADD COLUMN current_version VARCHAR(10) DEFAULT '1.0'`;
    }
    if (!existingProcColumns.has('version_count')) {
      await sql`ALTER TABLE procedures ADD COLUMN version_count INTEGER DEFAULT 1`;
    }
    if (!existingProcColumns.has('last_modified_by')) {
      await sql`ALTER TABLE procedures ADD COLUMN last_modified_by VARCHAR(20)`;
    }

    // Create indexes for procedures new columns
    await sql`CREATE INDEX IF NOT EXISTS idx_procedures_current_version ON procedures(current_version)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_procedures_modified_by ON procedures(last_modified_by)`;

    // Step 6: Alter work_orders table
    console.log('Altering work_orders table...');

    const woColumnsCheck = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'work_orders' AND column_name IN ('procedure_version', 'version_id')
    `;

    const existingWOColumns = new Set(woColumnsCheck.rows.map(r => r.column_name));

    if (!existingWOColumns.has('procedure_version')) {
      await sql`ALTER TABLE work_orders ADD COLUMN procedure_version VARCHAR(10) DEFAULT '1.0'`;
    }
    if (!existingWOColumns.has('version_id')) {
      await sql`ALTER TABLE work_orders ADD COLUMN version_id INTEGER`;
    }

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_wo_version ON work_orders(procedure_version)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_wo_version_id ON work_orders(version_id)`;

    // Step 7: Alter procedure_steps table
    console.log('Altering procedure_steps table...');

    const stepsColumnsCheck = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'procedure_steps' AND column_name IN ('step_content', 'current_version', 'last_modified_at', 'last_modified_by')
    `;

    const existingStepsColumns = new Set(stepsColumnsCheck.rows.map(r => r.column_name));

    if (!existingStepsColumns.has('step_content')) {
      await sql`ALTER TABLE procedure_steps ADD COLUMN step_content TEXT`;
    }
    if (!existingStepsColumns.has('current_version')) {
      await sql`ALTER TABLE procedure_steps ADD COLUMN current_version VARCHAR(10) DEFAULT '1.0'`;
    }
    if (!existingStepsColumns.has('last_modified_at')) {
      await sql`ALTER TABLE procedure_steps ADD COLUMN last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
    }
    if (!existingStepsColumns.has('last_modified_by')) {
      await sql`ALTER TABLE procedure_steps ADD COLUMN last_modified_by VARCHAR(20)`;
    }

    // Create index
    await sql`CREATE INDEX IF NOT EXISTS idx_steps_version ON procedure_steps(current_version)`;

    console.log('Migration completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Versioning schema added successfully',
      tables_created: ['ms_owners', 'ci_signals', 'procedure_versions', 'procedure_step_versions'],
      tables_modified: ['procedures', 'work_orders', 'procedure_steps']
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({
      error: 'Migration failed',
      details: error.message,
      hint: 'Check if tables already exist or if there are foreign key conflicts'
    }, { status: 500 });
  }
}

// GET endpoint to check migration status
export async function GET(request: Request) {
  try {
    const tables = ['ms_owners', 'ci_signals', 'procedure_versions', 'procedure_step_versions'];
    const status: Record<string, boolean> = {};

    for (const table of tables) {
      const result = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = ${table}
        )
      `;
      status[table] = result.rows[0].exists;
    }

    // Check procedure columns
    const procColumns = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'procedures' AND column_name IN ('current_version', 'version_count', 'last_modified_by')
    `;

    const allTablesExist = Object.values(status).every(exists => exists);
    const allColumnsAdded = procColumns.rows.length === 3;

    return NextResponse.json({
      migrated: allTablesExist && allColumnsAdded,
      tables: status,
      procedures_columns: procColumns.rows.map(r => r.column_name),
      message: allTablesExist && allColumnsAdded
        ? 'Migration completed'
        : 'Migration incomplete or not started'
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Status check failed',
      details: error.message
    }, { status: 500 });
  }
}
