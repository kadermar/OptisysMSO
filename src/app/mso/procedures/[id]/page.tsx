'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { ArrowLeft, History, Edit } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ProcedureEditor from '@/components/procedures/ProcedureEditor';
import { ProcedureVersionHistory } from '@/components/procedures/ProcedureVersionHistory';
import { ProcedureStepEditor } from '@/components/procedures/ProcedureStepEditor';

export default function MSOProcedurePage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ signal?: string; recommendation?: string; mode?: string }>;
}) {
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);
  const [procedure, setProcedure] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'edit' | 'history' | 'add-steps'>('edit');

  useEffect(() => {
    fetchProcedure();
  }, [resolvedParams.id]);

  const fetchProcedure = async () => {
    try {
      const response = await fetch(`/api/procedures/${resolvedParams.id}`);
      if (response.ok) {
        setProcedure(await response.json());
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    window.location.href = '/mso/governance';
  };

  const handleSaveSteps = async () => {
    // Refetch procedure after saving
    await fetchProcedure();
    setViewMode('history'); // Switch to history to see the new version
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff0000]"></div>
      </div>
    );
  }

  if (!procedure) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Procedure not found</p>
          <Link href="/mso" className="text-[#ff0000] hover:underline">
            Return to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* MSO Context Banner */}
      <div className="bg-blue-50 border-b-2 border-blue-200 px-6 py-3 sticky top-[60px] z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">MS Owner Mode</span>
              {resolvedSearchParams.signal && (
                <span className="ml-2">• Addressing CI Signal {resolvedSearchParams.signal}</span>
              )}
            </p>

            {/* Mode Tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('edit')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'edit'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-blue-700 hover:bg-blue-100'
                }`}
              >
                <Edit className="w-4 h-4 inline mr-1" />
                Edit Steps
              </button>
              <button
                onClick={() => setViewMode('add-steps')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'add-steps'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-blue-700 hover:bg-blue-100'
                }`}
              >
                Add/Manage Steps
              </button>
              <button
                onClick={() => setViewMode('history')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'history'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-blue-700 hover:bg-blue-100'
                }`}
              >
                <History className="w-4 h-4 inline mr-1" />
                Version History
              </button>
            </div>
          </div>
          <div className="text-xs text-blue-700">
            Changes will create a new procedure version with full audit trail
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {viewMode === 'edit' && (
          <ProcedureEditor
            procedureId={resolvedParams.id}
            ciSignalId={resolvedSearchParams.signal}
            initialRecommendation={resolvedSearchParams.recommendation}
            onClose={handleClose}
          />
        )}

        {viewMode === 'add-steps' && procedure && (
          <ProcedureStepEditor
            procedureId={resolvedParams.id}
            initialSteps={procedure.steps || []}
            onSave={handleSaveSteps}
          />
        )}

        {viewMode === 'history' && (
          <ProcedureVersionHistory procedureId={resolvedParams.id} />
        )}
      </div>
    </div>
  );
}
