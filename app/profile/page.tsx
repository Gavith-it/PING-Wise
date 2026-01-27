'use client';

import { useState } from 'react';
import { ArrowLeft, Mail, Phone, Building, Award, Calendar, Edit, UserCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import { format } from 'date-fns';
import { useUserProfile } from './hooks/useUserProfile';
import EditProfileModal from '@/components/modals/EditProfileModal';

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, loading: profileLoading, refetch } = useUserProfile();
  const [showEditModal, setShowEditModal] = useState(false);

  /** Prefer API profile, fallback to Auth user (e.g. loading/error). */
  const displayName = profile?.name || user?.name;
  const displayEmail = profile?.email ?? user?.email;
  const displayPhone = profile?.phone ?? user?.phone;
  const displayRole = profile?.role ?? user?.role;
  const displayCreatedAt = profile?.createdAt ?? (user as { createdAt?: Date | string } | null)?.createdAt;
  const displayDepartment = user?.department;
  const displaySpecialization = user?.specialization;
  const displayExperience = user?.experience;

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.map(n => n.charAt(0).toUpperCase()).join('');
  };

  const formatAccountType = (role?: string) => {
    if (!role) return 'User';
    const roleMap: Record<string, string> = {
      'admin': 'Administrator',
      'doctor': 'Doctor',
      'staff': 'Staff Member',
    };
    return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1);
  };

  const formatMemberSince = (date?: Date | string) => {
    if (!date) return 'N/A';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'MMMM yyyy');
    } catch {
      return 'N/A';
    }
  };

  return (
    <PrivateRoute>
      <Layout>
        <div className="space-y-4 md:space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-4 md:mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Profile</h2>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-0.5">View and manage your profile</p>
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-3xl md:text-4xl shadow-lg">
                {getInitials(displayName)}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {profileLoading && !displayName ? 'Loading…' : (displayName || 'User')}
                </h3>
                <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-4">
                  {displayRole ? displayRole.charAt(0).toUpperCase() + displayRole.slice(1) : 'User'}
                </p>
                <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  BETA
                </span>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <h4 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-6">Personal Information</h4>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</p>
                  <p className="text-base text-gray-900 dark:text-white">{displayEmail || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Phone</p>
                  <p className="text-base text-gray-900 dark:text-white">{displayPhone || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Member Since</p>
                  <p className="text-base text-gray-900 dark:text-white">{formatMemberSince(displayCreatedAt)}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <UserCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Account Type</p>
                  <p className="text-base text-gray-900 dark:text-white">{formatAccountType(displayRole)}</p>
                </div>
              </div>

              {displayDepartment && (
                <div className="flex items-start space-x-4">
                  <Building className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Department</p>
                    <p className="text-base text-gray-900 dark:text-white">{displayDepartment}</p>
                  </div>
                </div>
              )}

              {displaySpecialization && (
                <div className="flex items-start space-x-4">
                  <Award className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Specialization</p>
                    <p className="text-base text-gray-900 dark:text-white">{displaySpecialization}</p>
                  </div>
                </div>
              )}

              {displayExperience && (
                <div className="flex items-start space-x-4">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Experience</p>
                    <p className="text-base text-gray-900 dark:text-white">{displayExperience}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Edit Profile Button */}
          <button
            onClick={() => setShowEditModal(true)}
            className="w-full bg-primary text-white py-3 px-4 rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
          >
            <Edit className="w-5 h-5" />
            <span>Edit Profile</span>
          </button>
        </div>

        {showEditModal && (
          <EditProfileModal
            profile={
              profile ?? {
                name: user?.name ?? '',
                email: user?.email ?? '',
                phone: user?.phone ?? '',
                role: (user?.role as string) ?? 'staff',
              }
            }
            onClose={() => setShowEditModal(false)}
            onSuccess={() => refetch()}
          />
        )}
      </Layout>
    </PrivateRoute>
  );
}

