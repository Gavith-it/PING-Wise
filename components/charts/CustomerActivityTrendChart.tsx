'use client';

import { useState, useEffect, useRef } from 'react';
import { reportsApi } from '@/lib/services/reportsApi';

interface ActivityData {
  labels: string[];
  new: number[];
  returning: number[];
  churned: number[];
}

// Colors: All blue shades
const colors = ['#60A5FA', '#3B82F6', '#1A3E9E']; // New (light blue), Returning (medium blue), Churned (dark blue)

interface TooltipPosition {
  x: number;
  y: number;
  visible: boolean;
  label: string;
  value: string;
}

interface CustomerActivityTrendChartProps {
  currentPeriod: 'weekly' | 'monthly' | 'quarterly' | 'annually';
}

export default function CustomerActivityTrendChart({ currentPeriod }: CustomerActivityTrendChartProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const [activityData, setActivityData] = useState<ActivityData>({
    labels: [],
    new: [],
    returning: [],
    churned: [],
  });
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipPosition>({
    x: 0,
    y: 0,
    visible: false,
    label: '',
    value: '',
  });
  const svgRef = useRef<SVGSVGElement>(null);

  // Fetch data from API when period changes
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Map currentPeriod to API mode format
        const modeMap: Record<string, string> = {
          'weekly': 'weekly',
          'monthly': 'monthly',
          'quarterly': 'quarterly',
          'annually': 'annually'
        };
        
        const mode = modeMap[currentPeriod] || 'weekly';
        
        // Fetch churn report from API
        const reportData = await reportsApi.getChurnReport({ mode });
        
        // Transform API response to chart data format
        // Handle different possible response structures
        let labels: string[] = [];
        let newData: number[] = [];
        let returningData: number[] = [];
        let churnedData: number[] = [];
        
        if (Array.isArray(reportData)) {
          // If API returns array directly
          labels = reportData.map((item: any) => item.label || item.period || item.date || '');
          newData = reportData.map((item: any) => item.new || item.newCustomers || item.new_count || 0);
          returningData = reportData.map((item: any) => item.returning || item.returningCustomers || item.returning_count || 0);
          churnedData = reportData.map((item: any) => item.churned || item.churnedCustomers || item.churned_count || 0);
        } else if (reportData && typeof reportData === 'object') {
          // Check if API returns week-based structure: { week1: { churnedCustomers: 0, newCustomers: 0, ... }, week2: {...}, ... }
          const weekKeys = Object.keys(reportData).filter(key => {
            const lowerKey = key.toLowerCase();
            return lowerKey.startsWith('week') || lowerKey.startsWith('month') || lowerKey.startsWith('quarter');
          });
          
          if (weekKeys.length > 0) {
            // Sort week keys to maintain order (week1, week2, week3, week4, etc.)
            weekKeys.sort((a, b) => {
              const aNum = parseInt(a.replace(/\D/g, '')) || 0;
              const bNum = parseInt(b.replace(/\D/g, '')) || 0;
              return aNum - bNum;
            });
            
            // Extract data from each week
            labels = weekKeys.map(key => {
              // Format label: "Week 1", "Month 1", etc.
              const prefix = key.toLowerCase().includes('week') ? 'Week' : 
                           key.toLowerCase().includes('month') ? 'Month' : 
                           key.toLowerCase().includes('quarter') ? 'Quarter' : '';
              const num = parseInt(key.replace(/\D/g, '')) || '';
              return prefix ? `${prefix} ${num}` : key;
            });
            
            newData = weekKeys.map(key => {
              const weekData = reportData[key];
              return weekData?.newCustomers || weekData?.new_customers || weekData?.new || 0;
            });
            
            returningData = weekKeys.map(key => {
              const weekData = reportData[key];
              return weekData?.returningCustomers || weekData?.returning_customers || weekData?.returning || 0;
            });
            
            churnedData = weekKeys.map(key => {
              const weekData = reportData[key];
              return weekData?.churnedCustomers || weekData?.churned_customers || weekData?.churned || 0;
            });
          } else {
            // If API returns object with data array
            const dataArray = reportData.data || reportData.metrics || reportData.churnData || [];
            if (Array.isArray(dataArray)) {
              labels = dataArray.map((item: any) => item.label || item.period || item.date || '');
              newData = dataArray.map((item: any) => item.new || item.newCustomers || item.new_count || 0);
              returningData = dataArray.map((item: any) => item.returning || item.returningCustomers || item.returning_count || 0);
              churnedData = dataArray.map((item: any) => item.churned || item.churnedCustomers || item.churned_count || 0);
            } else {
              // If API returns object with separate arrays
              labels = reportData.labels || reportData.periods || [];
              newData = reportData.new || reportData.newCustomers || [];
              returningData = reportData.returning || reportData.returningCustomers || [];
              churnedData = reportData.churned || reportData.churnedCustomers || [];
            }
          }
        }
        
        setActivityData({
          labels: labels.length > 0 ? labels : ['No Data'],
          new: newData.length > 0 ? newData : [0],
          returning: returningData.length > 0 ? returningData : [0],
          churned: churnedData.length > 0 ? churnedData : [0],
        });
      } catch (error) {
        console.error('Error loading churn report:', error);
        // Fallback to empty data
        setActivityData({
          labels: ['No Data'],
          new: [0],
          returning: [0],
          churned: [0],
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [currentPeriod]);

  useEffect(() => {
    if (!loading && activityData.labels.length > 0) {
      setIsAnimating(true);
      const timer1 = setTimeout(() => {
        drawChart(true);
        const timer2 = setTimeout(() => setIsAnimating(false), 1500);
        return () => clearTimeout(timer2);
      }, 50);
      return () => clearTimeout(timer1);
    }
  }, [currentPeriod, loading, activityData]);

  const drawChart = (animate: boolean = false) => {
    if (!svgRef.current || activityData.labels.length === 0) return;

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
    const height = 300;
    const padding = { top: 20, right: 20, bottom: 40, left: 70 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Order: new, returning, churned (to match color order)
    const orderedDatasets = ['new', 'returning', 'churned'] as const;

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
      label.setAttribute('x', (padding.left - 12).toString());
      label.setAttribute('y', (y + 4).toString());
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('font-size', '13');
      label.setAttribute('fill', isDarkMode ? '#D1D5DB' : '#1F2937');
      label.setAttribute('font-family', 'Inter, sans-serif');
      label.setAttribute('font-weight', '600');
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
      text.setAttribute('y', (height - padding.bottom + 20).toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', isDarkMode ? '#9CA3AF' : '#1F2937');
      text.setAttribute('font-family', 'Inter, sans-serif');
      text.setAttribute('font-weight', '600');
      text.textContent = label;
      svg.appendChild(text);
    });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
        <h2 className="text-base font-semibold text-[#1F2937] dark:text-white m-0">Customer Activity Trend</h2>
      </div>

      <div className="relative w-full">
        <svg
          ref={svgRef}
          className="w-full h-[300px] transition-opacity duration-500"
          viewBox="0 0 400 300"
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

      <div className="flex flex-col items-center gap-1.5 mt-2">
        <div className="flex justify-center gap-4 md:gap-6">
          <div className="flex items-center gap-1.5 text-xs text-[#6B7280] dark:text-gray-400 whitespace-nowrap">
            <div className="w-3 h-3 rounded bg-[#60A5FA]" />
            <span>New Customers</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#6B7280] dark:text-gray-400 whitespace-nowrap">
            <div className="w-3 h-3 rounded bg-[#3B82F6]" />
            <span>Returning Customers</span>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="flex items-center gap-1.5 text-xs text-[#6B7280] dark:text-gray-400 whitespace-nowrap">
            <div className="w-3 h-3 rounded bg-[#1A3E9E]" />
            <span>Churned Customers</span>
          </div>
        </div>
      </div>
    </>
  );
}

