import { useMemo } from 'react';
import { Appointment } from '@/types';

// Calculates appointments for pending section
// Currently, all appointments are created from the application, so pending should be empty
// Later, this will filter for external/client-created appointments only
export function useUpcomingAppointments(
  allMonthAppointments: Appointment[],
  appointments: Appointment[],
  selectedDate: Date,
  today: Date
): Appointment[] {
  return useMemo(() => {
    // For now, return empty array since all appointments are created from the application
    // Appointments created from the application should only appear in the main "Appointments for [date]" list
    // Later, we'll filter for external bookings here (e.g., by checking source field or status)
    
    // TODO: When external booking is implemented, filter appointments here:
    // - Check if appointment has source === 'external' or similar field
    // - Or check if status indicates external booking
    // - Return only external/client-created appointments
    
    return [];
  }, [allMonthAppointments, appointments, selectedDate, today]);
}
