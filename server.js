// server.js
// -----------------------------------------------------------------------------
// Express backend for candlpage
// - /api/keywords            -> returns { id, result: { keywords: [...] } }
// - /api/analyze             -> Anthropic proxy (free-form analysis)
// - /api/analyze-content     -> OpenAI: competitor content analysis + outline
// - /api/generate-article    -> OpenAI: long-form SEO article
//
// ENV (do NOT commit .env):
//   OPENAI_API_KEY=sk-...
//   ANTHROPIC_API_KEY=sk-...                 (for /api/analyze)
//   DATAFORSEO_BASIC=Base64(login:password)  (optional; OR use LOGIN/PASSWORD)
//   DATAFORSEO_LOGIN=you@example.com         (optional)
//   DATAFORSEO_PASSWORD=yourPassword         (optional)
//   PORT=3001
// -----------------------------------------------------------------------------

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(__dirname)); // Serve static files (ui.html, etc.)

// --- Utilities ---------------------------------------------------------------
function safeParseJSON(maybeJSON) {
  if (!maybeJSON || typeof maybeJSON !== "string") return null;
  try {
    return JSON.parse(maybeJSON);
  } catch {
    try {
      const fixed = maybeJSON.replace(/```json|```/g, "").trim();
      return JSON.parse(fixed);
    } catch {
      return null;
    }
  }
}

function shaId(obj) {
  return crypto
    .createHash("sha1")
    .update(JSON.stringify(obj))
    .digest("hex")
    .slice(0, 12);
}

// --- DataForSEO helpers (optional; only run if creds exist) ------------------
async function dfsFetch(path, payload) {
  const basic =
    process.env.DATAFORSEO_BASIC ||
    (process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD
      ? Buffer.from(
          `${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`
        ).toString("base64")
      : null);

  if (!basic) return null; // no creds configured → caller should skip

  const resp = await fetch(`https://api.dataforseo.com${path}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await resp.text();
  if (!resp.ok) throw new Error(`DataForSEO HTTP ${resp.status} — ${text}`);
  return JSON.parse(text);
}

/**
 * Enrich an array of keyword strings with search volume.
 * Returns a map { keywordLower: volume } or null if DFS not configured.
 */
async function enrichSearchVolume(keywords, { location_name = "United States", language_name = "English" } = {}) {
  const hasCreds = !!(
    process.env.DATAFORSEO_BASIC ||
    (process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD)
  );
  if (!hasCreds) return null;

  const chunkSize = 300; // DFS allows ~700; keep conservative
  const out = {};
  for (let i = 0; i < keywords.length; i += chunkSize) {
    const slice = keywords.slice(i, i + chunkSize);
    const payload = [{ language_name, location_name, keywords: slice }];
    const data = await dfsFetch(
      "/v3/keywords_data/google_ads/search_volume/live",
      payload
    );
    const items = data?.tasks?.[0]?.result?.[0]?.items || [];
    for (const it of items) {
      const vol =
        it?.search_volume ?? it?.monthly_searches?.[0]?.search_volume ?? null;
      out[(it.keyword || "").toLowerCase()] = vol;
    }
  }
  return out;
}

// --- Keyword prompt (returns JSON-only) --------------------------------------
function buildKeywordPrompt(body) {
  const { topic = "" } = body;
  return `Act as an SEO strategist with 10 years experience. I need keyword ideas for ${topic} in Houston, TX. Focus on low competition keywords with commercial intent; provide ten keywords that a new website can rank for within thirty days. Include search volume estimates and keyword difficulty scores.

Return your response in this exact JSON format:
{
  "keywords": [
    {
      "keyword": "exact keyword phrase",
      "search_volume": 1200,
      "keyword_difficulty": 25,
      "commercial_intent": "high|medium|low",
      "ranking_potential": "30 days|60 days|90 days"
    }
  ],
  "summary": "Brief explanation of the keyword strategy"
}

Output valid JSON only. No markdown fences. No commentary.`;
}

// --- Health check ------------------------------------------------------------
app.get("/health", (req, res) => {
  res.json({ ok: true, env: { hasOPENAI: !!process.env.OPENAI_API_KEY, hasANTHROPIC: !!process.env.ANTHROPIC_API_KEY } });
});

// --- Anthropic proxy (your existing analyzer) --------------------------------
app.post("/api/analyze", async (req, res) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing ANTHROPIC_API_KEY" });

    const { prompt } = req.body || {};
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt || "" }],
      }),
    });

    const text = await response.text();
    if (!response.ok) return res.status(response.status).send(text);
    const json = safeParseJSON(text) || text;
    res.json(json);
  } catch (error) {
    console.error("Anthropic /api/analyze error:", error);
    res.status(500).json({ error: "Analysis failed" });
  }
});

// --- MAIN: Keyword generation (matches your component contract) --------------
app.post("/api/keywords", async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });

    const body = req.body || {};
    const prompt = buildKeywordPrompt(body);

    // OpenAI Chat Completions
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    const text = await response.text();
    if (!response.ok) return res.status(response.status).json({ error: "OpenAI error", detail: text });

    const parsed = safeParseJSON(text) || {};
    const content = parsed?.choices?.[0]?.message?.content || "";
    const resultJSON = safeParseJSON(content);
    if (!resultJSON?.keywords) {
      throw new Error("Model did not return expected JSON with 'keywords'.");
    }

    // Normalize items
    const items = Array.isArray(resultJSON.keywords) ? resultJSON.keywords : [];

    // OPTIONAL: live volume enrichment with DataForSEO
    try {
      const terms = items.map((k) => String(k.keyword || "").trim()).filter(Boolean);
      const volMap = await enrichSearchVolume(terms);
      if (volMap) {
        for (const k of items) {
          const key = String(k.keyword || "").toLowerCase();
          if (Object.prototype.hasOwnProperty.call(volMap, key)) {
            k.search_volume = volMap[key];
          }
        }
      }
    } catch (e) {
      console.warn("DataForSEO enrichment failed:", e?.message || e);
      // continue with model-provided volumes if present
    }

    const result = { keywords: items, summary: resultJSON.summary || "" };
    const id = shaId(result);
    res.json({ id, result });
  } catch (err) {
    console.error("Keyword API error:", err);
    res.status(500).json({ error: "Server error", detail: String(err?.message || err) });
  }
});

// --- Competitor content analysis (JSON contract) -----------------------------
app.post("/api/analyze-content", async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });

    const { keywords } = req.body || {};
    const keywordList = Array.isArray(keywords) ? keywords.join(", ") : keywords || "";

    const prompt = `Search for the top 3 businesses for my keywords: ${keywordList}, then extract their important SEO content. Analyze this content and extract the main topics, LSI keywords, and entities. Create a content outline that covers these topics but adds unique value.

Return your response in this exact JSON format:
{
  "competitors": [
    {
      "business_name": "Company Name",
      "main_topics": ["topic1", "topic2", "topic3"],
      "lsi_keywords": ["keyword1", "keyword2", "keyword3"],
      "entities": ["entity1", "entity2", "entity3"]
    }
  ],
  "content_outline": {
    "title": "Suggested article title",
    "sections": [
      {
        "heading": "Section heading",
        "key_points": ["point1", "point2", "point3"],
        "unique_angle": "What makes this section unique"
      }
    ]
  },
  "unique_value_proposition": "How this content will be different and better"
}

Output valid JSON only. No markdown fences. No commentary.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 3000,
        temperature: 0.2,
      }),
    });

    const text = await response.text();
    if (!response.ok) return res.status(response.status).json({ error: "OpenAI error", detail: text });

    const parsed = safeParseJSON(text) || {};
    const content = parsed?.choices?.[0]?.message?.content || "";
    const resultJSON = safeParseJSON(content);
    if (!resultJSON) throw new Error("Invalid JSON from model");

    const id = shaId(resultJSON);
    res.json({ id, result: resultJSON });
  } catch (err) {
    console.error("Content analysis API error:", err);
    res.status(500).json({ error: "Server error", detail: String(err?.message || err) });
  }
});

