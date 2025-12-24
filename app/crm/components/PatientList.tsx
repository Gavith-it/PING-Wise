'use client';

import { memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Patient } from '@/types';
import PatientCard from './PatientCard';

interface PatientListProps {
  patients: Patient[];
  loadingMore: boolean;
  hasMore: boolean;
  hasPrevious: boolean;
  page: number;
  totalPages: number;
  onView: (patient: Patient) => void;
  onEdit: (patient: Patient) => void;
  onDelete: (id: string) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  getStatusColor: (status: string) => string;
}

function PatientList({ 
  patients, 
  loadingMore, 
  hasMore, 
  hasPrevious,
  page,
  totalPages,
  onView, 
  onEdit, 
  onDelete, 
  onNextPage,
  onPreviousPage,
  getStatusColor 
}: PatientListProps) {
  // Only show pagination if there are multiple pages
  const showPagination = totalPages > 1;

  return (
    <>
      {/* Patient List */}
      <div className="space-y-1.5 md:space-y-2 pb-4">
        {patients.map((patient) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            onView={() => onView(patient)}
            onEdit={() => onEdit(patient)}
            onDelete={() => onDelete(patient.id)}
            getStatusColor={getStatusColor}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {showPagination && (
        <div className="flex items-center justify-between pt-4 pb-4 border-t border-gray-200 dark:border-gray-700">
          {/* Previous Button */}
          <button
            onClick={onPreviousPage}
            disabled={!hasPrevious || loadingMore}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Page Info */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page <span className="font-semibold text-gray-900 dark:text-white">{page}</span> of{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span>
          </div>

          {/* Next Button */}
          <button
            onClick={onNextPage}
            disabled={!hasMore || loadingMore}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}

export default memo(PatientList);
