'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { DrilldownCards } from '@/components/dashboard/DrilldownCards';
import { ProcedureStepAnalysis } from '@/components/dashboard/ProcedureStepAnalysis';
import { useTourSafe } from '@/components/tour';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
};

// Skeleton Component
function ProceduresSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header Skeleton */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-12 w-80 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Grid Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-[#1c2b40]">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-5 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-gray-200 rounded"></div>
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Work Orders Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-[#1c2b40]">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Analysis Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-[#1c2b40]">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  textColor: string;
}

function StatCard({ title, value, subtitle, icon, gradient, iconBg, textColor }: StatCardProps) {
  return (
    <motion.div
      variants={scaleIn}
      className={`relative overflow-hidden rounded-xl ${gradient} p-5 group hover:shadow-lg transition-all duration-300`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-3xl font-bold ${textColor} mt-1`}>{value}</p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
      </div>
      {/* Decorative element */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-500"></div>
    </motion.div>
  );
}

// Secondary Stat Card
interface SecondaryStatProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

function SecondaryStat({ title, value, icon }: SecondaryStatProps) {
  return (
    <motion.div
      variants={fadeInUp}
      className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all duration-300 group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-[#1c2b40] to-[#2d3e54] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">{title}</p>
          <p className="text-xl font-bold text-[#1c2b40]">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

function ProceduresContent() {
  const searchParams = useSearchParams();
  const tour = useTourSafe();
  const [procedures, setProcedures] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [selectedProcedureId, setSelectedProcedureId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [proceduresRes, workOrdersRes] = await Promise.all([
          fetch('/api/dashboard/procedures'),
          fetch('/api/dashboard/work-orders'),
        ]);

        if (!proceduresRes.ok || !workOrdersRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const proceduresData = await proceduresRes.json();
        setProcedures(proceduresData);
        setWorkOrders(await workOrdersRes.json());

        // Check if there's a selected parameter in the URL
        const selectedFromUrl = searchParams.get('selected');

        // Determine which procedure to select (priority order)
        let procedureToSelect: string | null = null;

        // 1. If tour is active and has a selected procedure, always use that
        if (tour?.isActive && tour?.selectedProcedureId) {
          if (proceduresData.some((p: any) => p.procedure_id === tour.selectedProcedureId)) {
            procedureToSelect = tour.selectedProcedureId;
          }
        }

        // 2. Fall back to URL parameter if no tour selection
        if (!procedureToSelect && selectedFromUrl) {
          if (proceduresData.some((p: any) => p.procedure_id === selectedFromUrl)) {
            procedureToSelect = selectedFromUrl;
          }
        }

        // 3. Fall back to first procedure if nothing else
        if (!procedureToSelect && proceduresData.length > 0) {
          procedureToSelect = proceduresData[0].procedure_id;
        }

        if (procedureToSelect) {
          setSelectedProcedureId(procedureToSelect);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load procedure data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [searchParams, tour?.isActive, tour?.selectedProcedureId, tour?.currentStep]);

  if (loading) {
    return <ProceduresSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white rounded-2xl shadow-xl p-8 border border-red-100"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600">{error}</p>
        </motion.div>
      </div>
    );
  }

  const selectedProcedure = procedures.find(p => p.procedure_id === selectedProcedureId);
  const filteredWorkOrders = workOrders.filter(wo => wo.procedure_id === selectedProcedureId);

  // Calculate real-time metrics from actual work orders
  const totalWorkOrders = filteredWorkOrders.length;
  // Use 'compliant' field (boolean) from database
  const compliantWorkOrders = filteredWorkOrders.filter(wo => wo.compliant === true).length;

  // Calculate incident metrics using 'safety_incident' field (boolean)
  const incidentCount = filteredWorkOrders.filter(wo => wo.safety_incident === true).length;
  const incidentRate = totalWorkOrders > 0 ? Math.round((incidentCount / totalWorkOrders) * 100) : 0;

  // Calculate rework metrics using 'rework_required' field (boolean)
  const reworkCount = filteredWorkOrders.filter(wo => wo.rework_required === true).length;
  const reworkRate = totalWorkOrders > 0 ? Math.round((reworkCount / totalWorkOrders) * 100) : 0;

  // Calculate average quality score (database uses 0-10 scale)
  const qualityScores = filteredWorkOrders
    .filter(wo => wo.quality_score != null && !isNaN(wo.quality_score))
    .map(wo => Number(wo.quality_score));
  const avgQualityScore = qualityScores.length > 0
    ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
    : null;

  if (!selectedProcedure) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white rounded-2xl shadow-xl p-8 border border-yellow-100"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Procedures Available</h3>
          <p className="text-gray-600">No procedures have been configured yet.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 transition-colors duration-300"
    >
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1c2b40] flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#1c2b40] to-[#2d3e54] rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                Procedures
              </h1>
              <p className="text-sm text-gray-600 mt-1 ml-13">
                {procedures.length} total procedures • Procedure-level analytics
              </p>
            </div>

            {/* Procedure Selector */}
            <div className="w-full sm:w-auto sm:min-w-[320px]">
              <div className="relative">
                <select
                  value={selectedProcedureId || ''}
                  onChange={(e) => setSelectedProcedureId(e.target.value)}
                  className="w-full appearance-none px-4 py-3 pr-10 rounded-xl border-2 border-gray-200 bg-white text-[#1c2b40] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]/20 focus:border-[#ff0000] transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
                >
                  {procedures.map((procedure) => (
                    <option key={procedure.procedure_id} value={procedure.procedure_id}>
                      {procedure.name} ({procedure.category})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1 pl-1">
                ID: {selectedProcedure.procedure_id}
              </p>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Tour Step 3 Guidance - View Procedure Details */}
      {tour?.isActive && tour?.currentStep === 4 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 sm:mx-6 lg:mx-8 mt-4"
        >
          <div className="max-w-[1600px] mx-auto">
            <div className="p-5 bg-gradient-to-r from-[#1c2b40] to-[#2d3e54] rounded-2xl border-2 border-[#ff0000] shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#ff0000] flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg">4</div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-lg">Procedure Analysis - View Details & Metrics</p>
                  <p className="text-gray-300 text-sm mt-1">
                    Now we drill into {tour.selectedProcedureName ? `"${tour.selectedProcedureName}"` : 'the selected procedure'}.
                    This view shows procedure-level analytics: compliance rates, incident correlation, and step-by-step adherence data.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
                  <p className="text-[#ff0000] font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Procedure Statistics
                  </p>
                  <p className="text-gray-300 text-xs mt-1">Real-time metrics including compliance rate, incidents, and quality scores</p>
                </div>
                <div className="p-3 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
                  <p className="text-[#ff0000] font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Work Order History
                  </p>
                  <p className="text-gray-300 text-xs mt-1">Historical execution records with detailed outcomes</p>
                </div>
                <div className="p-3 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
                  <p className="text-[#ff0000] font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Step Analysis
                  </p>
                  <p className="text-gray-300 text-xs mt-1">Step-level adherence and quality metrics</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tour Step 10 Guidance - Version History */}
      {tour?.isActive && tour?.currentStep === 10 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 sm:mx-6 lg:mx-8 mt-4"
        >
          <div className="max-w-[1600px] mx-auto">
            <div className="p-5 bg-gradient-to-r from-[#1c2b40] to-[#2d3e54] rounded-2xl border-2 border-[#ff0000] shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#ff0000] flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg">10</div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-lg">Version History - Track Procedure Evolution</p>
                  <p className="text-gray-300 text-sm mt-1">
                    Every procedure edit creates a new version with full audit trail. View the version history showing who made changes, when, and why - including which CI signal triggered the update.
                  </p>
                </div>
              </div>
              {tour.completedWorkOrderId && (
                <div className="mt-4 p-4 bg-green-500/20 rounded-xl border border-green-500/40 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-green-300 font-medium">
                        Your work order ({tour.completedWorkOrderId}) is now recorded in the system
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        Scroll down to the Work Order Details section to see your task and its impact on metrics
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Procedure Statistics */}
        <motion.section
          variants={fadeInUp}
          className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-[#1c2b40]"
        >
          <h2 className="text-xl font-bold text-[#1c2b40] mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#ff0000] to-[#cc0000] rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            Procedure Statistics
          </h2>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {/* Compliance Rate */}
            <StatCard
              title="Compliance Rate"
              value={`${totalWorkOrders > 0 ? Math.round((compliantWorkOrders / totalWorkOrders) * 100) : 0}%`}
              subtitle={`${compliantWorkOrders}/${totalWorkOrders} compliant`}
              gradient="bg-gradient-to-br from-green-50 to-green-100 border border-green-200"
              iconBg="bg-gradient-to-br from-green-500 to-green-600"
              textColor="text-green-700"
              icon={
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />

            {/* Incident Rate */}
            <StatCard
              title="Incident Rate"
              value={`${incidentRate}%`}
              subtitle={`${incidentCount} incidents`}
              gradient="bg-gradient-to-br from-red-50 to-red-100 border border-red-200"
              iconBg="bg-gradient-to-br from-red-500 to-red-600"
              textColor="text-red-700"
              icon={
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            />

            {/* Quality Score */}
            <StatCard
              title="Avg Quality Score"
              value={avgQualityScore ? avgQualityScore.toFixed(1) : 'N/A'}
              subtitle="out of 10.0"
              gradient="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200"
              iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
              textColor="text-blue-700"
              icon={
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              }
            />

            {/* Rework Rate */}
            <StatCard
              title="Rework Rate"
              value={`${reworkRate}%`}
              subtitle={`${reworkCount} reworks`}
              gradient="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200"
              iconBg="bg-gradient-to-br from-yellow-500 to-yellow-600"
              textColor="text-yellow-700"
              icon={
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              }
            />
          </motion.div>

          {/* Additional Metrics */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6"
          >
            <SecondaryStat
              title="Total Work Orders"
              value={filteredWorkOrders.length}
              icon={
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
            <SecondaryStat
              title="Avg Duration"
              value={`${selectedProcedure.avg_duration ? Number(selectedProcedure.avg_duration).toFixed(1) : 'N/A'}h`}
              icon={
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <SecondaryStat
              title="Avg Downtime"
              value={`${selectedProcedure.avg_downtime ? Number(selectedProcedure.avg_downtime).toFixed(1) : 'N/A'}h`}
              icon={
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                </svg>
              }
            />
          </motion.div>
        </motion.section>

        {/* Work Order Details */}
        <motion.section
          variants={fadeInUp}
          className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-[#1c2b40]"
        >
          <DrilldownCards
            workOrders={filteredWorkOrders}
            selectedProcedureId={selectedProcedureId}
          />
        </motion.section>

        {/* Step-by-Step Analysis */}
        <motion.section variants={fadeInUp}>
          <ProcedureStepAnalysis
            procedures={procedures}
            dateRange={{ start: '2024-01-01', end: '2024-09-30' }}
            fixedProcedureId={selectedProcedureId}
          />
        </motion.section>
      </main>
    </motion.div>
  );
}

export default function ProceduresPage() {
  return (
    <Suspense fallback={<ProceduresSkeleton />}>
      <ProceduresContent />
    </Suspense>
  );
}
