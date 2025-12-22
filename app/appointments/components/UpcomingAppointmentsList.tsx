'use client';

import { memo } from 'react';
import { Calendar } from 'lucide-react';
import { Appointment } from '@/types';
import UpcomingAppointmentCard from './UpcomingAppointmentCard';

interface UpcomingAppointmentsListProps {
  upcomingAppointments: Appointment[];
  onEdit: (appointment: Appointment) => void;
  onReschedule: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
}

function UpcomingAppointmentsList({
  upcomingAppointments,
  onEdit,
  onReschedule,
  onDelete,
}: UpcomingAppointmentsListProps) {
  if (upcomingAppointments.length === 0) {
    return (
      <div className="text-center py-6 md:py-8">
        <Calendar className="w-8 h-8 md:w-10 md:h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2 md:mb-3" />
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">
          No upcoming appointments
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 md:space-y-3">
      {upcomingAppointments.map((appointment) => (
        <UpcomingAppointmentCard
          key={appointment.id}
          appointment={appointment}
          onEdit={() => onEdit(appointment)}
          onReschedule={() => onReschedule(appointment)}
          onDelete={() => onDelete(appointment.id)}
        />
      ))}
    </div>
  );
}

export default memo(UpcomingAppointmentsList);
