import os
import json
import requests
from typing import List, Dict

def notify_hot_leads(rows: List[Dict]):
    """Send Slack notification for hot leads.

    Args:
        rows: List of hot lead dictionaries to notify about
    """
    url = os.getenv("SLACK_WEBHOOK_URL")
    if not url:
        print("⚠️  SLACK_WEBHOOK_URL not set, skipping Slack notification")
        return

    if not rows:
        print("⚠️  No hot leads to notify about")
        return

    blocks = []
    # Limit to top 10 to avoid message size limits
    for r in rows[:10]:
        blocks.extend([
            {"type": "section", "text": {"type": "mrkdwn", "text": f"*{r.get('BusinessName', 'Unknown')}* ({r.get('Industry', 'Unknown')}) — Score {r.get('Score', 0)}\n<{r.get('Website', '#')}|Website> | {r.get('Email') or 'no email yet'}"}},
            {"type": "context", "elements": [{"type": "mrkdwn", "text": f"{r.get('City', 'Unknown')} | Issues: {r.get('Issues') or '—'}"}]},
            {"type": "divider"}
        ])

    payload = {"text": "Hot SEO Leads", "blocks": blocks}

    try:
        response = requests.post(url, data=json.dumps(payload), headers={"Content-Type": "application/json"}, timeout=10)
        response.raise_for_status()
        print(f"✅ Slack notification sent for {len(rows[:10])} hot leads")
    except requests.exceptions.RequestException as e:
        print(f"⚠️  Failed to send Slack notification: {e}")
    except Exception as e:
        print(f"⚠️  Unexpected error sending Slack notification: {e}")
