import { useMemo } from 'react';
import { isSameDay } from 'date-fns';
import { Appointment } from '@/types';

// Calculates pending appointments for current date only
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
    
    // Filter for pending appointments on current date only
    const pending = uniqueAppointments.filter(apt => {
      const aptDate = apt.date instanceof Date ? apt.date : new Date(apt.date);
      
      // Only include appointments on the current date (today)
      if (!isSameDay(aptDate, today)) {
        return false;
      }
      
      // Only include appointments with status 'pending'
      return apt.status === 'pending';
    });
    
    // Sort by time (earliest first)
    pending.sort((a, b) => {
      if (a.time && b.time) {
        return a.time.localeCompare(b.time);
      }
      return 0;
    });
    
    // Return all pending appointments for current date (pagination will be handled in the component)
    return pending;
  }, [allMonthAppointments, appointments, selectedDate]);
}
