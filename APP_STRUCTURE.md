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

## Backend Architecture

### Express Server (`server.js`)
**Port:** 3001

#### Key Endpoints:
- `GET /health` - Health check with API key status
- `POST /api/analyze` - Anthropic Claude proxy for SEO/AEO/Security analysis
- `POST /api/keywords` - OpenAI keyword generation
- `POST /api/generate-press-release` - OpenAI press release generation
- `POST /api/generate-article` - OpenAI article generation
- `GET *` - SPA fallback route for React Router

#### Features:
- CORS enabled for frontend communication
- Static file serving from `dist/` folder
- 120-second timeout for long-running operations
- Error handling and logging
- Environment variable validation

### Optional Python Backend (`python_api.py`)
**Port:** 5057 (when running locally)

#### Modules:
- `lead_finder.py` - Google Places API integration
- `seo_checks.py` - HTML parsing and SEO analysis
- `scoring.py` - Lead scoring algorithms
- `report_generator.py` - Google Docs integration
- `industry_discovery.py` - Industry research
- `llm_seo_analyzer.py` - LLM-based analysis
- `sheets_io.py` - Google Sheets integration

---

## Environment Variables

### Required:
```
ANTHROPIC_API_KEY=sk-...          # Claude AI access
OPENAI_API_KEY=sk-...             # GPT-4o access
```

### Optional:
```
GOOGLE_PLACES_API_KEY=...         # For lead generation
HUNTER_API_KEY=...                # For email finding
DATAFORSEO_LOGIN=...              # For SEO metrics
DATAFORSEO_PASSWORD=...           # For SEO metrics
PORT=3001                         # Server port
```

---

## File Structure

```
candlpage/
├── src/
│   ├── components/
│   │   ├── PasswordGate.jsx          # Authentication
│   │   ├── SeoAeoAudit.jsx           # SEO/AEO tool
│   │   ├── SecurityScanner.jsx       # Security audit
│   │   └── ContentSuite.jsx          # Content generation
│   ├── App.jsx                       # Main router
│   ├── index.css                     # Tailwind styles
│   └── main.jsx                      # React entry
├── server.js                         # Express backend
├── python_api.py                     # FastAPI backend (optional)
├── python_modules/                   # Python utilities
├── package.json                      # Node dependencies
├── requirements.txt                  # Python dependencies
├── vite.config.js                    # Vite configuration
├── tailwind.config.js                # Tailwind configuration
└── README.md                         # Documentation
```

---

## Deployment

### Local Development
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
node server.js

# Terminal 3 (optional): Python backend
python3 python_api.py
```

### Production (Railway)
- Automatic deployment from GitHub
- Build: `npm run build`
- Start: `node server.js`
- Environment variables configured in Railway dashboard

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

## Future Enhancements

- [ ] Lead Generation Tool (currently removed due to timeout issues)
- [ ] Real-time collaboration features
- [ ] Advanced analytics dashboard
- [ ] Custom report templates
- [ ] API rate limiting and usage tracking
- [ ] Multi-user support with role-based access

