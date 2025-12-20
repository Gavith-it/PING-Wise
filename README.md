# PingWise - Medical Clinic Management System

A comprehensive medical clinic management system built with Next.js 14, TypeScript, and MongoDB.

## 🚀 Features

- ✅ **Dashboard** - KPIs, charts, and today's appointments  
- ✅ **Patient Management** - CRUD operations, search, filtering  
- ✅ **Appointments** - Calendar view, scheduling, management  
- ✅ **Campaigns** - Send messages to patients  
- ✅ **Team Management** - Staff and doctor management  
- ✅ **Responsive Design** - Works on mobile and desktop  
- ✅ **Secure** - JWT authentication, input validation  
- ✅ **TypeScript** - Full type safety
- ✅ **Performance** - Optimized with Next.js 14
- ✅ **Error Handling** - React Error Boundaries for graceful error recovery
- ✅ **Logging** - Centralized logging utility for development and production

## 🛠️ Tech Stack

**Frontend & Backend:**
- Next.js 14 (App Router)
- TypeScript
- React 18
- Tailwind CSS
- MongoDB + Mongoose
- JWT Authentication
- Axios for API calls

**Security:**
- Helmet.js security headers
- Rate limiting
- Input validation
- JWT token authentication

## 📋 Prerequisites

- Node.js (v18+)
- MongoDB running locally or MongoDB Atlas account

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory. See [Environment Variables Guide](docs/guides/ENVIRONMENT_VARIABLES.md) for detailed information.

**Minimum required variables:**

```env
MONGODB_URI=mongodb://localhost:27017/pingwise
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRE=7d
NODE_ENV=development
NEXT_PUBLIC_CRM_API_BASE_URL=https://pw-crm-gateway-1.onrender.com
```

### 3. Start MongoDB

**Local MongoDB:**
```bash
# Windows: MongoDB should start automatically as a service
# Mac/Linux:
mongod
```

**Or use MongoDB Atlas (Cloud):**
- Sign up at https://www.mongodb.com/cloud/atlas
- Create a free cluster
- Get connection string
- Update `MONGODB_URI` in `.env.local`

### 4. Run the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

The application will be available at http://localhost:3000

### 5. Create Your First User

Open http://localhost:3000/login and register a new account, or use the API:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Admin",
    "email": "admin@clinic.com",
    "password": "admin123",
    "role": "admin"
  }'
