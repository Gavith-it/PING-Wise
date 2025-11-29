'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, Users, Calendar, Megaphone, UserCheck, FileText } from 'lucide-react';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

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

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden shadow-lg safe-area-inset-bottom">
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

