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
      await crmApi.deleteCustomer(id);
      
      return {
        success: true,
        message: 'Patient deleted successfully',
      };
    } catch (error: any) {
      console.error('Error deleting patient from CRM:', error);
      throw error;
    }
  },

  /**
   * Bulk upload patients (not supported by CRM API yet)
   */
  async bulkUploadPatients(formData: FormData): Promise<ApiResponse<{ successCount: number; errors: any[] }>> {
    // CRM API doesn't support bulk upload yet
    throw new Error('Bulk upload not supported by CRM API');
  },
};

