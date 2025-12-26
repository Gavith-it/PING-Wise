import { useMemo } from 'react';
import { isSameDay, isAfter, startOfDay } from 'date-fns';
import { Appointment } from '@/types';

// Calculates appointments for selected date (if not today) and other future dates
export function useUpcomingAppointments(
  allMonthAppointments: Appointment[],
  appointments: Appointment[],
  selectedDate: Date,
  today: Date
): Appointment[] {
  return useMemo(() => {
    // Combine all month appointments and current date appointments
    const allAppointments = [...allMonthAppointments, ...appointments];
    
    // Remove duplicates by appointment ID (prevent showing same appointment twice)
    const uniqueAppointments = allAppointments.filter((apt, index, self) =>
      index === self.findIndex((a) => a.id === apt.id)
    );
    
    // Filter for appointments on dates other than today
    // If selected date is not today, show appointments for selected date
    // Otherwise, show appointments for future dates
    const filtered = uniqueAppointments.filter(apt => {
      const aptDate = apt.date instanceof Date ? apt.date : new Date(apt.date);
      const aptDateStart = startOfDay(aptDate);
      const todayStart = startOfDay(today);
      
      // Exclude today's appointments (they show in the top section)
      if (isSameDay(aptDate, today)) {
        return false;
      }
      
      // If selected date is not today, show appointments for selected date
      if (!isSameDay(selectedDate, today)) {
        return isSameDay(aptDate, selectedDate);
      }
      
      // Otherwise, show future appointments (after today)
      return isAfter(aptDateStart, todayStart);
    });
    
    // Sort by date (earliest first), then by time
    filtered.sort((a, b) => {
      const aDate = a.date instanceof Date ? a.date : new Date(a.date);
      const bDate = b.date instanceof Date ? b.date : new Date(b.date);
      
      // First compare dates
      const dateDiff = aDate.getTime() - bDate.getTime();
      if (dateDiff !== 0) {
        return dateDiff;
      }
      
      // If same date, sort by time
      if (a.time && b.time) {
        return a.time.localeCompare(b.time);
      }
      return 0;
    });
    
    return filtered;
  }, [allMonthAppointments, appointments, selectedDate, today]);
}
