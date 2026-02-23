'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  User,
  FileText,
  ChevronDown,
  ChevronUp,
  History,
  CheckCircle,
  AlertCircle,
  Edit,
  Plus,
  Trash2,
  ArrowLeft,
} from 'lucide-react';

interface Version {
  version_id: number;
  version: string;
  created_at: string;
  created_by: string;
  owner_name: string;
  change_reason: string;
  ci_signal_id?: string;
  signal_title?: string;
  step_count: number;
  modified_steps: number;
  added_steps: number;
  removed_steps: number;
  is_current: boolean;
}

interface VersionStep {
  step_id: string;
  step_number: number;
  step_name: string;
  step_content: string;
  criticality: string;
  change_type: 'unchanged' | 'modified' | 'added' | 'removed';
}

interface ProcedureVersionHistoryProps {
  procedureId: string;
  currentMode?: 'edit' | 'history' | 'add-steps';
  onModeChange?: (mode: 'edit' | 'history' | 'add-steps') => void;
}

export function ProcedureVersionHistory({
  procedureId,
  currentMode = 'history',
  onModeChange
}: ProcedureVersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);
  const [versionSteps, setVersionSteps] = useState<Record<number, VersionStep[]>>({});
  const [loadingSteps, setLoadingSteps] = useState<Record<number, boolean>>({});
  const [procedure, setProcedure] = useState<any>(null);

  useEffect(() => {
    fetchVersions();
    fetch(`/api/procedures/${procedureId}`)
      .then(res => res.json())
      .then(data => setProcedure(data))
      .catch(err => console.error('Error fetching procedure:', err));
  }, [procedureId]);

  const fetchVersions = async () => {
    try {
      const res = await fetch(`/api/procedures/${procedureId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data);
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVersionDetails = async (versionId: number, version: string) => {
    if (versionSteps[versionId]) return; // Already loaded

    setLoadingSteps(prev => ({ ...prev, [versionId]: true }));
    try {
      const res = await fetch(`/api/procedures/${procedureId}/versions/${version}`);
      if (res.ok) {
        const data = await res.json();
        setVersionSteps(prev => ({ ...prev, [versionId]: data.steps || [] }));
      }
    } catch (error) {
      console.error('Error fetching version details:', error);
    } finally {
      setLoadingSteps(prev => ({ ...prev, [versionId]: false }));
    }
  };

  const toggleVersion = (versionId: number, version: string) => {
    if (expandedVersion === versionId) {
      setExpandedVersion(null);
    } else {
      setExpandedVersion(versionId);
      fetchVersionDetails(versionId, version);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'modified':
        return <Edit className="w-4 h-4 text-blue-600" />;
      case 'added':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'removed':
        return <Trash2 className="w-4 h-4 text-red-600" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'modified':
        return 'bg-blue-50 border-blue-200';
      case 'added':
        return 'bg-green-50 border-green-200';
      case 'removed':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleClose = () => {
    window.location.href = '/mso/governance';
  };

  const currentVersion = procedure?.version || procedure?.current_version || '1.0';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff0000]"></div>
        </div>
      </div>
    );
  }

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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <History className="w-5 h-5 text-white" />
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

            {/* Right: Version count */}
            <div className="text-sm text-gray-600">
              {versions.length} {versions.length === 1 ? 'version' : 'versions'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {versions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500">No version history available</p>
          </div>
        ) : (
          <div className="space-y-3">
        {versions.map((version, index) => (
          <motion.div
            key={version.version_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`border rounded-xl overflow-hidden transition-all ${
              version.is_current
                ? 'border-[#ff0000] bg-red-50/30'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            {/* Version Header */}
            <button
              onClick={() => toggleVersion(version.version_id, version.version)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`px-3 py-1 rounded-lg font-bold text-sm ${
                  version.is_current
                    ? 'bg-gradient-to-r from-[#ff0000] to-[#cc0000] text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  v{version.version}
                </div>

                <div className="text-left">
                  <div className="font-semibold text-[#1c2b40] flex items-center gap-2">
                    {version.is_current && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                        CURRENT
                      </span>
                    )}
                    {version.change_reason.substring(0, 60)}
                    {version.change_reason.length > 60 && '...'}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {version.owner_name || version.created_by}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(version.created_at)}
                    </span>
                    {version.signal_title && (
                      <span className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {version.signal_title}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 text-xs">
                  {version.modified_steps > 0 && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {version.modified_steps} modified
                    </span>
                  )}
                  {version.added_steps > 0 && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                      {version.added_steps} added
                    </span>
                  )}
                  {version.removed_steps > 0 && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded">
                      {version.removed_steps} removed
                    </span>
                  )}
                </div>
                {expandedVersion === version.version_id ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            {/* Expanded Version Details */}
            <AnimatePresence>
              {expandedVersion === version.version_id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-gray-200"
                >
                  <div className="p-4 bg-gray-50">
                    {/* Full Change Reason */}
                    <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                      <div className="text-xs font-semibold text-gray-600 mb-1">Change Reason:</div>
                      <div className="text-sm text-gray-800">{version.change_reason}</div>
                    </div>

                    {/* Steps */}
                    {loadingSteps[version.version_id] ? (
                      <div className="text-center py-4 text-gray-500">
                        <div className="animate-spin w-6 h-6 border-2 border-[#ff0000] border-t-transparent rounded-full mx-auto"></div>
                        <p className="mt-2 text-sm">Loading steps...</p>
                      </div>
                    ) : versionSteps[version.version_id] ? (
                      <div className="space-y-2">
                        <div className="text-sm font-semibold text-gray-700 mb-2">
                          Steps ({versionSteps[version.version_id].length}):
                        </div>
                        {versionSteps[version.version_id].map((step) => (
                          <div
                            key={step.step_id}
                            className={`p-3 border rounded-lg ${getChangeTypeColor(step.change_type)}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">{getChangeTypeIcon(step.change_type)}</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-sm text-gray-900">
                                    Step {step.step_number}: {step.step_name}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    step.criticality === 'high' ? 'bg-red-100 text-red-800' :
                                    step.criticality === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {step.criticality}
                                  </span>
                                  {step.change_type !== 'unchanged' && (
                                    <span className="text-xs text-gray-500 capitalize">
                                      ({step.change_type})
                                    </span>
                                  )}
                                </div>
                                {step.step_content && (
                                  <div className="text-xs text-gray-700 mt-1 whitespace-pre-line">
                                    {step.step_content.substring(0, 200)}
                                    {step.step_content.length > 200 && '...'}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No step details available
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
          </div>
        )}
      </div>
    </div>
  );
}
