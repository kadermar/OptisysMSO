'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Calendar, CheckCircle, AlertCircle, Tag, ArrowRight } from 'lucide-react';

interface MetricsComparisonProps {
  procedureId: string;
  signalId: string;
}

interface ImpactMetrics {
  signal_id: string;
  procedure_id: string;
  status: string;
  implemented_at: string;
  implemented_in_version: string;
  before_version: string;
  before_metrics: {
    compliance_rate: number;
    incident_rate: number;
    avg_quality_score: number;
    rework_rate: number;
    avg_duration_minutes: number;
    sample_size: number;
  };
  after_metrics: {
    compliance_rate: number;
    incident_rate: number;
    avg_quality_score: number;
    rework_rate: number;
    avg_duration_minutes: number;
    sample_size: number;
  };
  deltas: {
    compliance_rate: number;
    incident_rate: number;
    avg_quality_score: number;
    rework_rate: number;
    avg_duration_minutes: number;
  };
  analysis_period_days: number;
}

export default function CISignalMetricsComparison({ procedureId, signalId }: MetricsComparisonProps) {
  const [metrics, setMetrics] = useState<ImpactMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchImpactMetrics();
  }, [signalId]);

  const fetchImpactMetrics = async () => {
    try {
      const response = await fetch(`/api/ci-signals/${encodeURIComponent(signalId)}/impact`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      } else {
        setError('Unable to load impact metrics');
      }
    } catch (err) {
      console.error('Error fetching impact metrics:', err);
      setError('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const getImprovementColor = (delta: number, metric: string) => {
    // For incident_rate and rework_rate, positive delta = improvement (reduction)
    // For compliance and quality, positive delta = improvement (increase)
    const isImprovement = (metric === 'incident_rate' || metric === 'rework_rate')
      ? delta > 0  // Positive means reduced incidents/rework
      : delta > 0; // Positive means increased compliance/quality

    return isImprovement ? 'text-green-600' : 'text-red-600';
  };

  const getImprovementBgColor = (delta: number, metric: string) => {
    const isImprovement = (metric === 'incident_rate' || metric === 'rework_rate')
      ? delta > 0
      : delta > 0;

    return isImprovement ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  };

  const getImprovementIcon = (delta: number, metric: string) => {
    const isImprovement = (metric === 'incident_rate' || metric === 'rework_rate')
      ? delta > 0
      : delta > 0;

    return isImprovement ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  const formatDelta = (delta: number, metric: string) => {
    // For incident_rate and rework_rate, show reduction as positive
    const displayDelta = (metric === 'incident_rate' || metric === 'rework_rate')
      ? delta  // Already calculated as reduction
      : delta;

    const sign = displayDelta > 0 ? '+' : '';
    return `${sign}${displayDelta.toFixed(1)}${metric.includes('score') ? '' : '%'}`;
  };

  if (loading) {
    return (
      <div className="mt-4 border-t pt-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="mt-4 border-t pt-4">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error || 'Impact metrics not available'}</span>
        </div>
      </div>
    );
  }

  const { before_metrics, after_metrics, deltas, before_version, implemented_in_version, implemented_at, analysis_period_days } = metrics;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.3 }}
      className="mt-4 border-t pt-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Performance Impact
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Based on {before_metrics.sample_size + after_metrics.sample_size} work orders over {analysis_period_days} days
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded-md border border-gray-300 inline-flex items-center gap-1">
            <Tag className="w-3 h-3" />
            v{before_version}
          </span>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <span className="px-2 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs font-mono rounded-md border border-green-300 inline-flex items-center gap-1 font-bold shadow-sm">
            <Tag className="w-3 h-3" />
            v{implemented_in_version}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Compliance Rate */}
        <div className={`rounded-lg p-3 border transition-all ${getImprovementBgColor(deltas.compliance_rate, 'compliance_rate')}`}>
          <div className="text-xs font-semibold text-gray-600 mb-2">Compliance Rate</div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-lg font-bold text-gray-700">{after_metrics.compliance_rate.toFixed(1)}%</span>
            <span className="text-xs text-gray-500">was {before_metrics.compliance_rate.toFixed(1)}%</span>
          </div>
          <div className={`flex items-center gap-1 text-xs font-bold ${getImprovementColor(deltas.compliance_rate, 'compliance_rate')}`}>
            {getImprovementIcon(deltas.compliance_rate, 'compliance_rate')}
            <span>{formatDelta(deltas.compliance_rate, 'compliance_rate')}</span>
          </div>
          {/* Progress Bar */}
          <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden mt-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${after_metrics.compliance_rate}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`absolute h-full rounded-full ${deltas.compliance_rate > 0 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'}`}
            />
          </div>
        </div>

        {/* Incident Rate */}
        <div className={`rounded-lg p-3 border transition-all ${getImprovementBgColor(deltas.incident_rate, 'incident_rate')}`}>
          <div className="text-xs font-semibold text-gray-600 mb-2">Incident Rate</div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-lg font-bold text-gray-700">{after_metrics.incident_rate.toFixed(1)}%</span>
            <span className="text-xs text-gray-500">was {before_metrics.incident_rate.toFixed(1)}%</span>
          </div>
          <div className={`flex items-center gap-1 text-xs font-bold ${getImprovementColor(deltas.incident_rate, 'incident_rate')}`}>
            {getImprovementIcon(deltas.incident_rate, 'incident_rate')}
            <span>{formatDelta(deltas.incident_rate, 'incident_rate')}</span>
          </div>
          {/* Progress Bar (inverted - lower is better) */}
          <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden mt-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(after_metrics.incident_rate, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`absolute h-full rounded-full ${deltas.incident_rate > 0 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-orange-500 to-red-600'}`}
            />
          </div>
        </div>

        {/* Quality Score */}
        <div className={`rounded-lg p-3 border transition-all ${getImprovementBgColor(deltas.avg_quality_score, 'avg_quality_score')}`}>
          <div className="text-xs font-semibold text-gray-600 mb-2">Quality Score</div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-lg font-bold text-gray-700">{after_metrics.avg_quality_score.toFixed(1)}</span>
            <span className="text-xs text-gray-500">was {before_metrics.avg_quality_score.toFixed(1)}</span>
          </div>
          <div className={`flex items-center gap-1 text-xs font-bold ${getImprovementColor(deltas.avg_quality_score, 'avg_quality_score')}`}>
            {getImprovementIcon(deltas.avg_quality_score, 'avg_quality_score')}
            <span>{formatDelta(deltas.avg_quality_score, 'avg_quality_score')}</span>
          </div>
          {/* Progress Bar */}
          <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden mt-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(after_metrics.avg_quality_score / 10) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`absolute h-full rounded-full ${deltas.avg_quality_score > 0 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'}`}
            />
          </div>
        </div>

        {/* Rework Rate */}
        <div className={`rounded-lg p-3 border transition-all ${getImprovementBgColor(deltas.rework_rate, 'rework_rate')}`}>
          <div className="text-xs font-semibold text-gray-600 mb-2">Rework Rate</div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-lg font-bold text-gray-700">{after_metrics.rework_rate.toFixed(1)}%</span>
            <span className="text-xs text-gray-500">was {before_metrics.rework_rate.toFixed(1)}%</span>
          </div>
          <div className={`flex items-center gap-1 text-xs font-bold ${getImprovementColor(deltas.rework_rate, 'rework_rate')}`}>
            {getImprovementIcon(deltas.rework_rate, 'rework_rate')}
            <span>{formatDelta(deltas.rework_rate, 'rework_rate')}</span>
          </div>
          {/* Progress Bar (inverted - lower is better) */}
          <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden mt-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(after_metrics.rework_rate, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`absolute h-full rounded-full ${deltas.rework_rate > 0 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-yellow-500 to-orange-600'}`}
            />
          </div>
        </div>
      </div>

      {/* Implementation Date */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
        <Calendar className="w-3 h-3" />
        <span>Implemented on {new Date(implemented_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
      </div>
    </motion.div>
  );
}
