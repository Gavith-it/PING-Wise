/**
 * CRM API Adapter
 * 
 * Converts between CRM API models and UI models
 */

import { CrmCustomer, CrmCustomerRequest } from '@/types/crmApi';
import { Patient, CreatePatientRequest } from '@/types';
import { CustomerStatus, normalizeCustomerStatus, customerStatusToApiFormat, apiFormatToCustomerStatus } from '@/lib/constants/status';

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

  // Parse date_of_birth if available (CRM API might have it as date_of_birth or in medical_history)
  let dateOfBirth: Date | undefined;
  if ((customer as any).date_of_birth) {
    try {
      dateOfBirth = new Date((customer as any).date_of_birth);
      // Check if date is valid
      if (isNaN(dateOfBirth.getTime())) {
        dateOfBirth = undefined;
      }
    } catch {
      dateOfBirth = undefined;
    }
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
    status: apiFormatToCustomerStatus(customer.status || 'active') as 'active' | 'booked' | 'follow-up' | 'inactive',
    medicalNotes: parseMedicalHistory(customer.medical_history || (customer as any).medical_history || null),
    dateOfBirth: dateOfBirth,
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

  // Convert medical notes to CRM API format
  // CRM API expects: [{"Key":"notes","Value":"text"}] or {"notes":"text"}
  let medicalHistory: any | undefined;
  if ('medicalNotes' in patient && patient.medicalNotes && patient.medicalNotes.trim()) {
    const notesText = patient.medicalNotes.trim();
    
    // If it's already in the expected array format, try to parse it
    if (notesText.startsWith('[') || notesText.startsWith('{')) {
      try {
        const parsed = JSON.parse(notesText);
        // If it's already in the correct format, use it
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].Key === 'notes') {
          medicalHistory = parsed;
        } else if (typeof parsed === 'object' && parsed !== null) {
          // If it's an object, convert to array format
          medicalHistory = [{ Key: 'notes', Value: parsed.notes || parsed.Value || notesText }];
        } else {
          // Fallback: wrap in expected format
          medicalHistory = [{ Key: 'notes', Value: notesText }];
        }
      } catch {
        // If parsing fails, treat as plain text and format it
        medicalHistory = [{ Key: 'notes', Value: notesText }];
      }
    } else {
      // Plain text - format as CRM API expects
      medicalHistory = [{ Key: 'notes', Value: notesText }];
    }
  }

  // Include date_of_birth if available
  const crmRequest: CrmCustomerRequest & { date_of_birth?: string } = {
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

  // Add date_of_birth if available (format as ISO string)
  if ('dateOfBirth' in patient && patient.dateOfBirth) {
    const dob = patient.dateOfBirth instanceof Date 
      ? patient.dateOfBirth 
      : new Date(patient.dateOfBirth);
    if (!isNaN(dob.getTime())) {
      crmRequest.date_of_birth = dob.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    }
  }

  return crmRequest;
}

/**
 * Parse medical history from CRM API format to plain text
 * Handles various formats:
 * - Array format: [{"Key":"notes","Value":"text"}]
 * - Object format: {"notes":"text"} or {"Key":"notes","Value":"text"}
 * - String format: "text"
 * - JSON string: "[{\"Key\":\"notes\",\"Value\":\"text\"}]"
 */
function parseMedicalHistory(medicalHistory: any): string {
  if (!medicalHistory) {
    return '';
  }

  // If it's already a string, check if it's a JSON string
  if (typeof medicalHistory === 'string') {
    // Try to parse if it looks like JSON
    if (medicalHistory.trim().startsWith('[') || medicalHistory.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(medicalHistory);
        return parseMedicalHistory(parsed); // Recursively parse the parsed JSON
      } catch {
        // If parsing fails, return as-is (plain string)
        return medicalHistory;
      }
    }
    // Plain string, return as-is
    return medicalHistory;
  }

  // If it's an array (e.g., [{"Key":"notes","Value":"text"}])
  if (Array.isArray(medicalHistory)) {
    // Look for objects with Key/Value structure
    for (const item of medicalHistory) {
      if (item && typeof item === 'object') {
        // Check for Key/Value format (case-insensitive key matching)
        const itemKey = item.Key || item.key;
        const itemValue = item.Value || item.value;
        
        if (itemKey && itemValue) {
          // Check if key is 'notes' (case-insensitive)
          if (String(itemKey).toLowerCase() === 'notes') {
            return String(itemValue || '');
          }
        }
        // Check for direct value property (case-insensitive)
        if ('Value' in item || 'value' in item) {
          const value = item.Value || item.value;
          if (value) {
            return String(value || '');
          }
        }
        // Check for notes property (case-insensitive)
        if ('notes' in item || 'Notes' in item) {
          const notes = item.notes || item.Notes;
          if (notes) {
            return String(notes || '');
          }
        }
      }
    }
    // If no valid structure found, return empty
    return '';
  }

  // If it's an object
  if (typeof medicalHistory === 'object' && medicalHistory !== null) {
    // Check for Key/Value format (case-insensitive)
    const key = medicalHistory.Key || medicalHistory.key;
    const value = medicalHistory.Value || medicalHistory.value;
    
    if (key && value && String(key).toLowerCase() === 'notes') {
      return String(value || '');
    }
    // Check for notes property (case-insensitive)
    if ('notes' in medicalHistory || 'Notes' in medicalHistory) {
      const notes = medicalHistory.notes || medicalHistory.Notes;
      if (notes) {
        return String(notes || '');
      }
    }
    // Check for Value property (case-insensitive)
    if ('Value' in medicalHistory || 'value' in medicalHistory) {
      const val = medicalHistory.Value || medicalHistory.value;
      if (val) {
        return String(val || '');
      }
    }
    // If object has string values, try to extract meaningful text
    const values = Object.values(medicalHistory).filter(v => typeof v === 'string' && v.trim());
    if (values.length > 0) {
      return values[0] as string;
    }
  }

  // Fallback: convert to string
  return String(medicalHistory);
}

/**
 * Map CRM status to Patient status (using standardized constants)
 * @deprecated Use normalizeCustomerStatus and apiFormatToCustomerStatus from constants instead
 */
function mapStatusToPatientStatus(crmStatus: string): 'active' | 'booked' | 'follow-up' | 'inactive' {
  // Use standardized constants for normalization
  const normalized = apiFormatToCustomerStatus(crmStatus);
  // Convert back to API format for type compatibility
  return customerStatusToApiFormat(normalized) as 'active' | 'booked' | 'follow-up' | 'inactive';
}

/**
 * Map Patient status to CRM status (using standardized constants)
 * API expects standardized format (FollowUp, Active, etc.) - NOT lowercase
 * So we return standardized format directly
 */
function mapPatientStatusToCrmStatus(patientStatus: string | undefined): string {
  if (!patientStatus) return CustomerStatus.Active;
  
  // Normalize to standardized format and return as-is (API expects standardized format)
  const normalized = normalizeCustomerStatus(patientStatus);
  return normalized; // Return standardized format directly, not API format
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

