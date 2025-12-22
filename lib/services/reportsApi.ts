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
 * - Tries direct backend call first (faster, requires CORS on backend)
 * - Automatically falls back to Next.js proxy route if CORS error detected
 * - Proxy route code is kept as fallback (not removed)
 * - Server-side always uses direct calls (no CORS issues)
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
  // Alternative field names (snake_case)
  active_customers?: number;
  booked_customers?: number;
  followup_customers?: number;
  total_appointments?: number;
  total_customers?: number;
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
    this.baseURL = '/api/reports';
    
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
          console.warn('[Reports API] CORS error detected, falling back to proxy');
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
    // Check all possible token keys for consistency across all services
    return sessionStorage.getItem('token') || 
           sessionStorage.getItem('crm_access_token') || 
           sessionStorage.getItem('access_token');
  }

  private removeToken(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('crm_access_token');
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('token');
    }
  }

  // ==================== REPORTS ====================

  /**
   * Get daily report
   * GET /reports/daily (direct) or /api/reports/daily (proxy fallback)
   * Query params: date (optional, defaults to today)
   */
  async getDailyReport(params: { date?: string } = {}): Promise<DailyReport> {
    try {
      const response = await this.makeRequestWithFallback((api) => 
        api.get<any>('/reports/daily', { params })
      ) as unknown as any;
      
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
}

export const reportsApi = new ReportsApiService();
