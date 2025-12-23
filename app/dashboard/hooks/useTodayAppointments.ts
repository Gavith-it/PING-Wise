import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { crmAppointmentService } from '@/lib/services/appointmentService';
import { crmPatientService } from '@/lib/services/crmPatientService';
import { Appointment } from '@/types';
import { Patient } from '@/types';

// Cache for today's appointments
const appointmentsCache: {
  appointments: Appointment[];
  timestamp: number;
} = {
  appointments: [],
  timestamp: 0,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface UseTodayAppointmentsReturn {
  appointments: Appointment[];
  loading: boolean;
  dataLoaded: boolean;
  loadAppointments: () => Promise<void>;
}

export function useTodayAppointments(): UseTodayAppointmentsReturn {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  const isLoadingRef = useRef(false);
  const isLoadingPatientsRef = useRef(false);

  const loadAppointments = useCallback(async () => {
    // Prevent duplicate calls
    if (isLoadingRef.current) {
      return;
    }
    
    try {
      isLoadingRef.current = true;
      
      // Get today's date in yyyy-MM-dd format for filtering
      const todayDateStr = format(new Date(), 'yyyy-MM-dd');
      
      // Fetch appointments for today
      const appointmentsData = await crmAppointmentService.getAppointments({ date: todayDateStr }).catch((error) => {
        console.warn('Failed to load today appointments (non-critical):', error);
        return { success: true, data: [] };
      });

      // Filter appointments for today only
      let allAppointments = appointmentsData.data || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Filter appointments that are scheduled for today
      let filteredAppointments = allAppointments.filter((apt: Appointment) => {
        const aptDate = apt.date instanceof Date ? apt.date : new Date(apt.date);
        return aptDate >= today && aptDate < tomorrow;
      });
      
      // Enrich appointments with patient data
      if (filteredAppointments.length > 0 && !isLoadingPatientsRef.current) {
        try {
          isLoadingPatientsRef.current = true;
          
          // Get all unique patient IDs from appointments
          const patientIds = filteredAppointments
            .map(apt => {
              if (typeof apt.patient === 'string') return apt.patient;
              if (typeof apt.patient === 'object' && apt.patient?.id) return apt.patient.id;
              return null;
            })
            .filter((id): id is string => id !== null);
          
          if (patientIds.length > 0) {
            // Fetch patient data (only once, prevent duplicate calls)
            const patientsResponse = await crmPatientService.getPatients({ limit: 100 });
            const patients: Patient[] = patientsResponse.data || [];
            
            // Create a map of patient ID to patient object
            const patientMap = new Map<string, Patient>();
            patients.forEach(patient => {
              if (patient.id) {
                patientMap.set(patient.id, patient);
              }
            });
            
            // Enrich appointments with patient data
            filteredAppointments = filteredAppointments.map(apt => {
              const patientId = typeof apt.patient === 'string' ? apt.patient : apt.patient?.id;
              if (patientId && patientMap.has(patientId)) {
                return { ...apt, patient: patientMap.get(patientId)! };
              }
              return apt;
            });
          }
          
          isLoadingPatientsRef.current = false;
        } catch (error) {
          console.warn('Failed to enrich appointments with patient data (non-critical):', error);
          isLoadingPatientsRef.current = false;
        }
      }
      
      // Update cache
      appointmentsCache.appointments = filteredAppointments;
      appointmentsCache.timestamp = Date.now();

      // Update state
      setAppointments(filteredAppointments);
      setDataLoaded(true);
    } catch (error) {
      console.error('Failed to load today appointments:', error);
      setDataLoaded(true);
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, []);

  // Initialize from cache on mount
  useEffect(() => {
    const cacheAge = Date.now() - appointmentsCache.timestamp;
    const isCacheValid = appointmentsCache.appointments.length >= 0 && cacheAge < CACHE_DURATION;
    
    if (isCacheValid && appointmentsCache.appointments.length > 0) {
      // Use cached data immediately
      setAppointments(appointmentsCache.appointments);
      setDataLoaded(true);
      
      // Refresh in background
      if (!isLoadingRef.current) {
        loadAppointments();
      }
    } else {
      // No cache or expired - load
      setLoading(true);
      setDataLoaded(false);
      loadAppointments();
    }
  }, [loadAppointments]);

  return {
    appointments,
    loading,
    dataLoaded,
    loadAppointments,
  };
}
