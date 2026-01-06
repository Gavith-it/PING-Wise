'use client';

import { memo } from 'react';
import { User } from '@/types';
import { generateInitials, generateAvatarColor } from '../utils/teamUtils';
import ToggleSwitch from '@/components/ui/toggle-switch';

interface TeamMemberCardProps {
  member: User;
  index: number;
  getStatusColor: (status: string) => string;
  onClick: () => void;
  onStatusToggle?: (memberId: string, newStatus: 'Active' | 'OnLeave') => void;
}

function TeamMemberCard({ 
  member, 
  index,
  getStatusColor, 
  onClick,
  onStatusToggle,
}: TeamMemberCardProps) {
  const isOnLeave = member.status === 'OnLeave';

  const handleToggle = (enabled: boolean) => {
    if (onStatusToggle) {
      const newStatus = enabled ? 'OnLeave' : 'Active';
      onStatusToggle(member.id, newStatus);
    }
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl p-2 md:p-3 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 md:space-x-3 flex-1 min-w-0">
          <div 
            className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white text-[10px] md:text-xs font-semibold flex-shrink-0 ${
              member.avatarColor || generateAvatarColor(member.name, index)
            }`}
          >
            {member.initials || generateInitials(member.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-xs md:text-sm text-gray-900 dark:text-white mb-0.5 md:mb-1">
              {member.name}
            </p>
            <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mb-0.5">
              {member.phone ? (member.phone.startsWith('+') ? member.phone : `+${member.phone}`) : 'N/A'}
            </p>
            <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mb-1.5 md:mb-2">
              {member.email}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 md:gap-2 flex-shrink-0 ml-1">
          {/* Status Badge - Top Right */}
          <span className={`text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 rounded-full border ${getStatusColor(member.status)}`}>
            {member.status === 'Active' ? 'Active' : member.status === 'OnLeave' ? 'On Leave' : 'Inactive'}
          </span>
          {/* OnLeave Toggle - Below Status */}
          {onStatusToggle && (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <span className="text-[9px] md:text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                On Leave
              </span>
              <ToggleSwitch
                enabled={isOnLeave}
                onChange={handleToggle}
                size="sm"
                className="flex-shrink-0"
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Divider line (inset like first image) */}
      <div className="w-full border-t border-gray-200/60 dark:border-gray-600/40 my-2"></div>
      
      {/* Bottom row - Experience and Specialization */}
      <div className="flex items-center justify-between text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
        <span>
          Experience: {member.experience || 'N/A'}
        </span>
        <span className="text-right">
          Specialization: {member.specialization || 'N/A'}
        </span>
      </div>
    </div>
  );
}

export default memo(TeamMemberCard);
