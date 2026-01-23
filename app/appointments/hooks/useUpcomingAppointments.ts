import { useMemo } from 'react';
import { Appointment } from '@/types';
import { isSameDay } from 'date-fns';
import { appointmentsCache } from './useAppointments';

// Calculates appointments for pending section
// Shows appointments with status "pending" (including follow-up appointments from any month)
export function useUpcomingAppointments(
  allMonthAppointments: Appointment[],
  appointments: Appointment[],
  selectedDate: Date,
  today: Date
): Appointment[] {
  return useMemo(() => {
    // Get all appointments from cache (includes appointments from all months, not just current month)
    // This ensures pending appointments from future months (like follow-up dates) are shown
    let allAppointmentsForPending = allMonthAppointments;
    
    // Use all appointments from cache if available (includes appointments from all months)
    if (appointmentsCache && appointmentsCache.allAppointments && appointmentsCache.allAppointments.length > 0) {
      allAppointmentsForPending = appointmentsCache.allAppointments;
    }
    
    // Filter for appointments with status "Pending" for the selected date only
    const pendingAppointments = allAppointmentsForPending.filter(apt => {
      // Normalize status to handle both lowercase and capitalized
      const normalizedStatus = apt.status?.charAt(0).toUpperCase() + apt.status?.slice(1).toLowerCase() || '';
      
      // Only include appointments with "Pending" status (exclude Confirmed, Completed, Cancelled)
      if (normalizedStatus !== 'Pending') {
        return false;
      }
      
      // Only show pending appointments for the selected date
      const aptDate = apt.date instanceof Date ? apt.date : new Date(apt.date);
      if (!isSameDay(aptDate, selectedDate)) {
        return false;
      }
      
      return true;
    });
    
    // Sort by date (earliest first), then by time
    pendingAppointments.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      
      // First sort by date
      const dateDiff = dateA.getTime() - dateB.getTime();
      if (dateDiff !== 0) {
        return dateDiff;
      }
      
      // If same date, sort by time
      const timeA = a.time || '';
      const timeB = b.time || '';
      return timeA.localeCompare(timeB);
    });
    
    return pendingAppointments;
  }, [allMonthAppointments, selectedDate]);
}
