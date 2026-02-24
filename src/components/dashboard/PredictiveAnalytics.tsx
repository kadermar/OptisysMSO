'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface PredictiveData {
  procedure_id: string;
  name: string;
  category: string;
  total_work_orders: number;
  compliance_rate: number;
  incident_rate: number;
  avg_quality_score: number;
  avg_duration: number;
  rework_count: number;
  equipment_trip_count: number;
  risk_score: number;
  risk_category: string;
  recommendation: string;
}

interface PredictiveAnalyticsProps {
  dateRange: { start: string; end: string };
}

export function PredictiveAnalytics({ dateRange }: PredictiveAnalyticsProps) {
  const [predictiveData, setPredictiveData] = useState<PredictiveData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPredictiveData() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          startDate: dateRange.start,
          endDate: dateRange.end,
        });

        const response = await fetch(`/api/dashboard/predictive?${params}`);
        const data = await response.json();
        setPredictiveData(data);
      } catch (error) {
        console.error('Error fetching predictive data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPredictiveData();
  }, [dateRange]);

  const getRiskColor = (category: string) => {
    switch (category) {
      case 'Critical': return { bg: 'bg-red-100', text: 'text-red-900', border: 'border-red-400', bar: '#ef4444', gradient: 'url(#criticalGradient)' };
      case 'High': return { bg: 'bg-orange-100', text: 'text-orange-900', border: 'border-orange-400', bar: '#f97316', gradient: 'url(#highGradient)' };
      case 'Medium': return { bg: 'bg-yellow-100', text: 'text-yellow-900', border: 'border-yellow-400', bar: '#eab308', gradient: 'url(#mediumGradient)' };
      case 'Low': return { bg: 'bg-green-100', text: 'text-green-900', border: 'border-green-400', bar: '#22c55e', gradient: 'url(#lowGradient)' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-900', border: 'border-gray-400', bar: '#6b7280', gradient: 'url(#defaultGradient)' };
    }
  };

  const getRiskIcon = (category: string) => {
    switch (category) {
      case 'Critical': return '🔴';
      case 'High': return '🟠';
      case 'Medium': return '🟡';
      case 'Low': return '🟢';
      default: return '⚪';
    }
  };

  const riskDistribution = [
    { name: 'Critical', count: predictiveData.filter(d => d.risk_category === 'Critical').length },
    { name: 'High', count: predictiveData.filter(d => d.risk_category === 'High').length },
    { name: 'Medium', count: predictiveData.filter(d => d.risk_category === 'Medium').length },
    { name: 'Low', count: predictiveData.filter(d => d.risk_category === 'Low').length },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-2xl p-8 border-l-4 border-[#1c2b40]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#1c2b40] flex items-center gap-3">
            <div className="w-10 h-10 bg-[#ff0000] rounded-full flex items-center justify-center text-white text-xl shadow-lg">
              📊
            </div>
            Predictive Analytics & Risk Scoring
          </h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-gray-600 font-medium">Loading predictive analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-2xl p-8 border-l-4 border-[#1c2b40]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1c2b40] flex items-center gap-3">
            <div className="w-10 h-10 bg-[#ff0000] rounded-full flex items-center justify-center text-white text-xl shadow-lg">
              📊
            </div>
            Predictive Analytics & Risk Scoring
          </h2>
          <p className="text-sm text-gray-600 mt-2 ml-13">
            AI-powered risk assessment and performance predictions
          </p>
        </div>
      </div>

      {predictiveData.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No predictive data available for the selected date range
        </div>
      ) : (
        <>
          {/* Risk Distribution and Analysis Section */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
            {/* Risk Distribution Chart */}
            <div className="lg:col-span-3 bg-white rounded-xl p-4 shadow-xl border-2 border-gray-200 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-50 to-orange-50 rounded-full blur-3xl opacity-30 -z-10"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-50 to-indigo-50 rounded-full blur-3xl opacity-30 -z-10"></div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-3">
                <h3 className="text-lg font-bold text-[#1c2b40] flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#ff0000] to-[#cc0000] rounded-lg flex items-center justify-center text-white shadow-lg">
                    📊
                  </div>
                  Risk Distribution by Procedure
                </h3>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-sm"></div>
                    <span className="text-gray-700">Critical</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 shadow-sm"></div>
                    <span className="text-gray-700">High</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-sm"></div>
                    <span className="text-gray-700">Medium</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-sm"></div>
                    <span className="text-gray-700">Low</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-xl p-3 border border-gray-200 shadow-inner">
                <ResponsiveContainer width="100%" height={450}>
                  <BarChart data={predictiveData.slice(0, 10)} margin={{ top: 5, right: 15, left: 5, bottom: 35 }}>
                    <defs>
                      <linearGradient id="criticalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                        <stop offset="100%" stopColor="#dc2626" stopOpacity={0.85} />
                      </linearGradient>
                      <linearGradient id="highGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity={1} />
                        <stop offset="100%" stopColor="#ea580c" stopOpacity={0.85} />
                      </linearGradient>
                      <linearGradient id="mediumGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#eab308" stopOpacity={1} />
                        <stop offset="100%" stopColor="#ca8a04" stopOpacity={0.85} />
                      </linearGradient>
                      <linearGradient id="lowGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                        <stop offset="100%" stopColor="#16a34a" stopOpacity={0.85} />
                      </linearGradient>
                      <linearGradient id="defaultGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6b7280" stopOpacity={1} />
                        <stop offset="100%" stopColor="#4b5563" stopOpacity={0.85} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.6} vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={false}
                      axisLine={{ stroke: '#9ca3af', strokeWidth: 2 }}
                      tickLine={false}
                      label={{
                        value: 'Procedures',
                        position: 'insideBottom',
                        offset: -10,
                        fill: '#1c2b40',
                        fontWeight: 'bold',
                        fontSize: 14
                      }}
                    />
                    <YAxis
                      tick={{ fill: '#1c2b40', fontWeight: 600, fontSize: 12 }}
                      axisLine={{ stroke: '#9ca3af', strokeWidth: 2 }}
                      tickLine={{ stroke: '#9ca3af' }}
                      label={{ value: 'Risk Score (0-100)', angle: -90, position: 'center', fill: '#1c2b40', fontWeight: 'bold', fontSize: 13, dx: -15 }}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255, 0, 0, 0.05)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as PredictiveData;
                          const colors = getRiskColor(data.risk_category);
                          return (
                            <div className="bg-white p-4 border-2 border-[#ff0000] rounded-xl shadow-2xl">
                              <p className="font-bold text-lg mb-3 text-[#1c2b40] border-b-2 border-gray-200 pb-2">
                                {data.name}
                              </p>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-sm text-gray-600 font-semibold">Risk Score:</span>
                                  <span className="text-base font-bold" style={{ color: colors.bar }}>
                                    {data.risk_score}/100
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-sm text-gray-600 font-semibold">Category:</span>
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${colors.bg} ${colors.text} border ${colors.border}`}>
                                    {getRiskIcon(data.risk_category)} {data.risk_category}
                                  </span>
                                </div>
                                <div className="border-t border-gray-200 pt-2 mt-2">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-xs text-gray-600">Compliance:</span>
                                    <span className="text-sm font-bold text-[#1c2b40]">{data.compliance_rate}%</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-xs text-gray-600">Incidents:</span>
                                    <span className="text-sm font-bold text-[#1c2b40]">{data.incident_rate}%</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-xs text-gray-600">Quality:</span>
                                    <span className="text-sm font-bold text-[#1c2b40]">{data.avg_quality_score}/10</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="risk_score"
                      radius={[10, 10, 0, 0]}
                      maxBarSize={55}
                      animationDuration={1000}
                      animationBegin={0}
                    >
                      {predictiveData.slice(0, 10).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getRiskColor(entry.risk_category).gradient}
                          stroke={getRiskColor(entry.risk_category).bar}
                          strokeWidth={2}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Risk Analysis Table */}
            <div className="lg:col-span-2 bg-white rounded-xl p-4 shadow-xl border-2 border-gray-200">
              <h3 className="text-lg font-bold text-[#1c2b40] mb-2 flex items-center gap-2">
                <span className="w-2 h-6 bg-[#ff0000] rounded"></span>
                Detailed Risk Analysis
              </h3>

              <div className="rounded-xl border-2 border-gray-200 shadow-lg">
                <div className="divide-y divide-gray-200 bg-white">
                  {predictiveData.slice(0, 10).map((item) => {
                    const colors = getRiskColor(item.risk_category);
                    return (
                      <div
                        key={item.procedure_id}
                        className="p-2 hover:bg-gray-50 transition-colors"
                      >
                        {/* Procedure Name */}
                        <div className="mb-1">
                          <div className="font-bold text-xs text-[#1c2b40] leading-tight">
                            {item.name.length > 35 ? item.name.substring(0, 35) + '...' : item.name}
                          </div>
                          <div className="text-[10px] text-gray-600 font-medium">
                            {item.category}
                          </div>
                        </div>

                        {/* Risk Score and Category */}
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${colors.bg} ${colors.text} border ${colors.border}`}>
                            {getRiskIcon(item.risk_category)} {item.risk_category}
                          </span>
                          <div className="text-lg font-bold" style={{ color: colors.bar }}>
                            {item.risk_score}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden shadow-inner mb-1">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${item.risk_score}%`,
                              backgroundColor: colors.bar
                            }}
                          ></div>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                          <div>
                            <span className="text-gray-600">Compliance:</span>
                            <span className="font-bold text-[#1c2b40] ml-0.5">{item.compliance_rate}%</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Incidents:</span>
                            <span className="font-bold text-[#1c2b40] ml-0.5">{item.incident_rate}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Risk Methodology */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-l-4 border-[#1c2b40] shadow-lg">
            <h4 className="text-base font-bold text-[#1c2b40] mb-3 flex items-center gap-2">
              <span className="text-lg">ℹ️</span>
              Risk Score Methodology
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed font-medium">
              Risk scores are calculated using a weighted algorithm: <span className="text-[#ff0000] font-bold">40% compliance rate</span>, <span className="text-[#ff0000] font-bold">30% incident rate</span>,
              <span className="text-[#ff0000] font-bold"> 20% quality scores</span>, and <span className="text-[#ff0000] font-bold">10% rework frequency</span>. Scores range from 0-100, with higher scores indicating greater risk.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
