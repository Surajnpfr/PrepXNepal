import React, { useState } from 'react';
import { Sparkles, X, ArrowRight } from 'lucide-react';

interface AnnouncementBarProps {
  onUpgradeClick: () => void;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ onUpgradeClick }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="mx-3 sm:mx-6 my-2 font-sans">
      <div className="max-w-7xl mx-auto bg-blue-50/90 border border-blue-200/80 backdrop-blur-md rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 shadow-2xs text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-medium">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
          </span>
          <span>CEE 2026 timed mocks are now available.</span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={onUpgradeClick}
            className="text-[#2563EB] hover:text-blue-800 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View Mocks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};


