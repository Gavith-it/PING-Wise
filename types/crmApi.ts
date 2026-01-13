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
  date_of_birth?: string;
  last_visit?: string;
  next_visit?: string;
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
  date_of_birth?: string;
  last_visit?: string;
  next_visit?: string;
}

// ==================== TEAM ====================

export interface CrmTeam {
  id: string;
  name: string;
  org_id?: string;
  role?: string;
  status?: string;
  additional_info?: string; // According to Swagger, it's a string
  department?: string;
  experience?: string;
  phone?: string;
  specialization?: string;
  appointment_count?: number; // Read-only field from API response
  created_at: string;
  updated_at: string;
}

export interface CrmTeamRequest {
  name: string;
  org_id?: string;
  role?: string;
  status?: string;
  additional_info?: Record<string, any>; // Backend expects JSON object, not string
  department?: string;
  experience?: string;
  phone?: string;
  specialization?: string;
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

// ==================== CAMPAIGN ====================

export interface CrmCampaign {
  id: string;
  name: string;
  message: string;
  recipients: string[];
  is_scheduled: boolean;
  scheduled_at?: string;
  status: string;
  org_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CrmCampaignRequest {
  name: string;
  message: string;
  recipients?: string[];
  tags?: string[];
  is_scheduled?: boolean;
  scheduled_at?: string;
  status?: string;
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
  assigned_to_id?: string;
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

