'use client';

import { memo } from 'react';
import { Edit, X, Phone } from 'lucide-react';
import { Appointment } from '@/types';
import { formatTime, maskPhoneNumber } from '../utils/formatUtils';

interface UpcomingAppointmentCardProps {
  appointment: Appointment;
  onEdit: () => void;
  onReschedule: () => void;
  onDelete: () => void;
}

function UpcomingAppointmentCard({ appointment, onEdit, onReschedule, onDelete }: UpcomingAppointmentCardProps) {
  const patient = typeof appointment.patient === 'object' ? appointment.patient : null;
  const doctor = typeof appointment.doctor === 'object' ? appointment.doctor : null;

  const getStatusColor = (status: string) => {
    // Normalize status to handle both lowercase and capitalized
    const normalized = status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() || '';
    
    switch (normalized) {
      case 'Confirmed':
        return 'bg-blue-100 text-blue-700 border-blue-200'; // Changed from green to blue
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Completed':
        return 'bg-green-100 text-green-700 border-green-200'; // Changed from blue to green
      case 'Cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusBorderColor = (status: string) => {
    // Normalize status to handle both lowercase and capitalized
    const normalized = status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() || '';
    
    switch (normalized) {
      case 'Confirmed':
        return 'border-l-blue-500'; // Changed from green to blue
      case 'Pending':
        return 'border-l-yellow-500';
      case 'Completed':
        return 'border-l-green-500'; // Changed from blue to green
      case 'Cancelled':
        return 'border-l-red-500';
      default:
        return 'border-l-gray-500';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg md:rounded-xl p-2.5 md:p-4 border-l-4 ${getStatusBorderColor(appointment.status)} border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 md:space-x-3 flex-1 min-w-0">
          <div className={`w-8 h-8 md:w-10 md:h-10 ${patient?.avatarColor || 'bg-primary'} rounded-full flex items-center justify-center text-white text-[10px] md:text-xs font-semibold flex-shrink-0`}>
            {patient?.initials || 'P'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-xs md:text-sm text-gray-900 dark:text-white mb-0.5 md:mb-1">
              {patient?.name || 'Unknown'}
            </p>
            <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mb-0.5">
              {appointment.type || 'Consultation'}
            </p>
            {patient?.phone && (
              <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                {patient.phone.startsWith('+') ? patient.phone : `+91${patient.phone}`}
              </p>
            )}
            <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400">
              {formatTime(appointment.time)}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 md:gap-2 flex-shrink-0 ml-1">
          {/* Status Badge - Top Right */}
          <span className={`text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 rounded-full border ${getStatusColor(appointment.status)}`}>
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </span>
          {/* Action Icons - Below Status */}
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1 md:p-1.5 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors focus:outline-none focus:ring-0 active:outline-none active:ring-0 active:bg-transparent active:shadow-none"
              title="Edit"
            >
              <Edit className="w-3 h-3 md:w-3.5 md:h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 md:p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors focus:outline-none focus:ring-0 active:outline-none active:ring-0 active:bg-transparent active:shadow-none"
              title="Cancel"
            >
              <X className="w-3 h-3 md:w-3.5 md:h-3.5" />
            </button>
            {patient?.phone && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Format phone number with +91 prefix for display and tel: link
                  let phoneNumber = patient.phone.trim();
                  if (!phoneNumber.startsWith('+')) {
                    // Remove any existing 91 prefix and add +91
                    if (phoneNumber.startsWith('91')) {
                      phoneNumber = phoneNumber.substring(2);
                    }
                    phoneNumber = `+91${phoneNumber}`;
                  }
                  if (confirm(`Do you want to call ${phoneNumber}?`)) {
                    window.location.href = `tel:${phoneNumber}`;
                  }
                }}
                className="p-1 md:p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors focus:outline-none focus:ring-0 active:outline-none active:ring-0 active:bg-transparent active:shadow-none"
                title="Call"
              >
                <Phone className="w-3 h-3 md:w-3.5 md:h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(UpcomingAppointmentCard);
