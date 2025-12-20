# Backend API Configuration Guide

## Overview

This guide explains how the Pingwise Backend API works and how to configure your frontend/client application to communicate with it. **You are not implementing the backend** - you're configuring your frontend to use the provided backend API.

---

## 🏗️ API Architecture

### Base Configuration

- **Base URL**: `http://localhost:8080`
- **Authentication**: JWT Bearer Token
- **Content-Type**: `application/json`
- **API Version**: 1.0.0

### Key Concepts

1. **No Backend Implementation Required**: The backend is already provided and running
2. **Frontend Configuration Only**: You need to configure your frontend to point to the correct API endpoints
3. **JWT Authentication Flow**: Login → Get Token → Use Token in All Requests

---

## 🔐 Authentication Flow

### Step 1: Login and Obtain JWT Token

**Endpoint**: `POST /login`

**Request**:
```json
{
  "user_name": "string",
  "password": "string"
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2019-08-24T14:15:22Z"
}
```

**Response** (401 Unauthorized):
```json
{
  "error": "Invalid credentials"
}
```

**How It Works**:
1. User submits username and password
2. Backend validates credentials
3. If valid, backend returns JWT token and expiration time
4. Frontend stores token (usually in localStorage or sessionStorage)
5. Token is used for all subsequent API calls

---

### Step 2: Validate Token (Optional Check)

**Endpoint**: `POST /checkAuth`

**Headers**:
```
Authorization: Bearer <your-token>
```

**Response** (200 OK): Token is valid
**Response** (401 Unauthorized): Token is invalid or expired

**Use Case**: Check if stored token is still valid before making other API calls

---

### Step 3: Use Token in All Protected Requests

**Pattern**: Include token in Authorization header for all protected endpoints

**Example**:
```javascript
fetch('http://localhost:8080/organizations', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
})
```

---

## 📋 API Endpoints Overview

### 1. Health Check (Public - No Auth)

**GET** `/health`

**Purpose**: Check if backend is running

**Response**:
```json
{
  "status": "string",
  "timestamp": "2019-08-24T14:15:22Z",
  "memory_usage_mb": 0,
  "goroutines": 0,
  "gc_pause_ms": 0,
  "heap_objects": 0
}
```

**Use Case**: 
- Verify backend connectivity before login
- Health monitoring
- Load balancer checks

---

### 2. Organizations (Protected - Requires Auth)

Organizations represent the main entities in the system (e.g., clinics, hospitals).

#### Create Organization
- **POST** `/organizations`
- **Body**: `{ name, type, whatsapp_no, primary_email, description }`
- **Response**: Created organization with `id`, `created_at`, `updated_at`

#### List Organizations
- **GET** `/organizations`
- **Response**: Array of all organizations

#### Get Organization by ID
- **GET** `/organizations/{id}`
- **Response**: Single organization object

#### Update Organization
- **PUT** `/organizations/{id}`
- **Body**: Same as create (all fields)
- **Response**: Updated organization

#### Delete Organization
- **DELETE** `/organizations/{id}`
- **Response**: 204 No Content

---

### 3. Users (Protected - Requires Auth)

Users are system users who can log in and access the system.

#### Create User
- **POST** `/users`
- **Body**: `{ user_name, password, org_id, role }`
- **Response**: Created user with `id`, `created_at`, `updated_at`

#### List Users
- **GET** `/users`
- **Response**: Array of all users

#### Get User
- **GET** `/users/{id}`
- **Response**: Single user object

#### Update User
- **PUT** `/users/{id}`
- **Body**: Same as create
- **Response**: Updated user

#### Delete User
- **DELETE** `/users/{id}`
- **Response**: 204 No Content

---

### 4. Customers (Protected - Requires Auth)

Customers are the patients/clients managed by organizations.

#### Create Customer
- **POST** `/customers`
- **Body**: `{ first_name, last_name, email, phone, address, age, gender, assigned_to, status, medical_history }`
- **Response**: Created customer with `id`, `created_at`, `updated_at`

#### List Customers
- **GET** `/customers`
- **Response**: Array of all customers

#### Get Customer
- **GET** `/customers/{id}`
- **Response**: Single customer object

