'use client';

import { memo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Appointment } from '@/types';

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
    return appointments.filter(apt => {
      const aptDate = apt.date instanceof Date ? apt.date : new Date(apt.date);
      return isSameDay(aptDate, date);
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-orange-500';
      case 'completed':
        return 'bg-blue-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusDots = (dayAppointments: Appointment[]) => {
    // Group appointments by status and return array of statuses (one per appointment)
    const statusArray: string[] = [];
    dayAppointments.forEach(apt => {
      statusArray.push(apt.status || 'pending');
    });
    return statusArray;
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
              {dayAppointments.length > 0 && isCurrentMonth && (
                <div className="flex justify-center items-center flex-wrap gap-0.5 md:gap-1 mt-0.5 md:mt-1 max-w-full">
                  {statusDots.slice(0, 6).map((status, index) => (
                    <div
                      key={`${status}-${index}`}
                      className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full flex-shrink-0 ${getStatusColor(status)}`}
                      title={`${dayAppointments.length} appointment${dayAppointments.length > 1 ? 's' : ''} on ${format(day, 'MMM d')}`}
                    />
                  ))}
                  {dayAppointments.length > 6 && (
                    <span className="text-[8px] md:text-[10px] text-gray-500 dark:text-gray-400 font-semibold ml-0.5">
                      +{dayAppointments.length - 6}
                    </span>
                  )}
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