```

---

## 📁 Project Structure

```
PING/
├── app/                    # Next.js App Router
│   ├── api/               # Backend API Routes
│   ├── dashboard/         # Dashboard page
│   ├── login/             # Login page
│   ├── crm/               # CRM/Patients page
│   ├── appointments/      # Appointments page
│   ├── campaigns/         # Campaigns page
│   ├── team/              # Team page
│   ├── wallet/            # Wallet page
│   ├── profile/           # Profile page
│   ├── settings/          # Settings pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React Components
│   ├── ui/                # UI components
│   ├── modals/            # Modal components
│   ├── charts/            # Chart components
│   ├── Header.tsx
│   ├── Layout.tsx
│   └── PrivateRoute.tsx
├── contexts/              # React Contexts
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── NotificationContext.tsx
├── lib/                   # Utilities
│   ├── services/          # API services
│   ├── models/            # Database models
│   ├── middleware/        # Middleware
│   └── utils/             # Utilities
├── types/                 # TypeScript types
├── docs/                  # Documentation
└── public/                # Static assets
```

---

## 📁 Complete Project Structure & Code Mapping

This section provides a detailed mapping of every page, its code location, components used, and backend API connections.

### 📂 Root Directory Structure

```
PING/
├── app/                          # Next.js App Router (Pages & API Routes)
│   ├── api/                     # Backend API Routes (Server-side)
│   ├── [pages]/                 # Frontend Pages (Client-side)
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Home/landing page
│   └── globals.css              # Global styles
├── components/                   # Reusable React Components
│   ├── ui/                      # UI components (buttons, inputs, etc.)
│   ├── modals/                  # Modal components
│   ├── charts/                  # Chart components
│   ├── Header.tsx               # Main header component
│   ├── Layout.tsx               # Page layout wrapper
│   ├── PrivateRoute.tsx        # Auth protection wrapper
│   └── ErrorBoundary.tsx        # Error handling component
├── contexts/                    # React Context Providers
│   ├── AuthContext.tsx          # Authentication state
│   ├── ThemeContext.tsx         # Theme management
│   ├── NotificationContext.tsx  # Notifications state
│   └── FooterVisibilityContext.tsx
├── lib/                         # Core utilities & business logic
│   ├── services/                # API service layers
│   ├── models/                  # Database models (Mongoose)
│   ├── middleware/              # Auth middleware
│   └── utils/                    # Helper functions
├── types/                       # TypeScript type definitions
├── docs/                        # Documentation
└── public/                      # Static assets
```

---

## 🗺️ Page-by-Page Code Mapping

### 1. **Home Page** (`/`)
- **File Location**: `app/page.tsx`
- **Purpose**: Landing page that redirects based on authentication status
- **Components Used**:
  - Uses `useAuth` from `contexts/AuthContext.tsx`
  - Uses `useRouter` from Next.js
- **Backend API Calls**: None (client-side redirect only)
- **Flow**:
  1. Checks authentication status
  2. Redirects to `/dashboard` if authenticated
  3. Redirects to `/login` if not authenticated

---

### 2. **Login Page** (`/login`)
- **File Location**: `app/login/page.tsx`
- **Purpose**: User authentication
- **Components Used**:
  - `Layout` from `components/Layout.tsx`
  - `useAuth` from `contexts/AuthContext.tsx`
- **Backend API Calls**:
  - **Service**: `authService.login()` from `lib/services/api.ts`
  - **API Route**: `POST /api/auth/login` → `app/api/auth/login/route.ts`
  - **External API**: Proxies to `NEXT_PUBLIC_CRM_API_BASE_URL/login`
- **Data Flow**:
  ```
  User Input → authService.login() → /api/auth/login → External CRM API
  Response → AuthContext (stores token) → Redirect to /dashboard
  ```

---

### 3. **Dashboard Page** (`/dashboard`)
- **File Location**: `app/dashboard/page.tsx`
- **Purpose**: Main dashboard with KPIs, charts, and today's appointments
- **Components Used**:
  - `Layout` from `components/Layout.tsx`
  - `PrivateRoute` from `components/PrivateRoute.tsx`
  - `ActivityChart` from `components/charts/ActivityChart.tsx`
  - `AppointmentModal` from `components/modals/AppointmentModal.tsx`
  - `PatientModal` from `components/modals/PatientModal.tsx`
  - `FloatingButton` from `components/ui/floating-button.tsx`
- **Backend API Calls**:
  - **Services Used**:
    - `dashboardService.getStats()` → `GET /api/dashboard/stats`
    - `dashboardService.getActivity()` → `GET /api/dashboard/activity`
    - `dashboardService.getTodayAppointments()` → `GET /api/dashboard/today-appointments`
    - `walletService.getBalance()` → `GET /api/wallet/balance`
    - `patientService.getPatients()` → `GET /api/patients`
    - `teamService.getTeamMembers()` → `GET /api/team`
  - **API Routes**:
    - `app/api/dashboard/stats/route.ts`
    - `app/api/dashboard/activity/route.ts`
    - `app/api/dashboard/today-appointments/route.ts`
    - `app/api/wallet/balance/route.ts`
    - `app/api/patients/route.ts`
    - `app/api/team/route.ts`
- **Data Flow**:
  ```
  Page Load → Multiple API calls in parallel
  → Dashboard Stats (KPIs)
  → Activity Data (for charts)
  → Today's Appointments
  → Wallet Balance
  → Display in UI with charts and cards
  ```

---

### 4. **CRM/Patients Page** (`/crm`)
- **File Location**: `app/crm/page.tsx`
- **Purpose**: Patient management (CRUD operations)
- **Components Used**:
  - `Layout` from `components/Layout.tsx`
  - `PrivateRoute` from `components/PrivateRoute.tsx`
  - `CRMPatientModal` from `components/modals/CRMPatientModal.tsx`
  - `PatientDetailsModal` from `components/modals/PatientDetailsModal.tsx`
  - `FilterModal` from `components/modals/FilterModal.tsx`
- **Backend API Calls**:
  - **Service**: `crmPatientService` from `lib/services/crmPatientService.ts`
  - **API Routes** (via proxy):
    - `GET /api/crm/customers` → `app/api/crm/[...path]/route.ts` → External CRM API
    - `POST /api/crm/customers` → `app/api/crm/[...path]/route.ts` → External CRM API
    - `PUT /api/crm/customers/:id` → `app/api/crm/[...path]/route.ts` → External CRM API
    - `DELETE /api/crm/customers/:id` → `app/api/crm/[...path]/route.ts` → External CRM API
  - **External API**: `NEXT_PUBLIC_CRM_API_BASE_URL/customers`
- **Data Flow**:
  ```
  Page Load → crmPatientService.getPatients()
  → /api/crm/customers (proxy)
  → External CRM API
  → Display patients list
  → CRUD operations via modals
  ```

---

### 5. **Appointments Page** (`/appointments`)
- **File Location**: `app/appointments/page.tsx`
- **Purpose**: Calendar view and appointment management
- **Components Used**:
  - `Layout` from `components/Layout.tsx`
  - `PrivateRoute` from `components/PrivateRoute.tsx`
  - `AppointmentModal` from `components/modals/AppointmentModal.tsx`
  - `patientService`, `teamService` for form data
- **Backend API Calls**:
  - **Services**:
    - `appointmentService.getAppointments()` → `GET /api/appointments`
    - `appointmentService.createAppointment()` → `POST /api/appointments`
    - `appointmentService.updateAppointment()` → `PUT /api/appointments/:id`
    - `appointmentService.cancelAppointment()` → `DELETE /api/appointments/:id`
    - `patientService.getPatients()` → `GET /api/patients` (for modal)
    - `teamService.getTeamMembers()` → `GET /api/team` (for modal)
  - **API Routes**:
    - `app/api/appointments/route.ts` (GET, POST)
    - `app/api/appointments/[id]/route.ts` (GET, PUT, DELETE)
    - `app/api/patients/route.ts`
    - `app/api/team/route.ts`
- **Data Flow**:
  ```
  Page Load → Load appointments for selected date
  → Calendar navigation → Load appointments for new date
  → Create/Edit/Delete via modals
  → Refresh appointment list
  ```

---

### 6. **Campaigns Page** (`/campaigns`)
- **File Location**: `app/campaigns/page.tsx`
- **Purpose**: Create and manage marketing campaigns
- **Components Used**:
  - `Layout` from `components/Layout.tsx`
  - `PrivateRoute` from `components/PrivateRoute.tsx`
  - `TagSelectorModal` from `components/modals/TagSelectorModal.tsx`
  - `ScheduleModal` from `components/modals/ScheduleModal.tsx`
- **Backend API Calls**:
  - **Services**:
    - `campaignApi` from `lib/services/campaignApi.ts`
    - `templateApi` from `lib/services/templateApi.ts`
  - **API Routes** (via proxy):
    - `GET /api/campaigns` → `app/api/campaigns/route.ts` → External Campaign API
    - `POST /api/campaigns` → `app/api/campaigns/route.ts` → External Campaign API
    - `GET /api/campaigns/:id` → `app/api/campaigns/[id]/route.ts` → External Campaign API
    - `PUT /api/campaigns/:id` → `app/api/campaigns/[id]/route.ts` → External Campaign API
    - `DELETE /api/campaigns/:id` → `app/api/campaigns/[id]/route.ts` → External Campaign API
    - `POST /api/campaigns/:id/send` → `app/api/campaigns/[id]/send/route.ts` → External Campaign API
    - `GET /api/templates` → `app/api/templates/route.ts` → External Template API
  - **External APIs**: 
    - Campaign API via `NEXT_PUBLIC_CRM_API_BASE_URL`
    - Template API via `NEXT_PUBLIC_CRM_API_BASE_URL`
- **Data Flow**:
  ```
  Page Load → Load campaigns and templates
  → Create campaign with tags/recipients
  → Schedule or send immediately
  → Track campaign status
  ```

---

### 7. **Team Page** (`/team`)
- **File Location**: `app/team/page.tsx`
- **Purpose**: Team member management
- **Components Used**:
  - `Layout` from `components/Layout.tsx`
  - `PrivateRoute` from `components/PrivateRoute.tsx`
  - `TeamModal` from `components/modals/TeamModal.tsx`
  - `TeamMemberDetailsModal` from `components/modals/TeamMemberDetailsModal.tsx`
  - `TeamFilterModal` from `components/modals/TeamFilterModal.tsx`
  - `StarRating` from `components/ui/star-rating.tsx`
- **Backend API Calls**:
  - **Services**:
    - `teamApi` from `lib/services/teamApi.ts`
    - `appointmentService.getAppointments()` → For appointment counts
  - **API Routes** (via proxy):
    - `GET /api/teams` → `app/api/teams/route.ts` → External Team API
    - `POST /api/teams` → `app/api/teams/route.ts` → External Team API
    - `GET /api/teams/:id` → `app/api/teams/[...path]/route.ts` → External Team API
    - `PUT /api/teams/:id` → `app/api/teams/[...path]/route.ts` → External Team API
    - `DELETE /api/teams/:id` → `app/api/teams/[...path]/route.ts` → External Team API
    - `GET /api/appointments` → For appointment statistics
  - **External API**: Team API via `NEXT_PUBLIC_CRM_API_BASE_URL`
- **Data Flow**:
  ```
  Page Load → Load team members
  → Filter/search team members
  → View details, edit, or delete
  → Load appointment counts for each member
  ```

---

### 8. **Wallet Page** (`/wallet`)
- **File Location**: `app/wallet/page.tsx`
- **Purpose**: Wallet balance and transaction history
- **Components Used**:
  - `Layout` from `components/Layout.tsx`
  - `PrivateRoute` from `components/PrivateRoute.tsx`
- **Backend API Calls**:
  - **Service**: `walletService` from `lib/services/api.ts`
  - **API Route**:
    - `GET /api/wallet/balance` → `app/api/wallet/balance/route.ts`
  - **Note**: Transaction history API pending implementation
- **Data Flow**:
  ```
  Page Load → Load wallet balance
  → Display balance and mock transactions
  → Add funds (pending API implementation)
  ```

---

### 9. **Profile Page** (`/profile`)
- **File Location**: `app/profile/page.tsx`
- **Purpose**: User profile view
- **Components Used**:
  - `Layout` from `components/Layout.tsx`
  - `PrivateRoute` from `components/PrivateRoute.tsx`
  - `useAuth` from `contexts/AuthContext.tsx`
- **Backend API Calls**: None (uses data from AuthContext)
- **Data Flow**:
  ```
  Page Load → Get user data from AuthContext
  → Display user information
  → Edit profile (pending implementation)
  ```

---

### 10. **Settings Pages**
- **Main Settings** (`/settings`)
  - **File Location**: `app/settings/page.tsx`
  - **Purpose**: Settings menu
- **Premium** (`/settings/premium`)
  - **File Location**: `app/settings/premium/page.tsx`
  - **Purpose**: Premium subscription (pending API)
- **Refer and Win** (`/settings/refer-and-win`)
  - **File Location**: `app/settings/refer-and-win/page.tsx`
  - **Purpose**: Referral program

---

## 🔌 Backend API Routes Structure

### Authentication APIs
```
app/api/auth/
├── login/route.ts          → POST /api/auth/login
├── register/route.ts       → POST /api/auth/register
└── me/route.ts             → GET /api/auth/me
```

### Dashboard APIs
```
app/api/dashboard/
├── stats/route.ts                    → GET /api/dashboard/stats
├── activity/route.ts                 → GET /api/dashboard/activity
└── today-appointments/route.ts       → GET /api/dashboard/today-appointments
```

### Patient APIs
```
app/api/patients/
├── route.ts              → GET, POST /api/patients
└── [id]/route.ts         → GET, PUT, DELETE /api/patients/:id
```

### Appointment APIs
```
app/api/appointments/
├── route.ts              → GET, POST /api/appointments
└── [id]/route.ts         → GET, PUT, DELETE /api/appointments/:id
```

### Campaign APIs (Proxy to External API)
```
app/api/campaigns/
├── route.ts              → GET, POST /api/campaigns
├── [id]/route.ts         → GET, PUT, DELETE /api/campaigns/:id
├── [id]/send/route.ts    → POST /api/campaigns/:id/send
└── [...path]/route.ts    → Proxy all other routes
```

### CRM APIs (Proxy to External API)
```
app/api/crm/
├── login/route.ts        → POST /api/crm/login
├── checkAuth/route.ts    → POST /api/crm/checkAuth
└── [...path]/route.ts    → Proxy all CRM routes
```

### Team APIs (Proxy to External API)
```
app/api/teams/
├── route.ts              → GET, POST /api/teams
└── [...path]/route.ts    → Proxy all team routes
```

### Template APIs (Proxy to External API)
```
app/api/templates/
├── route.ts              → GET /api/templates
└── [...path]/route.ts    → Proxy all template routes
```

### Wallet APIs
```
app/api/wallet/
└── balance/route.ts      → GET /api/wallet/balance
```

---

## 🔄 Service Layer Architecture

### Service Files Location
All services are in `lib/services/`:

1. **`api.ts`** - Main API service with Axios instance
   - `authService` - Authentication
   - `patientService` - Patient management
   - `appointmentService` - Appointments
   - `campaignService` - Campaigns (legacy)
   - `teamService` - Team management (legacy)
   - `dashboardService` - Dashboard data
   - `walletService` - Wallet operations

2. **`crmApi.ts`** - CRM API service (external API)
   - Direct calls to external CRM API

3. **`crmPatientService.ts`** - Patient service for CRM
   - Wrapper around CRM API for patients

4. **`campaignApi.ts`** - Campaign API service
   - External campaign API integration

5. **`teamApi.ts`** - Team API service
   - External team API integration

6. **`templateApi.ts`** - Template API service
   - External template API integration

7. **`pingwiseApi.ts`** - PingWise API service
   - Additional API integrations

### Service Flow
```
Frontend Page
    ↓
