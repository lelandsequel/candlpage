#!/usr/bin/env python3
"""
Automated Monday morning lead report generator
Runs every Monday at 4am, generates batch reports, and emails them
"""

import json
import os
import smtplib
import schedule
import time
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import requests
import pytz

# Load config
with open('automation_config.json', 'r') as f:
    config = json.load(f)

def send_email(subject, body, attachment_path=None):
    """Send email with optional attachment"""
    email_config = config['email']
    
    # Handle both single email string and list of emails
    to_emails = email_config['to']
    if isinstance(to_emails, str):
        to_emails = [to_emails]
    
    msg = MIMEMultipart()
    msg['From'] = email_config['from']
    msg['To'] = ', '.join(to_emails)
    msg['Subject'] = subject
    
    msg.attach(MIMEText(body, 'plain'))
    
    # Attach report file if provided
    if attachment_path and os.path.exists(attachment_path):
        with open(attachment_path, 'rb') as attachment:
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(attachment.read())
            encoders.encode_base64(part)
            part.add_header('Content-Disposition', f'attachment; filename= {os.path.basename(attachment_path)}')
            msg.attach(part)
    
    # Send email
    try:
        server = smtplib.SMTP(email_config['smtp_server'], email_config['smtp_port'])
        if email_config['use_tls']:
            server.starttls()
        
        password = os.getenv(email_config['password_env_var'])
        if not password:
            print(f"❌ ERROR: {email_config['password_env_var']} not set in environment")
            return False
        
        server.login(email_config['from'], password)
        server.sendmail(email_config['from'], to_emails, msg.as_string())
        server.quit()
        print(f"✅ Email sent to {len(to_emails)} recipients: {', '.join(to_emails)}")
        return True
    except Exception as e:
        print(f"❌ Email error: {e}")
        return False

def generate_reports():
    """Generate batch reports for all configured searches"""
    print(f"\n{'='*60}")
    print(f"🚀 Starting automated report generation at {datetime.now()}")
    print(f"{'='*60}\n")
    
    reports = []
    
    for search in config['searches']:
        geo = search['geo']
        industry = search['industry']
        max_results = search.get('max_results', 20)
        
        print(f"📍 Searching: {geo} - {industry}")
        
        try:
            # Step 1: Find leads
            leads_response = requests.post(
                'http://localhost:3001/api/leads',
                json={'geo': geo, 'industry': industry, 'max': max_results},
                timeout=60
            )
            
            if not leads_response.ok:
                print(f"  ❌ Failed to find leads: {leads_response.text}")
                continue
            
            leads_data = leads_response.json()
            leads = leads_data.get('result', {}).get('leads', [])
            
            if not leads:
                print(f"  ⚠️  No leads found")
                continue
            
            print(f"  ✅ Found {len(leads)} leads")
            
            # Step 2: Generate batch report
            report_response = requests.post(
                'http://localhost:3001/api/batch-report',
                json={'leads': leads, 'geo': geo},
                timeout=120
            )
            
            if not report_response.ok:
                print(f"  ❌ Failed to generate report: {report_response.text}")
                continue
            
            report_data = report_response.json()
            report_content = report_data.get('content', '')
            report_path = report_data.get('path', '')
            
            print(f"  ✅ Report generated: {report_path}")
            reports.append({
                'geo': geo,
                'industry': industry,
                'leads_count': len(leads),
                'path': report_path,
                'content': report_content
            })
            
        except Exception as e:
            print(f"  ❌ Error: {e}")
            continue
    
    # Send email with all reports
    if reports:
        print(f"\n📧 Sending {len(reports)} report(s) via email...")
        
        body = f"""
Monday Morning Lead Reports
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Reports included:
"""
        for report in reports:
            body += f"\n• {report['geo']} - {report['industry']}: {report['leads_count']} leads"
        
        body += "\n\nReports are attached as text files.\n"
        
        # Send email with first report as attachment
        if reports:
            send_email(
                subject=f"📊 Monday Lead Reports - {datetime.now().strftime('%Y-%m-%d')}",
                body=body,
                attachment_path=reports[0]['path']
            )
        
        print(f"✅ All done! Reports sent")
    else:
        print("❌ No reports generated")
        send_email(
            subject=f"⚠️ Monday Lead Reports - No leads found",
            body="No leads were found for any of the configured searches."
        )

def schedule_reports():
    """Schedule the report generation"""
    schedule_config = config['schedule']
    
    # Schedule for Monday at specified time
    schedule.every().monday.at(f"{schedule_config['hour']:02d}:{schedule_config['minute']:02d}").do(generate_reports)
    
    print(f"✅ Scheduler started")
    print(f"📅 Reports will run every {schedule_config['day'].capitalize()} at {schedule_config['hour']:02d}:{schedule_config['minute']:02d}")
    
    email_config = config['email']
    to_emails = email_config['to']
    if isinstance(to_emails, str):
        to_emails = [to_emails]
    print(f"📧 Reports will be sent to: {', '.join(to_emails)}\n")
    
    # Keep scheduler running
    while True:
        schedule.run_pending()
        time.sleep(60)

if __name__ == '__main__':
    try:
        schedule_reports()
    except KeyboardInterrupt:
        print("\n⏹️  Scheduler stopped")
