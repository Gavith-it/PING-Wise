'use client';

import { useState, useRef, useEffect, startTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, User, Settings as SettingsIcon, Moon, Sun, HelpCircle, LogOut, ChevronRight, Crown, Gift, Wallet, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useFooterVisibility } from '@/contexts/FooterVisibilityContext';
import ToggleSwitch from '@/components/ui/toggle-switch';

export default function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { setIsVisible: setFooterVisible } = useFooterVisibility();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hide footer when menu is open
  useEffect(() => {
    setFooterVisible(!isOpen);
  }, [isOpen, setFooterVisible]);

  // Close menu when navigation completes (pathname changes)
  useEffect(() => {
    if (navigatingTo && pathname === navigatingTo) {
      // Navigation completed, close menu
      setIsOpen(false);
      setNavigatingTo(null);
    }
  }, [pathname, navigatingTo]);

  const handleNavigation = (path: string) => {
    // Get current path to check if we need to navigate
    const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
    
    // Only navigate if we're not already on that path
    if (currentPath !== path) {
      // Set navigating state - this keeps menu open during navigation
      setNavigatingTo(path);
      
      // Navigate immediately - menu stays open until navigation completes
      // This prevents showing the old page (dashboard) while menu closes
      router.replace(path);
    } else {
      // Already on the path, just close menu
      setIsOpen(false);
    }
  };

  // No prefetching needed - these are static pages that don't require API calls

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const handleComingSoon = () => {
    setShowComingSoon(true);
    setIsOpen(false); // Close menu when showing coming soon modal
  };

  // Future: Uncomment when ready to enable navigation
  // const handlePremiumNavigation = () => {
  //   handleNavigation('/settings/premium');
  // };
  
  // const handleReferAndWinNavigation = () => {
  //   handleNavigation('/settings/refer-and-win');
  // };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.map(n => n.charAt(0).toUpperCase()).join('');
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 md:p-2 rounded-lg transition-all focus:outline-none focus:ring-0 active:bg-transparent active:text-gray-600 dark:active:text-gray-300 ${
          isOpen
            ? 'bg-primary/10 text-primary dark:bg-primary/20'
            : 'text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
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
                  className="w-full flex items-center justify-between px-4 md:px-5 py-3 md:py-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group focus:outline-none"
                >
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary" />
                    <span className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-300">Profile</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={() => handleNavigation('/settings')}
                  className="w-full flex items-center justify-between px-4 md:px-5 py-3 md:py-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group focus:outline-none"
                >
                  <div className="flex items-center space-x-3">
                    <SettingsIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary" />
                    <span className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-300">Settings</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={handleComingSoon}
                  className="w-full flex items-center justify-between px-4 md:px-5 py-3 md:py-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group opacity-75 focus:outline-none"
                  // Future: Uncomment when ready to enable
                  // onClick={() => handleNavigation('/settings/premium')}
                >
                  <div className="flex items-center space-x-3">
                    <Crown className="w-5 h-5 text-yellow-500 dark:text-yellow-400 group-hover:text-yellow-600" />
                    <span className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-300">Get Premium</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={handleComingSoon}
                  className="w-full flex items-center justify-between px-4 md:px-5 py-3 md:py-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group opacity-75 focus:outline-none"
                  // Future: Uncomment when ready to enable
                  // onClick={() => handleNavigation('/settings/refer-and-win')}
                >
                  <div className="flex items-center space-x-3">
                    <Gift className="w-5 h-5 text-purple-500 dark:text-purple-400 group-hover:text-purple-600" />
                    <span className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-300">Refer and Win</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={() => handleNavigation('/wallet')}
                  className="w-full flex items-center justify-between px-4 md:px-5 py-3 md:py-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group focus:outline-none"
                >
                  <div className="flex items-center space-x-3">
                    <Wallet className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary" />
                    <span className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-300">Wallet</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-4 md:px-5 py-3 md:py-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group focus:outline-none"
                >
                  <div className="flex items-center space-x-3">
                    {isDark ? (
                      <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary" />
                    ) : (
                      <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary" />
                    )}
                    <span className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-300">Dark Theme</span>
                  </div>
                  <ToggleSwitch
                    enabled={isDark}
                    onChange={toggleTheme}
                    label="Dark Theme"
                    size="md"
                  />
                </button>

                <button
                  onClick={() => handleNavigation('/faqs')}
                  className="w-full flex items-center justify-between px-4 md:px-5 py-3 md:py-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group focus:outline-none"
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
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors focus:outline-none"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm md:text-base">Log Out</span>
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
    </div>
  );
}

