'use client';

import { useState } from 'react';
import { X, Edit, Trash2, Phone, Mail } from 'lucide-react';
import { teamApi } from '@/lib/services/teamApi';
import toast from 'react-hot-toast';
import { User } from '@/types';

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
    
    // No confirmation here - let the parent handleDelete show the confirmation
    // This prevents duplicate confirmations
    try {
      setLoading(true);
      onDelete(teamMember.id);
      onClose();
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
    if (!teamMember) return;
    
    if (teamMember.phone && teamMember.phone !== 'N/A' && teamMember.phone.trim() !== '') {
      // Format phone number with +91 prefix for display and tel: link
      let phoneNumber = teamMember.phone.trim();
      if (!phoneNumber.startsWith('+')) {
        // Remove any existing 91 prefix and add +91
        if (phoneNumber.startsWith('91')) {
          phoneNumber = phoneNumber.substring(2);
        }
        phoneNumber = `+91${phoneNumber}`;
      }
      // Show confirmation before opening phone dialer
      if (confirm(`Do you want to call ${phoneNumber}?`)) {
        window.location.href = `tel:${phoneNumber}`;
      }
    } else if (teamMember.email) {
      // Open email client directly without confirmation
      window.location.href = `mailto:${teamMember.email}`;
    }
  };

  const getStatusColor = (status: string) => {
    // Normalize status to lowercase for comparison
    const normalized = status.toLowerCase();
    
    if (normalized === 'active') {
      return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
    }
    if (normalized === 'onleave' || normalized === 'on leave') {
      return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800';
    }
    if (normalized === 'inactive') {
      return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
    // Fallback
    return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
  };

  if (!teamMember) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 md:p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Team Member Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>

          <div className="text-center mb-4 md:mb-6">
            <div className={`w-12 h-12 md:w-16 md:h-16 ${teamMember.avatarColor || 'bg-primary'} rounded-full flex items-center justify-center text-white text-base md:text-xl font-medium mx-auto mb-2 md:mb-3 shadow-md`}>
              {teamMember.initials || teamMember.name.charAt(0).toUpperCase()}
            </div>
            <h4 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{teamMember.name}</h4>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">{teamMember.role || 'N/A'}</p>
            <span className={`inline-block text-xs md:text-sm px-2 md:px-3 py-0.5 md:py-1 rounded-full ${getStatusColor(teamMember.status)} mt-1 md:mt-2`}>
              {teamMember.status === 'OnLeave' ? 'On Leave' : teamMember.status.charAt(0).toUpperCase() + teamMember.status.slice(1)}
            </span>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg md:rounded-xl p-3 md:p-4 mb-3 md:mb-6">
            <h5 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white mb-2 md:mb-3">Contact Information</h5>
            <div className="space-y-1.5 md:space-y-2">
              <div className="flex items-center space-x-2 md:space-x-3">
                <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <span className="text-xs md:text-sm text-gray-700 dark:text-gray-300 break-all">
                  {teamMember.phone ? (teamMember.phone.startsWith('+') ? teamMember.phone : `+${teamMember.phone}`) : 'N/A'}
                </span>
              </div>
              <div className="flex items-center space-x-2 md:space-x-3">
                <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <span className="text-xs md:text-sm text-gray-700 dark:text-gray-300 break-all">{teamMember.email || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg md:rounded-xl p-3 md:p-4 mb-3 md:mb-6">
            <h5 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white mb-2 md:mb-3">Professional Information</h5>
            <div className="space-y-2 md:space-y-3">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Department</label>
                  <p className="text-xs md:text-sm text-gray-900 dark:text-white">
                    {teamMember.department || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Experience</label>
                  <p className="text-xs md:text-sm text-gray-900 dark:text-white">
                    {teamMember.experience || 'N/A'}
                  </p>
                </div>
              </div>
              {teamMember.specialization && (
                <div>
                  <label className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Specialization</label>
                  <p className="text-xs md:text-sm text-gray-900 dark:text-white">{teamMember.specialization}</p>
                </div>
              )}
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
            <button
              type="button"
              onClick={handleContact}
              className="flex-1 flex items-center justify-center gap-1.5 md:gap-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 md:py-2.5 px-3 md:px-4 rounded-lg md:rounded-xl text-xs md:text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
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

