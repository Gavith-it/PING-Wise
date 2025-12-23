import { useMemo } from 'react';
import { isSameDay } from 'date-fns';
import { Appointment } from '@/types';

// Calculates upcoming appointments
export function useUpcomingAppointments(
  allMonthAppointments: Appointment[],
  appointments: Appointment[],
  selectedDate: Date
): Appointment[] {
  return useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Combine all month appointments and current date appointments
    const allAppointments = [...allMonthAppointments, ...appointments];
    
    // Remove duplicates by appointment ID (prevent showing same appointment twice)
    const uniqueAppointments = allAppointments.filter((apt, index, self) =>
      index === self.findIndex((a) => a.id === apt.id)
    );
    
    // Filter for future appointments (excluding current selected date)
    const upcoming = uniqueAppointments.filter(apt => {
      const aptDate = apt.date instanceof Date ? apt.date : new Date(apt.date);
      
      // Exclude appointments on the selected date (they should only appear in main list)
      if (isSameDay(aptDate, selectedDate)) {
        return false;
      }
      
      // Only include appointments that are AFTER the selected date (future dates)
      const aptDateOnly = new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate());
      const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      
      if (aptDateOnly <= selectedDateOnly) {
        return false; // Exclude appointments on or before selected date
      }
      
      // For appointments after selected date, check if they're in the future
      const aptDateTime = new Date(aptDate);
      // Parse time if available
      if (apt.time) {
        const [hours, minutes] = apt.time.split(':').map(Number);
        aptDateTime.setHours(hours || 0, minutes || 0, 0, 0);
      }
      
      // Include appointments from today onwards (future appointments)
      return aptDateTime >= today;
    });
    
    // Sort by date and time (earliest first)
    upcoming.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      
      // If same date, sort by time
      if (dateA.getTime() === dateB.getTime() && a.time && b.time) {
        return a.time.localeCompare(b.time);
      }
      
      return dateA.getTime() - dateB.getTime();
    });
    
    // Return top 5 upcoming appointments
    return upcoming.slice(0, 5);
  }, [allMonthAppointments, appointments, selectedDate]);
}
