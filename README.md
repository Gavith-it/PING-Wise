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

Create a `.env.local` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/pingwise
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
NODE_ENV=development
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

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── login/             # Login page
│   └── ...
├── components/            # React components
├── contexts/              # React contexts (Auth)
├── lib/                   # Utilities and models
│   ├── models/            # Mongoose models
│   ├── services/          # API services
│   └── middleware/       # Auth middleware
├── types/                 # TypeScript types
└── public/                # Static assets
```

## 🔐 Authentication

The application uses JWT tokens for authentication. Tokens are stored in localStorage and automatically included in API requests.

## 🧪 Development

```bash
# Type checking
npm run type-check

# Linting
npm run lint
```

## 📝 API Endpoints

All API endpoints are prefixed with `/api`:

- `/api/auth/login` - User login
- `/api/auth/register` - User registration
- `/api/auth/me` - Get current user
- `/api/patients` - Patient management
- `/api/appointments` - Appointment management
- `/api/campaigns` - Campaign management
- `/api/team` - Team member management
- `/api/dashboard/stats` - Dashboard statistics

## 🚢 Production Deployment

1. Set environment variables in your hosting platform
2. Build the application: `npm run build`
3. Start the server: `npm start`

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
