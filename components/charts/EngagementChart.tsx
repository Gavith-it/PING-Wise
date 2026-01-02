'use client';

import { useState, useEffect, useRef } from 'react';

interface EngagementData {
  labels: string[];
  visits: number[];
  interactions: number[];
}

const weeklyEngagementData: EngagementData = {
  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
  visits: [1200, 1800, 1500, 2100],
  interactions: [800, 1200, 1100, 1600],
};

const monthlyEngagementData: EngagementData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr'],
  visits: [4500, 5200, 4800, 6100],
  interactions: [3200, 3800, 3500, 4500],
};

const quarterlyEngagementData: EngagementData = {
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  visits: [18000, 22000, 19500, 24000],
  interactions: [13000, 16000, 14500, 18000],
};

const annuallyEngagementData: EngagementData = {
  labels: ['2021', '2022', '2023', '2024'],
  visits: [72000, 85000, 92000, 105000],
  interactions: [52000, 62000, 68000, 78000],
};

interface TooltipPosition {
  x: number;
  y: number;
  visible: boolean;
  label: string;
  value: string;
}

export default function EngagementChart() {
  const [currentPeriod, setCurrentPeriod] = useState<'weekly' | 'monthly' | 'quarterly' | 'annually'>('weekly');
  const [tooltip, setTooltip] = useState<TooltipPosition>({
    x: 0,
    y: 0,
    visible: false,
    label: '',
    value: '',
  });
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const getData = () => {
    switch (currentPeriod) {
      case 'weekly':
        return weeklyEngagementData;
      case 'monthly':
        return monthlyEngagementData;
      case 'quarterly':
        return quarterlyEngagementData;
      case 'annually':
        return annuallyEngagementData;
      default:
        return weeklyEngagementData;
    }
  };

  const data = getData();

  const [isAnimating, setIsAnimating] = useState(true);

  const drawChart = (animate: boolean = false) => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    svg.innerHTML = '';

    const width = 800;
    const height = 300;
    const padding = { top: 20, right: 40, bottom: 20, left: 70 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Calculate max value
    const maxValue = Math.max(...data.visits, ...data.interactions) * 1.2;

    // Check for dark mode once
    const isDarkMode = document.documentElement.classList.contains('dark');

    // Draw grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', padding.left.toString());
      line.setAttribute('y1', y.toString());
      line.setAttribute('x2', (width - padding.right).toString());
      line.setAttribute('y2', y.toString());
      line.setAttribute('stroke', isDarkMode ? '#374151' : '#E5E7EB');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('stroke-dasharray', '4 4');
      svg.appendChild(line);

      // Y-axis labels
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', (padding.left - 12).toString());
      label.setAttribute('y', (y + 4).toString());
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('font-size', '13');
      label.setAttribute('fill', isDarkMode ? '#D1D5DB' : '#374151');
      label.setAttribute('font-family', 'Inter, sans-serif');
      label.setAttribute('font-weight', '500');
      label.textContent = Math.round(maxValue - (maxValue / 5) * i).toString();
      svg.appendChild(label);
    }

    // Draw lines and areas
    const pointsPerLine = data.labels.length;
    const xStep = chartWidth / (pointsPerLine - 1);

    // Visits (light blue) - with delay for staggered animation
    setTimeout(() => {
      drawLineWithArea(svg, data.visits, maxValue, xStep, padding, chartWidth, chartHeight, '#60A5FA', 'visits', animate);
    }, animate ? 100 : 0);

    // Interactions (dark blue) - with delay for staggered animation
    setTimeout(() => {
      drawLineWithArea(svg, data.interactions, maxValue, xStep, padding, chartWidth, chartHeight, '#1A3E9E', 'interactions', animate);
    }, animate ? 300 : 0);

  };

  useEffect(() => {
    setIsAnimating(true);
    const timer1 = setTimeout(() => {
      drawChart(true);
      const timer2 = setTimeout(() => setIsAnimating(false), 1500);
      return () => clearTimeout(timer2);
    }, 50);
    return () => clearTimeout(timer1);
  }, [currentPeriod]);
  
  useEffect(() => {
    if (!isAnimating && svgRef.current) {
      drawChart(false);
    }
  }, [data, isAnimating]);


  const drawLineWithArea = (
    svg: SVGSVGElement,
    dataPoints: number[],
    maxValue: number,
    xStep: number,
    padding: { top: number; right: number; bottom: number; left: number },
    chartWidth: number,
    chartHeight: number,
    color: string,
    type: string,
    animate: boolean = false
  ) => {
    // Draw area
    let areaPath = `M ${padding.left} ${padding.top + chartHeight}`;
    dataPoints.forEach((value, i) => {
      const x = padding.left + i * xStep;
      const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
      areaPath += ` L ${x} ${y}`;
    });
    areaPath += ` L ${padding.left + chartWidth} ${padding.top + chartHeight} Z`;

    const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    area.setAttribute('d', areaPath);
    area.setAttribute('fill', color);
    area.setAttribute('opacity', '0.1');
    svg.appendChild(area);

    // Draw line
    let linePath = '';
    dataPoints.forEach((value, i) => {
      const x = padding.left + i * xStep;
      const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
      linePath += `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    });

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    line.setAttribute('d', linePath);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '3');
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('stroke-linejoin', 'round');
    
    if (animate) {
      const pathLength = line.getTotalLength();
      line.setAttribute('stroke-dasharray', pathLength.toString());
      line.setAttribute('stroke-dashoffset', pathLength.toString());
      line.style.transition = 'stroke-dashoffset 1s ease-in-out';
      svg.appendChild(line);
      // Trigger animation
      requestAnimationFrame(() => {
        line.setAttribute('stroke-dashoffset', '0');
      });
    } else {
      svg.appendChild(line);
    }

    // Draw data points
    dataPoints.forEach((value, i) => {
      const x = padding.left + i * xStep;
      const y = padding.top + chartHeight - (value / maxValue) * chartHeight;

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x.toString());
      circle.setAttribute('cy', y.toString());
      circle.setAttribute('r', animate ? '0' : '4');
      circle.setAttribute('fill', color);
      circle.setAttribute('style', 'cursor: pointer; transition: all 0.3s ease; opacity: 0;');
      
      if (animate) {
        setTimeout(() => {
          circle.setAttribute('r', '4');
          circle.style.opacity = '1';
        }, 800 + (i * 100));
      } else {
        circle.setAttribute('r', '4');
        circle.style.opacity = '1';
      }

      const handleMouseEnter = (e: MouseEvent | TouchEvent) => {
        if (!svgRef.current) return;
        
        // Get the chart container (parent with relative positioning)
        const chartContainer = svgRef.current.parentElement;
        if (!chartContainer) return;
        const containerRect = chartContainer.getBoundingClientRect();
        
        const svgRect = svgRef.current.getBoundingClientRect();
        const svgViewBox = svgRef.current.viewBox.baseVal;
        const svgWidth = svgRect.width;
        const svgHeight = svgRect.height;
        
        // Convert SVG coordinates to screen coordinates
        const scaleX = svgWidth / svgViewBox.width;
        const scaleY = svgHeight / svgViewBox.height;
        
        // Calculate position relative to chart container
        // x and y are SVG coordinates, convert to container-relative coordinates
        const relativeX = (x * scaleX);
        const relativeY = (y * scaleY) - 12; // Position above the point with some spacing
        
        // Position tooltip relative to chart container
        setTooltip({
          x: relativeX,
          y: relativeY,
          visible: true,
          label: data.labels[i],
          value: `${type.charAt(0).toUpperCase() + type.slice(1)}: ${value.toLocaleString()}`,
        });
      };
      
      const handleMouseMove = (e: MouseEvent | TouchEvent) => {
        if (!svgRef.current) return;
        
        const chartContainer = svgRef.current.parentElement;
        if (!chartContainer) return;
        
        const svgRect = svgRef.current.getBoundingClientRect();
        const svgViewBox = svgRef.current.viewBox.baseVal;
        const svgWidth = svgRect.width;
        const svgHeight = svgRect.height;
        
        const scaleX = svgWidth / svgViewBox.width;
        const scaleY = svgHeight / svgViewBox.height;
        
        const relativeX = (x * scaleX);
        const relativeY = (y * scaleY) - 12;
        
        setTooltip((prev) => ({
          ...prev,
          x: relativeX,
          y: relativeY,
        }));
      };

      const handleMouseLeave = () => {
        setTooltip((prev) => ({ ...prev, visible: false }));
      };

      circle.addEventListener('mouseenter', handleMouseEnter);
      circle.addEventListener('mousemove', handleMouseMove);
      circle.addEventListener('mouseleave', handleMouseLeave);
      circle.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleMouseEnter(e);
      });
      circle.addEventListener('touchmove', (e) => {
        e.preventDefault();
        handleMouseMove(e);
      });
      circle.addEventListener('touchend', (e) => {
        e.preventDefault();
        setTimeout(() => handleMouseLeave(), 2000);
      });

      svg.appendChild(circle);
    });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
        <h2 className="text-base font-semibold text-[#1F2937] dark:text-white m-0">Engagement</h2>
        <div className="flex bg-[#F3F4F6] dark:bg-gray-700 rounded-lg p-0.5 gap-0.5 flex-wrap">
          <button
            onClick={() => setCurrentPeriod('weekly')}
            className={`px-2 py-1 border-none rounded-md font-["Inter",sans-serif] text-xs font-medium transition-all duration-200 ${
              currentPeriod === 'weekly'
                ? 'bg-white dark:bg-gray-600 text-[#6366F1] dark:text-indigo-400 shadow-sm'
                : 'bg-transparent text-[#6B7280] dark:text-gray-400 hover:text-[#6366F1] dark:hover:text-indigo-400'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setCurrentPeriod('monthly')}
            className={`px-2 py-1 border-none rounded-md font-["Inter",sans-serif] text-xs font-medium transition-all duration-200 ${
              currentPeriod === 'monthly'
                ? 'bg-white dark:bg-gray-600 text-[#6366F1] dark:text-indigo-400 shadow-sm'
                : 'bg-transparent text-[#6B7280] dark:text-gray-400 hover:text-[#6366F1] dark:hover:text-indigo-400'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setCurrentPeriod('quarterly')}
            className={`px-2 py-1 border-none rounded-md font-["Inter",sans-serif] text-xs font-medium transition-all duration-200 ${
              currentPeriod === 'quarterly'
                ? 'bg-white dark:bg-gray-600 text-[#6366F1] dark:text-indigo-400 shadow-sm'
                : 'bg-transparent text-[#6B7280] dark:text-gray-400 hover:text-[#6366F1] dark:hover:text-indigo-400'
            }`}
          >
            Quarterly
          </button>
          <button
            onClick={() => setCurrentPeriod('annually')}
            className={`px-2 py-1 border-none rounded-md font-["Inter",sans-serif] text-xs font-medium transition-all duration-200 ${
              currentPeriod === 'annually'
                ? 'bg-white dark:bg-gray-600 text-[#6366F1] dark:text-indigo-400 shadow-sm'
                : 'bg-transparent text-[#6B7280] dark:text-gray-400 hover:text-[#6366F1] dark:hover:text-indigo-400'
            }`}
          >
            Annually
          </button>
        </div>
      </div>

      <div className="relative w-full">
        <svg
          ref={svgRef}
          className="w-full h-[300px]"
          viewBox="0 0 800 300"
          preserveAspectRatio="xMidYMid meet"
        />
        <div
          ref={tooltipRef}
          className={`absolute bg-black/90 text-white px-3 py-2 rounded-lg text-[13px] pointer-events-none transition-opacity duration-200 z-[1000] shadow-lg whitespace-nowrap ${
            tooltip.visible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="font-semibold mb-1">{tooltip.label}</div>
          <div className="text-xs opacity-90">{tooltip.value}</div>
        </div>
      </div>

      <div className="flex justify-center gap-6 mt-2 flex-nowrap">
        <div className="flex items-center gap-1.5 text-xs text-[#6B7280] dark:text-gray-400 whitespace-nowrap">
          <div className="w-3 h-3 rounded bg-[#60A5FA]" />
          <span>Visits</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#6B7280] dark:text-gray-400 whitespace-nowrap">
          <div className="w-3 h-3 rounded bg-[#1A3E9E]" />
          <span>Interactions</span>
        </div>
      </div>
    </>
  );
}

