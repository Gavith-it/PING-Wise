import { useState, useEffect, useRef, useCallback } from 'react';
import { format, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { crmAppointmentService } from '@/lib/services/appointmentService';
import toast from 'react-hot-toast';
import { Appointment } from '@/types';
import { preloadFormData } from '@/components/modals/AppointmentModal';

// Cache for appointments data to enable instant navigation
const appointmentsCache: {
  appointments: Record<string, Appointment[]>;
  monthAppointments: Record<string, Appointment[]>;
  timestamp: number;
  monthTimestamp: number;
} = {
  appointments: {},
  monthAppointments: {},
  timestamp: 0,
  monthTimestamp: 0,
};

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

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
      const response = await crmAppointmentService.getAppointments({ date: dateStr });
      let newAppointments = response.data || [];
      
      // Enrich appointments with patient data
      newAppointments = await enrichAppointmentsWithPatients(newAppointments);
      
      // IMPORTANT: Filter appointments to only include those for the exact selected date
      // This ensures appointments don't show up on wrong dates due to backend timezone issues
      const filteredAppointments = newAppointments.filter(apt => {
        const aptDate = apt.date instanceof Date ? apt.date : new Date(apt.date);
        return isSameDay(aptDate, selectedDate);
      });
      
      // Update cache with filtered appointments
      appointmentsCache.appointments[dateStr] = filteredAppointments;
      appointmentsCache.timestamp = Date.now();
      
      // Only update state if data has changed (for smooth background refresh)
      setAppointments(prev => {
        // Compare appointment IDs to detect changes
        const prevIds = new Set(prev.map(apt => apt.id));
        const newIds = new Set(filteredAppointments.map(apt => apt.id));
        
        // If IDs are different, update (smooth transition)
        if (prevIds.size !== newIds.size || 
            ![...prevIds].every(id => newIds.has(id)) ||
            ![...newIds].every(id => prevIds.has(id))) {
          return filteredAppointments;
        }
        
        // If same IDs, check if any appointment data changed
        const hasChanges = prev.some(prevApt => {
          const newApt = filteredAppointments.find(apt => apt.id === prevApt.id);
          if (!newApt) return true;
          // Compare key fields
          return prevApt.status !== newApt.status ||
                 prevApt.time !== newApt.time ||
                 format(new Date(prevApt.date), 'yyyy-MM-dd') !== format(new Date(newApt.date), 'yyyy-MM-dd');
        });
        
        return hasChanges ? filteredAppointments : prev;
      });
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
      
      // Optimized: Fetch all appointments for the month without date filter
      // This makes a single API call instead of 31+ calls (one per day)
      const response = await crmAppointmentService.getAppointments({}).catch(() => ({ data: [] }));
      let allAppts = response.data || [];
      
      // Enrich appointments with patient data
      allAppts = await enrichAppointmentsWithPatients(allAppts);
      
      // Filter appointments to only include those in the current month
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
      
      // Update cache
      appointmentsCache.monthAppointments[monthStr] = uniqueAppts;
      appointmentsCache.monthTimestamp = Date.now();
      
      // Only update if data changed (for smooth background refresh)
      setAllMonthAppointments(prev => {
        const prevIds = new Set(prev.map(apt => apt.id));
        const newIds = new Set(uniqueAppts.map(apt => apt.id));
        
        if (prevIds.size !== newIds.size || 
            ![...prevIds].every(id => newIds.has(id))) {
          return uniqueAppts;
        }
        return prev;
      });
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
    
    // Preload patients and doctors data for appointment modal (in background)
    preloadFormData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Load all appointments for current month (for calendar dots)
  useEffect(() => {
    const monthStr = format(currentMonth, 'yyyy-MM');
    
    // Prevent duplicate calls for the same month
    if (lastLoadedMonth.current === monthStr && isLoadingMonthRef.current) {
      return;
    }
    
    // Prevent concurrent calls (React strict mode can trigger useEffect twice)
    if (isLoadingMonthRef.current) {
      return;
    }
    
    lastLoadedMonth.current = monthStr;
    
    // Check cache first for instant display
    const cacheAge = Date.now() - appointmentsCache.monthTimestamp;
    const cachedMonthAppts = appointmentsCache.monthAppointments[monthStr];
    const isCacheValid = cachedMonthAppts && cachedMonthAppts.length >= 0 && cacheAge < CACHE_DURATION;
    
    if (isCacheValid) {
      // Display cached data instantly
      setAllMonthAppointments(cachedMonthAppts);
      // Fetch fresh data in background
      loadMonthAppointments(true);
    } else {
      // No cache or expired, load normally
      loadMonthAppointments(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

  const handleAppointmentCreated = useCallback(async (updatedAppointment?: Appointment) => {
    if (updatedAppointment) {
      // Get the date from the updated appointment
      const updatedDate = updatedAppointment.date instanceof Date 
        ? updatedAppointment.date 
        : new Date(updatedAppointment.date);
      const updatedDateStr = format(updatedDate, 'yyyy-MM-dd');
      const currentDateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // If date changed, immediately remove the appointment from current date's list
      if (updatedDateStr !== currentDateStr) {
        setAppointments(prev => prev.filter(apt => apt.id !== updatedAppointment.id));
        
        // Clear cache for both dates to ensure fresh data
        delete appointmentsCache.appointments[currentDateStr];
        delete appointmentsCache.appointments[updatedDateStr];
        
        // Show message that appointment date was changed
        toast.success(`Appointment moved to ${format(updatedDate, 'MMMM d, yyyy')}`);
        
        // Reload appointments for the new date
        const loadNewDate = async () => {
          try {
            const response = await crmAppointmentService.getAppointments({ date: updatedDateStr });
            let newAppointments = response.data || [];
            newAppointments = await enrichAppointmentsWithPatients(newAppointments);
            
            // Filter to only include appointments for the exact date
            const filteredAppointments = newAppointments.filter(apt => {
              const aptDate = apt.date instanceof Date ? apt.date : new Date(apt.date);
              return isSameDay(aptDate, updatedDate);
            });
            
            appointmentsCache.appointments[updatedDateStr] = filteredAppointments;
            appointmentsCache.timestamp = Date.now();
          } catch (error) {
            console.error('Failed to load appointments for new date:', error);
          }
        };
        await loadNewDate();
      }
      
      // Always reload current date (removes old appointment if date changed)
      await loadAppointmentsForDate();
    } else {
      // No appointment data, just reload current date
      await loadAppointmentsForDate();
    }
    
    // Always refresh month appointments to update calendar dots AND upcoming section
    await loadMonthAppointments();
  }, [selectedDate, enrichAppointmentsWithPatients, loadAppointmentsForDate, loadMonthAppointments]);

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
