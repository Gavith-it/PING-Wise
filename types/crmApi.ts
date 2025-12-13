/**
 * CRM API TypeScript Types
 * 
 * Based on Swagger/OpenAPI definition from https://pw-crm-gateway-1.onrender.com
 * Swagger Version: 2.0
 */

// ==================== AUTHENTICATION ====================

export interface CrmLoginRequest {
  user_name: string;
  password: string;
}

export interface CrmTokenResponse {
  access_token: string;
  expires_at: string;
  role?: string;
}

// ==================== CUSTOMER ====================

export interface CrmCustomer {
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

export interface CrmCustomerRequest {
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

// ==================== TEAM ====================

export interface CrmTeam {
  id: string;
  name: string;
  org_id?: string;
  role?: string;
  status?: string;
  additional_info?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CrmTeamRequest {
  name: string;
  org_id?: string;
  role?: string;
  status?: string;
  additional_info?: Record<string, any>;
}

// ==================== USER ====================

export interface CrmUser {
  id: string;
  user_name: string;
  password?: string;
  org_id?: string;
  role?: string;
  created_at: string;
  updated_at: string;
}

export interface CrmUserRequest {
  user_name: string;
  password: string;
  org_id?: string;
  role?: string;
}

// ==================== TEMPLATE ====================

export interface CrmTemplate {
  id: string;
  name: string;
  org_id?: string;
  content: string[];
  created_at: string;
  updated_at: string;
}

export interface CrmTemplateRequest {
  name: string;
  org_id?: string;
  content: string[];
}

// ==================== APPOINTMENT ====================

export interface CrmAppointment {
  id: string;
  customer_id: string;
  appointment_type?: string;
  assigned_to?: string;
  scheduled_at: string;
  duration?: number;
  status?: string;
  priority?: string;
  location?: string;
  notes?: string;
  attachments?: string[];
  created_at: string;
  updated_at: string;
}

export interface CrmAppointmentRequest {
  customer_id: string;
  appointment_type?: string;
  assigned_to?: string;
  scheduled_at: string;
  duration?: number;
  status?: string;
  priority?: string;
  location?: string;
  notes?: string;
  attachments?: string[];
}

// ==================== REPORTS ====================

export interface CrmDailyReport {
  [key: string]: any; // The API returns a generic object for daily reports
}

// ==================== API RESPONSE TYPES ====================

export interface CrmApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}

// For endpoints that return arrays directly
export type CrmApiListResponse<T> = T[];

// For endpoints that return single objects
export type CrmApiSingleResponse<T> = T;

// For endpoints that return strings (like DELETE)
export type CrmApiStringResponse = string;

