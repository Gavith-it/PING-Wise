import { useMemo } from 'react';
import { Appointment } from '@/types';
import { isSameDay } from 'date-fns';

// Calculates appointments for pending section
// Shows appointments with status "pending" (typically created externally via Postman, DB, etc.)
// Appointments created from the application are always "confirmed", so they won't appear here
export function useUpcomingAppointments(
  allMonthAppointments: Appointment[],
  appointments: Appointment[],
  selectedDate: Date,
  today: Date
): Appointment[] {
  return useMemo(() => {
    // Filter for appointments with status "pending"
    // These are typically external appointments (created via Postman, DB, etc.)
    // Appointments created from the application are always "confirmed", so they won't be included
    const pendingAppointments = allMonthAppointments.filter(apt => {
      // Only include appointments with "pending" status
      if (apt.status !== 'pending') {
        return false;
      }
      
      // Exclude appointments for the selected date (they appear in the main list)
      const aptDate = apt.date instanceof Date ? apt.date : new Date(apt.date);
      if (isSameDay(aptDate, selectedDate)) {
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
