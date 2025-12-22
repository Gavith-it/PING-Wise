'use client';

import { memo } from 'react';
import { User } from '@/types';
import TeamMemberCard from './TeamMemberCard';
import { getStatusColor } from '../utils/teamUtils';

interface TeamListProps {
  teamMembers: User[];
  loading: boolean;
  appointmentCounts: Record<string, number>;
  onView: (member: User) => void;
  onEdit: (member: User) => void;
  onDelete: (id: string) => void;
}

function TeamList({
  teamMembers,
  loading,
  appointmentCounts,
  onView,
  onEdit,
  onDelete,
}: TeamListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 md:py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (teamMembers.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl p-8 md:p-12 text-center">
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">No team members found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 md:space-y-3">
      {teamMembers.map((member, index) => (
        <TeamMemberCard
          key={member.id}
          member={member}
          index={index}
          getStatusColor={getStatusColor}
          appointmentCount={appointmentCounts[member.id] || 0}
          onView={() => onView(member)}
          onEdit={() => onEdit(member)}
          onDelete={() => onDelete(member.id)}
        />
      ))}
    </div>
  );
}

export default memo(TeamList);
