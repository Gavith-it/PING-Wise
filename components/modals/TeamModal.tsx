'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { teamApi } from '@/lib/services/teamApi';
import { userToCrmTeam } from '@/lib/utils/teamAdapter';
import toast from 'react-hot-toast';
import { User } from '@/types';

interface TeamModalProps {
  teamMember?: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TeamModal({ teamMember, onClose, onSuccess }: TeamModalProps) {
  const [formData, setFormData] = useState({
    name: teamMember?.name || '',
    email: teamMember?.email || '',
    role: (teamMember?.role || 'staff') as 'admin' | 'doctor' | 'staff',
    specialization: teamMember?.specialization || '',
    phone: teamMember?.phone || '',
    experience: teamMember?.experience || '',
  });
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false); // Prevent duplicate submissions

  useEffect(() => {
    if (teamMember) {
      // Edit mode - populate with existing data
      setFormData({
        name: teamMember.name || '',
        email: teamMember.email || '',
        role: teamMember.role || 'staff',
        specialization: teamMember.specialization || '',
        phone: teamMember.phone || '',
        experience: teamMember.experience || '',
      });
    } else {
      // Add mode - reset form to defaults
      setFormData({
        name: '',
        email: '',
        role: 'staff',
        specialization: '',
        phone: '',
        experience: '',
      });
    }
  }, [teamMember]);

  // Optimized field update handler
  const handleFieldChange = useCallback((field: keyof typeof formData) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.value;
      setFormData(prev => ({ ...prev, [field]: value }));
    };
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isSubmittingRef.current) {
      return;
    }
    
    isSubmittingRef.current = true;
    setLoading(true);

    try {
      const crmTeamRequest = userToCrmTeam({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        specialization: formData.specialization,
        phone: formData.phone,
        experience: formData.experience,
      });

      if (teamMember && teamMember.id) {
        await teamApi.updateTeam(teamMember.id, crmTeamRequest);
        toast.success('Team member updated successfully');
      } else {
        await teamApi.createTeam(crmTeamRequest);
        toast.success('Team member created successfully');
      }
      onSuccess();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save team member';
      toast.error(errorMessage);
      console.error('Team member save error:', error);
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  }, [formData, teamMember, onSuccess]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {teamMember ? 'Edit Team Member' : 'Add Team Member'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={handleFieldChange('name')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={handleFieldChange('email')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role *
              </label>
              <select
                required
                value={formData.role}
                onChange={handleFieldChange('role')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
              >
                <option value="staff">Staff</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Specialization
              </label>
              <input
                type="text"
                value={formData.specialization}
                onChange={handleFieldChange('specialization')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                placeholder="e.g., Cardiology"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={handleFieldChange('phone')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Experience
              </label>
              <input
                type="text"
                value={formData.experience}
                onChange={handleFieldChange('experience')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                placeholder="e.g., 3"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-white py-3 px-4 rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 shadow-md hover:shadow-lg"
              >
                {loading ? 'Saving...' : teamMember ? 'Update Team Member' : 'Add Team Member'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

