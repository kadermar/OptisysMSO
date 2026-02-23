'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  FileText,
  ClipboardList,
  Building2,
  Users,
  Search,
  Filter,
  ChevronDown,
  ArrowRight,
  TrendingDown,
  Loader2,
  CheckCircle,
  AlertTriangle,
  X,
} from 'lucide-react';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const staggerContainer = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.05 },
  },
};

// Stat Card Component
function StatCard({ icon: Icon, label, value, color }: {
  icon: any;
  label: string;
  value: number | string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    red: 'from-red-500 to-rose-600',
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-green-500 to-emerald-600',
    amber: 'from-amber-500 to-orange-600',
  };

  return (
    <motion.div
      variants={fadeInUp}
      className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-[#1c2b40]">{value}</p>
        </div>
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

// Tab Button Component
function TabButton({ active, onClick, icon: Icon, label, count }: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
        active
          ? 'bg-gradient-to-r from-[#ff0000] to-[#cc0000] text-white shadow-lg'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
        active ? 'bg-white/20' : 'bg-gray-200'
      }`}>
        {count}
      </span>
    </button>
  );
}

// Compliance Badge
function ComplianceBadge({ rate }: { rate: number }) {
  const isGood = rate >= 80;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
      isGood ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
      {isGood ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
      {rate}%
    </span>
  );
}

export default function MSOKnowledgeBasePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'procedures' | 'work-orders' | 'facilities' | 'workers'>('procedures');
  const [procedures, setProcedures] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [procRes, woRes, facRes, workersRes] = await Promise.all([
        fetch('/api/dashboard/procedures'),
        fetch('/api/dashboard/work-orders'),
        fetch('/api/dashboard/facilities'),
        fetch('/api/dashboard/workers'),
      ]);

      if (procRes.ok) setProcedures(await procRes.json());
      if (woRes.ok) setWorkOrders(await woRes.json());
      if (facRes.ok) setFacilities(await facRes.json());
      if (workersRes.ok) setWorkers(await workersRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(procedures.map(p => p.category).filter(Boolean));
    return Array.from(cats);
  }, [procedures]);

  const tiers = useMemo(() => {
    const t = new Set(facilities.map(f => f.performance_tier).filter(Boolean));
    return Array.from(t);
  }, [facilities]);

  const platforms = useMemo(() => {
    const p = new Set(workers.map(w => w.platform).filter(Boolean));
    return Array.from(p);
  }, [workers]);

  const filteredProcedures = useMemo(() => {
    return procedures.filter(p => {
      const matchesSearch = !searchQuery ||
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.procedure_id?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [procedures, searchQuery, categoryFilter]);

  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter(wo => {
      return !searchQuery ||
        wo.wo_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.procedure_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.worker_id?.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [workOrders, searchQuery]);

  const filteredFacilities = useMemo(() => {
    return facilities.filter(f => {
      const matchesSearch = !searchQuery ||
        f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.facility_id?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTier = tierFilter === 'all' || f.performance_tier === tierFilter;
      return matchesSearch && matchesTier;
    });
  }, [facilities, searchQuery, tierFilter]);

  const filteredWorkers = useMemo(() => {
    return workers.filter(w => {
      const matchesSearch = !searchQuery ||
        w.worker_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.worker_id?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlatform = platformFilter === 'all' || w.platform === platformFilter;
      return matchesSearch && matchesPlatform;
    });
  }, [workers, searchQuery, platformFilter]);

  const stats = useMemo(() => ({
    totalProcedures: procedures.length,
    activeWorkOrders: workOrders.filter(w => w.status === 'in_progress' || !w.status).length,
    totalFacilities: facilities.length,
    totalWorkers: workers.length,
  }), [procedures, workOrders, facilities, workers]);

  // Reset filters when tab changes
  useEffect(() => {
    setSearchQuery('');
    setCategoryFilter('all');
    setTierFilter('all');
    setPlatformFilter('all');
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#ff0000]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-[1600px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Database className="w-8 h-8 text-[#ff0000]" />
              <h1 className="text-3xl font-bold text-[#1c2b40]">Knowledge Base</h1>
            </div>
            <p className="text-gray-600">
              Comprehensive database of procedures, work orders, facilities, and personnel
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6"
          >
            <StatCard icon={FileText} label="Total Procedures" value={stats.totalProcedures} color="blue" />
            <StatCard icon={ClipboardList} label="Work Orders" value={stats.activeWorkOrders} color="green" />
            <StatCard icon={Building2} label="Facilities" value={stats.totalFacilities} color="amber" />
            <StatCard icon={Users} label="Personnel" value={stats.totalWorkers} color="red" />
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Tab Navigation */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-2 flex-wrap">
              <TabButton
                active={activeTab === 'procedures'}
                onClick={() => setActiveTab('procedures')}
                icon={FileText}
                label="Procedures"
                count={filteredProcedures.length}
              />
              <TabButton
                active={activeTab === 'work-orders'}
                onClick={() => setActiveTab('work-orders')}
                icon={ClipboardList}
                label="Work Orders"
                count={filteredWorkOrders.length}
              />
              <TabButton
                active={activeTab === 'facilities'}
                onClick={() => setActiveTab('facilities')}
                icon={Building2}
                label="Facilities"
                count={filteredFacilities.length}
              />
              <TabButton
                active={activeTab === 'workers'}
                onClick={() => setActiveTab('workers')}
                icon={Users}
                label="Personnel"
                count={filteredWorkers.length}
              />
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
                  placeholder={`Search ${activeTab.replace('-', ' ')}...`}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff0000] focus:ring-2 focus:ring-red-100"
                />
              </div>

              {activeTab === 'procedures' && categories.length > 0 && (
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

              {activeTab === 'facilities' && tiers.length > 0 && (
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff0000] focus:ring-2 focus:ring-red-100 appearance-none bg-white"
                  >
                    <option value="all">All Performance Tiers</option>
                    {tiers.map(tier => (
                      <option key={tier} value={tier}>{tier}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              )}

              {activeTab === 'workers' && platforms.length > 0 && (
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={platformFilter}
                    onChange={(e) => setPlatformFilter(e.target.value)}
                    className="pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff0000] focus:ring-2 focus:ring-red-100 appearance-none bg-white"
                  >
                    <option value="all">All Platforms</option>
                    {platforms.map(platform => (
                      <option key={platform} value={platform}>{platform}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Procedures Tab */}
              {activeTab === 'procedures' && (
                <motion.div
                  key="procedures"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-3"
                >
                  {filteredProcedures.map((proc) => (
                    <motion.div
                      key={proc.procedure_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => router.push(`/mso/procedures/${proc.procedure_id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#ff0000] to-[#cc0000] flex items-center justify-center shrink-0">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-[#1c2b40]">{proc.name}</h3>
                              <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">{proc.category}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                              <span className="font-mono text-xs">{proc.procedure_id}</span>
                              <span>•</span>
                              <span>{proc.total_work_orders || 0} work orders</span>
                              {Number(proc.incident_count) > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-red-600 font-semibold">{proc.incident_count} incidents</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <ComplianceBadge rate={parseFloat(proc.compliance_rate || '0')} />
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </motion.div>
                  ))}
                  {filteredProcedures.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">No procedures found</p>
                      <p className="text-sm text-gray-500 mt-1">Try adjusting your search criteria</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Work Orders Tab */}
              {activeTab === 'work-orders' && (
                <motion.div
                  key="workorders"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-3"
                >
                  {filteredWorkOrders.map((wo, idx) => (
                    <motion.div
                      key={wo.wo_id || `wo-${idx}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                          <ClipboardList className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-[#1c2b40] font-mono text-sm">{wo.wo_id}</h3>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${wo.compliant ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {wo.compliant ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              {wo.compliant ? 'Compliant' : 'Non-Compliant'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="font-mono text-xs">Procedure: {wo.procedure_id}</span>
                            <span>•</span>
                            <span className="font-mono text-xs">Worker: {wo.worker_id}</span>
                            {wo.scheduled_date && (
                              <>
                                <span>•</span>
                                <span>{new Date(wo.scheduled_date).toLocaleDateString()}</span>
                              </>
                            )}
                            {wo.quality_score && (
                              <>
                                <span>•</span>
                                <span className="font-semibold">Quality: {Number(wo.quality_score).toFixed(1)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {filteredWorkOrders.length === 0 && (
                    <div className="text-center py-12">
                      <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">No work orders found</p>
                      <p className="text-sm text-gray-500 mt-1">Try adjusting your search criteria</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Facilities Tab */}
              {activeTab === 'facilities' && (
                <motion.div
                  key="facilities"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-3"
                >
                  {filteredFacilities.map((facility) => (
                    <motion.div
                      key={facility.facility_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-[#1c2b40]">{facility.name}</h3>
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${facility.performance_tier === 'High' ? 'bg-green-100 text-green-700' : facility.performance_tier === 'Medium' || facility.performance_tier === 'Average' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                              {facility.performance_tier || 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <span className="font-mono text-xs">{facility.facility_id}</span>
                            <span>•</span>
                            <span>{facility.work_order_count || 0} work orders</span>
                            {Number(facility.total_incidents) > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-red-600 font-semibold">{facility.total_incidents} incidents</span>
                              </>
                            )}
                          </div>
                          <ComplianceBadge rate={parseFloat(facility.compliance_rate || '0')} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {filteredFacilities.length === 0 && (
                    <div className="text-center py-12">
                      <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">No facilities found</p>
                      <p className="text-sm text-gray-500 mt-1">Try adjusting your search criteria</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Workers Tab */}
              {activeTab === 'workers' && (
                <motion.div
                  key="workers"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-3"
                >
                  {filteredWorkers.map((worker) => (
                    <motion.div
                      key={worker.worker_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shrink-0">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-[#1c2b40]">{worker.worker_name}</h3>
                            {worker.platform && (
                              <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">{worker.platform}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <span className="font-mono text-xs">{worker.worker_id}</span>
                            <span>•</span>
                            <span>{worker.work_order_count || 0} work orders</span>
                            {worker.avg_quality_score && (
                              <>
                                <span>•</span>
                                <span className="font-semibold">Avg Quality: {Number(worker.avg_quality_score).toFixed(1)}</span>
                              </>
                            )}
                          </div>
                          <ComplianceBadge rate={parseFloat(worker.compliance_rate || '0')} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {filteredWorkers.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">No personnel found</p>
                      <p className="text-sm text-gray-500 mt-1">Try adjusting your search criteria</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
