'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ExecutiveProfitSummary } from '@/components/profit/ExecutiveProfitSummary';
import { DetailedCostBreakdown } from '@/components/profit/DetailedCostBreakdown';
import { FacilityProfitAnalysis } from '@/components/profit/FacilityProfitAnalysis';
import { ProcedureProfitAnalysis } from '@/components/profit/ProcedureProfitAnalysis';
import { TrendProjection } from '@/components/profit/TrendProjection';
import { ScenarioModeling } from '@/components/profit/ScenarioModeling';
import { AIProfitInsights } from '@/components/profit/AIProfitInsights';

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
      staggerChildren: 0.15
    }
  }
};

// Skeleton Component
function BusinessValueSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header Skeleton */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Executive Summary Skeleton */}
        <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl p-8 animate-pulse h-40"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-lg h-28 animate-pulse">
              <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 w-24 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>

        {/* Cost Breakdown Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="h-6 w-56 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-[300px] bg-gray-100 rounded-xl animate-pulse"></div>
            <div className="h-[300px] bg-gray-100 rounded-xl animate-pulse"></div>
          </div>
        </div>

        {/* Facility Analysis Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="h-[280px] bg-gray-100 rounded-xl animate-pulse"></div>
        </div>

        {/* Procedure Analysis Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="h-6 w-52 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="h-[200px] bg-gray-100 rounded-xl animate-pulse"></div>
        </div>

        {/* Trends Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="h-6 w-64 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="h-[350px] bg-gray-100 rounded-xl animate-pulse"></div>
        </div>

        {/* Scenario Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="h-6 w-44 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-[300px] bg-gray-100 rounded-xl animate-pulse"></div>
            <div className="h-[300px] bg-gray-100 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Section Header Component
interface SectionHeaderProps {
  icon: React.ReactNode;
  iconGradient: string;
  title: string;
  description: string;
}

function SectionHeader({ icon, iconGradient, title, description }: SectionHeaderProps) {
  return (
    <motion.div variants={fadeInUp} className="flex items-center gap-4 mb-6">
      <div className={`w-12 h-12 ${iconGradient} rounded-xl flex items-center justify-center shadow-lg`}>
        {icon}
      </div>
      <div>
        <h2 className="text-xl font-bold text-[#1c2b40]">{title}</h2>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </motion.div>
  );
}

export default function BusinessValuePage() {
  const [breakdownData, setBreakdownData] = useState<any>(null);
  const [facilityData, setFacilityData] = useState<any>(null);
  const [procedureData, setProcedureData] = useState<any>(null);
  const [trendsData, setTrendsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiHeadline, setAiHeadline] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch all data in parallel
        const [breakdownRes, facilityRes, procedureRes, trendsRes] = await Promise.all([
          fetch('/api/profit/breakdown'),
          fetch('/api/profit/facility'),
          fetch('/api/profit/procedure'),
          fetch('/api/profit/trends'),
        ]);

        if (breakdownRes.ok) {
          const data = await breakdownRes.json();
          setBreakdownData(data);

          // Generate AI headline
          try {
            const aiRes = await fetch('/api/ai/assistant', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' },
              body: JSON.stringify({
                message: `Generate a single powerful headline (max 25 words) about this compliance cost data: Total impact $${(data.totalProfitImpact / 1000000).toFixed(2)}M, ${data.complianceRate}% compliance, potential savings $${(data.potentialSavings / 1000).toFixed(0)}K. Focus on the business opportunity.`,
              }),
            });
            if (aiRes.ok) {
              const aiData = await aiRes.json();
              setAiHeadline(aiData.response || '');
            }
          } catch (e) {
            console.error('Error generating AI headline:', e);
          }
        }

        if (facilityRes.ok) {
          setFacilityData(await facilityRes.json());
        }

        if (procedureRes.ok) {
          setProcedureData(await procedureRes.json());
        }

        if (trendsRes.ok) {
          setTrendsData(await trendsRes.json());
        }
      } catch (error) {
        console.error('Error fetching business value data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <BusinessValueSkeleton />;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100"
    >
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div variants={fadeInUp} className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#1c2b40] to-[#2d3e54] rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1c2b40]">Business Value & Profit Impact</h1>
              <p className="text-sm text-gray-600 mt-1">
                Comprehensive analysis of how compliance drives business outcomes and profitability
              </p>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Section 1: Executive Profit Summary */}
        <motion.section variants={fadeInUp}>
          <ExecutiveProfitSummary data={breakdownData} aiHeadline={aiHeadline} />
        </motion.section>

        {/* Section 2: Detailed Cost Breakdown */}
        <motion.section variants={fadeInUp}>
          <SectionHeader
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            }
            iconGradient="bg-gradient-to-br from-purple-500 to-purple-600"
            title="Cost Analysis by Category"
            description="Breakdown of non-compliance costs across five key areas"
          />
          <DetailedCostBreakdown data={breakdownData} />
        </motion.section>

        {/* Section 3: Facility Profit Analysis */}
        <motion.section variants={fadeInUp}>
          <SectionHeader
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            iconGradient="bg-gradient-to-br from-blue-500 to-blue-600"
            title="Facility Impact Analysis"
            description="Cost distribution and savings potential by facility"
          />
          <FacilityProfitAnalysis data={facilityData} />
        </motion.section>

        {/* Section 4: Procedure Profit Analysis */}
        <motion.section variants={fadeInUp}>
          <SectionHeader
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            }
            iconGradient="bg-gradient-to-br from-green-500 to-green-600"
            title="Procedure Impact Analysis"
            description="Cost contribution and compliance rates by procedure"
          />
          <ProcedureProfitAnalysis data={procedureData} />
        </motion.section>

        {/* Section 5: Trend Analysis & Projections */}
        <motion.section variants={fadeInUp}>
          <SectionHeader
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            }
            iconGradient="bg-gradient-to-br from-amber-500 to-amber-600"
            title="Trend Analysis & Projections"
            description="Historical trends with forward-looking projections"
          />
          <TrendProjection data={trendsData} />
        </motion.section>

        {/* Section 6: Scenario Modeling */}
        <motion.section variants={fadeInUp}>
          <SectionHeader
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            }
            iconGradient="bg-gradient-to-br from-red-500 to-red-600"
            title="What-If Scenario Modeling"
            description="Model different compliance scenarios and calculate ROI"
          />
          <ScenarioModeling currentData={breakdownData} />
        </motion.section>

        {/* Section 7: AI-Powered Insights */}
        <motion.section variants={fadeInUp}>
          <SectionHeader
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            }
            iconGradient="bg-gradient-to-br from-indigo-500 to-indigo-600"
            title="AI-Powered Insights"
            description="Intelligent recommendations from your compliance data"
          />
          <AIProfitInsights
            data={{
              breakdown: breakdownData,
              facilities: facilityData,
              procedures: procedureData,
            }}
          />
        </motion.section>
      </main>
    </motion.div>
  );
}
