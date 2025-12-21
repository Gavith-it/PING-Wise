'use client';

import { useState } from 'react';
import { ArrowLeft, Bell, Shield, Globe, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import ToggleSwitch from '@/components/ui/toggle-switch';

export default function SettingsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

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
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-0.5">Manage your preferences</p>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-6">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Notifications</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex-1">
                  <p className="text-base font-medium text-gray-900 dark:text-white">Push Notifications</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive push notifications</p>
                </div>
                <ToggleSwitch
                  enabled={notifications}
                  onChange={setNotifications}
                  label="Push Notifications"
                  size="md"
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex-1">
                  <p className="text-base font-medium text-gray-900 dark:text-white">Email Notifications</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive email updates</p>
                </div>
                <ToggleSwitch
                  enabled={emailNotifications}
                  onChange={setEmailNotifications}
                  label="Email Notifications"
                  size="md"
                />
              </div>
            </div>
          </div>

          {/* Privacy & Security */}
          <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-6">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Privacy & Security</h3>
            </div>
            
            <div className="space-y-4">
              <button className="w-full text-left py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 transition-colors">
                <p className="text-base font-medium text-gray-900 dark:text-white">Change Password</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Update your account password</p>
              </button>

              <button className="w-full text-left py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 transition-colors">
                <p className="text-base font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security</p>
              </button>
            </div>
          </div>

          {/* General */}
          <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-6">
              <Globe className="w-5 h-5 text-primary" />
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">General</h3>
            </div>
            
            <div className="space-y-4">
              <button className="w-full text-left py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 transition-colors">
                <p className="text-base font-medium text-gray-900 dark:text-white">Language</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">English (US)</p>
              </button>

              <button className="w-full text-left py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 transition-colors">
                <p className="text-base font-medium text-gray-900 dark:text-white">About</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Version 2.0.0</p>
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl p-6 md:p-8 shadow-sm border border-red-200 dark:border-red-900">
            <div className="flex items-center space-x-3 mb-6">
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h3 className="text-lg md:text-xl font-semibold text-red-600 dark:text-red-400">Danger Zone</h3>
            </div>
            
            <button className="w-full text-left py-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg px-2 transition-colors">
              <p className="text-base font-medium text-red-600 dark:text-red-400">Delete Account</p>
              <p className="text-sm text-red-500 dark:text-red-500">Permanently delete your account and all data</p>
            </button>
          </div>
        </div>
      </Layout>
    </PrivateRoute>
  );
}

