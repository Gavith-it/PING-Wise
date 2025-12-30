/**
 * Appointment API Adapter
 * 
 * Converts between CRM API Appointment models and UI Appointment models
 */

import { Appointment } from '@/types';

// Backend Appointment format (from swagger)
export interface CrmAppointment {
  id: string;
  appointment_type?: string;
  assigned_to?: string;
  attachments?: string[];
  created_at?: string;
  customer_id?: string;
  duration?: number; // in minutes
  location?: string;
  notes?: string;
  priority?: string;
  scheduled_at?: string; // ISO date string
  status?: string;
  updated_at?: string;
}

export interface CrmAppointmentRequest {
  appointment_type?: string;
  assigned_to?: string;
  assigned_to_id?: string;
  attachments?: string[];
  customer_id?: string;
  duration?: number;
  location?: string;
  notes?: string;
  priority?: string;
  scheduled_at?: string; // ISO date string
  status?: string;
}

/**
 * Convert CRM Appointment to UI Appointment model
 */
export function crmAppointmentToAppointment(crmAppointment: CrmAppointment | null | undefined): Appointment | undefined {
  if (!crmAppointment || !crmAppointment.id) {
    return undefined;
  }

  // Parse scheduled_at to extract date and time
  let date = new Date();
  let time = '00:00';
  
  if (crmAppointment.scheduled_at) {
    try {
      const scheduledDate = new Date(crmAppointment.scheduled_at);
      date = scheduledDate;
      // Extract time in HH:mm format
      time = scheduledDate.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      console.warn('Failed to parse scheduled_at:', crmAppointment.scheduled_at);
    }
  }

  return {
    id: String(crmAppointment.id),
    patient: crmAppointment.customer_id || '', // Will be populated if needed
    doctor: crmAppointment.assigned_to || '', // Will be populated if needed
    date: date,
    time: time,
    status: mapCrmStatusToAppointmentStatus(crmAppointment.status || 'pending'),
    type: crmAppointment.appointment_type,
    reason: crmAppointment.notes,
    notes: crmAppointment.notes,
    duration: crmAppointment.duration,
    priority: crmAppointment.priority,
    medicalNotes: crmAppointment.notes,
    createdAt: crmAppointment.created_at ? new Date(crmAppointment.created_at) : undefined,
    updatedAt: crmAppointment.updated_at ? new Date(crmAppointment.updated_at) : undefined,
  };
}

/**
 * Convert UI Appointment model to CRM Appointment Request
 * Accepts both Appointment (date: Date) and CreateAppointmentRequest (date: string) formats
 */
