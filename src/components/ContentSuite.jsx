import { Link } from 'react-router-dom';
import { Zap, FileText, Copy, Download } from 'lucide-react';

export default function ContentSuite() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 text-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-2">Content Generation Suite</h1>
          <p className="text-xl text-white/70">Professional tools for creating SEO content and press releases</p>
        </header>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Keyword Research */}
          <Link to="/keywords" className="group">
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 rounded-2xl p-8 border border-blue-500/30 h-full hover:border-blue-400/60 transition-all hover:shadow-lg hover:shadow-blue-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold">Keyword Research</h2>
              </div>
              <p className="text-white/80 mb-6">Generate SEO-optimized blog articles with customizable tone and style. Perfect for content marketing and organic search optimization.</p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-white/70">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                  8 writing styles (Casual, Formal, Journalistic, etc.)
                </div>
                <div className="flex items-center text-sm text-white/70">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                  Custom voice notes for fine-tuning
                </div>
                <div className="flex items-center text-sm text-white/70">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                  Copy & download functionality
                </div>
              </div>
              
              <div className="inline-block px-4 py-2 bg-blue-500/30 border border-blue-400/50 rounded-lg text-blue-300 font-semibold group-hover:bg-blue-500/40 transition">
                Open Tool →
              </div>
            </div>
          </Link>

          {/* Press Release */}
          <Link to="/press-release" className="group">
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 rounded-2xl p-8 border border-purple-500/30 h-full hover:border-purple-400/60 transition-all hover:shadow-lg hover:shadow-purple-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold">Press Release</h2>
              </div>
              <p className="text-white/80 mb-6">Create professional press releases with customizable tone and voice. Includes headlines, datelines, quotes, and company boilerplate.</p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-white/70">
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                  8 writing styles (Casual, Formal, Journalistic, etc.)
                </div>
                <div className="flex items-center text-sm text-white/70">
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                  Professional formatting with quotes & boilerplate
                </div>
                <div className="flex items-center text-sm text-white/70">
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                  Copy & download functionality
                </div>
              </div>
              
              <div className="inline-block px-4 py-2 bg-purple-500/30 border border-purple-400/50 rounded-lg text-purple-300 font-semibold group-hover:bg-purple-500/40 transition">
                Open Tool →
              </div>
            </div>
          </Link>
        </div>

        {/* Features Section */}
        <div className="bg-white/5 rounded-2xl p-8 border border-white/10 mb-8">
          <h3 className="text-2xl font-bold mb-6">Shared Features</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-2 text-blue-300">🎨 Tone Control</h4>
              <p className="text-white/70 text-sm">Choose from 8 different writing styles or add custom voice notes for precise tone control.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-purple-300">⚡ AI-Powered</h4>
              <p className="text-white/70 text-sm">Powered by OpenAI GPT-4o for high-quality, professional content generation.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-pink-300">📋 Easy Export</h4>
              <p className="text-white/70 text-sm">Copy to clipboard or download as text files for easy integration into your workflow.</p>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
          <h3 className="text-2xl font-bold mb-4">Quick Start</h3>
          <div className="space-y-3 text-white/80">
            <p><span className="font-semibold text-white">1. Choose a tool</span> - Select either Keyword Research or Press Release generator above</p>
            <p><span className="font-semibold text-white">2. Enter your details</span> - Provide the topic/company and announcement information</p>
            <p><span className="font-semibold text-white">3. Select your style</span> - Pick a writing style or add custom voice notes</p>
            <p><span className="font-semibold text-white">4. Generate & export</span> - Click generate and copy or download your content</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-white/50 text-sm">
          <p>Content Generation Suite • Powered by OpenAI GPT-4o</p>
        </footer>
      </div>
    </div>
  );
}
