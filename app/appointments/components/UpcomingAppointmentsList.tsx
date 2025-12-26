'use client';

import { memo, useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Appointment } from '@/types';
import UpcomingAppointmentCard from './UpcomingAppointmentCard';

interface UpcomingAppointmentsListProps {
  upcomingAppointments: Appointment[];
  onEdit: (appointment: Appointment) => void;
  onReschedule: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
}

const ITEMS_PER_PAGE = 5;

function UpcomingAppointmentsList({
  upcomingAppointments,
  onEdit,
  onReschedule,
  onDelete,
}: UpcomingAppointmentsListProps) {
  const [page, setPage] = useState(1);

  // Calculate pagination
  const totalPages = useMemo(() => {
    return Math.ceil(upcomingAppointments.length / ITEMS_PER_PAGE);
  }, [upcomingAppointments.length]);

  const paginatedAppointments = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return upcomingAppointments.slice(startIndex, endIndex);
  }, [upcomingAppointments, page]);

  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  // Reset to page 1 when appointments list changes
  useEffect(() => {
    setPage(1);
  }, [upcomingAppointments.length]);

  // Scroll to top when page changes
  useEffect(() => {
    if (page > 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [page]);

  const handleNextPage = () => {
    if (hasNext) {
      setPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (hasPrevious) {
      setPage(prev => prev - 1);
    }
  };

  if (upcomingAppointments.length === 0) {
    return (
      <div className="text-center py-6 md:py-8">
        <Calendar className="w-8 h-8 md:w-10 md:h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2 md:mb-3" />
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">
          No pending appointments
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2 md:space-y-3">
        {paginatedAppointments.map((appointment) => (
          <UpcomingAppointmentCard
            key={appointment.id}
            appointment={appointment}
            onEdit={() => onEdit(appointment)}
            onReschedule={() => onReschedule(appointment)}
            onDelete={() => onDelete(appointment.id)}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
          {/* Previous Button */}
          <button
            onClick={handlePreviousPage}
            disabled={!hasPrevious}
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
            onClick={handleNextPage}
            disabled={!hasNext}
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

export default memo(UpcomingAppointmentsList);
