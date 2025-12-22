'use client';

import { memo } from 'react';

interface FilterCardProps {
  icon: React.ElementType;
  value: number;
  label: string;
  active: boolean;
  color?: 'blue' | 'green' | 'orange';
}

function FilterCard({ icon: Icon, value, label, active, color = 'blue' }: FilterCardProps) {
  const borderColorClasses = {
    blue: 'border-primary',
    green: 'border-green-500',
    orange: 'border-orange-500',
  };
  
  const textColorClasses = {
    blue: 'text-primary',
    green: 'text-green-600',
    orange: 'text-orange-600',
  };
  
  const iconBgClasses = {
    blue: 'bg-primary/10',
    green: 'bg-green-100',
    orange: 'bg-orange-100',
  };
  
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg md:rounded-xl p-3 md:p-5 shadow-sm border-2 text-left transition-all ${
        active
          ? `${borderColorClasses[color]} ${textColorClasses[color]} shadow-md`
          : 'border-gray-100 dark:border-gray-700'
      }`}
    >
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <div className={`w-10 h-10 md:w-12 md:h-12 ${active ? iconBgClasses[color] : 'bg-primary/10 dark:bg-primary/20'} rounded-lg flex items-center justify-center`}>
          {/* Icon always stays primary color, doesn't change on click */}
          <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
        </div>
      </div>
      <p className={`text-xl md:text-3xl font-bold mb-0.5 md:mb-1 ${active ? textColorClasses[color] : 'text-gray-900 dark:text-white'}`}>
        {value}
      </p>
      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">{label}</p>
    </div>
  );
}

export default memo(FilterCard);
