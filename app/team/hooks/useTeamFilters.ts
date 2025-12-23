import { useMemo } from 'react';
import { User } from '@/types';

interface TeamFilters {
  status: string;
  department: string;
}

// Filters team members by search and filters
export function useTeamFilters(
  teamMembers: User[],
  searchQuery: string,
  filters: TeamFilters
): User[] {
  return useMemo(() => {
    let filtered = [...teamMembers];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((member) =>
        member.name.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(m => m.status === filters.status);
    }

    // Apply department filter
    if (filters.department !== 'all') {
      filtered = filtered.filter(m => m.department === filters.department);
    }

    return filtered;
  }, [teamMembers, searchQuery, filters]);
}
