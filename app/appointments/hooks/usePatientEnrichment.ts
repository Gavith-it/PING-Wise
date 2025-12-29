import { useState } from 'react';
import { crmPatientService } from '@/lib/services/crmPatientService';
import { Appointment, Patient, User } from '@/types';
import { preloadFormData, formDataCache, preloadInProgress } from '@/components/modals/AppointmentModal';

// Enriches appointments with patient and team member data
export function usePatientEnrichment() {
  const [patientsCache, setPatientsCache] = useState<Patient[]>([]);

  const enrichAppointmentsWithPatients = async (appointments: Appointment[]): Promise<Appointment[]> => {
    if (appointments.length === 0) return appointments;

    // First check the shared formDataCache from AppointmentModal (to avoid duplicate API calls)
    const cacheAge = Date.now() - formDataCache.timestamp;
    // Use longer cache duration (15 minutes) to match AppointmentModal cache
    const isSharedCacheValid = formDataCache.patients.length > 0 && cacheAge < 15 * 60 * 1000;
    
    let patients: Patient[] = [];
    
    // If preload is in progress, wait briefly for it to complete to avoid duplicate calls
    if (preloadInProgress && !isSharedCacheValid && patientsCache.length === 0) {
      // Wait up to 1 second for preload to complete (check every 100ms)
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        // Re-check cache after waiting
        const newCacheAge = Date.now() - formDataCache.timestamp;
        if (formDataCache.patients.length > 0 && newCacheAge < 15 * 60 * 1000) {
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
    const finalIsSharedCacheValid = formDataCache.patients.length > 0 && finalCacheAge < 15 * 60 * 1000;
    
    // ALWAYS use cache if available - DO NOT make API calls here
    // This prevents customer API from being called on appointments page
    if (finalIsSharedCacheValid && patients.length === 0) {
      // Use shared cache from AppointmentModal to avoid duplicate API calls
      patients = formDataCache.patients;
      // Also update local cache for consistency
      setPatientsCache(patients);
    } else if (patientsCache.length > 0 && patients.length === 0) {
      // Use local cache if available
      patients = patientsCache;
    } else if (patients.length === 0 && formDataCache.patients.length > 0) {
      // Even if cache is expired, use it to avoid API calls
      // Better to show slightly stale data than make unnecessary API calls
      patients = formDataCache.patients;
      setPatientsCache(patients);
    }
    // DO NOT make API call here - let AppointmentModal handle it when needed
    // This prevents customer API from being called on every page load

    // Get team members (doctors) from cache - they're already loaded in formDataCache
    // If cache is empty, try to load team members (but only if cache is not being preloaded)
    let doctors: User[] = formDataCache.doctors || [];
    
    // If doctors cache is empty and preload is not in progress, we might need to load them
    // But to avoid duplicate API calls, we'll use stale cache if available
    if (doctors.length === 0 && formDataCache.doctors.length === 0 && !preloadInProgress) {
      // Cache is empty, but we don't want to make API calls here
      // The AppointmentModal will load team members when it opens
      // For now, we'll just use empty array and the doctor will remain as ID
      doctors = [];
    }

    // Enrich appointments with patient and team member data
    return appointments.map(apt => {
      let enrichedApt = { ...apt };
      
      // Enrich patient data
      const patientId = typeof apt.patient === 'string' ? apt.patient : apt.patient?.id;
      if (patientId) {
        const patient = patients.find(p => p.id === patientId);
        if (patient) {
          enrichedApt.patient = patient;
        }
      }
      
      // Enrich doctor/team member data from assigned_to field
      // The doctor field might be an ID string, we need to convert it to a User object with name
      const doctorId = typeof apt.doctor === 'string' ? apt.doctor : apt.doctor?.id;
      if (doctorId) {
        const doctor = doctors.find(d => d.id === doctorId);
        if (doctor) {
          // Replace the ID with the full User object (which includes name)
          enrichedApt.doctor = doctor;
        } else {
          // If doctor not found in cache, keep the ID but we'll need to load it
          // For now, keep as is - the AppointmentModal will load team members when needed
        }
      }
      
      return enrichedApt;
    });
  };

  return { enrichAppointmentsWithPatients };
}
