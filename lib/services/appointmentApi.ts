/**
 * Appointment API Service
 * 
 * Handles all Appointment API interactions.
 * Base URL: https://pw-crm-gateway-1.onrender.com/appointments
 * 
 * IMPORTANT: Set environment variable:
 * NEXT_PUBLIC_CRM_API_BASE_URL=https://pw-crm-gateway-1.onrender.com
 * 
 * ARCHITECTURE:
 * - Tries direct backend call first (faster, requires CORS on backend)
 * - Automatically falls back to Next.js proxy route if CORS error detected
 * - Proxy route code is kept as fallback (not removed)
 * - Server-side always uses direct calls (no CORS issues)
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { CrmAppointment, CrmAppointmentRequest } from '@/lib/utils/appointmentAdapter';

// Response types
type CrmApiListResponse<T> = T[];
type CrmApiSingleResponse<T> = T;
type CrmApiStringResponse = string;

class AppointmentApiService {
  private api: AxiosInstance;
  private proxyApi: AxiosInstance; // Fallback proxy API
  private directApi: AxiosInstance; // Direct backend API
  private baseURL: string;
  private directBaseURL: string;
  private useDirectCall: boolean = true; // Try direct call first

  constructor() {
    const isBrowser = typeof window !== 'undefined';
    
    // Direct backend URL (from environment variable)
    this.directBaseURL = 
      process.env.NEXT_PUBLIC_CRM_API_BASE_URL || 
      'https://pw-crm-gateway-1.onrender.com';
    
    // Proxy URL (Next.js API route)
    this.baseURL = '/api/appointments';
    
    if (!isBrowser) {
      // In server: always use direct call
      this.baseURL = this.directBaseURL;
    }

    // Create direct API instance (for direct backend calls)
    this.directApi = axios.create({
      baseURL: this.directBaseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Create proxy API instance (fallback)
    this.proxyApi = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Set default API (will try direct first)
    this.api = this.directApi;

    // Setup interceptors for both APIs
    this.setupInterceptors(this.directApi);
    this.setupInterceptors(this.proxyApi);
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
            console.log(`[Appointment API] Request ${config.method?.toUpperCase()} ${config.url} - Token: ${token.substring(0, 20)}...`);
          }
        } else {
          console.warn(`[Appointment API] Request ${config.method?.toUpperCase()} ${config.url} - No token found!`);
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
          console.log(`[Appointment API] Response ${response.config.method?.toUpperCase()} ${response.config.url}:`, {
            status: response.status,
            data: response.data,
            dataType: typeof response.data,
            isArray: Array.isArray(response.data),
          });
        }
        return response.data;
      },
      (error: AxiosError) => {
        // Log error in development
        if (process.env.NODE_ENV === 'development') {
          console.error('[Appointment API] Request error:', {
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
          console.warn('[Appointment API] 401 Unauthorized - Token may be invalid or expired');
          this.removeToken();
          // Only redirect if we're not already on the login page
          // This prevents redirect loops during token validation
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            // Use setTimeout to allow error handling to complete first
            setTimeout(() => {
              window.location.href = '/login';
            }, 100);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check if error is a CORS error
   */
  private isCorsError(error: AxiosError): boolean {
    // CORS errors typically have:
    // - No response (network error)
    // - Message containing "CORS" or "cross-origin"
    // - Code like "ERR_NETWORK" or "ERR_FAILED"
    if (!error.response) {
      const message = error.message?.toLowerCase() || '';
      const code = error.code?.toLowerCase() || '';
      return (
        message.includes('cors') ||
        message.includes('cross-origin') ||
        message.includes('network error') ||
        code === 'err_network' ||
        code === 'err_failed'
      );
    }
    return false;
  }

  /**
   * Make API request with automatic fallback to proxy on CORS error
   */
  private async makeRequestWithFallback<T>(
    requestFn: (api: AxiosInstance) => Promise<T>
  ): Promise<T> {
    const isBrowser = typeof window !== 'undefined';
    
    // In server-side, always use direct call
    if (!isBrowser) {
      return requestFn(this.directApi);
    }

    // In browser: try direct call first, fallback to proxy
    if (this.useDirectCall) {
      try {
        return await requestFn(this.directApi);
      } catch (error: any) {
        // If CORS error, switch to proxy and retry
        if (this.isCorsError(error as AxiosError)) {
          console.warn('[Appointment API] CORS error detected, falling back to proxy');
          this.useDirectCall = false; // Disable direct calls for future requests
          // Retry with proxy
          return requestFn(this.proxyApi);
        }
        // If not CORS error, throw it
        throw error;
      }
    } else {
      // Already using proxy, use it directly
      return requestFn(this.proxyApi);
    }
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

  // ==================== APPOINTMENTS ====================

  /**
   * List all appointments
   * GET /appointments (direct) or /api/appointments (proxy fallback)
   * Query params: date, status, customer_id, assigned_to
   */
  async getAppointments(params: { date?: string; status?: string; customer_id?: string; assigned_to?: string } = {}): Promise<CrmApiListResponse<CrmAppointment>> {
    try {
      const response = await this.makeRequestWithFallback((api) => 
        api.get<any>('/appointments', { params })
      ) as unknown as any;
      
      // Handle null/undefined response
      if (response === null || response === undefined) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Appointment API returned null/undefined - treating as empty array');
        }
        return [];
      }
      
      // Handle falsy values
      if (!response) {
        return [];
      }
      
      // Check if response has a data property (wrapped response)
      let data = response;
      if (typeof response === 'object' && response !== null && 'data' in response && !('id' in response)) {
        data = response.data;
      }
      
      // API may return single object or array, normalize to array
      if (Array.isArray(data)) {
        return data.filter((item): item is CrmAppointment => {
          return item !== null && 
                 item !== undefined && 
                 typeof item === 'object' &&
                 !!item.id;
        });
      }
      
      // Single Appointment object with id
      if (typeof data === 'object' && data !== null && data.id) {
        return [data];
      }
      
      // Object without id - might be empty object or error response
      if (typeof data === 'object' && data !== null && Object.keys(data).length === 0) {
        return [];
      }
      
      // Invalid response format
      console.warn('Appointment API returned unexpected response format:', { type: typeof response, value: response });
      return [];
    } catch (error) {
      console.error('Error in getAppointments:', error);
      throw error;
    }
  }

  /**
   * Search appointments by optional parameters
   * GET /appointments/search (direct) or /api/appointments/search (proxy fallback)
   * Query params: status, customer_id, date (YYYY-MM-DD)
   */
  async searchAppointments(params: { status?: string; customer_id?: string; date?: string } = {}): Promise<CrmApiListResponse<CrmAppointment>> {
    try {
      const response = await this.makeRequestWithFallback((api) => 
        api.get<any>('/appointments/search', { params })
      ) as unknown as any;
      
      // Handle null/undefined response
      if (response === null || response === undefined) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Appointment Search API returned null/undefined - treating as empty array');
        }
        return [];
      }
      
      // Handle falsy values
      if (!response) {
        return [];
      }
      
      // Check if response has a data property (wrapped response)
      let data = response;
      if (typeof response === 'object' && response !== null && 'data' in response && !('id' in response)) {
        data = response.data;
      }
      
      // API may return single object or array, normalize to array
      if (Array.isArray(data)) {
        return data.filter((item): item is CrmAppointment => {
          return item !== null && 
                 item !== undefined && 
                 typeof item === 'object' &&
                 !!item.id;
        });
      }
      
      // Single Appointment object with id
      if (typeof data === 'object' && data !== null && data.id) {
        return [data];
      }
      
      // Object without id - might be empty object or error response
      if (typeof data === 'object' && data !== null && Object.keys(data).length === 0) {
        return [];
      }
      
      // Invalid response format
      console.warn('Appointment Search API returned unexpected response format:', { type: typeof response, value: response });
      return [];
    } catch (error) {
      console.error('Error in searchAppointments:', error);
      throw error;
    }
  }

  /**
   * Get a single appointment by ID
   * GET /appointments/{id} (direct) or /api/appointments/{id} (proxy fallback)
   */
  async getAppointment(id: number | string): Promise<CrmApiSingleResponse<CrmAppointment>> {
    const response = await this.makeRequestWithFallback((api) => 
      api.get<any>(`/appointments/${id}`)
    ) as unknown as any;
    return response.data || response; // Handle wrapped or direct response
  }

  /**
   * Create a new appointment
   * POST /appointments (direct) or /api/appointments (proxy fallback)
   */
  async createAppointment(data: CrmAppointmentRequest): Promise<CrmApiSingleResponse<CrmAppointment>> {
    const response = await this.makeRequestWithFallback((api) => 
      api.post<any>('/appointments', data)
    ) as unknown as any;
    return response.data || response; // Handle wrapped or direct response
  }

  /**
   * Update an existing appointment
   * PUT /appointments/{id} (direct) or /api/appointments/{id} (proxy fallback)
   */
  async updateAppointment(id: number | string, data: CrmAppointmentRequest): Promise<CrmApiSingleResponse<CrmAppointment>> {
    const response = await this.makeRequestWithFallback((api) => 
      api.put<any>(`/appointments/${id}`, data)
    ) as unknown as any;
    return response.data || response; // Handle wrapped or direct response
  }

  /**
   * Delete an appointment by ID
   * DELETE /appointments/{id} (direct) or /api/appointments/{id} (proxy fallback)
   * Returns a string according to Swagger
   */
  async deleteAppointment(id: number | string): Promise<CrmApiStringResponse> {
    const response = await this.makeRequestWithFallback((api) => 
      api.delete<any>(`/appointments/${id}`)
    ) as unknown as any;
    return response.data || response; // Handle wrapped or direct response
  }
}

export const appointmentApi = new AppointmentApiService();
