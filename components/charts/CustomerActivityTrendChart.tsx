'use client';

import { useState, useEffect, useRef } from 'react';

interface ActivityData {
  labels: string[];
  new: number[];
  active: number[];
  returning: number[];
  churned: number[];
}

const weeklyActivityData: ActivityData = {
  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
  new: [120, 150, 140, 180],
  active: [580, 620, 595, 650],
  returning: [320, 380, 350, 420],
  churned: [45, 38, 52, 41],
};

const monthlyActivityData: ActivityData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr'],
  new: [480, 600, 560, 720],
  active: [2320, 2480, 2380, 2600],
  returning: [1280, 1520, 1400, 1680],
  churned: [180, 152, 208, 164],
};

const quarterlyActivityData: ActivityData = {
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  new: [1920, 2400, 2240, 2880],
  active: [9280, 9920, 9520, 10400],
  returning: [5120, 6080, 5600, 6720],
  churned: [720, 608, 832, 656],
};

const annuallyActivityData: ActivityData = {
  labels: ['2021', '2022', '2023', '2024'],
  new: [7680, 9600, 8960, 11520],
  active: [37120, 39680, 38080, 41600],
  returning: [20480, 24320, 22400, 26880],
  churned: [2880, 2432, 3328, 2624],
};

// Colors: New Customers (Purple), Returning Customers (Pink/Red), Churned Customers (Blue), Active (keep existing)
const colors = ['#9333EA', '#EC4899', '#3B82F6', '#6366F1']; // New (Purple), Returning (Pink), Churned (Blue), Active (Indigo)

interface TooltipPosition {
  x: number;
  y: number;
  visible: boolean;
  label: string;
  value: string;
}

