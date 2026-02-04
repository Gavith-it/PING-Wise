'use client';

import { memo } from 'react';
import { CalendarX } from 'lucide-react';
import { Appointment } from '@/types';
import { formatTime } from '../utils/formatUtils';

// Same avatar color logic as AppointmentCard
function getAvatarColor(patient: { avatarColor?: string; name?: string; id?: string } | null): string {
  const validColors = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-red-500',
    'bg-orange-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500',
    'bg-violet-500', 'bg-fuchsia-500', 'bg-rose-500', 'bg-amber-500',
    'bg-sky-500', 'bg-blue-600', 'bg-purple-600', 'bg-green-600',
    'bg-red-600', 'bg-orange-600', 'bg-indigo-600', 'bg-pink-600'
  ];
  if (patient?.avatarColor && validColors.includes(patient.avatarColor)) return patient.avatarColor;
  if (patient?.name) {
    let hash = 0;
    const name = patient.name.trim().toLowerCase();
    for (let i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash) + name.charCodeAt(i);
      hash = hash & hash;
    }
    return validColors[Math.abs(hash) % validColors.length];
  }
  if (patient?.id) {
    let hash = 0;
    const idStr = String(patient.id);
    for (let i = 0; i < idStr.length; i++) {
      hash = ((hash << 5) - hash) + idStr.charCodeAt(i);
      hash = hash & hash;
    }
    return validColors[Math.abs(hash) % validColors.length];
  }
  return 'bg-blue-500';
}

interface CancelledAppointmentsListProps {
  cancelledAppointments: Appointment[];
}

function CancelledAppointmentsList({ cancelledAppointments }: CancelledAppointmentsListProps) {
  if (cancelledAppointments.length === 0) {
    return (
      <div className="text-center py-6 md:py-8">
        <CalendarX className="w-8 h-8 md:w-10 md:h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2 md:mb-3" />
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">
          No cancelled appointments
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 md:space-y-3">
      {cancelledAppointments.map((appointment) => {
        const patient = typeof appointment.patient === 'object' ? appointment.patient : null;
        const doctor = typeof appointment.doctor === 'object' ? appointment.doctor : null;
        const avatarColor = getAvatarColor(patient);
        return (
          <div
            key={appointment.id}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg md:rounded-xl p-2.5 md:p-4 pr-3 md:pr-5 border-l-4 border-l-red-500 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2 md:space-x-3 flex-1 min-w-0">
                <div className={`w-8 h-8 md:w-10 md:h-10 ${avatarColor} rounded-full flex items-center justify-center text-white text-[10px] md:text-xs font-semibold flex-shrink-0`}>
                  {patient?.initials || 'P'}
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <p className="font-semibold text-xs md:text-sm text-gray-900 dark:text-white mb-0.5 md:mb-1 truncate">
                    {patient?.name || 'Unknown'}
                  </p>
                  <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mb-0.5 whitespace-nowrap">
                    {formatTime(appointment.time)} • {doctor?.name || 'Doctor'}
                  </p>
                  <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400">
                    {appointment.type || 'Consultation'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end flex-shrink-0 ml-2">
                <span className="text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 rounded-full border bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                  Cancelled
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default memo(CancelledAppointmentsList);
