# PingWise Setup Guide

Complete setup instructions for the PingWise Medical Clinic Management System.

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **MongoDB** (v5 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** (optional) - [Download](https://git-scm.com/)

## Installation Steps

### 1. Clone or Download the Project

If using Git:
```bash
git clone <repository-url>
cd PING
```

Or download and extract the ZIP file to your desired location.

### 2. Install Dependencies

Install all dependencies for both backend and frontend:

```bash
npm run install-all
```

This will install:
- Root dependencies (concurrently, nodemon)
- Backend dependencies (Express, MongoDB, etc.)
- Frontend dependencies (React, Tailwind CSS, etc.)

### 3. Set Up Environment Variables

#### Backend Environment Variables

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```

2. Create a `.env` file:
   ```bash
   # Windows
   copy .env.example .env
   
   # Mac/Linux
   cp .env.example .env
   ```

3. Edit the `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/pingwise

   # JWT Configuration (IMPORTANT: Change this in production!)
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d

   # CORS Configuration
   CLIENT_URL=http://localhost:3000

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

#### Frontend Environment Variables (Optional)

Create a `.env` file in the `client` directory if you need to customize the API URL:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Start MongoDB

Make sure MongoDB is running on your system:

**Windows:**
```bash
# If installed as a service, it should start automatically
# Or start manually:
mongod
```

**Mac (using Homebrew):**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

### 5. Start the Application

From the root directory, run:

```bash
npm run dev
```

This will start both:
- **Backend server** on `http://localhost:5000`
- **Frontend application** on `http://localhost:3000`

The frontend will automatically open in your browser.

## First-Time Setup

### Create Admin User

1. Open your browser and navigate to `http://localhost:3000`
2. You'll be redirected to the login page
3. For demo purposes, you can register a new user or use the API directly

**Using API (Recommended for first admin):**

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

Then login with these credentials.

## Project Structure

```
PING/
├── server/                 # Node.js Backend
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers (if needed)
│   ├── middleware/        # Custom middleware
│   │   ├── auth.js       # Authentication middleware
│   │   └── errorHandler.js # Error handling
│   ├── models/           # Database models
│   │   ├── User.js      # User/Team member model
│   │   ├── Patient.js   # Patient model
│   │   ├── Appointment.js # Appointment model
│   │   └── Campaign.js  # Campaign model
│   ├── routes/           # API routes
│   │   ├── auth.js      # Authentication routes
│   │   ├── patients.js  # Patient routes
│   │   ├── appointments.js # Appointment routes
│   │   ├── campaigns.js # Campaign routes
│   │   ├── team.js     # Team routes
│   │   └── dashboard.js # Dashboard routes
│   ├── index.js         # Server entry point
│   └── package.json     # Backend dependencies
│
├── client/              # React Frontend
│   ├── public/         # Static files
│   ├── src/
│   │   ├── components/ # React components
│   │   │   ├── charts/ # Chart components
│   │   │   └── modals/ # Modal components
│   │   ├── pages/      # Page components
│   │   ├── context/    # Context providers
│   │   ├── services/   # API services
│   │   ├── App.js      # Main app component
│   │   └── index.js    # Entry point
│   └── package.json    # Frontend dependencies
│
└── README.md           # Main documentation
```

## Troubleshooting

### MongoDB Connection Issues

**Error: "MongoDB connection error"**

1. Verify MongoDB is running:
   ```bash
   # Check MongoDB status
   mongosh
   ```

2. Check connection string in `.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/pingwise
   ```

3. If using MongoDB Atlas (cloud), use:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pingwise
   ```

### Port Already in Use

**Error: "Port 5000 already in use"**

1. Change the port in `server/.env`:
   ```
   PORT=5001
   ```

2. Update `client/.env` if needed:
   ```
   REACT_APP_API_URL=http://localhost:5001/api
   ```

### Frontend Build Issues

**Error: "Module not found"**

1. Clear node_modules and reinstall:
   ```bash
   cd client
   rm -rf node_modules package-lock.json
   npm install
   ```

### Authentication Issues

**Error: "Invalid token"**

1. Clear browser localStorage:
   - Open browser DevTools (F12)
   - Go to Application/Storage tab
   - Clear Local Storage
   - Refresh the page

## Development Tips

### Running Backend Only

```bash
cd server
npm run dev
```

### Running Frontend Only

```bash
cd client
npm start
```

### Building for Production

```bash
# Build frontend
cd client
npm run build

# The build folder will contain production-ready files
```

## Security Notes

⚠️ **IMPORTANT FOR PRODUCTION:**

1. **Change JWT_SECRET**: Use a strong, random secret key
2. **Use HTTPS**: Always use HTTPS in production
3. **Environment Variables**: Never commit `.env` files to Git
4. **Database Security**: Use strong MongoDB credentials
5. **Rate Limiting**: Adjust rate limits based on your needs
6. **CORS**: Update CLIENT_URL to your production domain

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the API documentation in `server/routes/README.md`
3. Check browser console and server logs for errors

## Next Steps

1. ✅ Complete setup
2. ✅ Create admin user
3. ✅ Add team members
4. ✅ Add patients
5. ✅ Create appointments
6. ✅ Explore all features

Happy coding! 🚀

