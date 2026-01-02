'use client';

import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';

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
  const [currentPeriod, setCurrentPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [isMobile, setIsMobile] = useState(false);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; visible: boolean; text: string }>({
    x: 0,
    y: 0,
    visible: false,
    text: '',
  });

  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // animate only first time + when period changes
  const hasAnimatedRef = useRef(false);
  const lastPeriodRef = useRef<'daily' | 'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Helper function to get first name from full name
  const getFirstName = (fullName: string): string => {
    if (!fullName) return '';
    // Remove "Dr." prefix if present
    let nameWithoutPrefix = fullName.replace(/^Dr\.?\s*/i, '').trim();
    
    // Split by spaces and filter out empty parts
    const nameParts = nameWithoutPrefix.split(/\s+/).filter(part => part.trim() !== '');
    
    if (nameParts.length === 0) return fullName;
    
    // If first part is a single letter or very short (like "r"), skip it and take the next part
    if (nameParts.length > 1 && nameParts[0].length <= 1) {
      return nameParts[1]; // Return second part as first name
    }
    
    // Otherwise return the first part (actual first name)
    return nameParts[0];
  };

  // Sort data by booking count (descending) and extract first names
  const sortedData = useMemo(() => {
    return [...data]
      .map(item => ({
        ...item,
        name: getFirstName(item.name)
      }))
      .sort((a, b) => b.bookings - a.bookings);
  }, [data]);

  const maxValue = Math.max(...sortedData.map((d) => d.bookings), 0);
  const roundedMax = Math.max(Math.ceil((maxValue || 10) * 1.2 / 10) * 10, 10);

  const drawChart = (animate: boolean = false) => {
    if (!svgRef.current || !wrapperRef.current || sortedData.length === 0) return;

    const svg = svgRef.current;
    const wrapper = wrapperRef.current;

    const measuredWidth = Math.round(wrapper.getBoundingClientRect().width);

    // If width is still 0 (common in cards/tabs), retry next frame
    if (!measuredWidth) {
      requestAnimationFrame(() => drawChart(animate));
      return;
    }

    svg.innerHTML = '';

    const width = Math.max(measuredWidth, 320);

    // sizing
    const barHeight = isMobile ? 32 : 40;
    const barSpacing = isMobile ? 16 : 18;

    // ✅ Move axis left - compact layout
    const padding = {
      top: 20,
      right: isMobile ? 24 : 60,
      bottom: 50,
      left: isMobile ? 70 : 100,
    };

    const height = padding.top +
      padding.bottom +
      sortedData.length * barHeight +
      (sortedData.length - 1) * barSpacing;

    let chartAreaWidth = width - padding.left - padding.right;

    // If too small, shrink left padding a bit instead of returning blank
    if (chartAreaWidth < 80) {
      padding.left = Math.max(80, padding.left - 20);
      chartAreaWidth = width - padding.left - padding.right;
    }

    // Dark mode colors
    const isDarkMode = document.documentElement.classList.contains('dark');
    const gridColor = isDarkMode ? '#374151' : '#E5E7EB';
    const textColor = isDarkMode ? '#D1D5DB' : '#374151';
    const axisColor = isDarkMode ? '#6B7280' : '#9CA3AF';
    const labelColor = '#9CA3AF';
    const barColor = '#3B82F6';

    // Set SVG size
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.width = '100%';
    svg.style.height = `${height}px`;

    const makeEl = <K extends keyof SVGElementTagNameMap>(tag: K) =>
      document.createElementNS('http://www.w3.org/2000/svg', tag);

    // --- TICKS ---
    const tickCount = isMobile ? 8 : 12;
    const step = Math.max(1, Math.ceil(roundedMax / tickCount));
    const ticks = Array.from(
      { length: Math.floor(roundedMax / step) + 1 },
      (_, i) => i * step
    );

    // --- GRID + X labels ---
    ticks.forEach((value) => {
      const x = padding.left + (value / roundedMax) * chartAreaWidth;

      const line = makeEl('line');
      line.setAttribute('x1', String(x));
      line.setAttribute('y1', String(padding.top));
      line.setAttribute('x2', String(x));
      line.setAttribute('y2', String(height - padding.bottom));
      line.setAttribute('stroke', value === 0 ? axisColor : gridColor);
      line.setAttribute('stroke-width', value === 0 ? '3' : '1.5');
      if (value !== 0) line.setAttribute('stroke-dasharray', '4 4');
      svg.appendChild(line);

      const label = makeEl('text');
      label.setAttribute('x', String(x));
      label.setAttribute('y', String(height - padding.bottom + 22));
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', isMobile ? '13' : '12');
      label.setAttribute('fill', labelColor);
      label.setAttribute('font-family', 'Inter, sans-serif');
      label.setAttribute('font-weight', '600');
      label.textContent = String(value);
      svg.appendChild(label);
    });

    // --- AXES ---
    const yAxisLine = makeEl('line');
    yAxisLine.setAttribute('x1', String(padding.left));
    yAxisLine.setAttribute('y1', String(padding.top));
    yAxisLine.setAttribute('x2', String(padding.left));
    yAxisLine.setAttribute('y2', String(height - padding.bottom));
    yAxisLine.setAttribute('stroke', axisColor);
    yAxisLine.setAttribute('stroke-width', '3');
    svg.appendChild(yAxisLine);

    const xAxisLine = makeEl('line');
    xAxisLine.setAttribute('x1', String(padding.left));
    xAxisLine.setAttribute('y1', String(height - padding.bottom));
    xAxisLine.setAttribute('x2', String(width - padding.right));
    xAxisLine.setAttribute('y2', String(height - padding.bottom));
    xAxisLine.setAttribute('stroke', axisColor);
    xAxisLine.setAttribute('stroke-width', '3');
    svg.appendChild(xAxisLine);


    // --- BARS ---
    sortedData.forEach((item, index) => {
      // Calculate y from bottom (reverse order)
      const y = height - padding.bottom - (sortedData.length - index) * barHeight - (sortedData.length - index - 1) * barSpacing;
      const barWidth = (item.bookings / roundedMax) * chartAreaWidth;

      const bar = makeEl('rect');
      bar.setAttribute('x', String(padding.left));
      bar.setAttribute('y', String(y));
      bar.setAttribute('height', String(barHeight));
      bar.setAttribute('rx', '4');
      bar.setAttribute('ry', '4');
      bar.setAttribute('fill', barColor);
      bar.setAttribute('style', 'cursor: pointer;');

      // Hover handlers for tooltip
      const handleMouseEnter = () => {
        if (!svgRef.current || !wrapperRef.current) return;
        
        const svgRect = svgRef.current.getBoundingClientRect();
        const wrapperRect = wrapperRef.current.getBoundingClientRect();
        const svgViewBox = svgRef.current.viewBox.baseVal;
        
        const scaleX = svgRect.width / svgViewBox.width;
        const scaleY = svgRect.height / svgViewBox.height;
        
        const barCenterX = padding.left + barWidth / 2;
        const barCenterY = y + barHeight / 2;
        
        const relativeX = (barCenterX * scaleX) + (wrapperRect.left - svgRect.left);
        const relativeY = (barCenterY * scaleY) + (wrapperRect.top - svgRect.top) - 12;
        
        setTooltip({
          x: relativeX,
          y: relativeY,
          visible: true,
          text: `${item.bookings} ${item.bookings === 1 ? 'booking held' : 'bookings held'}`,
        });
      };
      
      const handleMouseMove = (e: MouseEvent) => {
        if (!svgRef.current || !wrapperRef.current) return;
        
        const svgRect = svgRef.current.getBoundingClientRect();
        const wrapperRect = wrapperRef.current.getBoundingClientRect();
        const svgViewBox = svgRef.current.viewBox.baseVal;
        
        const scaleX = svgRect.width / svgViewBox.width;
        const scaleY = svgRect.height / svgViewBox.height;
        
        const barCenterX = padding.left + barWidth / 2;
        const barCenterY = y + barHeight / 2;
        
        const relativeX = (barCenterX * scaleX) + (wrapperRect.left - svgRect.left);
        const relativeY = (barCenterY * scaleY) + (wrapperRect.top - svgRect.top) - 12;
        
        setTooltip((prev) => ({
          ...prev,
          x: relativeX,
          y: relativeY,
        }));
      };

      const handleMouseLeave = () => {
        setTooltip((prev) => ({ ...prev, visible: false }));
      };

      bar.addEventListener('mouseenter', handleMouseEnter as EventListener);
      bar.addEventListener('mousemove', handleMouseMove as EventListener);
      bar.addEventListener('mouseleave', handleMouseLeave);

      if (animate) {
        bar.setAttribute('width', '0');
        bar.style.transition = 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1)';
        svg.appendChild(bar);
        setTimeout(() => {
          bar.setAttribute('width', String(barWidth));
        }, index * 90);
      } else {
        bar.setAttribute('width', String(barWidth));
        svg.appendChild(bar);
      }

      // Doctor name - positioned to the left of y-axis line
      const nameLabel = makeEl('text');
      nameLabel.setAttribute('x', String(padding.left - 12));
      nameLabel.setAttribute('y', String(y + barHeight / 2));
      nameLabel.setAttribute('text-anchor', 'end');
      nameLabel.setAttribute('dominant-baseline', 'middle');
      nameLabel.setAttribute('font-size', isMobile ? '14' : '14');
      nameLabel.setAttribute('fill', textColor);
      nameLabel.setAttribute('font-family', 'Inter, sans-serif');
      nameLabel.setAttribute('font-weight', '600');
      // Ensure we use first name (item.name should already be first name from sortedData, but double-check)
      nameLabel.textContent = getFirstName(item.name);
      svg.appendChild(nameLabel);
    });
  };

  // redraw whenever responsive stuff or data changes
  useEffect(() => {
    if (loading || sortedData.length === 0) return;

    const periodChanged = lastPeriodRef.current !== currentPeriod;
    const shouldAnimate = !hasAnimatedRef.current || periodChanged;

    drawChart(shouldAnimate);

    hasAnimatedRef.current = true;
    lastPeriodRef.current = currentPeriod;
  }, [loading, currentPeriod, isMobile, sortedData, roundedMax]);

  // ensure redraw on layout changes (because we now measure inside drawChart)
  useLayoutEffect(() => {
    if (loading || sortedData.length === 0) return;
    const raf = requestAnimationFrame(() => drawChart(false));
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
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

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white m-0">Team Metrics</h3>
        </div>

        <div className="flex bg-[#F3F4F6] dark:bg-gray-700 rounded-lg p-0.5 gap-0.5 flex-wrap">
          <button
            onClick={() => setCurrentPeriod('daily')}
            className={`px-2 py-1 border-none rounded-md font-["Inter",sans-serif] text-xs font-medium transition-all duration-200 ${
              currentPeriod === 'daily'
                ? 'bg-white dark:bg-gray-600 text-[#6366F1] dark:text-indigo-400 shadow-sm'
                : 'bg-transparent text-[#6B7280] dark:text-gray-400 hover:text-[#6366F1] dark:hover:text-indigo-400'
            }`}
          >
            Daily
          </button>

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
        </div>
      </div>

      {/* Chart */}
      <div ref={wrapperRef} className="relative w-full">
        <svg
          ref={svgRef}
          className="w-full min-h-[360px] md:min-h-[520px]"
          preserveAspectRatio="xMidYMid meet"
        />
        {/* Tooltip */}
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
          {tooltip.text}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 md:gap-8 mt-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-[#6B7280] dark:text-gray-400">
          <div className="w-4 h-4 rounded bg-[#3B82F6]" />
          <span>Bookings</span>
        </div>
      </div>
    </>
  );
}
