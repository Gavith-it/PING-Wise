'use client';

import { memo, useMemo } from 'react';
import CountUp from 'react-countup';

interface KPICardProps {
  icon: React.ElementType;
  value: number;
  label: string;
  change?: number;
  trend?: 'up' | 'down';
  isCurrency?: boolean;
  isComingSoon?: boolean;
}

const KPICard = memo(function KPICard({ icon: Icon, value, label, change, trend, isCurrency, isComingSoon }: KPICardProps) {
  const isPositive = trend === 'up';
  const changeColor = isPositive ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100';
  const changeSymbol = isPositive ? '+' : '';
  const trendIcon = isPositive ? '↑' : '↓';

  const { numericValue, prefix, suffix } = useMemo(() => {
    let numValue = 0;
    let pre = '';
    let suf = '';
    
    if (isCurrency && !isComingSoon) {
      numValue = typeof value === 'number' ? value / 1000 : parseFloat(String(value)) / 1000 || 0;
      pre = '₹';
      suf = 'K';
    } else if (!isComingSoon) {
      numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
    }
    
    return { numericValue: numValue, prefix: pre, suffix: suf };
  }, [value, isCurrency, isComingSoon]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-2 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-1.5 md:mb-4">
        <div className="w-8 h-8 md:w-14 md:h-14 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg md:rounded-xl flex items-center justify-center">
          <Icon className="w-4 h-4 md:w-7 md:h-7 text-primary" />
        </div>
        {change !== undefined && !isComingSoon && (
          <div className={`flex items-center space-x-1 text-[9px] md:text-xs font-semibold px-1 md:px-2.5 py-0.5 md:py-1 rounded-full ${changeColor}`}>
            <span>{trendIcon}</span>
            <span>{changeSymbol}{change}%</span>
          </div>
        )}
      </div>
      <div className="text-lg md:text-3xl font-bold text-gray-900 dark:text-white mb-0.5 md:mb-2">
        {isComingSoon ? (
          <span className="text-sm md:text-lg text-gray-500 dark:text-gray-400 font-medium">Coming Soon</span>
        ) : isCurrency ? (
          <>
            {prefix}
            <CountUp
              start={0}
              end={numericValue}
              decimals={1}
              duration={2.5}
              separator=","
              delay={0.2}
            />
            {suffix}
          </>
        ) : (
          <CountUp
            start={0}
            end={numericValue}
            duration={2.5}
            separator=","
            delay={0.2}
          />
        )}
      </div>
      <p className="text-[10px] md:text-sm text-gray-600 dark:text-gray-400 font-medium">{label}</p>
    </div>
  );
});

export default KPICard;
