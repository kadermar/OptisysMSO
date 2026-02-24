import { sql } from '@vercel/postgres';

export const db = {
  // Get dashboard summary statistics
  async getDashboardSummary(startDate = '2024-01-01', endDate = '2024-12-31') {
    const result = await sql`
      SELECT
        COUNT(*) as total_work_orders,
        SUM(CASE WHEN compliant THEN 1 ELSE 0 END) as compliant_count,
        ROUND(AVG(CASE WHEN compliant THEN 1.0 ELSE 0.0 END) * 100, 1) as compliance_rate,
        SUM(CASE WHEN compliant AND safety_incident THEN 1 ELSE 0 END) as compliant_incidents,
        SUM(CASE WHEN NOT compliant AND safety_incident THEN 1 ELSE 0 END) as noncompliant_incidents
      FROM work_orders
      WHERE scheduled_date >= ${startDate}::date
        AND scheduled_date <= ${endDate}::date
    `;
    return result.rows[0];
  },

  // Get procedure performance data
  async getProcedurePerformance(startDate = '2024-01-01', endDate = '2024-12-31') {
    const result = await sql`
      SELECT
        p.procedure_id,
        p.name,
        p.category,
        p.target_metric,
        (SELECT COUNT(*) FROM procedure_steps ps WHERE ps.procedure_id = p.procedure_id) as total_steps,
        COUNT(wo.wo_id) as total_work_orders,
        SUM(CASE WHEN wo.compliant THEN 1 ELSE 0 END) as compliant_count,
        ROUND(AVG(CASE WHEN wo.compliant THEN 1.0 ELSE 0.0 END) * 100, 1) as compliance_rate,
        SUM(CASE WHEN wo.compliant AND wo.safety_incident THEN 1 ELSE 0 END) as compliant_incidents,
        SUM(CASE WHEN NOT wo.compliant AND wo.safety_incident THEN 1 ELSE 0 END) as noncompliant_incidents,
        SUM(CASE WHEN wo.safety_incident THEN 1 ELSE 0 END) as incident_count,
        ROUND(AVG(CASE WHEN wo.safety_incident THEN 1.0 ELSE 0.0 END) * 100, 1) as incident_rate,
        ROUND(AVG(wo.quality_score), 1) as avg_quality_score,
        ROUND(AVG(CASE WHEN wo.compliant THEN wo.quality_score ELSE NULL END), 1) as avg_quality_compliant,
        ROUND(AVG(CASE WHEN NOT wo.compliant THEN wo.quality_score ELSE NULL END), 1) as avg_quality_noncompliant,
        ROUND(AVG(wo.duration_hours), 1) as avg_duration,
        ROUND(AVG(CASE WHEN wo.compliant THEN wo.duration_hours ELSE NULL END), 1) as avg_duration_compliant,
        ROUND(AVG(CASE WHEN NOT wo.compliant THEN wo.duration_hours ELSE NULL END), 1) as avg_duration_noncompliant,
        ROUND(AVG(wo.downtime_hours), 1) as avg_downtime,
        SUM(CASE WHEN wo.rework_required THEN 1 ELSE 0 END) as rework_count,
        ROUND(AVG(CASE WHEN wo.rework_required THEN 1.0 ELSE 0.0 END) * 100, 1) as rework_rate,
        -- Detect CI signals based on performance thresholds
        CASE WHEN
          ROUND(AVG(CASE WHEN wo.compliant THEN 1.0 ELSE 0.0 END) * 100, 1) < 80 OR  -- Low compliance
          ROUND(AVG(CASE WHEN wo.safety_incident THEN 1.0 ELSE 0.0 END) * 100, 1) > 5 OR  -- High incidents
          ROUND(AVG(CASE WHEN wo.rework_required THEN 1.0 ELSE 0.0 END) * 100, 1) > 15 OR  -- High rework
          ROUND(AVG(wo.quality_score), 1) < 75  -- Low quality
        THEN true ELSE false END as has_open_signals
      FROM procedures p
      LEFT JOIN work_orders wo ON p.procedure_id = wo.procedure_id
      WHERE wo.scheduled_date >= ${startDate}::date
        AND wo.scheduled_date <= ${endDate}::date
      GROUP BY p.procedure_id, p.name, p.category, p.target_metric
      ORDER BY p.procedure_id
    `;
    return result.rows;
  },

  // Get correlation data for scatter plot
  async getCorrelationData(startDate = '2024-01-01', endDate = '2024-12-31') {
    const result = await sql`
      SELECT
        p.procedure_id,
        p.name,
        p.category,
        ROUND(CAST(AVG(CASE WHEN wo.compliant THEN 1.0 ELSE 0.0 END) * 100 AS NUMERIC), 1) as compliance_rate,
        COUNT(wo.wo_id) as work_order_count,
        -- Calculate KPI improvement (lower incidents = positive improvement)
        CASE
          WHEN SUM(CASE WHEN NOT wo.compliant AND wo.safety_incident THEN 1 ELSE 0 END) > 0 THEN
            ROUND(CAST((1 - (CAST(SUM(CASE WHEN wo.compliant AND wo.safety_incident THEN 1 ELSE 0 END) AS FLOAT) /
                        NULLIF(SUM(CASE WHEN NOT wo.compliant AND wo.safety_incident THEN 1 ELSE 0 END), 0))) * 100 AS NUMERIC), 1)
          ELSE 100.0
        END as kpi_improvement
      FROM procedures p
      LEFT JOIN work_orders wo ON p.procedure_id = wo.procedure_id
      WHERE wo.scheduled_date >= ${startDate}::date
        AND wo.scheduled_date <= ${endDate}::date
      GROUP BY p.procedure_id, p.name, p.category
      HAVING COUNT(wo.wo_id) > 0
    `;
    return result.rows;
  },

  // Get facility performance comparison
  async getFacilityPerformance(startDate = '2024-01-01', endDate = '2024-12-31') {
    const result = await sql`
      SELECT
        f.facility_id,
        f.name,
        f.performance_tier,
        COUNT(wo.wo_id) as work_order_count,
        ROUND(AVG(CASE WHEN wo.compliant THEN 1.0 ELSE 0.0 END) * 100, 1) as compliance_rate,
        SUM(CASE WHEN wo.safety_incident THEN 1 ELSE 0 END) as total_incidents
      FROM facilities f
      LEFT JOIN work_orders wo ON f.facility_id = wo.facility_id
      WHERE wo.scheduled_date >= ${startDate}::date
        AND wo.scheduled_date <= ${endDate}::date
      GROUP BY f.facility_id, f.name, f.performance_tier
      ORDER BY compliance_rate DESC
    `;
    return result.rows;
  },

  // Get procedure step-level analysis
  async getProcedureStepAnalysis(procedureId?: string, startDate = '2024-01-01', endDate = '2024-12-31') {
    if (procedureId) {
      const result = await sql`
        SELECT
          ps.step_id,
          ps.procedure_id,
          p.name as procedure_name,
          ps.step_number,
          ps.step_name,
          ps.criticality,
          ps.typical_duration_minutes,
          ps.verification_required,

          -- Total work orders for this procedure in date range
          COUNT(DISTINCT wo.wo_id) as total_work_orders,

          -- Checkpoint completions
          COALESCE(COUNT(cc.checkpoint_id), 0) as checkpoint_count,
          COALESCE(SUM(CASE WHEN cc.completed THEN 1 ELSE 0 END), 0) as completed_count,
          COALESCE(ROUND(CAST(AVG(CASE WHEN cc.completed THEN 1.0 ELSE 0.0 END) * 100 AS NUMERIC), 1), 0) as completion_rate,

          -- Deviations
          COALESCE(SUM(CASE WHEN cc.deviation_noted THEN 1 ELSE 0 END), 0) as deviation_count,
          COALESCE(ROUND(CAST(AVG(CASE WHEN cc.deviation_noted THEN 1.0 ELSE 0.0 END) * 100 AS NUMERIC), 1), 0) as deviation_rate,

          -- Quality
          COALESCE(SUM(CASE WHEN NOT cc.meets_spec THEN 1 ELSE 0 END), 0) as quality_issue_count,
          COALESCE(ROUND(CAST(AVG(CASE WHEN cc.meets_spec THEN 1.0 ELSE 0.0 END) * 100 AS NUMERIC), 1), 0) as quality_rate,

          -- Duration analysis
          COALESCE(ROUND(CAST(AVG(cc.duration_minutes) AS NUMERIC), 1), ps.typical_duration_minutes) as avg_duration_minutes,
          COALESCE(ROUND(CAST(AVG(cc.duration_minutes) - ps.typical_duration_minutes AS NUMERIC), 1), 0) as duration_variance

        FROM procedure_steps ps
        INNER JOIN procedures p ON ps.procedure_id = p.procedure_id
        LEFT JOIN compliance_checkpoints cc ON ps.step_id = cc.step_id
        LEFT JOIN work_orders wo ON cc.wo_id = wo.wo_id
          AND wo.scheduled_date >= ${startDate}::date
          AND wo.scheduled_date <= ${endDate}::date
        WHERE ps.procedure_id = ${procedureId}
        GROUP BY ps.step_id, ps.procedure_id, p.name, ps.step_number, ps.step_name,
                 ps.criticality, ps.typical_duration_minutes, ps.verification_required
        ORDER BY ps.procedure_id, ps.step_number
      `;
      return result.rows;
    } else {
      const result = await sql`
        SELECT
          ps.step_id,
          ps.procedure_id,
          p.name as procedure_name,
          ps.step_number,
          ps.step_name,
          ps.criticality,
          ps.typical_duration_minutes,
          ps.verification_required,

          -- Total work orders for this procedure in date range
          COUNT(DISTINCT wo.wo_id) as total_work_orders,

          -- Checkpoint completions
          COALESCE(COUNT(cc.checkpoint_id), 0) as checkpoint_count,
          COALESCE(SUM(CASE WHEN cc.completed THEN 1 ELSE 0 END), 0) as completed_count,
          COALESCE(ROUND(CAST(AVG(CASE WHEN cc.completed THEN 1.0 ELSE 0.0 END) * 100 AS NUMERIC), 1), 0) as completion_rate,

          -- Deviations
          COALESCE(SUM(CASE WHEN cc.deviation_noted THEN 1 ELSE 0 END), 0) as deviation_count,
          COALESCE(ROUND(CAST(AVG(CASE WHEN cc.deviation_noted THEN 1.0 ELSE 0.0 END) * 100 AS NUMERIC), 1), 0) as deviation_rate,

          -- Quality
          COALESCE(SUM(CASE WHEN NOT cc.meets_spec THEN 1 ELSE 0 END), 0) as quality_issue_count,
          COALESCE(ROUND(CAST(AVG(CASE WHEN cc.meets_spec THEN 1.0 ELSE 0.0 END) * 100 AS NUMERIC), 1), 0) as quality_rate,

          -- Duration analysis
          COALESCE(ROUND(CAST(AVG(cc.duration_minutes) AS NUMERIC), 1), ps.typical_duration_minutes) as avg_duration_minutes,
          COALESCE(ROUND(CAST(AVG(cc.duration_minutes) - ps.typical_duration_minutes AS NUMERIC), 1), 0) as duration_variance

        FROM procedure_steps ps
        INNER JOIN procedures p ON ps.procedure_id = p.procedure_id
        LEFT JOIN compliance_checkpoints cc ON ps.step_id = cc.step_id
        LEFT JOIN work_orders wo ON cc.wo_id = wo.wo_id
          AND wo.scheduled_date >= ${startDate}::date
          AND wo.scheduled_date <= ${endDate}::date
        GROUP BY ps.step_id, ps.procedure_id, p.name, ps.step_number, ps.step_name,
                 ps.criticality, ps.typical_duration_minutes, ps.verification_required
        ORDER BY ps.procedure_id, ps.step_number
      `;
      return result.rows;
    }
  },

  // Get a single procedure with its steps (used by AI assistant to avoid HTTP self-calls)
  async getProcedureWithSteps(procedureId: string) {
    const procedureResult = await sql`
      SELECT *
      FROM procedures
      WHERE procedure_id = ${procedureId}
    `;

    if (procedureResult.rows.length === 0) return null;

    const stepsResult = await sql`
      SELECT *
      FROM procedure_steps
      WHERE procedure_id = ${procedureId}
      ORDER BY step_number ASC
    `;

    return {
      ...procedureResult.rows[0],
      steps: stepsResult.rows,
    };
  },

  // Get predictive analytics with risk scoring
  async getPredictiveAnalytics(startDate = '2024-01-01', endDate = '2024-12-31') {
    const result = await sql`
      WITH procedure_metrics AS (
        SELECT
          p.procedure_id,
          p.name,
          p.category,
          COUNT(wo.wo_id) as total_work_orders,
          ROUND(CAST(AVG(CASE WHEN wo.compliant THEN 1.0 ELSE 0.0 END) * 100 AS NUMERIC), 1) as compliance_rate,
          ROUND(CAST(AVG(CASE WHEN wo.safety_incident THEN 1.0 ELSE 0.0 END) * 100 AS NUMERIC), 1) as incident_rate,
          ROUND(CAST(AVG(wo.quality_score) AS NUMERIC), 1) as avg_quality_score,
          ROUND(CAST(AVG(wo.duration_hours) AS NUMERIC), 1) as avg_duration,
          SUM(CASE WHEN wo.rework_required THEN 1 ELSE 0 END) as rework_count,
          SUM(CASE WHEN wo.equipment_trip THEN 1 ELSE 0 END) as equipment_trip_count
        FROM procedures p
        LEFT JOIN work_orders wo ON p.procedure_id = wo.procedure_id
        WHERE wo.scheduled_date >= ${startDate}::date
          AND wo.scheduled_date <= ${endDate}::date
        GROUP BY p.procedure_id, p.name, p.category
        HAVING COUNT(wo.wo_id) > 0
      ),
      risk_calculations AS (
        SELECT
          *,
          -- Risk score calculation (0-100, higher is riskier)
          -- Based on: low compliance, high incidents, low quality, high rework
          ROUND(CAST(
            (100 - compliance_rate) * 0.4 +  -- 40% weight on non-compliance
            incident_rate * 0.3 +              -- 30% weight on incidents
            (10 - COALESCE(avg_quality_score, 5)) * 5 * 0.2 +  -- 20% weight on quality
            (CAST(rework_count AS FLOAT) / NULLIF(total_work_orders, 0)) * 100 * 0.1  -- 10% weight on rework
          AS NUMERIC), 1) as risk_score
        FROM procedure_metrics
      )
      SELECT
        procedure_id,
        name,
        category,
        total_work_orders,
        compliance_rate,
        incident_rate,
        avg_quality_score,
        avg_duration,
        rework_count,
        equipment_trip_count,
        risk_score,
        -- Risk category
        CASE
          WHEN risk_score >= 15 THEN 'Critical'
          WHEN risk_score >= 10 THEN 'High'
          WHEN risk_score >= 7 THEN 'Medium'
          ELSE 'Low'
        END as risk_category,
        -- Trend indicators (comparing first half vs second half of period)
        CASE
          WHEN risk_score >= 15 THEN 'Immediate action required'
          WHEN risk_score >= 10 THEN 'Enhanced monitoring needed'
          WHEN risk_score >= 7 THEN 'Standard monitoring'
          ELSE 'Good performance'
        END as recommendation
      FROM risk_calculations
      ORDER BY risk_score DESC, total_work_orders DESC
    `;
    return result.rows;
  },

  // ==================== VERSION MANAGEMENT ====================

  // Get version history for a procedure
  async getProcedureVersionHistory(procedureId: string) {
    const result = await sql`
      SELECT
        pv.*,
        mo.name as owner_name,
        cs.signal_id,
        cs.title as signal_title,
        COUNT(psv.step_version_id) as step_count,
        SUM(CASE WHEN psv.change_type = 'modified' THEN 1 ELSE 0 END) as modified_steps,
        SUM(CASE WHEN psv.change_type = 'added' THEN 1 ELSE 0 END) as added_steps,
        SUM(CASE WHEN psv.change_type = 'removed' THEN 1 ELSE 0 END) as removed_steps
      FROM procedure_versions pv
      LEFT JOIN ms_owners mo ON pv.created_by = mo.ms_owner_id
      LEFT JOIN ci_signals cs ON pv.ci_signal_id = cs.signal_id
      LEFT JOIN procedure_step_versions psv ON pv.version_id = psv.version_id
      WHERE pv.procedure_id = ${procedureId}
      GROUP BY pv.version_id, mo.name, cs.signal_id, cs.title
      ORDER BY pv.created_at DESC
    `;
    return result.rows;
  },

  // Get specific version details with steps
  async getProcedureVersion(procedureId: string, version: string) {
    const versionResult = await sql`
      SELECT pv.*, mo.name as owner_name
      FROM procedure_versions pv
      LEFT JOIN ms_owners mo ON pv.created_by = mo.ms_owner_id
      WHERE pv.procedure_id = ${procedureId} AND pv.version = ${version}
    `;

    if (versionResult.rows.length === 0) return null;

    const stepsResult = await sql`
      SELECT *
      FROM procedure_step_versions
      WHERE version_id = ${versionResult.rows[0].version_id}
      ORDER BY step_number
    `;

    return {
      ...versionResult.rows[0],
      steps: stepsResult.rows
    };
  },

  // Get current active version
  async getCurrentVersion(procedureId: string) {
    const result = await sql`
      SELECT * FROM procedure_versions
      WHERE procedure_id = ${procedureId} AND is_current = TRUE
    `;
    return result.rows[0];
  },

  // Create a new procedure version
  async createProcedureVersion(versionData: {
    procedureId: string;
    newVersion: string;
    createdBy: string;
    changeReason: string;
    ciSignalId?: string;
    modifiedSteps: Array<{
      stepId: string;
      stepContent?: string;
      stepName?: string;
      description?: string;
      typicalDurationMinutes?: number;
      criticality?: string;
      verificationRequired?: boolean;
      changeType: 'modified' | 'unchanged' | 'added' | 'removed';
      changedFields?: any;
    }>;
  }) {
    // 1. Get current procedure data
    const currentProcedure = await sql`
      SELECT * FROM procedures WHERE procedure_id = ${versionData.procedureId}
    `;

    if (currentProcedure.rows.length === 0) {
      throw new Error('Procedure not found');
    }

    const proc = currentProcedure.rows[0];

    // 2. Mark current version as not current
    await sql`
      UPDATE procedure_versions
      SET is_current = FALSE, superseded_by = ${versionData.newVersion}
      WHERE procedure_id = ${versionData.procedureId} AND is_current = TRUE
    `;

    // 3. Create new version record
    const versionResult = await sql`
      INSERT INTO procedure_versions (
        procedure_id, version, created_by, change_reason, ci_signal_id,
        name, category, target_metric, description, total_steps,
        avg_duration_minutes, regulatory_requirement, is_current, status
      ) VALUES (
        ${versionData.procedureId}, ${versionData.newVersion}, ${versionData.createdBy},
        ${versionData.changeReason}, ${versionData.ciSignalId || null},
        ${proc.name}, ${proc.category}, ${proc.target_metric}, ${proc.description},
        ${proc.total_steps}, ${proc.avg_duration_minutes}, ${proc.regulatory_requirement},
        TRUE, 'active'
      )
      RETURNING version_id
    `;

    const versionId = versionResult.rows[0].version_id;

    // 4. Create step versions
    for (const step of versionData.modifiedSteps) {
      // Get current step data if not provided
      let stepData = null;
      if (step.changeType === 'modified' || step.changeType === 'unchanged') {
        const currentStep = await sql`
          SELECT * FROM procedure_steps WHERE step_id = ${step.stepId}
        `;
        stepData = currentStep.rows[0];
      }

      await sql`
        INSERT INTO procedure_step_versions (
          version_id, step_id, procedure_id, step_number, step_name,
          step_content, typical_duration_minutes, criticality, description,
          verification_required, change_type, changed_fields
        ) VALUES (
          ${versionId},
          ${step.stepId},
          ${versionData.procedureId},
          ${stepData?.step_number || 0},
          ${step.stepName || stepData?.step_name || ''},
          ${step.stepContent || stepData?.step_content || stepData?.description || ''},
          ${step.typicalDurationMinutes || stepData?.typical_duration_minutes || 0},
          ${step.criticality || stepData?.criticality || 'Medium'},
          ${step.description || stepData?.description || ''},
          ${step.verificationRequired !== undefined ? step.verificationRequired : stepData?.verification_required || false},
          ${step.changeType},
          ${step.changedFields ? JSON.stringify(step.changedFields) : null}
        )
      `;

      // 5. Update current step if modified
      if (step.changeType === 'modified' && stepData) {
        await sql`
          UPDATE procedure_steps
          SET
            step_name = ${step.stepName || stepData.step_name},
            step_content = ${step.stepContent || stepData.step_content},
            description = ${step.description || stepData.description},
            typical_duration_minutes = ${step.typicalDurationMinutes || stepData.typical_duration_minutes},
            criticality = ${step.criticality || stepData.criticality},
            verification_required = ${step.verificationRequired !== undefined ? step.verificationRequired : stepData.verification_required},
            current_version = ${versionData.newVersion},
            last_modified_at = CURRENT_TIMESTAMP,
            last_modified_by = ${versionData.createdBy}
          WHERE step_id = ${step.stepId}
        `;
      }
    }

    // 6. Update procedures table
    await sql`
      UPDATE procedures
      SET
        current_version = ${versionData.newVersion},
        version_count = version_count + 1,
        last_modified_by = ${versionData.createdBy}
      WHERE procedure_id = ${versionData.procedureId}
    `;

    // 7. Mark CI signal as implemented if provided
    if (versionData.ciSignalId) {
      await sql`
        UPDATE ci_signals
        SET
          status = 'implemented',
          implemented_in_version = ${versionData.newVersion},
          implemented_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE signal_id = ${versionData.ciSignalId}
      `;
    }

    return versionId;
  },

  // ==================== COMPARISON METRICS ====================

  // Compare metrics between two versions
  async compareVersionMetrics(
    procedureId: string,
    beforeVersion: string,
    afterVersion: string,
    startDate = '2024-01-01',
    endDate = '2024-12-31'
  ) {
    const result = await sql`
      WITH version_metrics AS (
        SELECT
          wo.procedure_version,
          COUNT(wo.wo_id) as total_work_orders,
          ROUND(AVG(CASE WHEN wo.compliant THEN 1.0 ELSE 0.0 END) * 100, 1) as compliance_rate,
          ROUND(AVG(wo.quality_score), 1) as avg_quality_score,
          ROUND(AVG(wo.duration_hours), 1) as avg_duration_hours,
          ROUND(AVG(wo.downtime_hours), 1) as avg_downtime_hours,
          SUM(CASE WHEN wo.rework_required THEN 1 ELSE 0 END) as rework_count,
          ROUND(AVG(CASE WHEN wo.rework_required THEN 1.0 ELSE 0.0 END) * 100, 1) as rework_rate,
          SUM(CASE WHEN wo.safety_incident THEN 1 ELSE 0 END) as incident_count,
          ROUND(AVG(CASE WHEN wo.safety_incident THEN 1.0 ELSE 0.0 END) * 100, 1) as incident_rate
        FROM work_orders wo
        WHERE wo.procedure_id = ${procedureId}
          AND wo.scheduled_date >= ${startDate}::date
          AND wo.scheduled_date <= ${endDate}::date
          AND wo.procedure_version IN (${beforeVersion}, ${afterVersion})
        GROUP BY wo.procedure_version
      )
      SELECT
        COALESCE(MAX(CASE WHEN procedure_version = ${beforeVersion} THEN total_work_orders END), 0) as before_work_orders,
        COALESCE(MAX(CASE WHEN procedure_version = ${afterVersion} THEN total_work_orders END), 0) as after_work_orders,
        COALESCE(MAX(CASE WHEN procedure_version = ${beforeVersion} THEN compliance_rate END), 0) as before_compliance,
        COALESCE(MAX(CASE WHEN procedure_version = ${afterVersion} THEN compliance_rate END), 0) as after_compliance,
        COALESCE(MAX(CASE WHEN procedure_version = ${beforeVersion} THEN avg_duration_hours END), 0) as before_duration,
        COALESCE(MAX(CASE WHEN procedure_version = ${afterVersion} THEN avg_duration_hours END), 0) as after_duration,
        COALESCE(MAX(CASE WHEN procedure_version = ${beforeVersion} THEN avg_quality_score END), 0) as before_quality,
        COALESCE(MAX(CASE WHEN procedure_version = ${afterVersion} THEN avg_quality_score END), 0) as after_quality,
        COALESCE(MAX(CASE WHEN procedure_version = ${beforeVersion} THEN rework_rate END), 0) as before_rework,
        COALESCE(MAX(CASE WHEN procedure_version = ${afterVersion} THEN rework_rate END), 0) as after_rework,
        COALESCE(MAX(CASE WHEN procedure_version = ${beforeVersion} THEN incident_count END), 0) as before_incidents,
        COALESCE(MAX(CASE WHEN procedure_version = ${afterVersion} THEN incident_count END), 0) as after_incidents
      FROM version_metrics
    `;

    return result.rows[0];
  },

  // Get step-level skip rates by version
  async getStepSkipRateByVersion(
    procedureId: string,
    stepId: string,
    version?: string
  ) {
    if (version) {
      const result = await sql`
        SELECT
          cc.step_id,
          ps.step_name,
          cc.procedure_version,
          COUNT(cc.checkpoint_id) as total_executions,
          SUM(CASE WHEN NOT cc.completed THEN 1 ELSE 0 END) as skip_count,
          ROUND(AVG(CASE WHEN NOT cc.completed THEN 1.0 ELSE 0.0 END) * 100, 1) as skip_rate
        FROM compliance_checkpoints cc
        INNER JOIN procedure_steps ps ON cc.step_id = ps.step_id
        WHERE cc.procedure_id = ${procedureId}
          AND cc.step_id = ${stepId}
          AND cc.procedure_version = ${version}
        GROUP BY cc.step_id, ps.step_name, cc.procedure_version
      `;
      return result.rows;
    } else {
      const result = await sql`
        SELECT
          cc.step_id,
          ps.step_name,
          cc.procedure_version,
          COUNT(cc.checkpoint_id) as total_executions,
          SUM(CASE WHEN NOT cc.completed THEN 1 ELSE 0 END) as skip_count,
          ROUND(AVG(CASE WHEN NOT cc.completed THEN 1.0 ELSE 0.0 END) * 100, 1) as skip_rate
        FROM compliance_checkpoints cc
        INNER JOIN procedure_steps ps ON cc.step_id = ps.step_id
        WHERE cc.procedure_id = ${procedureId}
          AND cc.step_id = ${stepId}
        GROUP BY cc.step_id, ps.step_name, cc.procedure_version
        ORDER BY cc.procedure_version
      `;
      return result.rows;
    }
  },

  // ==================== CI SIGNALS ====================

  // Generate CI signal from analytics
  async generateCISignal(signalData: {
    procedureId: string;
    stepId?: string;
    signalType: string;
    severity: string;
    title: string;
    description: string;
    evidence: any;
    recommendationText: string;
    suggestedChange?: string;
    detectionPeriodStart: string;
    detectionPeriodEnd: string;
    sampleSize: number;
    estimatedImpact: number;
  }) {
    // Generate next signal ID
    const lastSignalResult = await sql`
      SELECT signal_id FROM ci_signals
      ORDER BY signal_id DESC LIMIT 1
    `;

    const lastNum = lastSignalResult.rows[0]?.signal_id
      ? parseInt(lastSignalResult.rows[0].signal_id.slice(1))
      : 0;
    const nextSignalId = `#${String(lastNum + 1).padStart(4, '0')}`;

    const result = await sql`
      INSERT INTO ci_signals (
        signal_id, procedure_id, step_id, signal_type, severity,
        title, description, evidence, recommendation_text,
        suggested_change, detection_period_start, detection_period_end,
        sample_size, estimated_impact_score, status, flagged_for_review
      ) VALUES (
        ${nextSignalId}, ${signalData.procedureId}, ${signalData.stepId || null},
        ${signalData.signalType}, ${signalData.severity}, ${signalData.title},
        ${signalData.description}, ${JSON.stringify(signalData.evidence)},
        ${signalData.recommendationText}, ${signalData.suggestedChange || null},
        ${signalData.detectionPeriodStart}, ${signalData.detectionPeriodEnd},
        ${signalData.sampleSize}, ${signalData.estimatedImpact},
        'open', TRUE
      )
      RETURNING *
    `;

    return result.rows[0];
  },

  // Get all open CI signals with optional filters
  async getOpenCISignals(filters?: {
    procedureId?: string;
    severity?: string;
    status?: string;
  }) {
    // Build WHERE conditions
    const conditions = ['cs.flagged_for_review = TRUE'];
    const params: any[] = [];

    if (filters?.procedureId) {
      conditions.push(`cs.procedure_id = $${params.length + 1}`);
      params.push(filters.procedureId);
    }
    if (filters?.severity) {
      conditions.push(`cs.severity = $${params.length + 1}`);
      params.push(filters.severity);
    }
    if (filters?.status) {
      conditions.push(`cs.status = $${params.length + 1}`);
      params.push(filters.status);
    }

    const whereClause = conditions.join(' AND ');

    const result = await sql.query(`
      SELECT
        cs.*,
        p.name as procedure_name,
        ps.step_name,
        ps.step_number,
        mo.name as reviewer_name
      FROM ci_signals cs
      INNER JOIN procedures p ON cs.procedure_id = p.procedure_id
      LEFT JOIN procedure_steps ps ON cs.step_id = ps.step_id
      LEFT JOIN ms_owners mo ON cs.reviewed_by = mo.ms_owner_id
      WHERE ${whereClause}
      ORDER BY cs.severity DESC, cs.detected_at DESC
    `, params);

    return result.rows;
  },

  // Get CI signal by ID
  async getCISignal(signalId: string) {
    const result = await sql`
      SELECT
        cs.*,
        p.name as procedure_name,
        p.category,
        ps.step_name,
        ps.step_number,
        ps.step_content,
        mo.name as reviewer_name
      FROM ci_signals cs
      INNER JOIN procedures p ON cs.procedure_id = p.procedure_id
      LEFT JOIN procedure_steps ps ON cs.step_id = ps.step_id
      LEFT JOIN ms_owners mo ON cs.reviewed_by = mo.ms_owner_id
      WHERE cs.signal_id = ${signalId}
    `;

    return result.rows[0];
  },

  // Update CI signal status
  async updateCISignalStatus(
    signalId: string,
    status: string,
    reviewedBy?: string,
    reviewNotes?: string
  ) {
    const result = await sql`
      UPDATE ci_signals
      SET
        status = ${status},
        reviewed_by = ${reviewedBy || null},
        reviewed_at = CURRENT_TIMESTAMP,
        review_notes = ${reviewNotes || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE signal_id = ${signalId}
      RETURNING *
    `;

    return result.rows[0];
  },

  // ==================== MS OWNERS ====================

  // Get all MS owners
  async getMSOwners() {
    const result = await sql`
      SELECT * FROM ms_owners
      WHERE active = TRUE
      ORDER BY name
    `;
    return result.rows;
  },

  // Get MS owner by ID
  async getMSOwner(msOwnerId: string) {
    const result = await sql`
      SELECT * FROM ms_owners
      WHERE ms_owner_id = ${msOwnerId}
    `;
    return result.rows[0];
  },

  // Create MS owner
  async createMSOwner(data: {
    name: string;
    email: string;
    department?: string;
  }) {
    // Generate MS owner ID
    const lastOwnerResult = await sql`
      SELECT ms_owner_id FROM ms_owners ORDER BY ms_owner_id DESC LIMIT 1
    `;
    const lastNum = lastOwnerResult.rows[0]?.ms_owner_id
      ? parseInt(lastOwnerResult.rows[0].ms_owner_id.split('-')[1])
      : 0;
    const nextId = `MSO-${String(lastNum + 1).padStart(3, '0')}`;

    const result = await sql`
      INSERT INTO ms_owners (ms_owner_id, name, email, role)
      VALUES (${nextId}, ${data.name}, ${data.email}, ${data.department || 'Management System Owner'})
      RETURNING *
    `;

    return result.rows[0];
  },

  // Get all regulations
  async getRegulations(filters?: { status?: string | null; priority?: string | null }) {
    const result = await sql`
      SELECT
        regulation_id,
        title,
        source,
        effective_date,
        priority,
        affected_procedures,
        status,
        summary,
        document_text,
        key_changes,
        created_at,
        created_by
      FROM regulations
      WHERE
        (${filters?.status}::text IS NULL OR status = ${filters?.status})
        AND (${filters?.priority}::text IS NULL OR priority = ${filters?.priority})
      ORDER BY created_at DESC
    `;

    return result.rows.map(row => ({
      id: row.regulation_id,
      title: row.title,
      source: row.source,
      effectiveDate: row.effective_date,
      priority: row.priority,
      affectedProcedures: row.affected_procedures || [],
      status: row.status,
      summary: row.summary,
      documentText: row.document_text,
      keyChanges: row.key_changes || [],
      createdAt: row.created_at,
      createdBy: row.created_by
    }));
  },

  // Create new regulation
  async createRegulation(data: {
    title: string;
    source: string;
    effectiveDate: string;
    priority: string;
    affectedProcedures: string[];
    summary: string;
    documentText?: string;
    keyChanges?: string[];
    createdBy: string;
  }) {
    // Generate regulation ID
    const lastRegResult = await sql`
      SELECT regulation_id FROM regulations ORDER BY regulation_id DESC LIMIT 1
    `;

    let nextNum = 1;
    if (lastRegResult.rows[0]?.regulation_id) {
      const match = lastRegResult.rows[0].regulation_id.match(/REG-(\d{4})-(\d{3})/);
      if (match) {
        const year = parseInt(match[1]);
        const num = parseInt(match[2]);
        const currentYear = new Date().getFullYear();
        if (year === currentYear) {
          nextNum = num + 1;
        }
      }
    }

    const currentYear = new Date().getFullYear();
    const regulationId = `REG-${currentYear}-${String(nextNum).padStart(3, '0')}`;

    const result = await sql`
      INSERT INTO regulations (
        regulation_id,
        title,
        source,
        effective_date,
        priority,
        affected_procedures,
        status,
        summary,
        document_text,
        key_changes,
        created_by
      ) VALUES (
        ${regulationId},
        ${data.title},
        ${data.source},
        ${data.effectiveDate},
        ${data.priority},
        ${JSON.stringify(data.affectedProcedures)},
        'pending_review',
        ${data.summary},
        ${data.documentText || ''},
        ${JSON.stringify(data.keyChanges || [])},
        ${data.createdBy}
      )
      RETURNING regulation_id
    `;

    return result.rows[0].regulation_id;
  },

  // Get regulation by ID
  async getRegulationById(regulationId: string) {
    const result = await sql`
      SELECT
        regulation_id,
        title,
        source,
        effective_date,
        priority,
        affected_procedures,
        status,
        summary,
        document_text,
        key_changes,
        created_at,
        created_by
      FROM regulations
      WHERE regulation_id = ${regulationId}
    `;

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.regulation_id,
      title: row.title,
      source: row.source,
      effectiveDate: row.effective_date,
      priority: row.priority,
      affectedProcedures: row.affected_procedures || [],
      status: row.status,
      summary: row.summary,
      documentText: row.document_text,
      keyChanges: row.key_changes || [],
      createdAt: row.created_at,
      createdBy: row.created_by
    };
  },

  // Log accepted regulation change
  async logAcceptedChange(changeData: {
    regulationId: string;
    procedureId: string;
    stepId: string;
    changeDescription: string;
    changeType: string;
    acceptedBy: string;
    procedureVersion: string;
  }) {
    const result = await sql`
      INSERT INTO accepted_regulation_changes (
        regulation_id, procedure_id, step_id,
        change_description, change_type, accepted_by, procedure_version
      ) VALUES (
        ${changeData.regulationId}, ${changeData.procedureId}, ${changeData.stepId},
        ${changeData.changeDescription}, ${changeData.changeType},
        ${changeData.acceptedBy}, ${changeData.procedureVersion}
      )
      ON CONFLICT (regulation_id, procedure_id, step_id, change_type)
      DO UPDATE SET
        accepted_at = CURRENT_TIMESTAMP,
        accepted_by = ${changeData.acceptedBy},
        procedure_version = ${changeData.procedureVersion}
      RETURNING *
    `;

    return result.rows[0];
  },

  // Get accepted changes for a regulation
  async getAcceptedChanges(regulationId: string) {
    const result = await sql`
      SELECT
        arc.*,
        p.name as procedure_name,
        ps.step_name,
        ps.step_number
      FROM accepted_regulation_changes arc
      INNER JOIN procedures p ON arc.procedure_id = p.procedure_id
      LEFT JOIN procedure_steps ps ON arc.step_id = ps.step_id
      WHERE arc.regulation_id = ${regulationId}
      ORDER BY arc.accepted_at DESC
    `;

    return result.rows;
  },

  // Check if change was already accepted
  async isChangeAccepted(
    regulationId: string,
    procedureId: string,
    stepId: string,
    changeType: string
  ) {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM accepted_regulation_changes
      WHERE regulation_id = ${regulationId}
        AND procedure_id = ${procedureId}
        AND step_id = ${stepId}
        AND change_type = ${changeType}
    `;

    return result.rows[0].count > 0;
  },

  // Get all accepted changes for a procedure
  async getAcceptedChangesByProcedure(procedureId: string) {
    const result = await sql`
      SELECT
        arc.*,
        r.title as regulation_title,
        r.source as regulation_source
      FROM accepted_regulation_changes arc
      INNER JOIN regulations r ON arc.regulation_id = r.regulation_id
      WHERE arc.procedure_id = ${procedureId}
      ORDER BY arc.accepted_at DESC
    `;

    return result.rows;
  },

  // Delete regulation
  async deleteRegulation(regulationId: string) {
    // Delete accepted changes first (foreign key constraint)
    await sql`
      DELETE FROM accepted_regulation_changes
      WHERE regulation_id = ${regulationId}
    `;

    // Delete the regulation
    const result = await sql`
      DELETE FROM regulations
      WHERE regulation_id = ${regulationId}
      RETURNING regulation_id
    `;

    return result.rows.length > 0;
  },

  // Delete procedure
  async deleteProcedure(procedureId: string) {
    // Note: This will cascade delete related records based on foreign key constraints
    // Including: procedure_steps, work_orders, deviations, accepted_regulation_changes
    const result = await sql`
      DELETE FROM procedures
      WHERE procedure_id = ${procedureId}
      RETURNING procedure_id
    `;

    return result.rows.length > 0;
  },
};
