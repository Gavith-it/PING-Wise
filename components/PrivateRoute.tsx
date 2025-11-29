'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for auth to finish loading
    if (!loading) {
      setIsChecking(false);
      // Check authentication - use localStorage as source of truth to avoid race conditions
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token || (!isAuthenticated && !token)) {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, loading, router]);

  // Show loading while checking authentication
  if (loading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check token from localStorage as fallback
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