Service Layer (lib/services/)
    ↓
API Route (app/api/)
    ↓
External API or Database
```

---

## 🧩 Component Architecture

### Layout Components
- **`app/layout.tsx`** - Root layout with providers
  - Wraps entire app
  - Includes: ErrorBoundary, ThemeProvider, AuthProvider, etc.

- **`components/Layout.tsx`** - Page layout wrapper
  - Includes: Header, BottomNav, Footer visibility

### Shared Components
- **`components/Header.tsx`** - Main navigation header
- **`components/BottomNav.tsx`** - Mobile bottom navigation
- **`components/PrivateRoute.tsx`** - Authentication guard
- **`components/ErrorBoundary.tsx`** - Error handling

### Modal Components (`components/modals/`)
- `AppointmentModal.tsx` - Create/edit appointments
- `CRMPatientModal.tsx` - Create/edit CRM patients
- `PatientModal.tsx` - Create/edit patients
- `TeamModal.tsx` - Create/edit team members
- `FilterModal.tsx` - Advanced filtering
- `TagSelectorModal.tsx` - Tag selection for campaigns
- `ScheduleModal.tsx` - Campaign scheduling

### Chart Components (`components/charts/`)
- `ActivityChart.tsx` - Activity visualization
- `CampaignChart.tsx` - Campaign analytics
- `EngagementChart.tsx` - Engagement metrics
- `CustomerActivityTrendChart.tsx` - Customer trends

---

## 🔐 Authentication Flow

```
1. User visits /login
   ↓
