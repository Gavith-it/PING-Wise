'use client';

import { useState, useRef, memo } from 'react';
import { MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import { useOnClickOutside } from 'usehooks-ts';
import { User } from '@/types';
import { generateInitials, generateAvatarColor } from '../utils/teamUtils';

interface TeamMemberCardProps {
  member: User;
  index: number;
  getStatusColor: (status: string) => string;
  appointmentCount: number;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function TeamMemberCard({ 
  member, 
  index,
  getStatusColor, 
  appointmentCount,
  onView,
  onEdit,
  onDelete,
}: TeamMemberCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(menuRef, () => setShowMenu(false));

  // Format role and department - if role contains "Chief" or similar, use it as primary role
  const displayRole = member.role || 'Team Member';
  const displayDepartment = member.department || 'General';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg md:rounded-xl p-3 md:p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative mb-2">
      <div className="flex items-start justify-between gap-2 md:gap-4">
        <div className="flex items-start space-x-2 md:space-x-4 flex-1 min-w-0">
          <div 
            className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white text-sm md:text-base font-semibold flex-shrink-0 ${
              member.avatarColor || generateAvatarColor(member.name, index)
            }`}
          >
            {member.initials || generateInitials(member.name)}
          </div>
          <div className="flex-1 flex flex-col min-w-0">
            <p className="font-semibold text-sm md:text-base text-gray-900 dark:text-white mb-1">{member.name}</p>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">
              {displayRole} • {displayDepartment}
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mb-3 md:mb-4">
              {member.email} • {member.phone || 'N/A'}
            </p>
            
            {/* Experience and Specialization at bottom - horizontally aligned, full text visible */}
            <div className="flex items-center justify-between gap-4 md:gap-6 text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-auto">
              <span className="whitespace-nowrap">{member.experience ? `Experience: ${member.experience}` : 'Experience: N/A'}</span>
              <span className="whitespace-nowrap">{member.specialization ? `Specialization: ${member.specialization}` : 'Specialization: N/A'}</span>
            </div>
          </div>
        </div>

        {/* Status and Menu - Top Right */}
        <div className="flex flex-col items-end gap-1.5 md:gap-2 flex-shrink-0">
          {/* Status Tag */}
          <span className={`text-[10px] md:text-xs font-medium px-2 md:px-2.5 py-0.5 rounded-full border ${getStatusColor(member.status)}`}>
            {member.status === 'active' ? 'Active' : member.status === 'leave' ? 'On Leave' : 'Inactive'}
          </span>
          
          {/* Menu Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`p-1.5 md:p-2 rounded-lg transition-colors focus:outline-none ${
                showMenu ? 'bg-gray-100' : 'hover:bg-gray-100'
              }`}
              type="button"
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
            </button>

            {/* Dropdown Menu - Opens downward */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 md:w-48 bg-white rounded-lg md:rounded-xl shadow-lg border border-gray-200 z-[9999] py-1">
                <button
                  onClick={() => {
                    onView();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 text-left text-sm md:text-base text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => {
                    onEdit();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 text-left text-sm md:text-base text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 text-left text-sm md:text-base text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(TeamMemberCard);
