'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/costConstants';

interface ProfitData {
  breakdown: {
    totalProfitImpact: number;
    potentialSavings: number;
    complianceRate: number;
    categories: Record<string, { total: number; percentOfTotal: number }>;
  } | null;
  facilities: {
    facilities: Array<{
      name: string;
      profitImpact: number;
      compliance_rate: number;
      incident_count: number;
    }>;
  } | null;
  procedures: {
    procedures: Array<{
      name: string;
      totalProfitImpact: number;
      compliance_rate: number;
      category: string;
    }>;
  } | null;
}

interface AIProfitInsightsProps {
  data: ProfitData;
}

interface Insight {
  type: 'opportunity' | 'risk' | 'recommendation' | 'trend';
  title: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  relatedItems?: string[];
  value?: string;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const INSIGHT_CONFIG = {
  opportunity: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    bgColor: 'bg-green-50',
    iconBg: 'bg-green-500',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
  },
  risk: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    bgColor: 'bg-red-50',
    iconBg: 'bg-red-500',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
  },
  recommendation: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    bgColor: 'bg-amber-50',
    iconBg: 'bg-amber-500',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
  },
  trend: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    bgColor: 'bg-blue-50',
    iconBg: 'bg-blue-500',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
  },
};

const CONFIDENCE_CONFIG = {
  high: { color: 'bg-green-500', label: 'High Confidence' },
  medium: { color: 'bg-amber-500', label: 'Medium Confidence' },
  low: { color: 'bg-gray-400', label: 'Low Confidence' },
};

