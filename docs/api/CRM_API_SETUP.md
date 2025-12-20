# CRM API Integration Setup

This document explains how to set up and use the CRM API integration in the CRM page.

## Environment Variables

Create or update your `.env.local` file in the root directory with:

```env
# CRM API Configuration
NEXT_PUBLIC_CRM_API_BASE_URL=https://pw-crm-gateway-1.onrender.com
```

**Note:** If not set, it defaults to `https://pw-crm-gateway-1.onrender.com`

## Authentication

The CRM API uses JWT Bearer token authentication. After logging in via `/login`, the token is automatically stored in `sessionStorage` as `crm_access_token` and `access_token`.

### Login Flow

1. Call `crmApi.login({ user_name: 'username', password: 'password' })`
2. Token is automatically stored
3. All subsequent requests include `Authorization: Bearer <token>` header

## API Endpoints

The CRM API service (`lib/services/crmApi.ts`) provides access to:

### Authentication
- `login()` - POST /login
- `checkAuth()` - POST /checkAuth

### Customers (Mapped to Patients in UI)
- `getCustomers()` - GET /customers
- `getCustomer(id)` - GET /customers/{id}
- `createCustomer(data)` - POST /customers
- `updateCustomer(id, data)` - PUT /customers/{id}
- `deleteCustomer(id)` - DELETE /customers/{id}

### Teams
- `getTeams()` - GET /teams
- `getTeam(id)` - GET /teams/{id}
- `createTeam(data)` - POST /teams
- `updateTeam(id, data)` - PUT /teams/{id}
- `deleteTeam(id)` - DELETE /teams/{id}

### Users
- `getUsers()` - GET /users
- `getUser(id)` - GET /users/{id}
- `createUser(data)` - POST /users
- `updateUser(id, data)` - PUT /users/{id}
- `deleteUser(id)` - DELETE /users/{id}

### Templates
- `getTemplates(orgId?, limit?)` - GET /templates
- `getTemplate(id)` - GET /templates/{id}
- `createTemplate(data)` - POST /templates
- `updateTemplate(id, data)` - PUT /templates/{id}
- `deleteTemplate(id)` - DELETE /templates/{id}

### Reports
- `getDailyReport(date?)` - GET /reports/daily

## Data Mapping

The CRM API uses a different data model than the UI:

### Customer vs Patient

**CRM API Customer:**
- `first_name`, `last_name` (separate fields)
- `id` (string)
- `medical_history` (object)

**UI Patient:**
- `name` (single field)
- `id` (string)
- `medicalNotes` (string)

The adapter (`lib/utils/crmAdapter.ts`) automatically converts between these models:
- `crmCustomerToPatient()` - Converts API customer to UI patient
- `patientToCrmCustomer()` - Converts UI patient to API customer

## Using the CRM Page

The CRM page (`app/crm/page.tsx`) uses `crmPatientService` which:
1. Calls the CRM API
2. Converts data using the adapter
3. Provides the same interface as the regular `patientService`

### Features

✅ **Supported:**
- List customers (patients)
- View customer details
- Create new customer
- Update customer
- Delete customer
- Search and filter
- Pagination

❌ **Not Supported:**
- Bulk upload (CRM API doesn't support this feature)

## Type Safety

All types are defined in:
- `types/crmApi.ts` - CRM API types
- `types/index.ts` - UI types

The service layer ensures type safety throughout the application.

## Error Handling

The CRM API service includes automatic error handling:
- 401 Unauthorized → Token cleared, redirect to login
- Other errors → Logged to console, passed to UI for display

## Testing

To test the integration:

1. Make sure environment variable is set
2. Navigate to `/crm` page
3. The page will attempt to fetch customers from the CRM API
4. If not authenticated, you'll need to login first

## Troubleshooting

**Issue: CORS errors**
- The CRM API must allow requests from your domain
- Check CORS settings on the API server

**Issue: 401 Unauthorized**
- Token may be expired or invalid
- Try logging in again
- Check that token is stored in sessionStorage

**Issue: Network errors**
- Verify `NEXT_PUBLIC_CRM_API_BASE_URL` is correct
- Check that the API server is running
- Check browser console for detailed error messages

