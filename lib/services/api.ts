/**
 * API Service
 * 
 * Centralized API service for making HTTP requests
 */

import axios from 'axios';
import { logger } from '@/lib/utils/logger';
import { 
  LoginRequest, 
  RegisterRequest, 
  CreatePatientRequest, 
  CreateAppointmentRequest,
  CreateCampaignRequest,
  ApiResponse,
  AuthResponse,
  User,
  Patient,
  Appointment,
  Campaign,
  DashboardStats,
  ActivityData
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Check both localStorage (for "remember me") and sessionStorage
      // Priority: localStorage token > sessionStorage token > localStorage access_token > sessionStorage access_token
      const token = localStorage.getItem('token') ||
                    sessionStorage.getItem('token') ||
                    localStorage.getItem('access_token') ||
                    sessionStorage.getItem('access_token');
      
      if (token && token.trim()) {
        // Ensure headers object exists - important for POST/PUT requests
        if (!config.headers) {
          config.headers = {} as any;
        }
        
        // Set Authorization header - use Bearer token format
        const authHeader = `Bearer ${token.trim()}`;
        
        // Set header using direct assignment (most reliable)
        config.headers['Authorization'] = authHeader;
        // Also set lowercase version for Next.js API routes
        config.headers['authorization'] = authHeader;
        
        // Log the actual headers being sent (for debugging)
        const method = (config.method || 'get').toUpperCase();
        logger.debug(`Token added to ${method} request`, {
          url: config.url,
          method: method,
          hasToken: true,
          tokenPreview: token.substring(0, 20) + '...',
          headersSet: {
            Authorization: config.headers['Authorization'] ? '✓' : '✗',
            authorization: config.headers['authorization'] ? '✓' : '✗'
          }
        });
      } else {
        // Only warn for protected routes that typically require auth
        // Don't warn for public routes like /auth/login, /auth/register, etc.
        const isPublicRoute = config.url?.includes('/auth/login') || 
                              config.url?.includes('/auth/register') ||
                              config.url?.includes('/health');
        
        // Log warning for protected routes without token
        if (!isPublicRoute) {
          const isClient = typeof window !== 'undefined';
          if (isClient) {
            logger.warn('No token found in sessionStorage for request', {
              url: config.url,
              method: config.method,
              hasToken: false
            });
          }
        }
      }
    }
    return config;
  },
      (error) => {
        logger.error('Request interceptor error', error);
        return Promise.reject(error);
      }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle 401 errors - but don't redirect automatically
    // Let the component handle the error and show appropriate message
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const errorMessage = error.response?.data?.message?.toLowerCase() || '';
      const errorData = error.response?.data;
      
      // Check if it's a validation error (has errors array)
      const isValidationError = errorData?.errors && Array.isArray(errorData.errors);
      
      // Check if it's a token/authentication error
      const isAuthError = errorMessage.includes('token') || 
                         errorMessage.includes('unauthorized') ||
                         errorMessage.includes('authentication') ||
                         errorMessage.includes('access denied') ||
                         errorMessage.includes('no token');
      
      // Only clear tokens if it's a clear authentication error, not a validation error
      if (isAuthError && !isValidationError) {
        // Log the error for debugging
        logger.warn('Authentication error detected', {
          message: errorMessage,
          url: error.config?.url,
          method: error.config?.method,
          hasToken: !!sessionStorage.getItem('token'),
          requestHeaders: error.config?.headers
        });
        
        // Don't clear tokens or redirect here - let the component handle it
        // This allows the component to show proper error messages and handle redirects
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (email: string, password: string): Promise<AuthResponse> => {
    return api.post('/auth/login', { email, password });
  },
  register: (userData: RegisterRequest): Promise<AuthResponse> => {
    return api.post('/auth/register', userData);
  },
  getCurrentUser: (): Promise<ApiResponse<User>> => {
    return api.get('/auth/me');
  },
};

