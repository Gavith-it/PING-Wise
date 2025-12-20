# API Migration Guide: Old Backend vs New Backend

This guide helps you understand the differences between your current backend API and the new Pingwise backend API you need to connect to.

---

## 🔄 Key Differences Summary

| Aspect | Old Backend (Current) | New Backend (Pingwise) |
|--------|----------------------|------------------------|
| **Base URL** | `http://localhost:5000/api` | `http://localhost:8080` |
| **Port** | 5000 | 8080 |
| **API Prefix** | `/api` | None (direct endpoints) |
| **Login Field** | `email` | `user_name` |
| **Token Storage Key** | `token` | `access_token` |
| **Resources** | patients, team | customers, users, organizations |
| **Dashboard Endpoint** | `/dashboard/stats` | `/reports/daily` |

---

## 📋 Endpoint Mapping

### Authentication

| Old Backend | New Backend | Changes |
|------------|-------------|---------|
| `POST /api/auth/login` | `POST /login` | - No `/api` prefix<br>- Uses `user_name` instead of `email`<br>- Returns `access_token` instead of `token` |
| `POST /api/auth/register` | ❌ Not available | Registration might be done via `POST /users` |
| `GET /api/auth/me` | `POST /checkAuth` | Different endpoint for token validation |

### Resources Mapping

| Old Concept | Old Endpoint | New Concept | New Endpoint |
|------------|--------------|-------------|--------------|
| **Patients** | `/api/patients` | **Customers** | `/customers` |
| **Team** | `/api/team` | **Users** | `/users` |
| **Organizations** | ❌ Not available | **Organizations** | `/organizations` |

### Appointments

| Old Backend | New Backend | Changes |
|------------|-------------|---------|
| `GET /api/appointments` | `GET /appointments` | - No `/api` prefix<br>- Uses `customer_id` instead of `patient` |
| `POST /api/appointments` | `POST /appointments` | Field names differ (see below) |

### Dashboard

| Old Backend | New Backend | Changes |
|------------|-------------|---------|
| `GET /api/dashboard/stats` | `GET /reports/daily` | Different endpoint and response structure |
| `GET /api/dashboard/activity` | ❌ Not available | Not in new API |
| `GET /api/dashboard/today-appointments` | Filter `/appointments` | Need to filter client-side |

---

## 🔧 Field Name Differences

### Login Request

**Old:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**New:**
```json
{
  "user_name": "username",
  "password": "password123"
}
```

### Patient → Customer

**Old Patient Fields:**
- `name` → Split into `first_name` and `last_name`
- `assignedDoctor` → `assigned_to`
- `medicalNotes` → `medical_history` (object)

**New Customer Fields:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "age": 30,
  "gender": "male",
  "assigned_to": "user-id",
  "status": "active",
  "medical_history": {}
}
```

### Appointment Fields

**Old:**
```json
{
  "patient": "patient-id",
  "doctor": "doctor-id",
  "date": "2024-01-15",
  "time": "10:00",
  "type": "Consultation",
  "duration": 30,
  "location": "Room 101"
}
```

**New:**
```json
{
  "customer_id": "customer-id",
  "description": "Regular checkup",
  "status": "confirmed",
  "type": "Consultation",
  "scheduled_at": "2024-01-15T10:00:00Z",
  "duration": 30,
  "location": "Room 101",
  "notes": "Additional notes"
}
```

**Key Changes:**
- `patient` → `customer_id`
- `date` + `time` → `scheduled_at` (ISO 8601 format)
- `doctor` field removed (might be in `assigned_to` of customer)
- Added `description` and `notes` fields

---

## 🚀 Migration Steps

### Step 1: Update Environment Variables

**Old `.env`:**
```bash
REACT_APP_API_URL=http://localhost:5000/api
```

**New `.env`:**
```bash
REACT_APP_API_BASE_URL=http://localhost:8080
# or for Next.js:
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

### Step 2: Replace API Service

