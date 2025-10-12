import { Newspaper, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PressReleaseGenerator() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 mb-6 text-blue-600 hover:text-blue-800 font-semibold">
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
        
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Newspaper className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Press Release Generator
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            AEO-optimized press releases for announcements
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Coming Soon</h2>
          <p className="text-gray-600">
            This tool will generate professional, AEO-optimized press releases.
          </p>
        </div>
      </div>
    </div>
  );
}