import os
import requests
from typing import List, Dict
import base64

# A default catalog of candidate industries to rank.
CANDIDATE_INDUSTRIES = [
    "auto dealers", "law firms", "medspas", "dentists", "roofing contractors",
    "plumbers", "HVAC", "landscaping", "restaurants", "real estate agents",
    "property management", "electricians", "mortgage brokers", "moving companies",
    "physical therapy", "daycare", "private schools", "wedding venues", "veterinarians",
    "home remodeling", "solar installers", "pest control", "cleaning services",
    "orthodontists", "payroll services"
]

def _serp_volume_proxy(geo: str, industry: str) -> float:
    """Get search volume/demand using DataForSEO or SerpAPI (with fallback to stub)."""

    # Try DataForSEO first (better data)
    dataforseo_login = os.getenv("DATAFORSEO_LOGIN")
    dataforseo_password = os.getenv("DATAFORSEO_PASSWORD")

    if dataforseo_login and dataforseo_password:
        try:
            return _dataforseo_serp_analysis(geo, industry, dataforseo_login, dataforseo_password)
        except Exception as e:
            print(f"  ⚠️  DataForSEO error: {e}, trying SerpAPI...")

    # Fallback to SerpAPI
    serpapi_key = os.getenv("SERPAPI_KEY")

    if serpapi_key:
        try:
            return _serpapi_analysis(geo, industry, serpapi_key)
        except Exception as e:
            print(f"  ⚠️  SerpAPI error: {e}, using stub data")

    # Final fallback to stub data
    if not dataforseo_login and not serpapi_key:
        print(f"  ⚠️  No SERP API configured, using stub data")

    seed = abs(hash((geo.lower(), industry.lower()))) % 1000
    return 100 + (seed % 300)  # 100-400


def _dataforseo_serp_analysis(geo: str, industry: str, login: str, password: str) -> float:
    """Analyze SERP data using DataForSEO API."""

    # Create basic auth header
    credentials = f"{login}:{password}"
    encoded = base64.b64encode(credentials.encode()).decode()

    headers = {
        "Authorization": f"Basic {encoded}",
        "Content-Type": "application/json"
    }

    # Get location code for the geo
    location_code = _get_dataforseo_location_code(geo, headers)

    # DataForSEO SERP API endpoint
    url = "https://api.dataforseo.com/v3/serp/google/organic/live/advanced"

    # Request payload
    payload = [{
        "keyword": f"{industry} near me",
        "location_code": location_code,
        "language_code": "en",
        "device": "desktop",
        "os": "windows"
    }]

    response = requests.post(url, json=payload, headers=headers, timeout=30)
    response.raise_for_status()
    data = response.json()

    # Parse DataForSEO response
    if data.get("status_code") != 20000:
        raise Exception(f"DataForSEO API error: {data.get('status_message')}")

    tasks = data.get("tasks", [])
    if not tasks or not tasks[0].get("result"):
        raise Exception("No SERP results returned")

    result = tasks[0]["result"][0]

    # Extract metrics
    total_results = result.get("total_count", 0)
    items = result.get("items", [])

    # Count ads and local results
    ads_count = sum(1 for item in items if item.get("type") == "paid")
    local_count = sum(1 for item in items if item.get("type") == "local_pack")
    organic_count = sum(1 for item in items if item.get("type") == "organic")

    # Calculate demand score
    # More results + more ads + more local = higher demand
    score = (total_results / 10000) + (ads_count * 50) + (local_count * 100) + (organic_count * 5)

    print(f"  📊 DataForSEO: {industry} in {geo} - {int(total_results):,} results, {ads_count} ads, {local_count} local packs")

    return min(score, 1000)  # Cap at 1000


def _get_dataforseo_location_code(geo: str, headers: dict) -> int:
    """Get DataForSEO location code for a geography string.

    Args:
        geo: Geography string like "Houston, TX" or "Austin, Texas"
        headers: Auth headers for DataForSEO API

    Returns:
        Location code (integer)
    """
    # Extract city name (first part before comma)
    city = geo.split(',')[0].strip()

    url = "https://api.dataforseo.com/v3/serp/google/locations"
    payload = [{"location_name": city}]

    response = requests.post(url, json=payload, headers=headers, timeout=15)
    response.raise_for_status()
    data = response.json()

    if data.get("status_code") != 20000:
        raise Exception(f"Location lookup failed: {data.get('status_message')}")

    results = data["tasks"][0].get("result", [])
    if not results:
        raise Exception(f"No location found for: {geo}")

    # Return first result (usually the most relevant)
    location_code = results[0]["location_code"]
    location_name = results[0]["location_name"]

    print(f"  📍 Using location: {location_name} (code: {location_code})")

    return location_code


def _serpapi_analysis(geo: str, industry: str, api_key: str) -> float:
    """Analyze SERP data using SerpAPI (fallback)."""

    params = {
        "engine": "google",
        "q": f"{industry} near me",
        "location": geo,
        "api_key": api_key,
        "num": 10
    }

    response = requests.get("https://serpapi.com/search", params=params, timeout=15)
    response.raise_for_status()
    data = response.json()

    # Extract demand signals
    total_results = data.get("search_information", {}).get("total_results", 0)
    ads_count = len(data.get("ads", []))
    local_results = len(data.get("local_results", []))

    # Calculate demand score
    score = (total_results / 10000) + (ads_count * 50) + (local_results * 20)

    print(f"  📊 SerpAPI: {industry} in {geo} - {int(total_results):,} results, {ads_count} ads, {local_results} local")

    return min(score, 1000)  # Cap at 1000

def _site_quality_penalty(geo: str, industry: str) -> float:
    # TODO: sample top N sites and penalize if they already look optimized (schema present, etc.).
    # For now, basic heuristic.
    base = 1.0
    if industry in ["law firms", "auto dealers", "medspas"]:
        base *= 0.8  # more competitive; many are already optimized
    return base

def discover_top_industries(geo: str, k: int = None) -> List[str]:
    """Discover top industries with highest SEO need in a geography.

    Args:
        geo: Geography string (e.g., "Houston, TX")
        k: Number of industries to return (defaults to MAX_INDUSTRIES env var)

    Returns:
        List of industry names, ranked by SEO opportunity score
    """
    if not geo or not geo.strip():
        raise ValueError("geo parameter cannot be empty")

    max_industries = int(os.getenv("MAX_INDUSTRIES", "5"))
    k = k or max_industries

    if k <= 0:
        raise ValueError(f"k must be positive, got {k}")

    scores: Dict[str, float] = {}
    for ind in CANDIDATE_INDUSTRIES:
        demand = _serp_volume_proxy(geo, ind)
        penalty = _site_quality_penalty(geo, ind)
        score = demand * penalty
        scores[ind] = score

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [name for name, _ in ranked[:k]]
