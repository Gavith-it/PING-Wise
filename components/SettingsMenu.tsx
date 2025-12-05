'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, User, Settings as SettingsIcon, Moon, Sun, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.map(n => n.charAt(0).toUpperCase()).join('');
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 md:p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Settings Menu"
      >
        <Menu className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop for both mobile and desktop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Panel - Sidebar for both mobile and desktop */}
          <div className="fixed left-0 top-0 h-full w-[280px] md:w-[320px] bg-white dark:bg-gray-900 shadow-2xl z-50">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 md:p-5 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile Section */}
              <div className="p-4 md:p-5 bg-gradient-to-r from-primary to-primary-dark">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-full flex items-center justify-center text-primary font-semibold text-lg md:text-xl shadow-md">
                    {getInitials(user?.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-base md:text-lg truncate">
                      {user?.name || 'User'}
                    </p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 text-white text-xs rounded-full">
                      BETA
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto py-2">
                <button
                  onClick={() => handleNavigation('/profile')}
                  className="w-full flex items-center justify-between px-4 md:px-5 py-3 md:py-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary" />
                    <span className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-300">Profile</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={() => handleNavigation('/settings')}
                  className="w-full flex items-center justify-between px-4 md:px-5 py-3 md:py-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <SettingsIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary" />
                    <span className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-300">Settings</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-4 md:px-5 py-3 md:py-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    {isDark ? (
                      <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary" />
                    ) : (
                      <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary" />
                    )}
                    <span className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-300">Dark Theme</span>
                  </div>
                  <div className={`relative w-11 h-6 rounded-full transition-colors ${isDark ? 'bg-primary' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${isDark ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </button>

                <button
                  onClick={() => handleNavigation('/faqs')}
                  className="w-full flex items-center justify-between px-4 md:px-5 py-3 md:py-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <HelpCircle className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary" />
                    <span className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-300">FAQs</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Log Out Button */}
              <div className="p-4 md:p-5 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm md:text-base">Log Out</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

