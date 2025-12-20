# Production Deployment Guide

This guide covers deploying PingWise to production environments.

## Pre-Deployment Checklist

- [ ] Change JWT_SECRET to a strong, random value
- [ ] Update CORS settings with production domain
- [ ] Set NODE_ENV to "production"
- [ ] Configure MongoDB connection (use MongoDB Atlas or secure local instance)
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure environment variables
- [ ] Set up error logging and monitoring
- [ ] Configure backup strategy for database
- [ ] Set up rate limiting appropriate for production
- [ ] Review and update security settings

## Environment Variables

### Backend (.env)

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration (Use MongoDB Atlas or secure connection)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pingwise?retryWrites=true&w=majority

# JWT Configuration (IMPORTANT: Use a strong random secret!)
JWT_SECRET=your-very-strong-random-secret-key-minimum-32-characters
JWT_EXPIRE=7d

# CORS Configuration (Your production domain)
CLIENT_URL=https://yourdomain.com

# Rate Limiting (Adjust based on your needs)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (.env)

```env
REACT_APP_API_URL=https://api.yourdomain.com/api
```

## Building for Production

### Frontend Build

```bash
cd client
npm run build
```

This creates an optimized production build in the `client/build` directory.

### Backend

The backend doesn't need building, but ensure:
- All dependencies are installed
- Environment variables are set
- MongoDB connection is configured

## Deployment Options

### Option 1: Deploy to VPS (DigitalOcean, AWS EC2, etc.)

1. **Set up server:**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install MongoDB (or use MongoDB Atlas)
   # Install PM2 for process management
   sudo npm install -g pm2
   ```

2. **Clone and setup:**
   ```bash
   git clone <your-repo>
   cd PING
   npm run install-all
   ```

3. **Configure environment:**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with production values
   ```

4. **Build frontend:**
   ```bash
   cd ../client
   npm run build
   ```

5. **Start with PM2:**
   ```bash
   cd ../server
   pm2 start index.js --name pingwise-api
   pm2 save
   pm2 startup
   ```

6. **Serve frontend with Nginx:**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       root /path/to/PING/client/build;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Option 2: Deploy to Heroku

1. **Install Heroku CLI**

2. **Create Heroku apps:**
   ```bash
   heroku create pingwise-api
   heroku create pingwise-client
   ```

3. **Set environment variables:**
   ```bash
   heroku config:set NODE_ENV=production -a pingwise-api
   heroku config:set MONGODB_URI=your-mongodb-uri -a pingwise-api
   heroku config:set JWT_SECRET=your-secret -a pingwise-api
   ```

4. **Deploy:**
   ```bash
   git subtree push --prefix server heroku main
   ```

### Option 3: Deploy to Vercel/Netlify (Frontend) + Railway/Render (Backend)

**Frontend (Vercel/Netlify):**
1. Connect your GitHub repository
2. Set build command: `cd client && npm install && npm run build`
3. Set publish directory: `client/build`
4. Add environment variable: `REACT_APP_API_URL`

**Backend (Railway/Render):**
1. Connect your GitHub repository
2. Set root directory to `server`
3. Add environment variables
4. Deploy

## Security Best Practices

1. **Use HTTPS:**
   - Always use HTTPS in production
   - Set up SSL certificates (Let's Encrypt is free)

2. **Environment Variables:**
   - Never commit `.env` files
   - Use secure secret management
   - Rotate secrets regularly

3. **Database Security:**
   - Use strong MongoDB credentials
   - Enable MongoDB authentication
   - Use MongoDB Atlas for managed security
   - Regular backups

4. **API Security:**
   - Rate limiting is enabled
   - Input validation on all endpoints
   - CORS configured for your domain only
   - Helmet.js security headers enabled

5. **Authentication:**
   - Strong JWT secrets
   - Token expiration (7 days default)
   - Secure password hashing (bcrypt)

## Monitoring and Logging

### Recommended Tools:

1. **Error Tracking:**
   - Sentry
   - Rollbar
   - LogRocket

2. **Application Monitoring:**
   - PM2 Plus
   - New Relic
   - Datadog

3. **Uptime Monitoring:**
   - UptimeRobot
   - Pingdom
   - StatusCake

## Database Backups

### MongoDB Atlas:
- Automatic backups enabled by default
- Point-in-time recovery available

### Self-Hosted MongoDB:
```bash
# Backup
mongodump --uri="mongodb://localhost:27017/pingwise" --out=/backup/path

# Restore
mongorestore --uri="mongodb://localhost:27017/pingwise" /backup/path/pingwise
```

## Performance Optimization

1. **Frontend:**
   - Production build is optimized
   - Code splitting enabled
   - Assets minified and compressed

2. **Backend:**
   - Compression middleware enabled
   - Database indexes configured
   - Connection pooling (MongoDB)

3. **Caching:**
   - Consider Redis for session storage
   - CDN for static assets
   - Browser caching headers

## Scaling Considerations

1. **Horizontal Scaling:**
   - Use load balancer (Nginx, HAProxy)
   - Multiple backend instances
   - Session storage in Redis (if needed)

2. **Database Scaling:**
   - MongoDB replica sets
   - Read replicas for heavy read operations
   - Sharding for very large datasets

3. **CDN:**
   - Use CDN for static assets
   - CloudFlare or AWS CloudFront

## Maintenance

1. **Regular Updates:**
   - Keep dependencies updated
   - Security patches
   - Node.js version updates

2. **Monitoring:**
   - Check logs regularly
   - Monitor error rates
   - Track performance metrics

3. **Backups:**
   - Daily database backups
   - Test restore procedures
   - Off-site backup storage

## Support

For production issues:
1. Check application logs
2. Review error tracking tools
3. Monitor database performance
4. Check server resources (CPU, Memory, Disk)

## Additional Resources

- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [MongoDB Production Notes](https://docs.mongodb.com/manual/administration/production-notes/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

