# CandlPage - Application Structure & Architecture

## Overview
CandlPage is a professional audit and content generation suite built for C&L Strategy clients. It provides comprehensive tools for SEO optimization, security audits, and content creation, all protected by session-based password authentication.

**Tech Stack:**
- Frontend: React 18 + Vite + Tailwind CSS
- Backend: Node.js/Express (port 3001)
- Optional: Python/FastAPI (port 5057) for advanced features
- AI: Claude 3.5 Sonnet (Anthropic) + GPT-4o (OpenAI)

---

## Application Architecture

### 1. Authentication Layer
**Component:** `src/components/PasswordGate.jsx`
- Session-based authentication using `sessionStorage`
- Default password: `ILoveTheBrowns333`
- Persists until browser closes
- Protects all tools behind password gate

### 2. Landing Page & Navigation
**Component:** `src/App.jsx`
- React Router-based SPA navigation
- 3-column grid layout showcasing all tools
- Glassmorphism UI design
- Routes:
  - `/` - Landing page
  - `/seo-aeo` - SEO/AEO Audit
  - `/security` - Cybersecurity Audit
  - `/content-suite` - Content Generation Suite

---

## Tools & Features

### Tool 1: SEO/AEO Audit
**Component:** `src/components/SeoAeoAudit.jsx`
**Endpoint:** `POST /api/analyze`

#### Functionality:
- Analyzes websites for SEO and AEO optimization opportunities
- Accepts input via URL or HTML source code
- Provides comprehensive scoring (0-100) with letter grades (A+ to F)

#### Analysis Sections:
1. **SEO Issues** - Technical problems with:
   - Severity levels (LOW/MEDIUM/HIGH/CRITICAL)
   - Priority ranking (1-10)
   - Copy-paste ready code fixes
   - Step-by-step implementation instructions
   - Quantified impact metrics (e.g., "+15% CTR")

2. **AEO Optimizations** - Answer Engine Optimization with:
   - Complete code snippets
   - Implementation guides
   - Real-world examples
   - Expected improvements for featured snippets

3. **Technical SEO** - Checklist of:
   - Present features (✅)
   - Missing features (❌)
   - How-to guides with code for adding missing features

4. **Content Gaps** - Identifies:
   - Missing content opportunities
   - Why each gap matters
   - Specific content suggestions
   - Recommended formats (FAQ, how-to, comparison, etc.)

5. **Recommendations** - Strategic improvements with:
   - Detailed descriptions
   - Code snippets where applicable
   - Expected SEO/AEO improvements

#### Export Options:
- JSON format for data integration
- Markdown format for documentation
- Copy-paste functionality for all code snippets

#### AI Integration:
- Uses Claude 3.5 Sonnet via Anthropic API
- Generates production-ready code snippets
- Provides specific, quantified improvements

---

### Tool 2: Cybersecurity Audit
**Component:** `src/components/SecurityScanner.jsx`
**Endpoint:** `POST /api/analyze`

#### Functionality:
- Scans websites for security vulnerabilities
- Tracks CVE (Common Vulnerabilities and Exposures)
- Assesses risk levels and threat severity

#### Analysis Sections:
1. **Vulnerability Assessment** - Identifies:
   - Security issues with severity ratings
   - CVE references and descriptions
   - Risk impact analysis

2. **Copy-Paste Fixes** - Provides:
   - Ready-to-implement security patches
   - Configuration recommendations
   - Best practices

3. **Strategic Report** - Generates:
   - Executive summary
   - Detailed findings
   - Remediation roadmap
   - Expected security improvements

#### Export Options:
- JSON format for security tracking
- Markdown format for reports

---

### Tool 3: Content Generation Suite
**Component:** `src/components/ContentSuite.jsx`

#### Sub-Tool 3a: Keyword Generator
**Endpoint:** `POST /api/keywords`
- Generates SEO-optimized keywords
- Uses OpenAI GPT-4o
- Provides keyword difficulty and search volume estimates
- Supports multiple industries and geographies

#### Sub-Tool 3b: Press Release Generator
**Endpoint:** `POST /api/generate-press-release`
- Creates professional press releases
- Customizable style and voice
- Uses OpenAI GPT-4o
- Includes company information and announcements

#### Sub-Tool 3c: Article Generator
**Endpoint:** `POST /api/generate-article`
- Generates long-form SEO articles
- Optimized for search engines
- Uses OpenAI GPT-4o
- Includes outline and structure

---

### Tool 4: Lead Generation
**Component:** `src/components/LeadGenerator.jsx`
**Endpoints:**
- `POST /api/leads` - Find and score leads
- `POST /api/lead-report` - Generate individual lead reports

#### Functionality:
- Discovers high-quality business leads in target markets
- Scores leads based on SEO metrics and website quality
- Generates detailed opportunity reports
- Supports both manual and automated workflows

#### Features:

**Manual Mode:**
- Search for leads in a single geography and industry
- Specify maximum number of results
- Real-time status tracking during search
- Sort leads by score (highest to lowest)
- View detailed lead information:
  - Business name, website, phone, address
  - SEO score (0-100)
  - Key metrics (LCP, traffic trend, performance)
  - Identified opportunities
