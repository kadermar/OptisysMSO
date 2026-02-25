'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle,
  ArrowRight,
  Loader2,
  FileText,
  GitCompare
} from 'lucide-react';

interface ConfirmationModalProps {
  confirmationData: {
    procedureId: string;
    currentVersion: string;
    newVersion: string;
    affectedSteps: Array<{
      stepId: string;
      stepNumber: number;
      stepName?: string;
      currentContent: string;
      proposedContent: string;
      changeReason: string;
    }>;
    estimatedImpact?: {
      expectedComplianceIncrease?: number;
      expectedIncidentReduction?: number;
    };
  };
  isOpen: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function CISignalConfirmationModal({
  confirmationData,
  isOpen,
  onConfirm,
  onCancel
}: ConfirmationModalProps) {
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Error confirming changes:', error);
    } finally {
      setConfirming(false);
    }
  };

  const getDiffHighlight = (current: string, proposed: string) => {
    // Simple diff highlighting - can be enhanced with a proper diff library
    if (current === proposed) return null;

    return {
      removed: current.split(' ').filter(word => !proposed.includes(word)),
      added: proposed.split(' ').filter(word => !current.includes(word))
    };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <GitCompare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Review Proposed Changes</h3>
                  <p className="text-xs text-white/80 flex items-center gap-2">
                    Version Transition:
                    <span className="px-2 py-0.5 bg-white/20 rounded font-semibold">
                      {confirmationData.currentVersion}
                    </span>
                    <ArrowRight className="w-3 h-3" />
                    <span className="px-2 py-0.5 bg-white/30 rounded font-semibold">
                      {confirmationData.newVersion}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={onCancel}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                disabled={confirming}
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
              {/* Summary Stats */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      {confirmationData.affectedSteps.length} step{confirmationData.affectedSteps.length !== 1 ? 's' : ''} will be modified
                    </p>
                    <p className="text-xs text-blue-700">
                      Procedure: {confirmationData.procedureId}
                    </p>
                  </div>
                  {confirmationData.estimatedImpact && (
                    <div className="flex gap-3">
                      {confirmationData.estimatedImpact.expectedComplianceIncrease !== undefined && (
                        <div className="px-3 py-2 bg-white rounded-lg border border-green-200">
                          <p className="text-xs text-gray-600">Est. Compliance</p>
                          <p className="text-lg font-bold text-green-600">
                            +{confirmationData.estimatedImpact.expectedComplianceIncrease}%
                          </p>
                        </div>
                      )}
                      {confirmationData.estimatedImpact.expectedIncidentReduction !== undefined && (
                        <div className="px-3 py-2 bg-white rounded-lg border border-blue-200">
                          <p className="text-xs text-gray-600">Est. Incident Reduction</p>
                          <p className="text-lg font-bold text-blue-600">
                            -{confirmationData.estimatedImpact.expectedIncidentReduction}%
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Step Changes */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-[#1c2b40] flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Detailed Changes
                </h4>

                {confirmationData.affectedSteps.map((step, index) => (
                  <div
                    key={step.stepId}
                    className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-blue-300 transition-colors"
                  >
                    {/* Step Header */}
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                            Step {step.stepNumber}
                          </span>
                          {step.stepName && (
                            <span className="font-semibold text-sm text-gray-900">
                              {step.stepName}
                            </span>
                          )}
                        </div>
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded">
                          {step.changeReason}
                        </span>
                      </div>
                    </div>

                    {/* Before/After Comparison */}
                    <div className="grid grid-cols-2 divide-x divide-gray-200">
                      {/* Current Content */}
                      <div className="p-4 bg-red-50/30">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <p className="text-xs font-bold text-red-900 uppercase tracking-wide">
                            Current
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-red-200 min-h-[80px]">
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {step.currentContent}
                          </p>
                        </div>
                      </div>

                      {/* Proposed Content */}
                      <div className="p-4 bg-green-50/30">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <p className="text-xs font-bold text-green-900 uppercase tracking-wide">
                            Proposed
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-green-200 min-h-[80px]">
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {step.proposedContent}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Warning Notice */}
              <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-xl p-4">
                <p className="text-sm text-amber-900">
                  <strong>Important:</strong> Once confirmed, these changes will create a new procedure version ({confirmationData.newVersion})
                  and mark the CI signal as implemented. This action cannot be undone automatically.
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirm}
                disabled={confirming}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {confirming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Applying Changes...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Apply Changes & Create Version {confirmationData.newVersion}
                  </>
                )}
              </motion.button>

              <button
                onClick={onCancel}
                disabled={confirming}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-[#1c2b40] font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Go Back
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
