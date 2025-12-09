/**
 * Mock API Service
 * 
 * Provides mock API responses when MongoDB is not available.
 */

import { delay, mockPatients, mockAppointments, mockTeamMembers, mockDashboardStats, mockActivityData, mockCampaigns } from './mockData';
import { LoginRequest, RegisterRequest, CreatePatientRequest, AuthResponse, ApiResponse, User, Patient, Appointment, Campaign, ActivityData, DashboardStats } from '@/types';

export const mockApi = {
  auth: {
    login: async (email: string, password: string): Promise<AuthResponse> => {
      await delay(500);
      return {
        success: true,
        message: 'Login successful (Mock Mode)',
        token: 'mock-jwt-token-' + Date.now(),
        user: {
          id: '1',
          name: 'Dr. John Davis',
          email: email,
          role: 'doctor',
          department: 'Internal Medicine',
          initials: 'JD',
          avatarColor: 'bg-primary',
          status: 'active'
        }
      };
    },
    register: async (userData: RegisterRequest): Promise<AuthResponse> => {
      await delay(500);
      const names = userData.name.split(' ');
      const initials = names.map(n => n.charAt(0).toUpperCase()).join('');
      return {
        success: true,
        message: 'Registration successful (Mock Mode)',
        token: 'mock-jwt-token-' + Date.now(),
        user: {
          id: String(mockTeamMembers.length + 1),
          name: userData.name,
          email: userData.email,
          role: userData.role || 'staff',
          department: userData.department,
          specialization: userData.specialization,
          phone: userData.phone,
          initials,
          avatarColor: 'bg-primary',
          status: 'active'
        }
      };
    },
    getCurrentUser: async (): Promise<{ success: true; user: User }> => {
      await delay(300);
      return {
        success: true,
        user: {
          id: '1',
          name: 'Dr. John Davis',
          email: 'john@clinic.com',
          role: 'doctor',
          department: 'Internal Medicine',
          initials: 'JD',
          avatarColor: 'bg-primary',
          status: 'active'
        }
      };
    }
  },
  patients: {
    getPatients: async (params: any = {}): Promise<ApiResponse<Patient[]>> => {
      await delay(500);
      let filtered = [...mockPatients];
      
      if (params.status && params.status !== 'all') {
        filtered = filtered.filter(p => p.status === params.status);
      }
      
      if (params.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(p =>
          p.name.toLowerCase().includes(search) ||
          p.email.toLowerCase().includes(search) ||
          p.phone.includes(search)
        );
      }
      
      const page = params.page || 1;
      const limit = params.limit || 10;
      const start = (page - 1) * limit;
      const end = start + limit;
      
      return {
        success: true,
        data: filtered.slice(start, end),
        total: filtered.length,
        count: filtered.slice(start, end).length,
        page,
        pages: Math.ceil(filtered.length / limit)
      };
    },
    getPatient: async (id: string): Promise<ApiResponse<{ patient: Patient; recentAppointments: Appointment[] }>> => {
      await delay(300);
      const patient = mockPatients.find(p => p.id === id);
      if (!patient) {
        throw new Error('Patient not found');
      }
      return {
        success: true,
        data: {
          patient,
          recentAppointments: mockAppointments.filter(a => a.patient === id)
        }
      };
    },
    createPatient: async (data: CreatePatientRequest): Promise<ApiResponse<Patient>> => {
      await delay(500);
      const names = data.name.split(' ');
      const initials = names.map(n => n.charAt(0).toUpperCase()).join('');
      const newPatient: Patient = {
        id: String(mockPatients.length + 1),
        ...data,
        status: data.status || 'active',
        initials,
        avatarColor: 'bg-blue-500',
        createdBy: '1',
        createdAt: new Date()
      };
      mockPatients.push(newPatient);
      return { success: true, data: newPatient };
    },
    updatePatient: async (id: string, data: Partial<CreatePatientRequest>): Promise<ApiResponse<Patient>> => {
      await delay(500);
      const index = mockPatients.findIndex(p => p.id === id);
      if (index !== -1) {
        mockPatients[index] = { ...mockPatients[index], ...data };
        return { success: true, data: mockPatients[index] };
      }
      throw new Error('Patient not found');
    },
    deletePatient: async (id: string): Promise<ApiResponse> => {
      await delay(500);
      const index = mockPatients.findIndex(p => p.id === id);
      if (index !== -1) {
        mockPatients.splice(index, 1);
        return { success: true };
      }
      throw new Error('Patient not found');
    },
    bulkUploadPatients: async (formData: FormData): Promise<ApiResponse<{ successCount: number; errors: any[] }>> => {
      await delay(1500);
      
      // Mock implementation - simulate parsing CSV/Excel
      // In real implementation, this would parse the file
      const file = formData.get('file') as File;
      
      if (!file) {
        return {
          success: false,
          message: 'No file provided',
          data: { successCount: 0, errors: [] }
        };
      }

      // Simulate processing with some errors
      const mockErrors: any[] = [];
      let successCount = 0;
      
      // Mock: Simulate processing 5 rows, 2 with errors
      for (let i = 1; i <= 5; i++) {
        if (i === 2 || i === 4) {
          mockErrors.push({
            row: i + 1, // +1 for header row
            field: i === 2 ? 'email' : 'phone',
            message: i === 2 ? 'Invalid email format' : 'Phone number is required',
            data: { name: `Patient ${i}`, email: i === 2 ? 'invalid-email' : `patient${i}@example.com` }
          });
        } else {
          successCount++;
          const names = `Patient ${i}`.split(' ');
          const initials = names.map(n => n.charAt(0).toUpperCase()).join('');
          const newPatient: Patient = {
            id: String(mockPatients.length + 1),
            name: `Patient ${i}`,
            age: 30 + i,
            gender: 'male',
            phone: `123456789${i}`,
            email: `patient${i}@example.com`,
            status: 'active',
            initials,
            avatarColor: 'bg-blue-500',
            createdBy: '1',
            createdAt: new Date()
          };
          mockPatients.push(newPatient);
        }
      }

      return {
        success: true,
        message: `Upload completed. ${successCount} patients added, ${mockErrors.length} errors found.`,
        data: {
          successCount,
          errors: mockErrors
        }
      };
    }
  },
  appointments: {
    getAppointments: async (params: any = {}): Promise<ApiResponse<Appointment[]>> => {
      await delay(500);
      let filtered = [...mockAppointments];
      
      if (params.date) {
        const dateStr = params.date.split('T')[0];
        filtered = filtered.filter(a => {
          const aptDate = new Date(a.date).toISOString().split('T')[0];
          return aptDate === dateStr;
        });
      }
      
      return {
        success: true,
        count: filtered.length,
        data: filtered
      };
    },
    getTodayAppointments: async (): Promise<ApiResponse<Appointment[]>> => {
      await delay(500);
      const today = new Date().toISOString().split('T')[0];
      const filtered = mockAppointments.filter(a => {
        const aptDate = new Date(a.date).toISOString().split('T')[0];
        return aptDate === today;
      });
      return {
        success: true,
        count: filtered.length,
        data: filtered
      };
    },
    createAppointment: async (appointmentData: any): Promise<ApiResponse<Appointment>> => {
      await delay(500);
      
      // Find patient and doctor from mock data
      const patient = mockPatients.find(p => p.id === appointmentData.patient);
      const doctor = mockTeamMembers.find(d => d.id === appointmentData.doctor);
      
      if (!patient) {
        return {
          success: false,
          message: 'Patient not found',
          data: null as any
        };
      }
      
      const newAppointment: Appointment = {
        id: String(mockAppointments.length + 1),
        patient: patient,
        doctor: doctor || mockTeamMembers[0],
        date: new Date(appointmentData.date),
        time: appointmentData.time,
        type: appointmentData.type,
        reason: appointmentData.reason || appointmentData.medicalNotes || 'General consultation',
        status: 'pending',
        duration: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Add to mock data
      mockAppointments.push(newAppointment);
      
      return {
        success: true,
        message: 'Appointment created successfully (Mock Mode)',
        data: newAppointment
      };
    }
  },
  dashboard: {
    getStats: async (): Promise<ApiResponse<DashboardStats>> => {
      await delay(500);
      return { success: true, data: mockDashboardStats };
    },
    getActivity: async (): Promise<ApiResponse<ActivityData>> => {
      await delay(500);
      return { success: true, data: mockActivityData };
    },
    getTodayAppointments: async (): Promise<ApiResponse<Appointment[]>> => {
      await delay(500);
      const today = new Date().toISOString().split('T')[0];
      const filtered = mockAppointments.filter(a => {
        const aptDate = new Date(a.date).toISOString().split('T')[0];
        return aptDate === today;
      });
      return {
        success: true,
        count: filtered.length,
        data: filtered
      };
    }
  },
  campaigns: {
    getCampaigns: async (): Promise<ApiResponse<Campaign[]>> => {
      await delay(500);
      return {
        success: true,
        count: mockCampaigns.length,
        data: mockCampaigns
      };
    }
  },
  team: {
    getTeamMembers: async (): Promise<ApiResponse<User[]>> => {
      await delay(500);
      return {
        success: true,
        count: mockTeamMembers.length,
        data: mockTeamMembers
      };
    },
    createTeamMember: async (memberData: any): Promise<ApiResponse<User>> => {
      await delay(500);
      
      const names = memberData.name.split(' ');
      const initials = names.map((n: string) => n.charAt(0).toUpperCase()).join('');
      
      // Generate unique avatar color based on name
      const colors = [
        'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-red-500',
        'bg-orange-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
        'bg-cyan-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500',
        'bg-violet-500', 'bg-fuchsia-500', 'bg-rose-500', 'bg-amber-500'
      ];
      let hash = 0;
      for (let i = 0; i < memberData.name.length; i++) {
        hash = memberData.name.charCodeAt(i) + ((hash << 5) - hash);
      }
      const avatarColor = colors[Math.abs(hash) % colors.length];
      
      const newMember: User = {
        id: String(mockTeamMembers.length + 1),
        name: memberData.name,
        email: memberData.email,
        role: memberData.role || 'staff',
        department: memberData.department || '',
        specialization: memberData.specialization || '',
        phone: memberData.phone || '',
        experience: memberData.experience || '',
        status: 'active',
        initials,
        avatarColor,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockTeamMembers.push(newMember);
      
      return {
        success: true,
        message: 'Team member created successfully (Mock Mode)',
        data: newMember
      };
    }
  },
  wallet: {
    getBalance: async (): Promise<ApiResponse<{ balance: number }>> => {
      await delay(300);
      return { 
        success: true, 
        data: { balance: 123456 } // Mock balance
      };
    }
  }
};

