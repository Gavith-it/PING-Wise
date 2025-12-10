'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, Users, Calendar, Megaphone, UserCheck, FileText } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useFooterVisibility } from '@/contexts/FooterVisibilityContext';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { isVisible: crmFooterVisible } = useFooterVisibility();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/crm', icon: Users, label: 'CRM' },
    { path: '/campaigns', icon: Megaphone, label: 'Campaigns' },
    { path: '/appointments', icon: Calendar, label: 'Appointments' },
    { path: '/team', icon: UserCheck, label: 'Team' },
  ];

  const isActive = (path: string) => {
    return pathname === path;
  };

  useEffect(() => {
    // Reset visibility when pathname changes
    setIsVisible(true);
    lastScrollY.current = 0;
  }, [pathname]);

  // For CRM page, use the visibility from context (controlled by patient list scroll)
  const finalVisibility = pathname === '/crm' ? crmFooterVisible : isVisible;

  // Sync CRM footer visibility with context
  useEffect(() => {
    if (pathname === '/crm') {
      setIsVisible(crmFooterVisible);
    }
  }, [pathname, crmFooterVisible]);

  useEffect(() => {
    // Skip if CRM page (handled by context above)
    if (pathname === '/crm') {
      return;
    }

    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Get scroll position from window or document
          const currentScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
          
          // Show nav when at top of page
          if (currentScrollY < 10) {
            setIsVisible(true);
            lastScrollY.current = currentScrollY;
            ticking = false;
            return;
          }
          
          // Calculate scroll direction
          const scrollDifference = currentScrollY - lastScrollY.current;
          
          // Hide nav when scrolling down (after 50px threshold for better responsiveness)
          if (scrollDifference > 5 && currentScrollY > 50) {
            setIsVisible(false);
          } 
          // Show nav when scrolling up
          else if (scrollDifference < -5) {
            setIsVisible(true);
          }
          
          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    // Add scroll listener to window
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Also listen to touchmove for mobile scrolling
    window.addEventListener('touchmove', handleScroll, { passive: true });
    
    // Initial check
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchmove', handleScroll);
    };
  }, [pathname, crmFooterVisible]);

  // Check if we're on CRM page (footer should be fixed at bottom, not scrollable)
  const isScrollableFooter = pathname === '/crm';

  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden shadow-lg safe-area-inset-bottom transition-transform duration-300 ease-in-out ${
        finalVisibility ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="flex items-center justify-around px-1 py-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center px-1.5 py-1 rounded-lg transition-all min-w-[50px] flex-1 ${
                active
                  ? 'text-primary bg-green-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className={`w-4 h-4 md:w-5 md:h-5 ${active ? 'text-primary' : 'text-gray-500'}`} />
              <span className={`text-[10px] md:text-xs mt-0.5 md:mt-1 ${active ? 'font-semibold text-primary' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

