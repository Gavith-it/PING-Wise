# Backend API Architecture - Visual Explanation

## 🎯 What You're Doing

You are **configuring your frontend** to communicate with an **existing backend API**. You are **NOT building the backend**.

```
┌─────────────────┐         HTTP Requests         ┌─────────────────┐
│                 │ ────────────────────────────> │                 │
│   Your Frontend │                                │  Backend API    │
│   (React/Next)  │ <────────────────────────────  │  (Port 8080)    │
│                 │      JSON Responses            │                 │
└─────────────────┘                                └─────────────────┘
      ▲                                                    │
      │                                                    │
      │                                                    │
      └─────────── Stores JWT Token ─────────────────────┘
```

---

## 🔐 Authentication Flow (Step by Step)

### Step 1: User Logs In

```
User enters credentials
         │
         ▼
Frontend sends: POST /login
{
  "user_name": "admin",
  "password": "password123"
}
         │
         ▼
Backend validates credentials
         │
         ▼
Backend responds: 200 OK
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_at": "2024-01-15T10:00:00Z"
}
         │
         ▼
Frontend stores token in localStorage
Key: "access_token"
```

### Step 2: Making Protected Requests

```
Frontend needs to fetch data
         │
         ▼
Frontend retrieves token from localStorage
         │
         ▼
Frontend sends request with header:
GET /customers
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
         │
         ▼
Backend validates token
         │
         ├─ Valid → Returns data (200 OK)
         │
         └─ Invalid/Expired → Returns 401 Unauthorized
                │
                ▼
         Frontend redirects to login
```

---

## 📊 API Structure Overview

```
Backend API (http://localhost:8080)
│
├── Public Endpoints (No Auth Required)
│   └── GET /health
│
├── Authentication Endpoints
│   ├── POST /login              → Get JWT token
│   └── POST /checkAuth          → Validate token
│
├── Organizations (Protected)
│   ├── GET    /organizations         → List all
│   ├── GET    /organizations/{id}    → Get one
│   ├── POST   /organizations         → Create
│   ├── PUT    /organizations/{id}    → Update
│   └── DELETE /organizations/{id}    → Delete
│
├── Users (Protected)
│   ├── GET    /users                 → List all
│   ├── GET    /users/{id}            → Get one
│   ├── POST   /users                 → Create
│   ├── PUT    /users/{id}            → Update
│   └── DELETE /users/{id}            → Delete
│
├── Customers (Protected)
│   ├── GET    /customers             → List all
│   ├── GET    /customers/{id}        → Get one
│   ├── POST   /customers             → Create
│   ├── PUT    /customers/{id}        → Update
│   └── DELETE /customers/{id}        → Delete
│
├── Appointments (Protected)
│   ├── GET    /appointments          → List all
│   ├── GET    /appointments/{id}     → Get one
│   ├── POST   /appointments          → Create
│   ├── PUT    /appointments/{id}     → Update
│   └── DELETE /appointments/{id}     → Delete
│
└── Reports (Protected)
    └── GET /reports/daily?date=YYYY-MM-DD → Dashboard metrics
```

---

## 🔄 Request/Response Cycle

### Example: Fetching Customers

```
┌──────────────┐
│   Component  │
│  (React)     │
└──────┬───────┘
       │
       │ calls: pingwiseApi.getCustomers()
       ▼
┌──────────────┐
│  API Service │
│  (api.ts)    │
└──────┬───────┘
       │
       │ 1. Gets token from localStorage
       │ 2. Adds Authorization header
       │ 3. Makes HTTP request
       ▼
┌──────────────┐
│   Backend    │
│   (Port 8080)│
└──────┬───────┘
       │
       │ Validates token
       │ Queries database
       │ Returns JSON
       ▼
┌──────────────┐
│  API Service │
│  (api.ts)    │
└──────┬───────┘
       │
       │ Handles response
       │ Parses JSON
       │ Returns data
       ▼
┌──────────────┐
│   Component  │
│  (React)     │
│              │
│  Updates UI  │
└──────────────┘
```

---

## 🗂️ Data Model Relationships

```
Organization (Clinic/Hospital)
    │
    ├─── has many Users (Staff/Doctors)
    │         │
    │         └─── can be assigned to Customers
    │
    └─── has many Customers (Patients)
              │
              └─── has many Appointments
                        │
                        └─── scheduled_at (date-time)
```

### Example Data Flow:

```
1. Create Organization
   POST /organizations
   → Returns: { id: "org-123", name: "City Clinic", ... }

2. Create User (belongs to organization)
   POST /users
   { org_id: "org-123", user_name: "dr_smith", role: "doctor" }
   → Returns: { id: "user-456", ... }

3. Create Customer
   POST /customers
   { first_name: "John", last_name: "Doe", ... }
   → Returns: { id: "customer-789", ... }

4. Create Appointment (links customer to user)
   POST /appointments
   { customer_id: "customer-789", scheduled_at: "2024-01-15T10:00:00Z", ... }
   → Returns: { id: "appt-101", ... }
```

---

## 🛠️ How Your Frontend Code Works

### 1. API Service Layer (Centralized)

```typescript
// lib/services/api.ts or client/src/services/api.ts

class PingwiseApiService {
  // Handles all HTTP communication
  // Manages authentication tokens
  // Provides methods for each endpoint
}

export const pingwiseApi = new PingwiseApiService();
```

