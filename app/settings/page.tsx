'use client';

import { useState } from 'react';
import { ArrowLeft, Bell, Shield, Globe, Trash2, Crown, Gift, ChevronRight, X, Sparkles, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import ToggleSwitch from '@/components/ui/toggle-switch';

export default function SettingsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [followUpReminder, setFollowUpReminder] = useState(false);
  const [appointmentReminder, setAppointmentReminder] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

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

          {/* WhatsApp Reminder Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-6">
              <MessageCircle className="w-5 h-5 text-primary" />
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">WhatsApp Reminder</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex-1">
                  <p className="text-base font-medium text-gray-900 dark:text-white">Follow-Up Reminder</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive WhatsApp reminders for follow-ups</p>
                </div>
                <ToggleSwitch
                  enabled={followUpReminder}
                  onChange={setFollowUpReminder}
                  label="Follow-Up Reminder"
                  size="md"
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex-1">
                  <p className="text-base font-medium text-gray-900 dark:text-white">Appointment Reminder</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive WhatsApp reminders for appointments</p>
                </div>
                <ToggleSwitch
                  enabled={appointmentReminder}
                  onChange={setAppointmentReminder}
                  label="Appointment Reminder"
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

          {/* Premium & Rewards */}
          <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-6">
              <Crown className="w-5 h-5 text-primary" />
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Premium & Rewards</h3>
            </div>
            
            <div className="space-y-4">
              <button 
                onClick={() => setShowComingSoon(true)}
                className="w-full flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 transition-colors opacity-75"
              >
                <div className="flex items-center space-x-3">
                  <Crown className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                  <div className="text-left">
                    <p className="text-base font-medium text-gray-900 dark:text-white">Get Premium</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Unlock all features</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              <button 
                onClick={() => setShowComingSoon(true)}
                className="w-full flex items-center justify-between py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 transition-colors opacity-75"
              >
                <div className="flex items-center space-x-3">
                  <Gift className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                  <div className="text-left">
                    <p className="text-base font-medium text-gray-900 dark:text-white">Refer and Win</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Earn rewards by referring friends</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
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

        {/* Coming Soon Modal */}
        {showComingSoon && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-[60]"
              onClick={() => setShowComingSoon(false)}
            />
            
            {/* Modal */}
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 relative">
                {/* Close Button */}
                <button
                  onClick={() => setShowComingSoon(false)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                    Coming Soon
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base mb-6">
                    This feature is currently under development and will be available soon. Stay tuned for updates!
                  </p>
                  <button
                    onClick={() => setShowComingSoon(false)}
                    className="w-full bg-primary text-white py-3 px-4 rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-md hover:shadow-lg"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </Layout>
    </PrivateRoute>
  );
}

