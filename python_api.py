# api.py
# -----------------------------------------------------------------------------
# FastAPI backend for keyword + article generation (Python-native)
# Endpoints:
#   - POST /api/keywords
#   - POST /api/analyze-content
#   - POST /api/generate-article
#   - GET  /health
#
# ENV (use .env or your shell):
#   OPENAI_API_KEY=sk-...
#   ANTHROPIC_API_KEY=sk-...                 [optional, for /api/analyze]
#   DATAFORSEO_BASIC=Base64(login:password)  [optional]  OR
#   DATAFORSEO_LOGIN=you@example.com
#   DATAFORSEO_PASSWORD=yourPassword
#   PORT=3001
# -----------------------------------------------------------------------------

import os, json, hashlib, base64
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

PORT = int(os.getenv("PORT", "3001"))

app = FastAPI(title="candlpage-api", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)

def sha_id(obj: Any) -> str:
    return hashlib.sha1(json.dumps(obj, sort_keys=True).encode("utf-8")).hexdigest()[:12]

def safe_parse_json(s: str) -> Optional[dict]:
    if not isinstance(s, str): return None
    try:
        return json.loads(s)
    except Exception:
        try:
            return json.loads(s.replace("```json", "").replace("```", "").strip())
        except Exception:
            return None

# ---------------------- DataForSEO helpers (optional) ------------------------
def _dfs_auth_header() -> Optional[str]:
    basic = os.getenv("DATAFORSEO_BASIC")
    if not basic:
        login, pwd = os.getenv("DATAFORSEO_LOGIN"), os.getenv("DATAFORSEO_PASSWORD")
        if login and pwd:
            basic = base64.b64encode(f"{login}:{pwd}".encode()).decode()
    return f"Basic {basic}" if basic else None

def dfs_fetch(path: str, payload: Any) -> Optional[dict]:
    auth = _dfs_auth_header()
    if not auth:
        return None
    url = f"https://api.dataforseo.com{path}"
    r = requests.post(url, headers={"Authorization": auth, "Content-Type": "application/json"}, json=payload, timeout=60)
    if not r.ok:
        raise HTTPException(status_code=502, detail=f"DataForSEO {r.status_code}: {r.text}")
    return r.json()

def enrich_search_volume(keywords: List[str], location_name="United States", language_name="English") -> Optional[Dict[str, Optional[int]]]:
    if not _dfs_auth_header():
        return None
    out: Dict[str, Optional[int]] = {}
    chunk = 300
    for i in range(0, len(keywords), chunk):
        slice_kw = keywords[i:i+chunk]
        data = dfs_fetch("/v3/keywords_data/google_ads/search_volume/live", [{
            "language_name": language_name,
            "location_name": location_name,
            "keywords": slice_kw
        }])
        items = (data or {}).get("tasks", [{}])[0].get("result", [{}])[0].get("items", [])
        for it in items:
            vol = it.get("search_volume") or (it.get("monthly_searches") or [{}])[0].get("search_volume")
            key = (it.get("keyword") or "").lower()
            out[key] = vol
    return out

# --------------------------- Request models ----------------------------------
class KeywordsBody(BaseModel):
    topic: str

class AnalyzeBody(BaseModel):
    keywords: List[str]

class ArticleBody(BaseModel):
    keywords: List[str]
    outline: Optional[dict] = None
    style: Optional[str] = "Expert/Authoritative"
    voice_notes: Optional[str] = ""

# ------------------------------ Prompts --------------------------------------
def build_keyword_prompt(topic: str) -> str:
    return f"""Act as an SEO strategist with 10 years experience. I need keyword ideas for {topic} in Houston, TX. Focus on low competition keywords with commercial intent, provide ten keywords that a new website can rank for within thirty days. Include search volume estimates and keyword difficulty scores.

Return your response in this exact JSON format:
{{
  "keywords": [
    {{
      "keyword": "exact keyword phrase",
      "search_volume": 1200,
      "keyword_difficulty": 25,
      "commercial_intent": "high|medium|low",
      "ranking_potential": "30 days|60 days|90 days"
    }}
  ],
  "summary": "Brief explanation of the keyword strategy"
}}

Output valid JSON only. No markdown fences. No commentary."""
    
def build_analyze_prompt(keyword_list: str) -> str:
    return f"""Search for the top 3 businesses for my keywords: {keyword_list}, then extract their important SEO content. Analyze this content and extract the main topics, LSI keywords, and entities. Create a content outline that covers these topics but adds unique value.

Return your response in this exact JSON format:
{{
  "competitors": [
    {{
      "business_name": "Company Name",
      "main_topics": ["topic1", "topic2", "topic3"],
      "lsi_keywords": ["keyword1", "keyword2", "keyword3"],
      "entities": ["entity1", "entity2", "entity3"]
    }}
  ],
  "content_outline": {{
    "title": "Suggested article title",
    "sections": [
      {{
        "heading": "Section heading",
        "key_points": ["point1", "point2", "point3"],
        "unique_angle": "What makes this section unique"
      }}
    ]
  }},
  "unique_value_proposition": "How this content will be different and better"
}}

Output valid JSON only. No markdown fences. No commentary."""

