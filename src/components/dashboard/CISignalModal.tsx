'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { TrendingDown, X, Edit, Check } from 'lucide-react';

interface CISignalModalProps {
  signal: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function CISignalModal({ signal, isOpen, onClose }: CISignalModalProps) {
  const openEditMode = () => {
    window.location.href = `/procedures?selected=${signal.procedure_id}&mode=edit`;
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
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">CI Signal {signal.signal_id}</h3>
                  <p className="text-xs text-white/80">
                    Generated: {new Date(signal.detected_at).toLocaleString()}
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
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
              {/* Problem Statement */}
              <div className="bg-red-50 border-l-4 border-red-500 rounded-r-xl p-4">
                <h4 className="text-sm font-bold text-red-900 mb-2">Problem Identified</h4>
                <p className="text-sm text-red-800">{signal.description}</p>
              </div>

              {/* Metrics Grid */}
              {signal.evidence && (
                <div className="grid grid-cols-3 gap-4">
                  {signal.evidence.skip_rate !== undefined && (
                    <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-xl p-4 border border-red-200">
                      <p className="text-xs text-red-600 font-semibold mb-1">Skip Rate</p>
                      <p className="text-2xl font-bold text-red-900">{signal.evidence.skip_rate}%</p>
                      <p className="text-xs text-red-600 mt-1">Current rate</p>
                    </div>
                  )}
                  {signal.evidence.compliance_rate !== undefined && (
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-xl p-4 border border-yellow-200">
                      <p className="text-xs text-yellow-600 font-semibold mb-1">Compliance</p>
                      <p className="text-2xl font-bold text-yellow-900">{signal.evidence.compliance_rate}%</p>
                      <p className="text-xs text-yellow-600 mt-1">Compliance rate</p>
                    </div>
                  )}
                  {signal.evidence.avg_duration !== undefined && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 border border-blue-200">
                      <p className="text-xs text-blue-600 font-semibold mb-1">Duration</p>
                      <p className="text-2xl font-bold text-blue-900">{signal.evidence.avg_duration}m</p>
                      <p className="text-xs text-blue-600 mt-1">Avg time</p>
                    </div>
                  )}
                </div>
              )}

              {/* Procedure & Step Info */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h4 className="text-sm font-bold text-[#1c2b40] mb-3">Affected Procedure</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Procedure:</span>
                    <span className="font-semibold text-[#1c2b40]">{signal.procedure_id}</span>
                  </div>
                  {signal.step_number && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Step:</span>
                      <span className="font-semibold text-[#1c2b40]">Step {signal.step_number}</span>
                    </div>
                  )}
                  {signal.sample_size && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Sample Size:</span>
                      <span className="font-semibold text-[#1c2b40]">{signal.sample_size} work orders</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Recommended Action */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-green-900 mb-1">Recommended Action</h4>
                    <p className="text-sm text-green-800">{signal.recommendation_text}</p>
                  </div>
                </div>
                {signal.suggested_change && (
                  <div className="bg-white/60 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Suggested Change:</p>
                    <p className="text-xs text-gray-700">{signal.suggested_change}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openEditMode}
                className="flex-1 py-3 bg-gradient-to-r from-[#ff0000] to-[#cc0000] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Edit className="w-5 h-5" />
                Open Procedure Edit Mode
              </motion.button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-[#1c2b40] font-semibold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
