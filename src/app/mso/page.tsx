'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  FileText,
  TrendingDown,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Shield,
  LayoutDashboard,
  ClipboardCheck,
  BarChart3,
  TrendingUp,
  TrendingDownIcon,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { PredictiveAnalytics } from '@/components/dashboard/PredictiveAnalytics';
import { CorrelationScatterPlot } from '@/components/compliance/CorrelationScatterPlot';

interface PendingItem {
  id: string;
  type: 'ci_signal' | 'regulation' | 'review' | 'approval';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  procedureId?: string;
  createdAt: string;
  dueDate?: string;
}

export default function MSODashboard() {
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState({
    workOrders: 588,
    complianceRate: 88.6,
    avgQuality: 8.2,
    incidents: 21,
    complianceTrend: 2.4,
    incidentsTrend: -5.2
  });
  const [correlationData, setCorrelationData] = useState<any[]>([]);
  const [dateRange] = useState({ start: '2024-01-01', end: '2025-12-31' });

  useEffect(() => {
    fetchPendingItems();
    fetchKPIData();
    fetchCorrelationData();
  }, []);

  const fetchKPIData = async () => {
    try {
      // Fetch dashboard summary for KPIs
      const res = await fetch('/api/dashboard/summary');
      if (res.ok) {
        const data = await res.json();
        setKpiData({
          workOrders: data.totalWorkOrders || 588,
          complianceRate: data.avgComplianceRate || 88.6,
          avgQuality: data.avgQualityScore || 8.2,
          incidents: data.totalIncidents || 21,
          complianceTrend: 2.4,
          incidentsTrend: -5.2
        });
      }
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    }
  };

  const fetchCorrelationData = async () => {
    try {
      const res = await fetch('/api/compliance/scatter');
      if (res.ok) {
        const data = await res.json();
        setCorrelationData(data);
      }
    } catch (error) {
      console.error('Error fetching correlation data:', error);
    }
  };

  const fetchPendingItems = async () => {
    try {
      // Fetch CI signals
      const signalsRes = await fetch('/api/ci-signals?status=open');
      const signals = signalsRes.ok ? await signalsRes.json() : [];

      // Transform to pending items
      const items: PendingItem[] = [
        ...signals.map((signal: any) => ({
          id: signal.signal_id,
          type: 'ci_signal' as const,
          title: signal.title,
          description: signal.description,
          priority: signal.severity as any,
          procedureId: signal.procedure_id,
          createdAt: signal.detected_at,
        })),
        // Mock regulation updates
        {
          id: 'REG-2024-001',
          type: 'regulation' as const,
          title: 'Updated OSHA Safety Requirements',
          description: 'New lockout/tagout procedures required for mechanical maintenance',
          priority: 'high' as const,
          procedureId: 'MNT-202',
          createdAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'REG-2024-002',
          type: 'regulation' as const,
          title: 'Environmental Reporting Standards Update',
          description: 'ISO 14001:2024 compliance requires additional documentation steps',
          priority: 'medium' as const,
          procedureId: 'OPS-004',
          createdAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setPendingItems(items.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }));
    } catch (error) {
      console.error('Error fetching pending items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'from-red-500 to-rose-600';
      case 'high': return 'from-orange-500 to-amber-600';
      case 'medium': return 'from-yellow-500 to-orange-500';
      case 'low': return 'from-blue-500 to-indigo-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ci_signal': return <TrendingDown className="w-5 h-5" />;
      case 'regulation': return <Shield className="w-5 h-5" />;
      case 'review': return <Clock className="w-5 h-5" />;
      case 'approval': return <CheckCircle className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ci_signal': return 'CI Signal';
      case 'regulation': return 'Regulation Update';
      case 'review': return 'Pending Review';
      case 'approval': return 'Awaiting Approval';
      default: return type;
    }
  };

  const getActionLink = (item: PendingItem) => {
    if (item.type === 'ci_signal') {
      return `/mso/procedures/${item.procedureId}?signal=${item.id}`;
    } else if (item.type === 'regulation') {
      return `/mso/regulations/${item.id}`;
    }
    return '#';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff0000]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff0000] to-[#cc0000] flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#1c2b40]">Dashboard</h1>
            <p className="text-sm text-gray-600">Operational intelligence and performance analytics</p>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5">
          {/* Frame Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-[#1c2b40]">Performance Overview</h2>
            <Link href="/mso/procedures">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-1.5 bg-gradient-to-r from-[#ff0000] to-[#cc0000] text-white text-xs font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-1"
              >
                <span>View</span>
                <ArrowRight className="w-3 h-3" />
              </motion.button>
            </Link>
          </div>

          {/* KPI Cards Grid - 1x4 Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#1c2b40] mb-1">{kpiData.workOrders}</div>
              <div className="text-xs font-semibold text-gray-700">Work Orders</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex items-center gap-0.5 px-2 py-1 bg-green-50 rounded">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-xs font-semibold text-green-600">{kpiData.complianceTrend}%</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-[#1c2b40] mb-1">{kpiData.complianceRate}%</div>
              <div className="text-xs font-semibold text-gray-700">Compliance</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#1c2b40] mb-1">{kpiData.avgQuality}</div>
              <div className="text-xs font-semibold text-gray-700">Avg Quality</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex items-center gap-0.5 px-2 py-1 bg-red-50 rounded">
                  <TrendingDownIcon className="w-3 h-3 text-red-600" />
                  <span className="text-xs font-semibold text-red-600">{kpiData.incidentsTrend}%</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-[#1c2b40] mb-1">{kpiData.incidents}</div>
              <div className="text-xs font-semibold text-gray-700">Incidents</div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1c2b40] mb-2">AI Insights</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Corrosion Inspection (INT-031)</strong> shows 68% skip rate on Step 5 -
                    consider simplifying verification language
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>OSHA update</strong> affects 3 mechanical procedures -
                    AI has drafted compliance changes for your review
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>
                    Procedures with &gt;90% compliance can be streamlined by 15% on average -
                    review optimization opportunities
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Statistical Analysis and Summary Cards Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Statistical Analysis - 66% */}
          <div className="lg:col-span-2">
            {correlationData.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="h-full"
              >
                <CorrelationScatterPlot data={correlationData} />
              </motion.div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-pulse text-gray-600 font-medium mb-2">Loading statistical analysis...</div>
                  <p className="text-sm text-gray-500">Fetching correlation data</p>
                </div>
              </div>
            )}
          </div>

          {/* Pending Action Items - 33% */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden h-full flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-lg font-bold text-[#1c2b40]">Pending Action Items</h2>
                <p className="text-sm text-gray-600">Items requiring your review and action</p>
              </div>

              <div className="divide-y divide-gray-200 overflow-y-auto flex-1">
            {pendingItems.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">All caught up!</p>
                <p className="text-sm text-gray-500 mt-1">No pending items requiring action</p>
              </div>
            ) : (
              pendingItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="px-6 py-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Priority Indicator */}
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getPriorityColor(item.priority)} flex items-center justify-center text-white flex-shrink-0`}>
                      {getTypeIcon(item.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                          item.priority === 'critical' ? 'bg-red-100 text-red-800' :
                          item.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {item.priority.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">{getTypeLabel(item.type)}</span>
                        {item.procedureId && (
                          <span className="text-xs text-gray-500">• {item.procedureId}</span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-[#1c2b40] mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                        {item.dueDate && (
                          <span className="text-orange-600 font-medium">
                            Due: {new Date(item.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link
                      href={getActionLink(item)}
                      className="px-4 py-2 bg-gradient-to-r from-[#ff0000] to-[#cc0000] text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 flex-shrink-0"
                    >
                      <span>Review</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              ))
            )}
              </div>
            </div>
          </div>
        </div>

        {/* Predictive Analytics & Risk Scoring */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <PredictiveAnalytics dateRange={dateRange} />
        </motion.div>
    </div>
  );
}