- Generate individual lead reports (1/2 page text files)
- Export all leads to CSV format

**Automated Mode:**
- Run searches across multiple industries simultaneously
- Staggered execution to avoid rate limiting
- Batch download all reports
- Scheduled execution (Monday 4am via `automation_scheduler.py`)
- Email delivery of reports to configured recipients

#### Lead Scoring Algorithm:
Scores based on:
1. **Traffic Trends** - Website traffic growth/decline
2. **Schema Markup** - Presence of structured data
3. **Content Freshness** - How recently content was updated
4. **LCP (Largest Contentful Paint)** - Page load performance
5. **Technical SEO** - Overall technical health

#### Data Sources:
- **Google Places API** - Real business data (name, address, phone, website)
- **HTML Parsing** - Website analysis for SEO signals
- **DataForSEO API** (optional) - Advanced SEO metrics
- **Hunter.io API** (optional) - Email discovery

#### Report Generation:
- Generates 1/2 page text reports per lead
- Includes:
  - Business overview
  - SEO analysis summary
  - Key opportunities identified
  - Urgency level (based on score)
  - Recommended next steps

#### Automation:
- **Scheduler:** `automation_scheduler.py`
- **Config:** `automation_config.json`
- **Runs:** Every Monday at 4:00 AM (configurable)
- **Email:** Sends reports to configured recipients
- **Batch Processing:** Processes multiple searches with staggered timing

---

## Backend Architecture

### Express Server (`server.js`)
**Port:** 3001

#### Key Endpoints:
- `GET /health` - Health check with API key status
- `POST /api/analyze` - Anthropic Claude proxy for SEO/AEO/Security analysis
- `POST /api/keywords` - OpenAI keyword generation
- `POST /api/generate-press-release` - OpenAI press release generation
- `POST /api/generate-article` - OpenAI article generation
- `POST /api/leads` - Proxy to Python backend for lead finding and scoring
- `POST /api/lead-report` - Proxy to Python backend for report generation
- `GET *` - SPA fallback route for React Router

#### Features:
- CORS enabled for frontend communication
- Static file serving from `dist/` folder
- 120-second timeout for long-running operations
- Error handling and logging
- Environment variable validation

### Optional Python Backend (`python_api.py`)
**Port:** 5057 (when running locally)
**Framework:** FastAPI with Uvicorn

#### Key Endpoints:
- `POST /find_leads` - Discover businesses using Google Places API
- `POST /score_leads` - Score leads based on SEO metrics
- `POST /generate_report` - Generate individual lead reports

#### Core Modules:

**`lead_finder.py`**
- Google Places API integration
- Searches for businesses by geography and industry
- Extracts: name, address, phone, website, rating
- Fallback to stub data if API unavailable
- Email discovery via Hunter.io API (optional)

**`seo_checks.py`**
- HTML parsing and analysis
- Detects SEO signals:
  - Schema.org markup (Organization, LocalBusiness, etc.)
  - Meta tags (title, description, viewport)
  - Technical stack (CMS, frameworks, CDN)
  - Content freshness (last modified dates)
  - LCP (Largest Contentful Paint) estimation
- DataForSEO API integration (optional)
- Graceful fallback to HTML parsing

**`scoring.py`**
- Lead scoring algorithm (0-100)
- Factors:
  - Traffic trends (growth/decline)
  - Schema markup presence
  - Content freshness
  - LCP performance
  - Technical SEO health
- Identifies specific opportunities per lead

**`report_generator.py`**
- Generates 1/2 page text reports
- Google Docs API integration (optional)
- Includes:
  - Business overview
  - SEO analysis summary
  - Key opportunities
  - Urgency level
  - Recommended actions

**`industry_discovery.py`**
- Discovers relevant industries for target markets
- Uses LLM analysis for industry classification

**`llm_seo_analyzer.py`**
- Claude AI integration for advanced analysis
- Generates insights and recommendations
- Analyzes competitor content

**`sheets_io.py`**
- Google Sheets API integration
- Stores lead data and reports
- Enables data sharing and collaboration

**`alerts.py`**
- Alert system for high-opportunity leads
- Notification triggers based on score thresholds

---

## Environment Variables

### Required:
```
ANTHROPIC_API_KEY=sk-...          # Claude AI access (SEO/AEO/Security analysis)
OPENAI_API_KEY=sk-...             # GPT-4o access (keywords, articles, press releases)
```

### Optional (Lead Generation):
```
GOOGLE_PLACES_API_KEY=...         # Google Places API for business discovery
HUNTER_API_KEY=...                # Hunter.io for email discovery
DATAFORSEO_LOGIN=...              # DataForSEO email for advanced SEO metrics
DATAFORSEO_PASSWORD=...           # DataForSEO password
GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON_PATH=./secrets/google-service-account.json
GMAIL_APP_PASSWORD=...            # Gmail app password for automated email delivery
```

### Configuration:
```
PORT=3001                         # Express server port
PYTHON_API_BASE=http://localhost:5057  # Python backend URL
```