export default function CustomerActivityTrendChart() {
  const [currentPeriod, setCurrentPeriod] = useState<'weekly' | 'monthly' | 'quarterly' | 'annually'>('weekly');
  const [isAnimating, setIsAnimating] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipPosition>({
    x: 0,
    y: 0,
    visible: false,
    label: '',
    value: '',
  });
  const svgRef = useRef<SVGSVGElement>(null);

  const getData = (): ActivityData => {
    switch (currentPeriod) {
      case 'weekly':
        return weeklyActivityData;
      case 'monthly':
        return monthlyActivityData;
      case 'quarterly':
        return quarterlyActivityData;
      case 'annually':
        return annuallyActivityData;
      default:
        return weeklyActivityData;
    }
  };

  const activityData = getData();

  useEffect(() => {
    setIsAnimating(true);
    drawChart(true);
    const timer = setTimeout(() => setIsAnimating(false), 1200);
    return () => clearTimeout(timer);
  }, [currentPeriod]);

  const drawChart = (animate: boolean = false) => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    svg.innerHTML = '';
    
    // Fade in the SVG
    if (animate) {
      setTimeout(() => {
        if (svgRef.current) {
          svgRef.current.style.opacity = '1';
        }
      }, 100);
    } else {
      svg.style.opacity = '1';
    }

    const width = 400;
    const height = 350;
    const padding = { top: 40, right: 20, bottom: 60, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Order: new, returning, churned, active (to match color order)
    const orderedDatasets = ['new', 'returning', 'churned', 'active'] as const;

    // Calculate max value
    let maxValue = 0;
    orderedDatasets.forEach((key) => {
      maxValue = Math.max(maxValue, ...activityData[key]);
    });
    maxValue *= 1.2;

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
      label.setAttribute('x', (padding.left - 10).toString());
      label.setAttribute('y', (y + 4).toString());
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('font-size', '12');
      label.setAttribute('fill', '#9CA3AF');
      label.setAttribute('font-family', 'Inter, sans-serif');
      label.textContent = Math.round(maxValue - (maxValue / 5) * i).toString();
      svg.appendChild(label);
    }

    // Draw bars
    const groupWidth = chartWidth / activityData.labels.length;
    const barWidth = groupWidth / (orderedDatasets.length + 1);

    // Check for dark mode once (already defined above, but ensure it's available here)
    const isDarkModeForLabels = document.documentElement.classList.contains('dark');

    activityData.labels.forEach((label, i) => {
      orderedDatasets.forEach((dataset, j) => {
        const value = activityData[dataset][i];
        const barHeight = (value / maxValue) * chartHeight;
        const x = padding.left + i * groupWidth + j * barWidth + barWidth * 0.2;
        const y = padding.top + chartHeight - barHeight;

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x.toString());
        rect.setAttribute('y', isAnimating ? (padding.top + chartHeight).toString() : y.toString());
        rect.setAttribute('width', (barWidth * 0.8).toString());
        rect.setAttribute('height', isAnimating ? '0' : barHeight.toString());
        rect.setAttribute('fill', colors[j]);
        rect.setAttribute('rx', '4');
        rect.setAttribute('style', 'cursor: pointer; transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1); opacity: 0;');
        
        if (isAnimating) {
          const delay = (i * 100) + (j * 50);
          setTimeout(() => {
            rect.setAttribute('y', y.toString());
            rect.setAttribute('height', barHeight.toString());
            rect.style.opacity = '1';
          }, delay);
        } else {
          rect.setAttribute('y', y.toString());
          rect.setAttribute('height', barHeight.toString());
          rect.style.opacity = '1';
        }

        const handleMouseEnter = (e: MouseEvent | TouchEvent) => {
          if (!svgRef.current) return;
          
          // Get the chart container (parent with relative positioning)
          const chartContainer = svgRef.current.parentElement;
          if (!chartContainer) return;
          
          const svgRect = svgRef.current.getBoundingClientRect();
          const svgViewBox = svgRef.current.viewBox.baseVal;
          const svgWidth = svgRect.width;
          const svgHeight = svgRect.height;
          
          // Calculate center of the bar (top of the bar)
          const barCenterX = x + (barWidth * 0.8) / 2;
          const barTopY = y; // Top of the bar
          
          // Convert SVG coordinates to screen coordinates
          const scaleX = svgWidth / svgViewBox.width;
          const scaleY = svgHeight / svgViewBox.height;
          
          // Calculate position relative to chart container
          const relativeX = (barCenterX * scaleX);
          const relativeY = (barTopY * scaleY) - 12; // Position above the bar top
          
          const datasetLabel = dataset === 'new' ? 'New Customers' : 
                              dataset === 'active' ? 'Active' :
                              dataset === 'returning' ? 'Returning Customers' : 'Churned Customers';

          // Position tooltip relative to chart container
          setTooltip({
            x: relativeX,
            y: relativeY,
            visible: true,
            label: label,
            value: `${datasetLabel}: ${value.toLocaleString()}`,
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
          
          const barCenterX = x + (barWidth * 0.8) / 2;
          const barTopY = y;
          
          const scaleX = svgWidth / svgViewBox.width;
          const scaleY = svgHeight / svgViewBox.height;
          
          const relativeX = (barCenterX * scaleX);
          const relativeY = (barTopY * scaleY) - 12;
          
          setTooltip((prev) => ({
            ...prev,
            x: relativeX,
            y: relativeY,
          }));
        };

        const handleMouseLeave = () => {
          setTooltip((prev) => ({ ...prev, visible: false }));
        };

        rect.addEventListener('mouseenter', handleMouseEnter);
        rect.addEventListener('mousemove', handleMouseMove);
        rect.addEventListener('mouseleave', handleMouseLeave);
        rect.addEventListener('touchstart', (e) => {
          e.preventDefault();
          handleMouseEnter(e);
        });
        rect.addEventListener('touchmove', (e) => {
          e.preventDefault();
          handleMouseMove(e);
        });
        rect.addEventListener('touchend', (e) => {
          e.preventDefault();
          setTimeout(() => handleMouseLeave(), 2000);
        });

        rect.addEventListener('click', () => {
          console.log(`Clicked: ${label} - ${dataset}: ${value}`);
        });

        svg.appendChild(rect);
      });

      // X-axis labels
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', (padding.left + i * groupWidth + groupWidth / 2).toString());
      text.setAttribute('y', (height - padding.bottom + 25).toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', '#9CA3AF');
      text.setAttribute('font-family', 'Inter, sans-serif');
      text.textContent = label;
      svg.appendChild(text);
    });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-lg font-semibold text-[#1F2937] dark:text-white m-0">Customer Activity Trend</h2>
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
          <button
            onClick={() => setCurrentPeriod('quarterly')}
            className={`px-3 md:px-4 py-2 border-none rounded-md font-["Inter",sans-serif] text-xs md:text-sm font-medium transition-all duration-200 ${
              currentPeriod === 'quarterly'
                ? 'bg-white dark:bg-gray-600 text-[#6366F1] dark:text-indigo-400 shadow-sm'
                : 'bg-transparent text-[#6B7280] dark:text-gray-400 hover:text-[#6366F1] dark:hover:text-indigo-400'
            }`}
          >
            Quarterly
          </button>
          <button
            onClick={() => setCurrentPeriod('annually')}
            className={`px-3 md:px-4 py-2 border-none rounded-md font-["Inter",sans-serif] text-xs md:text-sm font-medium transition-all duration-200 ${
              currentPeriod === 'annually'
                ? 'bg-white dark:bg-gray-600 text-[#6366F1] dark:text-indigo-400 shadow-sm'
                : 'bg-transparent text-[#6B7280] dark:text-gray-400 hover:text-[#6366F1] dark:hover:text-indigo-400'
            }`}
          >
            Annually
          </button>
        </div>
      </div>

      <div className="relative w-full min-h-[300px]">
        <svg
          ref={svgRef}
          className="w-full h-[350px] transition-opacity duration-500"
          viewBox="0 0 400 350"
          preserveAspectRatio="xMidYMid meet"
        />
        <div
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

      <div className="flex justify-center gap-6 md:gap-8 mt-5 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-[#6B7280] dark:text-gray-400">
          <div className="w-4 h-4 rounded bg-[#9333EA]" />
          <span>New Customers</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#6B7280] dark:text-gray-400">
          <div className="w-4 h-4 rounded bg-[#EC4899]" />
          <span>Returning Customers</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#6B7280] dark:text-gray-400">
          <div className="w-4 h-4 rounded bg-[#3B82F6]" />
          <span>Churned Customers</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#6B7280] dark:text-gray-400">
          <div className="w-4 h-4 rounded bg-[#6366F1]" />
          <span>Active</span>
        </div>
      </div>
    </>
  );
}

