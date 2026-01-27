'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { userProfileService, UserProfileData, UserProfileUpdatePayload } from '@/lib/services/api';
import toast from 'react-hot-toast';
import {
  validateName,
  validateEmail,
  validatePhone,
  handleNameInput,
  handlePhoneInput,
  formatPhoneForDisplay,
  formatPhoneForApi,
} from '@/lib/utils/formValidation';

interface EditProfileModalProps {
  profile: UserProfileData | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrator' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'staff', label: 'Staff Member' },
] as const;

export default function EditProfileModal({ profile, onClose, onSuccess }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff' as 'admin' | 'doctor' | 'staff',
    newPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isSubmittingRef = useRef(false);
  const hasCalledSuccessRef = useRef(false);

  useEffect(() => {
    hasCalledSuccessRef.current = false;
    if (profile) {
      setFormData({
        name: profile.name ?? '',
        email: profile.email ?? '',
        phone: formatPhoneForDisplay(profile.phone ?? ''),
        role: (profile.role as 'admin' | 'doctor' | 'staff') || 'staff',
        newPassword: '',
      });
      setErrors({});
    }
  }, [profile]);

  const handleFieldChange = useCallback((field: keyof typeof formData) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      let value = e.target.value;
      if (field === 'name') value = handleNameInput(value);
      if (field === 'phone') value = handlePhoneInput(value);
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    };
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const newErrors: Record<string, string> = {};

      const nameValidation = validateName(formData.name);
      if (!nameValidation.isValid) newErrors.name = nameValidation.error;

      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.isValid) newErrors.email = emailValidation.error;

      if (formData.phone.trim()) {
        const phoneValidation = validatePhone(formData.phone);
        if (!phoneValidation.isValid) newErrors.phone = phoneValidation.error;
      }

      if (formData.newPassword.trim()) {
        if (formData.newPassword.length < 6) {
          newErrors.newPassword = 'Password must be at least 6 characters';
        }
      }

      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        toast.error('Please fix the errors in the form');
        return;
      }

      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      setLoading(true);

      try {
        const payload: UserProfileUpdatePayload = {
          user_name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() ? formatPhoneForApi(formData.phone) : '',
          role: formData.role,
        };
        if (formData.newPassword.trim()) {
          payload.password = formData.newPassword.trim();
        }

        await userProfileService.updateProfile(payload);
        toast.success('Profile updated successfully');
        if (!hasCalledSuccessRef.current) {
          hasCalledSuccessRef.current = true;
          onSuccess();
        }
        onClose();
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Failed to update profile';
        toast.error(msg);
      } finally {
        setLoading(false);
        isSubmittingRef.current = false;
      }
    },
    [formData, onClose, onSuccess]
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 id="edit-profile-title" className="text-xl font-bold text-gray-900 dark:text-white">
              Edit Profile
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={handleFieldChange('name')}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 ${
                  errors.name ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Your name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={handleFieldChange('email')}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 ${
                  errors.email ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={handleFieldChange('phone')}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 ${
                  errors.phone ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="10-digit phone (optional)"
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role *
              </label>
              <select
                value={formData.role}
                onChange={handleFieldChange('role')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New password (optional)
              </label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={handleFieldChange('newPassword')}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 ${
                  errors.newPassword ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Leave blank to keep current"
                autoComplete="new-password"
              />
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.newPassword}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
