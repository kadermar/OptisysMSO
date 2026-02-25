'use client';

import Link from 'next/link';
import { TrendingUp, Info } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
         ResponsiveContainer, ReferenceLine, Label, ZAxis, Cell } from 'recharts';

interface CorrelationPoint {
  procedure_id: string;
  name: string;
  compliance_rate: number;
  incident_rate_reduction: number;
  cost_impact: number;
  category: string;
}

export function CorrelationScatterPlot({ data }: { data: CorrelationPoint[] }) {
  const trendLine = calculateTrendLine(data);

  // Modern color palette for data points
  const getPointColor = (point: CorrelationPoint) => {
    const isHighCompliance = point.compliance_rate >= 80;
    const isGoodReduction = point.incident_rate_reduction >= 20;

    if (isHighCompliance && isGoodReduction) return '#10b981'; // Emerald - excellent
    if (isHighCompliance || isGoodReduction) return '#3b82f6'; // Blue - good
    if (point.compliance_rate >= 70) return '#f59e0b'; // Amber - moderate
    return '#ef4444'; // Red - needs attention
  };

  const getPerformanceLabel = (point: CorrelationPoint) => {
    const isHighCompliance = point.compliance_rate >= 80;
    const isGoodReduction = point.incident_rate_reduction >= 20;

    if (isHighCompliance && isGoodReduction) return {
      label: 'Excellent',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200'
    };
    if (isHighCompliance || isGoodReduction) return {
      label: 'Good',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200'
    };
    if (point.compliance_rate >= 70) return {
      label: 'Moderate',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200'
    };
    return {
      label: 'Needs Attention',
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200'
    };
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-[#1c2b40]">
                Statistical Analysis
              </h2>
            </div>
            <p className="text-sm text-gray-600">
              Correlation between compliance rates and incident reduction across procedures
            </p>
          </div>

          <Link
            href="/compliance-analysis"
            className="px-4 py-2.5 bg-gradient-to-r from-[#ff0000] to-[#cc0000] text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all whitespace-nowrap"
          >
            View Detailed Analysis →
          </Link>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-1 mb-3">
          <Info className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-semibold text-gray-700">Performance Zones</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></div>
            <span className="text-xs text-gray-700">Excellent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
            <span className="text-xs text-gray-700">Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm"></div>
            <span className="text-xs text-gray-700">Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
            <span className="text-xs text-gray-700">Needs Attention</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
        <ResponsiveContainer width="100%" height={480}>
          <ScatterChart margin={{ top: 20, right: 40, bottom: 70, left: 70 }}>
            <defs>
              {/* Gradient for trend line */}
              <linearGradient id="trendGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ff0000" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#cc0000" stopOpacity={0.9} />
              </linearGradient>
              {/* Glow effect */}
              <filter id="pointGlow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Clean grid */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              strokeWidth={1}
              opacity={0.8}
            />

            {/* Performance zone reference lines */}
            <ReferenceLine
              x={80}
              stroke="#10b981"
              strokeDasharray="5 5"
              strokeOpacity={0.3}
              strokeWidth={2}
            />
            <ReferenceLine
              y={20}
              stroke="#10b981"
              strokeDasharray="5 5"
              strokeOpacity={0.3}
              strokeWidth={2}
            />

            {/* Axes */}
            <XAxis
              type="number"
              dataKey="compliance_rate"
              name="Compliance Rate"
              unit="%"
              domain={[50, 105]}
              ticks={[50, 60, 70, 80, 90, 100]}
              tick={{ fill: '#374151', fontWeight: 600, fontSize: 12 }}
              axisLine={{ stroke: '#9ca3af', strokeWidth: 2 }}
              tickLine={{ stroke: '#9ca3af', strokeWidth: 1.5 }}
            >
              <Label
                value="Compliance Rate (%)"
                position="bottom"
                offset={50}
                style={{ fontSize: 14, fontWeight: 700, fill: '#1f2937' }}
              />
            </XAxis>

            <YAxis
              type="number"
              dataKey="incident_rate_reduction"
              name="Incident Rate Reduction"
              unit="%"
              domain={[-100, 100]}
              tick={{ fill: '#374151', fontWeight: 600, fontSize: 12 }}
              axisLine={{ stroke: '#9ca3af', strokeWidth: 2 }}
              tickLine={{ stroke: '#9ca3af', strokeWidth: 1.5 }}
            >
              <Label
                value="Incident Rate Reduction (%)"
                angle={-90}
                position="left"
                offset={50}
                style={{ fontSize: 14, fontWeight: 700, fill: '#1f2937' }}
              />
            </YAxis>

            <ZAxis type="number" dataKey="cost_impact" range={[200, 800]} />

            {/* Trend line */}
            <ReferenceLine
              segment={[
                { x: 50, y: trendLine.getY(50) },
                { x: 100, y: trendLine.getY(100) }
              ]}
              stroke="url(#trendGradient)"
              strokeWidth={3}
              strokeDasharray="8 4"
              label={{
                value: `Trend Line (R² = ${trendLine.rSquared.toFixed(2)})`,
                position: "top",
                fill: "#dc2626",
                fontWeight: 700,
                fontSize: 12,
                offset: 15
              }}
            />

            {/* Data points */}
            <Scatter
              name="Procedures"
              data={data}
              shape="circle"
              animationDuration={1000}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getPointColor(entry)}
                  stroke="#ffffff"
                  strokeWidth={2.5}
                  opacity={0.85}
                  filter="url(#pointGlow)"
                />
              ))}
            </Scatter>

            {/* Enhanced tooltip */}
            <Tooltip
              cursor={{
                fill: 'rgba(59, 130, 246, 0.05)',
                strokeWidth: 2,
                stroke: '#3b82f6',
                strokeDasharray: '4 4'
              }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const point = payload[0].payload as CorrelationPoint;
                  const color = getPointColor(point);
                  const perf = getPerformanceLabel(point);

                  return (
                    <div className="bg-white p-4 rounded-xl shadow-2xl border-2 border-gray-200 max-w-xs">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-gray-200">
                        <div className="flex-1">
                          <p className="font-bold text-sm text-[#1c2b40] mb-1">
                            {point.name}
                          </p>
                          <span className="text-xs text-gray-500 font-mono">
                            {point.procedure_id}
                          </span>
                        </div>
                        <div
                          className="w-4 h-4 rounded-full shadow-md ring-2 ring-white flex-shrink-0"
                          style={{ backgroundColor: color }}
                        ></div>
                      </div>

                      {/* Performance badge */}
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold mb-3 ${perf.bg} ${perf.text} border ${perf.border}`}>
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }}></div>
                        {perf.label}
                      </div>

                      {/* Metrics */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 font-medium">Compliance Rate:</span>
                          <span className="text-sm font-bold text-[#1c2b40]">
                            {point.compliance_rate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 font-medium">Incident Reduction:</span>
                          <span className={`text-sm font-bold ${point.incident_rate_reduction >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {point.incident_rate_reduction >= 0 ? '+' : ''}{point.incident_rate_reduction.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Category */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md">
                          {point.category}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Helper functions
function calculateTrendLine(data: CorrelationPoint[]) {
  const n = data.length;
  if (n === 0) {
    return { slope: 0, intercept: 0, getY: () => 0, rSquared: 0 };
  }

  const sumX = data.reduce((acc, d) => acc + d.compliance_rate, 0);
  const sumY = data.reduce((acc, d) => acc + d.incident_rate_reduction, 0);
  const sumXY = data.reduce((acc, d) => acc + d.compliance_rate * d.incident_rate_reduction, 0);
  const sumX2 = data.reduce((acc, d) => acc + d.compliance_rate * d.compliance_rate, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return {
    slope,
    intercept,
    getY: (x: number) => slope * x + intercept,
    rSquared: calculateRSquared(data, slope, intercept)
  };
}

function calculateRSquared(data: CorrelationPoint[], slope: number, intercept: number) {
  const yMean = data.reduce((acc, d) => acc + d.incident_rate_reduction, 0) / data.length;
  const ssTotal = data.reduce((acc, d) =>
    acc + Math.pow(d.incident_rate_reduction - yMean, 2), 0);
  const ssResidual = data.reduce((acc, d) => {
    const yPred = slope * d.compliance_rate + intercept;
    return acc + Math.pow(d.incident_rate_reduction - yPred, 2);
  }, 0);

  return Math.max(0, 1 - (ssResidual / ssTotal));
}
