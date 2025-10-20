"""
Google Docs Sales Report Generator
Creates professional sales intelligence reports for hot leads.
"""

import os
from typing import List, Dict
from datetime import datetime
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


SCOPE = [
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/drive"
]


def _get_docs_service():
    """Get Google Docs API service."""
    json_path = os.getenv("GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON_PATH", "./secrets/google-service-account.json")
    if not os.path.exists(json_path):
        raise FileNotFoundError(f"Google credentials not found at: {json_path}")
    
    creds = Credentials.from_service_account_file(json_path, scopes=SCOPE)
    return build('docs', 'v1', credentials=creds)


def _get_drive_service():
    """Get Google Drive API service."""
    json_path = os.getenv("GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON_PATH", "./secrets/google-service-account.json")
    if not os.path.exists(json_path):
        raise FileNotFoundError(f"Google credentials not found at: {json_path}")
    
    creds = Credentials.from_service_account_file(json_path, scopes=SCOPE)
    return build('drive', 'v3', credentials=creds)


def _format_lead_section(lead: Dict, rank: int) -> List[Dict]:
    """Format a single lead into Google Docs requests."""
    requests = []
    
    # Business name header
    business_name = lead.get('BusinessName', 'Unknown Business')
    score = lead.get('Score', 0)
    
    # Determine urgency level
    if score >= 90:
        urgency = "🔴 CRITICAL - Immediate Action Needed"
        urgency_color = {"red": 0.8, "green": 0.0, "blue": 0.0}
    elif score >= 80:
        urgency = "🟠 HIGH PRIORITY"
        urgency_color = {"red": 1.0, "green": 0.5, "blue": 0.0}
    else:
        urgency = "🟡 GOOD OPPORTUNITY"
        urgency_color = {"red": 1.0, "green": 0.8, "blue": 0.0}
    
    # Section header
    header_text = f"\n{'═' * 70}\n"
    header_text += f"#{rank}. {business_name.upper()}\n"
    header_text += f"Score: {score}/100 ({urgency})\n"
    header_text += f"{'═' * 70}\n\n"
    
    # Contact info
    contact_text = f"📞 Phone: {lead.get('Phone', 'N/A')}\n"
    contact_text += f"🌐 Website: {lead.get('Website', 'N/A')}\n"
    contact_text += f"📍 Location: {lead.get('City', 'N/A')}\n"
    contact_text += f"🏢 Industry: {lead.get('Industry', 'N/A')}\n"
    contact_text += f"⚙️  Tech Stack: {lead.get('TechStack', 'N/A')}\n\n"
    
    # Critical issues
    issues = lead.get('Issues', '').split(', ') if lead.get('Issues') else []
    llm_issues = lead.get('LLM_CriticalIssues', [])
    
    issues_text = "🚨 CRITICAL ISSUES COSTING THEM CUSTOMERS:\n\n"
    
    # Technical issues
    if issues:
        for i, issue in enumerate(issues, 1):
            if issue == "Slow LCP":
                lcp = lead.get('CoreWebVitals_LCP', 0)
                issues_text += f"{i}. Website Loads in {lcp:.1f} Seconds (Should be under 3s)\n"
                issues_text += f"   → 53% of mobile users abandon sites that take >3s to load\n"
                issues_text += f"   → They're losing potential customers every day\n\n"
            elif issue == "No Schema.org":
                issues_text += f"{i}. Missing Schema Markup\n"
                issues_text += f"   → Not showing up in Google's local pack\n"
                issues_text += f"   → Competitors with schema get 30% more clicks\n\n"
            elif issue == "Stale Content":
                months = lead.get('ContentFreshMonths', 0)
                issues_text += f"{i}. Content Last Updated {months} Months Ago\n"
                issues_text += f"   → Google penalizes stale content\n"
                issues_text += f"   → Ranking below competitors with fresh content\n\n"
            elif issue == "Traffic Decline":
                trend = lead.get('TrafficTrend_90d', 0)
                issues_text += f"{i}. Traffic Declining ({trend}% over 90 days)\n"
                issues_text += f"   → Losing visibility in search results\n"
                issues_text += f"   → Competitors are taking their market share\n\n"
    
    # LLM-identified issues
    if llm_issues and isinstance(llm_issues, list):
        for issue in llm_issues[:3]:
            issues_text += f"• {issue}\n"
    
    issues_text += "\n"
    
    # Revenue impact
    revenue_impact = lead.get('LLM_RevenueImpact', 'Unknown')
    impact_text = f"💰 ESTIMATED REVENUE IMPACT:\n"
    impact_text += f"   Monthly loss from SEO issues: {revenue_impact}\n\n"
    
    # Opportunities
    opportunities = lead.get('LLM_Opportunities', [])
    opp_text = "🎯 OPPORTUNITIES:\n\n"
    if opportunities and isinstance(opportunities, list):
        for i, opp in enumerate(opportunities[:5], 1):
            opp_text += f"{i}. {opp}\n"
    else:
        opp_text += "• Improve page speed and mobile experience\n"
        opp_text += "• Implement local SEO schema markup\n"
        opp_text += "• Refresh content with target keywords\n"
    opp_text += "\n"
    
    # Quick wins
    quick_wins = lead.get('LLM_QuickWins', [])
    wins_text = "✅ QUICK WINS (First 2 Weeks):\n\n"
    if quick_wins and isinstance(quick_wins, list):
        for i, win in enumerate(quick_wins[:4], 1):
            wins_text += f"Week {(i-1)//2 + 1}: {win}\n"
    else:
        wins_text += "Week 1: Speed optimization and mobile fixes\n"
        wins_text += "Week 1: Schema markup implementation\n"
        wins_text += "Week 2: Content refresh with local keywords\n"
        wins_text += "Week 2: Technical SEO improvements\n"
    wins_text += "\n"
    
    # Pitch angle
    pitch_angle = lead.get('LLM_PitchAngle', '')
    pitch_text = "🎯 PITCH ANGLE:\n\n"
    if pitch_angle:
        pitch_text += f"{pitch_angle}\n\n"
    else:
        pitch_text += f"\"I was analyzing {lead.get('Industry', 'businesses')} in {lead.get('City', 'your area')} "
        pitch_text += f"and noticed your website has some technical issues that are costing you customers. "
        pitch_text += f"Do you have 2 minutes for me to show you what I found?\"\n\n"
    
    # Call script
    script_text = "📞 OPENING CALL SCRIPT:\n\n"
    script_text += f"\"Hi, this is [YOUR NAME]. I was doing some research on {lead.get('Industry', 'local businesses')} "
    script_text += f"in {lead.get('City', 'the area')} and came across {business_name}. "
    script_text += f"I noticed a few things on your website that might be costing you customers - "
    if issues:
        script_text += f"specifically your {issues[0].lower()}. "
    script_text += f"Do you have a couple minutes to discuss how we could fix this?\"\n\n"
    
    # Services they offer (from LLM)
    services = lead.get('LLM_ServicesOffered', [])
    if services and isinstance(services, list):
        services_text = "🔧 SERVICES THEY OFFER:\n"
        services_text += ", ".join(services[:5]) + "\n\n"
    else:
        services_text = ""
    
    # Content quality assessment
    content_quality = lead.get('LLM_ContentQuality', '')
    if content_quality and content_quality not in ['Could not analyze', 'No LLM configured']:
        quality_text = f"📝 CONTENT ASSESSMENT:\n{content_quality}\n\n"
    else:
        quality_text = ""
    
    # Combine all sections
    full_text = (
        header_text +
        contact_text +
        issues_text +
        impact_text +
        opp_text +
        wins_text +
        pitch_text +
        script_text +
        services_text +
        quality_text +
        "\n"
    )
    
    return full_text


