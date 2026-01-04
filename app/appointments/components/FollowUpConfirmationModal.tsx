'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';

interface FollowUpConfirmationModalProps {
  patientName: string;
  onYes: (followUpDate: Date) => void;
  onNo: () => void;
  onClose: () => void;
}

export default function FollowUpConfirmationModal({
  patientName,
  onYes,
  onNo,
  onClose,
}: FollowUpConfirmationModalProps) {
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [dateError, setDateError] = useState<string>('');

  const handleYesClick = () => {
    if (!followUpDate) {
      setDateError('Please select a follow-up date');
      return;
    }
    
    // Ensure date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(followUpDate);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setDateError('Follow-up date cannot be in the past');
      return;
    }
    
    onYes(selectedDate);
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Follow-up Confirmation
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-4">
            Do you want follow-up for <span className="font-semibold">{patientName}</span>?
          </p>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Follow-up Date *
            </label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => {
                setFollowUpDate(e.target.value);
                setDateError('');
              }}
              min={todayStr}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {dateError && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{dateError}</p>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onNo}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              No
            </button>
            <button
              onClick={handleYesClick}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
            >
              Yes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