**Purpose**: Single point of contact with backend. All components use this service.

### 2. Components Use API Service

```typescript
// app/customers/page.tsx or components/CustomerList.tsx

import pingwiseApi from '@/lib/services/api';

function CustomerList() {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    // Component calls API service
    pingwiseApi.getCustomers()
      .then(setCustomers)
      .catch(handleError);
  }, []);

  return <div>{/* Render customers */}</div>;
}
```

**Purpose**: Components focus on UI, API service handles backend communication.

### 3. Authentication Context

```typescript
// contexts/AuthContext.tsx

// Manages:
// - Current user state
// - Login/logout functions
// - Token management
// - Protected route logic
```

**Purpose**: Centralized authentication state management.

---

## 🔑 Key Concepts Explained

### 1. JWT Token (JSON Web Token)

**What it is**: A secure token that proves you're authenticated.

**How it works**:
- Backend creates token when you login
- Token contains user information (encoded)
- Token expires after certain time
- Frontend sends token with every request
- Backend validates token before processing request

**Storage**: Usually stored in `localStorage` or `sessionStorage`

### 2. Bearer Authentication

**Format**: `Authorization: Bearer <token>`

**Example**:
```
GET /customers
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Why**: Standard way to send authentication tokens in HTTP headers.

### 3. REST API Patterns

**CRUD Operations**:
- **C**reate → `POST /resource`
- **R**ead → `GET /resource` or `GET /resource/{id}`
- **U**pdate → `PUT /resource/{id}`
- **D**elete → `DELETE /resource/{id}`

**HTTP Status Codes**:
- `200` - Success
- `201` - Created (for POST)
- `204` - No Content (for DELETE)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid token)
- `404` - Not Found
- `500` - Server Error

### 4. Request/Response Format

**Request** (POST/PUT):
```json
{
  "field1": "value1",
  "field2": "value2"
}
```

**Response** (Success):
```json
{
  "id": "123",
  "field1": "value1",
  "field2": "value2",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

**Response** (Error):
```json
{
  "error": "Error message here"
}
```

---

## 📝 Common Patterns in Your Code

### Pattern 1: Fetching Data

```typescript
// 1. Component mounts
useEffect(() => {
  // 2. Call API service
  pingwiseApi.getCustomers()
    // 3. Handle success
    .then(customers => setCustomers(customers))
    // 4. Handle error
    .catch(error => setError(error.message));
}, []);
```

### Pattern 2: Creating Data

```typescript
const handleCreate = async (formData) => {
  try {
    // 1. Call API service
    const newCustomer = await pingwiseApi.createCustomer(formData);
    // 2. Update local state
    setCustomers([...customers, newCustomer]);
    // 3. Show success message
    showNotification('Customer created successfully!');
  } catch (error) {
    // 4. Handle error
    showError('Failed to create customer');
  }
};
```

### Pattern 3: Updating Data

```typescript
const handleUpdate = async (id, formData) => {
  try {
    // 1. Call API service
    const updated = await pingwiseApi.updateCustomer(id, formData);
    // 2. Update local state
    setCustomers(customers.map(c => c.id === id ? updated : c));
    // 3. Show success
    showNotification('Customer updated!');
  } catch (error) {
    showError('Failed to update customer');
  }
};
```

### Pattern 4: Deleting Data

```typescript
const handleDelete = async (id) => {
  if (!confirm('Are you sure?')) return;
  
  try {
    // 1. Call API service
    await pingwiseApi.deleteCustomer(id);
    // 2. Update local state
    setCustomers(customers.filter(c => c.id !== id));
    // 3. Show success
    showNotification('Customer deleted!');
  } catch (error) {
    showError('Failed to delete customer');
  }
};
```

---

## 🎓 Summary: What You Need to Know

1. **Backend is Already Built**: You're just connecting to it
2. **Authentication**: Login → Get Token → Use Token in Requests
3. **API Service**: Centralized file that handles all backend communication
4. **Components**: Use API service to fetch/update data
5. **Token Management**: Stored in localStorage, automatically added to requests
6. **Error Handling**: 401 errors redirect to login automatically

---

## 🚀 Quick Start Checklist

- [ ] Understand that backend is already running on port 8080
- [ ] Create/update API service file (`API_SERVICE_EXAMPLE.ts`)
- [ ] Update environment variables to point to `http://localhost:8080`
- [ ] Update login to use `user_name` instead of `email`
- [ ] Update components to use new API service methods
- [ ] Test authentication flow
- [ ] Test CRUD operations for each resource
- [ ] Handle errors appropriately

---

## 📚 Related Documents

- **BACKEND_API_GUIDE.md** - Complete API documentation
- **API_SERVICE_EXAMPLE.ts** - Ready-to-use API service implementation
- **API_MIGRATION_GUIDE.md** - Migration from old to new API

---

## 💡 Key Takeaway

**You are configuring your frontend to talk to an existing backend API. The backend is already built and running. Your job is to:**

1. ✅ Configure API service to point to correct URL
2. ✅ Handle authentication (login, token storage)
3. ✅ Call the correct endpoints with correct data format
4. ✅ Handle responses and errors appropriately

That's it! No backend implementation needed. 🎉

