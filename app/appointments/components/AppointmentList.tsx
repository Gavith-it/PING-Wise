'use client';

import { memo } from 'react';
import { Calendar } from 'lucide-react';
import { Appointment } from '@/types';
import AppointmentCard from './AppointmentCard';

interface AppointmentListProps {
  appointments: Appointment[];
  loading: boolean;
  searchTerm: string;
  statusFilter: 'all' | 'confirmed' | 'pending' | 'cancelled';
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
  onAddClick: () => void;
}

function AppointmentList({
  appointments,
  loading,
  searchTerm,
  statusFilter,
  onEdit,
  onDelete,
  onAddClick,
}: AppointmentListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-6 md:py-8">
        <Calendar className="w-10 h-10 md:w-12 md:h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2 md:mb-3" />
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
          {searchTerm || statusFilter !== 'all' 
            ? 'No appointments found matching your criteria'
            : 'No appointments scheduled for this date'}
        </p>
        {!searchTerm && statusFilter === 'all' && (
          <>
            <p className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 mb-2 md:mb-3">Schedule an appointment to get started</p>
            <button
              onClick={onAddClick}
              className="bg-primary text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-medium hover:bg-primary-dark transition-colors shadow-sm"
            >
              Schedule Appointment
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5 md:space-y-2">
      {appointments.map((appointment) => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          onEdit={() => onEdit(appointment)}
          onDelete={() => onDelete(appointment.id)}
        />
      ))}
    </div>
  );
}

export default memo(AppointmentList);
