import { useState } from 'react';
import { Shield, Home, AlertTriangle, CheckCircle, Copy, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SecurityScanner() {
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

      const prompt = `You are a cybersecurity expert. Analyze this website for vulnerabilities and security issues.

${contentToAnalyze}

Provide analysis as JSON:
{
  "overallScore": number 0-100,
  "riskLevel": "LOW/MEDIUM/HIGH/CRITICAL",
  "vulnerabilities": [
    {
      "title": "vulnerability name",
      "severity": "LOW/MEDIUM/HIGH/CRITICAL",
      "description": "what the issue is",
      "remediation": "exact code or configuration to copy-paste as a fix",
      "cve": "CVE ID if applicable or null"
    }
  ],
  "securityHeaders": {
    "present": ["header1", "header2"],
    "missing": ["header1", "header2"]
  },
  "headerFixes": [
    {
      "header": "header name",
      "value": "exact header value to add"
    }
  ],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "compliance": {
    "owasp": "percentage or status",
    "issues": ["issue 1", "issue 2"]
  }
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
      const prompt = `Based on this cybersecurity audit data, generate a comprehensive strategic security report for C&L Page's client.

Audit Results:
${JSON.stringify(analysis, null, 2)}

Generate a detailed strategic security report in markdown format that includes:
1. Executive Summary
2. Security Posture Assessment
3. Critical Vulnerabilities & Risk Analysis
4. OWASP Top 10 Compliance Status
5. Remediation Roadmap (prioritized)
6. Cost-Benefit Analysis of Security Improvements
7. Implementation Timeline & Resources Required
8. Ongoing Security Recommendations

Make it professional, actionable, and tailored for business stakeholders and technical teams.`;

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
      const exportFileDefaultName = `security-audit-${Date.now()}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } else if (format === 'markdown') {
      let markdownContent = `# Cybersecurity Audit Report\n\n`;
      markdownContent += `**Date:** ${new Date().toLocaleDateString()}\n\n`;
      markdownContent += `**Security Score:** ${analysis.overallScore}/100\n`;
      markdownContent += `**Risk Level:** ${analysis.riskLevel}\n\n`;

      markdownContent += `## Vulnerabilities Found\n\n`;
      analysis.vulnerabilities.forEach((vuln, idx) => {
        markdownContent += `### ${idx + 1}. ${vuln.title} [${vuln.severity}]\n`;
        markdownContent += `**Description:** ${vuln.description}\n\n`;
        markdownContent += `**Remediation:**\n\`\`\`\n${vuln.remediation}\n\`\`\`\n\n`;
        if (vuln.cve) {
          markdownContent += `**CVE:** ${vuln.cve}\n\n`;
        }
      });

      markdownContent += `## Security Headers\n\n`;
      markdownContent += `### Present\n`;
      analysis.securityHeaders.present.forEach(header => {
        markdownContent += `- ${header}\n`;
      });
      markdownContent += `\n### Missing\n`;
      analysis.securityHeaders.missing.forEach(header => {
        markdownContent += `- ${header}\n`;
      });

      if (analysis.headerFixes && analysis.headerFixes.length > 0) {
        markdownContent += `\n### Header Fixes\n\n`;
        analysis.headerFixes.forEach(fix => {
          markdownContent += `**${fix.header}:**\n\`\`\`\n${fix.value}\n\`\`\`\n\n`;
        });
      }

      markdownContent += `\n## OWASP Compliance\n\n`;
      markdownContent += `**Status:** ${analysis.compliance.owasp}\n\n`;
      markdownContent += `**Issues:**\n`;
      analysis.compliance.issues.forEach(issue => {
        markdownContent += `- ${issue}\n`;
      });

      if (strategicReport) {
        markdownContent += `\n\n---\n\n${strategicReport}`;
      }

      const blob = new Blob([markdownContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', url);
      linkElement.setAttribute('download', `security-audit-${Date.now()}.md`);
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

  const getRiskColor = (risk) => {
    if (risk === 'CRITICAL') return 'text-red-600';
    if (risk === 'HIGH') return 'text-orange-600';
    if (risk === 'MEDIUM') return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 p-6">
      <div className="max-w-7xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 mb-6 text-red-600 hover:text-red-800 font-semibold">
          <Home className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-red-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Cybersecurity Audit Tool
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Comprehensive vulnerability scanning for web applications
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
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  URL
                </button>
                <button
                  onClick={() => setInputMethod('source')}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                    inputMethod === 'source'
                      ? 'bg-red-600 text-white'
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none font-mono text-sm"
                  />
                </div>
              )}
            </div>

            <button
              onClick={analyzeWebsite}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-semibold text-lg hover:from-red-700 hover:to-rose-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Run Security Audit
                </>
              )}
            </button>

            {analysis && (
              <div className="space-y-4">
                <button
                  onClick={generateStrategicReport}
                  disabled={generatingReport}
                  className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Security Score</h2>
                  <div className="text-center">
                    <div className={`text-6xl font-bold mb-2 ${getRiskColor(analysis.riskLevel)}`}>
                      {analysis.overallScore}
                    </div>
                    <div className={`text-lg font-semibold ${getRiskColor(analysis.riskLevel)}`}>
                      {analysis.riskLevel} RISK
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Vulnerabilities Found</h2>
                  <div className="space-y-3">
                    {analysis.vulnerabilities.map((vuln, idx) => (
                      <div key={idx} className={`border rounded-lg p-4 ${getSeverityColor(vuln.severity)}`}>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{vuln.title}</h3>
                          <span className="text-xs px-2 py-1 bg-white rounded">{vuln.severity}</span>
                        </div>
                        <p className="text-sm mb-2">{vuln.description}</p>
                        <div className="bg-white/50 rounded p-2 mb-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold">Remediation:</span>
                            <button
                              onClick={() => copyFix(vuln.remediation, `vuln-${idx}`)}
                              className="text-xs px-2 py-1 bg-white rounded hover:bg-gray-100 flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />
                              {copiedIndex === `vuln-${idx}` ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                          <pre className="text-xs overflow-x-auto">{vuln.remediation}</pre>
                        </div>
                        {vuln.cve && (
                          <p className="text-xs text-gray-600 mt-1"><strong>CVE:</strong> {vuln.cve}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Security Headers</h2>
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-green-700 mb-2">Present</h3>
                      <div className="flex flex-wrap gap-2">
                        {analysis.securityHeaders.present.map((header, idx) => (
                          <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            {header}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-700 mb-2">Missing</h3>
                      <div className="flex flex-wrap gap-2">
                        {analysis.securityHeaders.missing.map((header, idx) => (
                          <span key={idx} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                            {header}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {analysis.headerFixes && analysis.headerFixes.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Header Fixes</h2>
                    <div className="space-y-3">
                      {analysis.headerFixes.map((fix, idx) => (
                        <div key={idx} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-blue-900">{fix.header}</h3>
                            <button
                              onClick={() => copyFix(fix.value, `header-${idx}`)}
                              className="text-xs px-2 py-1 bg-blue-100 rounded hover:bg-blue-200 flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />
                              {copiedIndex === `header-${idx}` ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                          <pre className="text-xs bg-white p-2 rounded overflow-x-auto">{fix.value}</pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">OWASP Compliance</h2>
                  <div className="mb-3">
                    <div className="text-2xl font-bold text-gray-900">{analysis.compliance.owasp}</div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Issues:</h3>
                    <ul className="space-y-1">
                      {analysis.compliance.issues.map((issue, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Recommendations</h2>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {strategicReport && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Strategic Security Report</h2>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700">{strategicReport}</pre>
                    </div>
                  </div>
                )}
              </>
            )}

            {!analysis && !loading && (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Enter a URL or paste source code to begin security analysis
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
