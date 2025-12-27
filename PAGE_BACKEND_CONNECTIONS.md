# Page-by-Page Backend API Connections

This document provides a comprehensive overview of all pages in the application and their backend API connections. Use this for client walkthrough and understanding the application structure.

---

## 🔐 **Authentication & Base Configuration**

**Base URL:** `https://pw-crm-gateway-1.onrender.com`  
**Environment Variable:** `NEXT_PUBLIC_CRM_API_BASE_URL`

All API services use JWT Bearer token authentication stored in `sessionStorage` (key: `token` or `access_token`).

---

## 📄 **1. Dashboard Page** (`/dashboard`)

**Page File:** `app/dashboard/page.tsx`

### Backend APIs Used:

1. **Reports API** - Daily Statistics
   - **Service File:** `lib/services/reportsApi.ts`
   - **Service Method:** `reportsApi.getDailyReport()`
   - **Endpoint:** `GET /reports/daily`
   - **Hook File:** `app/dashboard/hooks/useDashboardStats.ts`
   - **Hook:** `useDashboardStats`
   - **Purpose:** Fetches daily statistics (active customers, booked customers, follow-up customers, total appointments, total customers)

2. **Wallet API** - Balance
   - **Service File:** `lib/services/api.ts` (walletService)
   - **Service Method:** `walletService.getBalance()`
   - **Endpoint:** `GET /api/wallet/balance` (via Next.js API route)
   - **Next.js API Route:** `app/api/wallet/balance/route.ts`
   - **Hook File:** `app/dashboard/hooks/useWalletBalance.ts`
   - **Hook:** `useWalletBalance`
   - **Purpose:** Fetches wallet balance

