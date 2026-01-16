/**
 * Appointment API Adapter
 * 
 * Converts between CRM API Appointment models and UI Appointment models
 */

import { Appointment, User } from '@/types';

// Backend Appointment format (from swagger)
export interface CrmAppointment {
  id: string;
  appointment_type?: string;
  assigned_to?: string; // Doctor name (not ID)
  assigned_to_id?: string; // Doctor ID (separate field)
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

  // assigned_to should contain doctor name, assigned_to_id contains doctor ID
  // However, currently API may return ID in assigned_to instead of name
  // Check if assigned_to looks like an ID (long alphanumeric, no spaces) or a name
  // Return as string ID for enrichment - enrichment will convert to User object
  let doctor: string | User = '';
  const assignedTo = crmAppointment.assigned_to || '';
  const assignedToId = crmAppointment.assigned_to_id || '';
  
  if (assignedTo) {
    // Check if assigned_to looks like an ID (long alphanumeric string, typically 20+ chars, no spaces)
    // vs a name (shorter, may contain spaces, letters)
    const looksLikeId = assignedTo.length > 15 && !assignedTo.includes(' ') && /^[a-zA-Z0-9]+$/.test(assignedTo);
    
    if (looksLikeId) {
      // assigned_to is an ID (current API behavior), return as string ID for enrichment
      doctor = assignedToId || assignedTo;
    } else {
      // assigned_to is a name (expected behavior), but we don't have full User object yet
      // Return as string ID for enrichment - enrichment will fetch full User object with name
      doctor = assignedToId || assignedTo;
    }
  } else if (assignedToId) {
    // Only assigned_to_id available, return as string ID for enrichment
    doctor = assignedToId;
  }

  return {
    id: String(crmAppointment.id),
    patient: crmAppointment.customer_id || '', // Will be populated if needed
    doctor: doctor, // Doctor object with name from assigned_to, or empty string
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

  // Extract assigned_to (doctor name) and assigned_to_id (doctor ID)
  // assigned_to should contain the doctor name, assigned_to_id should contain the doctor ID
  let assigned_to: string | undefined;
  let assigned_to_id: string | undefined;
  if (appointment.doctor) {
    if (typeof appointment.doctor === 'string') {
      // If it's a string, it's just an ID (fallback case)
      // Try to use it as ID, but name will be empty (backend should handle this)
      assigned_to_id = appointment.doctor.trim();
      assigned_to = assigned_to_id; // Fallback: use ID if name not available
    } else if (typeof appointment.doctor === 'object' && appointment.doctor !== null) {
      // If it's an object (User), extract the name and ID
      assigned_to_id = appointment.doctor.id?.toString().trim();
      // User type always has name property, so safe to access
      const doctorName = 'name' in appointment.doctor ? appointment.doctor.name?.trim() : undefined;
      assigned_to = doctorName || assigned_to_id; // Use name, fallback to ID if name missing
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
 * Map CRM status to Appointment status (capitalized format)
 * Only supports: Confirmed, Pending, Completed, Cancelled
 */
function mapCrmStatusToAppointmentStatus(crmStatus: string): 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled' {
  const normalized = crmStatus.toLowerCase();
  
  // Return capitalized format to match frontend standard
  if (normalized.includes('confirmed') || normalized === 'confirmed') {
    return 'Confirmed';
  }
  if (normalized.includes('pending') || normalized === 'pending') {
    return 'Pending';
  }
  if (normalized.includes('completed') || normalized === 'completed') {
    return 'Completed';
  }
  if (normalized.includes('cancelled') || normalized === 'cancelled' || normalized === 'canceled') {
    return 'Cancelled';
  }
  
  // Default to Pending (capitalized)
  return 'Pending';
}

/**
 * Map Appointment status to CRM status (capitalized format)
 * Only supports: Confirmed, Pending, Completed, Cancelled
 */
function mapAppointmentStatusToCrmStatus(appointmentStatus?: string): string {
  if (!appointmentStatus) return 'Pending';
  
  const normalized = appointmentStatus.toLowerCase();
  
  // Return capitalized format to match backend
  if (normalized === 'confirmed') {
    return 'Confirmed';
  }
  if (normalized === 'pending') {
    return 'Pending';
  }
  if (normalized === 'completed') {
    return 'Completed';
  }
  if (normalized === 'cancelled' || normalized === 'canceled') {
    return 'Cancelled';
  }
  
  // If already capitalized, return as-is
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
