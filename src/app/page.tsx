'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Activity,
  Building2,
  ClipboardList,
  ArrowRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { ExecutiveSummary } from '@/components/dashboard/ExecutiveSummary';
import { CorrelationScatterPlot } from '@/components/compliance/CorrelationScatterPlot';
import { PredictiveAnalytics } from '@/components/dashboard/PredictiveAnalytics';
import { useTourSafe } from '@/components/tour';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
};

// Loading Skeleton
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-6">
            <div className="h-80 bg-white rounded-2xl animate-pulse" />
            <div className="h-64 bg-white rounded-2xl animate-pulse" />
          </div>
          <div className="lg:w-[380px] space-y-6">
            <div className="h-72 bg-white rounded-2xl animate-pulse" />
            <div className="h-64 bg-white rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, subValue, trend, color }: {
  icon: any;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: number;
  color: 'red' | 'blue' | 'green' | 'purple' | 'amber';
}) {
  const colorClasses = {
    red: 'from-red-500 to-rose-600',
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-green-500 to-emerald-600',
    purple: 'from-purple-500 to-violet-600',
    amber: 'from-amber-500 to-orange-600',
  };

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
            trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-[#1c2b40]">{value}</p>
        <p className="text-sm font-medium text-gray-500 mt-1">{label}</p>
        {subValue && <p className="text-xs text-gray-400 mt-0.5">{subValue}</p>}
      </div>
    </motion.div>
  );
}

// Navigation Card Component
function NavCard({ href, icon: Icon, title, description, color }: {
  href: string;
  icon: any;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -2, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="group relative bg-white hover:bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-[#ff0000]/30 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity`} />
        <div className="relative flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#1c2b40] group-hover:text-[#ff0000] transition-colors">{title}</p>
            <p className="text-xs text-gray-500 truncate">{description}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#ff0000] group-hover:translate-x-1 transition-all" />
        </div>
      </motion.div>
    </Link>
  );
}

