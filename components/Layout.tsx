'use client';

import { useEffect, useRef } from 'react';
import Header from './Header';
import BottomNav from './BottomNav';
import { usePathname } from 'next/navigation';
import { useMenu } from '@/contexts/MenuContext';
import { MENU_DEST_KEY, NEXT_BACK_OPENS_MENU_KEY } from '@/contexts/MenuContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { openMenu } = useMenu();
  const hasPushedDuplicateRef = useRef(false);

  // When we landed on a page we navigated to from the menu, push a duplicate history entry
  // so the first back press only opens the menu (stays on same page) instead of navigating away.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const menuDest = sessionStorage.getItem(MENU_DEST_KEY);
    if (menuDest && pathname === menuDest) {
      hasPushedDuplicateRef.current = true;
      sessionStorage.removeItem(MENU_DEST_KEY);
      sessionStorage.setItem(NEXT_BACK_OPENS_MENU_KEY, '1');
      window.history.pushState(null, '', pathname);
    } else {
      hasPushedDuplicateRef.current = false;
    }
  }, [pathname]);

  // When user presses back and we had pushed a duplicate entry, we're still on the same page — just open the menu.
  // Re-push a duplicate entry so the next back again opens the menu (never navigate away from this page).
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      if (sessionStorage.getItem(NEXT_BACK_OPENS_MENU_KEY)) {
        sessionStorage.removeItem(NEXT_BACK_OPENS_MENU_KEY);
        hasPushedDuplicateRef.current = false;
        openMenu();
        // Push duplicate again so next back press also only opens menu (no redirect to dashboard).
        const currentPath = window.location.pathname;
        sessionStorage.setItem(NEXT_BACK_OPENS_MENU_KEY, '1');
        window.history.pushState(null, '', currentPath);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [openMenu]);

  // All pages now use normal scrolling (CRM uses sticky header instead of container scrolling)
  const isCRM = pathname === '/crm';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      <main className={`flex-1 ${isCRM ? 'pb-16 md:pb-0' : 'pb-24 md:pb-4'}`}>
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-3 md:py-4">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

