'use client';

import { Filter } from 'lucide-react';

interface PatientStatusFiltersProps {
  statusFilter: string;
  onStatusChange: (status: string) => void;
  onFilterClick: () => void;
}

export default function PatientStatusFilters({ statusFilter, onStatusChange, onFilterClick }: PatientStatusFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
      {/* Status Filter Pills */}
      {['all', 'active', 'booked', 'follow-up', 'inactive'].map((status) => (
        <button
          key={status}
          onClick={() => onStatusChange(status)}
          className={`flex items-center space-x-1.5 md:space-x-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
            statusFilter === status
              ? 'bg-primary text-white shadow-md'
              : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-primary'
          }`}
        >
          <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${
            status === 'all' ? 'bg-current' :
            status === 'active' ? 'bg-green-500' :
            status === 'booked' ? 'bg-blue-500' :
            status === 'follow-up' ? 'bg-yellow-500' :
            'bg-gray-500'
          }`}></span>
          <span className="capitalize">{status === 'all' ? 'All' : status.replace('-', ' ')}</span>
        </button>
      ))}
      {/* Filter Button - Icon Only - Moved to Last */}
      <button
        onClick={onFilterClick}
        className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md"
      >
        <Filter className="w-4 h-4 md:w-5 md:h-5" />
      </button>
    </div>
  );
}
