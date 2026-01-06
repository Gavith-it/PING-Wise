'use client';

import { memo, useMemo } from 'react';
import { Appointment } from '@/types';

interface TodayAppointmentCardProps {
  appointment: Appointment;
}

const TodayAppointmentCard = memo(function TodayAppointmentCard({ appointment }: TodayAppointmentCardProps) {
  const patient = typeof appointment.patient === 'object' ? appointment.patient : null;
  const doctor = typeof appointment.doctor === 'object' ? appointment.doctor : null;
  
  // Generate avatar color if not present or invalid (improved logic for better distribution)
  const avatarColor = useMemo(() => {
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
  }, [patient?.avatarColor, patient?.name, patient?.id]);
  
  const statusColor = useMemo(() => {
    switch (appointment.status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
  }, [appointment.status]);

  // Convert 24-hour time format to 12-hour format with AM/PM
  const formatTimeTo12Hour = (time24: string): string => {
    if (!time24) return '';
    
    // Handle formats like "12:40" or "13:38"
    const [hours, minutes] = time24.split(':');
    if (!hours || !minutes) return time24;
    
    const hour24 = parseInt(hours, 10);
    const mins = minutes;
    
    if (isNaN(hour24)) return time24;
    
    let hour12 = hour24;
    let period = 'AM';
    
    if (hour24 === 0) {
      hour12 = 12;
      period = 'AM';
    } else if (hour24 === 12) {
      hour12 = 12;
      period = 'PM';
    } else if (hour24 > 12) {
      hour12 = hour24 - 12;
      period = 'PM';
    }
    
    return `${hour12}:${mins} ${period}`;
  };

  const displayTime = formatTimeTo12Hour(appointment.time || '');

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 flex items-center justify-between text-left shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
        <div className={`w-8 h-8 md:w-10 md:h-10 ${avatarColor} rounded-full flex items-center justify-center text-white text-xs md:text-sm font-semibold flex-shrink-0`}>
          {patient?.initials || 'P'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm md:text-base text-gray-900 dark:text-white truncate mb-1">
            {patient?.name || 'Unknown'}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              {displayTime}
            </p>
            {doctor?.name && (
              <>
                <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  Dr. {doctor.name}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      <span className={`text-xs md:text-sm font-medium px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg border ${statusColor} flex-shrink-0 ml-2`}>
        {appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1) || 'Unknown'}
      </span>
    </div>
  );
});

export default TodayAppointmentCard;
