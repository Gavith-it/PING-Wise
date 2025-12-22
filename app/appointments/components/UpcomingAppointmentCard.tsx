'use client';

import { memo } from 'react';
import { Calendar, Edit, X } from 'lucide-react';
import { format } from 'date-fns';
import { Appointment } from '@/types';
import { formatTime } from '../utils/formatUtils';

interface UpcomingAppointmentCardProps {
  appointment: Appointment;
  onEdit: () => void;
  onReschedule: () => void;
  onDelete: () => void;
}

function UpcomingAppointmentCard({ appointment, onEdit, onReschedule, onDelete }: UpcomingAppointmentCardProps) {
  const patient = appointment.patient as any;
  const doctor = appointment.doctor as any;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg md:rounded-xl p-2.5 md:p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 md:space-x-3 flex-1 min-w-0">
          <div className={`w-8 h-8 md:w-10 md:h-10 ${patient?.avatarColor || 'bg-primary'} rounded-full flex items-center justify-center text-white text-[10px] md:text-xs font-semibold flex-shrink-0`}>
            {patient?.initials || 'P'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-xs md:text-sm text-gray-900 dark:text-white mb-0.5 md:mb-1">{patient?.name || 'Unknown'}</p>
            <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mb-0.5">
              {format(new Date(appointment.date), 'MMMM d, yyyy')} • {formatTime(appointment.time)}
            </p>
            <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400">
              {doctor?.name || 'Unknown Doctor'} • {appointment.type || 'Consultation'}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1 md:space-y-2 flex-shrink-0 ml-2">
          <span className={`text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 rounded-full border ${getStatusColor(appointment.status)}`}>
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
              title="Edit"
            >
              <Edit className="w-3 h-3 md:w-3.5 md:h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReschedule();
              }}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
              title="Reschedule"
            >
              <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Cancel"
            >
              <X className="w-3 h-3 md:w-3.5 md:h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(UpcomingAppointmentCard);