Replace your current API service (`lib/services/api.ts` or `client/src/services/api.js`) with the new `API_SERVICE_EXAMPLE.ts` provided.

### Step 3: Update Login Component

**Old Login:**
```javascript
const response = await authService.login(email, password);
localStorage.setItem('token', response.token);
```

**New Login:**
```javascript
import pingwiseApi from './services/api';

const response = await pingwiseApi.login({
  user_name: username,  // Changed from email
  password: password
});
// Token is automatically stored as 'access_token'
```

### Step 4: Update Component References

**Old:**
```javascript
import { patientService } from './services/api';

const patients = await patientService.getPatients();
```

**New:**
```javascript
import pingwiseApi from './services/api';

const customers = await pingwiseApi.getCustomers();
```

### Step 5: Update Field Names in Forms

- Change `email` to `user_name` in login forms
- Change `name` to `first_name` and `last_name` in customer forms
- Change `patient` to `customer_id` in appointment forms
- Combine `date` and `time` into `scheduled_at` (ISO format)

### Step 6: Update Dashboard Components

**Old:**
```javascript
const stats = await dashboardService.getStats();
```

**New:**
```javascript
const metrics = await pingwiseApi.getDailyMetrics();
// Response structure is different:
// { totalCustomers, totalAppointments, activeCustomers, bookedCustomers, followupCustomers }
```

---

## 📝 Code Examples

### Example 1: Login Flow

**Old:**
```javascript
// Login
const response = await api.post('/api/auth/login', {
  email: 'user@example.com',
  password: 'password'
});
localStorage.setItem('token', response.token);

// Use token
api.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
```

**New:**
```javascript
import pingwiseApi from './services/api';

// Login (token automatically stored)
const response = await pingwiseApi.login({
  user_name: 'username',
  password: 'password'
});
// Token stored as 'access_token' automatically

// Token automatically added to all requests via interceptor
```

### Example 2: Fetching Customers (formerly Patients)

**Old:**
```javascript
const { data } = await patientService.getPatients({
  page: 1,
  limit: 10,
  status: 'active'
});
```

**New:**
```javascript
// Note: New API might not support pagination query params
// You may need to implement client-side pagination
const customers = await pingwiseApi.getCustomers();
```

### Example 3: Creating Appointment

**Old:**
```javascript
await appointmentService.createAppointment({
  patient: patientId,
  doctor: doctorId,
  date: '2024-01-15',
  time: '10:00',
  type: 'Consultation',
  duration: 30,
  location: 'Room 101'
});
```

**New:**
```javascript
await pingwiseApi.createAppointment({
  customer_id: customerId,
  description: 'Regular checkup',
  status: 'confirmed',
  type: 'Consultation',
  scheduled_at: '2024-01-15T10:00:00Z', // ISO 8601 format
  duration: 30,
  location: 'Room 101',
  notes: 'Additional notes'
});
```

---

## ⚠️ Important Notes

1. **No Backend Implementation**: You're only configuring the frontend to use the new backend API
2. **Token Management**: The new API service automatically handles token storage and injection
3. **Error Handling**: 401 errors automatically redirect to login
4. **Date Formats**: Use ISO 8601 format (`YYYY-MM-DDTHH:mm:ssZ`) for dates
5. **Missing Features**: Some endpoints from old API might not exist in new API (e.g., `/dashboard/activity`)

---

## 🧪 Testing Checklist

- [ ] Update environment variables
- [ ] Replace API service file
- [ ] Test login flow (`user_name` instead of `email`)
- [ ] Test token storage (`access_token` instead of `token`)
- [ ] Test fetching customers (formerly patients)
- [ ] Test fetching users (formerly team)
- [ ] Test creating appointments (new field structure)
- [ ] Test dashboard metrics endpoint
- [ ] Verify error handling (401 redirects)
- [ ] Test all CRUD operations

---

## 📚 Additional Resources

- See `BACKEND_API_GUIDE.md` for complete API documentation
- See `API_SERVICE_EXAMPLE.ts` for ready-to-use API service implementation

