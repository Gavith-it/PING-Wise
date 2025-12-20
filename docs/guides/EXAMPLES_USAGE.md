# Practical Examples: How to Use the New API

This file shows you **exact code examples** of how to use the new backend API in your components.

---

## ✅ Step 1: Import the API Service

```typescript
import pingwiseApi from '@/lib/services/pingwiseApi';
```

---

## ✅ Step 2: Login Example

### Update your Login Page (`app/login/page.tsx`):

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import pingwiseApi from '@/lib/services/pingwiseApi';

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
      // ✅ Call the new API
      const response = await pingwiseApi.login({
        user_name: userName,  // ✅ Note: user_name, not email
        password: password
      });
      
      // Token is automatically stored by pingwiseApi
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Username"  // ✅ Changed from Email
          required
          className="w-full px-4 py-2 border rounded"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="w-full px-4 py-2 border rounded"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
```

---

## ✅ Step 3: Fetch Customers (formerly Patients)

### Example Component:

```typescript
'use client';

import { useEffect, useState } from 'react';
import pingwiseApi from '@/lib/services/pingwiseApi';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchCustomers() {
      try {
        // ✅ Fetch customers from new API
        const data = await pingwiseApi.getCustomers();
        setCustomers(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch customers');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCustomers();
  }, []);

  if (loading) return <div>Loading customers...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Customers</h1>
      <div className="grid gap-4">
        {customers.map((customer) => (
          <div key={customer.id} className="border p-4 rounded">
            <h3 className="font-semibold">
              {customer.first_name} {customer.last_name}
            </h3>
            <p>Email: {customer.email}</p>
            {customer.phone && <p>Phone: {customer.phone}</p>}
            {customer.age && <p>Age: {customer.age}</p>}
            {customer.status && <p>Status: {customer.status}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## ✅ Step 4: Create a Customer

```typescript
'use client';

import { useState } from 'react';
import pingwiseApi from '@/lib/services/pingwiseApi';
import toast from 'react-hot-toast';

export default function CreateCustomerForm() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    address: '',
    status: 'active',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ Create customer using new API
      const newCustomer = await pingwiseApi.createCustomer({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender || undefined,
        address: formData.address || undefined,
        status: formData.status,
      });

      toast.success('Customer created successfully!');
      
      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        age: '',
        gender: '',
        address: '',
        status: 'active',
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div>
        <label>First Name *</label>
        <input
          value={formData.first_name}
          onChange={(e) => setFormData({...formData, first_name: e.target.value})}
          required
          className="w-full px-4 py-2 border rounded"
        />
      </div>
      
      <div>
        <label>Last Name *</label>
        <input
          value={formData.last_name}
          onChange={(e) => setFormData({...formData, last_name: e.target.value})}
          required
          className="w-full px-4 py-2 border rounded"
        />
      </div>

      <div>
        <label>Email *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
          className="w-full px-4 py-2 border rounded"
        />
      </div>

      <div>
        <label>Phone</label>
        <input
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          className="w-full px-4 py-2 border rounded"
        />
      </div>

      <div>
        <label>Age</label>
        <input
          type="number"
          value={formData.age}
          onChange={(e) => setFormData({...formData, age: e.target.value})}
          className="w-full px-4 py-2 border rounded"
        />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-green-500 text-white py-2 rounded"
      >
        {loading ? 'Creating...' : 'Create Customer'}
      </button>
    </form>
  );
}
```

---

## ✅ Step 5: Create an Appointment

```typescript
'use client';

import { useState, useEffect } from 'react';
import pingwiseApi from '@/lib/services/pingwiseApi';
import toast from 'react-hot-toast';

export default function CreateAppointmentForm() {
  const [customers, setCustomers] = useState<any[]>([]);
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
  const [loading, setLoading] = useState(false);

  // Fetch customers for dropdown
  useEffect(() => {
    async function fetchCustomers() {
      try {
        const data = await pingwiseApi.getCustomers();
        setCustomers(data);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      }
    }
    fetchCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ Convert datetime-local to ISO format
      const scheduledAt = new Date(formData.scheduled_at).toISOString();

      const appointment = await pingwiseApi.createAppointment({
        customer_id: formData.customer_id,
        description: formData.description || undefined,
        status: formData.status,
        type: formData.type,
        scheduled_at: scheduledAt,  // ✅ ISO 8601 format
        duration: formData.duration,
        location: formData.location || undefined,
        notes: formData.notes || undefined,
      });

      toast.success('Appointment created successfully!');
      
      // Reset form
      setFormData({
        customer_id: '',
        description: '',
        status: 'confirmed',
        type: 'Consultation',
        scheduled_at: '',
        duration: 30,
        location: '',
        notes: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div>
        <label>Customer *</label>
        <select
          value={formData.customer_id}
          onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
          required
          className="w-full px-4 py-2 border rounded"
        >
          <option value="">Select a customer</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.first_name} {customer.last_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Date & Time *</label>
        <input
          type="datetime-local"
          value={formData.scheduled_at}
          onChange={(e) => setFormData({...formData, scheduled_at: e.target.value})}
          required
          className="w-full px-4 py-2 border rounded"
        />
      </div>

      <div>
        <label>Type</label>
        <input
          value={formData.type}
          onChange={(e) => setFormData({...formData, type: e.target.value})}
          className="w-full px-4 py-2 border rounded"
        />
      </div>

      <div>
        <label>Duration (minutes)</label>
        <input
          type="number"
          value={formData.duration}
          onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
          className="w-full px-4 py-2 border rounded"
        />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-blue-500 text-white py-2 rounded"
      >
        {loading ? 'Creating...' : 'Create Appointment'}
      </button>
    </form>
  );
}
```

---

## ✅ Step 6: Dashboard Metrics

```typescript
'use client';

import { useEffect, useState } from 'react';
import pingwiseApi from '@/lib/services/pingwiseApi';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    async function fetchMetrics() {
      try {
        // ✅ Fetch metrics - if date provided, use it; otherwise today
        const data = await pingwiseApi.getDailyMetrics(
          selectedDate || undefined
        );
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, [selectedDate]);

  if (loading) return <div>Loading dashboard...</div>;
  if (!metrics) return <div>No data available</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      
      <div className="mb-4">
        <label>Select Date (optional):</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="ml-2 px-4 py-2 border rounded"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-blue-100 p-4 rounded">
          <h3 className="font-semibold">Total Customers</h3>
          <p className="text-2xl">{metrics.totalCustomers}</p>
        </div>
        
        <div className="bg-green-100 p-4 rounded">
          <h3 className="font-semibold">Total Appointments</h3>
          <p className="text-2xl">{metrics.totalAppointments}</p>
        </div>
        
        <div className="bg-yellow-100 p-4 rounded">
          <h3 className="font-semibold">Active Customers</h3>
          <p className="text-2xl">{metrics.activeCustomers}</p>
        </div>
        
        <div className="bg-purple-100 p-4 rounded">
          <h3 className="font-semibold">Booked Customers</h3>
          <p className="text-2xl">{metrics.bookedCustomers}</p>
        </div>
        
        <div className="bg-pink-100 p-4 rounded">
          <h3 className="font-semibold">Follow-up Customers</h3>
          <p className="text-2xl">{metrics.followupCustomers}</p>
        </div>
      </div>
    </div>
  );
}
```

---

## ✅ Step 7: Update AuthContext

Update your `contexts/AuthContext.tsx`:

```typescript
'use client';

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import pingwiseApi from '@/lib/services/pingwiseApi';

interface AuthContextType {
  user: any | null;
  token: string | null;
  loading: boolean;
  login: (userName: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === 'undefined') return;
      
      // ✅ Check for access_token (new key)
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) {
        try {
          // ✅ Validate token using new API
          await pingwiseApi.validateToken();
          setToken(storedToken);
          // Note: You might need to fetch user separately if API doesn't return it
        } catch (error) {
          console.error('Token validation failed:', error);
          pingwiseApi.removeToken();
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (userName: string, password: string): Promise<boolean> => {
    try {
      // ✅ Use new API
      const response = await pingwiseApi.login({
        user_name: userName,
        password: password
      });

      if (response.access_token) {
        setToken(response.access_token);
        // Token is already stored by pingwiseApi
        toast.success('Login successful!');
        return true;
      } else {
        toast.error('Login failed');
        return false;
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please try again.');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    pingwiseApi.logout(); // ✅ Uses new API logout
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## 🎯 Quick Summary

1. **Import**: `import pingwiseApi from '@/lib/services/pingwiseApi';`
2. **Login**: `await pingwiseApi.login({ user_name: '...', password: '...' })`
3. **Fetch**: `await pingwiseApi.getCustomers()`
4. **Create**: `await pingwiseApi.createCustomer({ first_name: '...', ... })`
5. **Update**: `await pingwiseApi.updateCustomer(id, { ... })`
6. **Delete**: `await pingwiseApi.deleteCustomer(id)`

That's it! The API service handles token management automatically. 🚀

