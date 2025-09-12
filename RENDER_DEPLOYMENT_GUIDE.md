# Render Deployment Troubleshooting Guide

## Current Deployment Issue

**Error**: `Cannot find module '/opt/render/project/src/dist/main.js'`

### Root Cause
The deployment is looking for the main.js file at the wrong path. This typically happens when:
1. Build output directory is not in the expected location
2. Start command path is incorrect
3. Working directory context is wrong

### Solutions Applied

#### 1. ✅ Created render.yaml Configuration
- Properly configured build and start commands
- Set correct working directory
- Added health check endpoint

#### 2. ✅ Verified Package.json Scripts
```json
{
  "scripts": {
    "build": "nest build",
    "start": "node dist/main.js",
    "start:prod": "node dist/main.js"
  }
}
```

#### 3. ✅ Health Check Endpoint
- Available at `/api/v1` (root of API)
- Returns API status and version info

### Alternative Fixes to Try

#### Option 1: Update Start Command in render.yaml
```yaml
startCommand: cd /opt/render/project/src && npm run start:prod
```

#### Option 2: Absolute Path in Package.json
```json
{
  "scripts": {
    "start:prod": "node /opt/render/project/src/dist/main.js"
  }
}
```

#### Option 3: Use Process.cwd() Resolution
```json
{
  "scripts": {
    "start:prod": "cd $(dirname $0) && node dist/main.js"
  }
}
```

### Debugging Steps

1. **Check Build Output**:
   - Verify `dist` folder exists after build
   - Confirm `main.js` is in the `dist` folder

2. **Environment Variables**:
   - Ensure all required environment variables are set in Render
   - Database URLs, API keys, JWT secrets, etc.

3. **Dependencies**:
   - Make sure all production dependencies are installed
   - Check for any missing peer dependencies

### Environment Variables Needed in Render

**Required**:
```env
NODE_ENV=production
PORT=(auto-assigned by Render)
DATABASE_URL=your-supabase-url
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-key
JWT_SECRET=your-jwt-secret
```

**Payment Gateways**:
```env
PAYSTACK_SECRET_KEY=your-paystack-key
FLUTTERWAVE_SECRET_KEY=your-flutterwave-key
FLUTTERWAVE_ENCRYPTION_KEY=your-encryption-key
```

**Email Service**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-app-password
```

### Manual Deployment Steps

If render.yaml doesn't work, configure manually in Render dashboard:

1. **Build Command**: `npm install && npm run build`
2. **Start Command**: `npm run start:prod`
3. **Node Version**: 22.x (latest)
4. **Root Directory**: `/`
5. **Environment**: `Node`

### Success Indicators

✅ **Build Phase**:
- `npm install` completes without errors
- `npm run build` creates `dist` folder
- `main.js` exists in `dist` folder

✅ **Start Phase**:
- Server starts without module errors
- Health check responds at `/api/v1`
- No database connection errors

### Common Render Issues

1. **Missing Environment Variables**: Add all required variables in Render dashboard
2. **Database Connection**: Ensure Supabase URLs and keys are correct
3. **Port Binding**: Use `process.env.PORT` in your main.ts
4. **Memory Limits**: Upgrade plan if hitting memory limits
5. **Build Timeout**: Optimize dependencies or upgrade plan

### Next Steps

1. Deploy with the new render.yaml configuration
2. Monitor deployment logs for any remaining issues
3. Test API endpoints after successful deployment
4. Verify payment integration works in production environment