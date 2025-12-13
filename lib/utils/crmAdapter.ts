/**
 * CRM API Adapter
 * 
 * Converts between CRM API models and UI models
 */

import { CrmCustomer, CrmCustomerRequest } from '@/types/crmApi';
import { Patient, CreatePatientRequest } from '@/types';

/**
 * Convert CRM Customer to UI Patient model
 */
export function crmCustomerToPatient(customer: CrmCustomer | null | undefined): Patient | undefined {
  // Handle null or undefined customer
  if (!customer) {
    return undefined;
  }
  
  // Handle case where customer exists but doesn't have required fields
  if (typeof customer !== 'object' || customer === null) {
    return undefined;
  }
  
  // ID is required - check if it exists (can be string or number)
  const customerId = customer.id;
  if (customerId === undefined || customerId === null || customerId === '') {
    console.warn('Customer missing id:', customer);
    return undefined;
  }

  return {
    id: String(customerId), // Ensure id is a string
    name: `${customer.first_name} ${customer.last_name}`.trim(),
    age: customer.age || 0,
    gender: (customer.gender?.toLowerCase() as 'male' | 'female' | 'other') || '',
    phone: customer.phone || '',
    email: customer.email,
    address: customer.address,
    assignedDoctor: customer.assigned_to,
    status: mapStatusToPatientStatus(customer.status || 'active'),
    medicalNotes: typeof customer.medical_history === 'object' && customer.medical_history !== null
      ? JSON.stringify(customer.medical_history) 
      : customer.medical_history ? String(customer.medical_history) : '',
    lastVisit: undefined, // Not available in CRM API
    nextAppointment: undefined, // Not available in CRM API
    initials: `${customer.first_name?.[0] || ''}${customer.last_name?.[0] || ''}`.toUpperCase() || 'P',
    avatarColor: undefined, // Will be generated in UI
    createdBy: '', // Not available in CRM API
    createdAt: customer.created_at ? new Date(customer.created_at) : undefined,
    updatedAt: customer.updated_at ? new Date(customer.updated_at) : undefined,
  };
}

/**
 * Convert UI Patient model to CRM Customer Request
 */
export function patientToCrmCustomer(patient: Patient | CreatePatientRequest): CrmCustomerRequest {
  // Split name into first_name and last_name
  const nameParts = ('name' in patient ? patient.name : '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Parse medical notes if it's a JSON string
  let medicalHistory: Record<string, any> | undefined;
  if ('medicalNotes' in patient && patient.medicalNotes) {
    try {
      medicalHistory = JSON.parse(patient.medicalNotes);
    } catch {
      // If not JSON, store as string in an object
      medicalHistory = { notes: patient.medicalNotes };
    }
  }

  return {
    first_name: firstName,
    last_name: lastName,
    email: patient.email,
    phone: patient.phone,
    address: patient.address,
    age: patient.age || undefined,
    gender: patient.gender || undefined,
    assigned_to: 'assignedDoctor' in patient ? patient.assignedDoctor : undefined,
    status: mapPatientStatusToCrmStatus(patient.status),
    medical_history: medicalHistory,
  };
}

/**
 * Map CRM status to Patient status
 */
function mapStatusToPatientStatus(crmStatus: string): 'active' | 'booked' | 'follow-up' | 'inactive' {
  const normalized = crmStatus.toLowerCase();
  
  if (normalized.includes('active') || normalized === 'active') {
    return 'active';
  }
  if (normalized.includes('booked') || normalized === 'booked') {
    return 'booked';
  }
  if (normalized.includes('follow') || normalized === 'follow-up') {
    return 'follow-up';
  }
  if (normalized.includes('inactive') || normalized === 'inactive') {
    return 'inactive';
  }
  
  // Default to active if status doesn't match
  return 'active';
}

/**
 * Map Patient status to CRM status
 */
function mapPatientStatusToCrmStatus(patientStatus: string | undefined): string {
  if (!patientStatus) return 'active';
  
  const normalized = patientStatus.toLowerCase();
  
  // Return as-is or normalize common statuses
  if (['active', 'booked', 'follow-up', 'inactive'].includes(normalized)) {
    return normalized;
  }
  
  return patientStatus;
}

/**
 * Convert array of CRM Customers to array of Patients
 */
export function crmCustomersToPatients(customers: CrmCustomer[] | null | undefined): Patient[] {
  if (!customers || !Array.isArray(customers)) {
    return [];
  }
  
  // Filter out undefined values (in case any customer is null/invalid)
  return customers
    .map(crmCustomerToPatient)
    .filter((patient): patient is Patient => patient !== undefined);
}

