'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit, Save, X, Sparkles, ArrowLeft } from 'lucide-react';
import { useTourSafe } from '@/components/tour/TourProvider';
import EditableStep from './EditableStep';

interface ProcedureEditorProps {
  procedureId: string;
  ciSignalId?: string;
  initialRecommendation?: string;
  onClose: () => void;
}

export default function ProcedureEditor({ procedureId, ciSignalId, initialRecommendation, onClose }: ProcedureEditorProps) {
  const tour = useTourSafe();
  const [procedure, setProcedure] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [editedSteps, setEditedSteps] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ciSignal, setCiSignal] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<string>(initialRecommendation || '');

  useEffect(() => {
    fetchProcedureData();
  }, [procedureId, ciSignalId]);

  const fetchProcedureData = async () => {
    try {
      // Fetch procedure with steps
      const procResponse = await fetch(`/api/procedures/${procedureId}`);
      if (procResponse.ok) {
        const procData = await procResponse.json();
        setProcedure(procData);
        setSteps(procData.steps || []);
      }

      // Fetch CI signal if provided
      if (ciSignalId) {
        const signalResponse = await fetch(`/api/ci-signals/${ciSignalId}`);
        if (signalResponse.ok) {
          const signalData = await signalResponse.json();
          setCiSignal(signalData);
          // Set recommendation from CI signal if not already provided
          if (!initialRecommendation && signalData.recommendation_text) {
            setRecommendation(signalData.recommendation_text);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching procedure data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStepEdit = (stepId: string, changes: any) => {
    const newEdited = new Map(editedSteps);
    newEdited.set(stepId, { ...steps.find(s => s.step_id === stepId), ...changes });
    setEditedSteps(newEdited);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare modified steps for API
      const modifiedSteps = Array.from(editedSteps.entries()).map(([stepId, stepData]) => ({
        stepId,
        stepContent: stepData.description,
        stepName: stepData.step_name,
        description: stepData.description,
        criticality: stepData.criticality,
        typicalDurationMinutes: stepData.typical_duration_minutes,
        verificationRequired: stepData.verification_required,
        changeType: 'modified' as const
      }));

      // Include unchanged steps
      const unchangedSteps = steps
        .filter(s => !editedSteps.has(s.step_id))
        .map(s => ({
          stepId: s.step_id,
          changeType: 'unchanged' as const
        }));

      const allSteps = [...modifiedSteps, ...unchangedSteps];

      // Fetch version history to get the latest version number
      const versionsRes = await fetch(`/api/procedures/${procedureId}/versions`);
      const versions = versionsRes.ok ? await versionsRes.json() : [];

      // Calculate new version from the latest version in history
      let currentVersion = '1.0';
      if (versions.length > 0) {
        // Sort by version to get the highest
        const sortedVersions = versions.sort((a: any, b: any) => {
          const [aMajor, aMinor] = a.version.split('.').map(Number);
          const [bMajor, bMinor] = b.version.split('.').map(Number);
          if (aMajor !== bMajor) return bMajor - aMajor;
          return bMinor - aMinor;
        });
        currentVersion = sortedVersions[0].version;
      }

      const versionParts = currentVersion.split('.');
      const newVersion = `${versionParts[0]}.${parseInt(versionParts[1] || '0') + 1}`;

      // Create new version
      const response = await fetch(`/api/procedures/${procedureId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newVersion,
          createdBy: 'MSO-001', // J. Berg
          changeReason: recommendation || (ciSignalId
            ? `Addressing CI Signal ${ciSignalId}: ${ciSignal?.title || 'Procedure improvement'}`
            : 'Procedure improvement based on field feedback'),
          ciSignalId,
          modifiedSteps: allSteps
        })
      });

      if (response.ok) {
        const result = await response.json();

        // Notify tour if active
        if (tour?.isActive && tour.currentStep === 9) {
          tour.setEditedProcedure?.(procedureId, newVersion);
        }

        alert(`Version ${newVersion} created successfully!`);
        onClose();
      } else {
        const error = await response.json();
        alert(`Failed to save: ${error.details || error.error}`);
      }
    } catch (error: any) {
      alert(`Error saving procedure: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff0000]"></div>
      </div>
    );
  }

  const currentVersion = procedure?.version || procedure?.current_version || '1.0';
  const versionParts = currentVersion.split('.');
  const newVersion = `${versionParts[0]}.${parseInt(versionParts[1] || '0') + 1}`;
  const hasChanges = editedSteps.size > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </motion.button>
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                    <Edit className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-[#1c2b40]">
                      {procedure?.name}
                    </h1>
                    <p className="text-sm text-gray-500">
                      {procedureId} | Version {currentVersion} → {newVersion}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 bg-amber-100 text-amber-700 text-sm font-bold rounded-lg">
                Editing Mode
              </span>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="px-4 py-2 bg-gradient-to-r from-[#ff0000] to-[#cc0000] text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Publish v{newVersion}
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Tour Guidance */}
        {tour?.isActive && tour.currentStep === 9 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-300"
          >
            <h3 className="text-sm font-bold text-blue-900 mb-2">✏️ Step 9: Procedure Editing</h3>
            <p className="text-sm text-blue-800">
              Based on the CI signal, update the procedure by editing step descriptions.
              Make a simple edit to demonstrate how insights drive improvements.
            </p>
          </motion.div>
        )}

        {/* CI Signal Context & Recommendation Editor */}
        {(ciSignal || recommendation) && (
          <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                {ciSignal && (
                  <>
                    <h3 className="text-sm font-bold text-amber-900 mb-1">
                      Addressing CI Signal {ciSignal.signal_id}
                    </h3>
                    <p className="text-sm text-amber-800 mb-3">{ciSignal.title}</p>
                  </>
                )}
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-2">
                    Recommended Adjustments (Editable)
                  </label>
                  <textarea
                    value={recommendation}
                    onChange={(e) => setRecommendation(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-sm text-gray-800 bg-white"
                    placeholder="Enter improvement recommendations..."
                  />
                  <p className="text-xs text-amber-700 mt-1">
                    These recommendations will be saved as the change reason for version {newVersion}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Editable Steps */}
        <div className="space-y-6">
          {steps.map((step, index) => (
            <EditableStep
              key={step.step_id}
              step={step}
              index={index}
              isEdited={editedSteps.has(step.step_id)}
              currentVersion={currentVersion}
              newVersion={newVersion}
              onChange={(changes) => handleStepEdit(step.step_id, changes)}
            />
          ))}
        </div>

        {/* Change Summary */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-green-50 border-l-4 border-green-500 rounded-r-xl p-5"
          >
            <h3 className="text-sm font-bold text-green-900 mb-2">
              {editedSteps.size} {editedSteps.size === 1 ? 'step' : 'steps'} modified
            </h3>
            <p className="text-xs text-green-700">
              Changes will be saved as version {newVersion}. Click "Publish" to create the new version.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
