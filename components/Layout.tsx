'use client';

import Header from './Header';
import BottomNav from './BottomNav';
import { usePathname } from 'next/navigation';

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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

