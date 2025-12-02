/**
 * Pingwise Backend API Service
 * 
 * This service connects to the Pingwise backend API running on http://localhost:8080
 * 
 * Usage:
 * 1. Update your environment variable: NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
 * 2. Import this service in your components
 * 3. Use the methods to interact with the backend
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// Types based on the API documentation
export interface LoginRequest {
  user_name: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  expires_at: string;
}

export interface Organization {
  id: string;
  name: string;
  type?: string;
  whatsapp_no?: string;
  primary_email?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrganizationRequest {
  name: string;
  type?: string;
  whatsapp_no?: string;
  primary_email?: string;
  description?: string;
}

export interface User {
  id: string;
  user_name: string;
  password?: string; // Usually not returned, but included in create/update
  org_id?: string;
  role?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  user_name: string;
  password: string;
  org_id?: string;
  role?: string;
}

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  age?: number;
  gender?: string;
  assigned_to?: string;
  status?: string;
  medical_history?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  age?: number;
  gender?: string;
  assigned_to?: string;
  status?: string;
  medical_history?: Record<string, any>;
}

export interface Appointment {
  id: string;
  customer_id: string;
  description?: string;
  status?: string;
  type?: string;
  scheduled_at: string;
  duration?: number;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAppointmentRequest {
  customer_id: string;
  description?: string;
  status?: string;
  type?: string;
  scheduled_at: string; // ISO 8601 date-time format
  duration?: number;
  location?: string;
  notes?: string;
}

export interface DailyMetrics {
  totalCustomers: number;
  totalAppointments: number;
  activeCustomers: number;
  bookedCustomers: number;
  followupCustomers: number;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  memory_usage_mb: number;
  goroutines: number;
  gc_pause_ms: number;
  heap_objects: number;
}

class PingwiseApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Get base URL from environment or use default
    this.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 
                   process.env.REACT_APP_API_BASE_URL || 
                   'http://localhost:8080';

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
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors globally
    this.api.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError) => {
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          this.removeToken();
          // Redirect to login if in browser
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Token management
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  }

  removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
  }

  // ==================== AUTHENTICATION ====================

  /**
   * Login and obtain JWT token
   * POST /login
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.api.post<LoginResponse>('/login', credentials) as unknown as LoginResponse;
    
    // Store token automatically
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    
    return response;
  }

  /**
   * Validate token
   * POST /checkAuth
   */
  async validateToken(): Promise<void> {
    await this.api.post('/checkAuth');
  }

  /**
   * Logout (removes token locally)
   */
  logout(): void {
    this.removeToken();
  }

  // ==================== HEALTH CHECK ====================

  /**
   * Health check endpoint
   * GET /health
   */
  async getHealth(): Promise<HealthCheckResponse> {
    return this.api.get<HealthCheckResponse>('/health') as unknown as HealthCheckResponse;
  }

  // ==================== ORGANIZATIONS ====================

  /**
   * List all organizations
   * GET /organizations
   */
  async getOrganizations(): Promise<Organization[]> {
    return this.api.get<Organization[]>('/organizations') as unknown as Organization[];
  }

  /**
   * Get organization by ID
   * GET /organizations/{id}
   */
  async getOrganization(id: string): Promise<Organization> {
    return this.api.get<Organization>(`/organizations/${id}`) as unknown as Organization;
  }

  /**
   * Create organization
   * POST /organizations
   */
  async createOrganization(data: CreateOrganizationRequest): Promise<Organization> {
    return this.api.post<Organization>('/organizations', data) as unknown as Organization;
  }

  /**
   * Update organization
   * PUT /organizations/{id}
   */
  async updateOrganization(id: string, data: CreateOrganizationRequest): Promise<Organization> {
    return this.api.put<Organization>(`/organizations/${id}`, data) as unknown as Organization;
  }

  /**
   * Delete organization
   * DELETE /organizations/{id}
   */
  async deleteOrganization(id: string): Promise<void> {
    await this.api.delete(`/organizations/${id}`);
  }

  // ==================== USERS ====================

  /**
   * List all users
   * GET /users
   */
  async getUsers(): Promise<User[]> {
    return this.api.get<User[]>('/users') as unknown as User[];
  }

  /**
   * Get user by ID
   * GET /users/{id}
   */
  async getUser(id: string): Promise<User> {
    return this.api.get<User>(`/users/${id}`) as unknown as User;
  }

  /**
   * Create user
   * POST /users
   */
  async createUser(data: CreateUserRequest): Promise<User> {
    return this.api.post<User>('/users', data) as unknown as User;
  }

  /**
   * Update user
   * PUT /users/{id}
   */
  async updateUser(id: string, data: CreateUserRequest): Promise<User> {
    return this.api.put<User>(`/users/${id}`, data) as unknown as User;
  }

  /**
   * Delete user
   * DELETE /users/{id}
   */
  async deleteUser(id: string): Promise<void> {
    await this.api.delete(`/users/${id}`);
  }

  // ==================== CUSTOMERS ====================

  /**
   * List all customers
   * GET /customers
   */
  async getCustomers(): Promise<Customer[]> {
    return this.api.get<Customer[]>('/customers') as unknown as Customer[];
  }

  /**
   * Get customer by ID
   * GET /customers/{id}
   */
  async getCustomer(id: string): Promise<Customer> {
    return this.api.get<Customer>(`/customers/${id}`) as unknown as Customer;
  }

  /**
   * Create customer
   * POST /customers
   */
  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    return this.api.post<Customer>('/customers', data) as unknown as Customer;
  }

  /**
   * Update customer
   * PUT /customers/{id}
   */
  async updateCustomer(id: string, data: CreateCustomerRequest): Promise<Customer> {
    return this.api.put<Customer>(`/customers/${id}`, data) as unknown as Customer;
  }

  /**
   * Delete customer
   * DELETE /customers/{id}
   */
  async deleteCustomer(id: string): Promise<void> {
    await this.api.delete(`/customers/${id}`);
  }

  // ==================== APPOINTMENTS ====================

  /**
   * List all appointments
   * GET /appointments
   */
  async getAppointments(): Promise<Appointment[]> {
    return this.api.get<Appointment[]>('/appointments') as unknown as Appointment[];
  }

  /**
   * Get appointment by ID
   * GET /appointments/{id}
   */
  async getAppointment(id: string): Promise<Appointment> {
    return this.api.get<Appointment>(`/appointments/${id}`) as unknown as Appointment;
  }

  /**
   * Create appointment
   * POST /appointments
   */
  async createAppointment(data: CreateAppointmentRequest): Promise<Appointment> {
    return this.api.post<Appointment>('/appointments', data) as unknown as Appointment;
  }

  /**
   * Update appointment
   * PUT /appointments/{id}
   */
  async updateAppointment(id: string, data: CreateAppointmentRequest): Promise<Appointment> {
    return this.api.put<Appointment>(`/appointments/${id}`, data) as unknown as Appointment;
  }

  /**
   * Delete appointment
   * DELETE /appointments/{id}
   */
  async deleteAppointment(id: string): Promise<void> {
    await this.api.delete(`/appointments/${id}`);
  }

  // ==================== DASHBOARD METRICS ====================

  /**
   * Get daily dashboard metrics
   * GET /reports/daily?date=YYYY-MM-DD
   * 
   * @param date Optional date in YYYY-MM-DD format. If omitted, uses today.
   */
  async getDailyMetrics(date?: string): Promise<DailyMetrics> {
    const params = date ? { date } : {};
    return this.api.get<DailyMetrics>('/reports/daily', { params }) as unknown as DailyMetrics;
  }
}

// Export singleton instance
export const pingwiseApi = new PingwiseApiService();
export default pingwiseApi;

