"""
LLM-Powered SEO Analysis
Replaces expensive Ahrefs with AI-powered content analysis using Claude or GPT-4.
"""

import os
import json
import requests
from typing import Dict, Optional
from bs4 import BeautifulSoup


def _extract_page_content(url: str) -> Optional[str]:
    """Extract text content from a webpage."""
    try:
        response = requests.get(url, timeout=10, headers={
            "User-Agent": "Mozilla/5.0 (compatible; SEOBot/1.0)"
        })
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer"]):
            script.decompose()
        
        # Get text
        text = soup.get_text()
        
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)
        
        # Get meta info
        title = soup.find('title')
        title_text = title.string if title else "No title"
        
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        desc_text = meta_desc.get('content', 'No description') if meta_desc else 'No description'
        
        # Limit content length (LLMs have token limits)
        content_preview = text[:3000] if len(text) > 3000 else text
        
        return f"""
TITLE: {title_text}
META DESCRIPTION: {desc_text}
CONTENT PREVIEW: {content_preview}
"""
    except Exception as e:
        print(f"    ⚠️  Error extracting content from {url}: {e}")
        return None


def _analyze_with_claude(content: str, url: str, business_name: str = "", industry: str = "") -> Optional[Dict]:
    """Analyze website content using Claude API for sales intelligence."""
    api_key = os.getenv("ANTHROPIC_API_KEY")

    if not api_key:
        return None

    try:
        prompt = f"""You are an expert SEO consultant analyzing a local business website to create a sales pitch.

Business: {business_name}
Industry: {industry}
Website: {url}

{content}

Analyze this website and provide a JSON response with the following fields:

1. "seo_score" (0-100): Overall SEO quality score
2. "critical_issues" (array of strings): Top 3-5 SPECIFIC technical issues (e.g., "22 second load time on mobile", "Missing local business schema markup")
3. "revenue_impact" (string): Estimated monthly revenue loss from these issues (e.g., "$5,000-8,000")
4. "opportunities" (array of strings): Top 3-5 specific improvements with business impact
5. "services_offered" (array of strings): What services does this business offer?
6. "unique_selling_proposition" (string): What makes them different? (or "Not clear" if missing)
7. "call_to_action_quality" (string): "Strong", "Weak", or "Missing"
8. "target_keywords" (array of strings): What keywords are they targeting?
9. "missing_keywords" (array of strings): Important local keywords they're missing
10. "content_quality" (string): Brief assessment (2-3 sentences)
11. "quick_wins" (array of strings): 3-4 things we can fix in first 2 weeks
12. "pitch_angle" (string): Best angle to approach them (2-3 sentences focusing on their biggest pain point)

Be SPECIFIC with numbers, examples, and actionable insights. Think like a sales consultant, not just an SEO auditor."""

        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            json={
                "model": "claude-3-haiku-20240307",
                "max_tokens": 2048,
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            },
            timeout=45
        )

        response.raise_for_status()
        data = response.json()

        # Extract the text content
        content_text = data.get("content", [{}])[0].get("text", "{}")

        # Parse JSON from response
        content_text = content_text.strip()
        if content_text.startswith("```json"):
            content_text = content_text[7:]
        if content_text.startswith("```"):
            content_text = content_text[3:]
        if content_text.endswith("```"):
            content_text = content_text[:-3]
        content_text = content_text.strip()

        result = json.loads(content_text)

        print(f"    🤖 Claude: SEO Score={result.get('seo_score')}/100, Revenue Impact={result.get('revenue_impact', 'N/A')}")

        return result

    except Exception as e:
        print(f"    ⚠️  Claude API error: {e}")
        return None


