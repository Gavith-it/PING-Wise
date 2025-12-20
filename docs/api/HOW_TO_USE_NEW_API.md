# How to Use the New Backend API - Step by Step Guide

This guide shows you **exactly** how to use the new API that your client provided.

---

## 🎯 Step 1: Update Your API Service File

Replace your current `lib/services/api.ts` with the new API configuration.

### What to Change:

**Current (Old):**
```typescript
const api = axios.create({
  baseURL: '/api',  // ❌ Wrong - uses Next.js API routes
  ...
});
```

**New:**
```typescript
const api = axios.create({
  baseURL: 'http://localhost:8080',  // ✅ New backend API
  ...
});
```

### Complete Updated File:

I'll create the updated version for you. See Step 2.

---

## 🎯 Step 2: Update Login to Use `user_name` Instead of `email`

### In `contexts/AuthContext.tsx`:

**Change this:**
```typescript
const login = async (email: string, password: string): Promise<boolean> => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),  // ❌ Wrong field name
  });
  // ...
}
```

**To this:**
```typescript
const login = async (userName: string, password: string): Promise<boolean> => {
  const response = await fetch('http://localhost:8080/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_name: userName, password }),  // ✅ Correct
  });
  
  const data = await response.json();
  
  if (data.access_token) {  // ✅ New API returns 'access_token'
    localStorage.setItem('access_token', data.access_token);  // ✅ Store as 'access_token'
    setToken(data.access_token);
    // Note: New API doesn't return user object, you might need to fetch it separately
    toast.success('Login successful!');
    return true;
  } else {
    toast.error('Login failed');
    return false;
  }
}
```

---

## 🎯 Step 3: Update Login Page

### In `app/login/page.tsx`:

**Change the form field:**
```typescript
// OLD:
const [email, setEmail] = useState('');

<input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="doctor@clinic.com"
/>

// NEW:
const [userName, setUserName] = useState('');

<input
  type="text"
  value={userName}
  onChange={(e) => setUserName(e.target.value)}
  placeholder="username"
/>
```

**Update the submit handler:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const success = await login(userName, password);  // ✅ Use userName
  // ...
}
```

---

## 🎯 Step 4: Update Token Storage Key

**Change everywhere you use:**
- `localStorage.getItem('token')` → `localStorage.getItem('access_token')`
- `localStorage.setItem('token', ...)` → `localStorage.setItem('access_token', ...)`
- `localStorage.removeItem('token')` → `localStorage.removeItem('access_token')`

---

## 🎯 Step 5: Update API Service Methods

### Example: Fetching Customers (formerly Patients)

**OLD way:**
```typescript
import { patientService } from '@/lib/services/api';

const patients = await patientService.getPatients();
```

**NEW way:**
```typescript
import pingwiseApi from '@/lib/services/api';

const customers = await pingwiseApi.getCustomers();
```

### Example: Creating a Customer

**OLD way:**
```typescript
await patientService.createPatient({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
});
```

**NEW way:**
```typescript
await pingwiseApi.createCustomer({
  first_name: 'John',      // ✅ Split name
  last_name: 'Doe',        // ✅ Split name
  email: 'john@example.com',
  phone: '+1234567890',
  age: 30,
  gender: 'male',
  status: 'active',
});
```

---

## 🎯 Step 6: Practical Examples

### Example 1: Login Component (Complete)

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import pingwiseApi from '@/lib/services/api';

export default function LoginPage() {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userName || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      // ✅ Use new API
      const response = await pingwiseApi.login({
        user_name: userName,
        password: password
      });
      
      // Token is automatically stored by pingwiseApi
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
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
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### Example 2: Fetching Customers List

```typescript
'use client';

import { useEffect, useState } from 'react';
import pingwiseApi from '@/lib/services/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        // ✅ Use new API
        const data = await pingwiseApi.getCustomers();
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
      <h1>Customers</h1>
      {customers.map((customer: any) => (
        <div key={customer.id}>
          <h3>{customer.first_name} {customer.last_name}</h3>
          <p>Email: {customer.email}</p>
          <p>Phone: {customer.phone}</p>
        </div>
      ))}
    </div>
  );
}
```

### Example 3: Creating a Customer

```typescript
'use client';

import { useState } from 'react';
import pingwiseApi from '@/lib/services/api';
import toast from 'react-hot-toast';

export default function CreateCustomerForm() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    status: 'active',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // ✅ Use new API
      const newCustomer = await pingwiseApi.createCustomer({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender || undefined,
        status: formData.status,
      });
      
      toast.success('Customer created successfully!');
      // Reset form or redirect
    } catch (error: any) {
      toast.error(error.message || 'Failed to create customer');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.first_name}
        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
        placeholder="First Name"
        required
      />
      <input
        value={formData.last_name}
        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
        placeholder="Last Name"
        required
      />
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        placeholder="Email"
        required
      />
      <button type="submit">Create Customer</button>
    </form>
  );
}
```

### Example 4: Creating an Appointment

```typescript
'use client';

