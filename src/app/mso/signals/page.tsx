'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, ArrowRight, Filter, Search, ChevronDown, AlertTriangle, AlertOctagon, AlertCircle, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CISignalActionModal from '@/components/dashboard/CISignalActionModal';
import CISignalConfirmationModal from '@/components/dashboard/CISignalConfirmationModal';

// Helper to generate signal ID
const generateSignalId = (proc: any, index: number) => {
  return `#${String(index + 1).padStart(4, '0')}`;
};

// Helper to determine severity
const getSeverity = (proc: any) => {
  if (proc.compliance_rate < 70 || proc.incident_rate > 10) return 'critical';
  if (proc.compliance_rate < 80 || proc.incident_rate > 5 || proc.rework_rate > 20) return 'high';
  if (proc.rework_rate > 15 || proc.avg_quality_score < 7.0) return 'medium';
  return 'low';
};

// Helper to get severity color
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'from-red-500 to-rose-600';
    case 'high': return 'from-orange-500 to-amber-600';
    case 'medium': return 'from-yellow-500 to-orange-500';
    default: return 'from-blue-500 to-indigo-600';
  }
};

// Helper to get severity icon
const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical': return <AlertOctagon className="w-3 h-3" />;
    case 'high': return <AlertTriangle className="w-3 h-3" />;
    case 'medium': return <AlertCircle className="w-3 h-3" />;
    default: return <Info className="w-3 h-3" />;
  }
};

// Helper to generate detailed recommendation
const getRecommendation = (proc: any) => {
  const issues = [];

  if (proc.compliance_rate < 80) {
    issues.push(`Current compliance at ${proc.compliance_rate}% indicates systematic execution gaps`);
  }
  if (proc.incident_rate > 5) {
    issues.push(`Elevated incident rate of ${proc.incident_rate}% correlates with non-compliance`);
  }
  if (proc.rework_rate > 15) {
    issues.push(`High rework rate (${proc.rework_rate}%) suggests unclear or inadequate instructions`);
  }
  if (proc.avg_quality_score < 7.5) {
    issues.push(`Below-target quality score (${proc.avg_quality_score}/10) indicates process effectiveness concerns`);
  }

  const recommendations = [];

  if (proc.compliance_rate < 80) {
    recommendations.push('Review procedure steps for clarity and feasibility');
    recommendations.push('Provide targeted training for frequently skipped or failed steps');
  }
  if (proc.incident_rate > 5 || proc.rework_rate > 15) {
    recommendations.push('Conduct root cause analysis on incidents and rework patterns');
    recommendations.push('Consider adding verification checkpoints at critical steps');
  }
  if (proc.avg_quality_score < 7.5) {
    recommendations.push('Evaluate if quality criteria are well-defined and measurable');
    recommendations.push('Implement peer review process for work order completion');
  }

  return {
    description: issues.join('. ') + '.',
    recommendation: recommendations.join('. ') + '.'
  };
};