2. Enters credentials
   ↓
3. authService.login() called
   ↓
4. POST /api/auth/login
   ↓
5. Proxies to External CRM API
   ↓
6. Receives JWT token
   ↓
7. Token stored in sessionStorage
   ↓
8. AuthContext updates state
   ↓
9. Redirect to /dashboard
```

### Protected Routes
All pages except `/login` and `/` are wrapped with `PrivateRoute` component, which:
- Checks authentication status
- Redirects to `/login` if not authenticated
- Renders page if authenticated

---

## 📊 Data Flow Examples

### Example 1: Loading Dashboard Data
```
1. User navigates to /dashboard
   ↓
2. PrivateRoute checks auth → ✅ Authenticated
   ↓
3. Dashboard page loads
   ↓
4. useEffect triggers multiple API calls:
   - dashboardService.getStats()
   - dashboardService.getActivity()
   - dashboardService.getTodayAppointments()
   - walletService.getBalance()
   ↓
5. API routes fetch from database or external APIs
   ↓
6. Data returned and displayed in UI
```

### Example 2: Creating a Patient
```
1. User clicks "Add Patient" on /crm page
   ↓
2. CRMPatientModal opens
   ↓
3. User fills form and submits
   ↓
4. crmPatientService.createPatient() called
   ↓