def build_article_prompt(keywords: List[str], outline: Optional[dict], style: str, voice_notes: str) -> str:
    klist = ", ".join(keywords)
    style = (style or "Expert/Authoritative").strip()
    voice = f"- Voice notes to follow: {voice_notes}" if voice_notes else ""
    outline_block = f"OUTLINE GUIDANCE (follow, but improve if necessary): {json.dumps(outline)}" if outline else ""
    return f"""Create an SEO-optimized article for the keywords [{klist}].

WRITING STYLE:
- Primary style: {style}
- Keep tone consistent throughout.
{voice}

AUTHORSHIP:
- Write as a domain expert with 10+ years of hands-on experience.
- Be specific and concrete. Avoid clichés and generic fluff.

STRUCTURE:
- Introduction (hook + promise)
- 5–7 main sections using <h2> tags, optional <h3> subsections
- Skimmable bullets, short paragraphs, in-line definitions where helpful
- Conclusion with a strong call-to-action relevant to the topic

SEO RULES:
- Naturally include the target keyword(s) 3–5 times without stuffing.
- Use semantic variants and related entities.
- Suggest internal linking opportunities briefly.
- Avoid buzzwords like "delve," "realm," "landscape," "unleash," "elevate."

WORD COUNT:
- Aim for 1,400–1,800 words unless the topic truly needs less.

{outline_block}

Return ONLY valid JSON in exactly this format:
{{
  "article": {{
    "title": "SEO-optimized article title",
    "meta_description": "SEO meta description",
    "content": "Full article content in HTML with proper <h2>, <h3>, <p>, <ul>, <li>, <strong> tags (no <script>)",
    "word_count": 1500,
    "keyword_density": "2.5%",
    "faqs": [
      {{ "question": "FAQ question?", "answer": "Detailed answer" }}
    ]
  }},
  "seo_analysis": {{
    "target_keywords_used": 4,
    "readability_score": "Good",
    "content_structure": "Well-structured with proper headings"
  }}
}}"""

# ------------------------------ OpenAI call ----------------------------------
def openai_chat(prompt: str, model: str = "gpt-4o", max_tokens: int = 3000, temperature: float = 0.25) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Missing OPENAI_API_KEY")
    url = "https://api.openai.com/v1/chat/completions"
    r = requests.post(
        url,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens,
            "temperature": temperature,
        },
        timeout=120,
    )
    if not r.ok:
        raise HTTPException(status_code=r.status_code, detail=f"OpenAI error: {r.text}")
    return r.text

# ------------------------------- Routes --------------------------------------
@app.get("/health")
def health():
    return {"ok": True}

@app.post("/api/keywords")
def keywords(body: KeywordsBody):
    text = openai_chat(build_keyword_prompt(body.topic), model="gpt-4o", max_tokens=2000, temperature=0.3)
    parsed = safe_parse_json(text) or {}
    content = (parsed.get("choices") or [{}])[0].get("message", {}).get("content", "")
    result_json = safe_parse_json(content)
    if not result_json or "keywords" not in result_json:
        raise HTTPException(status_code=500, detail="Model did not return expected JSON with 'keywords'.")
    items = result_json["keywords"] if isinstance(result_json["keywords"], list) else []

    # Optional: live volume enrichment
    try:
        terms = [str(k.get("keyword", "")).strip() for k in items if k.get("keyword")]
        vol_map = enrich_search_volume(terms) or {}
        for k in items:
            key = str(k.get("keyword", "")).lower()
            if key in vol_map and vol_map[key] is not None:
                k["search_volume"] = vol_map[key]
    except Exception as e:
        # best-effort only
        pass

    result = {"keywords": items, "summary": result_json.get("summary", "")}
    return {"id": sha_id(result), "result": result}

@app.post("/api/analyze-content")
def analyze_content(body: AnalyzeBody):
    klist = ", ".join(body.keywords or [])
    text = openai_chat(build_analyze_prompt(klist), model="gpt-4o", max_tokens=3000, temperature=0.2)
    parsed = safe_parse_json(text) or {}
    content = (parsed.get("choices") or [{}])[0].get("message", {}).get("content", "")
    result_json = safe_parse_json(content)
    if not result_json:
        raise HTTPException(status_code=500, detail="Invalid JSON from model.")
    return {"id": sha_id(result_json), "result": result_json}

@app.post("/api/generate-article")
def generate_article(body: ArticleBody):
    text = openai_chat(
        build_article_prompt(body.keywords or [], body.outline, body.style or "", body.voice_notes or ""),
        model="gpt-4o",
        max_tokens=4000,
        temperature=0.25,
    )
    parsed = safe_parse_json(text) or {}
    content = (parsed.get("choices") or [{}])[0].get("message", {}).get("content", "")
    result_json = safe_parse_json(content)
    if not result_json:
        raise HTTPException(status_code=500, detail="Invalid JSON from model.")
    return {"id": sha_id(result_json), "result": result_json}

# ----------------------- Lead Generator (from modules) -------------------------
class LeadsBody(BaseModel):
    geo: str
    industry: str
    max_results: Optional[int] = 30

@app.post("/api/leads")
def find_leads(body: LeadsBody):
    """Find business leads for a given geography and industry."""
    try:
        from modules import lead_finder, scoring, seo_checks

        leads = lead_finder.find_leads(body.geo, body.industry, body.max_results)

        # Score each lead
        scored_leads = []
        for lead in leads:
            try:
                audit = seo_checks.evaluate_site(lead.get("website"))
                score = scoring.score_lead(lead, audit)
                lead["score"] = score
                scored_leads.append(lead)
            except Exception as e:
                lead["score"] = 0
                scored_leads.append(lead)

        # Sort by score descending
        scored_leads.sort(key=lambda x: x.get("score", 0), reverse=True)

        result = {
            "geo": body.geo,
            "industry": body.industry,
            "count": len(scored_leads),
            "leads": scored_leads
        }
        return {"id": sha_id(result), "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lead finder error: {str(e)}")

