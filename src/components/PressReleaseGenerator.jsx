import { useState } from 'react';
import { Newspaper, Home, Copy, Download, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PressReleaseGenerator() {
  const [company, setCompany] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [style, setStyle] = useState('Journalistic');
  const [voiceNotes, setVoiceNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const styles = [
    'Casual',
    'Formal',
    'Journalistic',
    'Expert/Authoritative',
    'Technical',
    'Storytelling',
    'Persuasive/Direct-Response',
    'Playful/Witty'
  ];

  const handleGenerate = async () => {
    setError('');
    setResult(null);

    if (!company.trim()) {
      setError('Company name is required.');
      return;
    }
    if (!announcement.trim()) {
      setError('Announcement details are required.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/generate-press-release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: company.trim(),
          announcement: announcement.trim(),
          style,
          voice_notes: voiceNotes.trim()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to generate press release');
      }

      const data = await response.json();
      setResult(data.result);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.content) {
      navigator.clipboard.writeText(result.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (result?.content) {
      const blob = new Blob([result.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `press_release_${company.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 text-white">
      <div className="max-w-5xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 mb-6 text-purple-300 hover:text-purple-200 font-semibold">
          <Home className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Newspaper className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold">Press Release Generator</h1>
          </div>
          <p className="text-white/70">Create professional press releases with customizable tone and voice.</p>
        </div>

        {/* Controls */}
        <div className="bg-white/10 rounded-xl p-6 border border-white/20 mb-6">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-semibold mb-2">Company Name</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g., Acme Corporation"
                className="w-full p-3 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Press Release Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full p-3 rounded bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-400"
              >
                {styles.map((s) => (
                  <option key={s} value={s} className="bg-slate-900">
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-2">Announcement Details</label>
            <textarea
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              rows="4"
              placeholder="Describe the announcement, product launch, partnership, etc."
              className="w-full p-3 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
            />
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-2">Voice Notes (optional)</label>
            <textarea
              value={voiceNotes}
              onChange={(e) => setVoiceNotes(e.target.value)}
              rows="2"
              placeholder="e.g., Professional but approachable. Emphasize innovation."
              className="w-full p-3 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-purple-500 hover:bg-purple-600 disabled:bg-purple-700 text-white px-6 py-2 rounded font-semibold transition"
          >
            {loading ? 'Generating...' : 'Generate Press Release'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="bg-white/10 rounded-xl p-6 border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Generated Press Release</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 transition"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleDownload}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>

            <div className="bg-black/30 rounded-lg p-4 max-h-96 overflow-y-auto mb-4">
              <p className="text-gray-200 text-sm whitespace-pre-wrap font-mono">{result.content}</p>
            </div>

            <div className="text-sm text-gray-300">
              <p><strong>Word Count:</strong> {result.metadata?.word_count || '—'}</p>
              <p><strong>Style:</strong> {result.metadata?.style || '—'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
