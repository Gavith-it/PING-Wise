'use client';

import { useState, useEffect, useCallback } from 'react';
import { userProfileService, UserProfileData } from '@/lib/services/api';
import { useAuth } from '@/contexts/AuthContext';

export function useUserProfile() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await userProfileService.getProfile();
      if (res.success && res.data) {
        setProfile(res.data);
      } else {
        setProfile(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load profile'));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      setLoading(false);
      setProfile(null);
      return;
    }
    fetchProfile();
  }, [authLoading, isAuthenticated, user, fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
}
