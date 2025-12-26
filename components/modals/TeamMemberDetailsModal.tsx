'use client';

import { useState } from 'react';
import { X, Edit, Trash2, Phone, Mail, Briefcase, Award, Star } from 'lucide-react';
import { teamService } from '@/lib/services/api';
import toast from 'react-hot-toast';
import { User } from '@/types';
import StarRating from '@/components/ui/star-rating';

interface TeamMemberDetailsModalProps {
  teamMember: User | null;
  onClose: () => void;
  onEdit: (member: User) => void;
  onDelete: (id: string) => void;
  onSuccess: () => void;
}

export default function TeamMemberDetailsModal({
  teamMember,
  onClose,
  onEdit,
  onDelete,
  onSuccess,
}: TeamMemberDetailsModalProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!teamMember) return;
    
    if (!confirm('Are you sure you want to delete this team member?')) {
      return;
    }

    try {
      setLoading(true);
      await teamService.deleteTeamMember(teamMember.id);
      toast.success('Team member deleted successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete team member');
    } finally {
      setLoading(false);
    }
  };

  if (!teamMember) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 md:p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Team Member Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>

          {/* Member Info */}
          <div className="space-y-3 md:space-y-6">
            {/* Profile Section */}
            <div className="flex items-start gap-2 md:gap-4 pb-3 md:pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className={`w-12 h-12 md:w-20 md:h-20 ${teamMember.avatarColor || 'bg-primary'} rounded-full flex items-center justify-center text-white text-base md:text-2xl font-semibold flex-shrink-0`}>
                {teamMember.initials || teamMember.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base md:text-xl font-bold text-gray-900 dark:text-white mb-0.5 md:mb-1">{teamMember.name}</h4>
                <p className="text-xs md:text-base text-gray-600 dark:text-gray-400 mb-1 md:mb-2">{teamMember.role}</p>
                {teamMember.rating && (
                  <div className="flex items-center gap-2">
                    <StarRating rating={teamMember.rating} size="sm" showValue />
                  </div>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-4">
              {/* Email */}
              <div className="flex items-start gap-1.5 md:gap-3">
                <Mail className="w-3.5 h-3.5 md:w-5 md:h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Email</p>
                  <p className="text-xs md:text-base text-gray-900 dark:text-white break-words">{teamMember.email}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-1.5 md:gap-3">
                <Phone className="w-3.5 h-3.5 md:w-5 md:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Phone</p>
                  <p className="text-xs md:text-base text-gray-900 dark:text-white">{teamMember.phone || 'N/A'}</p>
                </div>
              </div>

              {/* Department */}
              <div className="flex items-start gap-1.5 md:gap-3">
                <Briefcase className="w-3.5 h-3.5 md:w-5 md:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Department</p>
                  <p className="text-xs md:text-base text-gray-900 dark:text-white">{teamMember.department || 'N/A'}</p>
                </div>
              </div>

              {/* Specialization */}
              {teamMember.specialization && (
                <div className="flex items-start gap-1.5 md:gap-3">
                  <Award className="w-3.5 h-3.5 md:w-5 md:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Specialization</p>
                    <p className="text-xs md:text-base text-gray-900 dark:text-white">{teamMember.specialization}</p>
                  </div>
                </div>
              )}

              {/* Experience */}
              {teamMember.experience && (
                <div className="flex items-start gap-1.5 md:gap-3">
                  <Award className="w-3.5 h-3.5 md:w-5 md:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Experience</p>
                    <p className="text-xs md:text-base text-gray-900 dark:text-white">{teamMember.experience}</p>
                  </div>
                </div>
              )}

              {/* Appointment Count - Removed to prevent unnecessary API calls on team page */}

              {/* Status */}
              <div className="flex items-start gap-1.5 md:gap-3">
                <div className="w-3.5 h-3.5 md:w-5 md:h-5 flex-shrink-0 mt-0.5 flex items-center justify-center">
                  <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${
                    teamMember.status === 'active' ? 'bg-green-500' : 
                    teamMember.status === 'leave' ? 'bg-orange-500' : 'bg-gray-400'
                  }`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5">Status</p>
                  <p className="text-xs md:text-base text-gray-900 capitalize">{teamMember.status}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-3 md:pt-6 mt-3 md:mt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                onEdit(teamMember);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 md:gap-2 bg-primary text-white py-2 md:py-2.5 px-3 md:px-4 rounded-lg md:rounded-xl text-xs md:text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 md:gap-2 bg-red-500 text-white py-2 md:py-2.5 px-3 md:px-4 rounded-lg md:rounded-xl text-xs md:text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Delete</span>
            </button>
            {/* Contact button disabled as per requirements */}
            <button
              disabled
              className="flex-1 flex items-center justify-center gap-1.5 md:gap-2 bg-gray-200 text-gray-500 py-2 md:py-2.5 px-3 md:px-4 rounded-lg md:rounded-xl text-xs md:text-sm font-medium cursor-not-allowed opacity-50"
            >
              <Phone className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Contact</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

