from typing import Dict

WEIGHTS = {
    "traffic_decline": 30,
    "no_schema": 25,
    "stale_content": 15,
    "slow_lcp": 15,
    "ads_without_seo": 15  # Placeholder; not used in stub
}

def score_lead(lead: Dict, audit: Dict) -> int:
    """Calculate lead quality score based on SEO issues.

    Args:
        lead: Business information dict
        audit: SEO audit results dict

    Returns:
        Score from 0-100 (higher = better opportunity)
    """
    score = 0

    # Traffic decline (30 points)
    if audit.get("traffic_trend_90d", 0) <= -20:
        score += WEIGHTS["traffic_decline"]

    # Missing Schema.org (25 points)
    # BUG FIX: Changed default from True to False - missing data should not assume schema exists
    if not audit.get("has_schema", False):
        score += WEIGHTS["no_schema"]

    # Stale content (15 points)
    if audit.get("content_fresh_months", 0) >= 12:
        score += WEIGHTS["stale_content"]

    # Slow page speed (15 points)
    if audit.get("lcp", 0) > 3.0:
        score += WEIGHTS["slow_lcp"]

    # Bonus for tech stacks that are easy to fix quickly (sales-velocity bias)
    tech = audit.get("tech_stack", "")
    if tech in ("WordPress", "Wix", "Squarespace"):
        score += 10

    return min(score, 100)
