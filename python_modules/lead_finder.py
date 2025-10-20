import os
import requests
from typing import List, Dict
from urllib.parse import urlparse

# Stubs for lead enumeration (directories, SERPs, GBPs). Replace with real integrations.
def _fake_directory_search(geo: str, industry: str, max_results: int) -> List[Dict]:
    """Generate fake business listings for testing."""
    seeds = []
    # Handle edge case where geo might not have comma
    city = geo.split(",")[0].strip() if "," in geo else geo.strip()

    for i in range(max_results):
        seeds.append({
            "name": f"{industry.title()} Biz {i+1}",
            "website": f"https://www.example-{industry.replace(' ', '-')}-{i+1}.com",
            "email": "",
            "phone": "",
            "city": city,
            "source": "directory_stub"
        })
    return seeds


def _google_places_search(geo: str, industry: str, max_results: int) -> List[Dict]:
    """Find real businesses using Google Places API (with fallback to stub)."""
    api_key = os.getenv("GOOGLE_PLACES_API_KEY")

    if not api_key:
        print(f"  ⚠️  GOOGLE_PLACES_API_KEY not set, using stub data")
        return _fake_directory_search(geo, industry, max_results)

    try:
        # Text search for businesses
        url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
        params = {
            "query": f"{industry} in {geo}",
            "key": api_key
        }

        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()

        if data.get("status") != "OK":
            print(f"  ⚠️  Google Places API error: {data.get('status')}, using stub data")
            return _fake_directory_search(geo, industry, max_results)

        leads = []
        places = data.get("results", [])[:max_results]

        print(f"  🗺️  Google Places: Found {len(places)} businesses for {industry}")

        for place in places:
            place_id = place.get("place_id")

            # Get place details for website, phone, etc.
            details_url = "https://maps.googleapis.com/maps/api/place/details/json"
            details_params = {
                "place_id": place_id,
                "fields": "name,website,formatted_phone_number,formatted_address",
                "key": api_key
            }

            try:
                details_response = requests.get(details_url, params=details_params, timeout=10)
                details_response.raise_for_status()
                details_data = details_response.json()

                if details_data.get("status") == "OK":
                    details = details_data.get("result", {})

                    leads.append({
                        "name": details.get("name", place.get("name", "Unknown")),
                        "website": details.get("website", ""),
                        "phone": details.get("formatted_phone_number", ""),
                        "address": details.get("formatted_address", ""),
                        "city": geo.split(",")[0].strip() if "," in geo else geo.strip(),
                        "email": "",  # Will be filled by Hunter.io
                        "source": "google_places"
                    })
            except Exception as e:
                print(f"  ⚠️  Error getting details for {place.get('name')}: {e}")
                continue

        if not leads:
            print(f"  ⚠️  No leads found via Google Places, using stub data")
            return _fake_directory_search(geo, industry, max_results)

        return leads

    except requests.exceptions.RequestException as e:
        print(f"  ⚠️  Google Places API error: {e}, using stub data")
        return _fake_directory_search(geo, industry, max_results)
    except Exception as e:
        print(f"  ⚠️  Google Places unexpected error: {e}, using stub data")
        return _fake_directory_search(geo, industry, max_results)


def _find_email_hunter(domain: str, company_name: str) -> str:
    """Find email using Hunter.io API (with fallback to empty)."""
    api_key = os.getenv("HUNTER_API_KEY")

    if not api_key or not domain:
        return ""

    try:
        url = "https://api.hunter.io/v2/domain-search"
        params = {
            "domain": domain,
            "api_key": api_key,
            "limit": 1
        }

        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        emails = data.get("data", {}).get("emails", [])
        if emails:
            email = emails[0].get("value", "")
            if email:
                print(f"    📧 Hunter.io: Found email for {domain}")
                return email

        return ""

    except Exception as e:
        # Silent fallback for emails - not critical
        return ""

def find_leads(geo: str, industry: str, max_results: int = 30) -> List[Dict]:
    """Find business leads for a given geography and industry.

    Args:
        geo: Geography string (e.g., "Houston, TX")
        industry: Industry name (e.g., "auto dealers")
        max_results: Maximum number of leads to return

    Returns:
        List of business dictionaries with name, website, email, phone, city, source
    """
    if not geo or not geo.strip():
        raise ValueError("geo parameter cannot be empty")
    if not industry or not industry.strip():
        raise ValueError("industry parameter cannot be empty")
    if max_results <= 0:
        raise ValueError(f"max_results must be positive, got {max_results}")

    # Try Google Places first, fallback to stub data
    leads = _google_places_search(geo, industry, max_results)

    # Try to find emails for businesses with websites
    hunter_enabled = bool(os.getenv("HUNTER_API_KEY"))
    if hunter_enabled:
        for lead in leads:
            website = lead.get("website", "")
            if website and "example" not in website:
                # Extract domain from URL
                try:
                    parsed = urlparse(website)
                    domain = parsed.netloc or parsed.path
                    domain = domain.replace("www.", "")

                    if domain:
                        email = _find_email_hunter(domain, lead.get("name", ""))
                        if email:
                            lead["email"] = email
                except Exception:
                    pass

    return leads
