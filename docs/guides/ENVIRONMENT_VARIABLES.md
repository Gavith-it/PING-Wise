# Environment Variables Guide

This document describes all environment variables used in the PingWise application.

## Setup

1. Copy the example below to create your `.env.local` file in the root directory
2. Fill in your actual values
3. Never commit `.env.local` to version control (it's already in `.gitignore`)

## Required Variables

### Database Configuration

```env
MONGODB_URI=mongodb://localhost:27017/pingwise
```

**Options:**
- **Local MongoDB**: `mongodb://localhost:27017/pingwise`
- **MongoDB Atlas**: `mongodb+srv://username:password@cluster.mongodb.net/pingwise?retryWrites=true&w=majority`

### JWT Configuration

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRE=7d
```

**Important:**
- `JWT_SECRET` must be at least 32 characters long
- Use a strong, random secret in production
- `JWT_EXPIRE` format: `7d` (days), `24h` (hours), `60m` (minutes)

### Environment

```env
NODE_ENV=development
```

**Options:**
- `development` - Development mode with detailed logging
- `production` - Production mode with optimized logging

## Optional Variables

### Backend API Configuration

```env
NEXT_PUBLIC_CRM_API_BASE_URL=https://pw-crm-gateway-1.onrender.com
```

The base URL for the external CRM API. Defaults to the production URL if not set.

### Mock API Mode

```env
USE_MOCK_API=false
```

Set to `true` to use mock data instead of real API calls (useful for development/testing).

## Example `.env.local` File

```env
# Database
MONGODB_URI=mongodb://localhost:27017/pingwise

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRE=7d

# Environment
NODE_ENV=development

# Backend API
NEXT_PUBLIC_CRM_API_BASE_URL=https://pw-crm-gateway-1.onrender.com

# Optional: Mock API
USE_MOCK_API=false
```

## Security Notes

1. **Never commit `.env.local`** - It contains sensitive information
2. **Use different secrets** for development and production
3. **Rotate secrets** periodically in production
4. **Use environment variables** in your hosting platform for production

## Production Deployment

When deploying to production:

1. Set all environment variables in your hosting platform's dashboard
2. Ensure `NODE_ENV=production`
3. Use a strong, randomly generated `JWT_SECRET`
4. Verify all API URLs are correct for production environment
