import React, { useState } from 'react';
import { Search, AlertCircle, CheckCircle, XCircle, Download, Code, Loader, Copy, Check, Sparkles, FileText, Brain, Zap } from 'lucide-react';

export default function App() {
  const [html, setHtml] = useState('');
  const [auditType, setAuditType] = useState('seo');
  const [technicalResults, setTechnicalResults] = useState(null);
  const [strategicReport, setStrategicReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [reportCopied, setReportCopied] = useState(false);

  const analyzeForAEO = (doc) => {
    const analysis = {
      auditType: 'AEO',
      faqSchema: { present: false, count: 0 },
      howToSchema: { present: false },
      questionHeaders: { count: 0, examples: [] },
      directAnswers: { count: 0, examples: [] },
      lists: { numbered: 0, bulleted: 0 },
      tables: { count: 0 },
      definitionStyle: { present: false },
      contentStructure: { shortParagraphs: 0, totalParagraphs: 0 },
      criticalIssues: [],
      warnings: [],
      recommendations: [],
      fixes: []
    };

    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    scripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent);
        if (data['@type'] === 'FAQPage') {
          analysis.faqSchema.present = true;
          analysis.faqSchema.count = data.mainEntity?.length || 0;
        }
        if (data['@type'] === 'HowTo') {
          analysis.howToSchema.present = true;
        }
      } catch (e) {}
    });

    if (!analysis.faqSchema.present) {
      analysis.criticalIssues.push('No FAQPage schema - AI engines cannot extract Q&A');
      analysis.fixes.push({
        priority: 'critical',
        title: 'Add FAQPage Schema Markup',
        description: 'Critical for AI answer extraction and featured snippets',
        code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What is your main service?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Provide a clear, concise answer here."
    }
  }]
}
</script>`,
        location: 'Add to <head> or before </body>'
      });
    }

    const allHeaders = [];
    for (let i = 1; i <= 6; i++) {
      doc.querySelectorAll(`h${i}`).forEach(h => {
        const text = h.textContent.trim();
        allHeaders.push(text);
        if (text.match(/^(what|how|why|when|where|who|is|are|can|does|do)\s/i) || text.endsWith('?')) {
          analysis.questionHeaders.count++;
          if (analysis.questionHeaders.examples.length < 5) {
            analysis.questionHeaders.examples.push(text);
          }
        }
      });
    }

    if (analysis.questionHeaders.count === 0) {
      analysis.criticalIssues.push('No question-based headers found');
      analysis.fixes.push({
        priority: 'critical',
        title: 'Add Question-Based Headers',
        description: 'AI engines prioritize content that directly answers questions',
        code: `<h2>What is [Your Topic]?</h2>
<p>Provide a direct, concise answer in the first 40-60 words...</p>

<h2>How does [Your Service] work?</h2>
<p>Step-by-step explanation...</p>

<h2>Why choose [Your Product]?</h2>
<p>List key benefits...</p>`,
        location: 'Throughout your content'
      });
    } else if (analysis.questionHeaders.count < 3) {
      analysis.warnings.push(`Only ${analysis.questionHeaders.count} question headers - aim for 5+`);
    }

    const paragraphs = doc.querySelectorAll('p');
    paragraphs.forEach((p, idx) => {
      const text = p.textContent.trim();
      const wordCount = text.split(/\s+/).length;
      
      if (wordCount >= 40 && wordCount <= 60) {
        analysis.directAnswers.count++;
        if (analysis.directAnswers.examples.length < 3) {
          analysis.directAnswers.examples.push(text.substring(0, 100) + '...');
        }
      }

      if (wordCount <= 100) {
        analysis.contentStructure.shortParagraphs++;
      }
      analysis.contentStructure.totalParagraphs++;
    });

    if (analysis.directAnswers.count === 0) {
      analysis.warnings.push('No concise answer paragraphs (40-60 words) found');
      analysis.fixes.push({
        priority: 'high',
        title: 'Add Direct Answer Paragraphs',
        description: 'AI engines extract 40-60 word answers for featured snippets',
        code: `<h2>What is [Topic]?</h2>