import { useState } from 'react';
import pingwiseApi from '@/lib/services/api';
import toast from 'react-hot-toast';

export default function CreateAppointmentForm() {
  const [formData, setFormData] = useState({
    customer_id: '',
    description: '',
    status: 'confirmed',
    type: 'Consultation',
    scheduled_at: '',
    duration: 30,
    location: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // ✅ Convert date/time to ISO format
      const scheduledAt = new Date(formData.scheduled_at).toISOString();
      
      const appointment = await pingwiseApi.createAppointment({
        customer_id: formData.customer_id,
        description: formData.description,
        status: formData.status,
        type: formData.type,
        scheduled_at: scheduledAt,  // ✅ ISO 8601 format
        duration: formData.duration,
        location: formData.location,
        notes: formData.notes,
      });
      
      toast.success('Appointment created!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create appointment');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.customer_id}
        onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
        placeholder="Customer ID"
        required
      />
      <input
        type="datetime-local"
        value={formData.scheduled_at}
        onChange={(e) => setFormData({...formData, scheduled_at: e.target.value})}
        required
      />
      <button type="submit">Create Appointment</button>
    </form>
  );
}
```

### Example 5: Dashboard Metrics

```typescript
'use client';

import { useEffect, useState } from 'react';
import pingwiseApi from '@/lib/services/api';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        // ✅ Use new API - no date = today
        const data = await pingwiseApi.getDailyMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!metrics) return <div>No data</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      <div>
        <p>Total Customers: {metrics.totalCustomers}</p>
        <p>Total Appointments: {metrics.totalAppointments}</p>
        <p>Active Customers: {metrics.activeCustomers}</p>
        <p>Booked Customers: {metrics.bookedCustomers}</p>
        <p>Follow-up Customers: {metrics.followupCustomers}</p>
      </div>
    </div>
  );
}
```

---

## 🎯 Quick Reference: API Method Calls

```typescript
import pingwiseApi from '@/lib/services/api';

// ✅ Authentication
await pingwiseApi.login({ user_name: 'admin', password: 'pass' });
await pingwiseApi.validateToken();
pingwiseApi.logout();

// ✅ Health Check
await pingwiseApi.getHealth();

// ✅ Organizations
await pingwiseApi.getOrganizations();
await pingwiseApi.getOrganization(id);
await pingwiseApi.createOrganization({ name: 'Clinic', ... });
await pingwiseApi.updateOrganization(id, { name: 'New Name', ... });
await pingwiseApi.deleteOrganization(id);

// ✅ Users
await pingwiseApi.getUsers();
await pingwiseApi.getUser(id);
await pingwiseApi.createUser({ user_name: 'user', password: 'pass', ... });
await pingwiseApi.updateUser(id, { user_name: 'newuser', ... });
await pingwiseApi.deleteUser(id);

// ✅ Customers
await pingwiseApi.getCustomers();
await pingwiseApi.getCustomer(id);
await pingwiseApi.createCustomer({ first_name: 'John', last_name: 'Doe', ... });
await pingwiseApi.updateCustomer(id, { first_name: 'Jane', ... });
await pingwiseApi.deleteCustomer(id);

// ✅ Appointments
await pingwiseApi.getAppointments();
await pingwiseApi.getAppointment(id);
await pingwiseApi.createAppointment({ customer_id: '123', scheduled_at: '2024-01-15T10:00:00Z', ... });
await pingwiseApi.updateAppointment(id, { status: 'completed', ... });
await pingwiseApi.deleteAppointment(id);

// ✅ Dashboard
await pingwiseApi.getDailyMetrics();  // Today
await pingwiseApi.getDailyMetrics('2024-01-15');  // Specific date
```

---

## ⚠️ Important Notes

1. **Base URL**: Always use `http://localhost:8080` (not `/api`)
2. **Token Storage**: Use `access_token` key (not `token`)
3. **Login Field**: Use `user_name` (not `email`)
4. **Date Format**: Use ISO 8601 format: `2024-01-15T10:00:00Z`
5. **Error Handling**: 401 errors automatically redirect to login

---

## 🧪 Testing Your Integration

1. **Test Login:**
   ```typescript
   const response = await pingwiseApi.login({
     user_name: 'testuser',
     password: 'testpass'
   });
   console.log('Token:', response.access_token);
   ```

2. **Test Fetching Data:**
   ```typescript
   const customers = await pingwiseApi.getCustomers();
   console.log('Customers:', customers);
   ```

3. **Check Token Storage:**
   ```typescript
   console.log('Stored token:', localStorage.getItem('access_token'));
   ```

---

## 🚀 Next Steps

1. ✅ Update `lib/services/api.ts` with new backend URL
2. ✅ Update login to use `user_name`
3. ✅ Update token storage key to `access_token`
4. ✅ Update components to use new API methods
5. ✅ Test each endpoint
6. ✅ Handle errors appropriately

That's it! You're now using the new backend API! 🎉

