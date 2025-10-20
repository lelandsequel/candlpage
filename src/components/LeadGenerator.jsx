import React, { useState } from "react";
import { Home, Users, Download, Play, Pause, RotateCcw, Loader2, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";

function downloadCSV(filename, leads) {
  const headers = ["Name", "Website", "Phone", "Email", "City", "Score"];
  const rows = leads.map(l => [
    l.name || "",
    l.website || "",
    l.phone || "",
    l.email || "",
    l.city || "",
    (l.score || 0).toFixed(0)
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function LeadGenerator() {
  // Manual Run State
  const [manualGeo, setManualGeo] = useState("");
  const [manualIndustry, setManualIndustry] = useState("");
  const [manualMax, setManualMax] = useState(30);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualLeads, setManualLeads] = useState([]);
  const [manualError, setManualError] = useState("");

  // Automated Run State
  const [automatedRuns, setAutomatedRuns] = useState([]);
  const [automatedGeo, setAutomatedGeo] = useState("");
  const [automatedIndustries, setAutomatedIndustries] = useState("");
  const [automatedMax, setAutomatedMax] = useState(30);
  const [automatedInterval, setAutomatedInterval] = useState(24);
  const [automatedRunning, setAutomatedRunning] = useState(false);
  const [automatedError, setAutomatedError] = useState("");

  // UI State
  const [activeTab, setActiveTab] = useState("manual");
  const [sortBy, setSortBy] = useState("score");
  const [reportLoading, setReportLoading] = useState(null);
  const [reports, setReports] = useState({});

  // Generate Report for a lead
  async function generateReport(lead) {
    setReportLoading(lead.name);
    try {
      const res = await fetch("/api/lead-report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lead: lead,
          geo: manualGeo,
          industry: manualIndustry
        })
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
      const json = JSON.parse(text);
      const report = json?.result?.report || "";
      
      // Save report and trigger download
      const blob = new Blob([report], { type: "text/plain" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${lead.name.replace(/[^a-z0-9]/gi, '_')}_report.txt`;
      a.click();
      URL.revokeObjectURL(a.href);
      
      // Store report in state
      setReports(prev => ({...prev, [lead.name]: report}));
    } catch (e) {
      alert("Error generating report: " + String(e.message || e));
    } finally {
      setReportLoading(null);
    }
  }

  // Manual Run
  async function runManualSearch() {
    if (!manualGeo.trim() || !manualIndustry.trim()) {
      setManualError("Enter both geography and industry");
      return;
    }

    setManualError("");
    setManualLoading(true);
    setManualLeads([]);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          geo: manualGeo,
          industry: manualIndustry,
          max_results: parseInt(manualMax) || 30
        })
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
      const json = JSON.parse(text);
      const leads = json?.result?.leads || [];
      setManualLeads(leads);
    } catch (e) {
      setManualError(String(e.message || e));
    } finally {
      setManualLoading(false);
    }
  }

  // Automated Runs
  async function startAutomatedRuns() {
    if (!automatedGeo.trim() || !automatedIndustries.trim()) {
      setAutomatedError("Enter geography and at least one industry");
      return;
    }

    const industries = automatedIndustries
      .split(",")
      .map(i => i.trim())
      .filter(i => i.length > 0);

    if (industries.length === 0) {
      setAutomatedError("Enter at least one industry (comma-separated)");
      return;
    }

    setAutomatedError("");
    setAutomatedRunning(true);

    const newRuns = industries.map((industry, idx) => ({
      id: Date.now() + idx,
      industry,
      geo: automatedGeo,
      status: "pending",
      leads: [],
      error: null,
      lastRun: null
    }));

    setAutomatedRuns(newRuns);
    processAutomatedRuns(newRuns);
  }

  async function processAutomatedRuns(runs) {
    for (const run of runs) {
      if (!automatedRunning) break;

      setAutomatedRuns(prev =>
        prev.map(r => r.id === run.id ? { ...r, status: "running" } : r)
      );

      try {
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            geo: run.geo,
            industry: run.industry,
            max_results: parseInt(automatedMax) || 30
          })
        });

        const text = await res.text();
        if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
        const json = JSON.parse(text);
        const leads = json?.result?.leads || [];

        setAutomatedRuns(prev =>
          prev.map(r =>
            r.id === run.id
              ? {
                  ...r,
                  status: "completed",
                  leads,
                  lastRun: new Date(),
                  error: null
                }
              : r
          )
        );
      } catch (e) {
        setAutomatedRuns(prev =>
          prev.map(r =>
            r.id === run.id
              ? {
                  ...r,
                  status: "error",
                  error: String(e.message || e),
                  lastRun: new Date()
                }
              : r
          )
        );
      }

      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  function stopAutomatedRuns() {
    setAutomatedRunning(false);
  }

  function resetAutomatedRuns() {
    setAutomatedRuns([]);
    setAutomatedError("");
  }

  const sortedManualLeads = [...manualLeads].sort((a, b) => {
    if (sortBy === "score") return (b.score || 0) - (a.score || 0);
    return (a.name || "").localeCompare(b.name || "");
  });

  const getScoreColor = (score) => {
    if (score >= 70) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getStatusColor = (status) => {
    if (status === "completed") return "text-green-400";
    if (status === "running") return "text-blue-400";
    if (status === "error") return "text-red-400";
    return "text-gray-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-4">
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
            <h1 className="text-5xl font-bold text-white mb-2">Lead Generator</h1>
            <p className="text-gray-400">Find and score business leads by geography and industry</p>
          </div>
          <Users className="w-16 h-16 text-orange-400" />
        </div>

        <div className="mb-8 flex gap-4 border-b border-white/20 pb-4">
          <button
            onClick={() => setActiveTab("manual")}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === "manual"
                ? "bg-orange-500 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            Manual Run
          </button>
          <button
            onClick={() => setActiveTab("automated")}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === "automated"
                ? "bg-orange-500 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            Automated Runs
          </button>
        </div>

        {activeTab === "manual" && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Search Parameters</h2>

              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Geography</label>
                  <input
                    type="text"
                    value={manualGeo}
                    onChange={(e) => setManualGeo(e.target.value)}
                    placeholder="e.g., Houston, TX"
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Industry</label>
                  <input
                    type="text"
                    value={manualIndustry}
                    onChange={(e) => setManualIndustry(e.target.value)}
                    placeholder="e.g., solar panel installation"
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Max Results</label>
                  <input
                    type="number"
                    value={manualMax}
                    onChange={(e) => setManualMax(e.target.value)}
                    min="1"
                    max="100"
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {manualError && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {manualError}
                </div>
              )}

              <button
                onClick={runManualSearch}
                disabled={manualLoading}
                className="px-8 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white font-semibold flex items-center gap-2 transition"
              >
                {manualLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Find Leads
                  </>
                )}
              </button>
            </div>

            {manualLeads.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Results</h2>
                    <p className="text-gray-400">{manualLeads.length} leads found</p>
                  </div>
                  <div className="flex gap-4">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="score">Sort by Score</option>
                      <option value="name">Sort by Name</option>
                    </select>
                    <button
                      onClick={() => downloadCSV("leads.csv", manualLeads)}
                      className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold flex items-center gap-2 transition"
                    >
                      <Download className="w-5 h-5" />
                      Download CSV
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {sortedManualLeads.map((lead, idx) => (
                    <div key={idx} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-white/20 transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{lead.name || "Unknown"}</h3>
                          {lead.website && (
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              {lead.website}
                            </a>
                          )}
                          <div className="text-sm text-gray-400 mt-1">
                            {lead.phone && <span>📞 {lead.phone}</span>}
                            {lead.email && <span className="ml-4">📧 {lead.email}</span>}
                            {lead.city && <span className="ml-4">📍 {lead.city}</span>}
                          </div>
                          <button
                            onClick={() => generateReport(lead)}
                            disabled={reportLoading === lead.name}
                            className="mt-2 px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white text-sm font-semibold flex items-center gap-2 transition"
                          >
                            {reportLoading === lead.name ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              "📄 Generate Report"
                            )}
                          </button>
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${getScoreColor(lead.score || 0)}`}>
                            {(lead.score || 0).toFixed(0)}
                          </div>
                          <div className="text-xs text-gray-400">Score</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "automated" && (
          <div className="space-y-6">
            {!automatedRunning && automatedRuns.length === 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-6">Setup Automated Runs</h2>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Geography</label>
                    <input
                      type="text"
                      value={automatedGeo}
                      onChange={(e) => setAutomatedGeo(e.target.value)}
                      placeholder="e.g., Houston, TX"
                      className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Industries (comma-separated)</label>
                    <input
                      type="text"
                      value={automatedIndustries}
                      onChange={(e) => setAutomatedIndustries(e.target.value)}
                      placeholder="e.g., solar installation, roofing, HVAC"
                      className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Max Results per Industry</label>
                    <input
                      type="number"
                      value={automatedMax}
                      onChange={(e) => setAutomatedMax(e.target.value)}
                      min="1"
                      max="100"
                      className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Repeat Every (hours)</label>
                    <input
                      type="number"
                      value={automatedInterval}
                      onChange={(e) => setAutomatedInterval(e.target.value)}
                      min="1"
                      max="720"
                      className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {automatedError && (
                  <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {automatedError}
                  </div>
                )}

                <button
                  onClick={startAutomatedRuns}
                  className="px-8 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold flex items-center gap-2 transition"
                >
                  <Play className="w-5 h-5" />
                  Start Automated Runs
                </button>
              </div>
            )}

            {automatedRunning && automatedRuns.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
                    Running Automated Searches
                  </h2>
                  <button
                    onClick={stopAutomatedRuns}
                    className="px-6 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold flex items-center gap-2 transition"
                  >
                    <Pause className="w-5 h-5" />
                    Stop
                  </button>
                </div>

                <div className="space-y-3">
                  {automatedRuns.map((run) => (
                    <div key={run.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{run.industry}</h3>
                          <p className="text-sm text-gray-400">{run.geo}</p>
                          {run.lastRun && (
                            <p className="text-xs text-gray-500 mt-1">
                              Last run: {run.lastRun.toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-semibold ${getStatusColor(run.status)}`}>
                            {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                          </div>
                          {run.leads.length > 0 && (
                            <div className="text-xs text-gray-400 mt-1">{run.leads.length} leads</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {automatedRuns.length > 0 && !automatedRunning && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Completed Runs</h2>
                  <button
                    onClick={resetAutomatedRuns}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center gap-2 transition"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Reset
                  </button>
                </div>

                <div className="space-y-4">
                  {automatedRuns.map((run) => (
                    <div key={run.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-white">{run.industry}</h3>
                          <p className="text-sm text-gray-400">{run.geo}</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-semibold ${getStatusColor(run.status)}`}>
                            {run.status === "completed" ? (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                Completed
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-400">
                                <AlertCircle className="w-4 h-4" />
                                Error
                              </span>
                            )}
                          </div>
                          {run.leads.length > 0 && (
                            <button
                              onClick={() => downloadCSV(`leads-${run.industry}.csv`, run.leads)}
                              className="text-xs text-orange-400 hover:text-orange-300 mt-2 flex items-center gap-1 ml-auto"
                            >
                              <Download className="w-3 h-3" />
                              Download
                            </button>
                          )}
                        </div>
                      </div>
                      {run.leads.length > 0 && (
                        <div className="text-sm text-gray-400">
                          {run.leads.length} leads found • Avg score: {(
                            run.leads.reduce((sum, l) => sum + (l.score || 0), 0) / run.leads.length
                          ).toFixed(0)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
