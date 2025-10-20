# Production Deployment Checklist

## Pre-Deployment

### Code Quality
- [ ] All code reviewed and tested
- [ ] No console.log or debug statements left in code
- [ ] Error handling implemented for all API endpoints
- [ ] Input validation on all endpoints
- [ ] Rate limiting configured
- [ ] CORS properly configured for production domain

### Environment
- [ ] .env file created with all required API keys
- [ ] .env file is NOT committed to git
- [ ] .env.example file created with placeholder values
- [ ] All API keys are valid and have sufficient quota
- [ ] Database credentials are secure
- [ ] Logging is configured

### Dependencies
- [ ] npm install completed successfully
- [ ] pip install -r requirements.txt completed successfully
- [ ] No security vulnerabilities in dependencies
- [ ] All dependencies are pinned to specific versions

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing of all features completed
- [ ] Load testing completed
- [ ] Error scenarios tested

## Deployment

### Pre-Deployment Checks
```bash
# Validate environment
./validate_env.sh

# Check health endpoints
curl http://localhost:5057/health/detailed
curl http://localhost:3001/health
```

### Deployment Steps

1. **Backup Current State**
   ```bash
   git tag -a v$(date +%Y%m%d_%H%M%S) -m "Pre-deployment backup"
   git push --tags
   ```

2. **Pull Latest Code**
   ```bash
   git pull origin main
   ```

3. **Install Dependencies**
   ```bash
   npm install
   pip install -r requirements.txt
   ```

4. **Run Migrations** (if applicable)
   ```bash
   # Add migration commands here
   ```

5. **Start Services**
   ```bash
   # Option A: Using start script
   ./start.sh
   
   # Option B: Using PM2
   pm2 start ecosystem.config.js
   ```

6. **Verify Deployment**
   ```bash
   # Check health
   curl http://localhost:5057/health/detailed
   
   # Test lead search
   curl -X POST http://localhost:3001/api/leads \
     -H "Content-Type: application/json" \
     -d '{"geo":"Houston, TX","industry":"Personal Injury Lawyers","max_results":3}'
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

