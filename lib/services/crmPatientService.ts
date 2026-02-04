/**
 * CRM Patient Service
 * 
 * Wrapper service that uses CRM API but exposes the same interface as patientService
 * This allows the CRM page to use the external CRM API while maintaining compatibility
 */

import { crmApi } from './crmApi';
import { crmCustomerToPatient, patientToCrmCustomer, crmCustomersToPatients } from '@/lib/utils/crmAdapter';
import { Patient, CreatePatientRequest, ApiResponse } from '@/types';
import { CrmCustomer, CrmCustomerRequest } from '@/types/crmApi';

/** Parse a single CSV line respecting double-quoted fields */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((c === ',' && !inQuotes) || (c === '\r' && !inQuotes)) {
      result.push(current.trim());
      current = '';
    } else if (c !== '\r') {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

/** Parse CSV string to array of CrmCustomerRequest (header row required) */
function parseCSVToCustomers(csvContent: string): CrmCustomerRequest[] {
  const lines = csvContent.replace(/\r\n/g, '\n').split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
  const customers: CrmCustomerRequest[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    header.forEach((h, idx) => {
      row[h] = values[idx] ?? '';
    });
    const first_name = row.first_name?.trim() ?? '';
    const last_name = row.last_name?.trim() ?? '';
    const email = row.email?.trim() ?? '';
    if (!first_name && !last_name && !email) continue;
    const req: CrmCustomerRequest = {
      first_name: first_name || 'Unknown',
      last_name: last_name || 'Unknown',
      email: email || `bulk-${Date.now()}-${i}@placeholder.local`,
    };
    if (row.phone) req.phone = row.phone.trim();
    if (row.address) req.address = row.address.trim();
    if (row.age) {
      const n = parseInt(row.age, 10);
      if (!isNaN(n)) req.age = n;
    }
    if (row.gender) req.gender = row.gender.trim();
    if (row.date_of_birth) req.date_of_birth = row.date_of_birth.trim();
    if (row.last_visit) req.last_visit = row.last_visit.trim();
    if (row.next_visit) req.next_visit = row.next_visit.trim();
    if (row.status) req.status = row.status.trim();
    if (row.medical_history?.trim()) {
      try {
        req.medical_history = JSON.parse(row.medical_history.trim()) as Record<string, any>;
      } catch {
        req.medical_history = {};
      }
    }
    customers.push(req);
  }
  return customers;
}

/**
 * CRM Patient Service - Compatible interface with patientService
 * Uses external CRM API at https://pw-crm-gateway-1.onrender.com
 */
export const crmPatientService = {
  /**
   * Get all patients (customers) from CRM API
   */
  async getPatients(params: any = {}): Promise<ApiResponse<Patient[]>> {
    try {
      // CRM API doesn't support filtering yet, so we fetch all and filter client-side if needed
      const customers = await crmApi.getCustomers();
      
      // Handle empty or null response
      if (!customers || customers.length === 0) {
        return {
          success: true,
          data: [],
          total: 0,
          page: params.page || 1,
          count: 0,
          pages: 0,
        };
      }
      
      const patients = crmCustomersToPatients(customers);
      
      // Handle case where conversion returns empty array
      if (!patients || patients.length === 0) {
        return {
          success: true,
          data: [],
          total: 0,
          page: params.page || 1,
          count: 0,
          pages: 0,
        };
      }
      
      // Apply client-side filtering if params are provided
      let filteredPatients = patients;
      
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        filteredPatients = filteredPatients.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.email.toLowerCase().includes(searchLower) ||
          p.phone.includes(searchLower)
        );
      }
      
      if (params.status && params.status !== 'all') {
        filteredPatients = filteredPatients.filter(p => p.status === params.status);
      }
      
      // Pagination
      const page = params.page || 1;
      const limit = params.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPatients = filteredPatients.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: paginatedPatients,
        total: filteredPatients.length,
        page,
        count: paginatedPatients.length,
        pages: Math.ceil(filteredPatients.length / limit),
      };
    } catch (error: any) {
      console.error('Error fetching patients from CRM:', error);
      throw error;
    }
  },

  /**
   * Get single patient by ID
   */
  async getPatient(id: string): Promise<ApiResponse<Patient>> {
    try {
      const customer = await crmApi.getCustomer(id);
      const patient = crmCustomerToPatient(customer);
      
      if (!patient) {
        throw new Error('Patient not found');
      }
      
      return {
        success: true,
        data: patient,
      };
    } catch (error: any) {
      console.error('Error fetching patient from CRM:', error);
      throw error;
    }
  },

  /**
   * Create new patient (customer)
   */
  async createPatient(patientData: CreatePatientRequest): Promise<ApiResponse<Patient>> {
    try {
      const customerRequest = patientToCrmCustomer(patientData);
      const customer = await crmApi.createCustomer(customerRequest);
      const patient = crmCustomerToPatient(customer);
      
      if (!patient) {
        throw new Error('Failed to create patient');
      }
      
      return {
        success: true,
        data: patient,
        message: 'Patient created successfully',
      };
    } catch (error: any) {
      console.error('Error creating patient in CRM:', error);
      throw error;
    }
  },

  /**
   * Update patient (customer)
   * Optimized: Directly updates without fetching existing data first
   */
  async updatePatient(id: string, patientData: Partial<CreatePatientRequest>): Promise<ApiResponse<Patient>> {
    try {
      // Convert patient data directly to customer request format
      // No need to fetch existing data - just send the update
      const customerRequest = patientToCrmCustomer(patientData as CreatePatientRequest);
      const customer = await crmApi.updateCustomer(id, customerRequest);
      const patient = crmCustomerToPatient(customer);
      
      if (!patient) {
        throw new Error('Failed to update patient');
      }
      
      return {
        success: true,
        data: patient,
        message: 'Patient updated successfully',
      };
    } catch (error: any) {
      console.error('Error updating patient in CRM:', error);
      throw error;
    }
  },

  /**
   * Delete patient (customer)
   */
  async deletePatient(id: string): Promise<ApiResponse> {
    try {
      console.log('[CRM Patient Service] Deleting patient with ID:', id);
      console.log('[CRM Patient Service] Calling crmApi.deleteCustomer...');
      
      const response = await crmApi.deleteCustomer(id);
      
      console.log('[CRM Patient Service] Delete API call successful:', response);
      
      return {
        success: true,
        message: 'Patient deleted successfully',
      };
    } catch (error: any) {
      console.error('[CRM Patient Service] Error deleting patient from CRM:', error);
      console.error('[CRM Patient Service] Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        url: error?.config?.url,
        method: error?.config?.method,
      });
      throw error;
    }
  },

  /**
   * Bulk upload patients from CSV file.
   * Tries CSV body first; on 400 "Incorrect customer request" retries with JSON array of customers.
   */
  async bulkUploadPatients(file: File): Promise<ApiResponse<{ successCount: number; errors: any[] }>> {
    let csvContent = await file.text();
    csvContent = csvContent.replace(/^\uFEFF/, '').trim();

    const runCsvResponse = (response: string) => {
      const lines = response.trim().split('\n').filter((l: string) => l.trim());
      const successCount = lines.length <= 1 ? 0 : lines.length - 1;
      const inputRows = csvContent.trim().split('\n').filter((l: string) => l.trim()).length - 1;
      const errors: any[] = [];
      if (successCount < inputRows) {
        for (let i = successCount; i < inputRows; i++) {
          errors.push({ row: i + 2, field: 'row', message: 'Failed to process row', data: null });
        }
      }
      return {
        success: true,
        data: { successCount, errors },
        message: errors.length > 0
          ? `Uploaded ${successCount} patient(s) with ${errors.length} error(s)`
          : `Successfully uploaded ${successCount} patient(s)`,
      };
    };

    try {
      const csvResponse = await crmApi.bulkUploadCustomers(csvContent);
      return runCsvResponse(csvResponse);
    } catch (error: any) {
      const is400Incorrect =
        error.response?.status === 400 &&
        (typeof error.response?.data === 'string'
          ? error.response.data.includes('Incorrect customer request')
          : String(error.response?.data?.message || '').includes('Incorrect customer request'));

      if (is400Incorrect) {
        try {
          const customers = parseCSVToCustomers(csvContent);
          if (customers.length === 0) {
            return {
              success: false,
              data: { successCount: 0, errors: [{ row: 0, field: 'csv', message: 'No valid rows after parsing', data: null }] },
              message: 'No valid customer rows in CSV',
            };
          }
          const jsonResponse = await crmApi.bulkUploadCustomersAsJson(customers);
          const count = Array.isArray(jsonResponse)
            ? jsonResponse.length
            : (jsonResponse?.count ?? jsonResponse?.successCount ?? jsonResponse?.data?.count ?? customers.length);
          return {
            success: true,
            data: { successCount: count, errors: [] },
            message: `Successfully uploaded ${count} patient(s)`,
          };
        } catch (jsonError: any) {
          console.error('Bulk upload (JSON fallback) failed:', jsonError);
          return {
            success: false,
            data: { successCount: 0, errors: [] },
            message: jsonError.response?.data?.message || jsonError.message || 'Bulk upload failed',
          };
        }
      }

      let errors: any[] = [];
      let errorMessage = error.message || 'Failed to upload patients';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data.split('\n')[0] || errorMessage;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
          if (Array.isArray(error.response.data.errors)) errors = error.response.data.errors;
        }
      }
      return {
        success: false,
        data: { successCount: 0, errors },
        message: errorMessage,
      };
    }
  },
};

