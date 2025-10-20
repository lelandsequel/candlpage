# Enhanced FastAPI backend with robust error handling and monitoring
import os, json, hashlib, base64, logging, sys
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Body, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ValidationError
import requests
from datetime import datetime

# LOGGING SETUP
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# ENVIRONMENT VALIDATION
def validate_environment():
    """Validate all required environment variables at startup."""
    required_vars = {
        'OPENAI_API_KEY': 'OpenAI API key for keyword/article generation',
        'GOOGLE_PLACES_API_KEY': 'Google Places API key for lead finding',
    }
    
    missing = []
    for var, desc in required_vars.items():
        if not os.getenv(var):
            missing.append(f"  ❌ {var}: {desc}")
    
    if missing:
        logger.error("❌ MISSING REQUIRED ENVIRONMENT VARIABLES:")
        for msg in missing:
            logger.error(msg)
        raise RuntimeError("Missing required environment variables")
    
    logger.info("✅ All required environment variables are set")

try:
    from dotenv import load_dotenv
    load_dotenv()
    logger.info("✅ Loaded .env file")
except Exception as e:
    logger.warning(f"⚠️  Could not load .env file: {e}")

try:
    validate_environment()
except RuntimeError as e:
    logger.error(f"Startup failed: {e}")
    sys.exit(1)

PORT = int(os.getenv("PORT", "5057"))

# FASTAPI APP SETUP
app = FastAPI(title="candlpage-api", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ERROR HANDLING MIDDLEWARE
@app.middleware("http")
async def error_handling_middleware(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except ValidationError as e:
        logger.error(f"Validation error: {e}")
        return JSONResponse(status_code=400, content={"error": "Invalid request", "details": str(e)})
    except Exception as e:
        logger.error(f"Unhandled error: {e}", exc_info=True)
        return JSONResponse(status_code=500, content={"error": "Internal server error", "details": str(e)})

# UTILITY FUNCTIONS
def sha_id(obj: Any) -> str:
    try:
        return hashlib.sha1(json.dumps(obj, sort_keys=True).encode("utf-8")).hexdigest()[:12]
    except Exception as e:
        logger.error(f"Error generating hash: {e}")
        return "unknown"

def safe_parse_json(s: str) -> Optional[dict]:
    if not isinstance(s, str):
        return None
    try:
        return json.loads(s)
    except Exception:
        try:
            return json.loads(s.replace("```json", "").replace("```", "").strip())
        except Exception:
            return None

# HEALTH CHECK ENDPOINTS
@app.get("/health")
def health():
    return {"ok": True, "timestamp": datetime.now().isoformat()}

@app.get("/health/detailed")
def health_detailed():
    checks = {"api": "ok", "timestamp": datetime.now().isoformat(), "dependencies": {}}
    
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        checks["dependencies"]["openai"] = "configured" if api_key else "missing"
    except Exception as e:
        checks["dependencies"]["openai"] = f"error: {str(e)}"
    
    try:
        api_key = os.getenv("GOOGLE_PLACES_API_KEY")
        checks["dependencies"]["google_places"] = "configured" if api_key else "missing"
    except Exception as e:
        checks["dependencies"]["google_places"] = f"error: {str(e)}"
    
    try:
        from python_modules import lead_finder, scoring, seo_checks
        checks["dependencies"]["python_modules"] = "ok"
    except Exception as e:
        checks["dependencies"]["python_modules"] = f"error: {str(e)}"
    
    return checks

# REQUEST MODELS
class LeadsBody(BaseModel):
    geo: str
    industry: str
    max_results: Optional[int] = 30

class LeadReportBody(BaseModel):
    lead: dict
    geo: str
    industry: str

# LEAD FINDER ENDPOINTS
@app.post("/api/leads")
def find_leads(body: LeadsBody):
    logger.info(f"🔍 Finding leads for {body.industry} in {body.geo}")
    try:
        from python_modules import lead_finder, scoring, seo_checks
        
        if not body.geo or not body.industry:
            raise ValueError("geo and industry are required")
        
        leads = lead_finder.find_leads(body.geo, body.industry, body.max_results)
        logger.info(f"✅ Found {len(leads)} leads")
        
        scored_leads = []
        for i, lead in enumerate(leads):
            try:
                audit = seo_checks.evaluate_site(lead.get("website"))
                score = scoring.score_lead(lead, audit)
                lead["score"] = score
                scored_leads.append(lead)
            except Exception as e:
                logger.warning(f"Error scoring lead {i}: {e}")
                lead["score"] = 0
                scored_leads.append(lead)
        
        scored_leads.sort(key=lambda x: x.get("score", 0), reverse=True)
        
        result = {"geo": body.geo, "industry": body.industry, "count": len(scored_leads), "leads": scored_leads}
        logger.info(f"✅ Returning {len(scored_leads)} scored leads")
        return {"id": sha_id(result), "result": result}
        
    except Exception as e:
        logger.error(f"❌ Lead finder error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Lead finder error: {str(e)}")

@app.post("/api/lead-report")
def generate_lead_report(body: LeadReportBody):
    logger.info(f"📄 Generating report for {body.lead.get('name', 'Unknown')}")
    try:
        lead = body.lead
        score = lead.get("score", 0)
        
        if score >= 80:
            urgency = "🔴 HIGH PRIORITY"
        elif score >= 60:
            urgency = "🟠 GOOD OPPORTUNITY"
        else:
            urgency = "🟡 WORTH INVESTIGATING"
        
        report = f"""
{'='*70}
LEAD INTELLIGENCE REPORT
{'='*70}

BUSINESS: {lead.get('name', 'Unknown')}
SCORE: {score}/100 ({urgency})
INDUSTRY: {body.industry}
LOCATION: {lead.get('city', 'N/A')}

{'='*70}
CONTACT INFORMATION
{'='*70}

Phone: {lead.get('phone', 'N/A')}
Website: {lead.get('website', 'N/A')}
Address: {lead.get('address', 'N/A')}

{'='*70}
SEO ANALYSIS
{'='*70}

Overall SEO Health: {score}/100
Source: {lead.get('source', 'N/A')}

{'='*70}
NEXT STEPS
{'='*70}

1. Review: {lead.get('website', 'N/A')}
2. Call: {lead.get('phone', 'N/A')}
3. Pitch: "I help businesses like yours rank higher in Google."

{'='*70}
Generated: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}
"""
        
        logger.info(f"✅ Report generated for {lead.get('name')}")
        return {"id": sha_id({"lead": lead.get("name"), "report": report}), "result": {"lead_name": lead.get("name"), "report": report, "score": score}}
    except Exception as e:
        logger.error(f"❌ Report generation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Report generation error: {str(e)}")

# STARTUP EVENT
@app.on_event("startup")
async def startup_event():
    logger.info("="*70)
    logger.info("🚀 Starting candlpage-api v2.0.0")
    logger.info(f"📍 Running on port {PORT}")
    logger.info("="*70)

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("🛑 Shutting down candlpage-api")
