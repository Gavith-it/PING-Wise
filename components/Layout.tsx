'use client';

import Header from './Header';
import BottomNav from './BottomNav';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 pb-24 md:pb-4">
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-3 md:py-4">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

