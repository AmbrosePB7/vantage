import React, { useState } from 'react';
import { Search, Eye, User, Calendar, Volume2, VolumeX, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onOpenAccessibility: () => void;
  onOpenAskVantage: () => void;
  onPlayAudioBrief: () => void;
  isAudioPlaying: boolean;
  snapshotDate?: string;
  onSearchChange: (query: string) => void;
  searchQuery: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenAccessibility,
  onOpenAskVantage,
  onPlayAudioBrief,
  isAudioPlaying,
  snapshotDate = '01 Oct 2026',
  onSearchChange,
  searchQuery
}) => {
  const [showSearchInput, setShowSearchInput] = useState(false);

  // Dynamic greeting/title based on active page
  const getGreeting = () => {
    switch (activeTab) {
      case 'overview':
        return "Good afternoon, here's your financial brief.";
      case 'wealth':
        return 'Where is my wealth? Asset & Liability Balance Sheet';
      case 'cashflow':
        return 'Cash Flow Dynamics & Capital Disposition';
      case 'risk':
        return 'Vulnerability & Capital Risk Exposure';
      case 'decisions':
        return 'Decision Simulator — Test capital moves before executing';
      default:
        return "Good afternoon, here's your financial brief.";
    }
  };

  return (
    <header className="h-16 px-6 bg-[#fbfaf8] border-b border-[#e8e5dc] flex items-center justify-between sticky top-0 z-30">
      {/* Left: Page Title / Greeting (Section 3) */}
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
          {getGreeting()}
        </h2>
      </div>

      {/* Right Controls (Section 3) */}
      <div className="flex items-center gap-2.5">
        {/* Search */}
        <div className="relative">
          {showSearchInput ? (
            <div className="flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search ledger, merchant..."
                autoFocus
                onBlur={() => {
                  if (!searchQuery) setShowSearchInput(false);
                }}
                className="w-48 sm:w-60 bg-white border border-[#e5e3dc] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#946f38]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          ) : (
            <button
              onClick={() => setShowSearchInput(true)}
              aria-label="Search financial records"
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-[#f3f1ea] rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline text-slate-600">Search</span>
            </button>
          )}
        </div>

        {/* Snapshot Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#e8e5dc] rounded-lg text-slate-600 text-xs font-mono">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Snapshot: {snapshotDate}</span>
        </div>

        {/* Audio Brief Toggle */}
        <button
          onClick={onPlayAudioBrief}
          title="Play executive audio brief"
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
            isAudioPlaying
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-white border-[#e8e5dc] text-slate-700 hover:bg-[#f3f1ea]'
          }`}
        >
          {isAudioPlaying ? (
            <>
              <VolumeX className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span className="hidden sm:inline">Pause</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 text-[#946f38]" />
              <span className="hidden sm:inline">Audio</span>
            </>
          )}
        </button>

        {/* Accessibility control */}
        <button
          onClick={onOpenAccessibility}
          title="Accessibility preferences"
          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-[#f3f1ea] rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4 text-slate-500" />
        </button>

        {/* Profile / Client Indicator */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#e8e5dc]">
          <div className="w-7 h-7 rounded-full bg-[#f0eee6] border border-[#e5e3dc] flex items-center justify-center text-[#785b28] text-xs font-bold font-mono">
            PB
          </div>
          <span className="hidden lg:inline text-xs font-semibold text-slate-800">
            Parth B.
          </span>
        </div>
      </div>
    </header>
  );
};
