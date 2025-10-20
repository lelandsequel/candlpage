import os
import argparse
import datetime as dt
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz
from dotenv import load_dotenv

from modules import industry_discovery, lead_finder, sheets_io, scoring, alerts, seo_checks, llm_seo_analyzer, report_generator

def run_pipeline(geo: str, industries_override: list = None, industries_add: list = None):
    """Run the complete lead generation pipeline.

    Args:
        geo: Geography string (e.g., "Houston, TX")
        industries_override: If provided, skip discovery and use these industries
        industries_add: If provided, append these to discovered industries
    """
    run_date = dt.datetime.now().strftime("%Y-%m-%d")
    print(f"[{run_date}] Starting run for geo: {geo}")

    # Validate input
    if not geo or not geo.strip():
        print("❌ Error: geo parameter cannot be empty")
        return

    # Determine industries to process
    if industries_override:
        industries = industries_override
        print(f"🎯 Using manual industries: {industries}")
    else:
        try:
            industries = industry_discovery.discover_top_industries(geo)
            print(f"🔍 Discovered industries: {industries}")

            if not industries:
                print("⚠️  No industries discovered, exiting")
                return
        except Exception as e:
            print(f"❌ Error discovering industries: {e}")
            return

        # Append additional industries if specified
        if industries_add:
            industries.extend(industries_add)
            print(f"➕ Added manual industries: {industries_add}")
            print(f"📋 Final industry list: {industries}")

    all_rows = []
    for industry in industries:
        try:
            leads = lead_finder.find_leads(geo, industry, max_results=int(os.getenv("LEADS_PER_INDUSTRY", "30")))
            print(f"  Found {len(leads)} leads for {industry}")

            for lead in leads:
                try:
                    audit = seo_checks.evaluate_site(lead.get("website"))
                    score = scoring.score_lead(lead, audit)

                    # Get LLM analysis for high-scoring leads (>= 60)
                    llm_data = {}
                    if score >= 60 and lead.get("website"):
                        llm_analysis = llm_seo_analyzer.analyze_website_with_llm(
                            lead.get("website"),
                            business_name=lead.get("name", ""),
                            industry=industry
                        )
                        llm_data = llm_analysis

                    row = {
                        "RunDate": run_date,
                        "Geo": geo,
                        "Industry": industry,
                        "BusinessName": lead.get("name", ""),
                        "Website": lead.get("website", ""),
                        "Email": lead.get("email", ""),
                        "Phone": lead.get("phone", ""),
                        "City": lead.get("city", ""),
                        "TechStack": audit.get("tech_stack", ""),
                        "CoreWebVitals_LCP": audit.get("lcp", 0),
                        "HasSchema": audit.get("has_schema", False),
                        "HasFAQ": audit.get("has_faq", False),
                        "HasOrg": audit.get("has_org", False),
                        "MetaTitleOK": audit.get("meta_title_ok", False),
                        "MetaDescOK": audit.get("meta_desc_ok", False),
                        "ContentFreshMonths": audit.get("content_fresh_months", 0),
                        "TrafficTrend_90d": audit.get("traffic_trend_90d", 0),
                        "Issues": ", ".join(audit.get("issues", [])),
                        "Score": score,
                        "Notes": audit.get("notes", ""),
                        "Source": lead.get("source", ""),
                        # LLM fields
                        "LLM_SEOScore": llm_data.get("llm_seo_score"),
                        "LLM_CriticalIssues": llm_data.get("llm_critical_issues", []),
                        "LLM_RevenueImpact": llm_data.get("llm_revenue_impact", ""),
                        "LLM_Opportunities": llm_data.get("llm_opportunities", []),
                        "LLM_ServicesOffered": llm_data.get("llm_services_offered", []),
                        "LLM_USP": llm_data.get("llm_unique_selling_proposition", ""),
                        "LLM_CTAQuality": llm_data.get("llm_call_to_action_quality", ""),
                        "LLM_TargetKeywords": llm_data.get("llm_target_keywords", []),
                        "LLM_MissingKeywords": llm_data.get("llm_missing_keywords", []),
                        "LLM_ContentQuality": llm_data.get("llm_content_quality", ""),
                        "LLM_QuickWins": llm_data.get("llm_quick_wins", []),
                        "LLM_PitchAngle": llm_data.get("llm_pitch_angle", "")
                    }
                    all_rows.append(row)
                except Exception as e:
                    print(f"  ⚠️  Error processing lead {lead.get('name', 'unknown')}: {e}")
                    continue
        except Exception as e:
            print(f"  ⚠️  Error finding leads for {industry}: {e}")
            continue

    # Persist results
    if all_rows:
        sheets_io.append_rows(all_rows)

        # Alert hot leads
        hot_threshold = int(os.getenv("HOT_LEAD_THRESHOLD", "70"))
        hot = [r for r in all_rows if r["Score"] >= hot_threshold]

        # Generate sales intelligence report for hot leads
        if hot:
            print(f"\n📊 Generating sales intelligence report for {len(hot)} hot leads...")
            try:
                report_url = report_generator.generate_sales_report(hot, geo)
                if report_url:
                    print(f"✅ Sales report ready: {report_url}")
            except Exception as e:
                print(f"⚠️  Failed to generate sales report: {e}")

            alerts.notify_hot_leads(hot)

        print(f"✅ Done. Rows appended: {len(all_rows)} | Hot leads: {len(hot)}")
    else:
        print("⚠️  No leads generated, nothing to save")

def schedule_weekly(geo: str):
    tz = os.getenv("RUN_TZ", "America/Chicago")
    hour_local = int(os.getenv("RUN_HOUR_LOCAL", "9"))
    scheduler = BlockingScheduler(timezone=tz)
    # Sunday weekly
    trigger = CronTrigger(day_of_week="sun", hour=hour_local, minute=0)
    scheduler.add_job(run_pipeline, trigger, args=[geo], id="weekly_job", replace_existing=True)
    print(f"Scheduled weekly run on Sundays at {hour_local}:00 ({tz}). Ctrl+C to stop.")
    scheduler.start()

if __name__ == "__main__":
    load_dotenv()
    parser = argparse.ArgumentParser()
    parser.add_argument("--geo", default=os.getenv("DEFAULT_GEO", "Houston, TX"),
                        help="Geography to search (e.g., 'Houston, TX')")
    parser.add_argument("--once", action="store_true",
                        help="Run immediately once and exit")
    parser.add_argument("--industries", type=str,
                        help="Override auto-discovery with manual industries (comma-separated, e.g., 'dentists,plumbers,HVAC')")
    parser.add_argument("--add-industries", type=str,
                        help="Add industries to auto-discovered list (comma-separated)")
    args = parser.parse_args()

    # Parse industry lists
    industries_override = None
    industries_add = None

    if args.industries:
        industries_override = [i.strip() for i in args.industries.split(",")]

    if args.add_industries:
        industries_add = [i.strip() for i in args.add_industries.split(",")]

    if args.once:
        run_pipeline(args.geo, industries_override, industries_add)
    else:
        schedule_weekly(args.geo)
