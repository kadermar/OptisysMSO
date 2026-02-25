'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { ArrowLeft, History, Edit } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [suggestedStepChanges, setSuggestedStepChanges] = useState<any[]>([]);

  useEffect(() => {
    fetchProcedure();
    if (resolvedSearchParams.signal) {
      fetchCachedRecommendations();
    }
  }, [resolvedParams.id, resolvedSearchParams.signal]);

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

  const fetchCachedRecommendations = async () => {
    if (!resolvedSearchParams.signal) return;

    try {
      const response = await fetch(`/api/ci-signals/${encodeURIComponent(resolvedSearchParams.signal)}/recommendations`);
      if (response.ok) {
        const data = await response.json();
        setSuggestedStepChanges(data.suggestedStepChanges || []);
      }
    } catch (error) {
      console.error('Error fetching cached recommendations:', error);
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
      <AnimatePresence mode="wait">
        {viewMode === 'edit' && (
          <motion.div
            key="edit"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <ProcedureEditor
              procedureId={resolvedParams.id}
              ciSignalId={resolvedSearchParams.signal}
              initialRecommendation={resolvedSearchParams.recommendation}
              suggestedStepChanges={suggestedStepChanges}
              onClose={handleClose}
              currentMode={viewMode}
              onModeChange={setViewMode}
            />
          </motion.div>
        )}

        {viewMode === 'add-steps' && procedure && (
          <motion.div
            key="add-steps"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <ProcedureStepEditor
              procedureId={resolvedParams.id}
              initialSteps={procedure.steps || []}
              onSave={handleSaveSteps}
              currentMode={viewMode}
              onModeChange={setViewMode}
              procedure={procedure}
            />
          </motion.div>
        )}

        {viewMode === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <ProcedureVersionHistory
              procedureId={resolvedParams.id}
              currentMode={viewMode}
              onModeChange={setViewMode}
              procedure={procedure}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
