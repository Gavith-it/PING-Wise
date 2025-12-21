'use client';

import { useEffect, useState, useRef } from 'react';
import { CheckCircle2, CalendarCheck, UserPlus, MessageSquare, Megaphone, UserCheck, AlertCircle, X } from 'lucide-react';
import { useNotifications, NotificationType } from '@/contexts/NotificationContext';

export default function NotificationToast() {
  const { notifications } = useNotifications();
  const [visibleNotification, setVisibleNotification] = useState<typeof notifications[0] | null>(null);
  const shownNotificationIds = useRef<Set<string>>(new Set());
  const previousNotificationsLength = useRef<number>(0);

  useEffect(() => {
    // Only show toast for NEW notifications (when count increases)
    if (notifications.length > previousNotificationsLength.current) {
      const latest = notifications[0];
      
      // Only show if we haven't shown this notification before
      if (latest && !shownNotificationIds.current.has(latest.id)) {
        shownNotificationIds.current.add(latest.id);
        setVisibleNotification(latest);
        
        // Auto-hide after 5 seconds
        const timer = setTimeout(() => {
          setVisibleNotification(null);
        }, 5000);

        previousNotificationsLength.current = notifications.length;
        return () => clearTimeout(timer);
      }
    }
    
    // Update the previous length
    previousNotificationsLength.current = notifications.length;
  }, [notifications]);

  if (!visibleNotification) return null;

  const getIcon = (type: NotificationType) => {
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

  const getColor = (type: NotificationType) => {
    switch (type) {
      case 'appointment':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'patient':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'campaign':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      case 'whatsapp':
        return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      case 'team':
        return 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800';
      case 'reminder':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const Icon = getIcon(visibleNotification.type);
  const colorClass = getColor(visibleNotification.type);

  return (
    <div className="fixed top-16 md:top-20 right-2 md:right-4 z-50 animate-slide-in-right">
      <div className={`${colorClass} border rounded-lg md:rounded-xl shadow-lg p-3 md:p-4 max-w-[calc(100vw-1rem)] md:max-w-sm min-w-[280px] md:min-w-[320px]`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Icon className="w-5 h-5 md:w-6 md:h-6 text-gray-700 dark:text-gray-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white mb-0.5">
              {visibleNotification.title}
            </h4>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {visibleNotification.message}
            </p>
          </div>
          <button
            onClick={() => setVisibleNotification(null)}
            className="flex-shrink-0 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

