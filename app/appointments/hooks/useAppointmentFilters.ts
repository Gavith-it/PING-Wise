import { useState, useEffect, useMemo } from 'react';
import { Appointment } from '@/types';

/**
 * Custom hook to filter appointments based on search and status
 */
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

    return filtered;
  }, [appointments, searchTerm, statusFilter]);
}
