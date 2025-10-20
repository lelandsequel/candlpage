# Deployment Guide - Lead Generator Application

## Architecture Overview

The application consists of three main services:

1. **React Frontend** (Vite) - Port 5173
   - User interface for lead generation and reporting
   - Communicates with Express backend

2. **Express Backend** (Node.js) - Port 3001
   - Proxy server that routes requests to Python API
   - Handles CORS and request forwarding
   - Loads environment variables from .env

3. **Python API** (FastAPI) - Port 5057
   - Core business logic for lead finding and scoring
   - Integrates with Google Places API and PageSpeed Insights
   - Generates lead reports

## Prerequisites

- Node.js 18+ (for Express and Vite)
- Python 3.9+ (for FastAPI)
- npm or yarn (for Node dependencies)
- pip (for Python dependencies)

## Environment Setup

### 1. Create .env file

Create `/Users/sokpyeon/candlpage/.env` with:

```env
# Required API Keys
OPENAI_API_KEY=sk-your-openai-key
GOOGLE_PLACES_API_KEY=your-google-places-key
HUNTER_API_KEY=your-hunter-key

# Optional
ANTHROPIC_API_KEY=sk-your-anthropic-key
DATAFORSEO_LOGIN=your-email
DATAFORSEO_PASSWORD=your-password

# Ports
PORT=3001
```

### 2. Install Dependencies

```bash
# Node dependencies
cd /Users/sokpyeon/candlpage
npm install

# Python dependencies
cd /Users/sokpyeon/candlpage
pip install -r requirements.txt
```

## Starting the Application

### Option 1: Manual Start (Development)

```bash
# Terminal 1: Python API
cd /Users/sokpyeon/candlpage
python3 -m uvicorn python_api:app --host 0.0.0.0 --port 5057 --reload

# Terminal 2: Express Backend
cd /Users/sokpyeon/candlpage
node server.js

# Terminal 3: React Frontend
cd /Users/sokpyeon/candlpage
npm run dev
```

### Option 2: Using Startup Script (Recommended)

```bash
cd /Users/sokpyeon/candlpage
chmod +x start.sh
./start.sh
```

### Option 3: Using PM2 (Production)

```bash
# Install PM2 globally
npm install -g pm2

# Start all services
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# View logs
pm2 logs
```

## Health Checks

### Basic Health Check
```bash
curl http://localhost:5057/health
curl http://localhost:3001/health
```

### Detailed Health Check
```bash
curl http://localhost:5057/health/detailed
```

Expected response:
```json
{
  "api": "ok",
  "timestamp": "2024-10-20T12:00:00",
  "dependencies": {
    "openai": "configured",
    "google_places": "configured",
    "python_modules": "ok"
  }
}
```

## Troubleshooting

### Issue: "Cannot find module 'express'"
**Solution:** Run `npm install` in the candlpage directory

### Issue: "ModuleNotFoundError: No module named 'fastapi'"
**Solution:** Run `pip install -r requirements.txt`

### Issue: "GOOGLE_PLACES_API_KEY not set"
**Solution:** Add the key to .env file and restart the Python API

### Issue: Port already in use
**Solution:** Kill the process using the port:
```bash
# Find process on port 5057
lsof -i :5057
# Kill it
kill -9 <PID>
```

### Issue: Leads not loading
**Solution:** 
1. Check Python API logs for errors
2. Verify Google Places API key is valid
3. Check network connectivity
4. Verify Express server is running on port 3001

## Monitoring

### View Logs

```bash
# Python API logs (Terminal 1)
# Express logs (Terminal 2)
# React logs (Terminal 3)
```

### Key Metrics to Monitor

- API response times (should be < 60 seconds for lead finding)
- Error rates in logs
- Memory usage
- CPU usage

## Deployment Checklist

- [ ] All environment variables set in .env
- [ ] Dependencies installed (npm install, pip install)
- [ ] Health checks passing
- [ ] Test lead search works
- [ ] Test report generation works
- [ ] Logs are being written correctly
- [ ] Error handling is working
- [ ] CORS is configured correctly

## Production Deployment

For production deployment:

1. Use PM2 or systemd for process management
2. Set up log rotation
3. Configure monitoring and alerting
4. Use environment-specific .env files
5. Enable HTTPS
6. Set up database backups
7. Configure rate limiting
8. Set up error tracking (Sentry, etc.)

## Rollback Procedure

If deployment fails:

1. Stop all services: `pm2 stop all`
2. Revert code changes: `git checkout <previous-commit>`
3. Restart services: `pm2 start all`
4. Verify health checks: `curl http://localhost:5057/health/detailed`

