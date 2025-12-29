'use client';

import { useState } from 'react';
import { X, Filter } from 'lucide-react';
import { SimpleDatePicker } from '@/components/ui/simple-date-picker';
import { format } from 'date-fns';

interface FilterModalProps {
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

export interface FilterOptions {
  status: string;
  dateRange: {
    start: string;
    end: string;
  };
  assignedDoctor: string;
  ageRange: {
    min: string;
    max: string;
  };
}

export default function FilterModal({ onClose, onApply, currentFilters }: FilterModalProps) {
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      status: 'all',
      dateRange: { start: '', end: '' },
      assignedDoctor: '',
      ageRange: { min: '', max: '' },
    };
    setFilters(resetFilters);
    onApply(resetFilters);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Filter Patients</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="booked">Booked</option>
                <option value="follow-up">Follow-up</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Visit Date Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
                  <SimpleDatePicker
                    date={filters.dateRange.start ? new Date(filters.dateRange.start) : undefined}
                    onDateChange={(date) => {
                      const dateStr = date ? format(date, 'yyyy-MM-dd') : '';
                      setFilters({
                        ...filters,
                        dateRange: { ...filters.dateRange, start: dateStr },
                      });
                    }}
                    placeholder="Start date"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">End Date</label>
                  <SimpleDatePicker
                    date={filters.dateRange.end ? new Date(filters.dateRange.end) : undefined}
                    onDateChange={(date) => {
                      const dateStr = date ? format(date, 'yyyy-MM-dd') : '';
                      setFilters({
                        ...filters,
                        dateRange: { ...filters.dateRange, end: dateStr },
                      });
                    }}
                    placeholder="End date"
                    minDate={filters.dateRange.start ? new Date(filters.dateRange.start) : undefined}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Age Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Age Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Min Age</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={filters.ageRange.min}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        ageRange: { ...filters.ageRange, min: e.target.value },
                      })
                    }
                    placeholder="Min"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max Age</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={filters.ageRange.max}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        ageRange: { ...filters.ageRange, max: e.target.value },
                      })
                    }
                    placeholder="Max"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Assigned Doctor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assigned Doctor
              </label>
              <input
                type="text"
                value={filters.assignedDoctor}
                onChange={(e) =>
                  setFilters({ ...filters, assignedDoctor: e.target.value })
                }
                placeholder="Search by doctor name..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleReset}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleApply}
                className="flex-1 bg-primary text-white py-3 px-4 rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-md hover:shadow-lg"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

