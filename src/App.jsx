import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Shield, TrendingUp, Newspaper, Search, Home, Users } from 'lucide-react';
import SecurityScanner from './components/SecurityScanner';
import SeoAeoAudit from './components/SeoAeoAudit';
import PressReleaseGenerator from './components/PressReleaseGenerator';
import KeywordGenerator from './components/KeywordGenerator';
import LeadGenerator from './components/LeadGenerator';
import PasswordGate from './components/PasswordGate';

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-6">
            C&L Page
          </h1>
          <p className="text-xl text-gray-300 mb-4">
            by C&L Strategy
          </p>
          <p className="text-lg text-gray-400 mb-12">
            Professional audit and content generation tools
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Link
            to="/security"
            className="group bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105"
          >
            <Shield className="w-16 h-16 text-red-400 mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Cybersecurity Audit
            </h2>
            <p className="text-gray-300 mb-6">
              OWASP Top 10 compliance, security headers, vulnerability scanning
            </p>
            <div className="text-red-400 group-hover:text-red-300 font-semibold">
              Launch Tool →
            </div>
          </Link>

          <Link
            to="/seo-aeo"
            className="group bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105"
          >
            <TrendingUp className="w-16 h-16 text-purple-400 mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">
              SEO/AEO Audit
            </h2>
            <p className="text-gray-300 mb-6">
              Technical SEO, answer engine optimization, content gap analysis
            </p>
            <div className="text-purple-400 group-hover:text-purple-300 font-semibold">
              Launch Tool →
            </div>
          </Link>

          <Link
            to="/press-release"
            className="group bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105"
          >
            <Newspaper className="w-16 h-16 text-blue-400 mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Press Release Generator
            </h2>
            <p className="text-gray-300 mb-6">
              AEO-optimized press releases for announcements and authority building
            </p>
            <div className="text-blue-400 group-hover:text-blue-300 font-semibold">
              Launch Tool →
            </div>
          </Link>

          <Link
            to="/keywords"
            className="group bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105"
          >
            <Search className="w-16 h-16 text-green-400 mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Keyword Research
            </h2>
            <p className="text-gray-300 mb-6">
              Clusters, long-tails, questions, targets, schema, content calendar
            </p>
            <div className="text-green-400 group-hover:text-green-300 font-semibold">
              Launch Tool →
            </div>
          </Link>

          <Link
            to="/leads"
            className="group bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105"
          >
            <Users className="w-16 h-16 text-orange-400 mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Lead Generator
            </h2>
            <p className="text-gray-300 mb-6">
              Find and score business leads, manual and automated runs
            </p>
            <div className="text-orange-400 group-hover:text-orange-300 font-semibold">
              Launch Tool →
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated in this session
    const authenticated = sessionStorage.getItem('clpage_authenticated');
    if (authenticated === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return <PasswordGate onAuthenticate={() => setIsAuthenticated(true)} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/security" element={<SecurityScanner />} />
        <Route path="/seo-aeo" element={<SeoAeoAudit />} />
        <Route path="/press-release" element={<PressReleaseGenerator />} />
        <Route path="/keywords" element={<KeywordGenerator />} />
        <Route path="/leads" element={<LeadGenerator />} />
      </Routes>
    </Router>
  );
}

export default App;