3. **CRM API** - Today's Appointments
   - **Service File:** `lib/services/appointmentService.ts`
   - **Service Method:** `crmAppointmentService.getAppointments()` (filtered by today's date)
   - **Endpoint:** `GET /appointments?date={today}`
   - **Hook File:** `app/dashboard/hooks/useTodayAppointments.ts`
   - **Hook:** `useTodayAppointments`
   - **Purpose:** Fetches today's appointments

4. **CRM API** - Patient Data (for Quick Actions)
   - **Service File:** `lib/services/crmPatientService.ts`
   - **Service Method:** `crmPatientService.getPatients()`
   - **Endpoint:** `GET /customers`
   - **Component File:** `components/modals/AppointmentModal.tsx`
   - **Purpose:** Preloads patient data for appointment modal

5. **Team API** - Team Members (for Quick Actions)
   - **Service File:** `lib/services/teamApi.ts`
   - **Service Method:** `teamApi.getTeams()`
   - **Endpoint:** `GET /teams`
   - **Component File:** `components/modals/AppointmentModal.tsx`
   - **Purpose:** Preloads team/doctor data for appointment modal

### Key Features:
- KPI cards showing daily statistics
- Activity chart (uses daily report data)
- Today's appointments list
- Quick actions (Add Appointment, Add Patient)
- Wallet balance display

### Component Files:
- **KPICards:** `app/dashboard/components/KPICards.tsx`
- **TodayAppointmentsList:** `app/dashboard/components/TodayAppointmentsList.tsx`
- **ActivityChart:** `components/charts/ActivityChart.tsx`
- **AppointmentModal:** `components/modals/AppointmentModal.tsx`
- **CRMPatientModal:** `components/modals/CRMPatientModal.tsx`

---

## 👥 **2. CRM Page (Patients)** (`/crm`)

**Page File:** `app/crm/page.tsx`

### Backend APIs Used:

1. **CRM API** - Patients List
   - **Service File:** `lib/services/crmPatientService.ts`
   - **Service Method:** `crmPatientService.getPatients()`
   - **Endpoint:** `GET /customers`
   - **Query Parameters:** 
     - `page`, `limit` (pagination)
     - `status` (filter by status)
     - `search` (search by name, email, phone)
     - `assigned_doctor` (filter by doctor)
     - `age_min`, `age_max` (age range filter)
     - `created_at_start`, `created_at_end` (date range filter)
   - **Hook File:** `app/crm/hooks/usePatients.ts`
   - **Hook:** `usePatients`
   - **Purpose:** Fetches paginated list of patients with filtering

2. **CRM API** - Create Patient
   - **Service File:** `lib/services/crmPatientService.ts`
   - **Service Method:** `crmPatientService.createPatient()`
   - **Endpoint:** `POST /customers`
   - **Component File:** `components/modals/CRMPatientModal.tsx`
   - **Purpose:** Creates a new patient

3. **CRM API** - Update Patient
   - **Service File:** `lib/services/crmPatientService.ts`
   - **Service Method:** `crmPatientService.updatePatient()`
   - **Endpoint:** `PUT /customers/{id}`
   - **Component File:** `components/modals/CRMPatientModal.tsx`
   - **Purpose:** Updates existing patient

4. **CRM API** - Delete Patient
   - **Service File:** `lib/services/crmPatientService.ts`
   - **Service Method:** `crmPatientService.deletePatient()`
   - **Endpoint:** `DELETE /customers/{id}`
   - **Component File:** `components/modals/PatientDetailsModal.tsx`
   - **Purpose:** Deletes a patient

5. **CRM API** - Get Single Patient
   - **Service File:** `lib/services/crmPatientService.ts`
   - **Service Method:** `crmPatientService.getPatientById()`
   - **Endpoint:** `GET /customers/{id}`
   - **Component File:** `components/modals/PatientDetailsModal.tsx`
   - **Purpose:** Fetches detailed patient information

### Key Features:
- Patient list with pagination
- Search functionality (debounced)
- Status filtering (Active, Booked, Follow-up, Inactive)
- Advanced filtering (date range, age range, assigned doctor)
- Add/Edit/Delete patients
- Patient details modal
- Contact functionality (phone/email)

### Component Files:
- **PatientSearchBar:** `app/crm/components/PatientSearchBar.tsx`
- **PatientStatusFilters:** `app/crm/components/PatientStatusFilters.tsx`
- **PatientList:** `app/crm/components/PatientList.tsx`
- **PatientDetailsModal:** `components/modals/PatientDetailsModal.tsx`
- **CRMPatientModal:** `components/modals/CRMPatientModal.tsx`
- **FilterModal:** `components/modals/FilterModal.tsx`

---

## 📅 **3. Appointments Page** (`/appointments`)

**Page File:** `app/appointments/page.tsx`

### Backend APIs Used:

1. **Appointment API** - Get Appointments
   - **Service File:** `lib/services/appointmentService.ts`
   - **Service Method:** `crmAppointmentService.getAppointments()`
   - **Endpoint:** `GET /appointments`
   - **Query Parameters:**
     - `date` (filter by specific date)
     - `status` (filter by status)
     - `doctor` (filter by doctor ID)
     - `patient` (filter by patient ID)
   - **Hook File:** `app/appointments/hooks/useAppointments.ts`
   - **Hook:** `useAppointments`
   - **Purpose:** Fetches appointments for selected date and month

2. **Appointment API** - Create Appointment
   - **Service File:** `lib/services/appointmentService.ts`
   - **Service Method:** `crmAppointmentService.createAppointment()`
   - **Endpoint:** `POST /appointments`
   - **Component File:** `components/modals/AppointmentModal.tsx`
   - **Purpose:** Creates a new appointment

3. **Appointment API** - Update Appointment
   - **Service File:** `lib/services/appointmentService.ts`
   - **Service Method:** `crmAppointmentService.updateAppointment()`
   - **Endpoint:** `PUT /appointments/{id}`
   - **Component File:** `components/modals/AppointmentModal.tsx`
   - **Purpose:** Updates existing appointment

4. **Appointment API** - Delete Appointment
   - **Service File:** `lib/services/appointmentService.ts`
   - **Service Method:** `crmAppointmentService.deleteAppointment()`
   - **Endpoint:** `DELETE /appointments/{id}`
   - **Component File:** `app/appointments/components/AppointmentCard.tsx`
   - **Purpose:** Deletes an appointment

5. **CRM API** - Patient Data (for Enrichment)
   - **Service File:** `lib/services/crmPatientService.ts`
   - **Service Method:** `crmPatientService.getPatients()`
   - **Endpoint:** `GET /customers`
   - **Hook File:** `app/appointments/hooks/usePatientEnrichment.ts`
   - **Hook:** `usePatientEnrichment`
   - **Purpose:** Enriches appointments with patient details

### Key Features:
- Calendar view with appointment indicators
- Today's appointments list
- Pending appointments list
- Search and filter by status
- Create/Edit/Delete appointments
- WhatsApp reminders toggle (UI only)
- Calendar shows pending appointments as orange dots

### Component Files:
- **CalendarView:** `app/appointments/components/CalendarView.tsx`
- **AppointmentList:** `app/appointments/components/AppointmentList.tsx`
- **UpcomingAppointmentsList:** `app/appointments/components/UpcomingAppointmentsList.tsx`
- **AppointmentSearchBar:** `app/appointments/components/AppointmentSearchBar.tsx`
- **AppointmentModal:** `components/modals/AppointmentModal.tsx`
- **AppointmentCard:** `app/appointments/components/AppointmentCard.tsx`

---

## 📢 **4. Campaigns Page** (`/campaigns`)

**Page File:** `app/campaigns/page.tsx`

### Backend APIs Used:

1. **Campaign API** - Get Campaigns
   - **Service File:** `lib/services/campaignApi.ts`
   - **Service Method:** `campaignApi.getCampaigns()`
   - **Endpoint:** `GET /campaigns`
   - **Hook File:** `app/campaigns/hooks/useCampaigns.ts`
   - **Hook:** `useCampaigns`
   - **Purpose:** Fetches all campaigns

2. **Campaign API** - Create Campaign
   - **Service File:** `lib/services/campaignApi.ts`
   - **Service Method:** `campaignApi.createCampaign()`
   - **Endpoint:** `POST /campaigns`
   - **Component File:** `app/campaigns/components/CampaignForm.tsx`
   - **Purpose:** Creates a new campaign

3. **Campaign API** - Update Campaign
   - **Service File:** `lib/services/campaignApi.ts`
   - **Service Method:** `campaignApi.updateCampaign()`
   - **Endpoint:** `PUT /campaigns/{id}`
   - **Component File:** `app/campaigns/components/CampaignForm.tsx`
   - **Purpose:** Updates existing campaign

4. **Campaign API** - Delete Campaign
   - **Service File:** `lib/services/campaignApi.ts`
   - **Service Method:** `campaignApi.deleteCampaign()`
   - **Endpoint:** `DELETE /campaigns/{id}`
   - **Component File:** `app/campaigns/components/CampaignCard.tsx`
   - **Purpose:** Deletes a campaign

5. **Campaign API** - Send Campaign
   - **Service File:** `lib/services/campaignApi.ts`
   - **Service Method:** `campaignApi.sendCampaign()`
   - **Endpoint:** `POST /campaigns/{id}/send`
   - **Component File:** `app/campaigns/components/CampaignForm.tsx`
   - **Purpose:** Sends a campaign immediately

6. **Template API** - Get Templates
   - **Service File:** `lib/services/templateApi.ts`
   - **Service Method:** `templateApi.getTemplates()`
   - **Endpoint:** `GET /templates`
   - **Hook File:** `app/campaigns/hooks/useTemplates.ts`
   - **Hook:** `useTemplates`
   - **Purpose:** Fetches message templates

7. **Template API** - Create Template
   - **Service File:** `lib/services/templateApi.ts`
   - **Service Method:** `templateApi.createTemplate()`
   - **Endpoint:** `POST /templates`
   - **Component File:** `app/campaigns/components/TemplateCard.tsx`
   - **Purpose:** Creates a new template

8. **Template API** - Update Template
   - **Service File:** `lib/services/templateApi.ts`
   - **Service Method:** `templateApi.updateTemplate()`
   - **Endpoint:** `PUT /templates/{id}`
   - **Component File:** `app/campaigns/components/TemplateCard.tsx`
   - **Purpose:** Updates existing template

9. **Template API** - Delete Template
   - **Service File:** `lib/services/templateApi.ts`
   - **Service Method:** `templateApi.deleteTemplate()`
   - **Endpoint:** `DELETE /templates/{id}`
   - **Component File:** `app/campaigns/components/TemplateCard.tsx`
   - **Purpose:** Deletes a template

10. **CRM API** - Get Tags
    - **Service File:** `lib/services/crmApi.ts`
    - **Service Method:** `crmApi.getTags()`
    - **Endpoint:** `GET /tags`
    - **Component File:** `components/modals/TagSelectorModal.tsx`
    - **Purpose:** Fetches available tags for campaign targeting

### Key Features:
- Campaign list (sent and scheduled)
- Template management
- Create campaign with message, images, tags
- Schedule campaigns for later
- Send campaigns immediately
- Tag selector for targeting
- Image upload support

### Component Files:
- **CampaignForm:** `app/campaigns/components/CampaignForm.tsx`
- **CampaignsList:** `app/campaigns/components/CampaignsList.tsx`
- **TemplatesList:** `app/campaigns/components/TemplatesList.tsx`
- **TemplateCard:** `app/campaigns/components/TemplateCard.tsx`
- **TagSelectorModal:** `components/modals/TagSelectorModal.tsx`
- **ScheduleModal:** `components/modals/ScheduleModal.tsx`

---

## 👨‍⚕️ **5. Team Page** (`/team`)

**Page File:** `app/team/page.tsx`

### Backend APIs Used:

1. **Team API** - Get Teams
   - **Service File:** `lib/services/teamApi.ts`
   - **Service Method:** `teamApi.getTeams()`
   - **Endpoint:** `GET /teams`
   - **Hook File:** `app/team/hooks/useTeamMembers.ts`
   - **Hook:** `useTeamMembers`
   - **Purpose:** Fetches all team members

2. **Team API** - Get Single Team Member
   - **Service File:** `lib/services/teamApi.ts`
   - **Service Method:** `teamApi.getTeam(id)`
   - **Endpoint:** `GET /teams/{id}`
   - **Component File:** `components/modals/TeamMemberDetailsModal.tsx`
   - **Purpose:** Fetches single team member details

3. **Team API** - Create Team Member
   - **Service File:** `lib/services/teamApi.ts`
   - **Service Method:** `teamApi.createTeam()`
   - **Endpoint:** `POST /teams`
   - **Component File:** `components/modals/TeamModal.tsx`
   - **Purpose:** Creates a new team member

4. **Team API** - Update Team Member
   - **Service File:** `lib/services/teamApi.ts`
   - **Service Method:** `teamApi.updateTeam()`
   - **Endpoint:** `PUT /teams/{id}`
   - **Component File:** `components/modals/TeamModal.tsx`
   - **Purpose:** Updates existing team member

5. **Team API** - Delete Team Member
   - **Service File:** `lib/services/teamApi.ts`
   - **Service Method:** `teamApi.deleteTeam()`
   - **Endpoint:** `DELETE /teams/{id}`
   - **Component File:** `components/modals/TeamMemberDetailsModal.tsx`
   - **Purpose:** Deletes a team member

### Key Features:
- Team member list with filtering
- Search functionality
- Filter by status (active/leave) and department
- Add/Edit/Delete team members
- Team member details modal
- Contact functionality (phone calls only)
- Random phone number generation for testing (if phone is missing)

### Component Files:
- **TeamList:** `app/team/components/TeamList.tsx`
- **TeamMemberCard:** `app/team/components/TeamMemberCard.tsx`
- **TeamSearchBar:** `app/team/components/TeamSearchBar.tsx`
- **FilterCard:** `app/team/components/FilterCard.tsx`
- **TeamMemberDetailsModal:** `components/modals/TeamMemberDetailsModal.tsx`
- **TeamModal:** `components/modals/TeamModal.tsx`
- **TeamFilterModal:** `components/modals/TeamFilterModal.tsx`

---

## 📊 **6. Reports Page** (`/reports`)

**Page File:** `app/reports/page.tsx`

### Backend APIs Used:

1. **Reports API** - Daily Report
   - **Service File:** `lib/services/reportsApi.ts`
   - **Service Method:** `reportsApi.getDailyReport()`
   - **Endpoint:** `GET /reports/daily`
   - **Component File:** `components/charts/EngagementChart.tsx`
   - **Purpose:** Fetches daily statistics for charts

2. **Reports API** - Campaign Reports
   - **Service File:** `lib/services/reportsApi.ts`
   - **Service Method:** `reportsApi.getCampaignReports()`
   - **Endpoint:** `GET /reports/campaigns`
   - **Component File:** `components/charts/CampaignChart.tsx`
   - **Purpose:** Fetches campaign performance data

3. **Reports API** - Customer Activity
   - **Service File:** `lib/services/reportsApi.ts`
   - **Service Method:** `reportsApi.getCustomerActivity()`
   - **Endpoint:** `GET /reports/customer-activity`
   - **Component File:** `components/charts/CustomerActivityTrendChart.tsx`
   - **Purpose:** Fetches customer activity trends

### Key Features:
- Engagement chart
- Campaign performance chart
- Customer activity trend chart
- Analytics and insights

### Component Files:
- **EngagementChart:** `components/charts/EngagementChart.tsx`
- **CampaignChart:** `components/charts/CampaignChart.tsx`
- **CustomerActivityTrendChart:** `components/charts/CustomerActivityTrendChart.tsx`

---

## 💰 **7. Wallet Page** (`/wallet`)

**Page File:** `app/wallet/page.tsx`

### Backend APIs Used:

1. **Wallet API** - Get Balance
   - **Service File:** `lib/services/api.ts` (walletService)
   - **Service Method:** `walletService.getBalance()`
   - **Endpoint:** `GET /api/wallet/balance` (via Next.js API route)
   - **Next.js API Route:** `app/api/wallet/balance/route.ts`
   - **Purpose:** Fetches wallet balance
   - **Note:** Currently uses Next.js API route as proxy

2. **Wallet API** - Add Funds (Future)
   - **Service File:** `lib/services/api.ts` (walletService)
   - **Service Method:** `walletService.addFunds()`
   - **Endpoint:** `POST /api/wallet/add-funds` (via Next.js API route)
   - **Purpose:** Adds funds to wallet
   - **Status:** UI implemented, backend pending

3. **Wallet API** - Transaction History (Future)
   - **Service File:** `lib/services/api.ts` (walletService)
   - **Service Method:** `walletService.getTransactions()`
   - **Endpoint:** `GET /api/wallet/transactions` (via Next.js API route)
   - **Purpose:** Fetches transaction history
   - **Status:** UI implemented, backend pending

### Key Features:
- Wallet balance display
- Add funds functionality (UI ready)
- Transaction history (UI ready, backend pending)

---

## 🔐 **8. Login Page** (`/login`)

**Page File:** `app/login/page.tsx`

### Backend APIs Used:

1. **CRM API** - Login
   - **Service File:** `lib/services/crmApi.ts`
   - **Service Method:** `crmApi.login()`
   - **Endpoint:** `POST /auth/login`
   - **Purpose:** Authenticates user and returns JWT token
   - **Response:** Stores token in `sessionStorage`

2. **CRM API** - Get Current User (After Login)
   - **Service File:** `lib/services/crmApi.ts`
   - **Service Method:** `crmApi.getCurrentUser()`
   - **Endpoint:** `GET /auth/me`
   - **Context File:** `contexts/AuthContext.tsx`
   - **Purpose:** Fetches authenticated user details

### Key Features:
- User authentication
- JWT token management
- Redirect to dashboard after login
- Error handling for invalid credentials

---

## ⚙️ **9. Settings Page** (`/settings`)

**File:** `app/settings/page.tsx`

### Backend APIs Used:

**Note:** Settings page is primarily UI-based. Backend API integration may be pending.

### Key Features:
- User preferences
- Account settings
- Notification settings
- Theme settings (dark/light mode)

---

## 👤 **10. Profile Page** (`/profile`)

**Page File:** `app/profile/page.tsx`

### Backend APIs Used:

1. **CRM API** - Get Current User
   - **Service File:** `lib/services/crmApi.ts`
   - **Service Method:** `crmApi.getCurrentUser()`
   - **Endpoint:** `GET /auth/me`
   - **Context File:** `contexts/AuthContext.tsx`
   - **Purpose:** Fetches user profile information

2. **CRM API** - Update User (Future)
   - **Service File:** `lib/services/crmApi.ts`
   - **Service Method:** `crmApi.updateUser()`
   - **Endpoint:** `PUT /users/{id}`
   - **Purpose:** Updates user profile
   - **Status:** May be pending implementation

### Key Features:
- View user profile
- Edit profile information (if implemented)

---

## 📖 **11. Guide Page** (`/guide`)

**File:** `app/guide/page.tsx`

### Backend APIs Used:

**None** - Static content page

### Key Features:
- User guide and documentation
- Feature explanations
- Help content

---

## ❓ **12. FAQs Page** (`/faqs`)

**File:** `app/faqs/page.tsx`

### Backend APIs Used:

**None** - Static FAQ content

### Key Features:
- Frequently asked questions
- Expandable FAQ items
- Help section

---

## 🔗 **API Service Files Reference**

All API services are located in `lib/services/`:

1. **`lib/services/crmApi.ts`** - CRM Gateway API (customers, appointments, tags, auth)
2. **`lib/services/crmPatientService.ts`** - Patient-specific service wrapper
3. **`lib/services/appointmentService.ts`** - Appointment API service wrapper
4. **`lib/services/appointmentApi.ts`** - Appointment API (direct backend calls)
5. **`lib/services/campaignApi.ts`** - Campaign API
6. **`lib/services/templateApi.ts`** - Template API
7. **`lib/services/teamApi.ts`** - Team API
8. **`lib/services/reportsApi.ts`** - Reports API
9. **`lib/services/api.ts`** - Centralized API service (includes `walletService`)

### Next.js API Routes (Still in Use):

1. **`app/api/wallet/balance/route.ts`** - Wallet balance API route
2. **`app/api/health/route.ts`** - Health check endpoint

---

## 🔄 **Data Flow Architecture**

1. **Direct Backend Calls:** All pages make direct calls to backend APIs (no Next.js proxy routes)
2. **Authentication:** JWT tokens stored in `sessionStorage`, automatically added to all API requests
3. **Error Handling:** Global error handling with toast notifications
4. **Caching:** Client-side caching implemented in hooks to prevent duplicate API calls
5. **State Management:** React hooks (`useState`, `useEffect`, custom hooks) for state management

---

## 📝 **Notes for Client Walkthrough**

1. **All API calls are direct** - No Next.js API routes (except wallet which is being migrated)
2. **Single Backend Gateway** - All APIs go through `https://pw-crm-gateway-1.onrender.com`
3. **JWT Authentication** - All requests include Bearer token in Authorization header
4. **Responsive Design** - All pages work on mobile and desktop
5. **Real-time Updates** - Cache invalidation ensures fresh data after mutations
6. **Error Handling** - User-friendly error messages via toast notifications

---

## 🚀 **Quick Reference: Page → API Mapping**

| Page | Primary API | Secondary APIs |
|------|------------|----------------|
| Dashboard | Reports API | Wallet API, Appointment API, CRM API |
| CRM | CRM API (Customers) | - |
| Appointments | Appointment API | CRM API (Patients) |
| Campaigns | Campaign API | Template API, CRM API (Tags) |
| Team | Team API | - |
| Reports | Reports API | - |
| Wallet | Wallet API (via Next.js) | - |
| Login | CRM API (Auth) | - |
| Profile | CRM API (Auth) | - |
| Settings | None (UI only) | - |
| Guide | None (Static) | - |
| FAQs | None (Static) | - |

---

**Last Updated:** Based on current codebase structure after cleanup of Next.js API routes.

