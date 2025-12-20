# Quick Start Guide

Get PingWise up and running in 5 minutes!

## 🎯 Two Ways to Run

### Option A: Frontend-Only (Quick View) ⚡
**No backend needed - just view the UI!**

```bash
cd client
npm install
echo "REACT_APP_USE_MOCK_API=true" > .env
npm start
```

Open http://localhost:3000 - Login with any email/password!

### Option B: Full Mode (With Backend) 🚀
**Complete functionality with real database**

## Prerequisites

- Node.js (v16+)
- MongoDB running locally or MongoDB Atlas account

## Quick Setup

### 1. Install Dependencies

```bash
npm run install-all
```

### 2. Configure Backend

```bash
cd server
cp .env.example .env
# Edit .env and set your MongoDB URI
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
- Update `MONGODB_URI` in `.env`

### 4. Configure Frontend

```bash
cd ../client
cp .env.example .env
# Edit .env and set:
# REACT_APP_API_URL=http://localhost:5000/api
# REACT_APP_USE_MOCK_API=false
```

### 5. Start Application

```bash
# From root directory
npm run dev
```

This starts:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

### 6. Create Your First User

Open http://localhost:3000 and register a new account, or use the API:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Admin",
    "email": "admin@clinic.com",
    "password": "admin123",
    "role": "admin"
  }'
```

### 7. Login and Explore!

- Login at http://localhost:3000/login
- Explore the dashboard
- Add patients
- Create appointments
- Send campaigns

**📖 For detailed instructions, see [RUN.md](./RUN.md)**

## Common Issues

**MongoDB not connecting?**
- Check if MongoDB is running: `mongosh`
- Verify connection string in `.env`
- For Atlas, check IP whitelist

**Port already in use?**
- Change PORT in `server/.env`
- Or kill the process using the port

**Module not found?**
- Delete `node_modules` and reinstall
- Make sure you ran `npm run install-all`

## Next Steps

- Read [SETUP.md](./SETUP.md) for detailed setup
- Check [API Documentation](./server/routes/README.md)
- Review [Production Guide](./PRODUCTION.md) for deployment

## Features

✅ **Dashboard** - KPIs, charts, and today's appointments  
✅ **Patient Management** - CRUD operations, search, filtering  
✅ **Appointments** - Calendar view, scheduling, management  
✅ **Campaigns** - Send messages to patients  
✅ **Team Management** - Staff and doctor management  
✅ **Responsive Design** - Works on mobile and desktop  
✅ **Secure** - JWT authentication, input validation  

## Tech Stack

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Security middleware (Helmet, CORS, Rate Limiting)

**Frontend:**
- React 18
- React Router
- Tailwind CSS
- Recharts for visualizations
- Axios for API calls

## Support

For detailed documentation:
- Setup: [SETUP.md](./SETUP.md)
- API: [server/routes/README.md](./server/routes/README.md)
- Production: [PRODUCTION.md](./PRODUCTION.md)

Happy coding! 🚀