5. POST /api/crm/customers (proxy route)
   ↓
6. Proxies to External CRM API
   ↓
7. Success response
   ↓
8. Modal closes, patient list refreshes
```

---

## 🔍 Finding Code for Specific Features

### To find where a page calls an API:
1. Go to `app/[page-name]/page.tsx`
2. Look for imports from `@/lib/services/`
3. Find the service method being called
4. Check the service file in `lib/services/`
5. Find the API route in `app/api/`

### To find which page uses a component:
1. Search for component import: `grep -r "ComponentName" app/`
2. Check component file in `components/`

### To find API route implementation:
1. Check `app/api/[endpoint]/route.ts`
2. Look for HTTP methods (GET, POST, PUT, DELETE)
3. Check if it proxies to external API or uses database

---

## 🗂️ File Organization Best Practices

### Pages (`app/`)
- One page per route
- Use `page.tsx` for the page component
- Keep page logic focused on UI and state management

### API Routes (`app/api/`)
- One route file per endpoint
- Use `route.ts` for API handlers
- Keep business logic in services, not routes

### Services (`lib/services/`)
- One service per domain (auth, patients, etc.)
- Services handle API communication
- Use adapters for data transformation

### Components (`components/`)
- Reusable components in root
- Domain-specific components in subfolders
- Keep components small and focused

---

## 🔐 Authentication

The application uses JWT tokens for authentication. Tokens are stored in `sessionStorage` and automatically included in API requests via Axios interceptors.

**Security Features:**
- JWT token-based authentication
- Automatic token refresh handling
- Session-based token storage (more secure than localStorage)
- Error boundaries for graceful error handling

---

## 🧪 Development

```bash
# Type checking
npm run type-check

