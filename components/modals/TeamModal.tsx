'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { teamApi } from '@/lib/services/teamApi';
import { userToCrmTeam, crmTeamToUser } from '@/lib/utils/teamAdapter';
import toast from 'react-hot-toast';
import { User } from '@/types';
import {
  validateName,
  validatePhone,
  validateEmail,
  handleNameInput,
  handlePhoneInput,
  formatPhoneForDisplay,
  formatPhoneForApi,
} from '@/lib/utils/formValidation';

interface TeamModalProps {
  teamMember?: User | null;
  onClose: () => void;
  onSuccess: (createdMember?: User) => void;
}

export default function TeamModal({ teamMember, onClose, onSuccess }: TeamModalProps) {
  // Helper function to split name into first and last name
  const splitName = (fullName: string) => {
    if (!fullName) return { firstName: '', lastName: '' };
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return { firstName: names[0], lastName: '' };
    }
    return {
      firstName: names[0],
      lastName: names.slice(1).join(' ')
    };
  };

  const initialName = teamMember?.name ? splitName(teamMember.name) : { firstName: '', lastName: '' };

  const [formData, setFormData] = useState({
    firstName: initialName.firstName,
    lastName: initialName.lastName,
    email: teamMember?.email || '',
    role: (teamMember?.role || 'staff') as 'admin' | 'doctor' | 'staff',
    department: teamMember?.department || '',
    specialization: teamMember?.specialization || '',
    phone: teamMember?.phone || '',
    experience: teamMember?.experience || '',
    status: (teamMember?.status || 'active') as 'active' | 'inactive' | 'OnLeave',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isSubmittingRef = useRef(false); // Prevent duplicate submissions
  const hasCalledSuccessRef = useRef(false); // Prevent duplicate onSuccess calls

  useEffect(() => {
    // Reset success flag when modal opens/closes or teamMember changes
    hasCalledSuccessRef.current = false;
    
    if (teamMember) {
      // Edit mode - populate with existing data
      const nameParts = splitName(teamMember.name || '');
      setFormData({
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
        email: teamMember.email || '',
        role: teamMember.role || 'staff',
        department: teamMember.department || '',
        specialization: teamMember.specialization || '',
        phone: formatPhoneForDisplay(teamMember.phone || ''),
        experience: teamMember.experience || '',
        status: (teamMember.status || 'active') as 'active' | 'inactive' | 'OnLeave',
      });
    } else {
      // Add mode - reset form to defaults
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: 'staff',
        department: '',
        specialization: '',
        phone: '',
        experience: '',
        status: 'active',
      });
    }
  }, [teamMember]);

  // Optimized field update handler with validation
  const handleFieldChange = useCallback((field: keyof typeof formData) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      let value = e.target.value;
      
      // Apply input filtering based on field type
      if (field === 'firstName' || field === 'lastName') {
        value = handleNameInput(value); // Remove numbers from name
      } else if (field === 'phone') {
        value = handlePhoneInput(value); // Only digits, max 10
      }
      
      setFormData(prev => ({ ...prev, [field]: value }));
      
      // Validate field in real-time and set error
      let fieldError = '';
      if (field === 'firstName' || field === 'lastName') {
        const validation = validateName(value);
        if (!validation.isValid) {
          fieldError = validation.error;
        }
      } else if (field === 'phone') {
        if (value.trim() !== '') {
          const validation = validatePhone(value);
          if (!validation.isValid) {
            fieldError = validation.error;
          }
        }
      } else if (field === 'email') {
        if (value.trim() !== '') {
          const validation = validateEmail(value);
          if (!validation.isValid) {
            fieldError = validation.error;
          }
        }
      }
      
      // Update errors
      setErrors(prev => {
        if (fieldError) {
          return { ...prev, [field]: fieldError };
        } else {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        }
      });
    };
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    const newErrors: Record<string, string> = {};
    
    const firstNameValidation = validateName(formData.firstName);
    if (!firstNameValidation.isValid) {
      newErrors.firstName = firstNameValidation.error;
    }
    
    if (!formData.firstName || formData.firstName.trim() === '') {
      newErrors.firstName = 'First name is required';
    }
    
    const lastNameValidation = validateName(formData.lastName);
    if (!lastNameValidation.isValid) {
      newErrors.lastName = lastNameValidation.error;
    }
    
    if (!formData.lastName || formData.lastName.trim() === '') {
      newErrors.lastName = 'Last name is required';
    }
    
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error;
    }
    
    // Phone is now mandatory
    if (!formData.phone || formData.phone.trim() === '') {
      newErrors.phone = 'Phone number is required';
    } else {
      const phoneValidation = validatePhone(formData.phone);
      if (!phoneValidation.isValid) {
        newErrors.phone = phoneValidation.error;
      }
    }
    
    // Department is now mandatory
    if (!formData.department || formData.department.trim() === '') {
      newErrors.department = 'Department is required';
    }
    
    // Specialization is now mandatory
    if (!formData.specialization || formData.specialization.trim() === '') {
      newErrors.specialization = 'Specialization is required';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    // Prevent duplicate submissions
    if (isSubmittingRef.current) {
      return;
    }
    
    isSubmittingRef.current = true;
    setLoading(true);

    try {
      // Combine firstName and lastName into full name
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      
      const crmTeamRequest = userToCrmTeam({
        name: fullName,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        specialization: formData.specialization,
        phone: formatPhoneForApi(formData.phone),
        experience: formData.experience,
        status: formData.status,
      });

      let createdOrUpdatedMember: User | undefined;
      
      if (teamMember && teamMember.id) {
        const response = await teamApi.updateTeam(teamMember.id, crmTeamRequest);
        toast.success('Team member updated successfully');
        // Convert response to User format for cache update
        if (response && typeof response === 'object' && 'id' in response) {
          try {
            createdOrUpdatedMember = crmTeamToUser(response as any);
            // Preserve existing data that might not be in response
            createdOrUpdatedMember = {
              ...createdOrUpdatedMember,
              ...formData,
              id: teamMember.id,
            };
          } catch (error) {
            console.error('Error converting updated team member:', error);
            // Fallback: create user object from form data
            createdOrUpdatedMember = {
              id: teamMember.id,
              name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
              email: formData.email,
              role: formData.role,
              department: formData.department,
              specialization: formData.specialization,
              phone: formData.phone,
              experience: formData.experience,
              status: formData.status,
            } as User;
          }
        }
      } else {
        const response = await teamApi.createTeam(crmTeamRequest);
        toast.success('Team member created successfully');
        // Convert response to User format for cache update
        if (response && typeof response === 'object' && 'id' in response) {
          try {
            createdOrUpdatedMember = crmTeamToUser(response as any);
            // Add form data to the created member
            createdOrUpdatedMember = {
              ...createdOrUpdatedMember,
              ...formData,
            };
          } catch (error) {
            console.error('Error converting created team member:', error);
            // Fallback: create user object from form data (will need ID from response)
            if ('id' in response) {
              createdOrUpdatedMember = {
                id: String(response.id),
                name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
                email: formData.email,
                role: formData.role,
                department: formData.department,
                specialization: formData.specialization,
                phone: formData.phone,
                experience: formData.experience,
                status: formData.status,
              } as User;
            }
          }
        }
      }
      
      // Call onSuccess only once - parent will handle closing the modal
      if (!hasCalledSuccessRef.current) {
        hasCalledSuccessRef.current = true;
        onSuccess(createdOrUpdatedMember);
      }
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
                First Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleFieldChange('firstName')}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 ${
                    errors.firstName ? 'border-red-500 dark:border-red-600 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter first name (letters only)"
                  title={errors.firstName || 'First name can only contain letters, spaces, hyphens, and apostrophes. Numbers are not allowed.'}
                />
                {errors.firstName && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 group">
                    <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center cursor-help">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div className="absolute right-0 top-full mt-1 w-64 p-2 bg-red-600 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {errors.firstName}
                    </div>
                  </div>
                )}
              </div>
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleFieldChange('lastName')}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 ${
                    errors.lastName ? 'border-red-500 dark:border-red-600 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter last name (letters only)"
                  title={errors.lastName || 'Last name can only contain letters, spaces, hyphens, and apostrophes. Numbers are not allowed.'}
                />
                {errors.lastName && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 group">
                    <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center cursor-help">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div className="absolute right-0 top-full mt-1 w-64 p-2 bg-red-600 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {errors.lastName}
                    </div>
                  </div>
                )}
              </div>
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.lastName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleFieldChange('email')}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 ${
                    errors.email ? 'border-red-500 dark:border-red-600 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="email@example.com"
                  title={errors.email || 'Email can contain letters and numbers (alphanumeric).'}
                />
                {errors.email && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 group">
                    <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center cursor-help">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div className="absolute right-0 top-full mt-1 w-64 p-2 bg-red-600 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {errors.email}
                    </div>
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
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
                Department *
              </label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={handleFieldChange('department')}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 ${
                  errors.department ? 'border-red-500 dark:border-red-600 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="e.g., Cardiology"
              />
              {errors.department && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.department}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Specialization *
              </label>
              <input
                type="text"
                required
                value={formData.specialization}
                onChange={handleFieldChange('specialization')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                placeholder="e.g., Cardiology"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                  +91
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  value={formData.phone}
                  onChange={handleFieldChange('phone')}
                  className={`w-full pl-14 pr-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 ${
                    errors.phone ? 'border-red-500 dark:border-red-600 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="10 digits (numbers only)"
                  maxLength={10}
                  title={errors.phone || 'Phone number must be exactly 10 digits. Letters are not allowed.'}
                />
                {errors.phone && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 group">
                    <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center cursor-help">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div className="absolute right-0 top-full mt-1 w-64 p-2 bg-red-600 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {errors.phone}
                    </div>
                  </div>
                )}
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
              )}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status *
              </label>
              <select
                required
                value={formData.status}
                onChange={handleFieldChange('status')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="OnLeave">OnLeave</option>
              </select>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-3 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-white py-2 px-3 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 shadow-md hover:shadow-lg"
              >
                {loading ? 'Saving...' : teamMember ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

