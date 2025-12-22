'use client';

import { memo } from 'react';
import { Eye, Edit, X } from 'lucide-react';
import { Patient } from '@/types';

interface PatientCardProps {
  patient: Patient;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getStatusColor: (status: string) => string;
}

function PatientCard({ patient, onView, onEdit, onDelete, getStatusColor }: PatientCardProps) {

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
    <div className="bg-white dark:bg-gray-800 rounded-lg md:rounded-xl p-3 md:p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 md:space-x-4 flex-1 min-w-0 pr-2 md:pr-3">
          <div 
            className={`w-10 h-10 md:w-12 md:h-12 ${avatarColor} rounded-full flex items-center justify-center text-white text-sm md:text-base font-semibold flex-shrink-0 shadow-sm`}
            style={{ minWidth: '2.5rem', minHeight: '2.5rem' }}
          >
            <span className="select-none">{displayInitials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5 md:space-x-2 mb-1">
              <p className="font-semibold text-sm md:text-base text-gray-900 dark:text-white truncate">{patient.name}</p>
              <span className={`text-[10px] md:text-xs font-medium px-1.5 md:px-2.5 py-0.5 rounded-full border ${getStatusColor(patient.status)} flex-shrink-0`}>
                {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
              </span>
            </div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-0.5 md:mb-1 truncate">{patient.age} years • {patient.phone}</p>
            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 truncate">{patient.email}</p>
            <div className="flex items-center space-x-2 md:space-x-4 mt-1.5 md:mt-2 text-[10px] md:text-xs text-gray-500 dark:text-gray-400 flex-wrap">
              <span>Last: {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'N/A'}</span>
              <span>Next: {patient.nextAppointment ? new Date(patient.nextAppointment).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="p-1 md:p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="View"
          >
            <Eye className="w-3 h-3 md:w-3.5 md:h-3.5" />
          </button>
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 md:p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete"
          >
            <X className="w-3 h-3 md:w-3.5 md:h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(PatientCard);
