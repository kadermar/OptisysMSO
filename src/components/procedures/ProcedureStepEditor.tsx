'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Save,
  X,
  Edit,
  Trash2,
  GripVertical,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  History,
} from 'lucide-react';

interface Step {
  step_id: string;
  step_number: number;
  step_name: string;
  description?: string;
  typical_duration_minutes?: number;
  criticality?: 'low' | 'medium' | 'high';
  verification_required?: boolean;
}

interface ProcedureStepEditorProps {
  procedureId: string;
  initialSteps: Step[];
  onSave?: () => void;
  currentMode?: 'edit' | 'history' | 'add-steps';
  onModeChange?: (mode: 'edit' | 'history' | 'add-steps') => void;
  procedure?: any;
}

export function ProcedureStepEditor({
  procedureId,
  initialSteps,
  onSave,
  currentMode = 'add-steps',
  onModeChange,
  procedure: initialProcedure
}: ProcedureStepEditorProps) {
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [procedure, setProcedure] = useState<any>(initialProcedure || null);

  useEffect(() => {
    if (!initialProcedure) {
      fetch(`/api/procedures/${procedureId}`)
        .then(res => res.json())
        .then(data => setProcedure(data))
        .catch(err => console.error('Error fetching procedure:', err));
    }
  }, [procedureId, initialProcedure]);

  const [newStep, setNewStep] = useState<Partial<Step>>({
    step_name: '',
    description: '',
    typical_duration_minutes: 10,
    criticality: 'medium',
    verification_required: false,
  });

  const handleAddStep = () => {
    setAddingNew(true);
  };

  const handleSaveNewStep = () => {
    if (!newStep.step_name) {
      setMessage({ type: 'error', text: 'Step name is required' });
      return;
    }

    const maxStepNumber = Math.max(...steps.map(s => s.step_number), 0);
    const step: Step = {
      step_id: `${procedureId}-STEP-${maxStepNumber + 1}`,
      step_number: maxStepNumber + 1,
      step_name: newStep.step_name,
      description: newStep.description,
      typical_duration_minutes: newStep.typical_duration_minutes || 10,
      criticality: newStep.criticality || 'medium',
      verification_required: newStep.verification_required || false,
    };

    setSteps([...steps, step]);
    setAddingNew(false);
    setNewStep({
      step_name: '',
      description: '',
      typical_duration_minutes: 10,
      criticality: 'medium',
      verification_required: false,
    });
    setMessage({ type: 'success', text: 'Step added! Remember to save changes.' });
  };

  const handleCancelNew = () => {
    setAddingNew(false);
    setNewStep({
      step_name: '',
      description: '',
      typical_duration_minutes: 10,
      criticality: 'medium',
      verification_required: false,
    });
  };

  const handleEditStep = (stepId: string) => {
    setEditingStepId(stepId);
  };

  const handleSaveEdit = (stepId: string) => {
    setEditingStepId(null);
    setMessage({ type: 'success', text: 'Step updated! Remember to save changes.' });
  };

  const handleDeleteStep = (stepId: string) => {
    if (confirm('Are you sure you want to delete this step?')) {
      const filteredSteps = steps.filter(s => s.step_id !== stepId);
      // Renumber remaining steps
      const renumberedSteps = filteredSteps.map((s, idx) => ({
        ...s,
        step_number: idx + 1,
      }));
      setSteps(renumberedSteps);
      setMessage({ type: 'success', text: 'Step deleted! Remember to save changes.' });
    }
  };

  const handleUpdateStep = (stepId: string, field: keyof Step, value: any) => {
    setSteps(steps.map(s => s.step_id === stepId ? { ...s, [field]: value } : s));
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Calculate new version
      const versionsRes = await fetch(`/api/procedures/${procedureId}/versions`);
      const versions = versionsRes.ok ? await versionsRes.json() : [];

      let currentVersion = '1.0';
      if (versions.length > 0) {
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

      // Prepare modified steps
      const modifiedSteps = steps.map(step => ({
        stepId: step.step_id,
        stepNumber: step.step_number,
        stepName: step.step_name,
        stepContent: step.description || '',
        description: step.description || '',
        typicalDurationMinutes: step.typical_duration_minutes || 10,
        criticality: step.criticality || 'medium',
        verificationRequired: step.verification_required || false,
        changeType: 'modified' as const,
      }));

      // Create new version
      const response = await fetch(`/api/procedures/${procedureId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newVersion,
          createdBy: 'MSO-001',
          changeReason: 'Manual procedure update: Steps added/modified via procedure editor',
          modifiedSteps,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `Changes saved successfully! New version ${newVersion} created.` });
        if (onSave) onSave();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.details || error.error || 'Failed to save changes' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    window.location.href = '/mso/governance';
  };

  const currentVersion = procedure?.version || procedure?.current_version || '1.0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Left: Back button + Procedure info */}
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </motion.button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                  <Edit className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[#1c2b40]">
                    {procedure?.name || procedureId}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {procedureId} | Version {currentVersion}
                  </p>
                </div>
              </div>
            </div>

            {/* Center: Mode tabs (only if onModeChange provided) */}
            {onModeChange && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onModeChange('edit')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    currentMode === 'edit'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Edit className="w-4 h-4 inline mr-1" />
                  Edit Steps
                </button>
                <button
                  onClick={() => onModeChange('add-steps')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    currentMode === 'add-steps'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Add/Manage Steps
                </button>
                <button
                  onClick={() => onModeChange('history')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    currentMode === 'history'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <History className="w-4 h-4 inline mr-1" />
                  Version History
                </button>
              </div>
            )}

            {/* Right: Action buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddStep}
                disabled={addingNew}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>Add Step</span>
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="px-4 py-2 bg-gradient-to-r from-[#ff0000] to-[#cc0000] text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Message */}
        <AnimatePresence>
          {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="flex-1">{message.text}</span>
            <button onClick={() => setMessage(null)}>
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Steps List */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.step_id}
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            {editingStepId === step.step_id ? (
              // Edit Mode
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-600">#{step.step_number}</span>
                  <input
                    type="text"
                    value={step.step_name}
                    onChange={(e) => handleUpdateStep(step.step_id, 'step_name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff0000] focus:border-transparent"
                    placeholder="Step name"
                  />
                </div>
                <textarea
                  value={step.description || ''}
                  onChange={(e) => handleUpdateStep(step.step_id, 'description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff0000] focus:border-transparent"
                  rows={3}
                  placeholder="Step description"
                />
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Duration (min)</label>
                    <input
                      type="number"
                      value={step.typical_duration_minutes || 10}
                      onChange={(e) => handleUpdateStep(step.step_id, 'typical_duration_minutes', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff0000] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Criticality</label>
                    <select
                      value={step.criticality || 'medium'}
                      onChange={(e) => handleUpdateStep(step.step_id, 'criticality', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff0000] focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={step.verification_required || false}
                        onChange={(e) => handleUpdateStep(step.step_id, 'verification_required', e.target.checked)}
                        className="w-4 h-4 text-[#ff0000] focus:ring-[#ff0000]"
                      />
                      <span className="text-sm text-gray-700">Requires Verification</span>
                    </label>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handleSaveEdit(step.step_id)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Done</span>
                  </button>
                  <button
                    onClick={() => setEditingStepId(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="flex items-start gap-4">
                <div className="cursor-move text-gray-400 mt-1">
                  <GripVertical className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-gray-600">#{step.step_number}</span>
                    <span className="font-semibold text-[#1c2b40]">{step.step_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      step.criticality === 'high' ? 'bg-red-100 text-red-800' :
                      step.criticality === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {step.criticality}
                    </span>
                    {step.verification_required && (
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        Verification Required
                      </span>
                    )}
                  </div>
                  {step.description && (
                    <p className="text-sm text-gray-700 mb-2">{step.description}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Duration: {step.typical_duration_minutes || 10} minutes
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditStep(step.step_id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteStep(step.step_id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add New Step Form */}
        {addingNew && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-2 border-dashed border-green-300 rounded-lg p-4 bg-green-50/30"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-600">#{steps.length + 1}</span>
                <input
                  type="text"
                  value={newStep.step_name}
                  onChange={(e) => setNewStep({ ...newStep, step_name: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Step name"
                  autoFocus
                />
              </div>
              <textarea
                value={newStep.description}
                onChange={(e) => setNewStep({ ...newStep, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
                placeholder="Step description"
              />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={newStep.typical_duration_minutes}
                    onChange={(e) => setNewStep({ ...newStep, typical_duration_minutes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Criticality</label>
                  <select
                    value={newStep.criticality}
                    onChange={(e) => setNewStep({ ...newStep, criticality: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newStep.verification_required}
                      onChange={(e) => setNewStep({ ...newStep, verification_required: e.target.checked })}
                      className="w-4 h-4 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Requires Verification</span>
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSaveNewStep}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Step</span>
                </button>
                <button
                  onClick={handleCancelNew}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      </div>
    </div>
  );
}
