# How to Run PingWise Application

This guide explains how to run the application in different modes.

## 🎯 Quick Overview

PingWise can run in **two modes**:

1. **Frontend-Only Mode** (Mock Data) - For viewing/demo without backend
2. **Full Mode** (With Backend) - Complete functionality with real API

---

## 📱 Option 1: Frontend-Only Mode (Quick View)

**Use this when:** You just want to see the application UI without setting up backend.

### Steps:

1. **Navigate to client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies (if not done):**
   ```bash
   npm install
   ```

3. **Enable mock mode:**
   
   Create a `.env` file in the `client` directory:
   ```bash
   # Windows
   echo REACT_APP_USE_MOCK_API=true > .env
   
   # Mac/Linux
   echo "REACT_APP_USE_MOCK_API=true" > .env
   ```
   
   Or manually create `client/.env` with:
   ```
   REACT_APP_USE_MOCK_API=true
   ```

4. **Start the frontend:**
   ```bash
   npm start
   ```

5. **Open browser:**
   - The app will open at `http://localhost:3000`
   - You can login with **any email/password** (mock mode)
   - All data is mock/demo data

**✅ Advantages:**
- No backend setup needed
- No MongoDB required
- Instant viewing
- Perfect for demos

**⚠️ Limitations:**
- Data is not persisted (resets on refresh)
- No real database
- Mock data only

---

## 🚀 Option 2: Full Mode (With Backend)

**Use this when:** You want full functionality with real database and API.

### Prerequisites:
- MongoDB running (local or Atlas)
- Node.js installed

### Steps:

1. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

2. **Set up backend:**
   ```bash
   cd server
   cp .env.example .env
   ```
   
   Edit `server/.env` and set:
   ```env
   MONGODB_URI=mongodb://localhost:27017/pingwise
   # Or use MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/pingwise
   ```

3. **Set up frontend:**
   ```bash
   cd ../client
   ```
   
   Create `client/.env` file:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_USE_MOCK_API=false
   ```

4. **Start both backend and frontend:**
   ```bash
   # From root directory
   cd ..
   npm run dev
   ```

   This starts:
   - Backend on `http://localhost:5000`
   - Frontend on `http://localhost:3000`

5. **Create your first user:**
   - Open `http://localhost:3000`
   - Register a new account
   - Or use API:
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Dr. Admin","email":"admin@clinic.com","password":"admin123","role":"admin"}'
   ```

**✅ Advantages:**
- Full functionality
- Real database
- Data persistence
- Production-ready

---

## 🔄 Switching Between Modes

### From Mock Mode to Full Mode:

1. Stop the frontend (Ctrl+C)
2. Update `client/.env`:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_USE_MOCK_API=false
   ```
3. Make sure backend is running
4. Restart frontend: `npm start`

### From Full Mode to Mock Mode:

1. Stop both frontend and backend
2. Update `client/.env`:
   ```
   REACT_APP_USE_MOCK_API=true
   ```
3. Start only frontend: `cd client && npm start`

---

## 📋 Running Individual Services

### Backend Only:
```bash
cd server
npm run dev
# Runs on http://localhost:5000
```

### Frontend Only:
```bash
cd client
npm start
# Runs on http://localhost:3000
```

### Both Together:
```bash
# From root directory
npm run dev
```

---

## 🎨 For Client Presentation

**Recommended approach:**

1. **For initial viewing:** Use Frontend-Only Mode
   - Quick setup
   - No backend needed
   - Shows all UI/UX features

2. **For production:** Use Full Mode
   - Connect to real backend
   - Real database
   - Full functionality

---

## 🐛 Troubleshooting

### Frontend won't start?
```bash
cd client
rm -rf node_modules package-lock.json
npm install
npm start
```

### Backend connection errors?
- Check if backend is running on port 5000
- Verify `REACT_APP_API_URL` in `client/.env`
- Check browser console for errors

### Mock mode not working?
- Ensure `REACT_APP_USE_MOCK_API=true` in `client/.env`
- Restart the frontend server
- Clear browser cache

---

## 📝 Summary

| Mode | Backend Needed | MongoDB Needed | Use Case |
|------|---------------|----------------|----------|
| **Frontend-Only** | ❌ No | ❌ No | Quick viewing, demos |
| **Full Mode** | ✅ Yes | ✅ Yes | Production, real data |

Choose the mode that fits your needs! 🚀

