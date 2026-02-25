'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
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
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Clock,
  Shield,
  Loader2,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useTourSafe } from '@/components/tour';

// Animation variants
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const staggerContainer = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.02 },
  },
};

const tableRowVariant = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15 } },
};

// Loading Skeleton
function KnowledgeBaseSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-4 gap-4 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, color, trend }: {
  icon: any;
  label: string;
  value: number | string;
  color: string;
  trend?: number;
}) {
  const colorClasses: Record<string, string> = {
    red: 'from-red-500 to-rose-600',
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-green-500 to-emerald-600',
    purple: 'from-purple-500 to-violet-600',
  };

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-[#1c2b40]">{value}</p>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
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
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
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
    </motion.button>
  );
}

// Filter Select Component
function FilterSelect({ value, onChange, options, placeholder, icon: Icon }: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; count?: number }[];
  placeholder: string;
  icon?: any;
}) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${Icon ? 'pl-9' : 'pl-4'} pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#ff0000]/20 focus:border-[#ff0000] transition-all cursor-pointer hover:border-gray-300`}
      >
        <option value="all">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}{opt.count !== undefined ? ` (${opt.count})` : ''}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

// Sort Header Component
function SortHeader({ label, column, currentSort, currentDir, onSort }: {
  label: string;
  column: string;
  currentSort: string;
  currentDir: 'asc' | 'desc';
  onSort: (column: string) => void;
}) {
  const isActive = column === currentSort;
  return (
    <th
      onClick={() => onSort(column)}
      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none group"
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 transition-colors ${isActive ? 'text-[#ff0000]' : 'text-gray-400 group-hover:text-gray-600'}`} />
        {isActive && (
          <span className="text-[#ff0000]">{currentDir === 'asc' ? '↑' : '↓'}</span>
        )}
      </div>
    </th>
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

function KnowledgeBaseContent() {
  const tour = useTourSafe();
  const searchParams = useSearchParams();

  // State
  const [procedures, setProcedures] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [regulations, setRegulations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'procedures' | 'work-orders' | 'facilities' | 'workers' | 'regulations'>('procedures');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [procedureCategory, setProcedureCategory] = useState<string>('all');
  const [woComplianceFilter, setWoComplianceFilter] = useState<string>('all');
  const [woIncidentFilter, setWoIncidentFilter] = useState<string>('all');
  const [woProcedureFilter, setWoProcedureFilter] = useState<string>('all');
  const [facilityTierFilter, setFacilityTierFilter] = useState<string>('all');
  const [workerPlatformFilter, setWorkerPlatformFilter] = useState<string>('all');
  const [regulationStatusFilter, setRegulationStatusFilter] = useState<string>('all');

  // Sorting
  const [sortConfig, setSortConfig] = useState<{ column: string; dir: 'asc' | 'desc' }>({ column: 'name', dir: 'asc' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Handle URL params for tour
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'workorders') setActiveTab('work-orders');
  }, [searchParams]);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const [proceduresRes, workOrdersRes, facilitiesRes, workersRes, regulationsRes] = await Promise.all([
          fetch('/api/dashboard/procedures'),
          fetch('/api/dashboard/work-orders'),
          fetch('/api/dashboard/facilities'),
          fetch('/api/dashboard/workers'),
          fetch('/api/regulations'),
        ]);
        if (!proceduresRes.ok || !workOrdersRes.ok || !facilitiesRes.ok || !workersRes.ok || !regulationsRes.ok) {
          throw new Error('Failed to fetch data');
        }
        setProcedures(await proceduresRes.json());
        setWorkOrders(await workOrdersRes.json());
        setFacilities(await facilitiesRes.json());
        setWorkers(await workersRes.json());
        setRegulations(await regulationsRes.json());
      } catch (error) {
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Reset pagination, sort, and filters on tab change
  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
    // Reset all filters
    setProcedureCategory('all');
    setWoComplianceFilter('all');
    setWoIncidentFilter('all');
    setWoProcedureFilter('all');
    setFacilityTierFilter('all');
    setWorkerPlatformFilter('all');
    setRegulationStatusFilter('all');
    // Reset sort to appropriate default column for each tab
    const defaultSortColumn: Record<string, string> = {
      'procedures': 'name',
      'work-orders': 'scheduled_date',
      'facilities': 'name',
      'workers': 'worker_name',
      'regulations': 'effective_date',
    };
    setSortConfig({ column: defaultSortColumn[activeTab] || 'name', dir: 'desc' });
  }, [activeTab]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [procedureCategory, woComplianceFilter, woIncidentFilter, woProcedureFilter, facilityTierFilter, workerPlatformFilter, regulationStatusFilter, searchQuery]);

  // Computed values
  const categories = useMemo(() => Array.from(new Set(procedures.map(p => p.category).filter(Boolean))), [procedures]);
  const platforms = useMemo(() => Array.from(new Set(workers.map(w => w.platform).filter(Boolean))), [workers]);
  const performanceTiers = useMemo(() => Array.from(new Set(facilities.map(f => f.performance_tier).filter(Boolean))), [facilities]);
  const regulationStatuses = useMemo(() => Array.from(new Set(regulations.map(r => r.status).filter(Boolean))), [regulations]);

  const totalIncidents = useMemo(() => workOrders.filter(wo => wo.safety_incident).length, [workOrders]);
  const totalCompliant = useMemo(() => workOrders.filter(wo => wo.compliant).length, [workOrders]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let data: any[] = [];
    const query = searchQuery.toLowerCase().trim();

    if (activeTab === 'procedures') {
      data = procedures.filter(p => {
        if (procedureCategory !== 'all' && p.category !== procedureCategory) return false;
        if (query && !(p.name || '').toLowerCase().includes(query) && !(p.procedure_id || '').toLowerCase().includes(query)) return false;
        return true;
      });
    } else if (activeTab === 'work-orders') {
      data = workOrders.filter(wo => {
        if (woComplianceFilter === 'compliant' && !wo.compliant) return false;
        if (woComplianceFilter === 'non-compliant' && wo.compliant) return false;
        if (woIncidentFilter === 'with-incident' && !wo.safety_incident) return false;
        if (woIncidentFilter === 'no-incident' && wo.safety_incident) return false;
        if (woProcedureFilter !== 'all' && wo.procedure_id !== woProcedureFilter) return false;
        if (query && !(wo.wo_id || '').toLowerCase().includes(query) && !(wo.procedure_id || '').toLowerCase().includes(query) && !(wo.worker_id || '').toLowerCase().includes(query)) return false;
        return true;
      });
    } else if (activeTab === 'facilities') {
      data = facilities.filter(f => {
        if (facilityTierFilter !== 'all' && f.performance_tier !== facilityTierFilter) return false;
        if (query && !(f.name || '').toLowerCase().includes(query) && !(f.facility_id || '').toLowerCase().includes(query)) return false;
        return true;
      });
    } else if (activeTab === 'workers') {
      data = workers.filter(w => {
        if (workerPlatformFilter !== 'all' && w.platform !== workerPlatformFilter) return false;
        if (query && !(w.worker_name || '').toLowerCase().includes(query) && !(w.worker_id || '').toLowerCase().includes(query)) return false;
        return true;
      });
    } else if (activeTab === 'regulations') {
      data = regulations.filter(r => {
        if (regulationStatusFilter !== 'all' && r.status !== regulationStatusFilter) return false;
        if (query && !(r.title || '').toLowerCase().includes(query) && !(r.regulation_id || '').toLowerCase().includes(query) && !(r.source || '').toLowerCase().includes(query)) return false;
        return true;
      });
    }

    // Sort with null safety
    return [...data].sort((a, b) => {
      let aVal = a[sortConfig.column] ?? '';
      let bVal = b[sortConfig.column] ?? '';

      // Handle ID fields like "WO-1598", "PROC-001", etc. - extract numeric part for sorting
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const aMatch = aVal.match(/(\d+)$/);
        const bMatch = bVal.match(/(\d+)$/);
        if (aMatch && bMatch) {
          aVal = parseInt(aMatch[1], 10);
          bVal = parseInt(bMatch[1], 10);
        }
      }

      // Convert numeric strings to numbers for proper sorting
      if (typeof aVal === 'string' && aVal !== '' && !isNaN(parseFloat(aVal))) {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      }
      if (aVal < bVal) return sortConfig.dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [activeTab, procedures, workOrders, facilities, workers, regulations, procedureCategory, woComplianceFilter, woIncidentFilter, woProcedureFilter, facilityTierFilter, workerPlatformFilter, regulationStatusFilter, searchQuery, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Handlers
  const handleSort = (column: string) => {
    setSortConfig(prev => ({
      column,
      dir: prev.column === column && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleRowClick = async (item: any, type: string) => {
    if (type === 'procedure') {
      if (tour?.isActive && tour?.currentStep === 2) {
        tour.setSelectedProcedure(item.procedure_id, item.name);
      }
      try {
        const response = await fetch(`/api/procedures/${item.procedure_id}`);
        if (response.ok) {
          const fullProcedure = await response.json();
          setSelectedItem({ ...fullProcedure, type });
        } else {
          setSelectedItem({ ...item, type });
        }
      } catch {
        setSelectedItem({ ...item, type });
      }
    } else {
      setSelectedItem({ ...item, type });
    }
    setIsModalOpen(true);
  };

  if (loading) return <KnowledgeBaseSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center bg-white p-8 rounded-2xl shadow-xl"
        >
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-lg font-semibold text-gray-900">{error}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1c2b40] to-[#2d3e54] flex items-center justify-center shadow-lg">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1c2b40]">Knowledge Base</h1>
                <p className="text-sm text-gray-500">Complete data repository for OptiSys</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
          >
            <StatCard icon={FileText} label="Procedures" value={procedures.length} color="red" />
            <StatCard icon={ClipboardList} label="Work Orders" value={workOrders.length} color="blue" />
            <StatCard icon={Building2} label="Facilities" value={facilities.length} color="green" />
            <StatCard icon={Users} label="Workers" value={workers.length} color="purple" />
            <StatCard icon={Shield} label="Regulations" value={regulations.length} color="red" />
          </motion.div>
        </div>
      </header>

      {/* Tour Guidance */}
      <AnimatePresence>
        {tour?.isActive && (tour?.currentStep === 2 || tour?.currentStep === 6) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-4"
          >
            <div className="p-4 bg-gradient-to-r from-[#1c2b40] to-[#2d3e54] rounded-xl border-2 border-[#ff0000] shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ff0000] flex items-center justify-center text-white font-bold shadow-lg">
                  {tour?.currentStep}
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">
                    {tour?.currentStep === 2 ? 'Select a Procedure' : 'Data Hub - Work Order Records'}
                  </p>
                  <p className="text-gray-300 text-sm">
                    {tour?.currentStep === 2
                      ? 'Click on any procedure row below to select it for the tour.'
                      : 'Every completed task is stored here. Your work order now appears in the list.'}
                  </p>
                </div>
              </div>
              {tour?.currentStep === 2 && tour.selectedProcedureName && (
                <div className="mt-3 p-2 bg-green-500/20 rounded-lg border border-green-500/50 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <p className="text-green-400 text-sm">Selected: <strong>{tour.selectedProcedureName}</strong></p>
                </div>
              )}
              {tour?.currentStep === 6 && tour.completedWorkOrderId && (
                <div className="mt-3 p-2 bg-green-500/20 rounded-lg border border-green-500/50 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <p className="text-green-400 text-sm">Look for: <strong>{tour.completedWorkOrderId}</strong></p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {/* Tabs */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex flex-wrap gap-2">
              <TabButton active={activeTab === 'procedures'} onClick={() => setActiveTab('procedures')} icon={FileText} label="Procedures" count={procedures.length} />
              <TabButton active={activeTab === 'work-orders'} onClick={() => setActiveTab('work-orders')} icon={ClipboardList} label="Work Orders" count={workOrders.length} />
              <TabButton active={activeTab === 'facilities'} onClick={() => setActiveTab('facilities')} icon={Building2} label="Facilities" count={facilities.length} />
              <TabButton active={activeTab === 'workers'} onClick={() => setActiveTab('workers')} icon={Users} label="Workers" count={workers.length} />
              <TabButton active={activeTab === 'regulations'} onClick={() => setActiveTab('regulations')} icon={Shield} label="Regulations" count={regulations.length} />
            </div>
          </div>

          {/* Filters & Search */}
          <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]/20 focus:border-[#ff0000] transition-all"
              />
            </div>

            {activeTab === 'procedures' && (
              <FilterSelect
                value={procedureCategory}
                onChange={setProcedureCategory}
                options={categories.map(c => ({ value: c, label: c, count: procedures.filter(p => p.category === c).length }))}
                placeholder="All Categories"
                icon={Filter}
              />
            )}

            {activeTab === 'work-orders' && (
              <>
                <FilterSelect
                  value={woComplianceFilter}
                  onChange={setWoComplianceFilter}
                  options={[
                    { value: 'compliant', label: 'Compliant', count: totalCompliant },
                    { value: 'non-compliant', label: 'Non-Compliant', count: workOrders.length - totalCompliant },
                  ]}
                  placeholder="All Status"
                  icon={Shield}
                />
                <FilterSelect
                  value={woIncidentFilter}
                  onChange={setWoIncidentFilter}
                  options={[
                    { value: 'with-incident', label: 'With Incident', count: totalIncidents },
                    { value: 'no-incident', label: 'No Incident', count: workOrders.length - totalIncidents },
                  ]}
                  placeholder="All Incidents"
                  icon={AlertTriangle}
                />
              </>
            )}

            {activeTab === 'facilities' && (
              <FilterSelect
                value={facilityTierFilter}
                onChange={setFacilityTierFilter}
                options={performanceTiers.map(t => ({ value: t, label: t, count: facilities.filter(f => f.performance_tier === t).length }))}
                placeholder="All Tiers"
                icon={BarChart3}
              />
            )}

            {activeTab === 'workers' && (
              <FilterSelect
                value={workerPlatformFilter}
                onChange={setWorkerPlatformFilter}
                options={platforms.map(p => ({ value: p, label: p, count: workers.filter(w => w.platform === p).length }))}
                placeholder="All Platforms"
                icon={Users}
              />
            )}

            {activeTab === 'regulations' && (
              <FilterSelect
                value={regulationStatusFilter}
                onChange={setRegulationStatusFilter}
                options={regulationStatuses.map(s => ({ value: s, label: s, count: regulations.filter(r => r.status === s).length }))}
                placeholder="All Statuses"
                icon={Shield}
              />
            )}

            <div className="ml-auto text-sm text-gray-500">
              {filteredData.length} results
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                {activeTab === 'procedures' && (
                  <tr>
                    <SortHeader label="ID" column="procedure_id" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                    <SortHeader label="Name" column="name" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                    <SortHeader label="Category" column="category" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                    <SortHeader label="Work Orders" column="total_work_orders" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                    <SortHeader label="Compliance" column="compliance_rate" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                    <SortHeader label="Incidents" column="incident_count" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                  </tr>
                )}
                {activeTab === 'work-orders' && (
                  <tr>
                    <SortHeader label="WO ID" column="wo_id" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                    <SortHeader label="Procedure" column="procedure_id" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                    <SortHeader label="Worker" column="worker_id" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                    <SortHeader label="Date" column="scheduled_date" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                    <SortHeader label="Status" column="compliant" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                    <SortHeader label="Quality" column="quality_score" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                  </tr>
                )}
                {activeTab === 'facilities' && (
                  <tr>
                    <SortHeader label="ID" column="facility_id" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                    <SortHeader label="Name" column="name" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                    <SortHeader label="Work Orders" column="work_order_count" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                    <SortHeader label="Compliance" column="compliance_rate" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                    <SortHeader label="Incidents" column="total_incidents" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                    <SortHeader label="Tier" column="performance_tier" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                  </tr>
                )}
                {activeTab === 'workers' && (
                  <tr>
                    <SortHeader label="ID" column="worker_id" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                    <SortHeader label="Name" column="worker_name" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                    <SortHeader label="Platform" column="platform" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                    <SortHeader label="Work Orders" column="work_order_count" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                    <SortHeader label="Compliance" column="compliance_rate" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                    <SortHeader label="Quality" column="avg_quality_score" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                  </tr>
                )}
                {activeTab === 'regulations' && (
                  <tr>
                    <SortHeader label="ID" column="regulation_id" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                    <SortHeader label="Title" column="title" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                    <SortHeader label="Source" column="source" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                    <SortHeader label="Effective Date" column="effective_date" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                    <SortHeader label="Priority" column="priority" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                    <SortHeader label="Status" column="status" currentSort={sortConfig.column} currentDir={sortConfig.dir} onSort={handleSort} />
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="w-8 h-8 text-gray-300" />
                        <p className="text-gray-500 font-medium">No results found</p>
                        <p className="text-gray-400 text-sm">Try adjusting your filters or search query</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {activeTab === 'procedures' && paginatedData.map((item) => (
                      <tr
                        key={item.procedure_id}
                        onClick={() => handleRowClick(item, 'procedure')}
                        className="hover:bg-gray-50 cursor-pointer transition-colors group"
                      >
                        <td className="px-4 py-3 text-xs font-mono text-gray-500">{item.procedure_id}</td>
                        <td className="px-4 py-3 font-medium text-[#1c2b40] group-hover:text-[#ff0000] transition-colors">{item.name}</td>
                        <td className="px-4 py-3"><span className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">{item.category}</span></td>
                        <td className="px-4 py-3 font-medium">{item.total_work_orders}</td>
                        <td className="px-4 py-3"><ComplianceBadge rate={parseFloat(item.compliance_rate || '0')} /></td>
                        <td className="px-4 py-3">
                          {Number(item.incident_count) > 0 ? (
                            <span className="text-red-600 font-semibold">{item.incident_count}</span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {activeTab === 'work-orders' && paginatedData.map((item) => (
                      <tr
                        key={item.wo_id}
                        onClick={() => handleRowClick(item, 'work-order')}
                        className="hover:bg-gray-50 cursor-pointer transition-colors group"
                      >
                        <td className="px-4 py-3 text-xs font-mono text-gray-500">{item.wo_id}</td>
                        <td className="px-4 py-3 text-xs font-mono">{item.procedure_id}</td>
                        <td className="px-4 py-3 text-xs font-mono">{item.worker_id}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{item.scheduled_date ? new Date(item.scheduled_date).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${item.compliant ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {item.compliant ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            {item.compliant ? 'Compliant' : 'Non-Compliant'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#1c2b40]">{item.quality_score ? Number(item.quality_score).toFixed(1) : 'N/A'}</td>
                      </tr>
                    ))}
                    {activeTab === 'facilities' && paginatedData.map((item) => (
                      <tr
                        key={item.facility_id}
                        onClick={() => handleRowClick(item, 'facility')}
                        className="hover:bg-gray-50 cursor-pointer transition-colors group"
                      >
                        <td className="px-4 py-3 text-xs font-mono text-gray-500">{item.facility_id}</td>
                        <td className="px-4 py-3 font-medium text-[#1c2b40] group-hover:text-[#ff0000] transition-colors">{item.name}</td>
                        <td className="px-4 py-3 font-medium">{item.work_order_count}</td>
                        <td className="px-4 py-3"><ComplianceBadge rate={parseFloat(item.compliance_rate || '0')} /></td>
                        <td className="px-4 py-3">
                          {Number(item.total_incidents) > 0 ? (
                            <span className="text-red-600 font-semibold">{item.total_incidents}</span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-bold ${item.performance_tier === 'High' ? 'bg-green-100 text-green-700' : item.performance_tier === 'Medium' || item.performance_tier === 'Average' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{item.performance_tier}</span></td>
                      </tr>
                    ))}
                    {activeTab === 'workers' && paginatedData.map((item) => (
                      <tr
                        key={item.worker_id}
                        onClick={() => handleRowClick(item, 'worker')}
                        className="hover:bg-gray-50 cursor-pointer transition-colors group"
                      >
                        <td className="px-4 py-3 text-xs font-mono text-gray-500">{item.worker_id}</td>
                        <td className="px-4 py-3 font-medium text-[#1c2b40] group-hover:text-[#ff0000] transition-colors">{item.worker_name}</td>
                        <td className="px-4 py-3"><span className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">{item.platform || 'N/A'}</span></td>
                        <td className="px-4 py-3 font-medium">{item.work_order_count}</td>
                        <td className="px-4 py-3"><ComplianceBadge rate={parseFloat(item.compliance_rate || '0')} /></td>
                        <td className="px-4 py-3 font-semibold text-[#1c2b40]">{item.avg_quality_score ? Number(item.avg_quality_score).toFixed(1) : 'N/A'}</td>
                      </tr>
                    ))}
                    {activeTab === 'regulations' && paginatedData.map((item) => (
                      <tr
                        key={item.regulation_id}
                        onClick={() => handleRowClick(item, 'regulation')}
                        className="hover:bg-gray-50 cursor-pointer transition-colors group"
                      >
                        <td className="px-4 py-3 text-xs font-mono text-gray-500">{item.regulation_id}</td>
                        <td className="px-4 py-3 font-medium text-[#1c2b40] group-hover:text-[#ff0000] transition-colors">{item.title}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{item.source}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{item.effective_date ? new Date(item.effective_date).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                            item.priority === 'critical' ? 'bg-red-100 text-red-700' :
                            item.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                            item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>{item.priority}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            item.status === 'active' ? 'bg-green-100 text-green-700' :
                            item.status === 'pending_review' ? 'bg-yellow-100 text-yellow-700' :
                            item.status === 'under_review' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>{item.status}</span>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {isModalOpen && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#1c2b40] to-[#2d3e54] px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {selectedItem.type === 'procedure' && selectedItem.name}
                    {selectedItem.type === 'work-order' && `Work Order ${selectedItem.wo_id}`}
                    {selectedItem.type === 'facility' && selectedItem.name}
                    {selectedItem.type === 'worker' && selectedItem.worker_name}
                    {selectedItem.type === 'regulation' && selectedItem.title}
                  </h3>
                  <p className="text-sm text-white/70">
                    {selectedItem.type === 'procedure' && selectedItem.procedure_id}
                    {selectedItem.type === 'work-order' && selectedItem.procedure_id}
                    {selectedItem.type === 'facility' && selectedItem.facility_id}
                    {selectedItem.type === 'worker' && selectedItem.worker_id}
                    {selectedItem.type === 'regulation' && selectedItem.regulation_id}
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {selectedItem.type === 'procedure' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1">Category</p>
                        <p className="font-semibold text-[#1c2b40]">{selectedItem.category}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1">Compliance Rate</p>
                        <ComplianceBadge rate={parseFloat(selectedItem.compliance_rate || 0)} />
                      </div>
                    </div>
                    {selectedItem.description && (
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <p className="text-sm text-blue-900">{selectedItem.description}</p>
                      </div>
                    )}
                    {selectedItem.steps?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-[#1c2b40] mb-3">Procedure Steps ({selectedItem.steps.length})</h4>
                        <div className="space-y-2">
                          {selectedItem.steps.map((step: any) => (
                            <div key={step.step_id} className="bg-gray-50 rounded-xl p-4 flex gap-3">
                              <div className="w-8 h-8 rounded-lg bg-[#ff0000] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                                {step.step_number}
                              </div>
                              <div>
                                <p className="font-medium text-[#1c2b40]">{step.step_name}</p>
                                {step.description && <p className="text-sm text-gray-600 mt-1">{step.description}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedItem.type === 'work-order' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1">Date</p>
                        <p className="font-semibold text-[#1c2b40]">{new Date(selectedItem.scheduled_date).toLocaleDateString()}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1">Worker</p>
                        <p className="font-mono text-sm">{selectedItem.worker_id}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className={`rounded-xl p-4 text-center ${selectedItem.compliant ? 'bg-green-50' : 'bg-red-50'}`}>
                        <p className="text-xs text-gray-500 mb-1">Compliant</p>
                        <p className={`font-bold text-lg ${selectedItem.compliant ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedItem.compliant ? 'Yes' : 'No'}
                        </p>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-gray-500 mb-1">Quality Score</p>
                        <p className="font-bold text-lg text-blue-600">{selectedItem.quality_score ? Number(selectedItem.quality_score).toFixed(1) : 'N/A'}</p>
                      </div>
                      <div className={`rounded-xl p-4 text-center ${selectedItem.safety_incident ? 'bg-red-50' : 'bg-green-50'}`}>
                        <p className="text-xs text-gray-500 mb-1">Incident</p>
                        <p className={`font-bold text-lg ${selectedItem.safety_incident ? 'text-red-600' : 'text-green-600'}`}>
                          {selectedItem.safety_incident ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedItem.type === 'regulation' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1">Source</p>
                        <p className="font-semibold text-[#1c2b40]">{selectedItem.source}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1">Effective Date</p>
                        <p className="font-semibold text-[#1c2b40]">
                          {selectedItem.effective_date ? new Date(selectedItem.effective_date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1">Priority</p>
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                          selectedItem.priority === 'critical' ? 'bg-red-100 text-red-700' :
                          selectedItem.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          selectedItem.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {selectedItem.priority}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        selectedItem.status === 'active' ? 'bg-green-100 text-green-700' :
                        selectedItem.status === 'pending_review' ? 'bg-yellow-100 text-yellow-700' :
                        selectedItem.status === 'under_review' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {selectedItem.status}
                      </span>
                    </div>
                    {selectedItem.summary && (
                      <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                        <p className="text-xs text-gray-500 mb-2 font-semibold">Summary</p>
                        <p className="text-sm text-[#1c2b40]">{selectedItem.summary}</p>
                      </div>
                    )}
                    {selectedItem.key_changes && selectedItem.key_changes.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-[#1c2b40] mb-3">Key Changes ({selectedItem.key_changes.length})</h4>
                        <div className="space-y-2">
                          {selectedItem.key_changes.map((change: string, idx: number) => (
                            <div key={idx} className="bg-yellow-50 rounded-xl p-3 flex gap-3 border border-yellow-100">
                              <div className="w-6 h-6 rounded-lg bg-[#ff0000] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                                {idx + 1}
                              </div>
                              <p className="text-sm text-[#1c2b40]">{change}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedItem.affected_procedures && selectedItem.affected_procedures.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-[#1c2b40] mb-3">Affected Procedures ({selectedItem.affected_procedures.length})</h4>
                        <div className="space-y-2">
                          {selectedItem.affected_procedures.map((procId: string, idx: number) => (
                            <div key={idx} className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                              <p className="font-mono text-sm text-blue-900">{procId}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {(selectedItem.type === 'facility' || selectedItem.type === 'worker') && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-gray-500 mb-1">Work Orders</p>
                        <p className="font-bold text-2xl text-blue-600">{selectedItem.work_order_count}</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-gray-500 mb-1">Compliance</p>
                        <ComplianceBadge rate={parseFloat(selectedItem.compliance_rate || 0)} />
                      </div>
                      <div className="bg-red-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-gray-500 mb-1">Incidents</p>
                        <p className="font-bold text-2xl text-red-600">{selectedItem.total_incidents || selectedItem.incident_count || 0}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-[#1c2b40] font-semibold rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function KnowledgeBasePage() {
  return (
    <Suspense fallback={<KnowledgeBaseSkeleton />}>
      <KnowledgeBaseContent />
    </Suspense>
  );
}
