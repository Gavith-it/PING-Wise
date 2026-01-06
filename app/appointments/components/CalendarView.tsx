'use client';

import { memo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Appointment } from '@/types';
import { appointmentsCache } from '../hooks/useAppointments';

interface CalendarViewProps {
  selectedDate: Date;
  currentMonth: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange: (month: Date) => void;
  appointments: Appointment[];
  selectedDateAppointments?: Appointment[];
}

function CalendarView({ selectedDate, currentMonth, onDateSelect, onMonthChange, appointments }: CalendarViewProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getAppointmentsForDate = (date: Date) => {
    // Use isSameDay from date-fns which properly compares dates ignoring time components
    // Check both the appointments prop (current month) and all appointments from cache
    // This ensures calendar dots show pending appointments from other months too
    let allApptsToCheck = appointments;
    
    // Use all appointments from cache if available (includes appointments from all months)
    // This ensures pending appointments from future months (like follow-up dates) show dots
    if (appointmentsCache && appointmentsCache.allAppointments && appointmentsCache.allAppointments.length > 0) {
      allApptsToCheck = appointmentsCache.allAppointments;
    }
    
    return allApptsToCheck.filter(apt => {
      const aptDate = apt.date instanceof Date ? apt.date : new Date(apt.date);
      return isSameDay(aptDate, date);
    });
  };

  const getStatusColor = (status: string) => {
    // Normalize status to handle both lowercase and capitalized
    const normalized = status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() || '';
    
    switch (normalized) {
      case 'Confirmed':
        return 'bg-green-500';
      case 'Pending':
        return 'bg-orange-500';
      case 'Completed':
        return 'bg-blue-500';
      case 'Cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusDots = (dayAppointments: Appointment[]) => {
    // Only show pending appointments - return single dot if any pending appointments exist
    // Normalize status for comparison
    const hasPending = dayAppointments.some(apt => {
      const normalized = apt.status?.charAt(0).toUpperCase() + apt.status?.slice(1).toLowerCase() || '';
      return normalized === 'Pending';
    });
    return hasPending ? ['Pending'] : [];
  };

  const nextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    onMonthChange(subMonths(currentMonth, 1));
  };

  return (
    <div>
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-2 md:mb-4">
        <button
          onClick={prevMonth}
          className="p-1 md:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <h3 className="font-semibold text-sm md:text-lg text-gray-900 dark:text-white">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          onClick={nextMonth}
          className="p-1 md:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0.5 md:gap-1 mb-2 md:mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-400 py-0.5 md:py-1">
            {day}
          </div>
        ))}
        {calendarDays.map(day => {
          const dayAppointments = getAppointmentsForDate(day);
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentDay = isToday(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const statusDots = getStatusDots(dayAppointments);

          return (
            <button
              key={day.toISOString()}
              onClick={() => {
                onDateSelect(day);
                if (!isSameMonth(day, currentMonth)) {
                  onMonthChange(day);
                }
              }}
              className={`text-center py-1 md:py-1.5 rounded-md md:rounded-lg transition-colors text-[10px] md:text-xs relative ${
                !isCurrentMonth
                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  : isSelected
                  ? 'bg-primary text-white shadow-md font-semibold'
                  : isCurrentDay
                  ? 'bg-green-100 dark:bg-green-900/30 text-primary dark:text-green-400 font-semibold hover:bg-green-200 dark:hover:bg-green-900/40'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="text-xs md:text-sm">{format(day, 'd')}</div>
              {statusDots.length > 0 && isCurrentMonth && (
                <div className="flex justify-center items-center mt-0.5 md:mt-1">
                  <div
                    className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full flex-shrink-0 ${getStatusColor('Pending')}`}
                    title={`Pending appointment${dayAppointments.filter(apt => {
                      const normalized = apt.status?.charAt(0).toUpperCase() + apt.status?.slice(1).toLowerCase() || '';
                      return normalized === 'Pending';
                    }).length > 1 ? 's' : ''} on ${format(day, 'MMM d')}`}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 pt-2 md:pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-green-500"></div>
          <span className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400">Confirmed</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-orange-500"></div>
          <span className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400">Pending</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-blue-500"></div>
          <span className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400">Completed</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-red-500"></div>
          <span className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400">Cancelled</span>
        </div>
      </div>
    </div>
  );
}

export default memo(CalendarView);
