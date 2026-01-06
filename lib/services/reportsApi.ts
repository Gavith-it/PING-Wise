/**
 * Reports API Service
 * 
 * Handles all Reports API interactions.
 * Base URL: https://pw-crm-gateway-1.onrender.com/reports
 * 
 * IMPORTANT: Set environment variable:
 * NEXT_PUBLIC_CRM_API_BASE_URL=https://pw-crm-gateway-1.onrender.com
 * 
 * ARCHITECTURE:
 * - Direct backend API calls only
 * - No proxy routes - connects directly to backend API
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// Daily Report Response Type
export interface DailyReport {
  date?: string;
  // Backend API fields (from actual API response) - camelCase
  activeCustomers?: number;
  bookedCustomers?: number;
  followupCustomers?: number;
  totalAppointments?: number;
  totalCustomers?: number;
  confirmedAppointments?: number;
  completedAppointments?: number;
  cancelledAppointments?: number;
  // Alternative field names (snake_case)
  active_customers?: number;
  booked_customers?: number;
  followup_customers?: number;
  total_appointments?: number;
  total_customers?: number;
  confirmed_appointments?: number;
  completed_appointments?: number;
  pending_appointments?: number;
  cancelled_appointments?: number;
  total_patients?: number;
  new_patients?: number;
  revenue?: number;
  [key: string]: any; // Allow additional fields from backend
}

class ReportsApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Direct backend URL (from environment variable)
    this.baseURL = 
      process.env.NEXT_PUBLIC_CRM_API_BASE_URL || 
      'https://pw-crm-gateway-1.onrender.com';

    // Create API instance (direct backend calls only)
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Setup interceptors
    this.setupInterceptors(this.api);
  }

  /**
   * Setup interceptors for an axios instance
   */
  private setupInterceptors(apiInstance: AxiosInstance): void {
    // Request interceptor - Add auth token to all requests
    apiInstance.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
          
          // Log token in development (only first few chars for security)
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Reports API] Request ${config.method?.toUpperCase()} ${config.url} - Token: ${token.substring(0, 20)}...`);
          }
        } else {
          console.warn(`[Reports API] Request ${config.method?.toUpperCase()} ${config.url} - No token found!`);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors globally
    apiInstance.interceptors.response.use(
      (response) => {
        // Log response in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Reports API] Response ${response.config.method?.toUpperCase()} ${response.config.url}:`, {
            status: response.status,
            data: response.data,
          });
        }
        return response.data;
      },
      (error: AxiosError) => {
        // Log error in development
        if (process.env.NODE_ENV === 'development') {
          console.error('[Reports API] Request error:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message,
          });
        }
        
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          console.warn('[Reports API] 401 Unauthorized - Token may be invalid or expired');
          this.removeToken();
          // Only redirect if we're not already on the login page
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            setTimeout(() => {
              window.location.href = '/login';
            }, 100);
          }
        }
        return Promise.reject(error);
      }
    );
  }


  // ==================== TOKEN MANAGEMENT ====================

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    // Check token keys - priority: token > access_token
    return sessionStorage.getItem('token') || 
           sessionStorage.getItem('access_token');
  }

  private removeToken(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('access_token');
    }
  }

  // ==================== REPORTS ====================

  /**
   * Get daily report
   * GET /reports/daily
   * Query params: date (optional, defaults to today)
   */
  async getDailyReport(params: { date?: string } = {}): Promise<DailyReport> {
    try {
      const response = await this.api.get<any>('/reports/daily', { params }) as unknown as any;
      
      // Handle null/undefined response
      if (response === null || response === undefined) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Reports API returned null/undefined - returning empty report');
        }
        return {};
      }
      
      // Check if response has a data property (wrapped response)
      let data = response;
      if (typeof response === 'object' && response !== null && 'data' in response && !('date' in response)) {
        data = response.data;
      }
      
      // Return the report data
      return data || {};
    } catch (error) {
      console.error('Error in getDailyReport:', error);
      throw error;
    }
  }

  /**
   * Get team report
   * GET /team_report
   * Query params: mode (optional, defaults to 'weekly') - determines time period (weekly, monthly, quarterly, annually)
   */
  async getTeamReport(params: { mode?: string } = {}): Promise<any> {
    try {
      const response = await this.api.get<any>('/team_report', { params }) as unknown as any;
      
      // Handle null/undefined response
      if (response === null || response === undefined) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Team Report API returned null/undefined - returning empty object');
        }
        return {};
      }
      
      // Check if response has a data property (wrapped response)
      let data = response;
      if (typeof response === 'object' && response !== null && 'data' in response) {
        data = response.data;
      }
      
      return data || {};
    } catch (error) {
      console.error('Error in getTeamReport:', error);
      throw error;
    }
  }

  /**
   * Get churn report (Customer Activity)
   * GET /churn_report
   * Query params: mode (optional, defaults to 'weekly') - determines time period (weekly, monthly, quarterly, annually)
   */
  async getChurnReport(params: { mode?: string } = {}): Promise<any> {
    try {
      const response = await this.api.get<any>('/churn_report', { params }) as unknown as any;
      
      // Handle null/undefined response
      if (response === null || response === undefined) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Churn Report API returned null/undefined - returning empty object');
        }
        return {};
      }
      
      // Check if response has a data property (wrapped response)
      let data = response;
      if (typeof response === 'object' && response !== null && 'data' in response) {
        data = response.data;
      }
      
      return data || {};
    } catch (error) {
      console.error('Error in getChurnReport:', error);
      throw error;
    }
  }
}

export const reportsApi = new ReportsApiService();
