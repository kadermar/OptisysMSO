'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Sparkles, GitCompare } from 'lucide-react';

interface OverlapDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  newDocument: any;
  existingProcedure: string;
  onResolve: () => void;
}

export default function OverlapDetectionModal({
  isOpen,
  onClose,
  newDocument,
  existingProcedure,
  onResolve
}: OverlapDetectionModalProps) {
  const handleAcceptMerge = () => {
    // In a real implementation, this would trigger the merge
    onResolve();
  };

  const handleCreateSeparate = () => {
    // In a real implementation, this would create a separate procedure
    onResolve();
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
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Overlap Detected</h3>
                  <p className="text-xs text-white/80">Conflicts found with existing procedure</p>
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
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {/* Alert Banner */}
              <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      {newDocument.name} conflicts with {existingProcedure}
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Steps 3, 5, and 9 have conflicting instructions
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommendation Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 mb-6 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1c2b40] mb-1">AI Recommendation</p>
                    <p className="text-sm text-gray-700">
                      Consolidate with {existingProcedure} before publishing.
                      Create version 2.0 with merged steps for consistency.
                    </p>
                  </div>
                </div>
              </div>

              {/* Conflict Details */}
              <div className="space-y-3 mb-6">
                <h4 className="text-sm font-bold text-[#1c2b40] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Conflicting Steps (3)
                </h4>

                {[3, 5, 9].map((stepNum) => (
                  <div
                    key={stepNum}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-[#ff0000] text-white text-xs font-bold rounded">
                        Step {stepNum}
                      </span>
                      <span className="text-xs text-gray-500">Conflicting instructions</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Different wording detected between existing procedure and uploaded document.
                      {' '}Review recommended before consolidation.
                    </p>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAcceptMerge}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-[#ff0000] to-[#cc0000] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <GitCompare className="w-5 h-5" />
                  Accept & Consolidate
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateSeparate}
                  className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors border border-gray-200"
                >
                  Create Separate
                </motion.button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">
                ℹ️ In a real deployment, this requires a data engineering assessment to clean and consolidate the knowledge base.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
