'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingDown,
  X,
  CheckCircle,
  Play,
  XCircle,
  Edit,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertOctagon,
  AlertCircle,
  Info
} from 'lucide-react';

interface CISignalActionModalProps {
  signal: {
    signal_id: string;
    procedure_id: string;
    title: string;
    description: string;
    recommendation_text: string;
    suggested_change?: string;
    status: string;
    evidence: {
      skip_rate?: number;
      compliance_rate?: number;
      incident_rate?: number;
      rework_rate?: number;
      avg_quality_score?: number;
      avg_duration?: number;
      sample_size?: number;
    };
  };
  isOpen: boolean;
  onClose: () => void;
  onActionComplete?: (action: string, data?: any) => void;
}

interface ActionableItem {
  id: string;
  action: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export default function CISignalActionModal({ signal, isOpen, onClose, onActionComplete }: CISignalActionModalProps) {
  const [actionableItems, setActionableItems] = useState<ActionableItem[]>([]);
  const [suggestedStepChanges, setSuggestedStepChanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Parse recommendations when modal opens
      parseRecommendations();
    }
  }, [isOpen]);

  const parseRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/parse-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendationText: signal.recommendation_text,
          suggestedChange: signal.suggested_change,
          procedureId: signal.procedure_id,
          evidence: signal.evidence
        })
      });

      if (!response.ok) {
        throw new Error('Failed to parse recommendations');
      }

      const data = await response.json();
      setActionableItems(data.actionableItems || []);
      setSuggestedStepChanges(data.suggestedStepChanges || []);

      // Cache parsed recommendations in database for editor to use
      try {
        await fetch(`/api/ci-signals/${encodeURIComponent(signal.signal_id)}/cache`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parsedData: {
              actionableItems: data.actionableItems || [],
              suggestedStepChanges: data.suggestedStepChanges || [],
              confidence: data.confidence || 0
            }
          })
        });
      } catch (cacheErr) {
        console.warn('Failed to cache recommendations:', cacheErr);
        // Don't fail the whole operation if caching fails
      }
    } catch (err: any) {
      console.error('Error parsing recommendations:', err);
      setError(err.message);
      // Fallback: Create basic items from raw text
      setActionableItems([{
        id: '1',
        action: signal.recommendation_text,
        description: signal.suggested_change || '',
        priority: 'high'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setProcessingAction('accept');

    try {
      const response = await fetch(`/api/ci-signals/${encodeURIComponent(signal.signal_id)}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          userId: 'MSO-001', // TODO: Get from session
          parsedRecommendations: actionableItems,
          suggestedChanges: suggestedStepChanges // ← Send the actual improved content!
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process acceptance');
      }

      const data = await response.json();

      if (data.requiresConfirmation) {
        // Pass confirmation data to parent
        onActionComplete?.('accept', data);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setProcessingAction('reject');

    try {
      const response = await fetch(`/api/ci-signals/${encodeURIComponent(signal.signal_id)}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          userId: 'MSO-001', // TODO: Get from session
          reason: rejectReason
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reject signal');
      }

      onActionComplete?.('reject');
      onClose();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setProcessingAction(null);
      setShowRejectDialog(false);
    }
  };

  const handleReview = async () => {
    setProcessingAction('review');

    try {
      const response = await fetch(`/api/ci-signals/${encodeURIComponent(signal.signal_id)}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review',
          userId: 'MSO-001' // TODO: Get from session
        })
      });

      if (!response.ok) {
        throw new Error('Failed to mark for review');
      }

      const data = await response.json();
      onActionComplete?.('review', data);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleManualEdit = () => {
    window.location.href = `/procedures?selected=${signal.procedure_id}&mode=edit&signal=${signal.signal_id}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertOctagon className="w-3 h-3" />;
      case 'medium': return <AlertCircle className="w-3 h-3" />;
      case 'low': return <Info className="w-3 h-3" />;
      default: return <Info className="w-3 h-3" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Address CI Signal {signal.signal_id}</h3>
                  <p className="text-xs text-white/80">
                    {signal.title}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[65vh] space-y-6">
              {/* Problem Statement */}
              <div className="bg-red-50 border-l-4 border-red-500 rounded-r-xl p-4">
                <h4 className="text-sm font-bold text-red-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Problem Identified
                </h4>
                <p className="text-sm text-red-800">{signal.description}</p>
              </div>

              {/* Evidence Metrics Grid */}
              {signal.evidence && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {signal.evidence.skip_rate !== undefined && (
                    <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-xl p-3 border border-red-200">
                      <p className="text-xs text-red-600 font-semibold mb-1">Skip Rate</p>
                      <p className="text-2xl font-bold text-red-900">{signal.evidence.skip_rate}%</p>
                    </div>
                  )}
                  {signal.evidence.compliance_rate !== undefined && (
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-xl p-3 border border-yellow-200">
                      <p className="text-xs text-yellow-600 font-semibold mb-1">Compliance</p>
                      <p className="text-2xl font-bold text-yellow-900">{signal.evidence.compliance_rate}%</p>
                    </div>
                  )}
                  {signal.evidence.incident_rate !== undefined && (
                    <div className="bg-gradient-to-br from-orange-50 to-red-100 rounded-xl p-3 border border-orange-200">
                      <p className="text-xs text-orange-600 font-semibold mb-1">Incidents</p>
                      <p className="text-2xl font-bold text-orange-900">{signal.evidence.incident_rate}%</p>
                    </div>
                  )}
                  {signal.evidence.avg_quality_score !== undefined && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-3 border border-blue-200">
                      <p className="text-xs text-blue-600 font-semibold mb-1">Quality Score</p>
                      <p className="text-2xl font-bold text-blue-900">{signal.evidence.avg_quality_score}/10</p>
                    </div>
                  )}
                  {signal.evidence.rework_rate !== undefined && (
                    <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-3 border border-purple-200">
                      <p className="text-xs text-purple-600 font-semibold mb-1">Rework Rate</p>
                      <p className="text-2xl font-bold text-purple-900">{signal.evidence.rework_rate}%</p>
                    </div>
                  )}
                  {signal.evidence.avg_duration !== undefined && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-3 border border-green-200">
                      <p className="text-xs text-green-600 font-semibold mb-1">Avg Duration</p>
                      <p className="text-2xl font-bold text-green-900">{signal.evidence.avg_duration}m</p>
                    </div>
                  )}
                </div>
              )}

              {/* AI-Parsed Recommendations */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                    {loading ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-green-900 mb-1 flex items-center gap-2">
                      AI-Parsed Recommendations
                      {error && <span className="text-xs text-red-600">(Fallback to raw text)</span>}
                    </h4>
                    <p className="text-xs text-green-700">
                      {loading ? 'Analyzing recommendations...' : `${actionableItems.length} actionable item${actionableItems.length !== 1 ? 's' : ''} identified`}
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {suggestedStepChanges.length > 0 ? (
                      // Show improved step content (before/after)
                      suggestedStepChanges.map((change, index) => (
                        <div
                          key={change.stepId || index}
                          className="bg-white rounded-lg p-4 border border-green-200"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                            <p className="font-semibold text-sm text-gray-900">
                              Step {change.stepNumber}: Improved Content
                            </p>
                          </div>

                          {/* Before */}
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-gray-500 mb-1">Current:</p>
                            <div className="bg-red-50 border border-red-200 rounded p-2">
                              <p className="text-xs text-gray-700">{change.currentContent}</p>
                            </div>
                          </div>

                          {/* After */}
                          <div className="mb-2">
                            <p className="text-xs font-semibold text-green-700 mb-1">Improved:</p>
                            <div className="bg-green-50 border border-green-300 rounded p-2">
                              <p className="text-xs text-gray-900 font-medium">{change.suggestedContent}</p>
                            </div>
                          </div>

                          {/* Reason */}
                          {change.reason && (
                            <div className="pt-2 border-t border-gray-100">
                              <p className="text-xs text-gray-600 italic">
                                💡 {change.reason}
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      // Fallback to action items if no step changes
                      actionableItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="bg-white/60 rounded-lg p-3 border border-green-200 hover:bg-white/80 transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-sm text-gray-900">{item.action}</p>
                                <span className={`px-2 py-0.5 rounded-md text-xs font-bold border inline-flex items-center gap-1 ${getPriorityColor(item.priority)}`}>
                                  {getPriorityIcon(item.priority)}
                                  {item.priority}
                                </span>
                              </div>
                              {item.description && (
                                <p className="text-xs text-gray-600">{item.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Suggested Change (if available) */}
              {signal.suggested_change && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <h4 className="text-sm font-bold text-blue-900 mb-2">Suggested Change:</h4>
                  <p className="text-sm text-blue-800">{signal.suggested_change}</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {!showRejectDialog ? (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col gap-3">
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAccept}
                    disabled={loading || processingAction !== null}
                    className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingAction === 'accept' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Accept & Preview Changes
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleReview}
                    disabled={loading || processingAction !== null}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingAction === 'review' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Edit className="w-5 h-5" />
                        Review in Editor
                      </>
                    )}
                  </motion.button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRejectDialog(true)}
                    disabled={loading || processingAction !== null}
                    className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="w-4 h-4" />
                    Mark as Not Applicable
                  </button>

                  <button
                    onClick={handleManualEdit}
                    disabled={loading || processingAction !== null}
                    className="px-6 py-2.5 text-[#1c2b40] hover:text-[#ff0000] font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Manual Edit
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reason for rejection:
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Explain why this recommendation is not applicable..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleReject}
                    disabled={processingAction !== null}
                    className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingAction === 'reject' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Confirm Rejection
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectDialog(false);
                      setRejectReason('');
                    }}
                    disabled={processingAction !== null}
                    className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
