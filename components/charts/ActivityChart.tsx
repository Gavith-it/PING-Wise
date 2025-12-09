'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import CountUp from 'react-countup';

interface ActivityData {
  total?: number;
  active?: {
    count?: number;
    percentage?: number;
  };
  booked?: {
    count?: number;
    percentage?: number;
  };
  followUp?: {
    count?: number;
    percentage?: number;
  };
}

interface ActivityChartProps {
  data: ActivityData;
}

export default function ActivityChart({ data }: ActivityChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartData = [
    {
      name: 'Active',
      value: data.active?.count || 0,
      percentage: data.active?.percentage || 0,
      color: '#10b981', // Medical green
    },
    {
      name: 'Booked',
      value: data.booked?.count || 0,
      percentage: data.booked?.percentage || 0,
      color: '#34d399', // Light green
    },
    {
      name: 'Churned',
      value: data.followUp?.count || 0,
      percentage: data.followUp?.percentage || 0,
      color: '#14b8a6', // Teal green
    },
  ];

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const onPieClick = (_: unknown, index: number) => {
    // For mobile touch support
    setActiveIndex(index);
    setTimeout(() => {
      setActiveIndex(null);
    }, 500);
  };

  return (
    <div className="flex flex-row items-center gap-4 md:gap-6">
      {/* Chart */}
      <div className="relative w-36 h-36 md:w-40 md:h-40 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={60}
              paddingAngle={2}
              dataKey="value"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              onClick={onPieClick}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  opacity={activeIndex === index ? 1 : activeIndex === null ? 1 : 0.5}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl md:text-2xl font-bold text-gray-900">
            <CountUp
              start={0}
              end={data.total || 0}
              duration={2.5}
              separator=","
              delay={0.3}
            />
          </span>
          <span className="text-[10px] md:text-xs text-gray-500 mt-0.5">Total</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2 md:space-y-2.5">
        {chartData.map((entry, index) => (
          <div
            key={entry.name}
            className="flex items-center gap-2 touch-manipulation"
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            onTouchStart={() => setActiveIndex(index)}
            onTouchEnd={() => {
              setTimeout(() => {
                setActiveIndex(null);
              }, 500);
            }}
            onClick={() => {
              setActiveIndex(index);
              setTimeout(() => {
                setActiveIndex(null);
              }, 500);
            }}
            style={{
              opacity: activeIndex === index ? 1 : activeIndex === null ? 1 : 0.5,
            }}
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <div className="flex-1">
              <div className="font-semibold text-xs md:text-sm text-gray-900">{entry.name}</div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm md:text-base font-bold text-gray-900">
                <CountUp
                  start={0}
                  end={entry.value}
                  duration={2}
                  separator=","
                  delay={0.2}
                />
              </span>
              <span className="text-[10px] md:text-xs text-gray-500">
                ({entry.percentage}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