export default function MSOSignalsPage() {
  const router = useRouter();
  const [ciSignals, setCiSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Modal state management
  const [selectedSignal, setSelectedSignal] = useState<any>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationData, setConfirmationData] = useState<any>(null);

  useEffect(() => {
    fetchCISignals();
  }, []);

  const fetchCISignals = async () => {
    try {
      const response = await fetch('/api/ci-signals');
      if (response.ok) {
        const signals = await response.json();
        setCiSignals(signals);
      }
    } catch (error) {
      console.error('Error fetching CI signals:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle action completion from CISignalActionModal
  const handleActionComplete = async (action: string, data?: any) => {
    if (action === 'accept' && data?.confirmationData) {
      // Show confirmation modal with proposed changes
      setConfirmationData(data.confirmationData);
      setShowActionModal(false);
      setShowConfirmationModal(true);
    } else if (action === 'reject') {
      // Signal rejected, refresh the list
      await fetchCISignals();
      setShowActionModal(false);
    } else if (action === 'review') {
      // Navigate to editor with recommendation pre-filled
      router.push(data.editorUrl);
    } else if (action === 'manual') {
      // Navigate to editor for manual editing
      const signal = selectedSignal;
      router.push(`/mso/procedures/${signal.procedure_id}?signal=${signal.signal_id}&recommendation=${encodeURIComponent(signal.recommendation_text)}`);
    }
  };

  // Handle confirmation of changes
  const handleConfirmChanges = async () => {
    try {
      if (!selectedSignal || !confirmationData) return;

      // Apply the accepted recommendation and create procedure version
      const response = await fetch(`/api/ci-signals/${encodeURIComponent(selectedSignal.signal_id)}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'MSO-001', // TODO: Replace with actual user ID from auth
          affectedSteps: confirmationData.affectedSteps.map((step: any) => ({
            stepId: step.stepId,
            proposedContent: step.proposedContent,
            changeReason: step.changeReason
          }))
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Success - close modals and refresh
        setShowConfirmationModal(false);
        setSelectedSignal(null);
        await fetchCISignals();

        // TODO: Show success notification
        console.log('✅ Changes applied successfully:', result);
      } else {
        const error = await response.json();
        console.error('❌ Failed to apply changes:', error);
        // TODO: Show error notification
      }
    } catch (error) {
      console.error('❌ Error applying changes:', error);
      // TODO: Show error notification
    }
  };

  const severities = useMemo(() => {
    const sevs = new Set(ciSignals.map(s => s.severity).filter(Boolean));
    return ['all', ...Array.from(sevs)];
  }, [ciSignals]);

  const statuses = useMemo(() => {
    const stats = new Set(ciSignals.map(s => s.status).filter(Boolean));
    return ['all', ...Array.from(stats)];
  }, [ciSignals]);

  const filteredSignals = useMemo(() => {
    return ciSignals.filter(signal => {
      const matchesSearch = !searchQuery ||
        signal.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        signal.signal_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        signal.procedure_id?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSeverity = severityFilter === 'all' || signal.severity === severityFilter;
      const matchesStatus = statusFilter === 'all' || signal.status === statusFilter;
      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [ciSignals, searchQuery, severityFilter, statusFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-[#ff0000] text-lg font-semibold">Loading CI Signals...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#1c2b40]">CI Signals</h1>
          </div>
          <p className="text-gray-600">
            Procedures requiring attention based on performance metrics
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Summary Stats */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#1c2b40] mb-1">Active CI Signals</h2>
                <p className="text-sm text-gray-600">
                  {filteredSignals.length} signal{filteredSignals.length !== 1 ? 's' : ''} requiring attention
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {filteredSignals.filter(s => s.severity === 'critical').length}
                  </div>
                  <div className="text-xs text-gray-600">Critical</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {filteredSignals.filter(s => s.severity === 'high').length}
                  </div>
                  <div className="text-xs text-gray-600">High</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {filteredSignals.filter(s => s.severity === 'medium').length}
                  </div>
                  <div className="text-xs text-gray-600">High Rework</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {filteredSignals.filter(s => s.status === 'open').length}
                  </div>
                  <div className="text-xs text-gray-600">Open</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search CI signals..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff0000] focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff0000] focus:ring-2 focus:ring-red-100 appearance-none bg-white"
                >
                  {severities.map(sev => (
                    <option key={sev} value={sev}>
                      {sev === 'all' ? 'All Severities' : sev.charAt(0).toUpperCase() + sev.slice(1)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff0000] focus:ring-2 focus:ring-red-100 appearance-none bg-white"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status === 'all' ? 'All Statuses' : status.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* CI Signals List */}
          <div className="p-6">
            <div className="space-y-4">
              {filteredSignals.map((signal, idx) => {
                const severityColor = getSeverityColor(signal.severity);

                return (
                <motion.div
                  key={signal.signal_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-xl transition-all overflow-hidden"
                >
                  {/* Signal Header */}
                  <div className={`bg-gradient-to-r ${severityColor} px-6 py-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          {signal.severity === 'critical' && <AlertOctagon className="w-6 h-6 text-white" />}
                          {signal.severity === 'high' && <AlertTriangle className="w-6 h-6 text-white" />}
                          {signal.severity === 'medium' && <AlertCircle className="w-6 h-6 text-white" />}
                          {signal.severity === 'low' && <Info className="w-6 h-6 text-white" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-bold text-lg">CI Signal {signal.signal_id}</h3>
                            <span className="px-2 py-0.5 bg-white/30 backdrop-blur-sm text-white text-xs font-bold rounded-md uppercase inline-flex items-center gap-1">
                              {getSeverityIcon(signal.severity)}
                              {signal.severity}
                            </span>
                            {signal.status === 'implemented' && (
                              <span className="px-2 py-0.5 bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-md">
                                IMPLEMENTED
                              </span>
                            )}
                          </div>
                          <p className="text-white/90 text-sm mt-0.5">{signal.title}</p>
                        </div>
                      </div>
                      {signal.status !== 'implemented' && (
                        <button
                          onClick={() => {
                            setSelectedSignal(signal);
                            setShowActionModal(true);
                          }}
                          className="px-4 py-2 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          <span>Address</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Signal Body */}
                  <div className="p-6 space-y-4">
                    {/* Procedure Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="font-semibold text-[#1c2b40]">{signal.procedure_id}</span>
                      <span>•</span>
                      <span>{signal.signal_type.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>Detected: {new Date(signal.detected_at).toLocaleDateString()}</span>
                      {signal.implemented_at && (
                        <>
                          <span>•</span>
                          <span className="text-green-600 font-semibold">Implemented: {new Date(signal.implemented_at).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>

                    {/* Description */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-bold text-gray-700 mb-2">Problem Statement</h4>
                      <p className="text-sm text-gray-700 leading-relaxed">{signal.description}</p>
                    </div>

                    {/* Evidence Metrics */}
                    {signal.evidence && Object.keys(signal.evidence).length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-3">Evidence</h4>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          {Object.entries(signal.evidence).map(([key, value]) => (
                            <div key={key} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <div className="text-xs text-blue-600 font-semibold mb-1">
                                {key.replace('_', ' ').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                              </div>
                              <div className="text-2xl font-bold text-blue-700">
                                {typeof value === 'number' ? value : String(value)}
                                {key.includes('rate') ? '%' : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-green-800 mb-2 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" />
                        Recommended Actions
                      </h4>
                      <p className="text-sm text-green-900 leading-relaxed">{signal.recommendation_text}</p>
                    </div>
                  </div>
                </motion.div>
              );
              })}
              {filteredSignals.length === 0 && (
                <div className="text-center py-12">
                  <TrendingDown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No CI signals detected</p>
                  <p className="text-sm text-gray-500 mt-1">All procedures are performing well</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && selectedSignal && (
        <CISignalActionModal
          signal={selectedSignal}
          isOpen={showActionModal}
          onClose={() => setShowActionModal(false)}
          onActionComplete={handleActionComplete}
        />
      )}

      {/* Confirmation Modal */}
      {showConfirmationModal && confirmationData && (
        <CISignalConfirmationModal
          confirmationData={confirmationData}
          isOpen={showConfirmationModal}
          onConfirm={handleConfirmChanges}
          onCancel={() => setShowConfirmationModal(false)}
        />
      )}
    </div>
  );
}