// --- SEO Article generation (JSON contract) ----------------------------------
app.post("/api/generate-article", async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });

    const { keywords, outline } = req.body || {};
    const keywordList = Array.isArray(keywords) ? keywords.join(", ") : keywords || "";

    const prompt = `Create an SEO-optimized article for the keywords [${keywordList}]. Write as an expert with 10 years of experience. Use a conversational tone. Include personal insights and examples. Structure: Introduction (hook + promise), 5–7 main sections with H2 headings, conclusion with call to action. Word count: 1500 words minimum. Avoid AI buzzwords like "delve," "landscape," "realm," "unleash," "elevate." Include the target keyword naturally 3–5 times. Add 3 relevant FAQs at the end.

${outline ? `Use this content outline as guidance: ${JSON.stringify(outline)}` : ""}

Return your response in this exact JSON format:
{
  "article": {
    "title": "SEO-optimized article title",
    "meta_description": "SEO meta description",
    "content": "Full article content in HTML format with proper H2, H3 tags",
    "word_count": 1500,
    "keyword_density": "2.5%",
    "faqs": [
      { "question": "FAQ question?", "answer": "Detailed answer" }
    ]
  },
  "seo_analysis": {
    "target_keywords_used": 4,
    "readability_score": "Good",
    "content_structure": "Well-structured with proper headings"
  }
}

Output valid JSON only. No markdown fences. No commentary.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4000,
        temperature: 0.25,
      }),
    });

    const text = await response.text();
    if (!response.ok) return res.status(response.status).json({ error: "OpenAI error", detail: text });

    const parsed = safeParseJSON(text) || {};
    const content = parsed?.choices?.[0]?.message?.content || "";
    const resultJSON = safeParseJSON(content);
    if (!resultJSON) throw new Error("Invalid JSON from model");

    const id = shaId(resultJSON);
    res.json({ id, result: resultJSON });
  } catch (err) {
    console.error("Article generation API error:", err);
    res.status(500).json({ error: "Server error", detail: String(err?.message || err) });
  }
});

// --- Lead Generator API (calls Python backend) --------------------------------
app.post("/api/leads", async (req, res) => {
  try {
    const { geo, industry, max_results = 30 } = req.body;

    if (!geo || !industry) {
      return res.status(400).json({ error: "Missing geo or industry" });
    }

    // Call Python FastAPI backend on port 5057
    const pythonApiBase = process.env.PYTHON_API_BASE || "http://localhost:5057";
    const response = await fetch(`${pythonApiBase}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ geo, industry, max_results }),
    });

    const text = await response.text();
    if (!response.ok) {
      console.error("Python API error:", text);
      return res.status(response.status).json({ error: "Lead finder error", detail: text });
    }

    const data = JSON.parse(text);
    res.json(data);
  } catch (err) {
    console.error("Lead API error:", err);
    res.status(500).json({ error: "Server error", detail: String(err?.message || err) });
  }
});