<p>[Topic] is a [concise definition in 40-60 words]. This direct answer format helps AI engines extract and cite your content. Keep it clear, specific, and self-contained.</p>`,
        location: 'After each question-based header'
      });
    }

    analysis.lists.numbered = doc.querySelectorAll('ol').length;
    analysis.lists.bulleted = doc.querySelectorAll('ul').length;

    if (analysis.lists.numbered + analysis.lists.bulleted < 2) {
      analysis.warnings.push('Few or no lists - AI engines prioritize structured content');
      analysis.fixes.push({
        priority: 'medium',
        title: 'Add Structured Lists',
        description: 'Lists help AI engines extract step-by-step information',
        code: `<h3>How to [Do Something]:</h3>
<ol>
  <li>First step with clear action</li>
  <li>Second step with specific details</li>
  <li>Third step with expected outcome</li>
</ol>

<h3>Key Benefits:</h3>
<ul>
  <li>Benefit one with explanation</li>
  <li>Benefit two with data point</li>
  <li>Benefit three with use case</li>
</ul>`,
        location: 'Throughout content'
      });
    }

    analysis.tables.count = doc.querySelectorAll('table').length;

    if (analysis.tables.count === 0) {
      analysis.recommendations.push('No comparison tables - great for AI extraction');
      analysis.fixes.push({
        priority: 'medium',
        title: 'Add Comparison Tables',
        description: 'Tables enable AI engines to extract structured comparisons',
        code: `<table>
  <thead>
    <tr>
      <th>Feature</th>
      <th>Option A</th>
      <th>Option B</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Price</td>
      <td>$99/mo</td>
      <td>$199/mo</td>
    </tr>
    <tr>
      <td>Users</td>
      <td>Up to 10</td>
      <td>Unlimited</td>
    </tr>
  </tbody>
</table>`,
        location: 'In comparison or pricing sections'
      });
    }

    const firstP = doc.querySelector('p');
    if (firstP) {
      const text = firstP.textContent.trim();
      if (text.match(/^.+\s+is\s+/i) || text.match(/^.+\s+refers to\s+/i)) {
        analysis.definitionStyle.present = true;
      }
    }

    if (!analysis.definitionStyle.present) {
      analysis.warnings.push('No definition-style opening');
      analysis.fixes.push({
        priority: 'high',
        title: 'Add Definition-Style Content',
        description: 'AI engines prioritize clear definitions for informational queries',
        code: `<h1>What is [Your Topic]?</h1>
