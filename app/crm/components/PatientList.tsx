'use client';

import { memo } from 'react';
import { Patient } from '@/types';
import PatientCard from './PatientCard';

interface PatientListProps {
  patients: Patient[];
  loadingMore: boolean;
  hasMore: boolean;
  onView: (patient: Patient) => void;
  onEdit: (patient: Patient) => void;
  onDelete: (id: string) => void;
  onLoadMore: () => void;
  getStatusColor: (status: string) => string;
}

function PatientList({ 
  patients, 
  loadingMore, 
  hasMore, 
  onView, 
  onEdit, 
  onDelete, 
  onLoadMore,
  getStatusColor 
}: PatientListProps) {
  return (
    <>
      {/* Patient List */}
      <div className="space-y-3 pb-4">
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

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4 pb-4">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center space-x-2"
          >
            {loadingMore ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>Load More Patients</span>
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
}

export default memo(PatientList);
