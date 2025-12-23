import { useState, useEffect, useRef, useCallback } from 'react';
import { teamApi } from '@/lib/services/teamApi';
import { crmTeamsToUsers } from '@/lib/utils/teamAdapter';
import toast from 'react-hot-toast';
import { User } from '@/types';
import { generateInitials, generateAvatarColor } from '../utils/teamUtils';

// Team cache
const teamCache: {
  teamMembers: User[];
  filters: string;
  timestamp: number;
} = {
  teamMembers: [],
  filters: '',
  timestamp: 0,
};

const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes

interface TeamFilters {
  status: string;
  department: string;
}

interface UseTeamMembersParams {
  filter: string;
  filters: TeamFilters;
}

interface UseTeamMembersReturn {
  teamMembers: User[];
  loading: boolean;
  loadTeamMembers: (showLoading?: boolean) => Promise<void>;
}

export function useTeamMembers({
  filter,
  filters,
}: UseTeamMembersParams): UseTeamMembersReturn {
  const [teamMembers, setTeamMembers] = useState<User[]>(teamCache.teamMembers);
  const [loading, setLoading] = useState(teamCache.teamMembers.length === 0);
  
  const hasInitialized = useRef(false);
  const previousFilters = useRef<string>('');
  const isLoadingRef = useRef(false);

  const loadTeamMembers = useCallback(async (showLoading = true) => {
    // Prevent concurrent calls
    if (isLoadingRef.current) {
      return;
    }
    
    try {
      isLoadingRef.current = true;
      
      if (showLoading) {
        setLoading(true);
      }
      
      // Fetch teams from Team API
      const crmTeams = await teamApi.getTeams();
      const members = crmTeamsToUsers(crmTeams);
      
      // Filter members based on UI filters (client-side filtering since API doesn't support it)
      let filtered = members;
      if (filters.status !== 'all') {
        filtered = filtered.filter(m => m.status === filters.status);
      }
      if (filters.department !== 'all') {
        filtered = filtered.filter(m => m.department === filters.department);
      }
      if (filter !== 'all') {
        filtered = filtered.filter(m => m.status === filter);
      }
      
      // Ensure each member has initials and unique avatarColor
      // Always generate unique colors based on name/index to ensure each member is different
      const processedMembers = filtered.map((member: User, index: number) => {
        // Always generate initials if missing
        const memberInitials = member.initials || generateInitials(member.name);
        
        // Always generate unique avatar color based on name (deterministic but unique per name)
        // This ensures each member gets a distinct color, even if API returns same colors
        const memberAvatarColor = generateAvatarColor(member.name, index);
        
        return {
          ...member,
          initials: memberInitials,
          avatarColor: memberAvatarColor
        };
      });
      
      // Update cache
      const filterKey = JSON.stringify({ filter, filters });
      teamCache.teamMembers = processedMembers;
      teamCache.filters = filterKey;
      teamCache.timestamp = Date.now();
      
      setTeamMembers(processedMembers);
    } catch (error) {
      toast.error('Failed to load team members');
      console.error('Load team error:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      isLoadingRef.current = false;
    }
  }, [filter, filters]);

  // Load team members effect
  useEffect(() => {
    const filterKey = JSON.stringify({ filter, filters });
    
    // Prevent duplicate calls - check if filters actually changed
    if (hasInitialized.current && previousFilters.current === filterKey) {
      return; // Filters haven't changed, skip
    }
    
    previousFilters.current = filterKey;
    const cacheAge = Date.now() - teamCache.timestamp;
    const isCacheValid = teamCache.teamMembers.length > 0 && 
                        teamCache.filters === filterKey && 
                        cacheAge < CACHE_DURATION;
    
    if (isCacheValid && teamMembers.length === 0) {
      // Use cached data immediately
      setTeamMembers(teamCache.teamMembers);
      setLoading(false);
      hasInitialized.current = true;
      // Refresh in background only if not already loading
      if (!isLoadingRef.current) {
        loadTeamMembers(false);
      }
    } else if (isCacheValid && teamCache.filters === filterKey) {
      // Same filters, cache is valid - use it immediately
      setTeamMembers(teamCache.teamMembers);
      setLoading(false);
      hasInitialized.current = true;
      
      // Refresh in background only if not already loading
      if (!isLoadingRef.current) {
        loadTeamMembers(false);
      }
    } else {
      // Filters changed or cache invalid - load new data
      hasInitialized.current = true;
      loadTeamMembers(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, filters]);

  return {
    teamMembers,
    loading,
    loadTeamMembers,
  };
}
