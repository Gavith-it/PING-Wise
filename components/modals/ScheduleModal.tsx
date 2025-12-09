'use client';

import { useState, useEffect } from 'react';
import { X, Send, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays } from 'date-fns';
import toast from 'react-hot-toast';

interface ScheduleModalProps {
  onClose: () => void;
  onSchedule: (date: string, time: string) => void;
  initialDate?: string;
  initialTime?: string;
  message?: string;
}

type ScheduleOption = 'now' | 'later';

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
  const [scheduleOption, setScheduleOption] = useState<ScheduleOption>('now');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');

  useEffect(() => {
    if (initialDate && initialTime) {
      setScheduleOption('later');
      setSelectedDate(new Date(initialDate));
      setSelectedTime(initialTime);
    }
  }, [initialDate, initialTime]);

  const handleSchedule = () => {
    if (scheduleOption === 'now') {
      onSchedule('', '');
      onClose();
      return;
    }

    if (!selectedDate || !selectedTime) {
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
    
    // For demo purposes, mark some dates as busy (e.g., 24th and 25th of any month)
    const dayOfMonth = checkDate.getDate();
    if (dayOfMonth === 24 || dayOfMonth === 25) {
      return false;
    }
    
    return true;
  };

  const isDateBusy = (date: Date): boolean => {
    const dayOfMonth = date.getDate();
    return dayOfMonth === 24 || dayOfMonth === 25;
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
    const baseClasses = 'w-full py-2 text-sm rounded-md transition-colors';
    
    if (!isSameMonth(date, currentMonth)) {
      return `${baseClasses} text-gray-300 cursor-not-allowed`;
    }
    
    if (isToday(date)) {
      return `${baseClasses} bg-gray-200 text-gray-700 font-medium cursor-pointer hover:bg-gray-300`;
    }
    
    if (isDateBusy(date)) {
      return `${baseClasses} bg-gray-800 text-white cursor-not-allowed`;
    }
    
    if (selectedDate && isSameDay(date, selectedDate)) {
      return `${baseClasses} bg-primary text-white font-semibold cursor-pointer hover:bg-primary-dark`;
    }
    
    if (isDateAvailable(date)) {
      return `${baseClasses} bg-white text-gray-700 cursor-pointer hover:bg-blue-50 hover:text-primary`;
    }
    
    return `${baseClasses} text-gray-400 cursor-not-allowed`;
  };

  const canSchedule = scheduleOption === 'now' || (selectedDate && selectedTime);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Schedule Campaign</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Campaign Preview */}
            {message && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-700 italic">{message}</p>
              </div>
            )}

            {/* Schedule Options */}
            <div>
              <h4 className="text-base font-semibold text-gray-900 mb-4">Schedule Options</h4>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="scheduleOption"
                    value="now"
                    checked={scheduleOption === 'now'}
                    onChange={() => setScheduleOption('now')}
                    className="w-4 h-4 text-primary focus:ring-primary focus:ring-2"
                  />
                  <Send className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Send Now</span>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="scheduleOption"
                    value="later"
                    checked={scheduleOption === 'later'}
                    onChange={() => setScheduleOption('later')}
                    className="w-4 h-4 text-primary focus:ring-primary focus:ring-2"
                  />
                  <CalendarIcon className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Schedule for Later</span>
                </label>
              </div>
            </div>

            {/* Date & Time Selection - Only show when "Schedule for Later" is selected */}
            {scheduleOption === 'later' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Select Date & Time</h4>
                  
                  {/* Calendar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-sm font-semibold text-gray-700">
                        {format(currentMonth, 'MMMM yyyy')}
                      </h5>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={prevMonth}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          type="button"
                        >
                          <span className="text-gray-600 font-semibold">&lt;</span>
                        </button>
                        <button
                          onClick={nextMonth}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          type="button"
                        >
                          <span className="text-gray-600 font-semibold">&gt;</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-4">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
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
                          {format(day, 'd')}
                        </button>
                      ))}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4 text-xs">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                          <span className="text-gray-600">Today</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-white border border-gray-300"></div>
                          <span className="text-gray-600">Available</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-gray-800"></div>
                          <span className="text-gray-600">Busy</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'No date selected'}
                      </div>
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-3">Select Time</h5>
                    <div className="grid grid-cols-3 gap-2">
                      {TIME_SLOTS.map((timeSlot) => (
                        <button
                          key={timeSlot}
                          onClick={() => setSelectedTime(timeSlot)}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            selectedTime === timeSlot
                              ? 'bg-primary text-white shadow-md'
                              : 'bg-white text-gray-700 border border-gray-200 hover:border-primary hover:bg-blue-50'
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
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-6 mt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 bg-white text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-50 transition-colors border border-gray-200"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleSchedule}
              disabled={!canSchedule}
              className="flex-1 bg-primary text-white py-3 px-4 rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
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

