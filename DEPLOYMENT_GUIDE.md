# 🚀 LinguaLink Deployment Guide

## Overview
LinguaLink is a real-time translation messaging application with a multi-backend architecture optimized for Render's free tier. This guide covers deployment, configuration, and scaling.

## Architecture

```
Frontend (Vercel)
    ↓
Smart Backend Manager
    ↓
Multiple Backend Instances (Render)
    ↓
DeepL Translation API (Multiple Keys)
    ↓
Shared Database (Neon PostgreSQL)
```

## Prerequisites

### Required Accounts
- **Neon Database**: PostgreSQL database hosting
- **DeepL API**: Translation service (multiple accounts for scaling)
- **Render**: Backend hosting (multiple free accounts)
- **Vercel**: Frontend hosting
- **Resend**: Email service (optional)

### Required Tools
- Node.js 18+ 
- Git
- npm/yarn/pnpm

## Backend Deployment (Render)

### 1. Prepare Backend Code
```bash
cd lingualink/backend
npm install
```

### 2. Environment Configuration
Create `.env` file based on `.env.example`:

```env
# Database (Required)
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# JWT Secret (Required)
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# DeepL API (Required)
DEEPL_API_KEY=your_deepl_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=production
CLIENT_URL=https://your-frontend-domain.vercel.app

# Email (Optional)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=LinguaLink

# Rate Limiting
ALLOW_DEV_RATE_LIMITS=false
```

### 3. Deploy to Render

#### For Each Backend Instance:

1. **Create New Web Service** on Render
2. **Connect Repository**: Link your GitHub repository
3. **Configure Build Settings**:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment**: Node.js

4. **Set Environment Variables** in Render dashboard:
   - Copy all variables from your `.env` file
   - **Important**: Use different `DEEPL_API_KEY` for each instance

5. **Deploy**: Render will automatically build and deploy

#### Multiple Instance Setup:
- **Instance 1**: Primary backend (always active)
- **Instance 2-7**: Secondary backends (rotated by Smart Keep-Alive)
- Each instance gets a unique DeepL API key
- All instances share the same database

### 4. Backend URLs
After deployment, you'll get URLs like:
- `https://your-app-name-1.onrender.com`
- `https://your-app-name-2.onrender.com`
- `https://your-app-name-3.onrender.com`
- etc.

**⚠️ IMPORTANT**: Save these URLs - you'll need them for frontend configuration.

## Frontend Deployment (Vercel)

### 1. Prepare Frontend Code
```bash
cd lingualink/frontend
npm install
```

### 2. Environment Configuration
Create `.env.production`:

```env
# Backend Configuration - Replace with YOUR actual backend URLs
VITE_BACKEND_1_URL=https://your-backend-1.onrender.com
VITE_BACKEND_1_EMAIL=your-render-account-1@example.com

VITE_BACKEND_2_URL=https://your-backend-2.onrender.com
VITE_BACKEND_2_EMAIL=your-render-account-2@example.com

VITE_BACKEND_3_URL=https://your-backend-3.onrender.com
VITE_BACKEND_3_EMAIL=your-render-account-3@example.com

# Add more backends as needed...

# Load Balancing Strategy
VITE_LOAD_BALANCING_STRATEGY=round_robin

# Keep-Alive Configuration
VITE_SMART_KEEPALIVE_ENABLED=true
```

### 3. Deploy to Vercel

1. **Connect Repository**: Link your GitHub repository
2. **Configure Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Set Environment Variables** in Vercel dashboard:
   - Copy all variables from `.env.production`

4. **Deploy**: Vercel will automatically build and deploy

## Database Setup (Neon)

