import { useState } from 'react';
import { crmPatientService } from '@/lib/services/crmPatientService';
import { Appointment, Patient } from '@/types';
import { preloadFormData, formDataCache, preloadInProgress } from '@/components/modals/AppointmentModal';

/**
 * Custom hook to enrich appointments with patient data
 * Uses shared cache from AppointmentModal to avoid duplicate API calls
 */
export function usePatientEnrichment() {
  const [patientsCache, setPatientsCache] = useState<Patient[]>([]);

  const enrichAppointmentsWithPatients = async (appointments: Appointment[]): Promise<Appointment[]> => {
    if (appointments.length === 0) return appointments;

    // First check the shared formDataCache from AppointmentModal (to avoid duplicate API calls)
    const cacheAge = Date.now() - formDataCache.timestamp;
    const isSharedCacheValid = formDataCache.patients.length > 0 && cacheAge < 5 * 60 * 1000;
    
    let patients: Patient[] = [];
    
    // If preload is in progress, wait briefly for it to complete to avoid duplicate calls
    if (preloadInProgress && !isSharedCacheValid && patientsCache.length === 0) {
      // Wait up to 1 second for preload to complete (check every 100ms)
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        // Re-check cache after waiting
        const newCacheAge = Date.now() - formDataCache.timestamp;
        if (formDataCache.patients.length > 0 && newCacheAge < 5 * 60 * 1000) {
          patients = formDataCache.patients;
          setPatientsCache(patients);
          // Break out and use the cached data
          break;
        }
        // If preload finished but cache is still empty, break and make our own call
        if (!preloadInProgress) break;
      }
    }
    
    // Check cache again after potential wait
    const finalCacheAge = Date.now() - formDataCache.timestamp;
    const finalIsSharedCacheValid = formDataCache.patients.length > 0 && finalCacheAge < 5 * 60 * 1000;
    
    if (finalIsSharedCacheValid && patients.length === 0) {
      // Use shared cache from AppointmentModal to avoid duplicate API calls
      patients = formDataCache.patients;
      // Also update local cache for consistency
      setPatientsCache(patients);
    } else if (patientsCache.length > 0 && patients.length === 0) {
      // Use local cache if available
      patients = patientsCache;
    } else if (patients.length === 0) {
      // Only make API call if both caches are empty (preload didn't populate it)
      try {
        const patientsRes = await crmPatientService.getPatients({ limit: 1000 }); // Get all patients
        patients = patientsRes.data || [];
        setPatientsCache(patients);
        // Also update shared cache to prevent duplicate calls
        formDataCache.patients = patients;
        formDataCache.timestamp = Date.now();
      } catch (error) {
        console.error('Failed to load patients for enrichment:', error);
        return appointments; // Return original if patient load fails
      }
    }

    // Enrich appointments with patient data
    return appointments.map(apt => {
      const patientId = typeof apt.patient === 'string' ? apt.patient : apt.patient?.id;
      if (patientId) {
        const patient = patients.find(p => p.id === patientId);
        if (patient) {
          return { ...apt, patient };
        }
      }
      return apt;
    });
  };

  return { enrichAppointmentsWithPatients };
}
