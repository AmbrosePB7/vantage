import React from 'react';
import {
  LayoutDashboard,
  Landmark,
  ArrowLeftRight,
  ShieldAlert,
  Sliders,
  Sparkles,
  SlidersHorizontal,
  Settings,
  Eye,
  CheckCircle2
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAskVantage: () => void;
  onOpenDataConfidence: () => void;
  onOpenAccessibility: () => void;
  confidenceScore: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAskVantage,
  onOpenDataConfidence,
  onOpenAccessibility,
  confidenceScore = 91
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'wealth', label: 'My Wealth', icon: Landmark },
    { id: 'cashflow', label: 'Cash Flow', icon: ArrowLeftRight },
    { id: 'risk', label: 'Risk', icon: ShieldAlert },
    { id: 'decisions', label: 'Decisions', icon: Sliders },
    { id: 'ask', label: 'Ask Vantage', icon: Sparkles }
  ];

  const handleNavClick = (id: string) => {
    if (id === 'ask') {
      onOpenAskVantage();
    } else {
      setActiveTab(id);
    }
  };

  return (
    <aside className="w-64 bg-[#fbfaf8] border-r border-[#e8e5dc] flex flex-col justify-between shrink-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-6 flex items-center border-b border-[#f0eee6]">
          <div className="flex items-center gap-2.5">
            <span className="text-[#946f38] text-base font-mono">◆</span>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-slate-900 leading-tight">
                VANTAGE
              </span>
              <span className="text-[9px] font-mono tracking-wider text-slate-600 uppercase">
                Financial Intelligence
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm border border-[#e8e5dc]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-[#f3f1ea]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-[#946f38]' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span>{item.label}</span>
                {item.id === 'ask' && (
                  <span className="ml-auto text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Utilities (Section 2) */}
      <div className="p-3 border-t border-[#f0eee6] space-y-1.5">
        {/* Data Confidence Indicator */}
        <button
          onClick={onOpenDataConfidence}
          className="w-full flex items-center justify-between p-2.5 bg-white hover:bg-[#faf9f6] border border-[#e8e5dc] rounded-xl text-left transition-colors text-xs group"
        >
          <div className="space-y-0.5">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Audit Status</div>
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Data Confidence</span>
            </div>
          </div>
          <span className="font-mono font-bold text-slate-900 text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
            {confidenceScore}%
          </span>
        </button>

        {/* Accessibility Button */}
        <button
          onClick={onOpenAccessibility}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-[#f3f1ea] rounded-xl text-xs font-medium transition-colors"
        >
          <Eye className="w-3.5 h-3.5 text-slate-400" />
          <span>Accessibility</span>
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenDataConfidence}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-[#f3f1ea] rounded-xl text-xs font-medium transition-colors"
        >
          <Settings className="w-3.5 h-3.5 text-slate-400" />
          <span>Settings & Ledger</span>
        </button>
      </div>
    </aside>
  );
};