# Linting
npm run lint
```

---

## 🚢 Production Deployment

1. Set environment variables in your hosting platform (see [Environment Variables Guide](docs/guides/ENVIRONMENT_VARIABLES.md))
2. Build the application: `npm run build`
3. Start the server: `npm start`

For detailed deployment instructions, see:
- [Deployment Guide](docs/deployment/DEPLOYMENT.md)
- [Production Guide](docs/deployment/PRODUCTION.md)

---

## 📚 Documentation

Comprehensive documentation is available in the `docs/` folder:

- **API Documentation**: See `docs/api/` for API architecture and usage guides
- **Developer Guides**: See `docs/guides/` for setup, quickstart, and usage examples
- **Deployment**: See `docs/deployment/` for deployment and production guides

---

---

## 📋 Quick Reference Table

### Pages → Files → APIs

| Page Route | Page File | Main Service | API Endpoints | Backend Route File |
|------------|-----------|-------------|--------------|-------------------|
| `/` | `app/page.tsx` | None | None | None |
| `/login` | `app/login/page.tsx` | `authService` | `POST /api/auth/login` | `app/api/auth/login/route.ts` |
| `/dashboard` | `app/dashboard/page.tsx` | `dashboardService`, `walletService` | `GET /api/dashboard/stats`<br>`GET /api/dashboard/activity`<br>`GET /api/dashboard/today-appointments`<br>`GET /api/wallet/balance` | `app/api/dashboard/stats/route.ts`<br>`app/api/dashboard/activity/route.ts`<br>`app/api/dashboard/today-appointments/route.ts`<br>`app/api/wallet/balance/route.ts` |
| `/crm` | `app/crm/page.tsx` | `crmPatientService` | `GET /api/crm/customers`<br>`POST /api/crm/customers`<br>`PUT /api/crm/customers/:id`<br>`DELETE /api/crm/customers/:id` | `app/api/crm/[...path]/route.ts` |
| `/appointments` | `app/appointments/page.tsx` | `appointmentService` | `GET /api/appointments`<br>`POST /api/appointments`<br>`PUT /api/appointments/:id`<br>`DELETE /api/appointments/:id` | `app/api/appointments/route.ts`<br>`app/api/appointments/[id]/route.ts` |
| `/campaigns` | `app/campaigns/page.tsx` | `campaignApi`, `templateApi` | `GET /api/campaigns`<br>`POST /api/campaigns`<br>`GET /api/campaigns/:id`<br>`PUT /api/campaigns/:id`<br>`DELETE /api/campaigns/:id`<br>`POST /api/campaigns/:id/send`<br>`GET /api/templates` | `app/api/campaigns/route.ts`<br>`app/api/campaigns/[id]/route.ts`<br>`app/api/campaigns/[id]/send/route.ts`<br>`app/api/templates/route.ts` |
| `/team` | `app/team/page.tsx` | `teamApi` | `GET /api/teams`<br>`POST /api/teams`<br>`GET /api/teams/:id`<br>`PUT /api/teams/:id`<br>`DELETE /api/teams/:id` | `app/api/teams/route.ts`<br>`app/api/teams/[...path]/route.ts` |
| `/wallet` | `app/wallet/page.tsx` | `walletService` | `GET /api/wallet/balance` | `app/api/wallet/balance/route.ts` |
| `/profile` | `app/profile/page.tsx` | None (uses AuthContext) | None | None |
| `/settings` | `app/settings/page.tsx` | None | None | None |
| `/settings/premium` | `app/settings/premium/page.tsx` | None (pending) | None (pending) | None |
| `/settings/refer-and-win` | `app/settings/refer-and-win/page.tsx` | None | None | None |

### Service Files Location

| Service Name | File Location | Used By Pages |
|--------------|---------------|---------------|
| `authService` | `lib/services/api.ts` | `/login` |
| `dashboardService` | `lib/services/api.ts` | `/dashboard` |
| `walletService` | `lib/services/api.ts` | `/dashboard`, `/wallet` |
| `crmPatientService` | `lib/services/crmPatientService.ts` | `/crm` |
| `appointmentService` | `lib/services/api.ts` | `/appointments`, `/dashboard` |
| `campaignApi` | `lib/services/campaignApi.ts` | `/campaigns` |
| `templateApi` | `lib/services/templateApi.ts` | `/campaigns` |
| `teamApi` | `lib/services/teamApi.ts` | `/team` |
| `patientService` | `lib/services/api.ts` | `/appointments`, `/dashboard` |
| `teamService` | `lib/services/api.ts` | `/appointments`, `/dashboard` |

### Component Usage Map

| Component | Location | Used By Pages |
|-----------|----------|---------------|
| `Layout` | `components/Layout.tsx` | All pages (except `/login`, `/`) |
| `PrivateRoute` | `components/PrivateRoute.tsx` | All protected pages |
| `Header` | `components/Header.tsx` | All pages (via Layout) |
| `AppointmentModal` | `components/modals/AppointmentModal.tsx` | `/dashboard`, `/appointments` |
| `CRMPatientModal` | `components/modals/CRMPatientModal.tsx` | `/crm` |
| `TeamModal` | `components/modals/TeamModal.tsx` | `/team` |
| `TagSelectorModal` | `components/modals/TagSelectorModal.tsx` | `/campaigns` |
| `ActivityChart` | `components/charts/ActivityChart.tsx` | `/dashboard` |

---

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