export function appointmentToCrmAppointment(
  appointment: (Partial<Appointment> | Partial<{ date: string | Date; time?: string; patient?: string | { id: string }; doctor?: string | { id: string }; type?: string; notes?: string; reason?: string; medicalNotes?: string; status?: string; priority?: string; duration?: number }>) & { date?: string | Date }
): CrmAppointmentRequest {
  // Combine date and time into scheduled_at ISO string
  let scheduled_at: string | undefined;
  
  if (appointment.date) {
    let date: Date;
    const appointmentDate = appointment.date;
    
    // Handle different date formats
    if (appointmentDate instanceof Date) {
      date = new Date(appointmentDate);
    } else if (typeof appointmentDate === 'string') {
      // Handle date string formats (yyyy-MM-dd or ISO string)
      if (appointmentDate.includes('T') || appointmentDate.includes('Z')) {
        // ISO string format
        date = new Date(appointmentDate);
      } else {
        // yyyy-MM-dd format - create date at midnight UTC to avoid timezone issues
        const parts = appointmentDate.split('-');
        if (parts.length === 3) {
          const [year, month, day] = parts.map(Number);
          date = new Date(Date.UTC(year, month - 1, day));
        } else {
          date = new Date(appointmentDate);
        }
      }
    } else {
      date = new Date(appointmentDate as any);
    }
    
    // If time is provided, combine it with date
    if (appointment.time && typeof appointment.time === 'string') {
      const [hours, minutes] = appointment.time.split(':').map(Number);
      date.setHours(hours || 0, minutes || 0, 0, 0);
    }
    
    scheduled_at = date.toISOString();
  }

  // Extract customer_id (patient ID) - ensure it's a valid string
  let customer_id: string | undefined;
  if (appointment.patient) {
    if (typeof appointment.patient === 'string') {
      // If it's already a string, use it directly (should be the patient ID)
      customer_id = appointment.patient.trim();
    } else if (typeof appointment.patient === 'object' && appointment.patient !== null) {
      // If it's an object, extract the ID
      customer_id = appointment.patient.id?.toString().trim();
    }
  }

  // Extract assigned_to (doctor ID) - ensure it's a valid string
  let assigned_to: string | undefined;
  let assigned_to_id: string | undefined;
  if (appointment.doctor) {
    if (typeof appointment.doctor === 'string') {
      // If it's already a string, use it directly (should be the doctor ID)
      assigned_to = appointment.doctor.trim();
      assigned_to_id = appointment.doctor.trim();
    } else if (typeof appointment.doctor === 'object' && appointment.doctor !== null) {
      // If it's an object, extract the ID
      assigned_to = appointment.doctor.id?.toString().trim();
      assigned_to_id = appointment.doctor.id?.toString().trim();
    }
  }

  // Validate customer_id is not empty (required for all operations)
  if (!customer_id || customer_id === '') {
    throw new Error('Customer ID (patient) is required and must be a valid ID');
  }

  return {
    appointment_type: appointment.type,
    assigned_to: assigned_to,
    assigned_to_id: assigned_to_id,
    customer_id: customer_id,
    duration: appointment.duration,
    location: undefined, // Not in UI model
    notes: appointment.notes || appointment.reason || appointment.medicalNotes,
    priority: appointment.priority,
    scheduled_at: scheduled_at,
    status: mapAppointmentStatusToCrmStatus(appointment.status),
  };
}

/**
 * Map CRM status to Appointment status
 */
function mapCrmStatusToAppointmentStatus(crmStatus: string): 'scheduled' | 'completed' | 'cancelled' | 'no-show' | 'confirmed' | 'pending' {
  const normalized = crmStatus.toLowerCase();
  
  if (normalized.includes('confirmed') || normalized === 'confirmed') {
    return 'confirmed';
  }
  if (normalized.includes('pending') || normalized === 'pending') {
    return 'pending';
  }
  if (normalized.includes('completed') || normalized === 'completed') {
    return 'completed';
  }
  if (normalized.includes('cancelled') || normalized === 'cancelled' || normalized === 'canceled') {
    return 'cancelled';
  }
  if (normalized.includes('no-show') || normalized === 'no-show' || normalized === 'noshow') {
    return 'no-show';
  }
  if (normalized.includes('scheduled') || normalized === 'scheduled') {
    return 'scheduled';
  }
  
  // Default to pending
  return 'pending';
}

/**
 * Map Appointment status to CRM status
 */
function mapAppointmentStatusToCrmStatus(appointmentStatus?: string): string {
  if (!appointmentStatus) return 'pending';
  
  const normalized = appointmentStatus.toLowerCase();
  
  // Return as-is or normalize common statuses
  if (['confirmed', 'pending', 'completed', 'cancelled', 'no-show', 'scheduled'].includes(normalized)) {
    return normalized;
  }
  
  return appointmentStatus;
}

/**
 * Convert array of CRM Appointments to array of Appointments
 */
export function crmAppointmentsToAppointments(crmAppointments: CrmAppointment[] | null | undefined): Appointment[] {
  if (!crmAppointments || !Array.isArray(crmAppointments)) {
    return [];
  }
  
  // Filter out undefined values (in case any appointment is null/invalid)
  return crmAppointments
    .map(crmAppointmentToAppointment)
    .filter((appointment): appointment is Appointment => appointment !== undefined);
}
