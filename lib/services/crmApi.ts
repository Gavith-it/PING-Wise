/**
 * CRM API Service
 * 
 * Service for interacting with the CRM Gateway API
 * Base URL: https://pw-crm-gateway-1.onrender.com
 * 
 * IMPORTANT: Set environment variable:
 * NEXT_PUBLIC_CRM_API_BASE_URL=https://pw-crm-gateway-1.onrender.com
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
  private baseURL: string;

  constructor() {
    // Use Next.js API routes as proxy to avoid CORS issues
    // The proxy routes call the CRM API server-side
    const isBrowser = typeof window !== 'undefined';
    
    if (isBrowser) {
      // In browser: use Next.js API proxy routes
      this.baseURL = '/api/crm';
    } else {
      // In server: call CRM API directly
      this.baseURL = 
        process.env.NEXT_PUBLIC_CRM_API_BASE_URL || 
        'https://pw-crm-gateway-1.onrender.com';
    }

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
        if (token) {
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
    this.api.interceptors.response.use(
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

  // ==================== TOKEN MANAGEMENT ====================

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('crm_access_token') || sessionStorage.getItem('access_token');
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
   * POST /api/crm/login (browser) or /login (server)
   */
  async login(credentials: CrmLoginRequest): Promise<CrmTokenResponse> {
    const isBrowser = typeof window !== 'undefined';
    let response: any;
    
    if (isBrowser) {
      // In browser: call Next.js proxy route (avoids CORS)
      response = await this.api.post<CrmTokenResponse>('/login', credentials) as unknown as CrmTokenResponse;
    } else {
      // In server: call CRM API directly
      const directApi = axios.create({
        baseURL: process.env.NEXT_PUBLIC_CRM_API_BASE_URL || 'https://pw-crm-gateway-1.onrender.com',
        headers: { 'Content-Type': 'application/json' },
      });
      const apiResponse = await directApi.post<CrmTokenResponse>('/login', credentials);
      response = apiResponse.data;
    }
    
    // Store token automatically (only in browser)
    if (response.access_token && isBrowser) {
      this.setToken(response.access_token);
    }
    
    return response;
  }

  /**
   * Validate token
   * POST /api/crm/checkAuth (browser) or /checkAuth (server)
   */
  async checkAuth(): Promise<CrmApiStringResponse> {
    const isBrowser = typeof window !== 'undefined';
    
    if (isBrowser) {
      // In browser: call Next.js proxy route (token will be sent via interceptor)
      return this.api.post<CrmApiStringResponse>('/checkAuth') as unknown as CrmApiStringResponse;
    } else {
      // In server: call CRM API directly
      const token = this.getToken();
      const directApi = axios.create({
        baseURL: process.env.NEXT_PUBLIC_CRM_API_BASE_URL || 'https://pw-crm-gateway-1.onrender.com',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      const response = await directApi.post('/checkAuth');
      return response.data as CrmApiStringResponse;
    }
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
      const response = await this.api.get<any>('/customers') as unknown as any;
      
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
    return this.api.get<CrmCustomer>(`/customers/${id}`) as unknown as CrmCustomer;
  }

  /**
   * Create customer
   * POST /customers
   */
  async createCustomer(data: CrmCustomerRequest): Promise<CrmApiSingleResponse<CrmCustomer>> {
    return this.api.post<CrmCustomer>('/customers', data) as unknown as CrmCustomer;
  }

  /**
   * Update customer
   * PUT /customers/{id}
   */
  async updateCustomer(id: number | string, data: CrmCustomerRequest): Promise<CrmApiSingleResponse<CrmCustomer>> {
    return this.api.put<CrmCustomer>(`/customers/${id}`, data) as unknown as CrmCustomer;
  }

  /**
   * Delete customer
   * DELETE /customers/{id}
   */
  async deleteCustomer(id: number | string): Promise<CrmApiStringResponse> {
    return this.api.delete<CrmApiStringResponse>(`/customers/${id}`) as unknown as CrmApiStringResponse;
  }

  // ==================== TEAMS ====================

  /**
   * List all teams
   * GET /teams
   */
  async getTeams(): Promise<CrmApiListResponse<CrmTeam>> {
    const response = await this.api.get<CrmTeam | CrmTeam[]>('/teams') as unknown as CrmTeam | CrmTeam[];
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
    return this.api.get<CrmTeam>(`/teams/${id}`) as unknown as CrmTeam;
  }

  /**
   * Create team
   * POST /teams
   */
  async createTeam(data: CrmTeamRequest): Promise<CrmApiSingleResponse<CrmTeam>> {
    return this.api.post<CrmTeam>('/teams', data) as unknown as CrmTeam;
  }

  /**
   * Update team
   * PUT /teams/{id}
   */
  async updateTeam(id: number | string, data: CrmTeamRequest): Promise<CrmApiSingleResponse<CrmTeam>> {
    return this.api.put<CrmTeam>(`/teams/${id}`, data) as unknown as CrmTeam;
  }

  /**
   * Delete team
   * DELETE /teams/{id}
   */
  async deleteTeam(id: number | string): Promise<CrmApiStringResponse> {
    return this.api.delete<CrmApiStringResponse>(`/teams/${id}`) as unknown as CrmApiStringResponse;
  }

  // ==================== USERS ====================

  /**
   * List all users
   * GET /users
   */
  async getUsers(): Promise<CrmApiListResponse<CrmUser>> {
    const response = await this.api.get<CrmUser | CrmUser[]>('/users') as unknown as CrmUser | CrmUser[];
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
    return this.api.get<CrmUser>(`/users/${id}`) as unknown as CrmUser;
  }

  /**
   * Create user
   * POST /users
   */
  async createUser(data: CrmUserRequest): Promise<CrmApiSingleResponse<CrmUser>> {
    return this.api.post<CrmUser>('/users', data) as unknown as CrmUser;
  }

  /**
   * Update user
   * PUT /users/{id}
   */
  async updateUser(id: number | string, data: CrmUserRequest): Promise<CrmApiSingleResponse<CrmUser>> {
    return this.api.put<CrmUser>(`/users/${id}`, data) as unknown as CrmUser;
  }

  /**
   * Delete user
   * DELETE /users/{id}
   */
  async deleteUser(id: number | string): Promise<CrmApiStringResponse> {
    return this.api.delete<CrmApiStringResponse>(`/users/${id}`) as unknown as CrmApiStringResponse;
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
    
    const response = await this.api.get<CrmTemplate | CrmTemplate[]>('/templates', { params }) as unknown as CrmTemplate | CrmTemplate[];
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
    return this.api.get<CrmTemplate>(`/templates/${id}`) as unknown as CrmTemplate;
  }

  /**
   * Create template
   * POST /templates
   */
  async createTemplate(data: CrmTemplateRequest): Promise<CrmApiSingleResponse<CrmTemplate>> {
    return this.api.post<CrmTemplate>('/templates', data) as unknown as CrmTemplate;
  }

  /**
   * Update template
   * PUT /templates/{id}
   */
  async updateTemplate(id: number | string, data: CrmTemplateRequest): Promise<CrmApiSingleResponse<CrmTemplate>> {
    return this.api.put<CrmTemplate>(`/templates/${id}`, data) as unknown as CrmTemplate;
  }

  /**
   * Delete template
   * DELETE /templates/{id}
   */
  async deleteTemplate(id: number | string): Promise<CrmApiStringResponse> {
    return this.api.delete<CrmApiStringResponse>(`/templates/${id}`) as unknown as CrmApiStringResponse;
  }

  // ==================== REPORTS ====================

  /**
   * Get daily dashboard metrics
   * GET /reports/daily?date={YYYY-MM-DD}
   */
  async getDailyReport(date?: string): Promise<CrmDailyReport> {
    const params = date ? { date } : {};
    return this.api.get<CrmDailyReport>('/reports/daily', { params }) as unknown as CrmDailyReport;
  }
}

// Export singleton instance
export const crmApi = new CrmApiService();
export default crmApi;

