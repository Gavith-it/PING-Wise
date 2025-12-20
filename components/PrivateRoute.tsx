'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated (only check once after loading completes)
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Double-check token in sessionStorage as fallback
      if (typeof window !== 'undefined') {
        const token = sessionStorage.getItem('token');
        if (!token) {
          router.replace('/login');
        }
      } else {
        router.replace('/login');
      }
    }
  }, [loading, isAuthenticated, router]);

  // Optimistic rendering: If we have a token, trust it and render immediately
  // This allows instant dashboard display after login (like big apps)
  // Only show loading on initial app load when checking for existing session
  const hasToken = typeof window !== 'undefined' && sessionStorage.getItem('token');
  
  // If we have a token, trust it and render immediately (optimistic rendering)
  // This ensures instant display after login - no waiting for auth check
  if (hasToken || isAuthenticated) {
    return <>{children}</>;
  }
  
  // Only show loading if we're checking auth AND no token exists (initial app load)
  if (loading && !isAuthenticated && !hasToken) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and no token, show nothing (will redirect via useEffect)
  if (!isAuthenticated) {
    return null;
  }

  // Fallback: render children
  return <>{children}</>;
}

