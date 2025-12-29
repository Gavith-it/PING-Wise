'use client';

import { memo } from 'react';
import { User } from '@/types';
import { generateInitials, generateAvatarColor } from '../utils/teamUtils';

interface TeamMemberCardProps {
  member: User;
  index: number;
  getStatusColor: (status: string) => string;
  onClick: () => void;
}

function TeamMemberCard({ 
  member, 
  index,
  getStatusColor, 
  onClick,
}: TeamMemberCardProps) {

  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg md:rounded-xl p-2.5 md:p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer"
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
            <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400">
              {member.email}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 md:gap-2 flex-shrink-0 ml-1">
          {/* Status Badge - Top Right */}
          <span className={`text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 rounded-full border ${getStatusColor(member.status)}`}>
            {member.status === 'active' ? 'Active' : member.status === 'leave' ? 'On Leave' : 'Inactive'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(TeamMemberCard);
