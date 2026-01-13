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
 * - Direct backend API calls only
 * - No proxy routes - connects directly to backend API
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
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
        }
        
        // Always log DELETE requests with full details
        if (config.method?.toUpperCase() === 'DELETE') {
          const fullUrl = config.baseURL ? `${config.baseURL}${config.url}` : config.url;
          console.log('========================================');
          console.log('[CRM API] DELETE REQUEST INTERCEPTOR');
          console.log('[CRM API] Method:', config.method?.toUpperCase());
          console.log('[CRM API] URL Path:', config.url);
          console.log('[CRM API] Base URL:', config.baseURL);
          console.log('[CRM API] Full URL:', fullUrl);
          console.log('[CRM API] Has Token:', !!token);
          console.log('========================================');
        }
        
        // Log token in development (only first few chars for security)
        if (process.env.NODE_ENV === 'development') {
          console.log(`[CRM API] Request ${config.method?.toUpperCase()} ${config.url} - Token: ${token ? token.substring(0, 20) + '...' : 'No token'}`);
        } else if (!token) {
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
        // Always log DELETE responses
        if (response.config.method?.toUpperCase() === 'DELETE') {
          const fullUrl = response.config.baseURL ? `${response.config.baseURL}${response.config.url}` : response.config.url;
          console.log('========================================');
          console.log('[CRM API] DELETE RESPONSE INTERCEPTOR');
          console.log('[CRM API] Status:', response.status);
          console.log('[CRM API] Status Text:', response.statusText);
          console.log('[CRM API] URL:', fullUrl);
          console.log('[CRM API] Response Data:', response.data);
          console.log('[CRM API] DELETE SUCCESSFUL!');
          console.log('========================================');
        }
        
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


  // ==================== TOKEN MANAGEMENT ====================

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    // Check both localStorage (for "remember me") and sessionStorage
    // Priority: localStorage token > sessionStorage token > localStorage access_token > sessionStorage access_token
    return localStorage.getItem('token') ||
           sessionStorage.getItem('token') ||
           localStorage.getItem('access_token') ||
           sessionStorage.getItem('access_token');
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      // Store in both keys for compatibility
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('access_token', token);
    }
  }

  removeToken(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('access_token');
    }
  }

  // ==================== AUTHENTICATION ====================
  // Note: Login is handled by AuthContext
  // This service only handles CRM data operations, not authentication

  /**
   * Validate token
   * POST /checkAuth
   */
  async checkAuth(): Promise<CrmApiStringResponse> {
    return this.api.post<CrmApiStringResponse>('/checkAuth') as unknown as CrmApiStringResponse;
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
   * Patch customer (partial update)
   * PATCH /customers/{id}
   */
  async patchCustomer(id: number | string, data: Partial<CrmCustomerRequest>): Promise<CrmApiSingleResponse<CrmCustomer>> {
    return this.api.patch<CrmCustomer>(`/customers/${id}`, data) as unknown as CrmCustomer;
  }

  /**
   * Delete customer
   * DELETE /customers/{id}
   */
  async deleteCustomer(id: number | string): Promise<CrmApiStringResponse> {
    // Ensure ID is properly formatted (remove any whitespace, convert to string for URL)
    const customerId = String(id).trim();
    
    if (!customerId || customerId === 'undefined' || customerId === 'null') {
      throw new Error('Invalid customer ID provided for deletion');
    }
    
    // Construct the full URL path
    const deletePath = `/customers/${customerId}`;
    const fullUrl = `${this.baseURL}${deletePath}`;
    
    // Log the delete attempt with full details - VERY VISIBLE
    console.log('');
    console.log('🚨🚨🚨 DELETE API CALL STARTING 🚨🚨🚨');
    console.log('========================================');
    console.log('📍 DELETE /customers/{id}');
    console.log('📍 Customer ID:', customerId);
    console.log('📍 Delete Path:', deletePath);
    console.log('📍 Full URL:', fullUrl);
    console.log('📍 Method: DELETE');
    console.log('📍 Expected Status: 204 (No Content) - This is CORRECT for DELETE');
    console.log('========================================');
    console.log('');
    
    try {
      console.log('⏳ Sending DELETE request to:', deletePath);
      console.log('⏳ Waiting for API response...');
      const response = await this.api.delete<CrmApiStringResponse>(deletePath);
      
      console.log('');
      console.log('✅✅✅ DELETE API CALL SUCCESSFUL ✅✅✅');
      console.log('========================================');
      console.log('✅ Status: 204 (No Content) - DELETE successful!');
      console.log('✅ Response:', response);
      console.log('✅ Customer deleted from database');
      console.log('========================================');
      console.log('');
      
      return response as unknown as CrmApiStringResponse;
    } catch (error: any) {
      console.error('[CRM API] DELETE request FAILED:', error);
      console.error('[CRM API] Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        url: error?.config?.url,
        method: error?.config?.method,
      });
      console.error('[CRM API] ============================================');
      throw error;
    }
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