export function AIProfitInsights({ data }: AIProfitInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiHeadline, setAiHeadline] = useState<string>('');
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  const generateInsights = useCallback(async () => {
    if (!data.breakdown) return;

    setLoading(true);

    try {
      // Generate AI headline
      const headlineResponse = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' },
        body: JSON.stringify({
          message: `Based on this compliance data, provide a single, impactful headline insight (max 30 words):
          - Total profit impact from non-compliance: ${formatCurrency(data.breakdown.totalProfitImpact)}
          - Current compliance rate: ${data.breakdown.complianceRate}%
          - Potential savings at 95% compliance: ${formatCurrency(data.breakdown.potentialSavings)}
          - Top cost category: ${Object.entries(data.breakdown.categories).sort((a, b) => b[1].total - a[1].total)[0]?.[0] || 'unknown'}

          Start with a key number or metric. Be specific and actionable.`,
        }),
      });

      if (headlineResponse.ok) {
        const headlineData = await headlineResponse.json();
        setAiHeadline(headlineData.response || '');
      }

      // Generate data-driven insights
      const generatedInsights: Insight[] = [];

      // Opportunity insight - top facility for improvement
      if (data.facilities?.facilities?.length) {
        const sortedFacilities = [...data.facilities.facilities].sort(
          (a, b) => b.profitImpact - a.profitImpact
        );
        const topFacility = sortedFacilities[0];
        if (topFacility) {
          generatedInsights.push({
            type: 'opportunity',
            title: 'High-Impact Facility Identified',
            description: `${topFacility.name} accounts for ${formatCurrency(topFacility.profitImpact)} in costs. Improving compliance from ${topFacility.compliance_rate}% to 95% could save approximately ${formatCurrency(topFacility.profitImpact * 0.4)}.`,
            confidence: 'high',
            relatedItems: [topFacility.name],
            value: formatCurrency(topFacility.profitImpact * 0.4),
          });
        }
      }

      // Risk insight - low compliance areas
      if (data.procedures?.procedures?.length) {
        const lowComplianceProcedures = data.procedures.procedures
          .filter(p => p.compliance_rate < 80)
          .sort((a, b) => a.compliance_rate - b.compliance_rate);

        if (lowComplianceProcedures.length > 0) {
          generatedInsights.push({
            type: 'risk',
            title: 'Critical Compliance Gaps',
            description: `${lowComplianceProcedures.length} procedures have compliance below 80%. Focus on "${lowComplianceProcedures[0].name}" (${lowComplianceProcedures[0].compliance_rate}%) which has ${formatCurrency(lowComplianceProcedures[0].totalProfitImpact)} in associated costs.`,
            confidence: 'high',
            relatedItems: lowComplianceProcedures.slice(0, 3).map(p => p.name),
          });
        }
      }

      // Recommendation insight
      if (data.breakdown.categories) {
        const sortedCategories = Object.entries(data.breakdown.categories).sort(
          (a, b) => b[1].total - a[1].total
        );
        const topCategory = sortedCategories[0];
        if (topCategory) {
          const categoryName = topCategory[0].charAt(0).toUpperCase() + topCategory[0].slice(1);
          generatedInsights.push({
            type: 'recommendation',
            title: `Prioritize ${categoryName} Cost Reduction`,
            description: `${categoryName} costs represent ${topCategory[1].percentOfTotal}% of total impact (${formatCurrency(topCategory[1].total)}). Consider targeted training, process improvements, or automation to reduce this category.`,
            confidence: 'medium',
            value: formatCurrency(topCategory[1].total),
          });
        }
      }

      // Trend insight
      const potentialSavingsPercent = data.breakdown.totalProfitImpact > 0
        ? ((data.breakdown.potentialSavings / data.breakdown.totalProfitImpact) * 100).toFixed(0)
        : 0;
      generatedInsights.push({
        type: 'trend',
        title: 'ROI Projection',
        description: `Achieving 95% compliance could reduce costs by ${potentialSavingsPercent}%. At current spending levels, this represents ${formatCurrency(data.breakdown.potentialSavings)} in annual savings potential.`,
        confidence: 'medium',
        value: formatCurrency(data.breakdown.potentialSavings),
      });

      setInsights(generatedInsights);
      setLastGenerated(new Date());
    } catch (error) {
      console.error('Error generating insights:', error);
      // Generate fallback insights without AI
      setInsights([
        {
          type: 'opportunity',
          title: 'Cost Reduction Opportunity',
          description: `Current non-compliance costs total ${formatCurrency(data.breakdown?.totalProfitImpact || 0)}. Targeting 95% compliance could save ${formatCurrency(data.breakdown?.potentialSavings || 0)}.`,
          confidence: 'high',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [data]);

  useEffect(() => {
    if (data.breakdown) {
      generateInsights();
    }
  }, [data.breakdown, generateInsights]);

  return (
    <motion.div variants={fadeInUp} className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-[#1c2b40]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1c2b40] flex items-center gap-2">
            <span className="w-2 h-6 bg-[#ff0000] rounded"></span>
            AI-Powered Insights
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Intelligent recommendations based on your data
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastGenerated && (
            <span className="text-xs text-gray-400">
              Generated {lastGenerated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={generateInsights}
            disabled={loading}
            className="px-4 py-2 bg-[#1c2b40] text-white rounded-lg text-sm font-medium hover:bg-[#2d3e54] transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Refresh Insights
          </button>
        </div>
      </div>

      {/* AI Headline */}
      {aiHeadline && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#1c2b40] to-[#2d3e54] rounded-xl p-4 mb-6 text-white"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-amber-300 font-semibold mb-1">KEY INSIGHT</p>
              <p className="text-sm text-white/90">{aiHeadline}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && insights.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <svg className="w-12 h-12 text-[#1c2b40] animate-spin mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-500">Analyzing your data...</p>
          </div>
        </div>
      )}

      {/* Insight Cards */}
      <AnimatePresence>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, index) => {
            const config = INSIGHT_CONFIG[insight.type];
            const confidenceConfig = CONFIDENCE_CONFIG[insight.confidence];

            return (
              <motion.div
                key={`${insight.type}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={`${config.bgColor} rounded-xl p-5 border ${config.borderColor} hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 ${config.iconBg} rounded-lg flex items-center justify-center text-white flex-shrink-0`}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${config.textColor}`}>{insight.title}</h3>
                      <div className="flex items-center gap-1" title={confidenceConfig.label}>
                        <div className={`w-2 h-2 rounded-full ${confidenceConfig.color}`} />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{insight.description}</p>

                    {insight.value && (
                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-white/50 rounded-lg">
                        <span className="text-xs text-gray-500">Potential Impact:</span>
                        <span className="text-sm font-bold text-[#1c2b40]">{insight.value}</span>
                      </div>
                    )}

                    {insight.relatedItems && insight.relatedItems.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {insight.relatedItems.map((item, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-white/50 rounded text-xs text-gray-600"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>

      {/* Empty State */}
      {!loading && insights.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p>No insights available yet.</p>
          <button
            onClick={generateInsights}
            className="mt-4 text-[#1c2b40] font-medium hover:underline"
          >
            Generate Insights
          </button>
        </div>
      )}
    </motion.div>
  );
}
