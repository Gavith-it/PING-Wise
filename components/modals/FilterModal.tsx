'use client';

import { useState } from 'react';
import { X, Filter, Calendar } from 'lucide-react';
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
  nextAppointmentDateRange: {
    start: string;
    end: string;
  };
  assignedDoctor: string;
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
      nextAppointmentDateRange: { start: '', end: '' },
      assignedDoctor: '',
    };
    setFilters(resetFilters);
    onApply(resetFilters);
    // Don't close the modal on reset - just reset the filters
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <style dangerouslySetInnerHTML={{ __html: `
        input.filter-date-input::-webkit-calendar-picker-indicator {
          opacity: 0;
          position: absolute;
          right: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }
        /* iOS/Safari: enforce padding so date value never overlaps/cuts; same as Android */
        input.filter-date-input {
          padding-right: 2.75rem !important;
          box-sizing: border-box;
        }
        @media (max-width: 640px) {
          input.filter-date-input {
            font-size: 12px;
            -webkit-text-size-adjust: 100%;
          }
        }
      `}} />
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

            {/* Date Range - same layout as before (side-by-side), paddingRight keeps icon from covering value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Visit Date Range
              </label>
              <div className="grid grid-cols-2 gap-3 min-w-0">
                <div className="min-w-0">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={filters.dateRange.start}
                      onChange={(e) => {
                        const dateStr = e.target.value;
                        setFilters({
                          ...filters,
                          dateRange: { ...filters.dateRange, start: dateStr },
                        });
                      }}
                      className="filter-date-input w-full min-w-0 pl-2.5 pr-10 py-2 text-[11px] sm:text-xs border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer box-border [color-scheme:light] dark:[color-scheme:dark]"
                      style={{ cursor: 'pointer' }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-800 dark:text-gray-200">
                      <Calendar className="w-4 h-4" />
                    </span>
                  </div>
                </div>
                <div className="min-w-0">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">End Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={filters.dateRange.end}
                      onChange={(e) => {
                        const dateStr = e.target.value;
                        setFilters({
                          ...filters,
                          dateRange: { ...filters.dateRange, end: dateStr },
                        });
                      }}
                      min={filters.dateRange.start || undefined}
                      className="filter-date-input w-full min-w-0 pl-2.5 pr-10 py-2 text-[11px] sm:text-xs border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer box-border [color-scheme:light] dark:[color-scheme:dark]"
                      style={{ cursor: 'pointer' }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-800 dark:text-gray-200">
                      <Calendar className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Appointment Date Range - same layout, icon on far right so value visible */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Next Appointment Date Range
              </label>
              <div className="grid grid-cols-2 gap-3 min-w-0">
                <div className="min-w-0">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={filters.nextAppointmentDateRange.start}
                      onChange={(e) => {
                        const dateStr = e.target.value;
                        setFilters({
                          ...filters,
                          nextAppointmentDateRange: { ...filters.nextAppointmentDateRange, start: dateStr },
                        });
                      }}
                      className="filter-date-input w-full min-w-0 pl-2.5 pr-10 py-2 text-[11px] sm:text-xs border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer box-border [color-scheme:light] dark:[color-scheme:dark]"
                      style={{ cursor: 'pointer' }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-800 dark:text-gray-200">
                      <Calendar className="w-4 h-4" />
                    </span>
                  </div>
                </div>
                <div className="min-w-0">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">End Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={filters.nextAppointmentDateRange.end}
                      onChange={(e) => {
                        const dateStr = e.target.value;
                        setFilters({
                          ...filters,
                          nextAppointmentDateRange: { ...filters.nextAppointmentDateRange, end: dateStr },
                        });
                      }}
                      min={filters.nextAppointmentDateRange.start || undefined}
                      className="filter-date-input w-full min-w-0 pl-2.5 pr-10 py-2 text-[11px] sm:text-xs border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer box-border [color-scheme:light] dark:[color-scheme:dark]"
                      style={{ cursor: 'pointer' }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-800 dark:text-gray-200">
                      <Calendar className="w-4 h-4" />
                    </span>
                  </div>
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

