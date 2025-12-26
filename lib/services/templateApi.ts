/**
 * Template API Service
 * 
 * Service for interacting with the Template API
 * Base URL: https://pw-crm-gateway-1.onrender.com/templates
 * 
 * ARCHITECTURE:
 * - Tries direct backend call first (faster, requires CORS on backend)
 * - Automatically falls back to Next.js proxy route if CORS error detected
 * - Proxy route code is kept as fallback (not removed)
 * - Server-side always uses direct calls (no CORS issues)
 * 
 * IMPORTANT: Set environment variable:
 * NEXT_PUBLIC_CRM_API_BASE_URL=https://pw-crm-gateway-1.onrender.com
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  CrmTemplate,
  CrmTemplateRequest,
  CrmApiListResponse,
  CrmApiSingleResponse,
  CrmApiStringResponse,
} from '@/types/crmApi';

class TemplateApiService {
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
    this.baseURL = '/api/templates';
    
    if (!isBrowser) {
      // In server: always use direct call
      this.baseURL = `${this.directBaseURL}/templates`;
    }

    // Create direct API instance (for direct backend calls)
    this.directApi = axios.create({
      baseURL: `${this.directBaseURL}/templates`,
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
        }
        
        // Log token in development (only first few chars for security)
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Template API] Request ${config.method?.toUpperCase()} ${config.url} - Token: ${token ? token.substring(0, 20) + '...' : 'No token'}`);
        } else if (!token) {
          console.warn(`[Template API] Request ${config.method?.toUpperCase()} ${config.url} - No token found!`);
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
          console.log(`[Template API] Response ${response.config.method?.toUpperCase()} ${response.config.url}:`, {
            status: response.status,
            data: response.data,
            dataType: typeof response.data,
            isArray: Array.isArray(response.data),
          });
        }
        return response.data;
      },
      async (error: AxiosError) => {
        // Log error in development
        if (process.env.NODE_ENV === 'development') {
          console.error('[Template API] Request error:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message,
          });
        }
        
        // Handle CORS errors - fallback to proxy
        if (
          this.useDirectCall &&
          (error.message?.includes('CORS') || 
           error.message?.includes('Network Error') ||
           error.code === 'ERR_NETWORK')
        ) {
          console.warn('[Template API] CORS error detected, falling back to proxy route');
          this.useDirectCall = false;
          this.api = this.proxyApi;
          
          // Retry the request with proxy
          if (error.config) {
            const proxyConfig = {
              ...error.config,
              baseURL: this.baseURL,
            };
            try {
              return await this.proxyApi.request(proxyConfig);
            } catch (retryError) {
              return Promise.reject(retryError);
            }
          }
        }
        
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          console.warn('[Template API] 401 Unauthorized - Token may be invalid or expired');
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

  // ==================== TEMPLATES ====================

  /**
   * List all templates
   * GET /api/templates
   * Query params: org_id, limit
   */
  async getTemplates(params?: { org_id?: string; limit?: number }): Promise<CrmApiListResponse<CrmTemplate>> {
    try {
      const response = await this.api.get<any>('', { params }) as unknown as any;
      
      // Handle null/undefined response
      if (response === null || response === undefined) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Template API returned null/undefined - treating as empty array');
        }
        return [];
      }
      
      // Handle falsy values
      if (!response) {
        return [];
      }
      
      // According to Swagger, GET /templates may return a single Template object or array
      // Handle both cases and normalize to array
      
      // Check if response has a data property (wrapped response)
      let data = response;
      if (typeof response === 'object' && response !== null && 'data' in response && !('id' in response)) {
        data = response.data;
      }
      
      // API may return single object or array, normalize to array
      if (Array.isArray(data)) {
        return data.filter((item): item is CrmTemplate => {
          return item !== null && 
                 item !== undefined && 
                 typeof item === 'object' &&
                 !!item.id;
        });
      }
      
      // Single Template object with id (Swagger shows it returns single object)
      if (typeof data === 'object' && data !== null && data.id && data.name) {
        return [data];
      }
      
      // Object without id - might be empty object or error response
      if (typeof data === 'object' && data !== null && Object.keys(data).length === 0) {
        return [];
      }
      
      // Invalid response format
      console.warn('Template API returned unexpected response format:', {
        type: typeof data,
        value: data,
        isArray: Array.isArray(data),
        hasId: data?.id,
        keys: typeof data === 'object' ? Object.keys(data) : 'N/A',
      });
      
      return [];
    } catch (error) {
      console.error('Error in getTemplates:', error);
      throw error;
    }
  }

  /**
   * Get template by ID
   * GET /api/templates/{id}
   */
  async getTemplate(id: number | string): Promise<CrmApiSingleResponse<CrmTemplate>> {
    return this.api.get<CrmTemplate>(`/${id}`) as unknown as CrmTemplate;
  }

  /**
   * Create template
   * POST /api/templates
   */
  async createTemplate(data: CrmTemplateRequest): Promise<CrmApiSingleResponse<CrmTemplate>> {
    return this.api.post<CrmTemplate>('', data) as unknown as CrmTemplate;
  }

  /**
   * Update template
   * PUT /api/templates/{id}
   */
  async updateTemplate(id: number | string, data: CrmTemplateRequest): Promise<CrmApiSingleResponse<CrmTemplate>> {
    return this.api.put<CrmTemplate>(`/${id}`, data) as unknown as CrmTemplate;
  }

  /**
   * Delete template
   * DELETE /api/templates/{id}
   */
  async deleteTemplate(id: number | string): Promise<CrmApiStringResponse> {
    return this.api.delete<CrmApiStringResponse>(`/${id}`) as unknown as CrmApiStringResponse;
  }
}

// Export singleton instance
export const templateApi = new TemplateApiService();

