import { useMemo } from 'react';
import { Appointment } from '@/types';

// Filters appointments by search and status
export function useAppointmentFilters(
  appointments: Appointment[],
  searchTerm: string,
  statusFilter: 'all' | 'Confirmed' | 'Pending' | 'Cancelled'
): Appointment[] {
  return useMemo(() => {
    let filtered = [...appointments];

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(apt => {
        const patient = typeof apt.patient === 'object' ? apt.patient : null;
        const patientName = patient?.name || '';
        return patientName.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Apply status filter (normalize both for comparison)
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => {
        const aptStatus = apt.status?.charAt(0).toUpperCase() + apt.status?.slice(1).toLowerCase() || '';
        const filterStatus = statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1).toLowerCase();
        return aptStatus === filterStatus;
      });
    }

    // Sort appointments by status priority:
    // 1. Confirmed (highest priority - show first)
    // 2. Pending
    // 3. Cancelled
    // 4. Completed (lowest priority - show last)
    filtered.sort((a, b) => {
      const getStatusPriority = (status: string): number => {
        // Normalize status to handle both lowercase and capitalized
        const normalized = status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() || '';
        
        switch (normalized) {
          case 'Confirmed':
            return 1;
          case 'Pending':
            return 2;
          case 'Cancelled':
            return 3;
          case 'Completed':
            return 4;
          default:
            return 5;
        }
      };

      const priorityA = getStatusPriority(a.status);
      const priorityB = getStatusPriority(b.status);
      
      // If same priority, sort by time (earlier appointments first)
      if (priorityA === priorityB) {
        const timeA = a.time || '';
        const timeB = b.time || '';
        return timeA.localeCompare(timeB);
      }
      
      return priorityA - priorityB;
    });

    return filtered;
  }, [appointments, searchTerm, statusFilter]);
}
