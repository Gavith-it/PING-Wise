'use client';

import { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';

interface ScheduleModalProps {
  onClose: () => void;
  onSchedule: (date: string, time: string) => void;
  initialDate?: string;
  initialTime?: string;
}

export default function ScheduleModal({ onClose, onSchedule, initialDate, initialTime }: ScheduleModalProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    // Set default to current date and time
    const now = new Date();
    const defaultDate = initialDate || now.toISOString().split('T')[0];
    const defaultTime = initialTime || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    setDate(defaultDate);
    setTime(defaultTime);
  }, [initialDate, initialTime]);

  const handleSchedule = () => {
    if (!date || !time) {
      return;
    }

    // Check if scheduled time is in the future
    const scheduledDateTime = new Date(`${date}T${time}`);
    const now = new Date();

    if (scheduledDateTime <= now) {
      // If current or past time, send immediately
      onSchedule('', '');
    } else {
      // If future time, schedule it
      onSchedule(date, time);
    }
    onClose();
  };

  const isFutureDateTime = () => {
    if (!date || !time) return false;
    const scheduledDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    return scheduledDateTime > now;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold text-gray-900">Schedule Campaign</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>

            {date && time && (
              <div className={`p-4 rounded-xl ${
                isFutureDateTime() 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <p className={`text-sm font-medium ${
                  isFutureDateTime() ? 'text-blue-900' : 'text-yellow-900'
                }`}>
                  {isFutureDateTime() 
                    ? 'Campaign will be scheduled and sent at the specified date and time.'
                    : 'Selected time is in the past or current time. Campaign will be sent immediately.'}
                </p>
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-6">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSchedule}
              disabled={!date || !time}
              className="flex-1 bg-primary text-white py-3 px-4 rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {isFutureDateTime() ? 'Schedule Campaign' : 'Send Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

