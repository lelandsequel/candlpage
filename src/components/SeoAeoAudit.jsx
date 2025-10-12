import { useState } from 'react';
import { TrendingUp, Home, AlertTriangle, CheckCircle, Copy, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SeoAeoAudit() {
  const [url, setUrl] = useState('');
  const [sourceCode, setSourceCode] = useState('');
  const [inputMethod, setInputMethod] = useState('url');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [strategicReport, setStrategicReport] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  const analyzeWebsite = async () => {
    if (!url.trim() && !sourceCode.trim()) {
      alert('Please provide a URL or source code');
      return;
    }

    setLoading(true);
    setAnalysis(null);
    setStrategicReport(null);

    try {
      let contentToAnalyze = '';

      if (inputMethod === 'url' && url.trim()) {
        contentToAnalyze = `URL: ${url}`;
      } else if (inputMethod === 'source' && sourceCode.trim()) {
        contentToAnalyze = `Source Code:\n${sourceCode}`;
      }

      const prompt = `You are an SEO and AEO (Answer Engine Optimization) expert. Analyze this website for optimization opportunities.

${contentToAnalyze}

Provide analysis as JSON:
{
  "overallScore": number 0-100,
  "grade": "A+/A/B/C/D/F",
  "seoIssues": [
    {
      "title": "issue name",
      "severity": "LOW/MEDIUM/HIGH/CRITICAL",
      "description": "what the issue is",
      "fix": "exact code or text to copy-paste",
      "impact": "how this affects SEO/AEO"
    }
  ],
  "aeoOptimizations": [
    {
      "title": "optimization name",
      "description": "what to optimize",
      "implementation": "exact code or text to copy-paste",
      "benefit": "how this helps answer engines"
    }
  ],
  "technicalSeo": {
    "present": ["feature1", "feature2"],
    "missing": ["feature1", "feature2"]
  },
  "contentGaps": ["gap 1", "gap 2"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}

CRITICAL: Respond ONLY with valid JSON. No markdown, no code blocks, no extra text.`;

      const response = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();
      let responseText = data.content[0].text;
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsedAnalysis = JSON.parse(responseText);
      setAnalysis(parsedAnalysis);

    } catch (error) {
      console.error('Error:', error);
      alert('Error analyzing website. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateStrategicReport = async () => {
    if (!analysis) return;

    setGeneratingReport(true);
    try {
      const prompt = `Based on this SEO/AEO audit data, generate a comprehensive strategic report for C&L Page's client.

Audit Results:
${JSON.stringify(analysis, null, 2)}

Generate a detailed strategic report in markdown format that includes:
1. Executive Summary
2. Current State Assessment
3. Key Findings & Opportunities
4. Strategic Recommendations
5. Priority Action Items
6. Expected Impact & ROI
7. Implementation Timeline

Make it professional, actionable, and tailored for business stakeholders.`;

      const response = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();
      const reportText = data.content[0].text;
      setStrategicReport(reportText);

    } catch (error) {
      console.error('Error:', error);
      alert('Error generating strategic report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const copyFix = (fix, index) => {
    navigator.clipboard.writeText(fix);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const exportResults = (format) => {
    if (format === 'json') {
      const dataStr = JSON.stringify({ analysis, strategicReport }, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `seo-aeo-audit-${Date.now()}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } else if (format === 'markdown') {
      let markdownContent = `# SEO/AEO Audit Report\n\n`;
      markdownContent += `**Date:** ${new Date().toLocaleDateString()}\n\n`;
      markdownContent += `**Overall Score:** ${analysis.overallScore}/100 (${analysis.grade})\n\n`;

      markdownContent += `## SEO Issues\n\n`;
      analysis.seoIssues.forEach((issue, idx) => {
        markdownContent += `### ${idx + 1}. ${issue.title} [${issue.severity}]\n`;
        markdownContent += `**Description:** ${issue.description}\n\n`;
        markdownContent += `**Fix:**\n\`\`\`\n${issue.fix}\n\`\`\`\n\n`;
        markdownContent += `**Impact:** ${issue.impact}\n\n`;
      });

      markdownContent += `## AEO Optimizations\n\n`;
      analysis.aeoOptimizations.forEach((opt, idx) => {
        markdownContent += `### ${idx + 1}. ${opt.title}\n`;
        markdownContent += `**Description:** ${opt.description}\n\n`;
        markdownContent += `**Implementation:**\n\`\`\`\n${opt.implementation}\n\`\`\`\n\n`;
        markdownContent += `**Benefit:** ${opt.benefit}\n\n`;
      });

      if (strategicReport) {
        markdownContent += `\n\n---\n\n${strategicReport}`;
      }

      const blob = new Blob([markdownContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', url);
      linkElement.setAttribute('download', `seo-aeo-audit-${Date.now()}.md`);
      linkElement.click();
      URL.revokeObjectURL(url);
    }
  };

  const getSeverityColor = (severity) => {
    if (severity === 'CRITICAL') return 'bg-red-100 text-red-800 border-red-300';
    if (severity === 'HIGH') return 'bg-orange-100 text-orange-800 border-orange-300';
    if (severity === 'MEDIUM') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return 'text-green-600';
    if (grade.startsWith('B')) return 'text-blue-600';
    if (grade.startsWith('C')) return 'text-yellow-600';
    if (grade.startsWith('D')) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 mb-6 text-purple-600 hover:text-purple-800 font-semibold">
          <Home className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <TrendingUp className="w-10 h-10 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              SEO/AEO Audit Tool
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Technical SEO and Answer Engine Optimization
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Input Method</h2>
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setInputMethod('url')}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                    inputMethod === 'url'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  URL
                </button>
                <button
                  onClick={() => setInputMethod('source')}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                    inputMethod === 'source'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Source Code
                </button>
              </div>

              {inputMethod === 'url' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    HTML Source Code
                  </label>
                  <textarea
                    value={sourceCode}
                    onChange={(e) => setSourceCode(e.target.value)}
                    placeholder="Paste HTML source code here..."
                    rows={12}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none font-mono text-sm"
                  />
                </div>
              )}
            </div>

            <button
              onClick={analyzeWebsite}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5" />
                  Run SEO/AEO Audit
                </>
              )}
            </button>

            {analysis && (
              <div className="space-y-4">
                <button
                  onClick={generateStrategicReport}
                  disabled={generatingReport}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingReport ? 'Generating Report...' : 'Generate Strategic Report'}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => exportResults('json')}
                    className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export JSON
                  </button>
                  <button
                    onClick={() => exportResults('markdown')}
                    className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export MD
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {analysis && (
              <>
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">SEO Score</h2>
                  <div className="text-center">
                    <div className={`text-6xl font-bold mb-2 ${getGradeColor(analysis.grade)}`}>
                      {analysis.overallScore}
                    </div>
                    <div className={`text-2xl font-semibold ${getGradeColor(analysis.grade)}`}>
                      Grade {analysis.grade}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">SEO Issues</h2>
                  <div className="space-y-3">
                    {analysis.seoIssues.map((issue, idx) => (
                      <div key={idx} className={`border rounded-lg p-4 ${getSeverityColor(issue.severity)}`}>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{issue.title}</h3>
                          <span className="text-xs px-2 py-1 bg-white rounded">{issue.severity}</span>
                        </div>
                        <p className="text-sm mb-2">{issue.description}</p>
                        <div className="bg-white/50 rounded p-2 mb-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold">Fix:</span>
                            <button
                              onClick={() => copyFix(issue.fix, `issue-${idx}`)}
                              className="text-xs px-2 py-1 bg-white rounded hover:bg-gray-100 flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />
                              {copiedIndex === `issue-${idx}` ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                          <pre className="text-xs overflow-x-auto">{issue.fix}</pre>
                        </div>
                        <p className="text-sm"><strong>Impact:</strong> {issue.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">AEO Optimizations</h2>
                  <div className="space-y-3">
                    {analysis.aeoOptimizations.map((opt, idx) => (
                      <div key={idx} className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                        <h3 className="font-semibold text-purple-900 mb-2">{opt.title}</h3>
                        <p className="text-sm text-gray-700 mb-2">{opt.description}</p>
                        <div className="bg-white rounded p-2 mb-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold">Implementation:</span>
                            <button
                              onClick={() => copyFix(opt.implementation, `aeo-${idx}`)}
                              className="text-xs px-2 py-1 bg-purple-100 rounded hover:bg-purple-200 flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />
                              {copiedIndex === `aeo-${idx}` ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                          <pre className="text-xs overflow-x-auto">{opt.implementation}</pre>
                        </div>
                        <p className="text-sm text-purple-700"><strong>Benefit:</strong> {opt.benefit}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Technical SEO</h2>
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-green-700 mb-2">Present</h3>
                      <div className="flex flex-wrap gap-2">
                        {analysis.technicalSeo.present.map((feature, idx) => (
                          <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-700 mb-2">Missing</h3>
                      <div className="flex flex-wrap gap-2">
                        {analysis.technicalSeo.missing.map((feature, idx) => (
                          <span key={idx} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Content Gaps</h2>
                  <ul className="space-y-2">
                    {analysis.contentGaps.map((gap, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Recommendations</h2>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {strategicReport && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Strategic Report</h2>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700">{strategicReport}</pre>
                    </div>
                  </div>
                )}
              </>
            )}

            {!analysis && !loading && (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Enter a URL or paste source code to begin SEO/AEO analysis
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
