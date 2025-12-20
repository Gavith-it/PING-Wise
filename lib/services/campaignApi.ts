/**
 * Campaign API Service
 * 
 * Service for interacting with the Campaign API
 * Base URL: https://pw-crm-gateway-1.onrender.com/campaigns
 * 
 * Uses Next.js API proxy routes to avoid CORS issues
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  CrmCampaign,
  CrmCampaignRequest,
  CrmApiListResponse,
  CrmApiSingleResponse,
} from '@/types/crmApi';

class CampaignApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Use Next.js API routes as proxy to avoid CORS issues
    this.baseURL = '/api/campaigns';

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
            console.log(`[Campaign API] Request ${config.method?.toUpperCase()} ${config.url} - Token: ${token.substring(0, 20)}...`);
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[Campaign API] Request ${config.method?.toUpperCase()} ${config.url} - No token found!`);
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
          console.log(`[Campaign API] Response ${response.config.method?.toUpperCase()} ${response.config.url}:`, {
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
          console.error('[Campaign API] Request error:', {
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
          console.warn('[Campaign API] 401 Unauthorized - Token may be invalid or expired');
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

  // ==================== CAMPAIGNS ====================

  /**
   * List all campaigns
   * GET /api/campaigns
   * Query params: org_id, limit
   */
  async getCampaigns(params?: { org_id?: string; limit?: number }): Promise<CrmApiListResponse<CrmCampaign>> {
    try {
      const response = await this.api.get<any>('', { params }) as unknown as any;
      
      // Handle null/undefined response
      if (response === null || response === undefined) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Campaign API returned null/undefined - treating as empty array');
        }
        return [];
      }
      
      // Handle falsy values
      if (!response) {
        return [];
      }
      
      // Check if response has a data property (wrapped response)
      let data = response;
      if (typeof response === 'object' && response !== null && 'data' in response && !response.id) {
        data = response.data;
      }
      
      // API may return single object or array, normalize to array
      if (Array.isArray(data)) {
        return data.filter((item): item is CrmCampaign => {
          return item !== null && 
                 item !== undefined && 
                 typeof item === 'object' &&
                 !!item.id;
        });
      }
      
      // Single object with id
      if (typeof data === 'object' && data !== null && data.id) {
        return [data];
      }
      
      // Object without id - might be empty object or error response
      if (typeof data === 'object' && data !== null && Object.keys(data).length === 0) {
        return [];
      }
      
      // Invalid response format
      console.warn('Campaign API returned unexpected response format:', {
        type: typeof data,
        value: data,
        isArray: Array.isArray(data),
        hasId: data?.id,
        keys: typeof data === 'object' ? Object.keys(data) : 'N/A',
      });
      
      return [];
    } catch (error) {
      console.error('Error in getCampaigns:', error);
      throw error;
    }
  }

  /**
   * Get campaign by ID
   * GET /api/campaigns/{id}
   */
  async getCampaign(id: number | string): Promise<CrmApiSingleResponse<CrmCampaign>> {
    return this.api.get<CrmCampaign>(`/${id}`) as unknown as CrmCampaign;
  }

  /**
   * Create campaign
   * POST /api/campaigns
   */
  async createCampaign(data: CrmCampaignRequest): Promise<CrmApiSingleResponse<CrmCampaign>> {
    return this.api.post<CrmCampaign>('', data) as unknown as CrmCampaign;
  }
}

// Export singleton instance
export const campaignApi = new CampaignApiService();

