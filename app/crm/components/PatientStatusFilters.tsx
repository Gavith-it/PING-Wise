'use client';

import { Filter } from 'lucide-react';
import { CustomerStatus, normalizeCustomerStatus, customerStatusToApiFormat } from '@/lib/constants/status';

interface PatientStatusFiltersProps {
  statusFilter: string;
  onStatusChange: (status: string) => void;
  onFilterClick: () => void;
}

export default function PatientStatusFilters({ statusFilter, onStatusChange, onFilterClick }: PatientStatusFiltersProps) {
  // Standardized status list with 'all' option
  const statusOptions = ['all', ...Object.values(CustomerStatus)];
  
  // Normalize the current filter to compare properly
  const normalizedFilter = statusFilter === 'all' ? 'all' : normalizeCustomerStatus(statusFilter);
  
  // Helper to get display name
  const getStatusDisplayName = (status: string): string => {
    if (status === 'all') return 'All';
    const normalized = normalizeCustomerStatus(status);
    return normalized;
  };
  
  // Helper to get color for status dot
  const getStatusColor = (status: string): string => {
    if (status === 'all') return 'bg-current';
    const normalized = normalizeCustomerStatus(status);
    if (normalized === CustomerStatus.Active) return 'bg-green-500';
    if (normalized === CustomerStatus.Booked) return 'bg-blue-500';
    if (normalized === CustomerStatus.FollowUp) return 'bg-yellow-500';
    if (normalized === CustomerStatus.Inactive) return 'bg-gray-500';
    return 'bg-gray-500';
  };
  
  // Helper to check if a status option is selected
  const isStatusSelected = (status: string): boolean => {
    if (status === 'all') {
      return normalizedFilter === 'all';
    }
    const normalized = normalizeCustomerStatus(status);
    return normalized === normalizedFilter;
  };
  
  return (
    <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
      {/* Status Filter Pills */}
      {statusOptions.map((status) => (
        <button
          key={status}
          onClick={() => onStatusChange(status === 'all' ? 'all' : status)}
          className={`flex items-center space-x-1.5 md:space-x-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
            isStatusSelected(status)
              ? 'bg-primary text-white shadow-md'
              : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-primary'
          }`}
        >
          <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${getStatusColor(status)}`}></span>
          <span>{getStatusDisplayName(status)}</span>
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
