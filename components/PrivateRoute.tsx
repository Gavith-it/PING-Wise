'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (!loading) {
      // Check authentication - use localStorage as source of truth
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      // If no token or not authenticated, redirect to login
      if (!token || !isAuthenticated) {
        setShouldRedirect(true);
        router.replace('/login');
      }
    }
  }, [isAuthenticated, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If redirecting, show nothing (or loading)
  if (shouldRedirect) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Check token from localStorage as final check
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token || !isAuthenticated) {
    // If somehow we get here without auth, redirect
    router.replace('/login');
    return null;
  }

  return <>{children}</>;
}

