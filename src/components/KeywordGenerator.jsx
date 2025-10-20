import React, { useState, useMemo } from "react";
import { Home, Search, FileText, Download, Copy, Lightbulb, CheckSquare, Square, Loader2, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

// Small helpers
function toCSV(keywords = []) {
  const headers = ["keyword", "search_volume", "keyword_difficulty", "commercial_intent", "ranking_potential"];
  const lines = [headers.join(",")].concat(
    keywords.map(k =>
      headers.map(h => `"${String(k[h] ?? "").replace(/"/g, '""')}"`).join(",")
    )
  );
  return lines.join("\n");
}

function downloadText(filename, text, type = "text/plain") {
  const blob = new Blob([text], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function KeywordGenerator() {
  // ---- Existing state ----
  const [topic, setTopic] = useState("");
  const [keywordData, setKeywordData] = useState(null); // { id, result: { keywords: [...] } }
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ---- New state for analysis & articles ----
  const [activeTab, setActiveTab] = useState("keywords"); // "keywords" | "analysis" | "articles"
  const [selected, setSelected] = useState({}); // { "keyword": true }
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [articleLoading, setArticleLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null); // result from /api/analyze-content
  const [articles, setArticles] = useState([]);   // [{ keyword, payload: { article, seo_analysis }, createdAt }]

  const isFormValid = useMemo(() => topic.trim().length > 0, [topic]);

  const keywords = useMemo(
    () => keywordData?.result?.keywords || [],
    [keywordData]
  );

  const selectedKeywords = useMemo(
    () => keywords.filter(k => selected[k.keyword]),
    [keywords, selected]
  );

  // ---- Keyword Fetch ----
  async function generateKeywords() {
    setError("");
    setLoading(true);
    setKeywordData(null);
    setSelected({});
    setAnalysis(null);
    setArticles([]);
    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic })
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
      const json = JSON.parse(text);
      setKeywordData(json);
      setActiveTab("keywords");
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  // ---- Selection ----
  function toggleAll(val) {
    if (!keywords.length) return;
    const next = {};
    if (val) {
      for (const k of keywords) next[k.keyword] = true;
    }
    setSelected(next);
  }
  function toggleOne(kw) {
    setSelected(prev => ({ ...prev, [kw]: !prev[kw] }));
  }

  // ---- Analysis: competitors + outline for selected keywords ----
  async function runAnalysis() {
    if (!selectedKeywords.length) {
      setError("Select at least one keyword to analyze.");
      return;
    }
    setError("");
    setAnalysisLoading(true);
    setAnalysis(null);
    try {
      const res = await fetch("/api/analyze-content", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ keywords: selectedKeywords.map(k => k.keyword) })
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
      const json = JSON.parse(text);
      setAnalysis(json); // { id, result: {...} }
      setActiveTab("analysis");
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setAnalysisLoading(false);
    }
  }

  // ---- Article generation for selected keywords (sequential) ----
  async function runArticles() {
    if (!selectedKeywords.length) {
      setError("Select at least one keyword to generate an article.");
      return;
    }
    setError("");
    setArticleLoading(true);

    const newArticles = [];
    try {
      // Reuse outline if present
      const outline = analysis?.result?.content_outline || null;

      for (const k of selectedKeywords) {
        const res = await fetch("/api/generate-article", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            keywords: [k.keyword],
            outline
          })
        });
        const text = await res.text();
        if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
        const json = JSON.parse(text); // { id, result: { article, seo_analysis } }

        newArticles.push({
          keyword: k.keyword,
          payload: json.result,
          createdAt: new Date().toISOString()
        });

        // Update progressively for user feedback
        setArticles(prev => [...prev, newArticles[newArticles.length - 1]]);
        setActiveTab("articles");
      }
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setArticleLoading(false);
    }
  }

  // ---- Exports ----
  function copyKeywordsJSON() {
    if (!keywords.length) return;
    navigator.clipboard.writeText(JSON.stringify(keywords, null, 2));
  }
  function exportKeywordsCSV() {
    if (!keywords.length) return;
    downloadText(
      `keywords-${(topic || "topic").replace(/\s+/g, "-")}.csv`,
      toCSV(keywords),
      "text/csv"
    );
  }
  function downloadArticleHTML(a) {
    const title = a?.payload?.article?.title || a.keyword || "article";
    const html = a?.payload?.article?.content || "";
    const meta = a?.payload?.article?.meta_description || "";
    const doc = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<meta name="description" content="${meta}" />
</head>
<body>
${html}
</body>
</html>`;
    downloadText(`${title.replace(/[^\w\-]+/g, "_")}.html`, doc, "text/html");
  }
  function copyArticleJSON(a) {
    navigator.clipboard.writeText(JSON.stringify(a.payload, null, 2));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Keyword Research & Blog Generator</h1>
            <p className="text-gray-300">Generate low-competition keywords, analyze competitors, and produce authoritative articles</p>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 bg-white/10 backdrop-blur-lg rounded-lg px-4 py-2 border border-white/20 hover:bg-white/20 transition-all text-white"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
        </div>

        {/* Input */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
          <div className="mb-4">
            <label className="block text-white font-semibold mb-2">Topic/Business (Required)</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., elevator modernization in Houston, digital marketing agency, plumbing services..."
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={generateKeywords}
              disabled={!isFormValid || loading}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white px-5 py-3 rounded-lg font-semibold transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? "Generating..." : "Generate Keywords"}
            </button>

            {keywords.length > 0 && (
              <>
                <button
                  onClick={() => {
                    setActiveTab("keywords");
                    toggleAll(true);
                  }}
                  className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/20 flex items-center gap-2"
                >
                  <CheckSquare className="w-4 h-4" /> Select All
                </button>
                <button
                  onClick={() => setSelected({})}
                  className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/20 flex items-center gap-2"
                >
                  <Square className="w-4 h-4" /> Clear
                </button>
                <button
                  onClick={runAnalysis}
                  disabled={analysisLoading || selectedKeywords.length === 0}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white px-5 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  {analysisLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                  {analysisLoading ? "Analyzing..." : "Analyze Competitors"}
                </button>
                <button
                  onClick={runArticles}
                  disabled={articleLoading || selectedKeywords.length === 0}
                  className="bg-violet-500 hover:bg-violet-600 disabled:bg-gray-500 text-white px-5 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  {articleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  {articleLoading ? "Generating Articles..." : "Generate Articles"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex items-center gap-2 text-white/80">
          {["keywords", "analysis", "articles"].map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-lg border ${activeTab === t ? "bg-white/20 border-white/40" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* KEYWORDS TAB */}
        {activeTab === "keywords" && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            {!keywords.length ? (
              <p className="text-gray-300">No keywords yet. Generate some above.</p>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={copyKeywordsJSON}
                    className="bg-white/10 border border-white/20 text-white px-3 py-2 rounded-lg hover:bg-white/20 flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" /> Copy JSON
                  </button>
                  <button
                    onClick={exportKeywordsCSV}
                    className="bg-white/10 border border-white/20 text-white px-3 py-2 rounded-lg hover:bg-white/20 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                </div>
                <div className="space-y-3">
                  {keywords.map((k, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex justify-between items-start">
                        <div className="pr-4">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={!!selected[k.keyword]}
                              onChange={() => toggleOne(k.keyword)}
                            />
                            <span className="text-lg font-semibold text-white">{k.keyword}</span>
                          </label>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-300">
                            <span>Volume: {k.search_volume ?? "—"}</span>
                            <span>Difficulty: {k.keyword_difficulty ?? "—"}</span>
                            <span>Intent: {k.commercial_intent ?? "—"}</span>
                            <span>Rank Window: {k.ranking_potential ?? "—"}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/40" />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ANALYSIS TAB */}
        {activeTab === "analysis" && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            {!analysis?.result ? (
              <p className="text-gray-300">Run “Analyze Competitors” to populate this tab.</p>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-white mb-3">Content Analysis & Outline</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h3 className="text-white font-semibold mb-2">Competitors</h3>
                    <div className="space-y-3 text-gray-200">
                      {(analysis.result.competitors || []).map((c, idx) => (
                        <div key={idx} className="text-sm">
                          <div className="font-medium text-white">{c.business_name}</div>
                          <div><span className="font-semibold">Topics:</span> {(c.main_topics || []).join(", ") || "—"}</div>
                          <div><span className="font-semibold">LSI:</span> {(c.lsi_keywords || []).join(", ") || "—"}</div>
                          <div><span className="font-semibold">Entities:</span> {(c.entities || []).join(", ") || "—"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h3 className="text-white font-semibold mb-2">Outline</h3>
                    <div className="text-gray-200 text-sm">
                      <div className="mb-2"><span className="font-semibold">Title:</span> {analysis.result?.content_outline?.title || "—"}</div>
                      <ol className="list-decimal ml-5 space-y-1">
                        {(analysis.result?.content_outline?.sections || []).map((s, i) => (
                          <li key={i}>
                            <div className="font-medium text-white">{s.heading}</div>
                            <div className="text-gray-300">Key points: {(s.key_points || []).join(", ") || "—"}</div>
                            <div className="text-gray-400">Unique angle: {s.unique_angle || "—"}</div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ARTICLES TAB */}
        {activeTab === "articles" && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            {articles.length === 0 ? (
              <p className="text-gray-300">Generate articles to populate this tab.</p>
            ) : (
              <div className="space-y-6">
                {articles.map((a, idx) => {
                  const art = a?.payload?.article;
                  const meta = a?.payload?.seo_analysis;
                  return (
                    <div key={idx} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex justify-between flex-wrap gap-2 items-start">
                        <div>
                          <div className="text-xs text-white/60 mb-1">Keyword: {a.keyword}</div>
                          <h3 className="text-xl font-semibold text-white">{art?.title || "Untitled Article"}</h3>
                          <div className="text-gray-300 text-sm mt-1">Meta: {art?.meta_description || "—"}</div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyArticleJSON(a)}
                            className="bg-white/10 border border-white/20 text-white px-3 py-2 rounded-lg hover:bg-white/20 flex items-center gap-2"
                          >
                            <Copy className="w-4 h-4" /> Copy JSON
                          </button>
                          <button
                            onClick={() => downloadArticleHTML(a)}
                            className="bg-white/10 border border-white/20 text-white px-3 py-2 rounded-lg hover:bg-white/20 flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" /> Download HTML
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 text-sm text-white/90">
                        {/* Rendering HTML from the API. If you later want sanitization,
                           add a sanitizer before passing to dangerouslySetInnerHTML. */}
                        {art?.content ? (
                          <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: art.content }} />
                        ) : (
                          <div className="text-gray-300">No content.</div>
                        )}
                      </div>

                      {meta ? (
                        <div className="mt-4 text-gray-300 text-sm">
                          <div><span className="font-semibold text-white">Readability:</span> {meta.readability_score || "—"}</div>
                          <div><span className="font-semibold text-white">Structure:</span> {meta.content_structure || "—"}</div>
                          <div><span className="font-semibold text-white">Keywords used:</span> {meta.target_keywords_used ?? "—"}</div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
