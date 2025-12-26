/**
 * Campaign API Service
 * 
 * Service for interacting with the Campaign API
 * Base URL: https://pw-crm-gateway-1.onrender.com/campaigns
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
import {
  CrmCampaign,
  CrmCampaignRequest,
  CrmApiListResponse,
  CrmApiSingleResponse,
} from '@/types/crmApi';

class CampaignApiService {
  private api: AxiosInstance;
  private proxyApi: AxiosInstance; // Fallback proxy API
  private directApi: AxiosInstance; // Direct backend API
  private baseURL: string;
  private directBaseURL: string;
  private useDirectCall: boolean = true; // Try direct call first

  constructor() {
    const isBrowser = typeof window !== 'undefined';
    
    // Direct backend URL (from environment variable) - same pattern as CRM API
    this.directBaseURL = 
      process.env.NEXT_PUBLIC_CRM_API_BASE_URL || 
      'https://pw-crm-gateway-1.onrender.com';
    
    // Proxy URL (Next.js API route)
    this.baseURL = '/api/campaigns';
    
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
            console.log(`[Campaign API] Request ${config.method?.toUpperCase()} ${config.url} - Token: ${token.substring(0, 20)}...`);
          }
        } else {
          // Always warn if no token (even in production) as this is critical
          console.warn(`[Campaign API] Request ${config.method?.toUpperCase()} ${config.url} - No token found! This will likely result in 401 error.`);
          if (process.env.NODE_ENV === 'development') {
            console.warn('[Campaign API] Available sessionStorage keys:', Object.keys(sessionStorage));
          }
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
        // NOTE: Don't remove token here if this is a direct call that will fallback to proxy
        // The makeRequestWithFallback will catch this error and retry with proxy
        // Only remove token if proxy also fails (handled in makeRequestWithFallback)
        if (error.response?.status === 401) {
          console.warn('[Campaign API] 401 Unauthorized - Token may be invalid or expired');
          
          // Check if this is a direct API call (will fallback to proxy)
          const isDirectCall = error.config?.baseURL === this.directBaseURL;
          
          if (isDirectCall) {
            // This is a direct call - don't remove token yet, let makeRequestWithFallback handle it
            // The fallback will retry with proxy, and if that also fails, token will be removed
            console.warn('[Campaign API] 401 on direct call - will fallback to proxy');
          } else {
            // This is already a proxy call or final attempt - remove token
            const url = error.config?.url || '';
            const isCampaignOperation = url.includes('/campaigns') && 
              (error.config?.method === 'POST' || error.config?.method === 'PUT' || error.config?.method === 'GET');
            
            if (!isCampaignOperation) {
              // For non-campaign operations, remove token and redirect
              this.removeToken();
              if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                setTimeout(() => {
                  if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                  }
                }, 100);
              }
            } else {
              // For campaign operations, remove token but don't redirect immediately
              // Let the component handle the error and show appropriate message
              this.removeToken();
              console.warn('[Campaign API] 401 on campaign operation (proxy) - error will be handled by component');
            }
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
    const token = sessionStorage.getItem('token') || 
                  sessionStorage.getItem('access_token');
    
    // Log in development if no token found
    if (!token && process.env.NODE_ENV === 'development') {
      console.warn('[Campaign API] No token found in sessionStorage. Keys available:', {
        hasToken: !!sessionStorage.getItem('token'),
        hasAccessToken: !!sessionStorage.getItem('access_token'),
      });
    }
    
    return token;
  }

  private removeToken(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('access_token');
    }
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
   * Make API request with automatic fallback to proxy on CORS error or 401
   * 
   * Why fallback on 401?
   * - The external API might reject the token for direct calls
   * - The proxy route (/api/campaigns) might handle authentication differently
   * - This allows the request to work even if direct call fails with 401
   */
  private async makeRequestWithFallback<T>(
    requestFn: (api: AxiosInstance) => Promise<T>
  ): Promise<T> {
    const isBrowser = typeof window !== 'undefined';
    
    // In server-side, always use direct call
    if (!isBrowser) {
      return requestFn(this.directApi);
    }

    // In browser: try direct call first, fallback to proxy on CORS or 401
    if (this.useDirectCall) {
      try {
        return await requestFn(this.directApi);
      } catch (error: any) {
        const axiosError = error as AxiosError;
        
        // Check if it's a CORS error
        const isCors = this.isCorsError(axiosError);
        
        // Check if it's a 401 Unauthorized error
        // 401 might mean the external API doesn't accept direct calls with this token
        // The proxy route might handle it better
        const is401 = axiosError.response?.status === 401;
        
        if (isCors || is401) {
          const reason = isCors ? 'CORS error' : '401 Unauthorized';
          console.warn(`[Campaign API] ${reason} detected on direct call, falling back to proxy`);
          
          // Only disable direct calls permanently for CORS errors
          // For 401, we might want to try direct again later (token might refresh)
          if (isCors) {
            this.useDirectCall = false; // Disable direct calls for future requests
          }
          
          // Retry with proxy
          try {
            return await requestFn(this.proxyApi);
          } catch (proxyError: any) {
            // If proxy also fails with 401, it's a real authentication issue
            // Remove token now since both direct and proxy failed
            const proxyAxiosError = proxyError as AxiosError;
            if (proxyAxiosError.response?.status === 401) {
              console.error('[Campaign API] Both direct and proxy calls failed with 401 - removing token');
              this.removeToken();
            }
            // Don't fallback again, just throw the error
            console.error('[Campaign API] Proxy also failed:', proxyError);
            throw proxyError;
          }
        }
        
        // If not CORS or 401 error, throw it
        throw error;
      }
    } else {
      // Already using proxy, use it directly
      return requestFn(this.proxyApi);
    }
  }

  // ==================== CAMPAIGNS ====================

  /**
   * List all campaigns
   * GET /campaigns (direct) or /api/campaigns (proxy fallback)
   * Query params: org_id, limit
   */
  async getCampaigns(params?: { org_id?: string; limit?: number }): Promise<CrmApiListResponse<CrmCampaign>> {
    try {
      const response = await this.makeRequestWithFallback((api) => 
        api.get<any>('/campaigns', { params })
      ) as unknown as any;
      
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
   * GET /campaigns/{id} (direct) or /api/campaigns/{id} (proxy fallback)
   */
  async getCampaign(id: number | string): Promise<CrmApiSingleResponse<CrmCampaign>> {
    return this.makeRequestWithFallback((api) => 
      api.get<CrmCampaign>(`/campaigns/${id}`)
    ) as unknown as CrmCampaign;
  }

  /**
   * Create campaign
   * POST /campaigns (direct) or /api/campaigns (proxy fallback)
   */
  async createCampaign(data: CrmCampaignRequest): Promise<CrmApiSingleResponse<CrmCampaign>> {
    return this.makeRequestWithFallback((api) => 
      api.post<CrmCampaign>('/campaigns', data)
    ) as unknown as CrmCampaign;
  }
}

// Export singleton instance
export const campaignApi = new CampaignApiService();