def _analyze_with_openai(content: str, url: str, business_name: str = "", industry: str = "") -> Optional[Dict]:
    """Analyze website content using OpenAI GPT API for sales intelligence."""
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        return None

    try:
        prompt = f"""You are an expert SEO consultant analyzing a local business website to create a sales pitch.

Business: {business_name}
Industry: {industry}
Website: {url}

{content}

Analyze this website and provide a JSON response with the following fields:

1. "seo_score" (0-100): Overall SEO quality score
2. "critical_issues" (array of strings): Top 3-5 SPECIFIC technical issues
3. "revenue_impact" (string): Estimated monthly revenue loss from these issues
4. "opportunities" (array of strings): Top 3-5 specific improvements with business impact
5. "services_offered" (array of strings): What services does this business offer?
6. "unique_selling_proposition" (string): What makes them different?
7. "call_to_action_quality" (string): "Strong", "Weak", or "Missing"
8. "target_keywords" (array of strings): What keywords are they targeting?
9. "missing_keywords" (array of strings): Important local keywords they're missing
10. "content_quality" (string): Brief assessment
11. "quick_wins" (array of strings): 3-4 things we can fix in first 2 weeks
12. "pitch_angle" (string): Best angle to approach them

Be SPECIFIC with numbers and actionable insights."""

        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-3.5-turbo",
                "messages": [
                    {"role": "system", "content": "You are an SEO sales consultant. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 2048
            },
            timeout=45
        )

        response.raise_for_status()
        data = response.json()

        # Extract the text content
        content_text = data.get("choices", [{}])[0].get("message", {}).get("content", "{}")

        # Parse JSON from response
        content_text = content_text.strip()
        if content_text.startswith("```json"):
            content_text = content_text[7:]
        if content_text.startswith("```"):
            content_text = content_text[3:]
        if content_text.endswith("```"):
            content_text = content_text[:-3]
        content_text = content_text.strip()

        result = json.loads(content_text)

        print(f"    🤖 GPT: SEO Score={result.get('seo_score')}/100")

        return result

    except Exception as e:
        print(f"    ⚠️  OpenAI API error: {e}")
        return None


def analyze_website_with_llm(url: str, business_name: str = "", industry: str = "") -> Dict:
    """
    Analyze a website using LLM (Claude or OpenAI) for sales intelligence.

    Returns dict with comprehensive sales insights including:
    - seo_score, critical_issues, revenue_impact
    - opportunities, services_offered, unique_selling_proposition
    - call_to_action_quality, target_keywords, missing_keywords
    - content_quality, quick_wins, pitch_angle
    """
    print(f"    🤖 LLM: Analyzing {url}...")

    # Extract content
    content = _extract_page_content(url)

    if not content:
        return {
            "llm_seo_score": None,
            "llm_critical_issues": [],
            "llm_revenue_impact": "Unknown",
            "llm_opportunities": [],
            "llm_services_offered": [],
            "llm_unique_selling_proposition": "Could not analyze",
            "llm_call_to_action_quality": "Unknown",
            "llm_target_keywords": [],
            "llm_missing_keywords": [],
            "llm_content_quality": "Could not analyze",
            "llm_quick_wins": [],
            "llm_pitch_angle": "Could not analyze"
        }

    # Try Claude first (cheaper and better for this task)
    result = _analyze_with_claude(content, url, business_name, industry)

    # Fallback to OpenAI if Claude not available
    if not result:
        result = _analyze_with_openai(content, url, business_name, industry)

    # If no LLM available, return empty
    if not result:
        print(f"    ⚠️  No LLM API key configured, skipping AI analysis")
        return {
            "llm_seo_score": None,
            "llm_critical_issues": [],
            "llm_revenue_impact": "Unknown",
            "llm_opportunities": [],
            "llm_services_offered": [],
            "llm_unique_selling_proposition": "No LLM configured",
            "llm_call_to_action_quality": "Unknown",
            "llm_target_keywords": [],
            "llm_missing_keywords": [],
            "llm_content_quality": "No LLM configured",
            "llm_quick_wins": [],
            "llm_pitch_angle": "No LLM configured"
        }

    return {
        "llm_seo_score": result.get("seo_score"),
        "llm_critical_issues": result.get("critical_issues", []),
        "llm_revenue_impact": result.get("revenue_impact", "Unknown"),
        "llm_opportunities": result.get("opportunities", []),
        "llm_services_offered": result.get("services_offered", []),
        "llm_unique_selling_proposition": result.get("unique_selling_proposition", ""),
        "llm_call_to_action_quality": result.get("call_to_action_quality", "Unknown"),
        "llm_target_keywords": result.get("target_keywords", []),
        "llm_missing_keywords": result.get("missing_keywords", []),
        "llm_content_quality": result.get("content_quality", ""),
        "llm_quick_wins": result.get("quick_wins", []),
        "llm_pitch_angle": result.get("pitch_angle", "")
    }


# Test function
if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    
    print("Testing LLM SEO Analyzer...")
    print("=" * 60)
    
    test_url = "https://example.com"
    result = analyze_website_with_llm(test_url)
    
    print("\nResults:")
    print(json.dumps(result, indent=2))

