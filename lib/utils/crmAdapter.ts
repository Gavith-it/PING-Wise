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
  const dobValue = (customer as any).date_of_birth;
  if (dobValue && typeof dobValue === 'string' && dobValue.trim() !== '') {
    try {
      dateOfBirth = new Date(dobValue);
      // Check if date is valid
      if (isNaN(dateOfBirth.getTime())) {
        dateOfBirth = undefined;
      }
    } catch {
      dateOfBirth = undefined;
    }
  } else if (dobValue && dobValue instanceof Date) {
    // If it's already a Date object
    if (!isNaN(dobValue.getTime())) {
      dateOfBirth = dobValue;
    }
  }

  // Parse last_visit if available
  let lastVisit: Date | undefined;
  const lastVisitValue = customer.last_visit;
  if (lastVisitValue && typeof lastVisitValue === 'string' && lastVisitValue.trim() !== '') {
    try {
      lastVisit = new Date(lastVisitValue);
      // Check if date is valid
      if (isNaN(lastVisit.getTime())) {
        lastVisit = undefined;
      }
    } catch {
      lastVisit = undefined;
    }
  } else if (lastVisitValue && typeof lastVisitValue === 'object' && 'getTime' in lastVisitValue && typeof (lastVisitValue as any).getTime === 'function') {
    // If it's already a Date object (check by duck typing)
    const dateValue = lastVisitValue as Date;
    if (!isNaN(dateValue.getTime())) {
      lastVisit = dateValue;
    }
  }

  // Convert gender from capitalized full words (Male, Female, Other) to lowercase full words (male, female, other)
  let gender: 'male' | 'female' | 'other' | '' = '';
  if (customer.gender) {
    const genderLower = customer.gender.toLowerCase();
    if (genderLower === 'male' || genderLower === 'm') {
      gender = 'male';
    } else if (genderLower === 'female' || genderLower === 'f') {
      gender = 'female';
    } else if (genderLower === 'other' || genderLower === 'o') {
      gender = 'other';
    } else {
      // If it's already in lowercase full word format, use as-is
      if (genderLower === 'male' || genderLower === 'female' || genderLower === 'other') {
        gender = genderLower as 'male' | 'female' | 'other';
      }
    }
  }

  // Extract email - ensure it's a valid string, not empty or undefined
  const email = customer.email && typeof customer.email === 'string' && customer.email.trim() !== ''
    ? customer.email.trim()
    : '';

  return {
    id: String(customerId), // Ensure id is a string
    name: `${customer.first_name} ${customer.last_name}`.trim(),
    age: customer.age || 0,
    gender: gender,
    phone: customer.phone || '',
    email: email,
    address: customer.address || '',
    assignedDoctor: customer.assigned_to,
    status: (() => {
      const normalizedStatus = apiFormatToCustomerStatus(customer.status || 'active');
      // Convert CustomerStatus.FollowUp to 'follow-up' for Patient type compatibility
      if (normalizedStatus === CustomerStatus.FollowUp) {
        return 'follow-up' as const;
      }
      // Convert other statuses to lowercase for Patient type
      return normalizedStatus.toLowerCase() as 'active' | 'booked' | 'follow-up' | 'inactive';
    })(),
    medicalNotes: parseMedicalHistory(customer.medical_history || (customer as any).medical_history || null),
    dateOfBirth: dateOfBirth,
    lastVisit: lastVisit,
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
  // Backend expects: map[string]interface{} (JSON object), not array
  let medicalHistory: Record<string, any> | undefined;
  if ('medicalNotes' in patient && patient.medicalNotes && patient.medicalNotes.trim()) {
    const notesText = patient.medicalNotes.trim();
    
    // If it's already a JSON string, try to parse it
    if (notesText.startsWith('[') || notesText.startsWith('{')) {
      try {
        const parsed = JSON.parse(notesText);
        // If it's an array, convert to object format
        if (Array.isArray(parsed)) {
          // Convert array to object - extract notes value
          const notesValue = parsed.length > 0 && parsed[0]?.Value 
            ? parsed[0].Value 
            : parsed.length > 0 && parsed[0]?.value 
            ? parsed[0].value 
            : notesText;
          medicalHistory = { notes: notesValue };
        } else if (typeof parsed === 'object' && parsed !== null) {
          // Already an object - use it directly
          medicalHistory = parsed;
        } else {
          // Fallback: create object with notes
          medicalHistory = { notes: notesText };
        }
      } catch {
        // If parsing fails, treat as plain text and create object
        medicalHistory = { notes: notesText };
      }
    } else {
      // Plain text - create JSON object (backend expects object, not array)
      medicalHistory = { notes: notesText };
    }
  }

  // Convert gender from lowercase full words (male, female, other) to capitalized full words (Male, Female, Other)
  // API expects: "Male", "Female", or "Other" (capitalized full words)
  let gender: string | undefined;
  if (patient.gender) {
    const genderLower = patient.gender.toLowerCase().trim();
    if (genderLower === 'male' || genderLower === 'm') {
      gender = 'Male';
    } else if (genderLower === 'female' || genderLower === 'f') {
      gender = 'Female';
    } else if (genderLower === 'other' || genderLower === 'o') {
      gender = 'Other';
    } else {
      // If already in capitalized format or unexpected format, ensure proper capitalization
      const trimmed = patient.gender.trim();
      gender = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
      // Ensure it matches one of the expected values
      if (gender.toLowerCase() !== 'male' && gender.toLowerCase() !== 'female' && gender.toLowerCase() !== 'other') {
        // If it doesn't match, default to empty (will be undefined)
        gender = undefined;
      } else {
        // Re-capitalize to ensure proper format
        gender = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
      }
    }
  }

  // Extract and validate email - ensure it's a valid string
  const email = patient.email && typeof patient.email === 'string' && patient.email.trim() !== ''
    ? patient.email.trim()
    : '';

  // Include date_of_birth and last_visit if available
  const crmRequest: CrmCustomerRequest = {
    first_name: firstName,
    last_name: lastName,
    email: email,
    phone: patient.phone || '',
    address: patient.address,
    age: patient.age || undefined,
    gender: gender,
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

  // Add last_visit if available (format as ISO string)
  if ('lastVisit' in patient && patient.lastVisit) {
    const lastVisit = patient.lastVisit instanceof Date 
      ? patient.lastVisit 
      : new Date(patient.lastVisit);
    if (!isNaN(lastVisit.getTime())) {
      crmRequest.last_visit = lastVisit.toISOString().split('T')[0]; // Format as YYYY-MM-DD
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
export function parseMedicalHistory(medicalHistory: any): string {
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

