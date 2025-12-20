/**
 * CRM API Service
 * 
 * Service for interacting with the CRM Gateway API
 * Base URL: https://pw-crm-gateway-1.onrender.com
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
  CrmLoginRequest,
  CrmTokenResponse,
  CrmCustomer,
  CrmCustomerRequest,
  CrmTeam,
  CrmTeamRequest,
  CrmUser,
  CrmUserRequest,
  CrmTemplate,
  CrmTemplateRequest,
  CrmAppointment,
  CrmAppointmentRequest,
  CrmDailyReport,
  CrmApiListResponse,
  CrmApiSingleResponse,
  CrmApiStringResponse,
} from '@/types/crmApi';

class CrmApiService {
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
    this.baseURL = '/api/crm';
    
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
            console.log(`[CRM API] Request ${config.method?.toUpperCase()} ${config.url} - Token: ${token.substring(0, 20)}...`);
          }
        } else {
          console.warn(`[CRM API] Request ${config.method?.toUpperCase()} ${config.url} - No token found!`);
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
          console.log(`[CRM API] Response ${response.config.method?.toUpperCase()} ${response.config.url}:`, {
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
          console.error('[CRM API] Request error:', {
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
          console.warn('[CRM API] 401 Unauthorized - Token may be invalid or expired');
          
          // Don't redirect immediately for customer operations (create/update)
          // This allows error messages to be shown in modals first
          const url = error.config?.url || '';
          const isCustomerOperation = url.includes('/customers') && 
            (error.config?.method === 'POST' || error.config?.method === 'PUT');
          
          if (!isCustomerOperation) {
            // For non-customer operations, remove token and redirect
            this.removeToken();
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
              setTimeout(() => {
                if (!window.location.pathname.includes('/login')) {
                  window.location.href = '/login';
                }
              }, 100);
            }
          } else {
            // For customer operations, just remove token but don't redirect
            // Let the modal/component handle the error and show appropriate message
            // The user can manually navigate to login if needed
            this.removeToken();
            console.warn('[CRM API] 401 on customer operation - error will be handled by component');
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
          console.warn('[CRM API] CORS error detected, falling back to proxy');
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

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('crm_access_token', token);
      sessionStorage.setItem('access_token', token);
      // Also store in 'token' for AuthContext compatibility
      sessionStorage.setItem('token', token);
    }
  }

  removeToken(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('crm_access_token');
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('token');
    }
  }

  // ==================== AUTHENTICATION ====================

  /**
   * Login and obtain JWT token
   * POST /login (direct) or /api/crm/login (proxy fallback)
   */
  async login(credentials: CrmLoginRequest): Promise<CrmTokenResponse> {
    const isBrowser = typeof window !== 'undefined';
    
    // In server: always use direct call
    if (!isBrowser) {
      const apiResponse = await this.directApi.post<CrmTokenResponse>('/login', credentials);
      return apiResponse.data;
    }
    
    // In browser: try direct call first, fallback to proxy
    try {
      if (this.useDirectCall) {
        try {
          const apiResponse = await this.directApi.post<CrmTokenResponse>('/login', credentials);
          const response = apiResponse.data;
          // Store token automatically
          if (response.access_token) {
            this.setToken(response.access_token);
          }
          return response;
        } catch (error: any) {
          // If CORS error, fallback to proxy
          if (this.isCorsError(error as AxiosError)) {
            console.warn('[CRM API] CORS error on login, falling back to proxy');
            this.useDirectCall = false;
            const proxyResponse = await this.proxyApi.post<CrmTokenResponse>('/login', credentials);
            const response = proxyResponse.data;
            // Store token automatically
            if (response.access_token) {
              this.setToken(response.access_token);
            }
            return response;
          }
          throw error;
        }
      } else {
        // Already using proxy
        const proxyResponse = await this.proxyApi.post<CrmTokenResponse>('/login', credentials);
        const response = proxyResponse.data;
        // Store token automatically
        if (response.access_token) {
          this.setToken(response.access_token);
        }
        return response;
      }
    } catch (error: any) {
      // Final fallback: try proxy if direct failed for any reason (non-CORS error)
      if (this.useDirectCall) {
        console.warn('[CRM API] Login failed, trying proxy fallback');
        this.useDirectCall = false;
        try {
          const proxyResponse = await this.proxyApi.post<CrmTokenResponse>('/login', credentials);
          const response = proxyResponse.data;
          // Store token automatically
          if (response.access_token) {
            this.setToken(response.access_token);
          }
          return response;
        } catch (proxyError) {
          throw proxyError;
        }
      }
      throw error;
    }
  }

  /**
   * Validate token
   * POST /checkAuth (direct) or /api/crm/checkAuth (proxy fallback)
   */
  async checkAuth(): Promise<CrmApiStringResponse> {
    const isBrowser = typeof window !== 'undefined';
    
    // In server: always use direct call
    if (!isBrowser) {
      const token = this.getToken();
      const directApi = axios.create({
        baseURL: this.directBaseURL,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      const response = await directApi.post('/checkAuth');
      return response.data as CrmApiStringResponse;
    }
    
    // In browser: try direct call first, fallback to proxy (token sent via interceptor)
    return this.makeRequestWithFallback((api) => 
      api.post<CrmApiStringResponse>('/checkAuth')
    ) as unknown as CrmApiStringResponse;
  }

  /**
   * Logout (removes token locally)
   */
  logout(): void {
    this.removeToken();
  }

  // ==================== CUSTOMERS ====================

  /**
   * List all customers
   * GET /customers
   */
  async getCustomers(): Promise<CrmApiListResponse<CrmCustomer>> {
    try {
      const response = await this.makeRequestWithFallback((api) => 
        api.get<any>('/customers')
      ) as unknown as any;
      
      // Log response for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('CRM API getCustomers response:', response);
        console.log('Response type:', typeof response);
        console.log('Is array?', Array.isArray(response));
      }
      
      // Handle null/undefined response - API might return null when no customers exist
      // Convert to empty array for consistency
      if (response === null || response === undefined) {
        if (process.env.NODE_ENV === 'development') {
          console.log('API returned null/undefined - treating as empty array');
        }
        return [];
      }
      
      // Handle falsy values
      if (!response) {
        if (process.env.NODE_ENV === 'development') {
          console.log('API returned falsy value - treating as empty array');
        }
        return [];
      }
      
      // API may return single object or array, normalize to array
      if (Array.isArray(response)) {
        // Filter out null/undefined values and invalid items
        const validCustomers = response.filter((item): item is CrmCustomer => {
          return item !== null && 
                 item !== undefined && 
                 typeof item === 'object' &&
                 !!item.id;
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Filtered ${validCustomers.length} valid customers from ${response.length} items`);
        }
        
        return validCustomers;
      }
      
      // Single object
      if (typeof response === 'object' && response !== null && response.id) {
        return [response];
      }
      
      // Invalid response format
      console.warn('CRM API returned unexpected response format:', {
        type: typeof response,
        value: response,
        isArray: Array.isArray(response),
        isObject: typeof response === 'object',
        isNull: response === null
      });
      
      // If it's null or undefined at this point, return empty array
      if (response === null || response === undefined) {
        return [];
      }
      
      return [];
    } catch (error) {
      console.error('Error in getCustomers:', error);
      throw error; // Re-throw to let caller handle it
    }
  }

  /**
   * Get customer by ID
   * GET /customers/{id}
   */
  async getCustomer(id: number | string): Promise<CrmApiSingleResponse<CrmCustomer>> {
    return this.makeRequestWithFallback((api) => 
      api.get<CrmCustomer>(`/customers/${id}`)
    ) as unknown as CrmCustomer;
  }

  /**
   * Create customer
   * POST /customers
   */
  async createCustomer(data: CrmCustomerRequest): Promise<CrmApiSingleResponse<CrmCustomer>> {
    return this.makeRequestWithFallback((api) => 
      api.post<CrmCustomer>('/customers', data)
    ) as unknown as CrmCustomer;
  }

  /**
   * Update customer
   * PUT /customers/{id}
   */
  async updateCustomer(id: number | string, data: CrmCustomerRequest): Promise<CrmApiSingleResponse<CrmCustomer>> {
    return this.makeRequestWithFallback((api) => 
      api.put<CrmCustomer>(`/customers/${id}`, data)
    ) as unknown as CrmCustomer;
  }

  /**
   * Delete customer
   * DELETE /customers/{id}
   */
  async deleteCustomer(id: number | string): Promise<CrmApiStringResponse> {
    return this.makeRequestWithFallback((api) => 
      api.delete<CrmApiStringResponse>(`/customers/${id}`)
    ) as unknown as CrmApiStringResponse;
  }

  // ==================== TEAMS ====================

  /**
   * List all teams
   * GET /teams
   */
  async getTeams(): Promise<CrmApiListResponse<CrmTeam>> {
    const response = await this.makeRequestWithFallback((api) => 
      api.get<CrmTeam | CrmTeam[]>('/teams')
    ) as unknown as CrmTeam | CrmTeam[];
    if (Array.isArray(response)) {
      return response;
    }
    return [response];
  }

  /**
   * Get team by ID
   * GET /teams/{id}
   */
  async getTeam(id: number | string): Promise<CrmApiSingleResponse<CrmTeam>> {
    return this.makeRequestWithFallback((api) => 
      api.get<CrmTeam>(`/teams/${id}`)
    ) as unknown as CrmTeam;
  }

  /**
   * Create team
   * POST /teams
   */
  async createTeam(data: CrmTeamRequest): Promise<CrmApiSingleResponse<CrmTeam>> {
    return this.makeRequestWithFallback((api) => 
      api.post<CrmTeam>('/teams', data)
    ) as unknown as CrmTeam;
  }

  /**
   * Update team
   * PUT /teams/{id}
   */
  async updateTeam(id: number | string, data: CrmTeamRequest): Promise<CrmApiSingleResponse<CrmTeam>> {
    return this.makeRequestWithFallback((api) => 
      api.put<CrmTeam>(`/teams/${id}`, data)
    ) as unknown as CrmTeam;
  }

  /**
   * Delete team
   * DELETE /teams/{id}
   */
  async deleteTeam(id: number | string): Promise<CrmApiStringResponse> {
    return this.makeRequestWithFallback((api) => 
      api.delete<CrmApiStringResponse>(`/teams/${id}`)
    ) as unknown as CrmApiStringResponse;
  }

  // ==================== USERS ====================

  /**
   * List all users
   * GET /users
   */
  async getUsers(): Promise<CrmApiListResponse<CrmUser>> {
    const response = await this.makeRequestWithFallback((api) => 
      api.get<CrmUser | CrmUser[]>('/users')
    ) as unknown as CrmUser | CrmUser[];
    if (Array.isArray(response)) {
      return response;
    }
    return [response];
  }

  /**
   * Get user by ID
   * GET /users/{id}
   */
  async getUser(id: number | string): Promise<CrmApiSingleResponse<CrmUser>> {
    return this.makeRequestWithFallback((api) => 
      api.get<CrmUser>(`/users/${id}`)
    ) as unknown as CrmUser;
  }

  /**
   * Create user
   * POST /users
   */
  async createUser(data: CrmUserRequest): Promise<CrmApiSingleResponse<CrmUser>> {
    return this.makeRequestWithFallback((api) => 
      api.post<CrmUser>('/users', data)
    ) as unknown as CrmUser;
  }

  /**
   * Update user
   * PUT /users/{id}
   */
  async updateUser(id: number | string, data: CrmUserRequest): Promise<CrmApiSingleResponse<CrmUser>> {
    return this.makeRequestWithFallback((api) => 
      api.put<CrmUser>(`/users/${id}`, data)
    ) as unknown as CrmUser;
  }

  /**
   * Delete user
   * DELETE /users/{id}
   */
  async deleteUser(id: number | string): Promise<CrmApiStringResponse> {
    return this.makeRequestWithFallback((api) => 
      api.delete<CrmApiStringResponse>(`/users/${id}`)
    ) as unknown as CrmApiStringResponse;
  }

  // ==================== TEMPLATES ====================

  /**
   * List templates
   * GET /templates?org_id={org_id}&limit={limit}
   */
  async getTemplates(orgId?: string, limit?: number): Promise<CrmApiListResponse<CrmTemplate>> {
    const params: any = {};
    if (orgId) params.org_id = orgId;
    if (limit) params.limit = limit;
    
    const response = await this.makeRequestWithFallback((api) => 
      api.get<CrmTemplate | CrmTemplate[]>('/templates', { params })
    ) as unknown as CrmTemplate | CrmTemplate[];
    if (Array.isArray(response)) {
      return response;
    }
    return [response];
  }

  /**
   * Get template by ID
   * GET /templates/{id}
   */
  async getTemplate(id: number | string): Promise<CrmApiSingleResponse<CrmTemplate>> {
    return this.makeRequestWithFallback((api) => 
      api.get<CrmTemplate>(`/templates/${id}`)
    ) as unknown as CrmTemplate;
  }

  /**
   * Create template
   * POST /templates
   */
  async createTemplate(data: CrmTemplateRequest): Promise<CrmApiSingleResponse<CrmTemplate>> {
    return this.makeRequestWithFallback((api) => 
      api.post<CrmTemplate>('/templates', data)
    ) as unknown as CrmTemplate;
  }

  /**
   * Update template
   * PUT /templates/{id}
   */
  async updateTemplate(id: number | string, data: CrmTemplateRequest): Promise<CrmApiSingleResponse<CrmTemplate>> {
    return this.makeRequestWithFallback((api) => 
      api.put<CrmTemplate>(`/templates/${id}`, data)
    ) as unknown as CrmTemplate;
  }

  /**
   * Delete template
   * DELETE /templates/{id}
   */
  async deleteTemplate(id: number | string): Promise<CrmApiStringResponse> {
    return this.makeRequestWithFallback((api) => 
      api.delete<CrmApiStringResponse>(`/templates/${id}`)
    ) as unknown as CrmApiStringResponse;
  }

  // ==================== REPORTS ====================

  /**
   * Get daily dashboard metrics
   * GET /reports/daily?date={YYYY-MM-DD}
   */
  async getDailyReport(date?: string): Promise<CrmDailyReport> {
    const params = date ? { date } : {};
    return this.makeRequestWithFallback((api) => 
      api.get<CrmDailyReport>('/reports/daily', { params })
    ) as unknown as CrmDailyReport;
  }
}

// Export singleton instance
export const crmApi = new CrmApiService();
export default crmApi;

