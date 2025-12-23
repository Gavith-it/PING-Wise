'use client';

import { memo } from 'react';

interface TemplateCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  gradientClasses: string;
  isSelected?: boolean;
  onClick?: () => void;
}

function TemplateCard({ icon: Icon, title, subtitle, gradientClasses, isSelected, onClick }: TemplateCardProps) {
  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-r ${gradientClasses} rounded-[20px] md:rounded-[22px] w-full h-[120px] md:h-[140px] max-w-[260px] mx-auto relative overflow-hidden hover:scale-[1.02] transition-transform ${
        isSelected ? 'ring-2 ring-white ring-opacity-50' : ''
      }`}
    >
      {/* Icon: 16px from top and left */}
      <div className="absolute top-4 left-4">
        <Icon className="w-5 h-5 md:w-6 md:h-6 text-white stroke-2" />
      </div>
      {/* Title and Subtitle: 8-10px gap below icon, 16px left padding */}
      <div className="absolute top-[44px] md:top-[48px] left-4">
        <p className="text-white font-semibold text-sm md:text-base leading-tight text-left">{title}</p>
        <p className="text-xs md:text-sm mt-1 text-left" style={{ color: '#FFFFFF99' }}>{subtitle}</p>
      </div>
    </button>
  );
}

export default memo(TemplateCard);
