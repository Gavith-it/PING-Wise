'use client';

import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import toast from 'react-hot-toast';

interface ScheduleModalProps {
  onClose: () => void;
  onSchedule: (date: string, time: string) => void;
  initialDate?: string;
  initialTime?: string;
  message?: string;
}

const TIME_SLOTS = [
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
  '6:00 PM',
];

export default function ScheduleModal({ onClose, onSchedule, initialDate, initialTime, message = '' }: ScheduleModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');

  useEffect(() => {
    if (initialDate && initialTime) {
      setSelectedDate(new Date(initialDate));
      setSelectedTime(initialTime);
    }
  }, [initialDate, initialTime]);

  const handleSchedule = () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select both date and time');
      return;
    }

    // Validate that scheduled date/time is in the future
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const timeStr = convertTimeTo24Hour(selectedTime);
    const scheduledDateTime = new Date(`${dateStr}T${timeStr}`);
    const now = new Date();

    if (scheduledDateTime <= now) {
      toast.error('Scheduled date and time must be in the future');
      return;
    }

    onSchedule(dateStr, timeStr);
    onClose();
  };

  const convertTimeTo24Hour = (time12h: string): string => {
    const [time, period] = time12h.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours, 10);
    
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    return `${String(hour24).padStart(2, '0')}:${minutes ? minutes.padStart(2, '0') : '00'}`;
  };

  const isDateAvailable = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    // Past dates are not available
    if (checkDate < today) return false;
    
    return true;
  };

  const isDateBusy = (date: Date): boolean => {
    // This function can be extended to check actual busy dates from API
    // For now, return false as we don't have busy dates
    return false;
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const handleDateClick = (date: Date) => {
    if (isDateAvailable(date) || isToday(date)) {
      setSelectedDate(date);
    }
  };

  const getDateClassName = (date: Date): string => {
    const baseClasses = 'w-full py-1 text-xs md:text-sm rounded-lg transition-colors border-0 outline-none focus:outline-none focus:ring-0 shadow-none';
    
    if (!isSameMonth(date, currentMonth)) {
      return `${baseClasses} text-gray-300 dark:text-gray-600 cursor-not-allowed bg-transparent`;
    }
    
    if (isToday(date)) {
      return `${baseClasses} bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600`;
    }
    
    if (isDateBusy(date)) {
      return `${baseClasses} bg-gray-800 dark:bg-gray-900 text-white cursor-not-allowed`;
    }
    
    if (selectedDate && isSameDay(date, selectedDate)) {
      return `${baseClasses} bg-primary text-white font-semibold cursor-pointer hover:bg-primary-dark`;
    }
    
    if (isDateAvailable(date)) {
      return `${baseClasses} bg-transparent text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-primary`;
    }
    
    return `${baseClasses} text-gray-400 dark:text-gray-600 cursor-not-allowed bg-transparent`;
  };

  const canSchedule = selectedDate && selectedTime;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 md:p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Schedule Campaign</h3>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>

          <div className="space-y-4 md:space-y-6">
            {/* Campaign Preview */}
            {message && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300 italic">{message}</p>
              </div>
            )}

            {/* Date & Time Selection */}
            <div className="space-y-4 md:space-y-6">
              <div>
                <h4 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white mb-3 md:mb-4 flex items-center space-x-2">
                  <CalendarIcon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  <span>Select Date & Time</span>
                </h4>
                  
                  {/* Calendar */}
                  <div className="mb-3 md:mb-4">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                      <h5 className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {format(currentMonth, 'MMMM yyyy')}
                      </h5>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={prevMonth}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          type="button"
                        >
                          <span className="text-gray-600 dark:text-gray-400 font-semibold">&lt;</span>
                        </button>
                        <button
                          onClick={nextMonth}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          type="button"
                        >
                          <span className="text-gray-600 dark:text-gray-400 font-semibold">&gt;</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5 md:gap-2 mb-3">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="text-center text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-400 py-1 md:py-2">
                          {day}
                        </div>
                      ))}
                      {calendarDays.map((day) => (
                        <button
                          key={day.toISOString()}
                          onClick={() => handleDateClick(day)}
                          disabled={!isSameMonth(day, currentMonth) || (!isDateAvailable(day) && !isToday(day))}
                          className={getDateClassName(day)}
                          type="button"
                        >
                          <span className="text-xs md:text-sm">{format(day, 'd')}</span>
                        </button>
                      ))}
                    </div>
                    
                    {/* Selected Date Display */}
                    <div className="text-center mt-2">
                      <p className="text-[10px] md:text-xs text-gray-500">
                        {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'No date selected'}
                      </p>
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div className="mt-2">
                    <h5 className="text-xs md:text-sm font-semibold text-gray-700 mb-2">Select Time</h5>
                    <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                      {TIME_SLOTS.map((timeSlot) => (
                        <button
                          key={timeSlot}
                          onClick={() => setSelectedTime(timeSlot)}
                          className={`py-1.5 md:py-2 px-2 md:px-3 rounded-lg text-[10px] md:text-sm font-medium transition-colors ${
                            selectedTime === timeSlot
                              ? 'bg-primary text-white shadow-md'
                              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-primary hover:bg-blue-50 dark:hover:bg-blue-900/20'
                          }`}
                          type="button"
                        >
                          {timeSlot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 md:space-x-3 pt-4 md:pt-6 mt-4 md:mt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 md:py-3 px-3 md:px-4 rounded-lg md:rounded-xl text-sm md:text-base font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleSchedule}
              disabled={!canSchedule}
              className="flex-1 bg-primary text-white py-2.5 md:py-3 px-3 md:px-4 rounded-lg md:rounded-xl text-sm md:text-base font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              type="button"
            >
              Schedule Campaign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

