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
  currentPeriod: 'weekly' | 'monthly' | 'quarterly' | 'annually';
}

export default function TeamMetricsChart({ data, loading = false, currentPeriod }: TeamMetricsChartProps) {
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
  const lastPeriodRef = useRef<'weekly' | 'monthly' | 'quarterly' | 'annually'>('weekly');

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

    // Set SVG size - match Customer Activity Trend (400x300)
    const svgWidth = 400;
    const svgHeight = 300;
    svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
    svg.style.width = '100%';
    svg.style.height = '300px';

    // sizing - match bar width from other charts (barWidth * 0.8 from grouped bar charts)
    // In other charts: chartWidth = 310 (400 - 70 - 20), 4 labels, 3 datasets
    // groupWidth = 310 / 4 = 77.5, barWidth = 77.5 / 4 = 19.375, actual = 19.375 * 0.8 = 15.5px
    // Using 16px to match the visual thickness of bars in other charts
    const barHeight = isMobile ? 16 : 16;
    const barSpacing = isMobile ? 12 : 14;

    // ✅ Move axis left - compact layout (match Customer Activity Trend padding)
    const padding = {
      top: 20,
      right: isMobile ? 24 : 20,
      bottom: 40,
      left: isMobile ? 70 : 70,
    };

    const chartHeight = svgHeight - padding.top - padding.bottom;
    const chartAreaWidth = svgWidth - padding.left - padding.right;
    
    // Calculate available space and adjust bar spacing if needed
    const totalBarHeight = sortedData.length * barHeight;
    const totalSpacing = (sortedData.length - 1) * barSpacing;
    const totalNeeded = totalBarHeight + totalSpacing;
    
    // If data doesn't fit, reduce spacing proportionally
    let adjustedBarSpacing = barSpacing;
    if (totalNeeded > chartHeight && sortedData.length > 1) {
      adjustedBarSpacing = Math.max(8, (chartHeight - totalBarHeight) / (sortedData.length - 1));
    }

    // Dark mode colors
    const isDarkMode = document.documentElement.classList.contains('dark');
    const gridColor = isDarkMode ? '#374151' : '#E5E7EB';
    const textColor = isDarkMode ? '#D1D5DB' : '#1F2937';
    const axisColor = isDarkMode ? '#6B7280' : '#9CA3AF';
    const labelColor = isDarkMode ? '#9CA3AF' : '#1F2937';
    const barColor = '#3B82F6';

    const makeEl = <K extends keyof SVGElementTagNameMap>(tag: K) =>
      document.createElementNS('http://www.w3.org/2000/svg', tag);

    // --- TICKS ---
    const tickCount = isMobile ? 8 : 12;
    const step = Math.max(1, Math.ceil(roundedMax / tickCount));
    const ticks = Array.from(
      { length: Math.floor(roundedMax / step) + 1 },
      (_, i) => i * step
    );

    // Calculate the actual chart area where bars/names are (needed for grid lines and y-axis)
    const firstBarY = svgHeight - padding.bottom - sortedData.length * barHeight - (sortedData.length - 1) * adjustedBarSpacing;
    const lastBarY = svgHeight - padding.bottom - barHeight;
    const chartTopY = firstBarY;
    const chartBottomY = lastBarY + barHeight;

    // --- GRID + X labels ---
    ticks.forEach((value) => {
      const x = padding.left + (value / roundedMax) * chartAreaWidth;

      // Draw vertical grid line (except for x=0 which is the axis)
      // Grid lines should only extend within the chart area where bars are
      if (value !== 0) {
        const line = makeEl('line');
        line.setAttribute('x1', String(x));
        line.setAttribute('y1', String(chartTopY));
        line.setAttribute('x2', String(x));
        line.setAttribute('y2', String(chartBottomY));
        line.setAttribute('stroke', gridColor);
        line.setAttribute('stroke-width', '1');
        line.setAttribute('stroke-dasharray', '4 4');
        svg.appendChild(line);
      }

      const label = makeEl('text');
      label.setAttribute('x', String(x));
      label.setAttribute('y', String(svgHeight - padding.bottom + 20));
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', isMobile ? '13' : '12');
      label.setAttribute('fill', labelColor);
      label.setAttribute('font-family', 'Inter, sans-serif');
      label.setAttribute('font-weight', '600');
      label.textContent = String(value);
      svg.appendChild(label);
    });

    // --- AXES (drawn after grid lines so y-axis appears on top) ---
    const yAxisLine = makeEl('line');
    yAxisLine.setAttribute('x1', String(padding.left));
    yAxisLine.setAttribute('y1', String(chartTopY));
    yAxisLine.setAttribute('x2', String(padding.left));
    yAxisLine.setAttribute('y2', String(chartBottomY));
    yAxisLine.setAttribute('stroke', axisColor);
    yAxisLine.setAttribute('stroke-width', '4'); // Increased from 3 to 4 for better visibility
    svg.appendChild(yAxisLine);

    const xAxisLine = makeEl('line');
    xAxisLine.setAttribute('x1', String(padding.left));
    xAxisLine.setAttribute('y1', String(svgHeight - padding.bottom));
    xAxisLine.setAttribute('x2', String(svgWidth - padding.right));
    xAxisLine.setAttribute('y2', String(svgHeight - padding.bottom));
    xAxisLine.setAttribute('stroke', axisColor);
    xAxisLine.setAttribute('stroke-width', '3');
    svg.appendChild(xAxisLine);


    // --- BARS ---
    sortedData.forEach((item, index) => {
      // Calculate y from bottom (reverse order) - use adjusted spacing
      const y = svgHeight - padding.bottom - (sortedData.length - index) * barHeight - (sortedData.length - index - 1) * adjustedBarSpacing;
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
    if (sortedData.length === 0) return;

    const periodChanged = lastPeriodRef.current !== currentPeriod;
    const shouldAnimate = !hasAnimatedRef.current || periodChanged;

    drawChart(shouldAnimate);

    hasAnimatedRef.current = true;
    lastPeriodRef.current = currentPeriod;
  }, [currentPeriod, isMobile, sortedData, roundedMax]);

  // ensure redraw on layout changes (because we now measure inside drawChart)
  useLayoutEffect(() => {
    if (sortedData.length === 0) return;
    const raf = requestAnimationFrame(() => drawChart(false));
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

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
      </div>

      {/* Chart */}
      <div ref={wrapperRef} className="relative w-full">
        <svg
          ref={svgRef}
          className="w-full h-[300px] transition-opacity duration-500"
          viewBox="0 0 400 300"
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
      <div className="flex justify-center gap-1.5 mt-2">
        <div className="flex items-center gap-1.5 text-xs text-[#6B7280] dark:text-gray-400 whitespace-nowrap">
          <div className="w-3 h-3 rounded bg-[#3B82F6]" />
          <span>Appointment</span>
        </div>
      </div>
    </>
  );
}
