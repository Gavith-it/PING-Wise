/**
 * Team API Service
 * 
 * Handles all Team API interactions.
 * Base URL: https://pw-crm-gateway-1.onrender.com/teams
 * 
 * IMPORTANT: Set environment variable:
 * NEXT_PUBLIC_CRM_API_BASE_URL=https://pw-crm-gateway-1.onrender.com
 * 
 * ARCHITECTURE:
 * - Direct backend API calls only
 * - No proxy routes - connects directly to backend API
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { CrmTeam, CrmTeamRequest, CrmApiListResponse, CrmApiSingleResponse, CrmApiStringResponse } from '@/types/crmApi';

class TeamApiService {
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
            console.log(`[Team API] Request ${config.method?.toUpperCase()} ${config.url} - Token: ${token.substring(0, 20)}...`);
          }
        } else {
          console.warn(`[Team API] Request ${config.method?.toUpperCase()} ${config.url} - No token found!`);
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
          console.log(`[Team API] Response ${response.config.method?.toUpperCase()} ${response.config.url}:`, {
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
          console.error('[Team API] Request error:', {
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
          console.warn('[Team API] 401 Unauthorized - Token may be invalid or expired');
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

  // ==================== TEAMS ====================

  /**
   * List all teams
   * GET /teams
   * No parameters required (according to Swagger)
   */
  async getTeams(): Promise<CrmApiListResponse<CrmTeam>> {
    try {
      const response = await this.api.get<any>('/teams') as unknown as any;
      
      // Handle null/undefined response
      if (response === null || response === undefined) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Team API returned null/undefined - treating as empty array');
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
        return data.filter((item): item is CrmTeam => {
          return item !== null && 
                 item !== undefined && 
                 typeof item === 'object' &&
                 !!item.id;
        });
      }
      
      // Single Team object with id
      if (typeof data === 'object' && data !== null && data.id && data.name) {
        return [data];
      }
      
      // Object without id - might be empty object or error response
      if (typeof data === 'object' && data !== null && Object.keys(data).length === 0) {
        return [];
      }
      
      // Invalid response format
      console.warn('Team API returned unexpected response format:', { type: typeof response, value: response });
      return [];
    } catch (error) {
      console.error('Error in getTeams:', error);
      throw error;
    }
  }

  /**
   * Get a single team by ID
   * GET /teams/{id}
   */
  async getTeam(id: number | string): Promise<CrmApiSingleResponse<CrmTeam>> {
    const response = await this.api.get<any>(`/teams/${id}`) as unknown as any;
    return response.data || response; // Handle wrapped or direct response
  }

  /**
   * Create a new team
   * POST /teams
   */
  async createTeam(data: CrmTeamRequest): Promise<CrmApiSingleResponse<CrmTeam>> {
    const response = await this.api.post<any>('/teams', data) as unknown as any;
    return response.data || response; // Handle wrapped or direct response
  }

  /**
   * Update an existing team
   * PUT /teams/{id}
   */
  async updateTeam(id: number | string, data: CrmTeamRequest): Promise<CrmApiSingleResponse<CrmTeam>> {
    const response = await this.api.put<any>(`/teams/${id}`, data) as unknown as any;
    return response.data || response; // Handle wrapped or direct response
  }

  /**
   * Delete a team by ID
   * DELETE /teams/{id}
   * Returns a string according to Swagger
   */
  async deleteTeam(id: number | string): Promise<CrmApiStringResponse> {
    const response = await this.api.delete<any>(`/teams/${id}`) as unknown as any;
    return response.data || response; // Handle wrapped or direct response
  }

  /**
   * Get team dashboard metrics
   * GET /teams/dashboard
   * Returns team daily dashboard metrics
   */
  async getTeamDashboard(): Promise<any> {
    try {
      const response = await this.api.get<any>('/teams/dashboard') as unknown as any;
      
      // Handle null/undefined response
      if (response === null || response === undefined) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Team Dashboard API returned null/undefined - returning empty object');
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
      console.error('Error in getTeamDashboard:', error);
      throw error;
    }
  }
}

export const teamApi = new TeamApiService();

