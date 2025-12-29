'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';

interface SimpleDatePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxDate?: Date;
  minDate?: Date;
}

export function SimpleDatePicker({
  date,
  onDateChange,
  placeholder = "Select date",
  className,
  disabled = false,
  maxDate,
  minDate,
}: SimpleDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(date ? startOfMonth(date) : startOfMonth(new Date()));
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close calendar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowYearPicker(false);
        setShowMonthPicker(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const currentYear = currentMonth.getFullYear();
  const currentMonthIndex = currentMonth.getMonth();

  // Generate years list (from 1900 to 20 years in future)
  const years = Array.from({ length: new Date().getFullYear() + 20 - 1900 + 1 }, (_, i) => 1900 + i);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const handleDateSelect = (day: Date) => {
    if (disabled) return;
    
    // Check min/max date constraints
    if (minDate && day < minDate) return;
    if (maxDate && day > maxDate) return;
    
    onDateChange(day);
    setIsOpen(false);
    setShowYearPicker(false);
    setShowMonthPicker(false);
  };

  const handleYearSelect = (year: number) => {
    setCurrentMonth(new Date(year, currentMonthIndex, 1));
    setShowYearPicker(false);
  };

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentMonth(new Date(currentYear, monthIndex, 1));
    setShowMonthPicker(false);
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const isDateDisabled = (day: Date) => {
    if (minDate && day < minDate) return true;
    if (maxDate && day > maxDate) return true;
    return false;
  };

  const isDateSelected = (day: Date) => {
    return date ? isSameDay(day, date) : false;
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-start text-left px-2 md:px-3 py-2 h-10",
          "border border-gray-300 dark:border-gray-600 rounded-xl",
          "bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
          "hover:bg-gray-50 dark:hover:bg-gray-600",
          "focus:outline-none focus:ring-2 focus:ring-primary",
          "overflow-hidden",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <CalendarIcon className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
        <span className={cn("flex-1 text-xs md:text-sm whitespace-nowrap overflow-hidden text-ellipsis", !date && "text-gray-400")}>
          {date ? format(date, "dd-MM-yyyy") : placeholder}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-1.5 md:p-3 w-[240px] md:w-[320px] max-w-[calc(100vw-2rem)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-1.5 md:mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-0.5 md:p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
            </button>

            <div className="flex items-center gap-1 md:gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowMonthPicker(!showMonthPicker);
                  setShowYearPicker(false);
                }}
                className="px-1 md:px-2 py-0.5 md:py-1 text-[10px] md:text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                {months[currentMonthIndex].slice(0, 3)}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowYearPicker(!showYearPicker);
                  setShowMonthPicker(false);
                }}
                className="px-1 md:px-2 py-0.5 md:py-1 text-[10px] md:text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                {currentYear}
              </button>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="p-0.5 md:p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
            </button>
          </div>

          {/* Year Picker */}
          {showYearPicker && (
            <div className="mb-1.5 md:mb-3 max-h-36 md:max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded p-1 md:p-2">
              <div className="grid grid-cols-5 gap-0.5 md:gap-1">
                {years.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => handleYearSelect(year)}
                    className={cn(
                      "px-0.5 md:px-2 py-0.5 md:py-1 text-[9px] md:text-xs rounded hover:bg-primary hover:text-white",
                      year === currentYear && "bg-primary text-white"
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Month Picker */}
          {showMonthPicker && (
            <div className="mb-1.5 md:mb-3 border border-gray-200 dark:border-gray-700 rounded p-1 md:p-2">
              <div className="grid grid-cols-3 gap-0.5 md:gap-1">
                {months.map((month, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleMonthSelect(index)}
                    className={cn(
                      "px-1 md:px-2 py-0.5 md:py-1 text-[9px] md:text-xs rounded hover:bg-primary hover:text-white",
                      index === currentMonthIndex && "bg-primary text-white"
                    )}
                  >
                    {month.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Calendar Grid */}
          {!showYearPicker && !showMonthPicker && (
            <>
              <div className="grid grid-cols-7 gap-0.5 mb-1 md:mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <div key={day} className="text-center text-[9px] md:text-xs font-medium text-gray-500 dark:text-gray-400 py-0.5">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {calendarDays.map((day, index) => {
                  const isCurrentMonth = day.getMonth() === currentMonthIndex;
                  const isSelected = isDateSelected(day);
                  const isTodayDate = isToday(day);
                  const isDisabled = isDateDisabled(day);

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleDateSelect(day)}
                      disabled={isDisabled}
                      className={cn(
                        "h-4 w-4 md:h-7 md:w-7 text-[8px] md:text-xs rounded transition-colors flex items-center justify-center font-medium",
                        !isCurrentMonth && "text-gray-300 dark:text-gray-600",
                        isCurrentMonth && !isSelected && !isTodayDate && !isDisabled && "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300",
                        isTodayDate && !isSelected && !isDisabled && "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-50 font-semibold",
                        isSelected && "bg-primary text-white font-semibold shadow-sm",
                        isDisabled && "opacity-30 cursor-not-allowed text-gray-400"
                      )}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

