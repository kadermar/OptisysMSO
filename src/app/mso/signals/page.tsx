'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, ArrowRight, Filter, Search, ChevronDown, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Helper to generate signal ID
const generateSignalId = (proc: any, index: number) => {
  return `#${String(index + 1).padStart(4, '0')}`;
};

// Helper to determine severity
const getSeverity = (proc: any) => {
  if (proc.compliance_rate < 70 || proc.incident_rate > 10) return 'critical';
  if (proc.compliance_rate < 80 || proc.incident_rate > 5 || proc.rework_rate > 20) return 'high';
  if (proc.rework_rate > 15 || proc.avg_quality_score < 70) return 'medium';
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
  if (proc.avg_quality_score < 75) {
    issues.push(`Below-target quality score (${proc.avg_quality_score}) indicates process effectiveness concerns`);
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
  if (proc.avg_quality_score < 75) {
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
  const [procedures, setProcedures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    fetchProcedures();
  }, []);

  const fetchProcedures = async () => {
    try {
      const response = await fetch('/api/dashboard/procedures');
      if (response.ok) {
        setProcedures(await response.json());
      }
    } catch (error) {
      console.error('Error fetching procedures:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(procedures.map(p => p.category).filter(Boolean));
    return Array.from(cats);
  }, [procedures]);

  const ciSignalProcedures = useMemo(() => {
    return procedures.filter(p => p.has_open_signals).filter(p => {
      const matchesSearch = !searchQuery ||
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.procedure_id?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [procedures, searchQuery, categoryFilter]);

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
                  {ciSignalProcedures.length} procedure{ciSignalProcedures.length !== 1 ? 's' : ''} flagged for improvement
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {ciSignalProcedures.filter(p => p.compliance_rate < 80).length}
                  </div>
                  <div className="text-xs text-gray-600">Low Compliance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {ciSignalProcedures.filter(p => p.incident_rate > 5).length}
                  </div>
                  <div className="text-xs text-gray-600">High Incidents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {ciSignalProcedures.filter(p => p.rework_rate > 15).length}
                  </div>
                  <div className="text-xs text-gray-600">High Rework</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {ciSignalProcedures.filter(p => p.avg_quality_score < 75).length}
                  </div>
                  <div className="text-xs text-gray-600">Low Quality</div>
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

              {categories.length > 0 && (
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff0000] focus:ring-2 focus:ring-red-100 appearance-none bg-white"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              )}
            </div>
          </div>

          {/* CI Signals List */}
          <div className="p-6">
            <div className="space-y-4">
              {ciSignalProcedures.map((proc, idx) => {
                const signalId = generateSignalId(proc, idx);
                const severity = getSeverity(proc);
                const severityColor = getSeverityColor(severity);
                const { description, recommendation } = getRecommendation(proc);

                return (
                <motion.div
                  key={proc.procedure_id}
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
                          <AlertTriangle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-bold text-lg">CI Signal {signalId}</h3>
                            <span className="px-2 py-0.5 bg-white/30 backdrop-blur-sm text-white text-xs font-bold rounded uppercase">
                              {severity}
                            </span>
                          </div>
                          <p className="text-white/90 text-sm mt-0.5">{proc.name}</p>
                        </div>
                      </div>
                      <Link
                        href={`/mso/procedures/${proc.procedure_id}?signal=${signalId}&recommendation=${encodeURIComponent(recommendation)}`}
                        className="px-4 py-2 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <span>Address</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Signal Body */}
                  <div className="p-6 space-y-4">
                    {/* Procedure Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="font-semibold text-[#1c2b40]">{proc.procedure_id}</span>
                      <span>•</span>
                      <span>{proc.category}</span>
                      <span>•</span>
                      <span>v{proc.current_version || '1.0'}</span>
                      <span>•</span>
                      <span>{proc.total_steps || 0} steps</span>
                    </div>

                    {/* Description */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-bold text-gray-700 mb-2">Problem Statement</h4>
                      <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
                    </div>

                    {/* Evidence Metrics */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 mb-3">Evidence</h4>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {proc.compliance_rate < 80 && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="text-xs text-red-600 font-semibold mb-1">Compliance Rate</div>
                            <div className="text-2xl font-bold text-red-700">{proc.compliance_rate}%</div>
                            <div className="text-xs text-red-600 mt-1">Target: ≥80%</div>
                          </div>
                        )}
                        {proc.incident_rate > 5 && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <div className="text-xs text-orange-600 font-semibold mb-1">Incident Rate</div>
                            <div className="text-2xl font-bold text-orange-700">{proc.incident_rate}%</div>
                            <div className="text-xs text-orange-600 mt-1">Target: ≤5%</div>
                          </div>
                        )}
                        {proc.rework_rate > 15 && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="text-xs text-yellow-600 font-semibold mb-1">Rework Rate</div>
                            <div className="text-2xl font-bold text-yellow-700">{proc.rework_rate}%</div>
                            <div className="text-xs text-yellow-600 mt-1">Target: ≤15%</div>
                          </div>
                        )}
                        {proc.avg_quality_score < 75 && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <div className="text-xs text-purple-600 font-semibold mb-1">Quality Score</div>
                            <div className="text-2xl font-bold text-purple-700">{proc.avg_quality_score}</div>
                            <div className="text-xs text-purple-600 mt-1">Target: ≥75</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-green-800 mb-2 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" />
                        Recommended Actions
                      </h4>
                      <p className="text-sm text-green-900 leading-relaxed">{recommendation}</p>
                    </div>
                  </div>
                </motion.div>
              );
              })}
              {ciSignalProcedures.length === 0 && (
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
    </div>
  );
}
