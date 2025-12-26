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

  // Generate avatar color if not present or invalid
  const getAvatarColor = () => {
    // Valid Tailwind color classes
    const validColors = [
      'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-red-500',
      'bg-orange-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
      'bg-cyan-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500',
      'bg-violet-500', 'bg-fuchsia-500', 'bg-rose-500', 'bg-amber-500'
    ];
    
    // Check if patient has a valid color
    if (patient.avatarColor && validColors.includes(patient.avatarColor)) {
      return patient.avatarColor;
    }
    
    // Generate consistent color based on name
    if (patient.name) {
      const nameHash = patient.name.charCodeAt(0);
      return validColors[nameHash % validColors.length];
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
      className="bg-white dark:bg-gray-800 rounded-lg md:rounded-xl p-2.5 md:p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 md:space-x-3 flex-1 min-w-0">
          <div 
            className={`w-8 h-8 md:w-10 md:h-10 ${avatarColor} rounded-full flex items-center justify-center text-white text-[10px] md:text-xs font-semibold flex-shrink-0`}
          >
            <span className="select-none">{displayInitials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-xs md:text-sm text-gray-900 dark:text-white mb-0.5 md:mb-1">
              {patient.name}
            </p>
            <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mb-0.5">
              {patient.age} years • {patient.phone}
            </p>
            <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mb-1">
              {patient.email}
            </p>
            {/* Last Visit */}
            <div className="flex items-center gap-4 md:gap-6 text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
              <span className="whitespace-nowrap">
                Last: {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'N/A'}
              </span>
              {patient.nextAppointment && (
                <span className="whitespace-nowrap">
                  Next: {new Date(patient.nextAppointment).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 md:gap-2 flex-shrink-0 ml-1">
          {/* Status Badge - Top Right */}
          <span className={`text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 rounded-full border ${getStatusColor(patient.status)}`}>
            {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(PatientCard);
