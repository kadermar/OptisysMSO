'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowRight, CheckCircle2, XCircle, Clock, BarChart3, AlertTriangle } from 'lucide-react';

interface VersionComparisonTableProps {
  procedureId: string;
  beforeVersion: string;
  afterVersion: string;
  startDate?: string;
  endDate?: string;
}

interface ComparisonMetrics {
  complianceRate: { before: number; after: number };
  skipRate: { before: number; after: number };
  avgDuration: { before: number; after: number };
  qualityScore: { before: number; after: number };
  incidents: { before: number; after: number };
}

export default function VersionComparisonTable({
  procedureId,
  beforeVersion,
  afterVersion,
  startDate,
  endDate
}: VersionComparisonTableProps) {
  const [metrics, setMetrics] = useState<ComparisonMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComparisonMetrics();
  }, [procedureId, beforeVersion, afterVersion]);

  const fetchComparisonMetrics = async () => {
    try {
      const params = new URLSearchParams({
        before: beforeVersion,
        after: afterVersion
      });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/procedures/${procedureId}/compare?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching comparison metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDelta = (before: number, after: number, lowerIsBetter: boolean = false) => {
    const delta = after - before;
    const isImprovement = lowerIsBetter ? delta < 0 : delta > 0;
    return {
      value: Math.abs(delta),
      isImprovement,
      percentage: before > 0 ? (Math.abs(delta) / before) * 100 : 0
    };
  };

  const DeltaBadge = ({ delta, unit = '%' }: { delta: ReturnType<typeof calculateDelta>; unit?: string }) => (
    <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-sm ${
      delta.isImprovement
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800'
    }`}>
      {delta.isImprovement ? (
        <TrendingUp className="w-4 h-4" />
      ) : (
        <TrendingDown className="w-4 h-4" />
      )}
      {delta.value.toFixed(1)}{unit}
      <span className="text-xs opacity-70">
        ({delta.percentage.toFixed(0)}%)
      </span>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff0000]"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-xl p-5">
        <p className="text-sm text-amber-800">
          No comparison data available for versions {beforeVersion} and {afterVersion}
        </p>
      </div>
    );
  }

  const complianceDelta = calculateDelta(metrics.complianceRate.before, metrics.complianceRate.after);
  const skipDelta = calculateDelta(metrics.skipRate.before, metrics.skipRate.after, true);
  const durationDelta = calculateDelta(metrics.avgDuration.before, metrics.avgDuration.after, true);
  const qualityDelta = calculateDelta(metrics.qualityScore.before, metrics.qualityScore.after);
  const incidentsDelta = calculateDelta(metrics.incidents.before, metrics.incidents.after, true);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Version Impact Analysis</h3>
            <p className="text-sm text-white/80">
              Comparing v{beforeVersion} → v{afterVersion}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Table */}
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-600">Metric</th>
                <th className="text-center py-3 px-4 text-sm font-bold text-red-700">
                  Before (v{beforeVersion})
                </th>
                <th className="text-center py-3 px-4 text-sm font-bold text-green-700">
                  After (v{afterVersion})
                </th>
                <th className="text-center py-3 px-4 text-sm font-bold text-gray-600">Change</th>
              </tr>
            </thead>
            <tbody>
              {/* Compliance Rate */}
              <motion.tr
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-[#1c2b40]">Compliance Rate</span>
                  </div>
                </td>
                <td className="text-center py-4 px-4">
                  <span className="px-4 py-2 bg-red-100 text-red-800 font-bold rounded-lg">
                    {metrics.complianceRate.before.toFixed(1)}%
                  </span>
                </td>
                <td className="text-center py-4 px-4">
                  <span className="px-4 py-2 bg-green-100 text-green-800 font-bold rounded-lg">
                    {metrics.complianceRate.after.toFixed(1)}%
                  </span>
                </td>
                <td className="text-center py-4 px-4">
                  <DeltaBadge delta={complianceDelta} />
                </td>
              </motion.tr>

              {/* Skip Rate */}
              <motion.tr
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-amber-600" />
                    <span className="font-semibold text-[#1c2b40]">Skip Rate</span>
                  </div>
                </td>
                <td className="text-center py-4 px-4">
                  <span className="px-4 py-2 bg-red-100 text-red-800 font-bold rounded-lg">
                    {metrics.skipRate.before.toFixed(1)}%
                  </span>
                </td>
                <td className="text-center py-4 px-4">
                  <span className="px-4 py-2 bg-green-100 text-green-800 font-bold rounded-lg">
                    {metrics.skipRate.after.toFixed(1)}%
                  </span>
                </td>
                <td className="text-center py-4 px-4">
                  <DeltaBadge delta={skipDelta} />
                </td>
              </motion.tr>

              {/* Average Duration */}
              <motion.tr
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-[#1c2b40]">Avg Duration</span>
                  </div>
                </td>
                <td className="text-center py-4 px-4">
                  <span className="px-4 py-2 bg-red-100 text-red-800 font-bold rounded-lg">
                    {metrics.avgDuration.before.toFixed(0)} min
                  </span>
                </td>
                <td className="text-center py-4 px-4">
                  <span className="px-4 py-2 bg-green-100 text-green-800 font-bold rounded-lg">
                    {metrics.avgDuration.after.toFixed(0)} min
                  </span>
                </td>
                <td className="text-center py-4 px-4">
                  <DeltaBadge delta={durationDelta} unit=" min" />
                </td>
              </motion.tr>

              {/* Quality Score */}
              <motion.tr
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    <span className="font-semibold text-[#1c2b40]">Quality Score</span>
                  </div>
                </td>
                <td className="text-center py-4 px-4">
                  <span className="px-4 py-2 bg-red-100 text-red-800 font-bold rounded-lg">
                    {metrics.qualityScore.before.toFixed(1)}
                  </span>
                </td>
                <td className="text-center py-4 px-4">
                  <span className="px-4 py-2 bg-green-100 text-green-800 font-bold rounded-lg">
                    {metrics.qualityScore.after.toFixed(1)}
                  </span>
                </td>
                <td className="text-center py-4 px-4">
                  <DeltaBadge delta={qualityDelta} unit=" pts" />
                </td>
              </motion.tr>

              {/* Incidents */}
              <motion.tr
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-[#1c2b40]">Incidents</span>
                  </div>
                </td>
                <td className="text-center py-4 px-4">
                  <span className="px-4 py-2 bg-red-100 text-red-800 font-bold rounded-lg">
                    {metrics.incidents.before}
                  </span>
                </td>
                <td className="text-center py-4 px-4">
                  <span className="px-4 py-2 bg-green-100 text-green-800 font-bold rounded-lg">
                    {metrics.incidents.after}
                  </span>
                </td>
                <td className="text-center py-4 px-4">
                  <DeltaBadge delta={incidentsDelta} unit="" />
                </td>
              </motion.tr>
            </tbody>
          </table>
        </div>

        {/* Visual Progress Bars */}
        <div className="mt-8 space-y-4">
          <h4 className="text-sm font-bold text-gray-700 mb-4">Visual Improvement Summary</h4>

          {/* Compliance Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600">Compliance Rate</span>
              <span className="text-xs text-gray-500">
                {metrics.complianceRate.before.toFixed(0)}% → {metrics.complianceRate.after.toFixed(0)}%
              </span>
            </div>
            <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metrics.complianceRate.after}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-emerald-500"
              />
              <div
                className="absolute top-0 left-0 h-full border-r-2 border-red-400"
                style={{ width: `${metrics.complianceRate.before}%` }}
              />
            </div>
          </div>

          {/* Skip Rate Progress (inverse) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600">Skip Rate (Lower is Better)</span>
              <span className="text-xs text-gray-500">
                {metrics.skipRate.before.toFixed(0)}% → {metrics.skipRate.after.toFixed(0)}%
              </span>
            </div>
            <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-red-200"
                style={{ width: `${metrics.skipRate.before}%` }}
              />
              <motion.div
                initial={{ width: `${metrics.skipRate.before}%` }}
                animate={{ width: `${metrics.skipRate.after}%` }}
                transition={{ duration: 1, delay: 0.4 }}
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-green-900 mb-2">Impact Summary</h4>
              <p className="text-sm text-green-800">
                Version {afterVersion} shows measurable improvement across all key metrics.
                {complianceDelta.isImprovement && ` Compliance increased by ${complianceDelta.value.toFixed(1)}%.`}
                {skipDelta.isImprovement && ` Skip rate decreased by ${skipDelta.value.toFixed(1)}%.`}
                {' '}This validates the effectiveness of the continuous improvement loop.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
