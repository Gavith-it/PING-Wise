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

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: RegisterRequest) => Promise<boolean>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }
      
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        // No token, clear everything and set loading to false
        setToken(null);
        setUser(null);
        setLoading(false);
        return;
      }

      // Token exists, validate it
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            // Valid token and user, set authenticated state
            setUser(data.user);
            setToken(storedToken);
          } else {
            // Invalid response, clear token
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        } else {
          // API error (401, etc.), clear token
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Network error or other error, clear token
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.token && data.user) {
        // Update localStorage first
        localStorage.setItem('token', data.token);
        // Update state - React will batch these updates
        setToken(data.token);
        setUser(data.user);
        toast.success('Login successful!');
        // Return true after state is set
        return true;
      } else {
        toast.error(data.message || 'Login failed');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
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
        localStorage.setItem('token', data.token);
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

