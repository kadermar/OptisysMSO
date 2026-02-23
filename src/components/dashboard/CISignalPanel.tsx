'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, FileText, Target, ExternalLink, CheckCircle } from 'lucide-react';
import CISignalModal from './CISignalModal';

export default function CISignalPanel() {
  const [ciSignals, setCiSignals] = useState<any[]>([]);
  const [selectedSignal, setSelectedSignal] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCISignals();
  }, []);

  const fetchCISignals = async () => {
    try {
      const response = await fetch('/api/ci-signals');
      if (response.ok) {
        const data = await response.json();
        setCiSignals(data);
      }
    } catch (error) {
      console.error('Error fetching CI signals:', error);
    } finally {
      setLoading(false);
    }
  };

  const openSignalDetail = (signal: any) => {
    setSelectedSignal(signal);
    setShowModal(true);
  };

  const openProcedure = (procedureId: string) => {
    window.location.href = `/procedures?selected=${procedureId}`;
  };

  return (
    <>
      <motion.section
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
            <div>
              <h3 className="font-bold text-[#1c2b40]">CI Signals</h3>
              <p className="text-xs text-gray-500">Continuous improvement opportunities</p>
            </div>
          </div>
        </div>

        {/* Signal List */}
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff0000]"></div>
              <p className="text-sm text-gray-500 mt-2">Loading signals...</p>
            </div>
          ) : ciSignals.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No active CI signals</p>
            </div>
          ) : (
            ciSignals.map((signal) => (
              <motion.div
                key={signal.signal_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => openSignalDetail(signal)}
                className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border-l-4 border-amber-500 cursor-pointer hover:shadow-md transition-all"
              >
                {/* Signal Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded">
                      {signal.signal_id}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(signal.detected_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    signal.severity === 'critical' ? 'bg-red-100 text-red-700' :
                    signal.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                    signal.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {signal.severity?.toUpperCase()}
                  </span>
                </div>

                {/* Procedure Reference */}
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-[#1c2b40]">
                    {signal.procedure_id}
                    {signal.step_number && ` | Step ${signal.step_number}`}
                  </span>
                </div>

                {/* Issue Description */}
                <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                  {signal.title}
                </p>

                {/* Metrics */}
                {signal.evidence && (
                  <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <TrendingDown className="w-3 h-3 text-red-600" />
                      <span>
                        {signal.evidence.skip_rate ? `${signal.evidence.skip_rate}% skip rate` :
                         signal.evidence.compliance_rate ? `${signal.evidence.compliance_rate}% compliance` :
                         'Performance issue'}
                      </span>
                    </div>
                    {signal.estimated_impact_score && (
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3 text-blue-600" />
                        <span>Impact: {signal.estimated_impact_score}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Required */}
                <div className="bg-white/80 backdrop-blur rounded-lg p-2 border border-amber-200">
                  <p className="text-xs font-bold text-amber-900 mb-1">Recommended Action:</p>
                  <p className="text-xs text-gray-700 line-clamp-2">{signal.recommendation_text}</p>
                </div>

                {/* Footer */}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {signal.status === 'implemented' ? 'Implemented' : 'Open'}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openProcedure(signal.procedure_id);
                    }}
                    className="px-3 py-1 bg-[#ff0000] hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                  >
                    Open Procedure
                    <ExternalLink className="w-3 h-3" />
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.section>

      {/* CI Signal Modal */}
      {selectedSignal && (
        <CISignalModal
          signal={selectedSignal}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
