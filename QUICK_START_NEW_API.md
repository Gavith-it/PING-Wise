# Quick Start: Using the New Backend API

## 🚀 3 Steps to Get Started

### Step 1: Use the New API Service File

I've created a new API service file for you: **`lib/services/pingwiseApi.ts`**

This file is ready to use! It connects to `http://localhost:8080` (the new backend).

### Step 2: Update Your Environment Variable

Create or update your `.env.local` file:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

### Step 3: Use It in Your Components

```typescript
import pingwiseApi from '@/lib/services/pingwiseApi';

// Login
await pingwiseApi.login({ user_name: 'admin', password: 'pass123' });

// Get customers
const customers = await pingwiseApi.getCustomers();

// Create customer
await pingwiseApi.createCustomer({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com'
});
```

---

## 📝 Key Changes from Old API

| Old | New |
|-----|-----|
| `email` | `user_name` |
| `token` (localStorage) | `access_token` (localStorage) |
| `/api/auth/login` | `/login` |
| `patientService` | `pingwiseApi.getCustomers()` |
| `http://localhost:5000/api` | `http://localhost:8080` |

---

## 📚 Documentation Files

1. **HOW_TO_USE_NEW_API.md** - Step-by-step guide
2. **EXAMPLES_USAGE.md** - Complete code examples
3. **BACKEND_API_GUIDE.md** - Full API documentation
4. **API_SERVICE_EXAMPLE.ts** - Reference implementation

---

## ✅ What's Ready

- ✅ API service file created (`lib/services/pingwiseApi.ts`)
- ✅ All endpoints implemented
- ✅ Token management automatic
- ✅ Error handling built-in
- ✅ TypeScript types included

---

## 🎯 Next Steps

1. Read **HOW_TO_USE_NEW_API.md** for detailed instructions
2. Check **EXAMPLES_USAGE.md** for code examples
3. Update your login page to use `user_name` instead of `email`
4. Update components to use `pingwiseApi` instead of old services
5. Test each endpoint

---

## 💡 Remember

- Backend is already running on port 8080
- You're just configuring your frontend to use it
- Token is automatically stored and sent with requests
- 401 errors automatically redirect to login

That's it! Start using the new API! 🎉