// Facility Card Component
function FacilityCard({ facility }: { facility: any }) {
  const complianceRate = parseFloat(facility.compliance_rate);
  const isGood = complianceRate >= 85;

  return (
    <motion.div
      variants={fadeInUp}
      className="group bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1c2b40] to-[#2d3e54] flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-[#1c2b40] group-hover:text-[#ff0000] transition-colors">{facility.name}</p>
            <p className="text-xs text-gray-500">{facility.performance_tier} Performer</p>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-bold ${
          isGood ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {isGood ? <CheckCircle className="w-3 h-3 inline mr-1" /> : <AlertTriangle className="w-3 h-3 inline mr-1" />}
          {complianceRate}%
        </div>
      </div>
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${complianceRate}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`absolute inset-y-0 left-0 rounded-full ${
            isGood ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'
          }`}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>{facility.work_order_count} work orders</span>
        <span>{facility.total_incidents} incidents</span>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const tour = useTourSafe();
  const [summary, setSummary] = useState<any>(null);
  const [procedures, setProcedures] = useState<any[]>([]);
  const [scatterData, setScatterData] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ start: '2024-01-01', end: '2024-09-30' });
  const [ciSignals, setCiSignals] = useState<any[]>([]);

  // Computed stats
  const stats = useMemo(() => {
    if (!summary) return null;
    const totalIncidents = workOrders.filter(wo => wo.safety_incident).length;
    const avgQuality = workOrders.length > 0
      ? (workOrders.reduce((sum, wo) => sum + (parseFloat(wo.quality_score) || 0), 0) / workOrders.length).toFixed(1)
      : '0';
    const activeCISignals = procedures.filter(p => p.has_open_signals).length;
    return {
      totalWorkOrders: workOrders.length,
      totalProcedures: procedures.length,
      totalWorkers: workers.length,
      totalIncidents,
      avgQuality,
      complianceRate: summary.overallCompliance || 0,
      activeCISignals,
    };
  }, [summary, workOrders, procedures, workers]);

  useEffect(() => {
    async function fetchData() {
      try {
        const params = new URLSearchParams({
          startDate: dateRange.start,
          endDate: dateRange.end,
        });

        const [summaryRes, proceduresRes, scatterRes, facilitiesRes, workOrdersRes, workersRes] = await Promise.all([
          fetch(`/api/dashboard/summary?${params}`),
          fetch(`/api/dashboard/procedures?${params}`),
          fetch('/api/compliance/scatter'),
          fetch(`/api/dashboard/facilities?${params}`),
          fetch(`/api/dashboard/work-orders?${params}`),
          fetch(`/api/dashboard/workers?${params}`),
        ]);

        if (!summaryRes.ok || !proceduresRes.ok || !scatterRes.ok || !facilitiesRes.ok || !workOrdersRes.ok || !workersRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        setSummary(await summaryRes.json());
        setProcedures(await proceduresRes.json());
        setScatterData(await scatterRes.json());
        setFacilities(await facilitiesRes.json());
        setWorkOrders(await workOrdersRes.json());
        setWorkers(await workersRes.json());
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please check your database connection.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [dateRange]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md"
        >
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-[#1c2b40] mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-[#ff0000] text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff0000] to-[#cc0000] flex items-center justify-center shadow-lg">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1c2b40]">Dashboard</h1>
                <p className="text-sm text-gray-500">Operational intelligence and performance analytics</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
              <Activity className="w-4 h-4 text-green-500" />
              <span>Live data</span>
            </div>
          </div>

          {/* Stats Grid */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5"
          >
            <StatCard
              icon={CheckCircle}
              label="Compliance Rate"
              value={`${stats?.complianceRate || 0}%`}
              subValue="Overall performance"
              trend={2.4}
              color="green"
            />
            <StatCard
              icon={TrendingDown}
              label="CI Signals"
              value={stats?.activeCISignals || 0}
              subValue="Active improvements"
              color="amber"
            />
            <StatCard
              icon={BarChart3}
              label="Avg Quality"
              value={stats?.avgQuality || '0'}
              subValue="Quality score"
              color="purple"
            />
            <StatCard
              icon={AlertTriangle}
              label="Incidents"
              value={stats?.totalIncidents || 0}
              subValue="Safety events"
              trend={-5.2}
              color="red"
            />
          </motion.div>

          {/* Navigation Cards */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
          >
            <NavCard
              href="/mso/governance"
              icon={FileText}
              title="Governance"
              description="Procedures & regulations"
              color="from-blue-500 to-indigo-600"
            />
            <NavCard
              href="/mso/signals"
              icon={TrendingDown}
              title="CI Signals"
              description={`${stats?.activeCISignals || 0} active signals`}
              color="from-amber-500 to-orange-600"
            />
            <NavCard
              href="/mso/field-experience"
              icon={ClipboardList}
              title="Field Experience"
              description="Mobile work order interface"
              color="from-green-500 to-emerald-600"
            />
            <NavCard
              href="/compliance-analysis"
              icon={BarChart3}
              title="Business Value"
              description="Profit impact analysis"
              color="from-purple-500 to-violet-600"
            />
          </motion.div>
        </div>
      </header>

      {/* Tour Guidance */}
      <AnimatePresence>
        {tour?.isActive && (tour?.currentStep === 7 || tour?.currentStep === 8 || tour?.currentStep === 12) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-4"
          >
            <div className="p-4 bg-gradient-to-r from-[#1c2b40] to-[#2d3e54] rounded-xl border-2 border-[#ff0000] shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ff0000] flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                  {tour?.currentStep}
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">
                    {tour?.currentStep === 7 && 'Analytics Engine - See Your Data in Action'}
                    {tour?.currentStep === 8 && 'CI Signal Detection - Improvement Opportunity'}
                    {tour?.currentStep === 12 && 'Complete System Loop - Continuous Improvement'}
                  </p>
                  <p className="text-gray-300 text-sm">
                    {tour?.currentStep === 7 && 'The Analytics Engine correlates procedure adherence with operational outcomes. Your completed task contributes to these metrics.'}
                    {tour?.currentStep === 8 && 'Notice the CI Signal badge. The system has detected an improvement opportunity based on field data patterns.'}
                    {tour?.currentStep === 12 && 'You\'ve completed the full OptiSys cycle. Every task execution makes the system smarter through continuous improvement.'}
                  </p>
                </div>
              </div>
              {tour?.currentStep === 7 && tour.completedWorkOrderId && (
                <div className="mt-3 p-2 bg-green-500/20 rounded-lg border border-green-500/50 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <p className="text-green-300 text-sm">Work Order #{tour.completedWorkOrderId} is now reflected in analytics</p>
                </div>
              )}
              {tour?.currentStep === 8 && (
                <div className="mt-3 p-2 bg-amber-500/20 rounded-lg border border-amber-500/50">
                  <p className="text-amber-300 text-sm font-medium">CI Signal Detected!</p>
                  <p className="text-gray-400 text-xs mt-1">Look for the amber badge indicating an improvement opportunity for the procedure.</p>
                </div>
              )}
              {tour?.currentStep === 12 && (
                <div className="mt-3 p-2 bg-blue-500/20 rounded-lg border border-blue-500/50">
                  <p className="text-blue-300 text-sm font-medium">Tour Complete!</p>
                  <p className="text-gray-400 text-xs mt-1">You've seen the complete Loop A cycle: Upload → Execute → Analyze → Improve → Measure.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column */}
          <div className="flex-1 space-y-6">
            {/* Correlation Analysis */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {scatterData.length > 0 && <CorrelationScatterPlot data={scatterData} />}
            </motion.section>

            {/* Predictive Analytics */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <PredictiveAnalytics dateRange={dateRange} />
            </motion.section>
          </div>

          {/* Right Column */}
          <div className="lg:w-[380px] space-y-6">
            {/* Key Insights */}
            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ExecutiveSummary procedureData={procedures} workerData={workers} />
            </motion.section>

            {/* Active CI Signals */}
            {procedures.filter(p => p.has_open_signals).length > 0 && (
              <motion.section
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full" />
                      <div>
                        <h3 className="font-bold text-[#1c2b40]">Active CI Signals</h3>
                        <p className="text-xs text-gray-600">Improvement opportunities</p>
                      </div>
                    </div>
                    <Link
                      href="/mso/signals"
                      className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                    >
                      View All
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
                <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                  {procedures.filter(p => p.has_open_signals).slice(0, 3).map((proc: any, idx: number) => (
                    <Link
                      key={proc.procedure_id}
                      href={`/mso/signals`}
                      className="block"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + idx * 0.05 }}
                        className="group bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-200 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <TrendingDown className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-[#1c2b40] group-hover:text-amber-700 transition-colors truncate">
                              {proc.name}
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">{proc.procedure_id}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {proc.compliance_rate < 80 && (
                                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-semibold">
                                  {proc.compliance_rate}% Compliance
                                </span>
                              )}
                              {proc.incident_rate > 5 && (
                                <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] font-semibold">
                                  {proc.incident_rate}% Incidents
                                </span>
                              )}
                              {proc.rework_rate > 15 && (
                                <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[10px] font-semibold">
                                  {proc.rework_rate}% Rework
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-amber-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                  {procedures.filter(p => p.has_open_signals).length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 font-medium">No active signals</p>
                      <p className="text-xs text-gray-500 mt-1">All procedures performing well</p>
                    </div>
                  )}
                </div>
              </motion.section>
            )}

            {/* Compliance by Facility */}
            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-[#ff0000] rounded-full" />
                  <div>
                    <h3 className="font-bold text-[#1c2b40]">Compliance by Facility</h3>
                    <p className="text-xs text-gray-500">Cultural patterns across platforms</p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {facilities?.map((facility: any) => (
                    <FacilityCard key={facility.facility_id} facility={facility} />
                  ))}
                </motion.div>
              </div>
            </motion.section>
          </div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-8 mt-8 border-t border-gray-200"
        >
          <div className="flex items-center justify-center gap-3 text-gray-500 text-sm">
            <div className="w-1.5 h-1.5 bg-[#ff0000] rounded-full" />
            <span>OptiSys — Management System Performance Intelligence</span>
            <div className="w-1.5 h-1.5 bg-[#ff0000] rounded-full" />
          </div>
        </motion.footer>
      </main>
    </div>
  );
}
