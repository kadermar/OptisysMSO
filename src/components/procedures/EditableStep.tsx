'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Check, AlertCircle, Clock, Shield } from 'lucide-react';

interface EditableStepProps {
  step: any;
  index: number;
  isEdited: boolean;
  currentVersion: string;
  newVersion: string;
  onChange: (changes: any) => void;
}

export default function EditableStep({
  step,
  index,
  isEdited,
  currentVersion,
  newVersion,
  onChange
}: EditableStepProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localChanges, setLocalChanges] = useState<any>({
    description: step.description || step.step_content || '',
    step_name: step.step_name || '',
    criticality: step.criticality || 'medium',
    typical_duration_minutes: step.typical_duration_minutes || 0,
    verification_required: step.verification_required || false
  });

  const handleFieldChange = (field: string, value: any) => {
    const updated = { ...localChanges, [field]: value };
    setLocalChanges(updated);
    onChange(updated);
  };

  const startEditing = () => {
    setIsEditing(true);
  };

  const criticalityColors = {
    low: 'bg-blue-100 text-blue-800 border-blue-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    critical: 'bg-red-100 text-red-800 border-red-300'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white rounded-xl shadow-md border-2 overflow-hidden transition-all ${
        isEdited ? 'border-green-500' : 'border-gray-200'
      }`}
    >
      {/* Header */}
      <div className={`px-6 py-4 flex items-center justify-between ${
        isEdited ? 'bg-green-50' : 'bg-gray-50'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${
            isEdited ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'
          }`}>
            {step.step_number || index + 1}
          </div>
          <div>
            <h3 className="font-bold text-[#1c2b40] text-lg">
              {isEditing ? (
                <input
                  type="text"
                  value={localChanges.step_name}
                  onChange={(e) => handleFieldChange('step_name', e.target.value)}
                  className="px-2 py-1 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Step name"
                />
              ) : (
                localChanges.step_name || step.step_name
              )}
            </h3>
            <p className="text-xs text-gray-500">
              {step.step_id} | {isEdited ? `Modified in v${newVersion}` : `Current v${currentVersion}`}
            </p>
          </div>
        </div>

        {isEdited && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
            <Check className="w-4 h-4" />
            Modified
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-6">
        {/* Before/After Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Current Version (Before) */}
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2 py-1 bg-red-200 text-red-900 text-xs font-bold rounded">
                v{currentVersion}
              </div>
              <span className="text-xs text-red-700 font-semibold">Current</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {step.description || step.step_content || 'No description provided'}
            </p>
          </div>

          {/* New Version (After) */}
          <div className={`border-2 rounded-xl p-4 ${
            isEdited ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`px-2 py-1 text-xs font-bold rounded ${
                isEdited ? 'bg-green-200 text-green-900' : 'bg-gray-200 text-gray-700'
              }`}>
                v{newVersion}
              </div>
              <span className={`text-xs font-semibold ${
                isEdited ? 'text-green-700' : 'text-gray-500'
              }`}>
                {isEdited ? 'Modified' : 'Unchanged'}
              </span>
            </div>
            {isEditing || isEdited ? (
              <textarea
                value={localChanges.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                onFocus={startEditing}
                rows={4}
                className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:outline-none focus:border-green-500 text-sm text-gray-700 resize-none"
                placeholder="Edit step description..."
              />
            ) : (
              <button
                onClick={startEditing}
                className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-green-600"
              >
                <Edit2 className="w-4 h-4" />
                Click to edit
              </button>
            )}
          </div>
        </div>

        {/* Metadata Fields (shown when editing) */}
        {(isEditing || isEdited) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="border-t border-gray-200 pt-4 mt-4 space-y-4"
          >
            {/* Criticality */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 flex-shrink-0">
                <Shield className="w-4 h-4 text-gray-600" />
                <label className="text-sm font-semibold text-gray-700">Criticality:</label>
              </div>
              <select
                value={localChanges.criticality}
                onChange={(e) => handleFieldChange('criticality', e.target.value)}
                className={`px-3 py-1.5 rounded-lg border-2 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                  criticalityColors[localChanges.criticality as keyof typeof criticalityColors]
                }`}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 flex-shrink-0">
                <Clock className="w-4 h-4 text-gray-600" />
                <label className="text-sm font-semibold text-gray-700">Typical Duration:</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={localChanges.typical_duration_minutes}
                  onChange={(e) => handleFieldChange('typical_duration_minutes', parseInt(e.target.value) || 0)}
                  className="w-24 px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                />
                <span className="text-sm text-gray-600">minutes</span>
              </div>
            </div>

            {/* Verification Required */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-gray-600" />
                <label className="text-sm font-semibold text-gray-700">Verification Required:</label>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localChanges.verification_required}
                  onChange={(e) => handleFieldChange('verification_required', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                <span className="ms-3 text-sm font-medium text-gray-700">
                  {localChanges.verification_required ? 'Yes' : 'No'}
                </span>
              </label>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
