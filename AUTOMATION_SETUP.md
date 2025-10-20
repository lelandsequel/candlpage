# 🤖 Automated Monday Morning Lead Reports

## ✅ Setup Complete!

Your lead reports are now **automatically generated every Monday at 4:00 AM** and emailed to **info@candlstrategy.com**.

### What's Running

1. **Scheduler Process** (PID: 36366)
   - Running: `python3 automation_scheduler.py`
   - Location: `/Users/sokpyeon/candlpage/automation_scheduler.py`
   - Log file: `/Users/sokpyeon/candlpage/scheduler.log`

2. **Configuration**
   - File: `/Users/sokpyeon/candlpage/automation_config.json`
   - Email: info@candlstrategy.com
   - Schedule: Every Monday at 04:00 (America/Chicago timezone)
   - Gmail App Password: Set in `.env` as `GMAIL_APP_PASSWORD`

### Configured Searches

The scheduler will run these searches every Monday:

1. **Austin, TX - Dentists** (20 leads max)
2. **Houston, TX - Solar Installation** (20 leads max)
3. **Dallas, TX - HVAC** (20 leads max)

### How It Works

1. **Monday 4:00 AM** - Scheduler wakes up
2. **Finds Leads** - Searches for leads in each configured location/industry
3. **Generates Reports** - Creates batch reports for all leads
4. **Sends Email** - Emails the reports to info@candlstrategy.com
5. **Logs Everything** - Writes to `scheduler.log`

### To Customize Searches

Edit `/Users/sokpyeon/candlpage/automation_config.json`:

```json
"searches": [
  {
    "geo": "Austin, TX",
    "industry": "dentists",
    "max_results": 20
  },
  // Add more searches here
]
```

Then restart the scheduler:
```bash
pkill -f automation_scheduler.py
cd /Users/sokpyeon/candlpage
nohup python3 -W ignore automation_scheduler.py > scheduler.log 2>&1 &
```

### To Check Status

```bash
# Check if running
ps aux | grep automation_scheduler | grep -v grep

# View logs
tail -f /Users/sokpyeon/candlpage/scheduler.log

# Stop scheduler
pkill -f automation_scheduler.py
```

### Requirements Met

✅ Batch reports working through UI
✅ Automated Monday 4am scheduling
✅ Email sending configured
✅ Multiple searches supported
✅ Running in background

### Next Steps (Optional)

- Customize the searches in `automation_config.json`
- Test by manually running: `python3 automation_scheduler.py`
- Monitor logs: `tail -f scheduler.log`

---

**Status**: 🟢 RUNNING
**Next Report**: Next Monday at 4:00 AM
