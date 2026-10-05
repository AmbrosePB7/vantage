import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { EvidenceItem } from '../engine/models';

interface ScoreBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  overview: any;
  onViewEvidence: (evidence: EvidenceItem, title?: string) => void;
}

export const ScoreBreakdownModal: React.FC<ScoreBreakdownModalProps> = ({
  isOpen,
  onClose,
  overview,
  onViewEvidence
}) => {
  const [showMethodology, setShowMethodology] = useState(false);

  if (!isOpen || !overview) return null;

  const score = overview.financialHealthScore || 78;
  const grade = overview.healthGrade || 'Good';
  const components = overview.scoreComponents || {};

  // Standardized dimensions to match Section 21 & 23
  const dimensions = [
    {
      name: 'Cash Flow Strength',
      score: Math.min(25, Math.round(((components.cashFlowStrength?.score || 85) / 100) * 25)),
      max: 25,
      weight: '25%',
      pct: components.cashFlowStrength?.score || 85,
      desc: 'Free cash flow surplus over living needs'
    },
    {
      name: 'Debt Risk Profile',
      score: Math.min(20, Math.round(((components.debtRisk?.score || 65) / 100) * 20)),
      max: 20,
      weight: '20%',
      pct: components.debtRisk?.score || 65,
      desc: 'Debt-to-assets ratio and interest drag'
    },
    {
      name: 'Liquidity Resilience',
      score: Math.min(20, Math.round(((components.liquidityResilience?.score || 90) / 100) * 20)),
      max: 20,
      weight: '20%',
      pct: components.liquidityResilience?.score || 90,
      desc: 'Months of living obligations covered'
    },
    {
      name: 'Wealth Growth Commitment',
      score: Math.min(15, Math.round(((components.wealthGrowth?.score || 80) / 100) * 15)),
      max: 15,
      weight: '15%',
      pct: components.wealthGrowth?.score || 80,
      desc: 'Regular systematic SIP & equity investments'
    },
    {
      name: 'Asset Concentration',
      score: Math.min(10, Math.round(((components.wealthConcentration?.score || 60) / 100) * 10)),
      max: 10,
      weight: '10%',
      pct: components.wealthConcentration?.score || 60,
      desc: 'Portfolio balance across asset types'
    },
    {
      name: 'Behavioral Stability',
      score: Math.min(10, Math.round(((components.behavioralStability?.score || 80) / 100) * 10)),
      max: 10,
      weight: '10%',
      pct: components.behavioralStability?.score || 80,
      desc: 'Consistent spending run-rate and outlier control'
    }
  ];

  const handleHoldingBackClick = (itemTitle: string) => {
    onViewEvidence({
      claim: itemTitle,
      metric: 'High-cost revolving debt (Credit Card · 32% APR)',
      value: '₹68,000 balance at 32.0% APR',
      calculation: 'Balance × 32% APR = ~₹21,760 annual interest charge',
      confidence: 100,
      sourceRecords: [
        { type: 'liability', id: 'L003', details: 'Credit Card carrying ₹68,000 outstanding at 32% APR' }
      ]
    }, itemTitle);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="score-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px] animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-2xl bg-white border border-[#e5e3dc] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0eee6] bg-[#faf9f6]">
          <div className="flex items-center gap-3">
            <span className="text-[#946f38] text-base font-mono">◆</span>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Analytical Framework
              </div>
              <h3 id="score-modal-title" className="text-base font-bold text-slate-900">
                Vantage Financial Health Score
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Health Score Breakdown"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-[#edebe4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Hero Score Display */}
          <div className="p-5 bg-[#faf9f6] border border-[#e8e5dc] rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-500">
                Composite Score
              </div>
              <div className="flex items-baseline gap-2.5">
                <span className="text-4xl font-extrabold font-mono text-slate-900 tabular-nums">
                  {score}
                </span>
                <span className="text-sm font-mono text-slate-500">/ 100</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {typeof grade === 'string' && grade.length === 1 ? `Grade ${grade} · Good` : grade}
                </span>
              </div>
              <div className="text-xs text-emerald-700 font-mono font-medium pt-0.5">
                ↑ +4 vs previous period
              </div>
            </div>

            <div className="text-right text-xs text-slate-600 max-w-[280px] leading-relaxed hidden sm:block">
              Your financial position is healthy overall, with debt cost and asset concentration being the main areas to watch.
            </div>
          </div>

          {/* Horizontal Breakdown Bars (Section 21) */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-900">
              <span>Component Breakdown (Weighted)</span>
              <span className="text-[11px] font-mono text-slate-500">Target: 100</span>
            </div>

            <div className="space-y-2.5">
              {dimensions.map((dim) => (
                <div key={dim.name} className="p-2.5 bg-white border border-[#eeebe2] rounded-lg space-y-1.5">
                  <div className="flex justify-between text-xs items-center">
                    <span className="font-medium text-slate-800">{dim.name}</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {dim.score} <span className="text-slate-400 font-normal">/ {dim.max}</span>
                    </span>
                  </div>
                  <div className="w-full bg-[#f0eee6] h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${(dim.score / dim.max) * 100}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        (dim.score / dim.max) >= 0.8
                          ? 'bg-emerald-600'
                          : (dim.score / dim.max) >= 0.6
                          ? 'bg-[#946f38]'
                          : 'bg-amber-600'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>{dim.desc}</span>
                    <span>Weight: {dim.weight}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 22: Helping Your Score & Holding Your Score Back */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Helping */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-2">
              <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Helping your score</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-1.5 pt-1">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Positive operational cash flow (+₹52.0K/mo)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Meaningful liquid buffer (₹8.60L reserves)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Ongoing systematic wealth-building activity</span>
                </li>
              </ul>
            </div>

            {/* Holding Back */}
            <div className="p-4 bg-rose-50/60 border border-rose-200/80 rounded-xl space-y-2">
              <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Holding your score back</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-1.5 pt-1">
                <li>
                  <button
                    onClick={() => handleHoldingBackClick('High-cost debt liability')}
                    className="flex items-start gap-1.5 text-left hover:text-rose-800 group transition-colors w-full"
                  >
                    <span className="text-rose-600 font-bold">!</span>
                    <span className="group-hover:underline font-medium">High-cost debt (Credit Card · 32% APR)</span>
                    <ArrowRight className="w-3 h-3 text-rose-400 opacity-0 group-hover:opacity-100 ml-auto transition-opacity" />
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleHoldingBackClick('Asset concentration')}
                    className="flex items-start gap-1.5 text-left hover:text-rose-800 group transition-colors w-full"
                  >
                    <span className="text-rose-600 font-bold">!</span>
                    <span className="group-hover:underline font-medium">Asset concentration (59.8% in Property)</span>
                    <ArrowRight className="w-3 h-3 text-rose-400 opacity-0 group-hover:opacity-100 ml-auto transition-opacity" />
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleHoldingBackClick('Spending volatility & utility outlier')}
                    className="flex items-start gap-1.5 text-left hover:text-rose-800 group transition-colors w-full"
                  >
                    <span className="text-rose-600 font-bold">!</span>
                    <span className="group-hover:underline font-medium">Spending volatility & ledger outlier</span>
                    <ArrowRight className="w-3 h-3 text-rose-400 opacity-0 group-hover:opacity-100 ml-auto transition-opacity" />
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Section 23: Score Methodology Drawer */}
          <div className="border border-[#e8e5dc] rounded-xl overflow-hidden bg-[#faf9f6]">
            <button
              onClick={() => setShowMethodology(!showMethodology)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-800 hover:bg-[#f4f2ea] transition-colors"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#946f38]" />
                <span>How is the Vantage Health Score calculated?</span>
              </div>
              {showMethodology ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showMethodology && (
              <div className="p-4 pt-1 border-t border-[#f0eee6] space-y-3 text-xs text-slate-600 bg-white">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 font-mono text-[11px]">
                  <div className="p-2 bg-[#fbfaf8] rounded border border-[#eeebe2]">
                    <span className="text-slate-500">Cash Flow:</span> <span className="font-bold text-slate-900">25%</span>
                  </div>
                  <div className="p-2 bg-[#fbfaf8] rounded border border-[#eeebe2]">
                    <span className="text-slate-500">Debt Risk:</span> <span className="font-bold text-slate-900">20%</span>
                  </div>
                  <div className="p-2 bg-[#fbfaf8] rounded border border-[#eeebe2]">
                    <span className="text-slate-500">Liquidity:</span> <span className="font-bold text-slate-900">20%</span>
                  </div>
                  <div className="p-2 bg-[#fbfaf8] rounded border border-[#eeebe2]">
                    <span className="text-slate-500">Wealth Growth:</span> <span className="font-bold text-slate-900">15%</span>
                  </div>
                  <div className="p-2 bg-[#fbfaf8] rounded border border-[#eeebe2]">
                    <span className="text-slate-500">Concentration:</span> <span className="font-bold text-slate-900">10%</span>
                  </div>
                  <div className="p-2 bg-[#fbfaf8] rounded border border-[#eeebe2]">
                    <span className="text-slate-500">Stability:</span> <span className="font-bold text-slate-900">10%</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed italic pt-1">
                  Vantage Health Score is an analytical framework created for this application. It is not an industry-standard financial credit score.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#faf9f6] border-t border-[#f0eee6] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