def generate_sales_report(leads: List[Dict], geo: str, output_folder: str = "./out") -> str:
    """
    Generate a professional sales intelligence report as a Google Doc.
    
    Args:
        leads: List of lead dictionaries (should be hot leads, score >= 70)
        geo: Geography string (e.g., "Denver, CO")
        output_folder: Folder to save text backup
        
    Returns:
        URL of the created Google Doc (or path to text file if Google Docs fails)
    """
    if not leads:
        print("⚠️  No leads to generate report for")
        return ""
    
    # Sort leads by score (highest first)
    sorted_leads = sorted(leads, key=lambda x: x.get('Score', 0), reverse=True)
    
    # Generate report date
    report_date = datetime.now().strftime("%Y-%m-%d")
    report_time = datetime.now().strftime("%B %d, %Y at %I:%M %p")
    
    # Create report title and summary
    title = f"SEO Lead Intelligence Report - {geo} - {report_date}"
    
    summary = f"""
{'=' * 80}
SEO LEAD INTELLIGENCE REPORT
{geo}
Generated: {report_time}
{'=' * 80}

📊 EXECUTIVE SUMMARY:

Total Hot Leads: {len(sorted_leads)}
Average Score: {sum(l.get('Score', 0) for l in sorted_leads) / len(sorted_leads):.1f}/100

Critical Priority (90+): {len([l for l in sorted_leads if l.get('Score', 0) >= 90])}
High Priority (80-89): {len([l for l in sorted_leads if 80 <= l.get('Score', 0) < 90])}
Good Opportunity (70-79): {len([l for l in sorted_leads if 70 <= l.get('Score', 0) < 80])}

🎯 RECOMMENDED ACTION:
Start with the highest-scoring leads below. Each has been analyzed for:
- Critical technical issues
- Revenue impact
- Specific pitch angles
- Quick wins you can deliver
- Ready-to-use call scripts

{'=' * 80}

"""
    
    # Generate individual lead sections
    lead_sections = []
    for rank, lead in enumerate(sorted_leads, 1):
        lead_section = _format_lead_section(lead, rank)
        lead_sections.append(lead_section)
    
    # Combine everything
    full_report = summary + "\n".join(lead_sections)
    
    # Save as text file backup
    os.makedirs(output_folder, exist_ok=True)
    text_path = f"{output_folder}/sales_report_{geo.replace(', ', '_').replace(' ', '_')}_{report_date}.txt"
    
    with open(text_path, 'w', encoding='utf-8') as f:
        f.write(full_report)
    
    print(f"✅ Sales report saved: {text_path}")
    
    # Try to create Google Doc
    try:
        docs_service = _get_docs_service()
        drive_service = _get_drive_service()
        
        # Create a new document
        doc = docs_service.documents().create(body={'title': title}).execute()
        doc_id = doc.get('documentId')
        
        # Insert the content
        requests = [
            {
                'insertText': {
                    'location': {'index': 1},
                    'text': full_report
                }
            }
        ]
        
        docs_service.documents().batchUpdate(
            documentId=doc_id,
            body={'requests': requests}
        ).execute()
        
        # Make it accessible (optional - adjust permissions as needed)
        # This makes it viewable by anyone with the link
        drive_service.permissions().create(
            fileId=doc_id,
            body={'type': 'anyone', 'role': 'reader'}
        ).execute()
        
        doc_url = f"https://docs.google.com/document/d/{doc_id}/edit"
        print(f"✅ Google Doc created: {doc_url}")
        
        return doc_url
        
    except FileNotFoundError as e:
        print(f"⚠️  Google credentials not found: {e}")
        print(f"   Report saved as text file: {text_path}")
        return text_path
    except HttpError as e:
        print(f"⚠️  Google Docs API error: {e}")
        print(f"   Report saved as text file: {text_path}")
        return text_path
    except Exception as e:
        print(f"⚠️  Failed to create Google Doc: {e}")
        print(f"   Report saved as text file: {text_path}")
        return text_path

