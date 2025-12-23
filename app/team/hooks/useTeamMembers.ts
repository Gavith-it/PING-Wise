import { useState, useEffect, useRef, useCallback } from 'react';
import { teamApi } from '@/lib/services/teamApi';
import { crmTeamsToUsers } from '@/lib/utils/teamAdapter';
import toast from 'react-hot-toast';
import { User } from '@/types';
import { generateInitials, generateAvatarColor } from '../utils/teamUtils';

// Team cache - stores ALL team members (unfiltered) for better caching
const teamCache: {
  allTeamMembers: User[]; // Store all members (unfiltered)
  filters: string;
  timestamp: number;
} = {
  allTeamMembers: [],
  filters: '',
  timestamp: 0,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes - longer cache duration

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
  loadTeamMembers: (showLoading?: boolean, isManualRefresh?: boolean) => Promise<void>;
}

// Helper function to apply filters to team members (defined outside component)
function applyFiltersToMembers(members: User[], currentFilter: string, currentFilters: TeamFilters): User[] {
  let filtered = [...members];
  
  if (currentFilters.status !== 'all') {
    filtered = filtered.filter(m => m.status === currentFilters.status);
  }
  if (currentFilters.department !== 'all') {
    filtered = filtered.filter(m => m.department === currentFilters.department);
  }
  if (currentFilter !== 'all') {
    filtered = filtered.filter(m => m.status === currentFilter);
  }
  
  // Ensure each member has initials and unique avatarColor
  return filtered.map((member: User, index: number) => {
    const memberInitials = member.initials || generateInitials(member.name);
    const memberAvatarColor = generateAvatarColor(member.name, index);
    
    return {
      ...member,
      initials: memberInitials,
      avatarColor: memberAvatarColor
    };
  });
}

export function useTeamMembers({
  filter,
  filters,
}: UseTeamMembersParams): UseTeamMembersReturn {
  const [teamMembers, setTeamMembers] = useState<User[]>(() => {
    // Initialize from cache if available
    const cacheAge = Date.now() - teamCache.timestamp;
    if (teamCache.allTeamMembers.length > 0 && cacheAge < CACHE_DURATION) {
      // Apply filters to cached data
      return applyFiltersToMembers(teamCache.allTeamMembers, filter, filters);
    }
    return [];
  });
  const [loading, setLoading] = useState(teamCache.allTeamMembers.length === 0);
  
  const hasInitialized = useRef(false);
  const previousFilters = useRef<string>('');
  const isLoadingRef = useRef(false);
  const lastLoadTimeRef = useRef<number>(0); // Track last load time for duplicate prevention

  const loadTeamMembers = useCallback(async (showLoading = true, isManualRefresh = false) => {
    // Prevent concurrent calls
    if (isLoadingRef.current) {
      return;
    }
    
    // Prevent duplicate calls within 1 second (debounce)
    const now = Date.now();
    if (!isManualRefresh && (now - lastLoadTimeRef.current) < 1000) {
      return;
    }
    lastLoadTimeRef.current = now;
    
    try {
      isLoadingRef.current = true;
      
      if (showLoading) {
        setLoading(true);
      }
      
      // Fetch teams from Team API (only team API, no appointment calls)
      const crmTeams = await teamApi.getTeams();
      const allMembers = crmTeamsToUsers(crmTeams);
      
      // Process all members (add initials and colors)
      const processedAllMembers = allMembers.map((member: User, index: number) => {
        const memberInitials = member.initials || generateInitials(member.name);
        const memberAvatarColor = generateAvatarColor(member.name, index);
        
        return {
          ...member,
          initials: memberInitials,
          avatarColor: memberAvatarColor
        };
      });
      
      // Update cache with ALL members (unfiltered)
      teamCache.allTeamMembers = processedAllMembers;
      teamCache.timestamp = Date.now();
      
      // Apply filters to get filtered list
      const filteredMembers = applyFiltersToMembers(processedAllMembers, filter, filters);
      const filterKey = JSON.stringify({ filter, filters });
      teamCache.filters = filterKey;
      
      // If manual refresh, update previousFilters to prevent useEffect from triggering
      if (isManualRefresh) {
        previousFilters.current = filterKey;
      }
      
      setTeamMembers(filteredMembers);
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
    const isCacheValid = teamCache.allTeamMembers.length > 0 && cacheAge < CACHE_DURATION;
    
    if (isCacheValid) {
      // Use cached data immediately - apply filters client-side
      const filteredFromCache = applyFiltersToMembers(teamCache.allTeamMembers, filter, filters);
      setTeamMembers(filteredFromCache);
      setLoading(false);
      hasInitialized.current = true;
      
      // Refresh in background only if cache is older than 2 seconds and not already loading
      if (cacheAge > 2 * 1000 && !isLoadingRef.current) {
        loadTeamMembers(false);
      }
    } else {
      // No cache or expired - load new data
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
