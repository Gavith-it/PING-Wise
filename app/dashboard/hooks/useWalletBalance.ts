import { useState, useEffect, useRef } from 'react';
import { walletService } from '@/lib/services/api';
import { useAuth } from '@/contexts/AuthContext';

// Shared cache for wallet balance across the application
const walletBalanceCache: {
  balance: number;
  timestamp: number;
} = {
  balance: 0,
  timestamp: 0,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes - wallet balance doesn't change frequently

export function useWalletBalance() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [walletBalance, setWalletBalance] = useState<number>(() => {
    // Initialize from cache if available
    const cacheAge = Date.now() - walletBalanceCache.timestamp;
    if (walletBalanceCache.timestamp > 0 && cacheAge < CACHE_DURATION) {
      return walletBalanceCache.balance;
    }
    return 0;
  });
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const fetchWalletBalance = async () => {
      // Prevent duplicate calls
      if (isLoadingRef.current) {
        return;
      }
      
      // Check cache first - if cache is valid, use it and skip API call
      const cacheAge = Date.now() - walletBalanceCache.timestamp;
      const isCacheValid = walletBalanceCache.timestamp > 0 && cacheAge < CACHE_DURATION;
      
      if (isCacheValid && !hasLoadedRef.current) {
        // Use cached balance
        setWalletBalance(walletBalanceCache.balance);
        hasLoadedRef.current = true;
        return;
      }
      
      // If already loaded and cache is valid, don't make API call
      if (hasLoadedRef.current && isCacheValid) {
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
          const balance = response.data?.balance || 0;
          setWalletBalance(balance);
          // Update cache
          walletBalanceCache.balance = balance;
          walletBalanceCache.timestamp = Date.now();
          hasLoadedRef.current = true;
        } catch (apiError: any) {
          // Silently handle auth errors (401) - user might not be fully authenticated yet
          // If API endpoint doesn't exist yet (404), silently use default
          const status = apiError?.response?.status;
          if (status === 401 || status === 404) {
            // Silent fail for auth errors and missing endpoints
            const balance = (user as any)?.walletBalance || 0;
            setWalletBalance(balance);
            walletBalanceCache.balance = balance;
            walletBalanceCache.timestamp = Date.now();
            hasLoadedRef.current = true;
          } else {
            // Check user object or use default
            const balance = (user as any)?.walletBalance || 0;
            setWalletBalance(balance);
            walletBalanceCache.balance = balance;
            walletBalanceCache.timestamp = Date.now();
            hasLoadedRef.current = true;
          }
        }
      } catch (error) {
        // Silent fail - wallet balance is optional
        setWalletBalance(0);
        walletBalanceCache.balance = 0;
        walletBalanceCache.timestamp = Date.now();
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