#### Update Customer
- **PUT** `/customers/{id}`
- **Body**: Same as create
- **Response**: Updated customer

#### Delete Customer
- **DELETE** `/customers/{id}`
- **Response**: 204 No Content

---

### 5. Appointments (Protected - Requires Auth)

Appointments are scheduled meetings between customers and users.

#### Create Appointment
- **POST** `/appointments`
- **Body**: `{ customer_id, description, status, type, scheduled_at, duration, location, notes }`
- **Response**: Created appointment with `id`, `created_at`, `updated_at`

#### List Appointments
- **GET** `/appointments`
- **Response**: Array of all appointments

#### Get Appointment
- **GET** `/appointments/{id}`
- **Response**: Single appointment object

#### Update Appointment
- **PUT** `/appointments/{id}`
- **Body**: Same as create
- **Response**: Updated appointment

#### Delete Appointment
- **DELETE** `/appointments/{id}`
- **Response**: 204 No Content

---

### 6. Dashboard Metrics (Protected - Requires Auth)

**GET** `/reports/daily?date=YYYY-MM-DD`

**Query Parameters**:
- `date` (optional): Date in YYYY-MM-DD format. If omitted, uses today's date.

**Response**:
```json
{
  "totalCustomers": 0,
  "totalAppointments": 0,
  "activeCustomers": 0,
  "bookedCustomers": 0,
  "followupCustomers": 0
}
```

---

## 🔧 Frontend Configuration

### Step 1: Create API Service File

Create a centralized API service to handle all backend communication:

