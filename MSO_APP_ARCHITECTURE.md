# MS Owner Application Architecture

## Overview

The **MS Owner (Management System Owner) Application** is a separate experience built on top of the existing OptiSys infrastructure. It reuses all components and APIs but provides a governance-focused workflow for procedure compliance and continuous improvement.

## Access Points

- **Main App (Operational)**: `http://localhost:3000` - Analytics, field execution, work orders
- **MSO App (Governance)**: `http://localhost:3000/mso` - Procedure governance, compliance, CI signals

---

## Application Structure

### 1. MSO Dashboard (`/mso`)

**Purpose**: Action-focused dashboard for MS Owners showing only pending items requiring attention

**Features**:
- **Pending Items Summary**
  - High priority CI signals
  - Regulation updates requiring procedure changes
  - Pending reviews and approvals
- **AI Insights** - Recommendations based on field data and compliance gaps
- **Summary Cards** - Quick metrics (high priority items, CI signals, regulations, total pending)

**Components Used**:
- Custom dashboard layout
- Fetches from existing `/api/ci-signals` endpoint
- Mock regulation data (can be extended to real regulatory database)

**Navigation**:
- Click "Review" on CI Signal → `/mso/procedures/[id]?signal=[signalId]`
- Click "Review" on Regulation → `/mso/regulations/[id]`

---

### 2. Regulation Detail Page (`/mso/regulations/[id]`)

**Purpose**: Show AI-proposed procedure changes based on new regulations

**Key Features**:

1. **Regulation Overview**
   - Title, source, effective date
   - Key requirements (bullet list)
   - Affected procedures

2. **AI-Proposed Changes**
   - Shows current step text vs. proposed text
   - Change type: Modified, Added, Removed
   - Color-coded diffs (red = current, green = proposed)
   - AI confidence score for each change
   - Change reason linking to regulation requirement

3. **Editable Proposals**
   - MS Owner can edit AI-suggested text before approval
   - Each change has Accept/Edit/Reject buttons
   - "Approve All Changes" creates new procedure version

4. **Compliance Impact Summary**
   - Shows how changes bring procedure into compliance
   - Links changes back to specific regulation citations

**API Integration**:
- Uses existing `/api/procedures/[id]/versions` POST endpoint
- Payload includes `regulationId` to track compliance changes
- Creates new version with `changeReason` referencing regulation

**Mock Data Structure**:
```typescript
interface RegulationDetail {
  id: string;
  title: string;
  description: string;
  effectiveDate: string;
  source: string; // e.g., "OSHA 1910.147(c)(4)"
  requirements: string[];
  affectedProcedures: string[];
}

interface ProposedChange {
  stepId: string;
  stepNumber: number;
  currentText: string;
  proposedText: string;
  changeReason: string; // Links to regulation requirement
  changeType: 'modified' | 'added' | 'removed';
  aiConfidence: number; // 0-1
}
```

**Example Flow**:
1. OSHA updates lockout/tagout standard
2. AI analyzes regulation text
3. AI identifies affected procedures (MNT-202, MNT-205, INT-028)
4. AI proposes specific changes to each step
5. MS Owner reviews proposals at `/mso/regulations/REG-2024-001`
6. MS Owner edits proposed text, approves changes
7. New procedure version created with compliance audit trail

---

### 3. Procedure Editor (`/mso/procedures/[id]`)

**Purpose**: Edit procedures in response to CI signals or manual updates

**Components Reused**:
- **ProcedureEditor** (`/src/components/procedures/ProcedureEditor.tsx`)
- **EditableStep** (`/src/components/procedures/EditableStep.tsx`)

**MSO-Specific Context**:
- Blue header banner showing "MS Owner Mode"
- Shows which CI signal triggered the edit (if applicable)
- Closing redirects to `/mso` instead of main procedures page

**Features** (inherited from ProcedureEditor):
- Side-by-side before/after view
- Edit step descriptions, criticality, duration, verification requirements
- Change summary showing modified steps
- Version control (auto-increments version number)
- Save creates new version with audit trail

**API Integration**:
- GET `/api/procedures/[id]` - Fetch procedure with steps
- GET `/api/ci-signals/[id]` - Fetch CI signal context (if provided)
- POST `/api/procedures/[id]/versions` - Create new version

---

## Data Flow: Regulation → Procedure Update

### Scenario: OSHA Safety Update

```
1. New Regulation Detected
   ↓
2. AI Analyzes Regulation Text
   ↓
3. AI Identifies Affected Procedures
   ↓
4. AI Generates Proposed Changes
   ↓
5. MS Owner Reviews at /mso/regulations/REG-2024-001
   ↓
6. MS Owner Edits Proposals (optional)
   ↓
7. MS Owner Approves All Changes
   ↓
8. API Call: POST /api/procedures/MNT-202/versions
   ↓
9. New Version Created (v1.0 → v2.0)
   ↓
10. Work Orders Use New Version
   ↓
11. Analytics Track Before/After Compliance
   ↓
12. Loop Closes: Regulation → Update → Measure
```

---

## Data Flow: CI Signal → Procedure Update

### Scenario: High Skip Rate Detected

