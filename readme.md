# CandLPage - Client Deliverables Suite

Professional audit and content generation tools for C&L Page clients.

## Features

### 1. SEO/AEO Audit Tool
- Technical SEO analysis from HTML source or URL
- Answer Engine Optimization (AEO) recommendations
- Copy-paste fixes for every issue found
- Strategic report generation via Claude AI
- Content gap analysis
- Export results (JSON + Markdown)
- Score: 0-100 with letter grade (A+ to F)

### 2. Cybersecurity Scanner
- OWASP Top 10 compliance checking
- Vulnerability detection and CVE identification
- Security header analysis
- Copy-paste security fixes and configurations
- Strategic security report generation via Claude AI
- Risk scoring (LOW/MEDIUM/HIGH/CRITICAL)
- Export results (JSON + Markdown)

### 3. Press Release Generator *(Coming Soon)*
- AEO-optimized press release generation
- Announcement and authority building content

## Tech Stack

- **Frontend:** React 18.2, Vite 5.0
- **Styling:** Tailwind CSS 3.3
- **Icons:** Lucide React
- **Routing:** React Router DOM 7.9
- **Backend:** Express 5.1, Node.js
- **AI:** Anthropic Claude API (Sonnet 4 - `claude-sonnet-4-20250514`)

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm
- Anthropic API key

### Installation

1. **Clone/Navigate to the project:**
   ```bash
   cd /Users/sokpyeon/candlpage
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```bash
   touch .env
   ```

4. **Add your Anthropic API key to `.env`:**
   ```env
   ANTHROPIC_API_KEY=your_api_key_here
   VITE_ANTHROPIC_API_KEY=your_api_key_here
   ```

### Running the Application

You need to run **TWO servers** simultaneously:

#### Terminal 1 - Backend API Server (Port 3001)
```bash
npm run server
```

#### Terminal 2 - Frontend Dev Server (Port 5173)
```bash
npm run dev
```

Then open your browser to: **http://localhost:5173/**

## Project Structure

```
candlpage/
├── src/
│   ├── App.jsx                      # Main app with routing and landing page
│   ├── index.css                    # Global styles
│   ├── main.jsx                     # React entry point
│   └── components/
│       ├── SeoAeoAudit.jsx         # SEO/AEO audit component
│       ├── SecurityScanner.jsx      # Security audit component
│       └── PressReleaseGenerator.jsx # Press release tool (WIP)
├── server.js                        # Express backend for Claude API
├── package.json                     # Dependencies and scripts
├── vite.config.js                  # Vite configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── .env                            # Environment variables (gitignored)
└── .gitignore                      # Git ignore rules
```

## Usage

### SEO/AEO Audit
1. Click "SEO/AEO Audit" from the home page
2. Choose input method: URL or Source Code
3. Paste HTML source code or enter a URL
4. Click "Run SEO/AEO Audit"
5. Review issues with copy-paste fixes
6. Generate strategic report (optional)
7. Export results as JSON or Markdown

### Cybersecurity Scanner
1. Click "Cybersecurity Audit" from the home page
2. Choose input method: URL or Source Code
3. Paste HTML source code or enter a URL
4. Click "Run Security Audit"
5. Review vulnerabilities with copy-paste remediations
6. Generate strategic security report (optional)
7. Export results as JSON or Markdown

## API Configuration

The app uses Claude Sonnet 4 (`claude-sonnet-4-20250514`) for:
- Generating audit results
- Creating strategic reports
- Providing actionable recommendations

All API calls go through the Express backend (`server.js`) to keep your API key secure.

## Building for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## Deployment to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variable: `ANTHROPIC_API_KEY`
4. Deploy!

**Note:** You'll need to configure the backend server separately for production (or use Vercel serverless functions).

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Your Anthropic Claude API key (backend) | Yes |
| `VITE_ANTHROPIC_API_KEY` | Your Anthropic Claude API key (frontend fallback) | Yes |

## Security Notes

- `.env` file is gitignored by default
- Never commit your API keys
- Backend server proxies all Claude API requests
- CORS is enabled for local development only

## Troubleshooting

### "Error analyzing website"
- Make sure both servers are running
- Check that your API key is set in `.env`
- Verify the backend is running on port 3001
- Check browser console for detailed errors

### Port already in use
- Kill any existing processes on ports 3001 or 5173
- Or change the port in `server.js` or `vite.config.js`

### Dependencies not found
```bash
rm -rf node_modules package-lock.json
npm install
```

## License

Proprietary - C&L Page

## Support

For issues or questions, contact the C&L Page development team.
