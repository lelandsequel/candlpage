# 🔧 Railway Deployment Fix

## Problem
Railway detected Python and couldn't find a start command for Node.js.

## Solution Applied ✅

### 1. Updated `railway.json`
```json
{
  "build": {
    "builder": "nixpacks"
  },
  "start": "npm run build && node server.js"
}
```

### 2. Added `Procfile`
```
web: npm run build && node server.js
```

### 3. Updated `package.json`
Added start script:
```json
"start": "npm run build && node server.js"
```

## What This Does

1. **Build Phase:** Compiles React frontend with Vite
2. **Start Phase:** Starts Express backend on port 3001
3. **Serves:** Frontend from `/dist` directory

## Next Steps

### Option A: Redeploy on Railway
1. Go to Railway Dashboard
2. Click your project
3. Click "Redeploy" button
4. Wait 2-5 minutes
5. Check logs for success

### Option B: Manual Redeploy
1. Push changes to GitHub:
```bash
git add .
git commit -m "Fix Railway deployment configuration"
git push origin main
```

2. Railway will auto-redeploy (if connected to GitHub)

## Verify Deployment

Once deployed, test:

```bash
# Health check
curl https://candlpage-production.up.railway.app/health

# Keyword API
curl -X POST https://candlpage-production.up.railway.app/api/keywords \
  -H "Content-Type: application/json" \
  -d '{"topic":"digital marketing"}'
```

## Expected Response

```json
{
  "ok": true,
  "env": {
    "hasOPENAI": true,
    "hasANTHROPIC": true
  }
}
```

## Troubleshooting

### Still seeing "No start command"?
1. Clear Railway cache: Project Settings → Redeploy
2. Check that `Procfile` is in root directory
3. Verify `package.json` has `"start"` script

### Build fails?
1. Check Railway logs for errors
2. Verify all dependencies are in `package.json`
3. Run locally: `npm run build && node server.js`

### Port issues?
- Railway automatically assigns PORT
- Server reads from `process.env.PORT || 3001`
- No manual port configuration needed

## Files Modified

- ✅ `railway.json` - Added start command
- ✅ `Procfile` - Added web process
- ✅ `package.json` - Added start script

**Ready to deploy! 🚀**

