'use client';

import Header from './Header';
import BottomNav from './BottomNav';
import { usePathname } from 'next/navigation';

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // For CRM page, use fixed height layout with scrollable content
  // For other pages, use normal scrolling
  const isCRM = pathname === '/crm';

  return (
    <div className={`${isCRM ? 'h-screen overflow-hidden' : 'min-h-screen'} bg-gray-50 flex flex-col`}>
      <Header />
      <main className={`flex-1 ${isCRM ? 'pb-0 overflow-hidden min-h-0' : 'pb-24 md:pb-4'}`}>
        <div className={`max-w-7xl mx-auto px-3 md:px-4 py-3 md:py-4 ${isCRM ? 'h-full flex flex-col min-h-0' : ''}`}>
          {children}
        </div>
      </main>
      {!isCRM && <BottomNav />}
    </div>
  );
}

