# Quick Start Guide - Next.js Version

Get PingWise up and running in 5 minutes!

## 🎯 Prerequisites

- Node.js (v18+)
- MongoDB running locally or MongoDB Atlas account

## 🚀 Quick Setup

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

### 4. Start Application

```bash
npm run dev
```

Open http://localhost:3000

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

### 6. Login and Explore!

- Login at http://localhost:3000/login
- Explore the dashboard
- Add patients
- Create appointments
- Send campaigns

## 🏗️ Architecture

This application uses Next.js 14 with:
- **App Router** - Modern Next.js routing
- **API Routes** - Server-side API endpoints
- **TypeScript** - Full type safety
- **MongoDB** - Database
- **JWT** - Authentication

## 📝 Key Differences from Node.js Version

1. **Single Application** - Frontend and backend are unified in Next.js
2. **API Routes** - Express routes converted to Next.js API routes
3. **TypeScript** - Full TypeScript support
4. **Server Components** - Can use React Server Components
5. **Better Performance** - Built-in optimizations

## 🔧 Development

```bash
# Development mode
npm run dev

# Type checking
npm run type-check

# Production build
npm run build
npm start
```

## 🐛 Common Issues

**MongoDB not connecting?**
- Check if MongoDB is running: `mongosh`
- Verify connection string in `.env.local`
- For Atlas, check IP whitelist

**Port already in use?**
- Change PORT in `.env.local` (Next.js uses 3000 by default)
- Or kill the process using the port

**Module not found?**
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

## 📖 Documentation

- [README.md](./README.md) - Full documentation
- [API Documentation](./app/api/README.md) - API endpoints

Happy coding! 🚀

