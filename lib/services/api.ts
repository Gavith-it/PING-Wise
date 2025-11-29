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
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
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

export default api;

