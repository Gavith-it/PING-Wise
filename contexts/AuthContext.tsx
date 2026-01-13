'use client';

/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the application.
 */

import React, { createContext, useState, useContext, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '@/types';
import { logger } from '@/lib/utils/logger';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (userName: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
  register: (userData: RegisterRequest) => Promise<boolean>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Initialize token as null for SSR - will be set in useEffect
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      // Ensure we're in browser environment
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }
      
      // Check localStorage first (for "remember me" tokens), then sessionStorage
      let storedToken = localStorage.getItem('token');
      let storageType: 'localStorage' | 'sessionStorage' = 'localStorage';
      
      if (!storedToken) {
        storedToken = sessionStorage.getItem('token');
        storageType = 'sessionStorage';
      }
      
      if (!storedToken) {
        // No token, clear everything and set loading to false
        setToken(null);
        setUser(null);
        setLoading(false);
        return;
      }

      // Token exists - set it first so it's available immediately
      // Then validate in background using CRM API /checkAuth
      setToken(storedToken);
      
      // Also set access_token for compatibility (use same storage as token)
      if (storageType === 'localStorage') {
        localStorage.setItem('access_token', storedToken);
      } else {
        sessionStorage.setItem('access_token', storedToken);
      }

      // Validate token using backend /checkAuth endpoint
      try {
        const backendUrl = process.env.NEXT_PUBLIC_CRM_API_BASE_URL || 'https://pw-crm-gateway-1.onrender.com';
        const checkAuthResponse = await fetch(`${backendUrl}/checkAuth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${storedToken}`,
          },
        });
        
        if (!checkAuthResponse.ok) {
          throw new Error('Token validation failed');
        }
        
        // Token is valid, restore user from storage (check same storage type as token)
        const storedUser = storageType === 'localStorage' 
          ? localStorage.getItem('user') 
          : sessionStorage.getItem('user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            // If parsing fails, token is valid but no user info - that's ok
            // User will be created on next login
          }
        }
      } catch (error) {
        // Token validation failed (401, network error, etc.)
        logger.error('Token validation error', error);
        // Clear all tokens on validation failure
        localStorage.removeItem('token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
    
    // Listen for storage events to sync across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && e.storageArea === sessionStorage) {
        if (!e.newValue) {
          // Token was removed, logout
          setToken(null);
          setUser(null);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = useCallback(async (userName: string, password: string, rememberMe: boolean = false): Promise<boolean> => {
    try {
      // Get backend URL from environment variable (same as CRM API)
      const BACKEND_API_BASE_URL = process.env.NEXT_PUBLIC_CRM_API_BASE_URL || 'https://pw-crm-gateway-1.onrender.com';
      const loginUrl = `${BACKEND_API_BASE_URL}/login`;
      
      // Always call backend URL directly (no proxy fallback)
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_name: userName,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Login failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle both access_token (from backend) and token (for compatibility)
      const token = data.access_token || data.token;
      
      if (token) {
        
        // Create user object from the backend response
        const nameParts = userName.includes('@') ? userName.split('@')[0] : userName;
        const firstName = nameParts.split('.')[0] || nameParts;
        const user: User = {
          id: userName, // Use userName as ID
          name: firstName.charAt(0).toUpperCase() + firstName.slice(1), // Capitalize first letter
          email: userName.includes('@') ? userName : `${userName}@pingwise.in`,
          role: (data.role as 'admin' | 'doctor' | 'staff') || 'staff',
          status: 'Active',
          initials: firstName.charAt(0).toUpperCase(),
        };
        
        // Store token based on rememberMe preference
        // If rememberMe is true, use localStorage (persists across sessions)
        // If rememberMe is false, use sessionStorage (cleared when browser closes)
        if (rememberMe) {
          localStorage.setItem('token', token);
          localStorage.setItem('access_token', token);
          localStorage.setItem('user', JSON.stringify(user));
          // Clear sessionStorage tokens to avoid conflicts
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('user');
        } else {
          sessionStorage.setItem('token', token);
          sessionStorage.setItem('access_token', token);
          sessionStorage.setItem('user', JSON.stringify(user));
          // Clear localStorage tokens to avoid conflicts
          localStorage.removeItem('token');
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
        }
        
        // Update state
        setToken(token);
        setUser(user);
        
        toast.success('Login successful!');
        return true;
      } else {
        toast.error('Login failed - No access token received');
        return false;
      }
    } catch (error: any) {
      logger.error('Login error', error);
      const errorMessage = error.message || 'Login failed. Please check your credentials.';
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    // Clear all tokens from both sessionStorage and localStorage
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    router.push('/login');
  }, [router]);

  const register = useCallback(async (userData: RegisterRequest): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.token && data.user) {
        const token = data.token;
        // Store token in both keys for consistency across all APIs
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('access_token', token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        // Clear any old localStorage token
        localStorage.removeItem('token');
        
        setUser(data.user);
        setToken(token);
        toast.success('Registration successful!');
        return true;
      } else {
        toast.error(data.message || 'Registration failed');
        return false;
      }
    } catch (error) {
      toast.error('Registration failed. Please try again.');
      return false;
    }
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value: AuthContextType = useMemo(() => ({
    user,
    token,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!token && !!user
  }), [user, token, loading, login, logout, register]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

