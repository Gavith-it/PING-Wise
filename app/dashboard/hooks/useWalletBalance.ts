import { useState, useEffect, useRef } from 'react';
import { walletService } from '@/lib/services/api';
import { useAuth } from '@/contexts/AuthContext';

export function useWalletBalance() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const fetchWalletBalance = async () => {
      // Prevent duplicate calls
      if (isLoadingRef.current || hasLoadedRef.current) {
        return;
      }
      
      // Wait for user to be authenticated
      if (!user || !isAuthenticated) {
        return;
      }
      
      // Check if token exists in sessionStorage before making request
      if (typeof window !== 'undefined') {
        const token = sessionStorage.getItem('token');
        if (!token) {
          return;
        }
      }
      
      try {
        isLoadingRef.current = true;
        // Try to fetch from API, fallback to user object or default
        try {
          const response = await walletService.getBalance();
          setWalletBalance(response.data?.balance || 0);
          hasLoadedRef.current = true;
        } catch (apiError: any) {
          // Silently handle auth errors (401) - user might not be fully authenticated yet
          // If API endpoint doesn't exist yet (404), silently use default
          const status = apiError?.response?.status;
          if (status === 401 || status === 404) {
            // Silent fail for auth errors and missing endpoints
            const balance = (user as any)?.walletBalance || 0;
            setWalletBalance(balance);
            hasLoadedRef.current = true;
          } else {
            // Check user object or use default
            const balance = (user as any)?.walletBalance || 0;
            setWalletBalance(balance);
            hasLoadedRef.current = true;
          }
        }
      } catch (error) {
        // Silent fail - wallet balance is optional
        setWalletBalance(0);
        hasLoadedRef.current = true;
      } finally {
        isLoadingRef.current = false;
      }
    };

    if (!authLoading && isAuthenticated && user) {
      fetchWalletBalance();
    }
  }, [user, isAuthenticated, authLoading]);

  return walletBalance;
}
