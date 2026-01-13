'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';

interface FollowUpConfirmationModalProps {
  patientName: string;
  onYes: (nextVisitDate: string) => void;
  onNo: () => void;
  onClose: () => void;
}

export default function FollowUpConfirmationModal({
  patientName,
  onYes,
  onNo,
  onClose,
}: FollowUpConfirmationModalProps) {
  // Set default date to 7 days from now
  const defaultDate = format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
  const [nextVisitDate, setNextVisitDate] = useState(defaultDate);

  const handleYes = () => {
    onYes(nextVisitDate);
  };

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
              Next Appointment Date *
            </label>
            <input
              type="date"
              required
              value={nextVisitDate}
              onChange={(e) => setNextVisitDate(e.target.value)}
              onClick={(e) => e.currentTarget.showPicker?.()}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 cursor-pointer"
              style={{ cursor: 'pointer' }}
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onNo}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              No
            </button>
            <button
              onClick={handleYes}
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

