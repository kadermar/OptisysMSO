'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DrilldownCards } from '@/components/dashboard/DrilldownCards';
import { ProcedureStepAnalysis } from '@/components/dashboard/ProcedureStepAnalysis';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ProcedureVersionHistory } from '@/components/procedures/ProcedureVersionHistory';
import { ProcedureStepEditor } from '@/components/procedures/ProcedureStepEditor';
import { Edit } from 'lucide-react';

export default function ProcedureDrilldownPage() {
  const params = useParams();
  const procedureId = params.id as string;

  const [procedures, setProcedures] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [procedureSteps, setProcedureSteps] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [proceduresRes, workOrdersRes, stepsRes] = await Promise.all([
          fetch('/api/dashboard/procedures'),
          fetch('/api/dashboard/work-orders'),
          fetch(`/api/procedures/${procedureId}`),
        ]);

        if (!proceduresRes.ok || !workOrdersRes.ok) {
          throw new Error('Failed to fetch data');
        }

        setProcedures(await proceduresRes.json());
        setWorkOrders(await workOrdersRes.json());

        if (stepsRes.ok) {
          const procedureData = await stepsRes.json();
          setProcedureSteps(procedureData.steps || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load procedure data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [procedureId]);

  const handleSaveSteps = async () => {
    // Refetch data after saving
    setEditMode(false);
    const stepsRes = await fetch(`/api/procedures/${procedureId}`);
    if (stepsRes.ok) {
      const procedureData = await stepsRes.json();
      setProcedureSteps(procedureData.steps || []);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-[#ff0000] text-xl mb-4">⚠️ Error</div>
          <p className="text-[#1c2b40]">{error}</p>
        </div>
      </div>
    );
  }

  const procedure = procedures.find(p => p.procedure_id === procedureId);
  const filteredWorkOrders = workOrders.filter(wo => wo.procedure_id === procedureId);

  if (!procedure) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-yellow-600 text-xl mb-4">⚠️ Not Found</div>
          <p className="text-[#1c2b40]">Procedure not found</p>
          <Link href="/procedures" className="mt-4 inline-block text-[#ff0000] hover:underline">
            Return to Procedures
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-300 animate-fadeIn">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1c2b40]">
                {procedure.name}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {procedure.category} • {procedure.procedure_id}
              </p>
            </div>
            <button
              onClick={() => setEditMode(!editMode)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                editMode
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-gradient-to-r from-[#ff0000] to-[#cc0000] text-white hover:shadow-lg'
              }`}
            >
              <Edit className="w-4 h-4" />
              <span>{editMode ? 'Cancel Edit' : 'Edit Steps'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Procedure Statistics */}
        <section className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-[#1c2b40] mb-6">Procedure Statistics</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Compliance Rate */}
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="text-sm font-medium text-gray-600 mb-2">Compliance Rate</div>
              <div className="text-3xl font-bold text-green-700">
                {procedure.compliance_rate}%
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {procedure.compliant_count}/{procedure.total_work_orders} compliant
              </div>
            </div>

            {/* Incident Rate */}
            <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
              <div className="text-sm font-medium text-gray-600 mb-2">Incident Rate</div>
              <div className="text-3xl font-bold text-red-700">
                {procedure.incident_rate}%
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {procedure.incident_count} incidents
              </div>
            </div>

            {/* Quality Score */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-gray-600 mb-2">Avg Quality Score</div>
              <div className="text-3xl font-bold text-blue-700">
                {procedure.avg_quality_score ? Number(procedure.avg_quality_score).toFixed(1) : 'N/A'}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                out of 5.0
              </div>
            </div>

            {/* Rework Rate */}
            <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
              <div className="text-sm font-medium text-gray-600 mb-2">Rework Rate</div>
              <div className="text-3xl font-bold text-yellow-700">
                {procedure.rework_rate}%
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {procedure.rework_count} reworks
              </div>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs font-medium text-gray-600">Total Work Orders</div>
              <div className="text-xl font-bold text-[#1c2b40] mt-1">
                {procedure.total_work_orders}
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs font-medium text-gray-600">Avg Duration</div>
              <div className="text-xl font-bold text-[#1c2b40] mt-1">
                {procedure.avg_duration ? Number(procedure.avg_duration).toFixed(1) : 'N/A'}h
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs font-medium text-gray-600">Avg Downtime</div>
              <div className="text-xl font-bold text-[#1c2b40] mt-1">
                {procedure.avg_downtime ? Number(procedure.avg_downtime).toFixed(1) : 'N/A'}h
              </div>
            </div>
          </div>
        </section>

        {/* Step Editor */}
        {editMode && procedureSteps.length > 0 && (
          <section>
            <ProcedureStepEditor
              procedureId={procedureId}
              initialSteps={procedureSteps}
              onSave={handleSaveSteps}
            />
          </section>
        )}

        {/* Version History */}
        {!editMode && (
          <section>
            <ProcedureVersionHistory procedureId={procedureId} />
          </section>
        )}

        {/* Work Order Details */}
        <section className="bg-white rounded-lg shadow-lg p-6">
          <DrilldownCards
            workOrders={filteredWorkOrders}
            selectedProcedureId={procedureId}
          />
        </section>

        {/* Step-by-Step Analysis */}
        <section>
          <ProcedureStepAnalysis
            procedures={[procedure]}
            dateRange={{ start: '2024-01-01', end: '2024-09-30' }}
          />
        </section>
      </main>
    </div>
  );
}
