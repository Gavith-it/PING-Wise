'use client';

import { memo } from 'react';
import { Template } from '@/lib/utils/templateAdapter';
import TemplateCard from './TemplateCard';
import { getTemplateIcon, getTemplateGradient } from '../utils/templateUtils';

interface TemplatesListProps {
  templates: Template[];
  selectedTemplate: string | null;
  onTemplateClick: (template: Template) => void;
  loading?: boolean;
}

function TemplatesList({ templates, selectedTemplate, onTemplateClick, loading = false }: TemplatesListProps) {
  return (
    <div className="mb-4 md:mb-6">
      <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4 md:mb-4">Templates</h3>
      {loading ? (
        <div className="flex items-center justify-center py-8 md:py-12">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-b-2 border-primary"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading templates...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile: Horizontal scroll with centered 2x2 grid */}
          <div className="md:hidden overflow-x-auto scrollbar-hide snap-x snap-mandatory">
        <div className="flex gap-0">
          {/* First 4 templates in centered 2x2 grid */}
          <div className="flex-shrink-0 snap-start w-full flex justify-center px-4">
            <div className="grid grid-cols-2 gap-4 w-full max-w-[600px]">
              {templates.slice(0, 4).map((template, index) => (
                <TemplateCard
                  key={template.id}
                  icon={getTemplateIcon(template.name)}
                  title={template.name}
                  subtitle="Template"
                  gradientClasses={getTemplateGradient(index)}
                  isSelected={selectedTemplate === template.id}
                  onClick={() => onTemplateClick(template)}
                />
              ))}
            </div>
          </div>
          {/* 5th template - accessible by scrolling */}
          {templates.length > 4 && (
            <div className="flex-shrink-0 snap-start w-full flex justify-center px-4">
              <div className="grid grid-cols-2 gap-4 w-full max-w-[600px]">
                <TemplateCard
                  icon={getTemplateIcon(templates[4].name)}
                  title={templates[4].name}
                  subtitle="Template"
                  gradientClasses={getTemplateGradient(4)}
                  isSelected={selectedTemplate === templates[4].id}
                  onClick={() => onTemplateClick(templates[4])}
                />
                <div></div> {/* Empty space to maintain grid */}
              </div>
            </div>
          )}
        </div>
      </div>
          {/* Desktop: All cards in a single row */}
          <div className="hidden md:grid md:grid-cols-5 gap-4">
            {templates.map((template, index) => (
              <TemplateCard
                key={template.id}
                icon={getTemplateIcon(template.name)}
                title={template.name}
                subtitle="Template"
                gradientClasses={getTemplateGradient(index)}
                isSelected={selectedTemplate === template.id}
                onClick={() => onTemplateClick(template)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default memo(TemplatesList);
