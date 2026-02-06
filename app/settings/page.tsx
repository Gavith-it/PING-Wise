'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Shield, Globe, Trash2, Crown, Gift, ChevronRight, X, Sparkles, MessageCircle, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import ToggleSwitch from '@/components/ui/toggle-switch';
import { useFontSize } from '@/contexts/FontSizeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMenu } from '@/contexts/MenuContext';
import {
  userProfileService,
  configService,
  CONFIG_KEYS,
  configValueToEnabled,
  ConfigItem,
} from '@/lib/services/api';

function getConfigValue(config: { config_name: string; config_value: string }[], name: string): string {
  const item = config.find((c) => c.config_name === name);
  return item?.config_value ?? 'off';
}

function findConfigItem(config: ConfigItem[], name: string): ConfigItem | null {
  return config.find((c) => c.config_name === name) ?? null;
}

export default function SettingsPage() {
  const { openMenu } = useMenu();
  const { logout } = useAuth();
  const { fontSizePercentage, setFontSizePercentage, increaseFontSize, decreaseFontSize, resetFontSize } = useFontSize();
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [followUpReminder, setFollowUpReminder] = useState(false);
  const [appointmentReminder, setAppointmentReminder] = useState(false);
  const [whatsappConfigItems, setWhatsappConfigItems] = useState<ConfigItem[]>([]);
  const [whatsappConfigLoading, setWhatsappConfigLoading] = useState(true);
  const [whatsappUpdating, setWhatsappUpdating] = useState<string | null>(null);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;
    setWhatsappConfigLoading(true);
    configService
      .getConfig()
      .then((res) => {
        if (!mounted) return;
        const cfg = res.config ?? [];
        setWhatsappConfigItems(cfg);
        setFollowUpReminder(configValueToEnabled(getConfigValue(cfg, CONFIG_KEYS.FOLLOW_UP_REMINDER)));
        setAppointmentReminder(configValueToEnabled(getConfigValue(cfg, CONFIG_KEYS.APPOINTMENT_REMINDER)));
      })
      .catch(() => {
        if (!mounted) return;
        setFollowUpReminder(false);
        setAppointmentReminder(false);
      })
      .finally(() => {
        if (mounted) setWhatsappConfigLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const updateWhatsAppConfig = async (configName: string, enabled: boolean) => {
    const item = findConfigItem(whatsappConfigItems, configName);
    if (!item) {
      toast.error(`Configuration not found: ${configName}`);
      return;
    }

    const newValue = enabled ? 'on' : 'off';
    const updatedItem: ConfigItem = {
      ...item,
      config_value: newValue,
    };

    setWhatsappUpdating(configName);
    try {
      await configService.updateConfig([updatedItem]);
      const updatedConfig = whatsappConfigItems.map((c) =>
        c.config_name === configName ? updatedItem : c
      );
      setWhatsappConfigItems(updatedConfig);
      if (configName === CONFIG_KEYS.FOLLOW_UP_REMINDER) {
        setFollowUpReminder(enabled);
      } else if (configName === CONFIG_KEYS.APPOINTMENT_REMINDER) {
        setAppointmentReminder(enabled);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update reminder setting';
      toast.error(msg);
      if (configName === CONFIG_KEYS.FOLLOW_UP_REMINDER) {
        setFollowUpReminder(!enabled);
      } else if (configName === CONFIG_KEYS.APPOINTMENT_REMINDER) {
        setAppointmentReminder(!enabled);
      }
    } finally {
      setWhatsappUpdating(null);
    }
  };

  return (
    <PrivateRoute>
      <Layout>
        <div className="space-y-4 md:space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-4 md:mb-6">
            <button
              onClick={openMenu}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Open menu"
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
                  onChange={(enabled) => {
                    setFollowUpReminder(enabled);
                    updateWhatsAppConfig(CONFIG_KEYS.FOLLOW_UP_REMINDER, enabled);
                  }}
                  label="Follow-Up Reminder"
                  size="md"
                  disabled={whatsappConfigLoading || whatsappUpdating === CONFIG_KEYS.FOLLOW_UP_REMINDER}
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex-1">
                  <p className="text-base font-medium text-gray-900 dark:text-white">Appointment Reminder</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive WhatsApp reminders for appointments</p>
                </div>
                <ToggleSwitch
                  enabled={appointmentReminder}
                  onChange={(enabled) => {
                    setAppointmentReminder(enabled);
                    updateWhatsAppConfig(CONFIG_KEYS.APPOINTMENT_REMINDER, enabled);
                  }}
                  label="Appointment Reminder"
                  size="md"
                  disabled={whatsappConfigLoading || whatsappUpdating === CONFIG_KEYS.APPOINTMENT_REMINDER}
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

              {/* Font Size Control */}
              <div className="py-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-base font-medium text-gray-900 dark:text-white">Font Size</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{fontSizePercentage}%</p>
                  </div>
                  <button
                    onClick={resetFontSize}
                    className="flex items-center justify-center px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                    aria-label="Reset font size to default"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reset
                  </button>
                </div>
                
                {/* Slider Container */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={decreaseFontSize}
                      disabled={fontSizePercentage <= 50}
                      className="flex items-center justify-center p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 shadow-sm"
                      aria-label="Decrease font size"
                    >
                      <ZoomOut className="w-5 h-5" />
                    </button>
                    
                    {/* Range Slider */}
                    <div className="flex-1 relative">
                      <input
                        type="range"
                        min="50"
                        max="125"
                        step="5"
                        value={fontSizePercentage}
                        onChange={(e) => setFontSizePercentage(parseInt(e.target.value, 10))}
                        className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer font-size-slider"
                        style={{
                          background: `linear-gradient(to right, #1A3E9E 0%, #1A3E9E ${((fontSizePercentage - 50) / (125 - 50)) * 100}%, #e5e7eb ${((fontSizePercentage - 50) / (125 - 50)) * 100}%, #e5e7eb 100%)`
                        }}
                      />
                    </div>
                    
                    <button
                      onClick={increaseFontSize}
                      disabled={fontSizePercentage >= 125}
                      className="flex items-center justify-center p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 shadow-sm"
                      aria-label="Increase font size"
                    >
                      <ZoomIn className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Percentage Labels - Only 50% and 125% */}
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
                    <span className="font-medium">50%</span>
                    <span className="font-medium">125%</span>
                  </div>
                </div>
              </div>

              <button className="w-full text-left py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 transition-colors">
                <p className="text-base font-medium text-gray-900 dark:text-white">About</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Version 2.0.0</p>
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl p-6 md:p-8 shadow-sm border-2 border-red-200 dark:border-red-900">
            <div className="flex items-center space-x-3 mb-6">
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h3 className="text-lg md:text-xl font-semibold text-red-600 dark:text-red-400">Danger Zone</h3>
            </div>

            <div className="space-y-1">
              <p className="text-base font-medium text-red-600 dark:text-red-400">Delete Account</p>
              <p className="text-sm text-red-500 dark:text-red-500">Permanently delete your account and all data</p>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Delete Account Confirmation Modal */}
        {showDeleteConfirm && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-[60]"
              onClick={() => !deleting && setShowDeleteConfirm(false)}
              role="presentation"
            />
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
              <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Account</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base mb-6">
                  This will permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => !deleting && setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (deleting) return;
                      setDeleting(true);
                      try {
                        await userProfileService.deleteProfile();
                        toast.success('Account deleted');
                        setShowDeleteConfirm(false);
                        logout();
                      } catch (err: any) {
                        const msg = err?.response?.data?.message || err?.message || 'Failed to delete account';
                        toast.error(msg);
                      } finally {
                        setDeleting(false);
                      }
                    }}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

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

