'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import CountUp from 'react-countup';
import { ActivityData } from '@/types';

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
      color: '#10b981',
    },
    {
      name: 'Booked',
      value: data.booked?.count || 0,
      percentage: data.booked?.percentage || 0,
      color: '#34d399',
    },
    {
      name: 'Follow-up',
      value: data.followUp?.count || 0,
      percentage: data.followUp?.percentage || 0,
      color: '#14b8a6',
    },
  ];

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  return (
    <div className="flex flex-row items-start gap-3 md:gap-6">
      <div className="relative w-28 h-28 md:w-48 md:h-48 lg:w-56 lg:h-56 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="50%"
              outerRadius="75%"
              paddingAngle={1}
              dataKey="value"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
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
        
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-sm md:text-xl lg:text-2xl font-bold text-gray-900">
            <CountUp
              start={0}
              end={activeIndex !== null ? chartData[activeIndex].value : data.total || 0}
              duration={activeIndex !== null ? 0.3 : 2.5}
              separator=","
              delay={activeIndex !== null ? 0 : 0.3}
              key={activeIndex !== null ? chartData[activeIndex].value : data.total || 0}
            />
          </span>
          <span className="text-[9px] md:text-xs text-gray-500">
            {activeIndex !== null ? chartData[activeIndex].name : 'Total'}
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-1.5 md:space-y-3 min-w-0">
        {chartData.map((item, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-1 md:p-2 rounded-lg transition-colors ${
              activeIndex === index ? 'bg-gray-50' : ''
            }`}
          >
            <div className="flex items-center space-x-1.5 md:space-x-3 min-w-0 flex-1">
              <div
                className="w-2 h-2 md:w-3 md:h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-xs md:text-sm font-medium text-gray-700 truncate">{item.name}</span>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <span className="text-xs md:text-sm font-bold text-gray-900">
                <CountUp
                  start={0}
                  end={item.value}
                  duration={2.5}
                  separator=","
                  delay={0.4 + index * 0.1}
                />
              </span>
              <span className="text-[9px] md:text-xs text-gray-500 ml-0.5 md:ml-1">
                ({item.percentage}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

