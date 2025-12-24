'use client';

import { memo } from 'react';
import { Edit, Calendar, X, Star } from 'lucide-react';
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
  // Format role
  const displayRole = member.role || 'Team Member';
  
  // Calculate rating for star display
  const getRating = () => {
    const rating = member.rating;
    if (!rating && rating !== 0) return 0;
    const numRating = typeof rating === 'number' ? rating : parseFloat(rating);
    return isNaN(numRating) ? 0 : Math.min(5, Math.max(0, numRating));
  };
  
  const rating = getRating();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg md:rounded-xl p-2.5 md:p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
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
            <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
              <p className="font-semibold text-xs md:text-sm text-gray-900 dark:text-white whitespace-nowrap">
                {member.name}
              </p>
              {/* Rating - 5 Stars with Number */}
              <div className="flex items-center gap-0.5 flex-shrink-0">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 md:w-3.5 md:h-3.5 ${
                      star <= Math.round(rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 text-gray-200 dark:fill-gray-600 dark:text-gray-600'
                    }`}
                  />
                ))}
                <span className="text-[10px] md:text-xs font-medium text-gray-700 dark:text-gray-300 ml-0.5">
                  {(() => {
                    const ratingValue = member.rating;
                    if (!ratingValue && ratingValue !== 0) return '0.0';
                    const numRating = typeof ratingValue === 'number' ? ratingValue : parseFloat(ratingValue);
                    return isNaN(numRating) ? '0.0' : numRating.toFixed(1);
                  })()}
                </span>
              </div>
            </div>
            <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mb-0.5">
              {displayRole}
            </p>
            <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mb-0.5">
              {member.email}
            </p>
            <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mb-1">
              {member.phone || 'N/A'}
            </p>
            {/* Experience and Specialization */}
            <div className="flex items-center justify-between gap-4 md:gap-6 text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span className="whitespace-nowrap">
                Experience: {member.experience || 'N/A'}
              </span>
              <span className="whitespace-nowrap">
                Specialization: {member.specialization || 'N/A'}
              </span>
            </div>
            {/* Booking Held Number */}
            <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
              <span className="whitespace-nowrap">
                Booking Held: {appointmentCount || 0}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 md:gap-2 flex-shrink-0 ml-1">
          {/* Status Badge - Top Right */}
          <span className={`text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 rounded-full border ${getStatusColor(member.status)}`}>
            {member.status === 'active' ? 'Active' : member.status === 'leave' ? 'On Leave' : 'Inactive'}
          </span>
          {/* Action Icons - Below Status */}
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1 md:p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit className="w-3 h-3 md:w-3.5 md:h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
              className="p-1 md:p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="View Schedule"
            >
              <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 md:p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete"
            >
              <X className="w-3 h-3 md:w-3.5 md:h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(TeamMemberCard);
