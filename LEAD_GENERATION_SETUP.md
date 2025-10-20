# 🔧 Lead Generation Setup Guide

## Current Status

**Lead Generation is currently unavailable on Railway** because it requires a separate Python backend service that isn't running.

## Why It's Not Working

The lead generation feature has two parts:

1. **Node.js/Express Backend** (Running on Railway ✅)
   - Serves the frontend
   - Handles keyword research, SEO audit, press releases
   - Proxies requests to Python backend

2. **Python/FastAPI Backend** (NOT running ❌)
   - Handles lead finding and scoring
   - Runs on port 5057
   - Requires: FastAPI, uvicorn, requests, etc.

When you click "Find Leads", the Node backend tries to call the Python backend on port 5057, but it's not running, so you get:
```
"Lead generation service unavailable"
```

## How to Fix It

### Option 1: Run Python Backend Locally (Development)

```bash
# Install Python dependencies
pip install -r requirements.txt

# Start Python backend
python python_api.py
```

This starts the Python API on `http://localhost:5057`

Then the Node backend can call it and lead generation will work.

### Option 2: Deploy Python Backend to Railway (Production)

You need to create a **second Railway service** for the Python backend:

1. **Go to Railway Dashboard**
2. **Click your project**
3. **Click "New Service"**
4. **Select "GitHub"**
5. **Choose the same repo: `lelandsequel/candlpage`**
6. **In the new service settings:**
   - Set **Start Command**: `python python_api.py`
   - Set **PORT**: `5057`
   - Add environment variables (same as Node service)

7. **In the Node service settings:**
   - Add environment variable: `PYTHON_API_BASE=http://python-service:5057`
   - (Replace `python-service` with actual service name from Railway)

### Option 3: Disable Lead Generation (For Now)

If you don't need lead generation yet, you can:

1. Remove the "Lead Generator" tool from the landing page
2. Or show a "Coming Soon" message

## What's Included

The Python backend has:

- **Lead Finder** - Finds businesses by geography and industry
- **Lead Scorer** - Scores leads based on SEO health
- **Report Generator** - Creates detailed lead reports
- **Batch Reports** - Generates reports for multiple leads

## Files Involved

- `python_api.py` - Main FastAPI application
- `python_modules/` - Lead finding, scoring, reporting logic
- `requirements.txt` - Python dependencies

## Testing Locally

```bash
# Terminal 1: Start Node backend
npm run build && node server.js

# Terminal 2: Start Python backend
python python_api.py

# Terminal 3: Start frontend dev server
npm run dev
```

Then go to `http://localhost:5174/leads` and test lead generation.

## Environment Variables Needed

For Python backend:
```
OPENAI_API_KEY=<your-key>
ANTHROPIC_API_KEY=<your-key>
DATAFORSEO_LOGIN=<your-login>
DATAFORSEO_PASSWORD=<your-password>
GOOGLE_PLACES_API_KEY=<your-key>
PSI_API_KEY=<your-key>
PORT=5057
```

## Next Steps

1. **For development**: Run `python python_api.py` locally
2. **For production**: Deploy Python backend as separate Railway service
3. **Or**: Disable lead generation for now and focus on other tools

---

**Questions?** Check the error message in the browser console for more details.

