/**
 * API Service
 * 
 * Centralized API service for making HTTP requests
 */

import axios from 'axios';
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
      // Migrate from localStorage to sessionStorage (one-time migration)
      if (localStorage.getItem('token')) {
        localStorage.removeItem('token');
      }
      
      const token = sessionStorage.getItem('token');
      if (token && token.trim()) {
        // Ensure headers object exists - important for POST/PUT requests
        // Use axios's proper header setting method
        if (!config.headers) {
          config.headers = {} as any;
        }
        
        // Set Authorization header - axios will handle the case
        const authHeader = `Bearer ${token.trim()}`;
        // Set using both methods to ensure compatibility
        if (config.headers.set) {
          // If headers is a Headers object
          config.headers.set('Authorization', authHeader);
        } else {
          // If headers is a plain object
          config.headers['Authorization'] = authHeader;
          config.headers['authorization'] = authHeader; // lowercase for Next.js
        }
        
        // Log the actual headers being sent (for debugging)
        const method = (config.method || 'get').toUpperCase();
        console.log(`Token added to ${method} request:`, {
          url: config.url,
          method: method,
          hasToken: true,
          tokenPreview: token.substring(0, 20) + '...',
          headersSet: {
            Authorization: config.headers['Authorization'] || config.headers.get?.('Authorization') ? '✓' : '✗',
            authorization: config.headers['authorization'] || config.headers.get?.('authorization') ? '✓' : '✗'
          },
          allHeaders: Object.keys(config.headers)
        });
      } else {
        console.warn('No token found in localStorage for request:', {
          url: config.url,
          method: config.method
        });
      }
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Only redirect to login if it's a true authentication error (not a validation error)
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
      
      // Only redirect if it's a clear authentication error, not a validation error
      // Don't redirect for validation errors (400 with errors array) or other non-auth 401s
      if (isAuthError && !isValidationError) {
        // Clear tokens from both sessionStorage and localStorage
        sessionStorage.removeItem('token');
        localStorage.removeItem('token');
        // Don't redirect immediately - let the component handle the error first
        // The component will show the error message and handle redirect
        // This prevents double redirects and allows proper error handling
        console.warn('Authentication error detected:', errorMessage);
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

