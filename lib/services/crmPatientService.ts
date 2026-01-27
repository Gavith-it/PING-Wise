/**
 * CRM Patient Service
 * 
 * Wrapper service that uses CRM API but exposes the same interface as patientService
 * This allows the CRM page to use the external CRM API while maintaining compatibility
 */

import { crmApi } from './crmApi';
import { crmCustomerToPatient, patientToCrmCustomer, crmCustomersToPatients } from '@/lib/utils/crmAdapter';
import { Patient, CreatePatientRequest, ApiResponse } from '@/types';
import { CrmCustomer } from '@/types/crmApi';

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
   * Bulk upload patients from CSV file
   * POST /customers/bulk
   * Reads CSV file content and sends as string in JSON body
   * Response is CSV format with results
   */
  async bulkUploadPatients(file: File): Promise<ApiResponse<{ successCount: number; errors: any[] }>> {
    try {
      // Read CSV file content as text
      const csvContent = await file.text();
      
      // Call CRM API bulk upload endpoint
      const csvResponse = await crmApi.bulkUploadCustomers(csvContent);
      
      // Parse CSV response - API returns CSV with same structure as input
      const lines = csvResponse.trim().split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        return {
          success: true,
          data: { successCount: 0, errors: [] },
          message: 'No data processed',
        };
      }
      
      // First line is header, rest are successfully processed rows
      const header = lines[0];
      const dataRows = lines.slice(1);
      
      // Count successful rows (all rows in response are successful)
      // The API returns CSV with successfully created customers
      const successCount = dataRows.length;
      
      // Calculate original input rows for error tracking
      const inputLines = csvContent.trim().split('\n').filter(line => line.trim());
      const inputDataRows = inputLines.slice(1); // Skip header
      const totalInputRows = inputDataRows.length;
      
      // If response has fewer rows than input, some rows failed
      const errors: any[] = [];
      if (successCount < totalInputRows) {
        // Some rows failed - we don't know which ones from CSV response alone
        // API might return errors separately or in response, but for now we'll note the difference
        for (let i = successCount; i < totalInputRows; i++) {
          errors.push({
            row: i + 2, // +2 for header and 0-based index
            field: 'row',
            message: 'Failed to process row',
            data: inputDataRows[i],
          });
        }
      }
      
      return {
        success: true,
        data: { successCount, errors },
        message: errors.length > 0 
          ? `Uploaded ${successCount} patient(s) with ${errors.length} error(s)`
          : `Successfully uploaded ${successCount} patient(s)`,
      };
    } catch (error: any) {
      console.error('Error in bulk upload:', error);
      
      // Try to parse error response - could be CSV or JSON
      let errors: any[] = [];
      let errorMessage = error.message || 'Failed to upload patients';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          // CSV error response
          const errorCsv = error.response.data;
          const errorLines = errorCsv.trim().split('\n').filter((line: string) => line.trim());
          if (errorLines.length > 1) {
            errorLines.slice(1).forEach((row: string, index: number) => {
              if (row.trim()) {
                errors.push({
                  row: index + 2,
                  field: 'row',
                  message: 'Upload failed',
                  data: row,
                });
              }
            });
          }
          errorMessage = `Upload failed: ${errorLines[0] || 'Unknown error'}`;
        } else if (error.response.data.message) {
          // JSON error response
          errorMessage = error.response.data.message;
          if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
            errors = error.response.data.errors;
          }
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