app.post("/api/lead-report", async (req, res) => {
  try {
    const { lead, geo, industry } = req.body;

    if (!lead || !geo || !industry) {
      return res.status(400).json({ error: "Missing lead, geo, or industry" });
    }

    // Call Python FastAPI backend on port 5057
    const pythonApiBase = process.env.PYTHON_API_BASE || "http://localhost:5057";
    const response = await fetch(`${pythonApiBase}/api/lead-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead, geo, industry }),
    });

    const text = await response.text();
    if (!response.ok) {
      console.error("Python API error:", text);
      return res.status(response.status).json({ error: "Report generation error", detail: text });
    }

    const data = JSON.parse(text);
    res.json(data);
  } catch (err) {
    console.error("Report API error:", err);
    res.status(500).json({ error: "Server error", detail: String(err?.message || err) });
  }
});

// --- Batch report proxy (Python API) ----------------------------------------
app.post("/api/batch-report", async (req, res) => {
  try {
    const { leads, geo } = req.body;

    if (!leads || !geo) {
      return res.status(400).json({ error: "Missing leads or geo" });
    }

    // Call Python FastAPI backend on port 5057
    const pythonApiBase = process.env.PYTHON_API_BASE || "http://localhost:5057";
    const response = await fetch(`${pythonApiBase}/api/batch-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leads, geo }),
    });

    const text = await response.text();
    if (!response.ok) {
      console.error("Python API error:", text);
      return res.status(response.status).json({ error: "Batch report generation error", detail: text });
    }

    const data = JSON.parse(text);
    res.json(data);
  } catch (err) {
    console.error("Batch report API error:", err);
    res.status(500).json({ error: "Server error", detail: String(err?.message || err) });
  }
});

// --- Start server ------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

// --- Press Release Generator API (OpenAI) -----------------------------------
app.post("/api/generate-press-release", async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const { company, announcement, style, voice_notes } = req.body || {};
    const chosenStyle = (style || "Journalistic").trim();
    const voiceNotes = (voice_notes || "").trim();

    const prompt = `Create a professional press release for ${company}.

ANNOUNCEMENT:
${announcement}

STYLE: ${chosenStyle}
${voiceNotes ? `VOICE NOTES: ${voiceNotes}` : ""}

Guidelines:
- Start with a compelling headline
- Include a dateline (use today's date)
- Write in third person
- Include 2-3 quotes from company leadership
- Add a boilerplate "About ${company}" section
- Keep it between 300-500 words
- Use professional but engaging language
- Include a call-to-action or contact information

Return ONLY valid JSON in exactly this format:
{
  "press_release": {
    "headline": "Compelling headline",
    "dateline": "CITY, STATE – Month Day, Year",
    "content": "Full press release content",
    "word_count": 350,
    "style": "${chosenStyle}"
  }
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.25,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error: `OpenAI error: ${error}` });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "";
    
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      return res.status(500).json({ error: "Invalid JSON response from OpenAI" });
    }

    if (!parsed || !parsed.press_release) {
      return res.status(500).json({ error: "Invalid response structure from OpenAI" });
    }

    const result = {
      content: parsed.press_release.content,
      headline: parsed.press_release.headline,
      dateline: parsed.press_release.dateline,
      metadata: {
        word_count: parsed.press_release.word_count,
        style: parsed.press_release.style,
      }
    };

    res.json({ result });
  } catch (error) {
    console.error("Press release generation error:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
});
