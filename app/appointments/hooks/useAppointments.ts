import { useState, useEffect, useRef, useCallback } from 'react';
import { format, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { crmAppointmentService } from '@/lib/services/appointmentService';
import toast from 'react-hot-toast';
import { Appointment } from '@/types';

// Appointments cache
const appointmentsCache: {
  appointments: Record<string, Appointment[]>;
  monthAppointments: Record<string, Appointment[]>;
  allAppointments?: Appointment[]; // Store all appointments from all months for pending section
  timestamp: number;
  monthTimestamp: number;
} = {
  appointments: {},
  monthAppointments: {},
  allAppointments: [],
  timestamp: 0,
  monthTimestamp: 0,
};

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

/**
 * Invalidate appointments cache - call this when appointments are created/updated/deleted from other pages
 * This ensures the appointments page shows the latest data
 */
export function invalidateAppointmentsCache(): void {
  // Clear all cached appointments
  appointmentsCache.appointments = {};
  appointmentsCache.monthAppointments = {};
  appointmentsCache.allAppointments = [];
  // Reset timestamps to force fresh fetch
  appointmentsCache.timestamp = 0;
  appointmentsCache.monthTimestamp = 0;
}

// Export cache for use in other hooks
export { appointmentsCache };

interface UseAppointmentsParams {
  selectedDate: Date;
  currentMonth: Date;
  enrichAppointmentsWithPatients: (appointments: Appointment[]) => Promise<Appointment[]>;
}

interface UseAppointmentsReturn {
  appointments: Appointment[];
  allMonthAppointments: Appointment[];
  loading: boolean;
  loadAppointmentsForDate: (isBackgroundRefresh?: boolean) => Promise<void>;
  loadMonthAppointments: (isBackgroundRefresh?: boolean) => Promise<void>;
  handleAppointmentCreated: (updatedAppointment?: Appointment) => Promise<void>;
  handleDeleteAppointment: (id: string) => Promise<void>;
}

export function useAppointments({
  selectedDate,
  currentMonth,
  enrichAppointmentsWithPatients,
}: UseAppointmentsParams): UseAppointmentsReturn {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allMonthAppointments, setAllMonthAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  
  const isLoadingRef = useRef(false);
  const lastSelectedDate = useRef<string>('');
  const isLoadingMonthRef = useRef(false);
  const lastLoadedMonth = useRef<string>('');

  const loadAppointmentsForDate = useCallback(async (isBackgroundRefresh = false) => {
    // Prevent concurrent calls (unless it's a background refresh and we already have data)
    if (isLoadingRef.current && !isBackgroundRefresh) {
      return;
    }
    
    // If background refresh and we already have appointments, allow it to proceed
    // But prevent multiple background refreshes
    if (isBackgroundRefresh && isLoadingRef.current && appointments.length > 0) {
      return;
    }
    
    try {
      isLoadingRef.current = true;
      
      // Only show loading spinner if this is not a background refresh
      if (!isBackgroundRefresh) {
        setLoading(true);
      }
      
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await crmAppointmentService.searchAppointments({ date: dateStr });
      let newAppointments = response.data || [];
      
      // Enrich appointments with patient data
      newAppointments = await enrichAppointmentsWithPatients(newAppointments);
      
      // Filter to exact selected date (handles timezone issues)
      const filteredAppointments = newAppointments.filter(apt => {
        const aptDate = apt.date instanceof Date ? apt.date : new Date(apt.date);
        return isSameDay(aptDate, selectedDate);
      });
      
      // Update cache with filtered appointments
      appointmentsCache.appointments[dateStr] = filteredAppointments;
      appointmentsCache.timestamp = Date.now();
      
      // Always update state to ensure latest data is shown
      // This is important when appointments are created from other pages
      setAppointments(filteredAppointments);
    } catch (error) {
      // Only show error toast if not a background refresh (to avoid interrupting user)
      if (!isBackgroundRefresh) {
        toast.error('Failed to load appointments');
        setLoading(false);
      }
      console.error('Load appointments error:', error);
    } finally {
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
      isLoadingRef.current = false;
    }
  }, [selectedDate, enrichAppointmentsWithPatients, appointments.length]);

  const loadMonthAppointments = useCallback(async (isBackgroundRefresh = false) => {
    // Prevent concurrent calls (unless it's a background refresh)
    if (isLoadingMonthRef.current && !isBackgroundRefresh) {
      return;
    }
    
    // If background refresh and already in progress, skip
    if (isBackgroundRefresh && isLoadingMonthRef.current && allMonthAppointments.length > 0) {
      return;
    }
    
    try {
      isLoadingMonthRef.current = true;
      
      const monthStr = format(currentMonth, 'yyyy-MM');
      
      // Optimized: Fetch ALL appointments (not just current month) to include pending appointments from other months
      // This ensures pending appointments section shows appointments from all months, not just current month
      const response = await crmAppointmentService.getAppointments({}).catch(() => ({ data: [] }));
      let allAppts = response.data || [];
      
      // Enrich appointments with patient data
      allAppts = await enrichAppointmentsWithPatients(allAppts);
      
      // Filter appointments to only include those in the current month (for calendar dots)
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      
      const monthAppts = allAppts.filter(apt => {
        const aptDate = apt.date instanceof Date ? apt.date : new Date(apt.date);
        // Normalize dates to start of day for accurate comparison
        const aptDateOnly = new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate());
        const monthStartOnly = new Date(monthStart.getFullYear(), monthStart.getMonth(), monthStart.getDate());
        const monthEndOnly = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate());
        return aptDateOnly >= monthStartOnly && aptDateOnly <= monthEndOnly;
      });
      
      // Remove duplicates based on appointment ID
      const uniqueAppts = monthAppts.filter((apt, index, self) =>
        index === self.findIndex((a) => a.id === apt.id)
      );
      
      // Update cache for current month
      appointmentsCache.monthAppointments[monthStr] = uniqueAppts;
      appointmentsCache.monthTimestamp = Date.now();
      
      // IMPORTANT: Store ALL appointments (from all months) in a separate cache key for pending appointments
      // This allows pending appointments section to show appointments from any month
      appointmentsCache.allAppointments = allAppts;
      
      // Always update to ensure latest data is shown
      // This is important when appointments are created from other pages
      setAllMonthAppointments(uniqueAppts);
    } catch (error) {
      // Silently fail - calendar dots are optional
      console.error('Load month appointments error:', error);
      if (!isBackgroundRefresh) {
        setAllMonthAppointments([]);
      }
    } finally {
      isLoadingMonthRef.current = false;
    }
  }, [currentMonth, enrichAppointmentsWithPatients, allMonthAppointments.length]);

  // Load appointments for selected date
  useEffect(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    // Prevent duplicate calls for the same date
    if (lastSelectedDate.current === dateStr && isLoadingRef.current) {
      return;
    }
    
    lastSelectedDate.current = dateStr;
    
    // Check cache first for instant display
    const cacheAge = Date.now() - appointmentsCache.timestamp;
    const cachedAppointments = appointmentsCache.appointments[dateStr];
    const isCacheValid = cachedAppointments && cachedAppointments.length >= 0 && cacheAge < CACHE_DURATION;
    
    if (isCacheValid) {
      // Display cached data instantly (no loading spinner)
      setAppointments(cachedAppointments);
      setLoading(false);
      
      // Fetch fresh data in background (non-blocking)
      loadAppointmentsForDate(true);
    } else {
      // No cache or expired, load normally with spinner
      loadAppointmentsForDate(false);
    }
    
    // DO NOT preload patients and doctors data here - it causes unnecessary API calls
    // The AppointmentModal will load the data when it opens, and it has its own cache checking
    // This prevents customer and team APIs from being called on every page load/date change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Load all appointments for current month (for calendar dots)
  useEffect(() => {
    const monthStr = format(currentMonth, 'yyyy-MM');
    
    // Check cache first
    const cacheAge = Date.now() - appointmentsCache.monthTimestamp;
    const cachedMonthAppts = appointmentsCache.monthAppointments[monthStr];
    const isCacheValid = cachedMonthAppts && cachedMonthAppts.length >= 0 && cacheAge < CACHE_DURATION;
    
    // Prevent duplicate calls for the same month only if cache is valid
    if (lastLoadedMonth.current === monthStr && isLoadingMonthRef.current && isCacheValid) {
      return;
    }
    
    // Prevent concurrent calls (React strict mode can trigger useEffect twice)
    if (isLoadingMonthRef.current && !isCacheValid) {
      return;
    }
    
    lastLoadedMonth.current = monthStr;
    
    if (isCacheValid) {
      // Display cached data instantly
      setAllMonthAppointments(cachedMonthAppts);
      // Always fetch fresh data in background to ensure we have latest appointments
      // This is important when appointments are created from other pages
      loadMonthAppointments(true);
    } else {
      // No cache or expired, load normally
      loadMonthAppointments(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

  const handleAppointmentCreated = useCallback(async (updatedAppointment?: Appointment) => {
    // Always invalidate cache first to ensure fresh data
    const currentDateStr = format(selectedDate, 'yyyy-MM-dd');
    const monthStr = format(currentMonth, 'yyyy-MM');
    
    if (!updatedAppointment) {
      // No appointment data provided, invalidate cache and reload
      delete appointmentsCache.appointments[currentDateStr];
      delete appointmentsCache.monthAppointments[monthStr];
      appointmentsCache.timestamp = 0;
      appointmentsCache.monthTimestamp = 0;
      // Reset refs to allow useEffect to trigger
      lastSelectedDate.current = '';
      lastLoadedMonth.current = '';
      await loadAppointmentsForDate(false);
      await loadMonthAppointments(false);
      return;
    }
    
    // Enrich appointment with patient data if needed
    let enrichedAppointment = updatedAppointment;
    if (typeof updatedAppointment.patient === 'string') {
      // Patient is just an ID, need to enrich it
      try {
        const enriched = await enrichAppointmentsWithPatients([updatedAppointment]);
        enrichedAppointment = enriched[0] || updatedAppointment;
      } catch (error) {
        console.error('Error enriching appointment:', error);
        // Continue with unenriched appointment if enrichment fails
      }
    }
    
    // Get the date from the updated appointment - normalize to date only (no time)
    let updatedDate: Date;
    if (enrichedAppointment.date instanceof Date) {
      updatedDate = new Date(enrichedAppointment.date);
    } else {
      // Handle string dates - parse and create Date object
      const dateStr = typeof enrichedAppointment.date === 'string' ? enrichedAppointment.date : String(enrichedAppointment.date);
      updatedDate = new Date(dateStr);
    }
    // Normalize to date only (remove time component) for consistent comparison
    updatedDate.setHours(0, 0, 0, 0);
    
    const selectedDateNormalized = new Date(selectedDate);
    selectedDateNormalized.setHours(0, 0, 0, 0);
    
    const updatedDateStr = format(updatedDate, 'yyyy-MM-dd');
    const updatedMonthStr = format(updatedDate, 'yyyy-MM');
    
    // Always invalidate cache for the appointment's date to ensure fresh data
    delete appointmentsCache.appointments[updatedDateStr];
    if (updatedMonthStr === monthStr) {
      delete appointmentsCache.monthAppointments[monthStr];
    }
    
    // If appointment is for a different date than selected, we still need to show it when user navigates to that date
    // So we'll refresh both the selected date and the appointment's date
    
    // Compare normalized dates using isSameDay for accuracy
    const isSameDate = isSameDay(updatedDate, selectedDateNormalized);
    
    if (isSameDate) {
      // Same date - add/update appointment in state immediately
      setAppointments(prev => {
        const existingIndex = prev.findIndex(apt => apt.id === enrichedAppointment.id);
        if (existingIndex >= 0) {
          // Update existing appointment
          const updated = [...prev];
          updated[existingIndex] = enrichedAppointment;
          return updated;
        } else {
          // Add new appointment (at the beginning for visibility)
          return [enrichedAppointment, ...prev];
        }
      });
      
      // Also refresh from API to ensure we have all appointments for this date
      // Reset ref to allow refresh
      lastSelectedDate.current = '';
      await loadAppointmentsForDate(true); // Background refresh
    } else {
      // Different date - refresh selected date to remove if it was there, and load appointment's date
      // Reset ref to allow refresh
      lastSelectedDate.current = '';
      await loadAppointmentsForDate(true); // Background refresh to remove if it was there
      
      // Load appointments for the appointment's date if it's in current month
      if (updatedMonthStr === monthStr) {
        try {
          const response = await crmAppointmentService.searchAppointments({ date: updatedDateStr });
          let newAppointments = response.data || [];
          newAppointments = await enrichAppointmentsWithPatients(newAppointments);
          
          // Filter to exact date
          const filteredAppointments = newAppointments.filter(apt => {
            const aptDate = apt.date instanceof Date ? apt.date : new Date(apt.date);
            return isSameDay(aptDate, updatedDate);
          });
          
          // Update cache
          appointmentsCache.appointments[updatedDateStr] = filteredAppointments;
          appointmentsCache.timestamp = Date.now();
        } catch (error) {
          console.error('Failed to load appointments for appointment date:', error);
        }
      }
      
      // Show message if date is different
      toast.success(`Appointment scheduled for ${format(updatedDate, 'MMMM d, yyyy')}`);
    }
    
    // Always refresh month appointments to ensure calendar dots are updated
    lastLoadedMonth.current = '';
    await loadMonthAppointments(true); // Background refresh
  }, [selectedDate, currentMonth, enrichAppointmentsWithPatients, loadAppointmentsForDate, loadMonthAppointments]);

  const handleDeleteAppointment = useCallback(async (id: string) => {
    if (!window.confirm('Cancel this appointment?')) {
      return;
    }
    try {
      await crmAppointmentService.cancelAppointment(id);
      toast.success('Appointment cancelled');
      await loadAppointmentsForDate();
      await loadMonthAppointments();
    } catch (error) {
      toast.error('Failed to cancel appointment');
    }
  }, [loadAppointmentsForDate, loadMonthAppointments]);

  return {
    appointments,
    allMonthAppointments,
    loading,
    loadAppointmentsForDate,
    loadMonthAppointments,
    handleAppointmentCreated,
    handleDeleteAppointment,
  };
}
