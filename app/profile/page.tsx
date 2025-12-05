'use client';

import { useState } from 'react';
import { ArrowLeft, User, Mail, Phone, Building, Award, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.map(n => n.charAt(0).toUpperCase()).join('');
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
                {getInitials(user?.name)}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {user?.name || 'User'}
                </h3>
                <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-4">
                  {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
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
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email Address</p>
                  <p className="text-base text-gray-900 dark:text-white">{user?.email || 'N/A'}</p>
                </div>
              </div>

              {user?.phone && (
                <div className="flex items-start space-x-4">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Phone Number</p>
                    <p className="text-base text-gray-900 dark:text-white">{user.phone}</p>
                  </div>
                </div>
              )}

              {user?.department && (
                <div className="flex items-start space-x-4">
                  <Building className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Department</p>
                    <p className="text-base text-gray-900 dark:text-white">{user.department}</p>
                  </div>
                </div>
              )}

              {user?.specialization && (
                <div className="flex items-start space-x-4">
                  <Award className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Specialization</p>
                    <p className="text-base text-gray-900 dark:text-white">{user.specialization}</p>
                  </div>
                </div>
              )}

              {user?.experience && (
                <div className="flex items-start space-x-4">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Experience</p>
                    <p className="text-base text-gray-900 dark:text-white">{user.experience}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </PrivateRoute>
  );
}

