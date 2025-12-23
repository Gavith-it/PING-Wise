'use client';

import { memo } from 'react';
import { Template } from '@/lib/utils/templateAdapter';
import TemplateCard from './TemplateCard';
import { getTemplateIcon, getTemplateGradient } from '../utils/templateUtils';

interface TemplatesListProps {
  templates: Template[];
  selectedTemplate: string | null;
  onTemplateClick: (template: Template) => void;
}

function TemplatesList({ templates, selectedTemplate, onTemplateClick }: TemplatesListProps) {
  return (
    <div className="mb-4 md:mb-6">
      <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4 md:mb-4">Templates</h3>
      {/* Mobile: Horizontal scroll with centered 2x2 grid */}
      <div className="md:hidden overflow-x-auto scrollbar-hide snap-x snap-mandatory">
        <div className="flex gap-0">
          {/* First 4 templates in centered 2x2 grid */}
          <div className="flex-shrink-0 snap-start w-full flex justify-center px-4">
            <div className="grid grid-cols-2 gap-4 w-full max-w-[600px]">
              {templates.slice(0, 4).map((template) => (
                <TemplateCard
                  key={template.id}
                  icon={getTemplateIcon(template.name)}
                  title={template.name}
                  subtitle="Template"
                  gradientClasses={getTemplateGradient(template.name)}
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
                  gradientClasses={getTemplateGradient(templates[4].name)}
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
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            icon={getTemplateIcon(template.name)}
            title={template.name}
            subtitle="Template"
            gradientClasses={getTemplateGradient(template.name)}
            isSelected={selectedTemplate === template.id}
            onClick={() => onTemplateClick(template)}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(TemplatesList);
