'use client';

/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the application.
 */

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '@/types';
import { crmApi } from '@/lib/services/crmApi';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (userName: string, password: string) => Promise<boolean>;
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
      
      // Migrate from localStorage to sessionStorage (one-time migration)
      // Clear any old localStorage tokens to ensure session-based auth
      if (localStorage.getItem('token')) {
        localStorage.removeItem('token');
      }
      
      const storedToken = sessionStorage.getItem('token');
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
      
      // Also set in CRM API service to ensure it's available
      sessionStorage.setItem('crm_access_token', storedToken);
      sessionStorage.setItem('access_token', storedToken);

      // Validate token using CRM API /checkAuth endpoint
      try {
        await crmApi.checkAuth();
        
        // Token is valid, restore user from sessionStorage if available
        const storedUser = sessionStorage.getItem('user');
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
        console.error('Token validation error:', error);
        // Clear all tokens on validation failure
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('crm_access_token');
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

  const login = async (userName: string, password: string): Promise<boolean> => {
    try {
      // Login to CRM API directly (this is the main authentication)
      const crmResponse = await crmApi.login({
        user_name: userName,
        password: password,
      });
      
      if (crmResponse.access_token) {
        // CRM token is automatically stored by crmApi.login()
        const token = crmResponse.access_token;
        
        // Create user object from the CRM response
        const nameParts = userName.includes('@') ? userName.split('@')[0] : userName;
        const firstName = nameParts.split('.')[0] || nameParts;
        const user: User = {
          id: userName, // Use userName as ID
          name: firstName.charAt(0).toUpperCase() + firstName.slice(1), // Capitalize first letter
          email: userName.includes('@') ? userName : `${userName}@pingwise.in`,
          role: (crmResponse.role as 'admin' | 'doctor' | 'staff') || 'staff',
          status: 'active',
          initials: firstName.charAt(0).toUpperCase(),
        };
        
        // Store tokens in all places (for compatibility)
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('crm_access_token', token);
        sessionStorage.setItem('access_token', token);
        sessionStorage.setItem('user', JSON.stringify(user));
        localStorage.removeItem('token');
        
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
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed. Please check your credentials.';
      toast.error(errorMessage);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    // Clear all tokens from sessionStorage
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('crm_access_token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('user');
    // Also clear localStorage token if it exists (cleanup)
    localStorage.removeItem('token');
    // Clear CRM API token
    crmApi.logout();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const register = async (userData: RegisterRequest): Promise<boolean> => {
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
        setUser(data.user);
        setToken(data.token);
        sessionStorage.setItem('token', data.token);
        // Clear any old localStorage token
        localStorage.removeItem('token');
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
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!token && !!user
  };

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

