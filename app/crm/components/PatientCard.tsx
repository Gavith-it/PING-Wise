'use client';

import { memo } from 'react';
import { Patient } from '@/types';

interface PatientCardProps {
  patient: Patient;
  onClick: () => void;
  getStatusColor: (status: string) => string;
}

function PatientCard({ patient, onClick, getStatusColor }: PatientCardProps) {

  // Generate initials if not present
  const getInitials = (name?: string) => {
    if (!name) return 'P';
    const names = name.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Generate avatar color if not present or invalid (improved logic for better distribution)
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
    if (patient.avatarColor && validColors.includes(patient.avatarColor)) {
      return patient.avatarColor;
    }
    
    // Generate consistent color based on patient name using better hash
    if (patient.name) {
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
    if (patient.id) {
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

  const initials = patient.initials || getInitials(patient.name);
  const avatarColor = getAvatarColor();
  
  // Ensure initials are never empty
  const displayInitials = initials && initials.trim() ? initials : getInitials(patient.name || 'Patient');

  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl p-2 md:p-3 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer relative"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 md:space-x-3 flex-1 min-w-0">
          <div 
            className={`w-7 h-7 md:w-9 md:h-9 ${avatarColor} rounded-full flex items-center justify-center text-white text-[9px] md:text-[11px] font-semibold flex-shrink-0`}
          >
            <span className="select-none">{displayInitials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm md:text-base text-gray-900 dark:text-white mb-0.5 md:mb-1">
              {patient.name}
            </p>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-0.5">
              {patient.age} years • {patient.phone ? (patient.phone.startsWith('+') ? patient.phone : `+${patient.phone}`) : 'N/A'}
            </p>
            <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mb-1.5 md:mb-2">
              {patient.email || 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 md:gap-2 flex-shrink-0 ml-1">
          {/* Status Badge - Top Right */}
          <span className={`text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 rounded-full border ${getStatusColor(patient.status)}`}>
            {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
          </span>
        </div>
      </div>
      
      {/* Divider line (inset like first image) */}
      <div className="w-full border-t border-gray-200/60 dark:border-gray-600/40 my-2"></div>
      
      {/* Bottom row - Last visit and Next Appointment */}
      <div className="flex items-center justify-between text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
        <span>
          Last visit: {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'N/A'}
        </span>
        <span>
          Next Appointment: {patient.nextAppointment ? new Date(patient.nextAppointment).toLocaleDateString() : 'N/A'}
        </span>
      </div>
    </div>
  );
}

export default memo(PatientCard);
