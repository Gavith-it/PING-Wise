'use client';

import { memo, useMemo } from 'react';
import { Appointment } from '@/types';

interface TodayAppointmentCardProps {
  appointment: Appointment;
}

const TodayAppointmentCard = memo(function TodayAppointmentCard({ appointment }: TodayAppointmentCardProps) {
  const patient = typeof appointment.patient === 'object' ? appointment.patient : null;
  const doctor = typeof appointment.doctor === 'object' ? appointment.doctor : null;
  
  const statusColor = useMemo(() => {
    switch (appointment.status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }, [appointment.status]);

  return (
    <div className="w-full p-3 md:p-4 flex items-center justify-between text-left">
      <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
        <div className={`w-8 h-8 md:w-10 md:h-10 ${patient?.avatarColor || 'bg-primary'} rounded-full flex items-center justify-center text-white text-xs md:text-sm font-medium flex-shrink-0`}>
          {patient?.initials || 'P'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm md:text-base text-gray-900 dark:text-white truncate">{patient?.name || 'Unknown'}</p>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">
            {appointment.time} • {doctor?.name || 'Doctor'} • {appointment.type || 'Consultation'}
          </p>
        </div>
      </div>
      <span className={`text-[10px] md:text-xs font-medium px-2 md:px-3 py-0.5 md:py-1 rounded-full border ${statusColor} flex-shrink-0 ml-2`}>
        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
      </span>
    </div>
  );
});

export default TodayAppointmentCard;