```
1. Analytics Detects Pattern (68% skip rate on Step 5)
   ↓
2. CI Signal #0001 Generated
   ↓
3. MS Owner Sees Signal on /mso Dashboard
   ↓
4. MS Owner Clicks "Review" → /mso/procedures/INT-031?signal=%230001
   ↓
5. ProcedureEditor Opens with CI Signal Context
   ↓
6. MS Owner Edits Step 5 Description
   ↓
7. MS Owner Clicks "Publish v1.1"
   ↓
8. API Call: POST /api/procedures/INT-031/versions
   ↓
9. New Version Created with ciSignalId Reference
   ↓
10. Field Workers Use v1.1 on New Work Orders
   ↓
11. Analytics Track v1.0 vs v1.1 Skip Rates
   ↓
12. VersionComparisonTable Shows Improvement
   ↓
13. Loop Closes: Signal → Edit → Measure → Validate
```

---

## Component Reuse Strategy

### Fully Reused Components
1. **ProcedureEditor** - Identical editing experience
2. **EditableStep** - Step-level editing with before/after view
3. **VersionComparisonTable** - Before/after metrics (not yet integrated but ready)
4. **CISignalModal** - Can be reused for signal details

### MSO-Specific Components
1. **MSO Dashboard** (`/mso/page.tsx`) - New layout
2. **RegulationDetailPage** (`/mso/regulations/[id]/page.tsx`) - New feature
3. **MSO Procedure Wrapper** (`/mso/procedures/[id]/page.tsx`) - Wrapper around ProcedureEditor

### Shared APIs
- All existing `/api/procedures/*` endpoints
- All existing `/api/ci-signals/*` endpoints
- All existing `/api/ms-owners/*` endpoints

---

## Future Enhancements

### Short-Term
1. **Real Regulation Integration**
   - Connect to regulatory database (OSHA, ISO, EPA APIs)
   - Auto-fetch new regulations
   - AI parsing of regulation text

2. **Workflow Engine**
   - Multi-step approval process
   - Reviewer assignments
   - Email notifications

3. **Version Comparison UI**
   - Integrate `VersionComparisonTable` into MSO procedures page
   - Show before/after metrics for recent changes

### Long-Term
1. **AI Training**
   - Learn from MS Owner edits to improve proposals
   - Confidence scoring based on acceptance rate
   - Domain-specific regulation understanding

2. **Compliance Dashboard**
   - Track procedure compliance with specific regulations
   - Expiration dates for certification requirements
   - Gap analysis vs. industry standards

3. **Audit Trail**
   - Full history of regulation → change → approval
   - Exportable compliance reports
   - Integration with corporate governance systems

---

## Key Differences: Main App vs MSO App

| Feature | Main App (`/`) | MSO App (`/mso`) |
|---------|----------------|------------------|
| **Focus** | Operations & Analytics | Governance & Compliance |
| **Primary User** | Operators, Analysts | MS Owners, Compliance Teams |
| **Dashboard** | Metrics, trends, work orders | Pending actions, signals, regulations |
| **Procedures** | View-only with analytics | Edit mode with versioning |
| **Navigation** | Layer-based tour (12 steps) | Action-based workflow |
| **Data View** | Historical & predictive | Actionable items only |
| **Workflow** | Execute → Analyze → Report | Detect → Review → Approve → Measure |

---

## Testing the MSO App

### 1. Access Dashboard
```bash
# Navigate to MSO dashboard
open http://localhost:3000/mso
```

**Expected**: See pending items including CI Signal #0001 and 2 regulation updates

### 2. Review Regulation
```bash
# Click "Review" on REG-2024-001
# Or navigate directly:
open http://localhost:3000/mso/regulations/REG-2024-001
```

**Expected**:
- See OSHA regulation details
- See 3 AI-proposed changes for MNT-202
- Edit proposed text in textarea
- Click "Approve All Changes" to create v2.0

### 3. Edit Procedure from CI Signal
```bash
# Click "Review" on CI Signal #0001
# Or navigate directly:
open "http://localhost:3000/mso/procedures/INT-031?signal=%230001"
```

**Expected**:
- See ProcedureEditor with blue "MS Owner Mode" banner
- See CI signal context at top
- Edit steps and save to create new version

### 4. Verify Version Creation
```bash
# After approving changes, verify via API:
curl http://localhost:3000/api/procedures/INT-031/versions

# Should show new version created with:
# - change_reason referencing regulation or CI signal
# - created_by: MSO-001
# - modified steps tracked
```

---

## Integration with Main App

The MSO app feeds back into the main operational app through:

1. **New Procedure Versions** - Field workers see updated procedures on next work order
2. **CI Signal Status** - Signals marked as "implemented" when version created
3. **Compliance Metrics** - Before/after comparison validates improvements
4. **Audit Trail** - Full history of why procedures changed (regulation, CI signal, manual)

**Circular Loop**:
```
Main App: Field Execution → Data → Analytics → CI Signal
    ↓
MSO App: Review Signal → Edit Procedure → Create Version
    ↓
Main App: Use New Version → Measure Improvement → Validate
```

---

## Summary

The MSO application is a **governance-first experience** that:
- ✅ Reuses all existing components and APIs
- ✅ Focuses on actionable items (CI signals, regulations)
- ✅ Provides AI-assisted compliance updates
- ✅ Shows before/after validation of changes
- ✅ Feeds back into operational loop
- ✅ Maintains full audit trail

**Access**: `http://localhost:3000/mso`

**Next Steps**:
1. Test regulation workflow at `/mso/regulations/REG-2024-001`
2. Test CI signal workflow at `/mso/procedures/INT-031?signal=%230001`
3. Add real regulation data source
4. Integrate version comparison table
5. Build approval workflow engine
