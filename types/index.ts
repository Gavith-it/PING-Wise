// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'staff';
  department?: string;
  specialization?: string;
  experience?: string;
  phone?: string;
  status: 'active' | 'leave' | 'inactive';
  initials?: string;
  avatarColor?: string;
  rating?: number; // 1-5 star rating
  appointmentCount?: number; // Total appointments/bookings held
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserWithPassword extends User {
  password: string;
}

// Patient Types
export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other' | '';
  phone: string;
  email: string;
  address?: string;
  assignedDoctor?: string;
  status: 'active' | 'booked' | 'follow-up' | 'inactive';
  medicalNotes?: string;
  dateOfBirth?: Date;
  lastVisit?: Date;
  nextAppointment?: Date;
  initials?: string;
  avatarColor?: string;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Appointment Types
export interface Appointment {
  id: string;
  patient: string | Patient;
  doctor: string | User;
  date: Date;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show' | 'confirmed' | 'pending';
  notes?: string;
  type?: string;
  reason?: string;
  duration?: number;
  priority?: string;
  specialInstructions?: string;
  medicalNotes?: string;
  confirmationSent?: boolean;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Campaign Types
export interface Campaign {
  id: string;
  name?: string;
  title?: string;
  message: string;
  recipients: string[];
  recipientTags?: string[];
  recipientCount?: number;
  status: 'draft' | 'sent' | 'scheduled' | 'delivered' | 'sending' | 'failed';
  scheduledDate?: Date;
  sentDate?: Date;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
  total?: number;
  count?: number;
  page?: number;
  pages?: number;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Dashboard Types
export interface DashboardStats {
  totalBookings?: {
    value: number;
    change: number;
    trend: 'up' | 'down';
  };
  totalPatients?: {
    value: number;
    change: number;
    trend: 'up' | 'down';
  };
  followUps?: {
    value: number;
    change: number;
    trend: 'up' | 'down';
  };
  revenue?: {
    value: number;
    change: number;
    trend: 'up' | 'down';
  };
  todayAppointments?: {
    value: number;
  };
  activeCampaigns?: {
    value: number;
  };
}

export interface ActivityData {
  total: number;
  active: {
    count: number;
    percentage: number;
  };
  booked: {
    count: number;
    percentage: number;
  };
  inactive: {
    count: number;
    percentage: number;
  };
}

// JWT Payload
export interface JWTPayload {
  id: string;
  iat?: number;
  exp?: number;
}

// Request Types
export interface LoginRequest {
  email?: string;
  user_name?: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'doctor' | 'staff';
  department?: string;
  specialization?: string;
  phone?: string;
}

export interface CreatePatientRequest {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other' | '';
  phone: string;
  email: string;
  address?: string;
  assignedDoctor?: string;
  status?: 'active' | 'booked' | 'follow-up' | 'inactive';
  medicalNotes?: string;
  dateOfBirth?: Date;
}

export interface CreateAppointmentRequest {
  patient: string;
  doctor: string;
  date: string;
  time: string;
  notes?: string;
  type?: string;
  reason?: string;
  status?: string;
}

export interface CreateCampaignRequest {
  name?: string;
  message: string;
  recipients?: string[];
  recipientTags?: string[];
  scheduledDate?: string;
}

