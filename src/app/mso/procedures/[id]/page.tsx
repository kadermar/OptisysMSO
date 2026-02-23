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
    // Switch to history to see the new version
    setViewMode('history');
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
      {viewMode === 'edit' && (
        <ProcedureEditor
          procedureId={resolvedParams.id}
          ciSignalId={resolvedSearchParams.signal}
          initialRecommendation={resolvedSearchParams.recommendation}
          onClose={handleClose}
          currentMode={viewMode}
          onModeChange={setViewMode}
        />
      )}

      {viewMode === 'add-steps' && procedure && (
        <ProcedureStepEditor
          procedureId={resolvedParams.id}
          initialSteps={procedure.steps || []}
          onSave={handleSaveSteps}
          currentMode={viewMode}
          onModeChange={setViewMode}
        />
      )}

      {viewMode === 'history' && (
        <ProcedureVersionHistory
          procedureId={resolvedParams.id}
          currentMode={viewMode}
          onModeChange={setViewMode}
        />
      )}
    </div>
  );
}
