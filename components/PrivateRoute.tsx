'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);

  // Immediate check on mount - before any rendering
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('token');
    
    // If no token, redirect immediately
    if (!token) {
      router.replace('/login');
      return;
    }
    
    setHasChecked(true);
  }, [router]);

  // Check after auth loading completes
  useEffect(() => {
    if (!loading && hasChecked) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      // If no token or not authenticated after loading, redirect
      if (!token || !isAuthenticated) {
        router.replace('/login');
      }
    }
  }, [loading, isAuthenticated, hasChecked, router]);

  // Show loading while checking authentication
  if (loading || !hasChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Final check - if not authenticated, don't render
  if (!isAuthenticated) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      return null; // Will redirect via useEffect
    }
    return null;
  }

  return <>{children}</>;
}