```javascript
// src/services/api.js or src/lib/api.ts

const API_BASE_URL = 'http://localhost:8080';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get stored token from localStorage
  getToken() {
    return localStorage.getItem('access_token');
  }

  // Set token after login
  setToken(token) {
    localStorage.setItem('access_token', token);
  }

  // Remove token on logout
  removeToken() {
    localStorage.removeItem('access_token');
  }

  // Build headers with authentication
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  // Generic fetch wrapper
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      // Handle 401 Unauthorized (token expired)
      if (response.status === 401) {
        this.removeToken();
        // Redirect to login or trigger re-authentication
        window.location.href = '/login';
        throw new Error('Unauthorized - Please login again');
      }

      // Parse JSON response
      const data = await response.json();
      
      // Throw error if response is not ok
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication Methods
  async login(userName, password) {
    const response = await this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ user_name: userName, password }),
    });
    
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    
    return response;
  }

  async validateToken() {
    return this.request('/checkAuth', {
      method: 'POST',
    });
  }

  logout() {
    this.removeToken();
  }

  // Health Check
  async getHealth() {
    return this.request('/health', {
      method: 'GET',
    });
  }

  // Organization Methods
  async getOrganizations() {
    return this.request('/organizations', { method: 'GET' });
  }

  async getOrganization(id) {
    return this.request(`/organizations/${id}`, { method: 'GET' });
  }

  async createOrganization(data) {
    return this.request('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrganization(id, data) {
    return this.request(`/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOrganization(id) {
    return this.request(`/organizations/${id}`, {
      method: 'DELETE',
    });
  }

  // User Methods
  async getUsers() {
    return this.request('/users', { method: 'GET' });
  }

  async getUser(id) {
    return this.request(`/users/${id}`, { method: 'GET' });
  }

  async createUser(data) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id, data) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Customer Methods
  async getCustomers() {
    return this.request('/customers', { method: 'GET' });
  }

  async getCustomer(id) {
    return this.request(`/customers/${id}`, { method: 'GET' });
  }

  async createCustomer(data) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCustomer(id, data) {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCustomer(id) {
    return this.request(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // Appointment Methods
  async getAppointments() {
    return this.request('/appointments', { method: 'GET' });
  }

  async getAppointment(id) {
    return this.request(`/appointments/${id}`, { method: 'GET' });
  }

  async createAppointment(data) {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAppointment(id, data) {
    return this.request(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAppointment(id) {
    return this.request(`/appointments/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard Methods
  async getDailyMetrics(date) {
    const query = date ? `?date=${date}` : '';
    return this.request(`/reports/daily${query}`, { method: 'GET' });
  }
}

// Export singleton instance
export default new ApiService();
```

---

### Step 2: Update Environment Configuration

Create or update your `.env` file:

```bash
# .env
REACT_APP_API_BASE_URL=http://localhost:8080
# or for Next.js:
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

---

### Step 3: Update Login Component

```javascript
// Example Login Component
import apiService from '../services/api';

function Login() {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await apiService.login(userName, password);
      
      // Store token (already done in apiService.login)
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setError('Invalid credentials. Please try again.');
      console.error('Login error:', err);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="text"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        placeholder="Username"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit">Login</button>
    </form>
  );
}
```

---

### Step 4: Use API in Components

```javascript
// Example: Fetching customers
import { useEffect, useState } from 'react';
import apiService from '../services/api';

function CustomersList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const data = await apiService.getCustomers();
        setCustomers(data);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCustomers();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {customers.map(customer => (
        <div key={customer.id}>
          {customer.first_name} {customer.last_name}
        </div>
      ))}
    </div>
  );
}
```

---

## 🔄 Request/Response Patterns

### Standard Request Pattern

```javascript
// GET Request
const data = await apiService.getCustomers();

// POST Request
const newCustomer = await apiService.createCustomer({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  phone: '+1234567890',
});

// PUT Request
const updated = await apiService.updateCustomer(customerId, {
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane@example.com',
});

// DELETE Request
await apiService.deleteCustomer(customerId);
```

### Error Handling Pattern

```javascript
try {
  const data = await apiService.getCustomers();
  // Handle success
} catch (error) {
  if (error.message.includes('Unauthorized')) {
    // Token expired - redirect to login
    window.location.href = '/login';
  } else {
    // Show error message to user
    alert('Failed to fetch customers: ' + error.message);
  }
}
```

---

## 📝 Important Notes

### 1. Token Management
- **Store**: Store token in `localStorage` or `sessionStorage`
- **Expiration**: Check `expires_at` field from login response
- **Refresh**: Implement token refresh logic if backend supports it
- **Cleanup**: Remove token on logout

### 2. CORS Configuration
- Backend must allow requests from your frontend origin
- If frontend runs on `http://localhost:3000`, backend should allow this origin
- This is configured on the backend side (not your responsibility)

### 3. Error Responses
- **200**: Success
- **201**: Created (for POST requests)
- **204**: No Content (for DELETE requests)
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid/missing token)
- **404**: Not Found
- **500**: Server Error

### 4. Date Formats
- Use ISO 8601 format: `2019-08-24T14:15:22Z`
- For date-only fields: `YYYY-MM-DD` (e.g., `2019-08-24`)

### 5. Required vs Optional Fields
- Fields marked as `required` in API docs must be included
- Optional fields can be omitted
- Check API documentation for each endpoint's requirements

---

## 🧪 Testing the API

### Using cURL

```bash
# Health Check
curl http://localhost:8080/health

# Login
curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{"user_name":"testuser","password":"testpass"}'

# Get Organizations (with token)
curl http://localhost:8080/organizations \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman/Insomnia

1. Create a new request
2. Set method (GET, POST, PUT, DELETE)
3. Set URL: `http://localhost:8080/endpoint`
4. Add headers:
   - `Content-Type: application/json`
   - `Authorization: Bearer YOUR_TOKEN`
5. Add body (for POST/PUT) in JSON format

---

## 🚀 Next Steps

1. **Update your existing API service** to use the new backend endpoints
2. **Update environment variables** to point to `http://localhost:8080`
3. **Test authentication flow** (login → get token → use token)
4. **Update components** to use new API structure
5. **Handle errors** appropriately (401 redirects, error messages)
6. **Test all CRUD operations** for each resource

---

## 📚 Summary

- **Backend is provided** - you don't need to implement it
- **Configure frontend** to use `http://localhost:8080`
- **JWT authentication** - login to get token, use token in all requests
- **Standard REST API** - GET, POST, PUT, DELETE operations
- **Centralized API service** - create one service file to handle all API calls
- **Error handling** - handle 401 (unauthorized) by redirecting to login

The key is understanding that you're configuring your frontend to communicate with an existing backend API, not building the backend itself.

