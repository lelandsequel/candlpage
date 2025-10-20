# Production Deployment Checklist - Railway

## Pre-Deployment ✅

### Code Quality
- [x] All code reviewed and tested
- [x] Duplicate code removed from server.js
- [x] Error handling implemented for all API endpoints
- [x] Input validation on all endpoints
- [x] CORS properly configured
- [x] Build passes: `npm run build` ✅

### Environment
- [x] .env file created with all required API keys
- [x] .env file is NOT committed to git (in .gitignore)
- [x] All API keys are valid and tested:
  - [x] OPENAI_API_KEY - tested with keyword generation
  - [x] ANTHROPIC_API_KEY - for security/SEO audits
  - [x] DATAFORSEO credentials - for lead generation
  - [x] Google API keys - for Places/PSI

### Dependencies
- [x] npm install completed successfully
- [x] All dependencies pinned to specific versions
- [x] No security vulnerabilities in dependencies

### Testing
- [x] Keyword generation API tested ✅
- [x] Health check endpoint working ✅
- [x] Frontend builds successfully ✅
- [x] All routes accessible locally ✅

## Deployment to Railway

### Step 1: Prepare Repository
```bash
# Ensure all changes are committed
git status

# Tag this version
git tag -a v1.0.0-production -m "Production deployment to Railway"
git push origin main --tags
```

### Step 2: Railway Setup
1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select: `lelandsequel/candlpage`
5. Railway will auto-detect Node.js project

### Step 3: Configure Environment Variables in Railway
In Railway Dashboard → Variables tab, add:
```
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
DATAFORSEO_LOGIN=leland@sequelcompanies.io
DATAFORSEO_PASSWORD=ecc187c9e7cea9c1
GOOGLE_PLACES_API_KEY=AIzaSyA9VmB163rkHSKPj3PN9GEKPE6vmkXqsZI
PSI_API_KEY=AIzaSyCOaEBk9gYf35_upsgqYSe1HmGg3RNvN30
PORT=3001
NODE_ENV=production
```

### Step 4: Deploy
1. Click "Deploy" button in Railway
2. Wait for build to complete (2-5 minutes)
3. Railway will provide a public URL

### Step 5: Verify Deployment
```bash
# Test health endpoint
curl https://candlpage-production.up.railway.app/health

# Test keyword generation
curl -X POST https://candlpage-production.up.railway.app/api/keywords \
  -H "Content-Type: application/json" \
  -d '{"topic":"digital marketing agency"}'
```

## Post-Deployment

### Monitoring
- [ ] All services are running
- [ ] Health checks are passing
- [ ] No errors in logs
- [ ] Response times are acceptable
- [ ] Memory usage is normal
- [ ] CPU usage is normal

### Verification
- [ ] Frontend loads correctly
- [ ] Lead search works
- [ ] Report generation works
- [ ] CSV export works
- [ ] All API endpoints respond correctly

### Rollback Plan
If deployment fails:

```bash
# Stop all services
pm2 stop all

# Revert to previous version
git checkout <previous-commit>

# Reinstall dependencies
npm install
pip install -r requirements.txt

# Restart services
pm2 start all

# Verify
curl http://localhost:5057/health/detailed
```

## Monitoring & Maintenance

### Daily Checks
- [ ] Check error logs for issues
- [ ] Monitor API response times
- [ ] Check API quota usage
- [ ] Verify all services are running

### Weekly Checks
- [ ] Review performance metrics
- [ ] Check for security updates
- [ ] Review user feedback
- [ ] Backup database

### Monthly Checks
- [ ] Security audit
- [ ] Performance optimization
- [ ] Dependency updates
- [ ] Capacity planning

## Troubleshooting

### Service Won't Start
1. Check logs: `tail -f logs/*.log`
2. Verify environment variables: `./validate_env.sh`
3. Check port availability: `lsof -i :5057`
4. Check disk space: `df -h`

### High Memory Usage
1. Check for memory leaks in logs
2. Restart services: `pm2 restart all`
3. Monitor with: `pm2 monit`

### Slow Response Times
1. Check API quota usage
2. Check network connectivity
3. Check database performance
4. Review logs for errors

### API Errors
1. Check API keys are valid
2. Check API quota hasn't been exceeded
3. Check network connectivity
4. Review error logs for details

## Security Checklist

- [ ] HTTPS enabled
- [ ] API keys are not logged
- [ ] Sensitive data is encrypted
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Input validation is implemented
- [ ] SQL injection prevention (if using DB)
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Regular security updates

## Performance Optimization

- [ ] Caching implemented
- [ ] Database queries optimized
- [ ] API responses are compressed
- [ ] Frontend assets are minified
- [ ] Images are optimized
- [ ] CDN is configured (if applicable)

## Disaster Recovery

- [ ] Backups are automated
- [ ] Backup restoration tested
- [ ] Disaster recovery plan documented
- [ ] Contact information for on-call support
- [ ] Escalation procedures documented

