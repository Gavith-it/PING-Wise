/**
 * Appointment Service
 * 
 * Wrapper service that uses Appointment API but exposes the same interface as appointmentService
 * This allows the Appointments page to use the external Appointment API while maintaining compatibility
 */

import { appointmentApi } from './appointmentApi';
import { crmAppointmentToAppointment, appointmentToCrmAppointment, crmAppointmentsToAppointments } from '@/lib/utils/appointmentAdapter';
import { Appointment, CreateAppointmentRequest, ApiResponse } from '@/types';

/**
 * Appointment Service - Compatible interface with appointmentService
 * Uses external Appointment API at https://pw-crm-gateway-1.onrender.com/appointments
 */
export const crmAppointmentService = {
  /**
   * Get all appointments (with optional filtering)
   */
  async getAppointments(params: any = {}): Promise<ApiResponse<Appointment[]>> {
    try {
      // Map frontend params to backend params
      const backendParams: any = {};
      if (params.date) {
        backendParams.date = params.date; // Backend expects date in query
      }
      if (params.status) {
        backendParams.status = params.status;
      }
      if (params.patient) {
        backendParams.customer_id = params.patient;
      }
      if (params.doctor) {
        backendParams.assigned_to = params.doctor;
      }

      const crmAppointments = await appointmentApi.getAppointments(backendParams);
      const appointments = crmAppointmentsToAppointments(crmAppointments);
      
      return {
        success: true,
        data: appointments,
        count: appointments.length,
        total: appointments.length,
      };
    } catch (error: any) {
      console.error('Error fetching appointments from Appointment API:', error);
      throw error;
    }
  },

  /**
   * Get single appointment by ID
   */
  async getAppointment(id: string): Promise<ApiResponse<Appointment>> {
    try {
      const crmAppointment = await appointmentApi.getAppointment(id);
      const appointment = crmAppointmentToAppointment(crmAppointment);
      
      if (!appointment) {
        throw new Error('Appointment not found');
      }
      
      return {
        success: true,
        data: appointment,
      };
    } catch (error: any) {
      console.error('Error fetching appointment from Appointment API:', error);
      throw error;
    }
  },

  /**
   * Create new appointment
   */
  async createAppointment(appointmentData: CreateAppointmentRequest): Promise<ApiResponse<Appointment>> {
    try {
      const crmAppointmentRequest = appointmentToCrmAppointment(appointmentData);
      const crmAppointment = await appointmentApi.createAppointment(crmAppointmentRequest);
      const appointment = crmAppointmentToAppointment(crmAppointment);
      
      if (!appointment) {
        throw new Error('Failed to create appointment');
      }
      
      return {
        success: true,
        data: appointment,
        message: 'Appointment created successfully',
      };
    } catch (error: any) {
      console.error('Error creating appointment in Appointment API:', error);
      throw error;
    }
  },

  /**
   * Update appointment
   */
  async updateAppointment(id: string, appointmentData: Partial<CreateAppointmentRequest>): Promise<ApiResponse<Appointment>> {
    try {
      const crmAppointmentRequest = appointmentToCrmAppointment(appointmentData);
      const crmAppointment = await appointmentApi.updateAppointment(id, crmAppointmentRequest);
      const appointment = crmAppointmentToAppointment(crmAppointment);
      
      if (!appointment) {
        throw new Error('Failed to update appointment');
      }
      
      return {
        success: true,
        data: appointment,
        message: 'Appointment updated successfully',
      };
    } catch (error: any) {
      console.error('Error updating appointment in Appointment API:', error);
      throw error;
    }
  },

  /**
   * Cancel/Delete appointment
   */
  async cancelAppointment(id: string): Promise<ApiResponse> {
    try {
      await appointmentApi.deleteAppointment(id);
      
      return {
        success: true,
        message: 'Appointment cancelled successfully',
      };
    } catch (error: any) {
      console.error('Error cancelling appointment from Appointment API:', error);
      throw error;
    }
  },
};