<p>[Your Topic] is [a clear definition that AI can extract]. It [key characteristic or purpose]. This [benefit or use case].</p>`,
        location: 'Top of main content'
      });
    }

    if (!analysis.howToSchema.present && (allHeaders.some(h => h.toLowerCase().includes('how to')))) {
      analysis.warnings.push('HowTo content detected but no HowTo schema');
      analysis.fixes.push({
        priority: 'high',
        title: 'Add HowTo Schema',
        description: 'Essential for step-by-step content in AI results',
        code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to [Do Something]",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Step 1",
      "text": "First step description"
    },
    {
      "@type": "HowToStep",
      "name": "Step 2",
      "text": "Second step description"
    }
  ]
}
</script>`,
        location: 'In <head> or before </body>'
      });
    }

    const shortParaRatio = analysis.contentStructure.totalParagraphs > 0 
      ? (analysis.contentStructure.shortParagraphs / analysis.contentStructure.totalParagraphs) * 100 
      : 0;

    if (shortParaRatio < 60) {
      analysis.recommendations.push(`Only ${Math.round(shortParaRatio)}% short paragraphs - aim for 60%+`);
      analysis.fixes.push({
        priority: 'medium',
        title: 'Break Up Long Paragraphs',
        description: 'AI engines prefer scannable, concise content',
        code: `<!-- BEFORE: Long paragraph -->
<p>This is a very long paragraph with multiple ideas that makes it hard for AI to extract specific information and it goes on and on without clear structure...</p>

<!-- AFTER: Short, focused paragraphs -->
<p>First key idea in 2-3 sentences.</p>
<p>Second key idea with supporting detail.</p>
<p>Third key idea with clear takeaway.</p>`,
        location: 'Break long paragraphs throughout content'
      });
    }

    return analysis;
  };

  const analyzeForSEO = (doc) => {
    const analysis = {
      auditType: 'SEO',
      title: {
        content: doc.querySelector('title')?.textContent || 'MISSING',
        length: doc.querySelector('title')?.textContent?.length || 0,
      },
      meta: {
        description: doc.querySelector('meta[name="description"]')?.content || 'MISSING',
        descriptionLength: doc.querySelector('meta[name="description"]')?.content?.length || 0,
        canonical: doc.querySelector('link[rel="canonical"]')?.href || 'MISSING',
        viewport: doc.querySelector('meta[name="viewport"]')?.content || 'MISSING',
      },
      headers: { h1: [], h2: [], h3: [] },
      images: { total: 0, missingAlt: [], withAlt: 0 },
      schema: { jsonLd: [], microdata: false },
      content: { wordCount: 0 },
      criticalIssues: [],
      warnings: [],
      recommendations: [],
      fixes: []
    };

    if (analysis.title.length === 0) {
      analysis.criticalIssues.push('Missing title tag');
      analysis.fixes.push({
        priority: 'critical',
        title: 'Add Title Tag',
        description: 'Essential for search engine rankings',
        code: '<title>Your Page Title - Brand Name (50-60 chars)</title>',
        location: 'Inside <head> section'
      });
    }

    if (analysis.meta.descriptionLength === 0) {
      analysis.criticalIssues.push('Missing meta description');
      analysis.fixes.push({
        priority: 'critical',
        title: 'Add Meta Description',
        description: 'Improves click-through rate from search results',
        code: '<meta name="description" content="Compelling description 150-160 characters.">',
        location: 'Inside <head> section'
      });
    }

    if (analysis.meta.viewport === 'MISSING') {
      analysis.criticalIssues.push('Missing viewport meta tag');
      analysis.fixes.push({
        priority: 'critical',
        title: 'Add Viewport Tag',
        description: 'Required for mobile-friendly sites',
        code: '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
        location: 'Inside <head> section'
      });
    }

    for (let i = 1; i <= 3; i++) {
      doc.querySelectorAll(`h${i}`).forEach(h => {
        analysis.headers[`h${i}`].push(h.textContent.trim());
      });
    }

    if (analysis.headers.h1.length === 0) {
      analysis.criticalIssues.push('Missing H1 tag');
      analysis.fixes.push({
        priority: 'critical',
        title: 'Add H1 Heading',
        description: 'Every page needs exactly one H1 with primary keyword',
        code: '<h1>Your Main Page Heading With Primary Keyword</h1>',
        location: 'Top of main content'
      });
    }

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
        description: 'Improves accessibility and image SEO',
        code: `<img src="your-image.jpg" alt="Descriptive text about the image">`,
        location: 'Every <img> tag'
      });
    }

    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    scripts.forEach(script => {
      try {
        analysis.schema.jsonLd.push(JSON.parse(script.textContent));
      } catch (e) {}
    });

    if (analysis.schema.jsonLd.length === 0) {
      analysis.criticalIssues.push('No structured data found');
      analysis.fixes.push({
        priority: 'critical',
        title: 'Add Schema.org Markup',
        description: 'Enables rich results in search',
        code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Company",
  "url": "https://yourdomain.com"
}
</script>`,
        location: 'In <head> or before </body>'
      });
    }

    const bodyText = doc.body?.textContent || '';
    analysis.content.wordCount = bodyText.trim().split(/\s+/).filter(w => w.length > 0).length;

    if (analysis.content.wordCount < 300) {
      analysis.warnings.push(`Low word count (${analysis.content.wordCount} words)`);
    }

    return analysis;
  };

  const analyzeHTML = (htmlContent) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      if (auditType === 'aeo') {
        return analyzeForAEO(doc);
      } else {
        return analyzeForSEO(doc);
      }
    } catch (err) {
      throw new Error(`Error parsing HTML: ${err.message}`);
    }
  };

  const generateStrategicReport = async () => {
    setGeneratingReport(true);
    setError('');

    try {
      const auditTypeName = auditType === 'aeo' ? 'AEO (Answer Engine Optimization)' : 'SEO (Search Engine Optimization)';
      const prompt = `You are an expert ${auditTypeName} strategist analyzing technical audit findings. Based on the data below, generate a comprehensive strategic report.

TECHNICAL AUDIT FINDINGS:
${JSON.stringify(technicalResults, null, 2)}

Generate a strategic ${auditTypeName} report with:

1. **Executive Summary** - Overall health score (1-10), top 3 critical findings, projected impact
2. **Business Impact Analysis** - How issues affect traffic/conversions, competitive implications, risks
3. **Prioritized Action Plan** - Week 1 (critical), Weeks 2-4 (high priority), Months 2-3 (strategic)
4. **ROI Projections** - Expected improvements, timeline, resources needed
5. **Competitive Positioning** - Industry comparison, opportunities, strengths/weaknesses
6. **Strategic Recommendations** - Content strategy, technical architecture, long-term roadmap

${auditType === 'aeo' ? 'Focus on AI-powered search engines (ChatGPT, Perplexity, Google AI Overviews, Bing Chat) and how to optimize for answer extraction and citations.' : 'Focus on traditional search engines (Google, Bing) and ranking factors.'}

Format in clean markdown with headers, bullets, and clear sections. Be specific and actionable.`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      setStrategicReport(data.content[0].text);
    } catch (err) {
      setError(`Failed to generate report: ${err.message}`);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleAnalyze = () => {
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
        const analysis = analyzeHTML(html);
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

  const copyReport = () => {
    navigator.clipboard.writeText(strategicReport).then(() => {
      setReportCopied(true);
      setTimeout(() => setReportCopied(false), 2000);
    });
  };

  const exportTechnical = () => {
    try {
      const blob = new Blob([JSON.stringify(technicalResults, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${auditType}-audit-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    }
  };

  const exportStrategic = () => {
    try {
      const blob = new Blob([strategicReport], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${auditType}-report-${Date.now()}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    }
  };

  const FixCard = ({ fix, index }) => {
    const colors = {
      critical: 'border-red-300 bg-red-50',
      high: 'border-orange-300 bg-orange-50',
      medium: 'border-yellow-300 bg-yellow-50',
    };

    const badges = {
      critical: 'bg-red-600 text-white',
      high: 'bg-orange-600 text-white',
      medium: 'bg-yellow-600 text-white',
    };

    return (
      <div className={`border-2 rounded-xl p-5 ${colors[fix.priority]}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${badges[fix.priority]}`}>
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
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-12 h-12 text-purple-600" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                C&L Page Audit Tool
              </h1>
            </div>
            <p className="text-gray-600 text-lg">Technical Precision + Strategic Intelligence</p>
          </div>

          <div className="flex gap-4 mb-6 justify-center">
            <button
              onClick={() => {
                setAuditType('seo');
                setTechnicalResults(null);
                setStrategicReport(null);
              }}
              className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition shadow-lg ${
                auditType === 'seo'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Search className="w-6 h-6" />
              SEO Audit
            </button>
            <button
              onClick={() => {
                setAuditType('aeo');
                setTechnicalResults(null);
                setStrategicReport(null);
              }}
              className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition shadow-lg ${
                auditType === 'aeo'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Brain className="w-6 h-6" />
              AEO Audit
            </button>
          </div>

          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-700">
              {auditType === 'seo' ? (
                <>
                  <strong>SEO Mode:</strong> Analyzes traditional search engine optimization - title tags, meta descriptions, headers, schema markup, and technical SEO factors.
                </>
              ) : (
                <>
                  <strong>AEO Mode:</strong> Analyzes Answer Engine Optimization for AI-powered search (ChatGPT, Perplexity, Google AI Overviews) - FAQ schema, question-based content, direct answers, and AI-friendly structure.
                </>
              )}
            </p>
          </div>

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
                onClick={handleAnalyze}
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
                    {auditType === 'seo' ? <Search className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
                    Analyze {auditType.toUpperCase()}
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

        {technicalResults && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
            <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {auditType === 'seo' ? '⚡ SEO' : '🧠 AEO'} Technical Results
              </h2>
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

            {auditType === 'aeo' && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-bold mb-3">AEO Content Analysis</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-semibold">FAQ Schema:</span> {technicalResults.faqSchema.present ? `✅ ${technicalResults.faqSchema.count} questions` : '❌ Missing'}</p>
                    <p><span className="font-semibold">Question Headers:</span> {technicalResults.questionHeaders.count} found</p>
                    <p><span className="font-semibold">Direct Answers (40-60 words):</span> {technicalResults.directAnswers.count}</p>
                    <p><span className="font-semibold">Lists:</span> {technicalResults.lists.numbered} numbered, {technicalResults.lists.bulleted} bulleted</p>
                  </div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-bold mb-3">AI-Friendly Structure</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-semibold">Tables:</span> {technicalResults.tables.count} found</p>
                    <p><span className="font-semibold">HowTo Schema:</span> {technicalResults.howToSchema.present ? '✅ Present' : '❌ Missing'}</p>
                    <p><span className="font-semibold">Definition Style:</span> {technicalResults.definitionStyle.present ? '✅ Present' : '❌ Missing'}</p>
                    <p><span className="font-semibold">Short Paragraphs:</span> {technicalResults.contentStructure.shortParagraphs}/{technicalResults.contentStructure.totalParagraphs}</p>
                  </div>
                </div>
              </div>
            )}

            {auditType === 'seo' && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold mb-3">Content Metrics</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-semibold">Word Count:</span> {technicalResults.content.wordCount}</p>
                    <p><span className="font-semibold">Images:</span> {technicalResults.images.total} ({technicalResults.images.missingAlt.length} missing ALT)</p>
                    <p><span className="font-semibold">H1 Tags:</span> {technicalResults.headers.h1.length}</p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold mb-3">Technical</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-semibold">Schema Markup:</span> {technicalResults.schema.jsonLd.length} found</p>
                    <p><span className="font-semibold">Title:</span> {technicalResults.title.length} chars</p>
                    <p><span className="font-semibold">Meta Desc:</span> {technicalResults.meta.descriptionLength} chars</p>
                  </div>
                </div>
              </div>
            )}

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

        {strategicReport && (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-purple-200">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-purple-600" />
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Strategic {auditType.toUpperCase()} Report
                </h2>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={copyReport}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  {reportCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Report
                    </>
                  )}
                </button>
                <button
                  onClick={exportStrategic}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  <Download className="w-4 h-4" />
                  Download .md
                </button>
              </div>
            </div>
            
            <div className="prose prose-lg max-w-none">
              {strategicReport.split('\n').map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={i} className="h-2"></div>;
                if (trimmed.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold mt-8 mb-4">{trimmed.replace('# ', '')}</h1>;
                if (trimmed.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mt-6 mb-3">{trimmed.replace('## ', '')}</h2>;
                if (trimmed.startsWith('### ')) return <h3 key={i} className="text-xl font-bold mt-4 mb-2">{trimmed.replace('### ', '')}</h3>;
                if (trimmed.startsWith('- ')) return <li key={i} className="ml-6 mb-1">{trimmed.replace('- ', '')}</li>;
                if (trimmed.includes('**')) {
                  const parts = trimmed.split('**');
                  return <p key={i} className="mb-3">{parts.map((part, idx) => idx % 2 === 1 ? <strong key={idx}>{part}</strong> : part)}</p>;
                }
                return <p key={i} className="mb-3">{trimmed}</p>;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}