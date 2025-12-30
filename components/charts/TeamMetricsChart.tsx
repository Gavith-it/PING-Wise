'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface TeamMetric {
  name: string;
  bookings: number;
  doctorId: string;
}

interface TeamMetricsChartProps {
  data: TeamMetric[];
  loading?: boolean;
}

export default function TeamMetricsChart({ data, loading = false }: TeamMetricsChartProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState<'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sort data by booking count (descending) for better visualization
  const sortedData = [...data].sort((a, b) => b.bookings - a.bookings);

  // Calculate max value for proper scaling - ensure minimum of 10 for visibility
  const maxValue = Math.max(...sortedData.map(d => d.bookings), 0);
  // Round to nearest nice number (like 5, 10, 20, 50, 100, etc.)
  const roundedMax = Math.max(Math.ceil((maxValue || 10) * 1.2 / 10) * 10, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-2">No team metrics available</p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Add doctors and appointments to see metrics
        </p>
      </div>
    );
  }

  // Responsive chart height - smaller on mobile
  const chartHeight = isMobile 
    ? Math.max(250, sortedData.length * 50)
    : Math.max(350, sortedData.length * 70);

  // Responsive margins - move chart content more to the left
  const margins = isMobile
    ? { top: 10, right: 20, left: 40, bottom: 40 }
    : { top: 20, right: 40, left: 70, bottom: 50 };

  // Responsive Y-axis width - smaller to move bars more left
  const yAxisWidth = isMobile ? 40 : 65;

  // Responsive font sizes
  const yAxisFontSize = isMobile ? 11 : 13;
  const xAxisFontSize = isMobile ? 10 : 12;
  const labelFontSize = isMobile ? '10px' : '12px';

  return (
    <>
      {/* Header with title and filter buttons */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white m-0">Team Metrics</h3>
        </div>
        <div className="flex bg-[#F3F4F6] dark:bg-gray-700 rounded-lg p-1 gap-1 flex-wrap">
          <button
            onClick={() => setCurrentPeriod('weekly')}
            className={`px-3 md:px-4 py-2 border-none rounded-md font-["Inter",sans-serif] text-xs md:text-sm font-medium transition-all duration-200 ${
              currentPeriod === 'weekly'
                ? 'bg-white dark:bg-gray-600 text-[#6366F1] dark:text-indigo-400 shadow-sm'
                : 'bg-transparent text-[#6B7280] dark:text-gray-400 hover:text-[#6366F1] dark:hover:text-indigo-400'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setCurrentPeriod('monthly')}
            className={`px-3 md:px-4 py-2 border-none rounded-md font-["Inter",sans-serif] text-xs md:text-sm font-medium transition-all duration-200 ${
              currentPeriod === 'monthly'
                ? 'bg-white dark:bg-gray-600 text-[#6366F1] dark:text-indigo-400 shadow-sm'
                : 'bg-transparent text-[#6B7280] dark:text-gray-400 hover:text-[#6366F1] dark:hover:text-indigo-400'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-full" style={{ minHeight: `${chartHeight}px` }}>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={sortedData}
              layout="vertical"
              margin={margins}
              barCategoryGap="20%"
            >
              {/* Vertical grid lines aligned with X-axis ticks */}
              <CartesianGrid 
                horizontal={false} 
                vertical={true}
                stroke="#E5E7EB"
                strokeDasharray="3 3"
              />
              
              {/* Y-axis with doctor names on the LEFT */}
              <YAxis 
                type="category" 
                dataKey="name" 
                width={yAxisWidth}
                tick={{ 
                  fill: '#374151', 
                  fontSize: yAxisFontSize,
                  fontWeight: 400,
                  fontFamily: 'Inter, sans-serif'
                }}
                axisLine={{ stroke: '#D1D5DB', strokeWidth: 1 }}
                tickLine={false}
                interval={0}
              />
              
              {/* X-axis with Booking Held label at the BOTTOM */}
              <XAxis 
                type="number" 
                domain={[0, roundedMax]}
                allowDecimals={false}
                tick={{ 
                  fill: '#9CA3AF', 
                  fontSize: xAxisFontSize,
                  fontFamily: 'Inter, sans-serif'
                }}
                axisLine={{ stroke: '#D1D5DB', strokeWidth: 1 }}
                tickLine={{ stroke: '#D1D5DB', strokeWidth: 1 }}
                label={{ 
                  value: 'Booking Held', 
                  position: 'insideBottom', 
                  offset: isMobile ? -10 : -15, 
                  style: { 
                    textAnchor: 'middle', 
                    fill: '#6B7280', 
                    fontSize: labelFontSize,
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500
                  } 
                }}
              />
              
              {/* Red bars extending horizontally */}
              <Bar 
                dataKey="bookings" 
                fill="#ef4444"
                radius={[0, 0, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 md:gap-8 mt-5 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-[#6B7280] dark:text-gray-400">
          <div className="w-4 h-4 rounded bg-[#ef4444]" />
          <span>Booking Held</span>
        </div>
      </div>
    </>
  );
}

