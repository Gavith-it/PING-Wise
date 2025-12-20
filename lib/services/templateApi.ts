/**
 * Template API Service
 * 
 * Service for interacting with the Template API
 * Base URL: https://pw-crm-gateway-1.onrender.com/templates
 * 
 * Uses Next.js API proxy routes to avoid CORS issues
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
  private baseURL: string;

  constructor() {
    // Use Next.js API routes as proxy to avoid CORS issues
    this.baseURL = '/api/templates';

    // Create axios instance
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - Add auth token to all requests
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
          
          // Log token in development (only first few chars for security)
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Template API] Request ${config.method?.toUpperCase()} ${config.url} - Token: ${token.substring(0, 20)}...`);
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[Template API] Request ${config.method?.toUpperCase()} ${config.url} - No token found!`);
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors globally
    this.api.interceptors.response.use(
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
      (error: AxiosError) => {
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
    // Check all possible token keys (same as CRM API for consistency)
    return sessionStorage.getItem('token') || 
           sessionStorage.getItem('crm_access_token') || 
           sessionStorage.getItem('access_token');
  }

  private removeToken(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('crm_access_token');
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

