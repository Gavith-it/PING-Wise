'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Settings, X, Home, Users, Calendar, Megaphone, UserCheck, FileText, CalendarCheck, UserPlus, MessageSquare, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import SettingsMenu from '@/components/SettingsMenu';
export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Prevent hydration mismatch by only rendering client-side content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return CalendarCheck;
      case 'patient':
        return UserPlus;
      case 'campaign':
        return Megaphone;
      case 'whatsapp':
        return MessageSquare;
      case 'team':
        return UserCheck;
      case 'reminder':
        return AlertCircle;
      default:
        return CheckCircle2;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'bg-blue-100 text-blue-600';
      case 'patient':
        return 'bg-green-100 text-green-600';
      case 'campaign':
        return 'bg-purple-100 text-purple-600';
      case 'whatsapp':
        return 'bg-emerald-100 text-emerald-600';
      case 'team':
        return 'bg-indigo-100 text-indigo-600';
      case 'reminder':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/crm', icon: Users, label: 'Patients' },
    { path: '/appointments', icon: Calendar, label: 'Appointments' },
    { path: '/campaigns', icon: Megaphone, label: 'Campaigns' },
    { path: '/team', icon: UserCheck, label: 'Team' },
    { path: '/reports', icon: FileText, label: 'Reports' },
  ];

  const isActive = (path: string) => {
    return pathname === path;
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.map(n => n.charAt(0).toUpperCase()).join('');
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 sticky top-0 z-40">
      <div className="px-3 md:px-4 py-2 md:py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 md:space-x-3">
          <SettingsMenu />
          <h1 className="text-lg md:text-xl font-bold text-primary dark:text-primary">PingWise</h1>
          
          <nav className="hidden md:flex items-center space-x-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    active
                      ? 'bg-primary text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-2 md:space-x-3">
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications && unreadCount > 0) {
                  markAllAsRead();
                }
              }}
              className="relative p-1.5 md:p-2 text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-0 active:bg-transparent active:text-gray-600 dark:active:text-gray-300"
            >
              <Bell className="w-4 h-4 md:w-5 md:h-5" />
              {mounted && unreadCount > 0 && (
                <div className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-[8px] md:text-xs font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                </div>
              )}
            </button>
          </div>

          <button
            onClick={() => router.push(`/guide?page=${pathname}`)}
            className="p-1.5 md:p-2 text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-0 active:bg-transparent active:text-gray-600 dark:active:text-gray-300"
            title="Help & User Guide"
          >
            <HelpCircle className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>

      {showNotifications && (
        <div className="absolute top-full right-2 md:right-4 mt-2 w-[calc(100vw-1rem)] md:w-80 max-w-sm bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-lg z-50 max-h-[70vh] md:max-h-96 overflow-hidden flex flex-col">
          <div className="p-3 md:p-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">Notifications</h3>
              <div className="flex items-center space-x-2">
                {notifications.length > 0 && unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary hover:text-primary-dark font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-4 md:p-6 text-center">
                <Bell className="w-8 h-8 md:w-12 md:h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">No notifications</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">You&apos;re all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  const iconColor = getNotificationColor(notification.type);
                  return (
                    <div
                      key={notification.id}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id);
                        }
                      }}
                      className={`p-3 md:p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-8 h-8 md:w-10 md:h-10 ${iconColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <p className={`text-xs md:text-sm font-semibold text-gray-900 ${!notification.read ? 'font-bold' : ''}`}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1 ml-2"></div>
                            )}
                          </div>
                          <p className="text-xs md:text-sm text-gray-600 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-[10px] md:text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearNotification(notification.id);
                          }}
                          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                        >
                          <X className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

