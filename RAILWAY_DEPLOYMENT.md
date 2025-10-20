# Railway Deployment Guide - CandlPage

Railway is the easiest way to deploy your full-stack app (React + Node.js + Python) in one place.

## Prerequisites

- GitHub account (already have it!)
- Railway account (free)
- Your environment variables ready

## Step-by-Step Deployment

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Click "Start Free"
3. Sign up with GitHub (authorize Railway)
4. You'll be redirected to your Railway dashboard

### Step 2: Create New Project
1. Click "New Project" button
2. Select "Deploy from GitHub repo"
3. Search for `candlpage` repository
4. Click to select `lelandsequel/candlpage`
5. Click "Deploy Now"

### Step 3: Configure Environment Variables
Railway will auto-detect your app. Now add your secrets:

1. In Railway dashboard, click on your project
2. Go to "Variables" tab
3. Add these environment variables:

```
OPENAI_API_KEY=sk-proj-YOUR_OPENAI_KEY_HERE

ANTHROPIC_API_KEY=sk-ant-YOUR_ANTHROPIC_KEY_HERE

PYTHON_API_BASE=http://localhost:5057

PORT=3001
```

**⚠️ IMPORTANT:** Replace the placeholder keys with your actual API keys in Railway dashboard!

### Step 4: Configure Build & Start Commands
Railway should auto-detect, but if not:

1. Go to "Settings" tab
2. Set **Build Command**:
   ```
   npm install && pip install -r requirements.txt && npm run build
   ```

3. Set **Start Command**:
   ```
   node server.js
   ```

### Step 5: Deploy
1. Click "Deploy" button
2. Wait for build to complete (2-5 minutes)
3. Once deployed, you'll get a public URL like:
   ```
   https://candlpage-production.up.railway.app
   ```

### Step 6: Test Your Deployment
1. Visit your Railway URL
2. Test each tool:
   - Press Release Generator
   - Keyword Generator
   - Security Scanner
   - SEO/AEO Audit
   - Lead Generator

## Troubleshooting

### Build Fails
- Check Railway logs: Click "Logs" tab
- Common issues:
  - Missing environment variables
  - Python dependencies not installed
  - Node modules not installed

### App Crashes After Deploy
1. Check logs in Railway dashboard
2. Verify all environment variables are set
3. Check if ports are correct (3001 for Node, 5057 for Python)

### Slow Performance
- Railway free tier has limited resources
- Upgrade to paid plan if needed ($5+/month)

### Python API Not Starting
- Ensure `python_api.py` has the main block:
  ```python
  if __name__ == '__main__':
      import uvicorn
      uvicorn.run(app, host='0.0.0.0', port=5057)
  ```

## Auto-Deploy on GitHub Push

Railway automatically redeploys when you push to GitHub:

1. Make changes locally
2. Commit: `git commit -m "your message"`
3. Push: `git push origin main`
4. Railway automatically rebuilds and deploys!

## Monitoring & Logs

In Railway dashboard:
- **Logs tab**: See real-time logs
- **Metrics tab**: CPU, memory, network usage
- **Deployments tab**: See deployment history

## Rollback to Previous Version

If something breaks:
1. Go to "Deployments" tab
2. Click on previous working deployment
3. Click "Redeploy"

## Next Steps

After successful deployment:
1. Share your Railway URL with users
2. Monitor logs for errors
3. Set up custom domain (optional)
4. Configure auto-scaling if needed

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
