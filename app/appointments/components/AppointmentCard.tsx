'use client';

import { memo } from 'react';
import { Edit, X, Check } from 'lucide-react';
import { Appointment } from '@/types';
import { formatTime } from '../utils/formatUtils';

interface AppointmentCardProps {
  appointment: Appointment;
  onEdit: () => void;
  onDelete: () => void;
  onFollowUp: () => void;
}

function AppointmentCard({ appointment, onEdit, onDelete, onFollowUp }: AppointmentCardProps) {
  const patient = typeof appointment.patient === 'object' ? appointment.patient : null;
  const doctor = typeof appointment.doctor === 'object' ? appointment.doctor : null;

  // Generate avatar color if not present or invalid (same logic as CRM and Team)
  const getAvatarColor = () => {
    // Valid Tailwind color classes - expanded palette for better variety
    const validColors = [
      'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-red-500',
      'bg-orange-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
      'bg-cyan-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500',
      'bg-violet-500', 'bg-fuchsia-500', 'bg-rose-500', 'bg-amber-500',
      'bg-sky-500', 'bg-blue-600', 'bg-purple-600', 'bg-green-600',
      'bg-red-600', 'bg-orange-600', 'bg-indigo-600', 'bg-pink-600'
    ];
    
    // Check if patient has a valid color
    if (patient?.avatarColor && validColors.includes(patient.avatarColor)) {
      return patient.avatarColor;
    }
    
    // Generate consistent color based on patient name using better hash
    if (patient?.name) {
      // Use a better hash function that considers the entire name
      let hash = 0;
      const name = patient.name.trim().toLowerCase();
      for (let i = 0; i < name.length; i++) {
        hash = ((hash << 5) - hash) + name.charCodeAt(i);
        hash = hash & hash; // Convert to 32-bit integer
      }
      // Use absolute value and modulo to get index
      const colorIndex = Math.abs(hash) % validColors.length;
      return validColors[colorIndex];
    }
    
    // If patient has an ID, use that as fallback
    if (patient?.id) {
      let hash = 0;
      const idStr = String(patient.id);
      for (let i = 0; i < idStr.length; i++) {
        hash = ((hash << 5) - hash) + idStr.charCodeAt(i);
        hash = hash & hash;
      }
      const colorIndex = Math.abs(hash) % validColors.length;
      return validColors[colorIndex];
    }
    
    // Default color
    return 'bg-blue-500';
  };

  const avatarColor = getAvatarColor();

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
    <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg md:rounded-xl p-2.5 md:p-4 pr-3 md:pr-5 border-l-4 ${getStatusBorderColor(appointment.status)} border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all`}>
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
        <div className="flex flex-col items-end gap-1 md:gap-1.5 ml-2 flex-shrink-0 min-w-[60px] md:min-w-[70px]">
          {/* Status Badge - Top Right */}
          <span className={`text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 rounded-full border ${getStatusColor(appointment.status)}`}>
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </span>
          {/* Action Icons - Below Status - Always reserve space */}
          <div className="flex items-center -mr-2 md:-mr-3 -space-x-0.5 min-h-[20px] md:min-h-[24px]">
            {appointment.status !== 'Completed' && (
              <>
                {/* Edit button - visible for confirmed and pending */}
                {(appointment.status === 'Confirmed' || appointment.status === 'Pending') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                    className="p-1 md:p-1.5 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  </button>
                )}
                {/* Follow-up button (tick mark) - only visible for confirmed status */}
                {appointment.status === 'Confirmed' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFollowUp();
                    }}
                    className="p-1 md:p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Follow-up"
                  >
                    <Check className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  </button>
                )}
                {/* Delete button - visible for confirmed and pending */}
                {(appointment.status === 'Confirmed' || appointment.status === 'Pending') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="p-1 md:p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Cancel"
                  >
                    <X className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(AppointmentCard);
