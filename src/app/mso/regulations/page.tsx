'use client';

import { motion } from 'framer-motion';
import { Shield, ArrowRight, Calendar, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function MSORegulationsPage() {
  const regulations = [
    {
      id: 'REG-2024-001',
      title: 'Updated OSHA Safety Requirements',
      source: 'OSHA Standard 1910.147(c)(4)',
      effectiveDate: '2024-06-01',
      priority: 'high',
      affectedProcedures: ['MNT-202', 'MNT-205', 'INT-028'],
      status: 'pending_review'
    },
    {
      id: 'REG-2024-002',
      title: 'Environmental Reporting Standards Update',
      source: 'ISO 14001:2024',
      effectiveDate: '2024-08-15',
      priority: 'medium',
      affectedProcedures: ['OPS-004'],
      status: 'pending_review'
    }
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1c2b40] mb-2">Regulatory Updates</h1>
        <p className="text-gray-600">New and updated regulations requiring procedure changes</p>
      </div>

      <div className="space-y-6">
        {regulations.map((reg, idx) => (
          <motion.div
            key={reg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1c2b40]">{reg.title}</h3>
                  <p className="text-xs text-gray-600">{reg.id} • {reg.source}</p>
                </div>
                <span className={`ml-auto px-3 py-1 text-xs font-bold rounded ${
                  reg.priority === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {reg.priority.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="font-semibold">Effective Date:</span>
                  </div>
                  <p className="text-sm text-[#1c2b40] font-bold">
                    {new Date(reg.effectiveDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-semibold">Affected Procedures:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {reg.affectedProcedures.map(procId => (
                      <span key={procId} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                        {procId}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-4 mb-4">
                <p className="text-sm text-amber-800">
                  <strong>AI Analysis Complete:</strong> {reg.affectedProcedures.length} procedure
                  {reg.affectedProcedures.length > 1 ? 's' : ''} require updates to maintain compliance.
                  Proposed changes are ready for review.
                </p>
              </div>

              <Link
                href={`/mso/regulations/${reg.id}`}
                className="w-full px-4 py-3 bg-gradient-to-r from-[#ff0000] to-[#cc0000] text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>Review AI-Proposed Changes</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