export const patientService = {
  getPatients: (params: any = {}): Promise<ApiResponse<Patient[]>> => {
    return api.get('/patients', { params });
  },
  getPatient: (id: string): Promise<ApiResponse<Patient>> => {
    return api.get(`/patients/${id}`);
  },
  createPatient: (patientData: CreatePatientRequest): Promise<ApiResponse<Patient>> => {
    return api.post('/patients', patientData);
  },
  updatePatient: (id: string, patientData: Partial<CreatePatientRequest>): Promise<ApiResponse<Patient>> => {
    return api.put(`/patients/${id}`, patientData);
  },
  deletePatient: (id: string): Promise<ApiResponse> => {
    return api.delete(`/patients/${id}`);
  },
  bulkUploadPatients: (formData: FormData): Promise<ApiResponse<{ successCount: number; errors: any[] }>> => {
    return api.post('/patients/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const appointmentService = {
  getAppointments: (params: any = {}): Promise<ApiResponse<Appointment[]>> => {
    return api.get('/appointments', { params });
  },
  getAppointment: (id: string): Promise<ApiResponse<Appointment>> => {
    return api.get(`/appointments/${id}`);
  },
  createAppointment: (appointmentData: CreateAppointmentRequest): Promise<ApiResponse<Appointment>> => {
    return api.post('/appointments', appointmentData);
  },
  updateAppointment: (id: string, appointmentData: Partial<CreateAppointmentRequest>): Promise<ApiResponse<Appointment>> => {
    return api.put(`/appointments/${id}`, appointmentData);
  },
  cancelAppointment: (id: string): Promise<ApiResponse> => {
    return api.delete(`/appointments/${id}`);
  },
};

export const campaignService = {
  getCampaigns: (params: any = {}): Promise<ApiResponse<Campaign[]>> => {
    return api.get('/campaigns', { params });
  },
  getCampaign: (id: string): Promise<ApiResponse<Campaign>> => {
    return api.get(`/campaigns/${id}`);
  },
  createCampaign: (campaignData: CreateCampaignRequest): Promise<ApiResponse<Campaign>> => {
    return api.post('/campaigns', campaignData);
  },
  updateCampaign: (id: string, campaignData: Partial<CreateCampaignRequest>): Promise<ApiResponse<Campaign>> => {
    return api.put(`/campaigns/${id}`, campaignData);
  },
  sendCampaign: (id: string): Promise<ApiResponse> => {
    return api.post(`/campaigns/${id}/send`);
  },
  deleteCampaign: (id: string): Promise<ApiResponse> => {
    return api.delete(`/campaigns/${id}`);
  },
};

export const teamService = {
  getTeamMembers: (params: any = {}): Promise<ApiResponse<User[]>> => {
    return api.get('/team', { params });
  },
  getTeamMember: (id: string): Promise<ApiResponse<User>> => {
    return api.get(`/team/${id}`);
  },
  createTeamMember: (memberData: RegisterRequest): Promise<ApiResponse<User>> => {
    return api.post('/team', memberData);
  },
  updateTeamMember: (id: string, memberData: Partial<RegisterRequest>): Promise<ApiResponse<User>> => {
    return api.put(`/team/${id}`, memberData);
  },
  deleteTeamMember: (id: string): Promise<ApiResponse> => {
    return api.delete(`/team/${id}`);
  },
};

export const dashboardService = {
  getStats: (): Promise<ApiResponse<DashboardStats>> => {
    return api.get('/dashboard/stats');
  },
  getActivity: (): Promise<ApiResponse<ActivityData>> => {
    return api.get('/dashboard/activity');
  },
  getTodayAppointments: (): Promise<ApiResponse<Appointment[]>> => {
    return api.get('/dashboard/today-appointments');
  },
};

export const walletService = {
  getBalance: (): Promise<ApiResponse<{ balance: number }>> => {
    return api.get('/wallet/balance');
  },
};

export default api;

