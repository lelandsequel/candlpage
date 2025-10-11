import React, { useState } from 'react';
import { Search, AlertCircle, CheckCircle, XCircle, Download, Code, Loader, Copy, Check, Sparkles, FileText } from 'lucide-react';

export default function App() {
  const [url, setUrl] = useState('');
  const [html, setHtml] = useState('');
  const [technicalResults, setTechnicalResults] = useState(null);
  const [strategicReport, setStrategicReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('paste');
  const [copiedIndex, setCopiedIndex] = useState(null);

  const analyzeHTML = (htmlContent, sourceUrl = '') => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      const analysis = {
        url: sourceUrl,
        timestamp: new Date().toISOString(),
        
        title: {
          content: doc.querySelector('title')?.textContent || 'MISSING',
          length: doc.querySelector('title')?.textContent?.length || 0,
        },
        
        meta: {
          description: doc.querySelector('meta[name="description"]')?.content || 'MISSING',
          descriptionLength: doc.querySelector('meta[name="description"]')?.content?.length || 0,
          robots: doc.querySelector('meta[name="robots"]')?.content || 'Not specified',
          canonical: doc.querySelector('link[rel="canonical"]')?.href || 'MISSING',
          viewport: doc.querySelector('meta[name="viewport"]')?.content || 'MISSING',
          charset: doc.querySelector('meta[charset]')?.getAttribute('charset') || 'Not specified',
          ogTags: {},
          twitterCards: {}
        },
        
        headers: {
          h1: [],
          h2: [],
          h3: [],
          h4: [],
          h5: [],
          h6: []
        },
        
        images: {
          total: 0,
          missingAlt: [],
          withAlt: 0
        },
        
        links: {
          internal: [],
          external: [],
          nofollow: []
        },
        
        schema: {
          jsonLd: [],
          microdata: false
        },
        
        performance: {
          scriptCount: 0,
          styleCount: 0,
        },
        
        content: {
          wordCount: 0,
          textLength: 0
        },
        
        criticalIssues: [],
        warnings: [],
        recommendations: [],
        fixes: []
      };

      // Title analysis
      if (analysis.title.length === 0) {
        analysis.criticalIssues.push('Missing title tag');
        analysis.fixes.push({
          priority: 'critical',
          title: 'Add Title Tag',
          description: 'Add a descriptive title tag to the <head> section',
          code: '<title>Your Page Title Here - Brand Name</title>',
          location: 'Inside <head> section'
        });
      } else if (analysis.title.length < 30) {
        analysis.warnings.push(`Title too short (${analysis.title.length} chars) - recommend 50-60 chars`);
      } else if (analysis.title.length > 60) {
        analysis.warnings.push(`Title too long (${analysis.title.length} chars) - will be truncated`);
      }

      // Meta description
      if (analysis.meta.descriptionLength === 0) {
        analysis.criticalIssues.push('Missing meta description');
        analysis.fixes.push({
          priority: 'critical',
          title: 'Add Meta Description',
          description: 'Add a compelling meta description (150-160 characters)',
          code: '<meta name="description" content="Write a compelling description here. Include key benefits. 150-160 characters ideal.">',
          location: 'Inside <head> section'
        });
      } else if (analysis.meta.descriptionLength < 120) {
        analysis.warnings.push(`Meta description too short (${analysis.meta.descriptionLength} chars)`);
      } else if (analysis.meta.descriptionLength > 160) {
        analysis.warnings.push(`Meta description too long (${analysis.meta.descriptionLength} chars)`);
      }

      if (analysis.meta.canonical === 'MISSING') {
        analysis.warnings.push('Missing canonical tag');
        analysis.fixes.push({
          priority: 'high',
          title: 'Add Canonical Tag',
          description: 'Prevent duplicate content issues',
          code: '<link rel="canonical" href="https://yourdomain.com/page-url/">',
          location: 'Inside <head> section'
        });
      }

      if (analysis.meta.viewport === 'MISSING') {
        analysis.criticalIssues.push('Missing viewport meta tag - not mobile-optimized');
        analysis.fixes.push({
          priority: 'critical',
          title: 'Add Viewport Meta Tag',
          description: 'Essential for mobile responsiveness',
          code: '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
          location: 'Inside <head> section'
        });
      }

      // Open Graph
      const ogTags = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'];
      ogTags.forEach(tag => {
        const content = doc.querySelector(`meta[property="${tag}"]`)?.content;
        analysis.meta.ogTags[tag] = content || 'MISSING';
      });
      
      const missingOG = ogTags.filter(tag => analysis.meta.ogTags[tag] === 'MISSING');
      if (missingOG.length > 0) {
        analysis.recommendations.push(`Missing Open Graph tags: ${missingOG.join(', ')}`);
        analysis.fixes.push({
          priority: 'medium',
          title: 'Add Open Graph Tags',
          description: 'Improve social media sharing',
          code: `<meta property="og:title" content="${analysis.title.content || 'Your Page Title'}">
<meta property="og:description" content="${analysis.meta.description || 'Description'}">
<meta property="og:image" content="https://yourdomain.com/image.jpg">
<meta property="og:url" content="https://yourdomain.com/page/">
<meta property="og:type" content="website">`,
          location: 'Inside <head> section'
        });
      }

      // Twitter Cards
      const twitterTags = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'];
      twitterTags.forEach(tag => {
        const content = doc.querySelector(`meta[name="${tag}"]`)?.content;
        analysis.meta.twitterCards[tag] = content || 'MISSING';
      });

      // Headers
      for (let i = 1; i <= 6; i++) {
        const headers = doc.querySelectorAll(`h${i}`);
        headers.forEach(h => {
          analysis.headers[`h${i}`].push(h.textContent.trim());
        });
      }

      if (analysis.headers.h1.length === 0) {
        analysis.criticalIssues.push('Missing H1 tag');
        analysis.fixes.push({
          priority: 'critical',
          title: 'Add H1 Heading',
          description: 'Every page needs exactly one H1',
          code: '<h1>Your Main Page Heading - Include Keywords</h1>',
          location: 'Top of main content area'
        });
      } else if (analysis.headers.h1.length > 1) {
        analysis.warnings.push(`Multiple H1 tags found (${analysis.headers.h1.length})`);
        analysis.fixes.push({
          priority: 'high',
          title: 'Fix Multiple H1 Tags',
          description: 'Keep only one H1, convert others to H2',
          code: `<h1>${analysis.headers.h1[0]}</h1>\n${analysis.headers.h1.slice(1).map(h => `<h2>${h}</h2>`).join('\n')}`,
          location: 'Throughout page content'
        });
      }

      // Images
      const images = doc.querySelectorAll('img');
      analysis.images.total = images.length;
      images.forEach(img => {
        if (!img.alt || img.alt.trim() === '') {
          analysis.images.missingAlt.push(img.src || 'Unknown');
        } else {
          analysis.images.withAlt++;
        }
      });

      if (analysis.images.missingAlt.length > 0) {
        analysis.warnings.push(`${analysis.images.missingAlt.length} images missing ALT text`);
        analysis.fixes.push({
          priority: 'high',
          title: 'Add ALT Text to Images',
          description: `${analysis.images.missingAlt.length} images need ALT attributes`,
          code: `<img src="your-image.jpg" alt="Descriptive text here">\n\n<!-- Examples needing ALT: -->\n${analysis.images.missingAlt.slice(0, 3).map(src => `<img src="${src}" alt="DESCRIPTION">`).join('\n')}`,
          location: 'Add alt="" to each <img> tag'
        });
      }

      // Links
      const links = doc.querySelectorAll('a[href]');
      links.forEach(link => {
        const href = link.href;
        if (href.startsWith('/') || href.startsWith('#')) {
          analysis.links.internal.push(href);
        } else if (href.startsWith('http')) {
          analysis.links.external.push(href);
        }
      });

      // Schema
      const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
      scripts.forEach(script => {
        try {
          const data = JSON.parse(script.textContent);
          analysis.schema.jsonLd.push(data);
        } catch (e) {
          analysis.warnings.push('Invalid JSON-LD found');
        }
      });

      if (analysis.schema.jsonLd.length === 0) {
        analysis.criticalIssues.push('No structured data (Schema.org) found');
        analysis.fixes.push({
          priority: 'critical',
          title: 'Add Schema.org Structured Data',
          description: 'Enable rich results in search',
          code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Company",
  "url": "https://yourdomain.com",
  "logo": "https://yourdomain.com/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-555-555-5555",
    "contactType": "customer service"
  }
}
</script>`,
          location: 'Inside <head> or before </body>'
        });
      }

      // Performance
      analysis.performance.scriptCount = doc.querySelectorAll('script[src]').length;
      analysis.performance.styleCount = doc.querySelectorAll('link[rel="stylesheet"]').length;

      // Content
      const bodyText = doc.body?.textContent || '';
      analysis.content.textLength = bodyText.length;
      analysis.content.wordCount = bodyText.trim().split(/\s+/).filter(w => w.length > 0).length;

      if (analysis.content.wordCount < 300) {
        analysis.warnings.push(`Low word count (${analysis.content.wordCount} words)`);
      }

      return analysis;
    } catch (err) {
      throw new Error(`Error parsing HTML: ${err.message}`);
    }
  };

  const generateStrategicReport = async () => {
    setGeneratingReport(true);
    setError('');

    try {
      const prompt = `You are an expert SEO strategist analyzing technical audit findings for a website. Based on the technical data below, generate a comprehensive strategic SEO report.

TECHNICAL AUDIT FINDINGS:
${JSON.stringify(technicalResults, null, 2)}

Generate a strategic report with the following sections:

1. **Executive Summary** (2-3 paragraphs)
   - Overall SEO health score (1-10)
   - Top 3 critical findings
   - Projected impact of implementing fixes

2. **Business Impact Analysis**
   - How these issues affect traffic, conversions, and revenue
   - Competitive implications
   - Risk assessment

3. **Prioritized Action Plan**
   - Week 1 (Critical fixes)
   - Weeks 2-4 (High priority)
   - Months 2-3 (Strategic improvements)
   - Each with specific actions, estimated time, and expected impact

4. **ROI Projections**
   - Expected traffic improvement (%)
   - Timeline to see results
   - Resource requirements

5. **Competitive Positioning**
   - How these issues compare to industry standards
   - Opportunities to outrank competitors
   - Areas where the site excels or falls behind

6. **Strategic Recommendations**
   - Content strategy implications
   - Technical architecture suggestions
   - Long-term SEO roadmap

Format the response in clean, professional markdown with headers, bullet points, and clear sections. Be specific, actionable, and data-driven.`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [
            { role: "user", content: prompt }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const reportText = data.content[0].text;
      
      setStrategicReport(reportText);
    } catch (err) {
      setError(`Failed to generate strategic report: ${err.message}`);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleAnalyzeHTML = () => {
    if (!html.trim()) {
      setError('Please paste HTML to analyze');
      return;
    }

    setLoading(true);
    setError('');
    setTechnicalResults(null);
    setStrategicReport(null);

    setTimeout(() => {
      try {
        const analysis = analyzeHTML(html, 'Pasted HTML');
        setTechnicalResults(analysis);
      } catch (err) {
        setError(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  const exportTechnical = () => {
    const dataStr = JSON.stringify(technicalResults, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `technical-audit-${Date.now()}.json`;
    link.click();
  };

  const exportStrategic = () => {
    const blob = new Blob([strategicReport], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `strategic-seo-report-${Date.now()}.md`;
    link.click();
  };

  const FixCard = ({ fix, index }) => {
    const priorityColors = {
      critical: 'border-red-300 bg-red-50',
      high: 'border-orange-300 bg-orange-50',
      medium: 'border-yellow-300 bg-yellow-50',
    };

    const priorityBadges = {
      critical: 'bg-red-600 text-white',
      high: 'bg-orange-600 text-white',
      medium: 'bg-yellow-600 text-white',
    };

    return (
      <div className={`border-2 rounded-xl p-5 ${priorityColors[fix.priority]}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${priorityBadges[fix.priority]}`}>
                {fix.priority}
              </span>
              <h4 className="font-bold text-gray-900">{fix.title}</h4>
            </div>
            <p className="text-sm text-gray-700 mb-2">{fix.description}</p>
            <p className="text-xs text-gray-600">
              <span className="font-semibold">Location:</span> {fix.location}
            </p>
          </div>
        </div>
        
        <div className="relative">
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono whitespace-pre-wrap">
{fix.code}
          </pre>
          <button
            onClick={() => copyToClipboard(fix.code, index)}
            className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
          >
            {copiedIndex === index ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-300" />
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-12 h-12 text-purple-600" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Ultimate SEO Audit Tool
              </h1>
            </div>
            <p className="text-gray-600 text-lg">Technical Precision + Strategic Intelligence = SEO Dominance</p>
          </div>

          {/* Input */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Paste HTML Source Code
            </label>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder="Paste HTML here... (Right-click page → View Page Source → Ctrl+A → Copy)"
              className="w-full h-64 px-4 py-3 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none font-mono text-sm resize-y"
            />
            <div className="flex justify-between items-center mt-3">
              <p className="text-xs text-gray-500">
                {html.length > 0 ? `${html.length.toLocaleString()} characters` : 'Ready for HTML...'}
              </p>
              <button
                onClick={handleAnalyzeHTML}
                disabled={loading || !html.trim()}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Analyze
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">{error}</div>
              </div>
            </div>
          )}
        </div>

        {/* Technical Results */}
        {technicalResults && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
            <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">⚡ Technical Audit Results</h2>
              <div className="flex gap-3">
                <button
                  onClick={exportTechnical}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                >
                  <Download className="w-4 h-4" />
                  Export JSON
                </button>
                <button
                  onClick={generateStrategicReport}
                  disabled={generatingReport}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-300 transition font-semibold shadow-lg"
                >
                  {generatingReport ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Strategic Report
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-6 h-6 text-red-600" />
                  <span className="font-bold text-red-900">Critical</span>
                </div>
                <p className="text-3xl font-bold text-red-600">{technicalResults.criticalIssues.length}</p>
              </div>
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                  <span className="font-bold text-yellow-900">Warnings</span>
                </div>
                <p className="text-3xl font-bold text-yellow-600">{technicalResults.warnings.length}</p>
              </div>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                  <span className="font-bold text-blue-900">Fixes Ready</span>
                </div>
                <p className="text-3xl font-bold text-blue-600">{technicalResults.fixes.length}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold mb-3">Content Metrics</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Word Count:</span> {technicalResults.content.wordCount}</p>
                  <p><span className="font-semibold">Images:</span> {technicalResults.images.total} ({technicalResults.images.missingAlt.length} missing ALT)</p>
                  <p><span className="font-semibold">Links:</span> {technicalResults.links.internal.length} internal, {technicalResults.links.external.length} external</p>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold mb-3">Technical</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Schema Markup:</span> {technicalResults.schema.jsonLd.length} found</p>
                  <p><span className="font-semibold">H1 Tags:</span> {technicalResults.headers.h1.length}</p>
                  <p><span className="font-semibold">Scripts:</span> {technicalResults.performance.scriptCount}</p>
                </div>
              </div>
            </div>

            {/* Fixes */}
            {technicalResults.fixes.length > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Code className="w-8 h-8 text-purple-600" />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">🛠️ Ready-to-Implement Fixes</h3>
                    <p className="text-sm text-gray-600">Copy & paste these into your website</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {technicalResults.fixes
                    .sort((a, b) => {
                      const priority = { critical: 0, high: 1, medium: 2 };
                      return priority[a.priority] - priority[b.priority];
                    })
                    .map((fix, i) => (
                      <FixCard key={i} fix={fix} index={i} />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Strategic Report */}
        {strategicReport && (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-purple-200">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-purple-600" />
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Strategic SEO Report
                </h2>
              </div>
              <button
                onClick={exportStrategic}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
            
            <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-gray-700 prose-strong:text-gray-900 prose-ul:text-gray-700">
              {strategicReport.split('\n').map((line, i) => {
                if (line.startsWith('# ')) {
                  return <h1 key={i} className="text-3xl font-bold mt-8 mb-4">{line.replace('# ', '')}</h1>;
                } else if (line.startsWith('## ')) {
                  return <h2 key={i} className="text-2xl font-bold mt-6 mb-3">{line.replace('## ', '')}</h2>;
                } else if (line.startsWith('### ')) {
                  return <h3 key={i} className="text-xl font-bold mt-4 mb-2">{line.replace('### ', '')}</h3>;
                } else if (line.startsWith('**') && line.endsWith('**')) {
                  return <p key={i} className="font-bold mt-3">{line.replace(/\*\*/g, '')}</p>;
                } else if (line.startsWith('- ')) {
                  return <li key={i} className="ml-6">{line.replace('- ', '')}</li>;
                } else if (line.trim()) {
                  return <p key={i} className="mb-3">{line}</p>;
                }
                return null;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}