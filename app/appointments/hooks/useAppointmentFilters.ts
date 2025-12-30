import { useMemo } from 'react';
import { Appointment } from '@/types';

// Filters appointments by search and status
export function useAppointmentFilters(
  appointments: Appointment[],
  searchTerm: string,
  statusFilter: 'all' | 'confirmed' | 'pending' | 'cancelled'
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

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    // Sort appointments by status priority:
    // 1. Confirmed (highest priority - show first)
    // 2. Pending
    // 3. Cancelled
    // 4. Completed (lowest priority - show last)
    filtered.sort((a, b) => {
      const getStatusPriority = (status: string): number => {
        switch (status) {
          case 'confirmed':
            return 1;
          case 'pending':
            return 2;
          case 'cancelled':
            return 3;
          case 'completed':
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
