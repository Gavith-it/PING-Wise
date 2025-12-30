'use client';

import { X } from 'lucide-react';

interface TeamFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    status: string;
    department: string;
  };
  onFilterChange: (filters: { status: string; department: string }) => void;
  departments: string[];
}

export default function TeamFilterModal({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  departments,
}: TeamFilterModalProps) {
  if (!isOpen) return null;

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'OnLeave', label: 'On Leave' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const departmentOptions = [
    { value: 'all', label: 'All Departments' },
    ...departments.map(dept => ({ value: dept, label: dept })),
  ];

  const handleStatusChange = (status: string) => {
    onFilterChange({ ...filters, status });
  };

  const handleDepartmentChange = (department: string) => {
    onFilterChange({ ...filters, department });
  };

  const handleReset = () => {
    onFilterChange({ status: 'all', department: 'all' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl w-full max-w-md">
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Filter Team Members</h3>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>

          {/* Filters */}
          <div className="space-y-4 md:space-y-6">
            {/* Status Filter */}
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-2 md:mb-3">
                Status
              </label>
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    className={`px-3 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl text-sm md:text-base font-medium transition-colors ${
                      filters.status === option.value
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-2 md:mb-3">
                Department
              </label>
              <div className="space-y-2">
                {departmentOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleDepartmentChange(option.value)}
                    className={`w-full px-3 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl text-sm md:text-base font-medium text-left transition-colors ${
                      filters.department === option.value
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 md:gap-3 pt-4 md:pt-6 mt-4 md:mt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleReset}
              className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 md:py-3 px-4 rounded-lg md:rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm md:text-base"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-primary text-white py-2.5 md:py-3 px-4 rounded-lg md:rounded-xl font-medium hover:bg-primary-dark transition-colors text-sm md:text-base"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

