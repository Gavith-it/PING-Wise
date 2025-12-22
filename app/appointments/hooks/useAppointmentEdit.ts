import { useState, useCallback } from 'react';
import { crmAppointmentService } from '@/lib/services/appointmentService';
import { Appointment } from '@/types';

/**
 * Custom hook to handle appointment edit operations with background refresh
 */
export function useAppointmentEdit(
  enrichAppointmentsWithPatients: (appointments: Appointment[]) => Promise<Appointment[]>
) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const handleEdit = useCallback((appointment: Appointment, onModalOpen: () => void) => {
    // Open modal immediately with existing appointment data for instant response
    setSelectedAppointment(appointment);
    onModalOpen();
    
    // Optionally fetch fresh data in the background and update if different
    // This ensures we have the latest data without blocking the UI
    crmAppointmentService.getAppointment(appointment.id)
      .then(async (response) => {
        if (response.data) {
          // Enrich with patient data
          const enrichedAppointment = (await enrichAppointmentsWithPatients([response.data]))[0];
          // Only update if modal is still open and showing this appointment
          setSelectedAppointment(prev => {
            if (prev?.id === enrichedAppointment.id) {
              return enrichedAppointment;
            }
            return prev;
          });
        }
      })
      .catch((error) => {
        // Silently fail - we already have the appointment data from the list
        console.debug('Failed to fetch fresh appointment details (non-blocking):', error);
      });
  }, [enrichAppointmentsWithPatients]);

  const handleReschedule = useCallback((appointment: Appointment, onModalOpen: () => void) => {
    // Same as handleEdit - opens modal for rescheduling
    handleEdit(appointment, onModalOpen);
  }, [handleEdit]);

  const clearSelected = useCallback(() => {
    setSelectedAppointment(null);
  }, []);

  return {
    selectedAppointment,
    handleEdit,
    handleReschedule,
    clearSelected,
    setSelectedAppointment,
  };
}
