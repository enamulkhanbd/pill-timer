import React from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';

interface SetupBannerProps {
  onDismiss?: () => void;
}

export const SetupBanner: React.FC<SetupBannerProps> = ({ onDismiss }) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-500 to-red-600 text-white shadow-2xl animate-slideDown">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          
          <div className="flex-1">
            <h3 className="font-semibold mb-2">⚠️ Database Setup Required</h3>
            <p className="text-red-50 mb-3">
              Your database tables haven't been created yet. Please run the SQL script in your Supabase Dashboard.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <a
                href="/STEP_1_SQL.sql"
                download
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
              >
                📄 Download SQL Script
              </a>
              
              <a
                href="https://supabase.com/dashboard/project/rcnyrwziftitsalkxtrr/sql/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
              >
                🚀 Open Supabase SQL Editor
                <ExternalLink className="w-4 h-4" />
              </a>
              
              <a
                href="/SETUP_INSTRUCTIONS.md"
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors text-sm"
              >
                📖 View Setup Guide
              </a>
            </div>
            
            <div className="mt-3 p-3 bg-red-700/50 rounded-lg text-sm">
              <p className="font-semibold mb-1">Quick Steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-red-50">
                <li>Download the SQL script above</li>
                <li>Open the Supabase SQL Editor (link above)</li>
                <li>Paste and run the SQL script</li>
                <li>Refresh this page</li>
              </ol>
            </div>
          </div>
          
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 p-1 hover:bg-red-700 rounded transition-colors"
              title="Dismiss"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