### Automation Config (`automation_config.json`):
```json
{
  "email": {
    "to": ["recipient@example.com"],
    "from": "sender@example.com",
    "smtp_server": "smtp.gmail.com",
    "smtp_port": 587,
    "use_tls": true,
    "password_env_var": "GMAIL_APP_PASSWORD"
  },
  "schedule": {
    "day": "monday",
    "hour": 4,
    "minute": 0,
    "timezone": "America/Chicago"
  },
  "searches": [
    {
      "geo": "Miami, FL",
      "industry": "landscaping",
      "max_results": 20
    }
  ]
}
```

---

## File Structure

```
candlpage/
├── src/
│   ├── components/
│   │   ├── PasswordGate.jsx          # Authentication gate
│   │   ├── SeoAeoAudit.jsx           # SEO/AEO analysis tool
│   │   ├── SecurityScanner.jsx       # Security audit tool
│   │   ├── ContentSuite.jsx          # Content generation suite
│   │   └── LeadGenerator.jsx         # Lead discovery & scoring
│   ├── App.jsx                       # Main router & landing page
│   ├── index.css                     # Tailwind styles
│   └── main.jsx                      # React entry point
├── server.js                         # Express backend (port 3001)
├── python_api.py                     # FastAPI backend (port 5057)
├── python_modules/
│   ├── lead_finder.py                # Google Places integration
│   ├── seo_checks.py                 # HTML parsing & SEO analysis
│   ├── scoring.py                    # Lead scoring algorithm
│   ├── report_generator.py           # Report generation
│   ├── industry_discovery.py         # Industry research
│   ├── llm_seo_analyzer.py           # LLM-based analysis
│   ├── sheets_io.py                  # Google Sheets integration
│   └── alerts.py                     # Alert system
├── automation_scheduler.py           # Monday morning automation
├── automation_config.json            # Automation configuration
├── package.json                      # Node dependencies
├── requirements.txt                  # Python dependencies
├── vite.config.js                    # Vite configuration
├── tailwind.config.js                # Tailwind configuration
├── Procfile                          # Railway deployment config
├── railway.json                      # Railway settings
├── vercel.json                       # Vercel deployment config
├── APP_STRUCTURE.md                  # This documentation
└── README.md                         # Main documentation
```

---

## Deployment

### Local Development

**Quick Start (All Services):**
```bash
# macOS
./Start-Dev.command

# Linux/Windows
bash start-dev.sh
```

**Manual Setup:**
```bash
# Terminal 1: Frontend (Vite dev server on port 5174)
npm run dev

# Terminal 2: Express backend (port 3001)
node server.js

# Terminal 3 (optional): Python backend (port 5057)
python3 python_api.py

# Terminal 4 (optional): Automation scheduler
python3 automation_scheduler.py
```

### Production Deployment

**Railway (Recommended):**
- Automatic deployment from GitHub (`lelandsequel/candlpage`)
- Build: `npm run build`
- Start: `node server.js`
- Environment variables configured in Railway dashboard
- Note: Python backend requires separate Railway service on port 5057

**Vercel:**
- Configured via `vercel.json`
- Frontend + Express backend
- Python backend not supported (use Railway for Python)

**Docker:**
- Can containerize both Node and Python services
- Use `docker-compose` for local multi-service setup

---

## Security Features

1. **Password Protection** - Session-based authentication
2. **API Key Management** - Environment variables, never hardcoded
3. **CORS Protection** - Configured for frontend domain
4. **Error Handling** - Graceful failures without exposing internals
5. **Timeout Protection** - 120-second limits on API calls

---

## Performance Optimizations

1. **Code Splitting** - React components lazy-loaded
2. **Static Caching** - Frontend assets cached in `dist/`
3. **Concurrent Processing** - Parallel API calls where possible
4. **Timeout Fallbacks** - Graceful degradation on slow APIs
5. **Session Storage** - Minimal authentication overhead

---

## Known Issues & Limitations

### Lead Generation Tool
- **Status:** Currently removed from UI due to timeout issues
- **Issue:** DataForSEO API 404 errors and slow PageSpeed API calls (60+ seconds per lead)
- **Workaround:** Can be re-enabled with:
  - Faster SEO data source (Ahrefs, Semrush API)
  - Caching layer for repeated analyses
  - Async job queue for batch processing
  - Increased timeout thresholds (120+ seconds)

### Python Backend
- Requires separate service running on port 5057
- Not deployable to Vercel (Node.js only)
- Requires additional environment variables for full functionality

---

## Future Enhancements

- [ ] Lead Generation Tool - Re-enable with improved performance
- [ ] Real-time collaboration features
- [ ] Advanced analytics dashboard
- [ ] Custom report templates
- [ ] API rate limiting and usage tracking
- [ ] Multi-user support with role-based access
- [ ] Webhook integrations (Slack, Discord, email)
- [ ] Scheduled report delivery
- [ ] Lead CRM integration (HubSpot, Salesforce)
- [ ] Competitor analysis tool
- [ ] Backlink analysis tool
- [ ] Content calendar management