### 1. Create Database
1. Sign up at [Neon](https://neon.tech)
2. Create new project
3. Copy connection string

### 2. Run Migrations
```bash
cd lingualink/backend
npm run migrate
```

### 3. Seed Data (Optional)
```bash
npm run seed
```

## Configuration Management

### Backend Configuration
Each backend instance needs:
- Unique `DEEPL_API_KEY`
- Same `DATABASE_URL`
- Same `JWT_SECRET`
- Production `CLIENT_URL`

### Frontend Configuration
The frontend automatically:
- Loads backend URLs from environment variables
- Implements smart keep-alive system
- Provides load balancing across backends
- Handles automatic failover

## Scaling Guide

### Adding More Backend Instances

1. **Create New Render Account** (for free tier)
2. **Get New DeepL API Key**
3. **Deploy New Backend Instance**:
   - Same code, different `DEEPL_API_KEY`
   - Same database connection

4. **Update Frontend Environment**:
   ```env
   VITE_BACKEND_8_URL=https://your-new-backend.onrender.com
   VITE_BACKEND_8_EMAIL=your-new-render-account@example.com
   ```

5. **Redeploy Frontend**

### Resource Optimization

The Smart Keep-Alive system automatically:
- Keeps only 2 backends active at once
- Rotates through all backends
- Saves 93% bandwidth usage
- Saves 70% instance hours
- Maximizes Render free tier efficiency

## Monitoring & Maintenance

### Health Monitoring
- **Health Endpoint**: `GET /api/health`
- **Ping Endpoint**: `GET /api/ping`
- **Status Dashboard**: Built into frontend

### Performance Monitoring
- Request success rates
- Response times
- Backend availability
- Resource usage

### Logs
- **Render**: Check service logs in dashboard
- **Vercel**: Check function logs in dashboard
- **Frontend**: Browser console for client-side logs

## Troubleshooting

### Common Issues

#### Backend Sleeping (Render)
- **Symptom**: 502/503 errors, slow first response
- **Solution**: Smart Keep-Alive system handles this automatically
- **Manual Fix**: Visit health endpoint to wake up

#### Database Connection Issues
- **Symptom**: 500 errors, database timeouts
- **Solution**: Check `DATABASE_URL` format and SSL settings
- **Fix**: Ensure `sslmode=require` in connection string

#### DeepL API Errors
- **Symptom**: Translation failures, 401/403 errors
- **Solution**: Check API key validity and quota
- **Fix**: Rotate to different backend with working API key

#### CORS Issues
- **Symptom**: Frontend can't connect to backend
- **Solution**: Update `CLIENT_URL` in backend environment
- **Fix**: Ensure frontend domain is whitelisted

### Performance Issues

#### Slow Response Times
1. Check backend health status
2. Verify DeepL API performance
3. Consider adding more backend instances
4. Review database query performance

#### High Error Rates
1. Check backend logs for errors
2. Verify environment variables
3. Test database connectivity
4. Validate API keys

## Security Considerations

### Production Checklist
- [ ] Strong `JWT_SECRET` (32+ characters)
- [ ] Database uses SSL (`sslmode=require`)
- [ ] `NODE_ENV=production` in all backends
- [ ] Rate limiting enabled (`ALLOW_DEV_RATE_LIMITS=false`)
- [ ] CORS properly configured
- [ ] No hardcoded credentials in code
- [ ] Environment variables properly set

### API Security
- Rate limiting on all endpoints
- Input validation and sanitization
- Security headers implemented
- CORS restrictions in place
- No sensitive data in logs

## Cost Optimization

### Render Free Tier Limits
- **750 hours/month** per account
- **100GB bandwidth/month** per account
- **15-minute sleep** after inactivity

### Smart Keep-Alive Benefits
- **93% bandwidth savings** vs naive approach
- **70% instance hours savings**
- **Automatic rotation** prevents permanent sleep
- **On-demand wake-up** for sleeping backends

### Scaling Strategy
1. Start with 2-3 backend instances
2. Monitor usage and performance
3. Add more instances as needed
4. Each new instance = 7x more DeepL capacity

## Support

### Documentation
- [API Documentation](./API_DOCS.md)
- [Frontend Guide](./frontend/README.md)
- [Backend Guide](./backend/README.md)

### External Resources
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [DeepL API Documentation](https://developers.deepl.com/docs)
- [Neon Documentation](https://neon.tech/docs)

---

**🎉 Your LinguaLink deployment is now ready for production!**
