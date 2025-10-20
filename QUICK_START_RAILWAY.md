# 🚀 Quick Start - Deploy to Railway in 5 Minutes

## What You Need
- GitHub account ✅ (you have it)
- Railway account (free)
- Your API keys (OPENAI_API_KEY, ANTHROPIC_API_KEY)

## The 5 Steps

### 1. Go to Railway
Visit: https://railway.app

### 2. Click "Start Free"
Sign up with GitHub and authorize Railway

### 3. Click "New Project" → "Deploy from GitHub repo"
Select: `lelandsequel/candlpage`

### 4. Add Environment Variables
In Railway dashboard → Variables tab, add:
- `OPENAI_API_KEY` = your key
- `ANTHROPIC_API_KEY` = your key
- `PORT` = 3001

### 5. Click "Deploy"
Wait 2-5 minutes. Done! 🎉

Your app will be live at: `https://candlpage-production.up.railway.app`

## That's It!
Every time you push to GitHub, Railway automatically redeploys.

## Need Help?
See `RAILWAY_DEPLOYMENT.md` for detailed troubleshooting
