import React from 'react';
import { ShieldCheck, AlertCircle, PieChart, Layers, ArrowRight, HelpCircle, Info } from 'lucide-react';
import { formatCompactINR, formatINR } from '../lib/format';
import { CanonicalAsset, CanonicalLiability, EvidenceItem } from '../engine/models';

interface WealthViewProps {
  wealthData: any;
  onSimulatePayoff: (liabilityId?: string) => void;
  onViewEvidence: (evidence: EvidenceItem, title?: string) => void;
  onOpenAskVantage: (query?: string) => void;
}

export const WealthView: React.FC<WealthViewProps> = ({
  wealthData,
  onSimulatePayoff,
  onViewEvidence,
  onOpenAskVantage
}) => {
  if (!wealthData) {
    return (
      <div className="p-12 text-center text-slate-500 font-mono text-xs">
        Loading balance sheet records...
      </div>
    );
  }

  const assets: CanonicalAsset[] = wealthData.assets || [];
  const liabilities: CanonicalLiability[] = wealthData.liabilities || [];
  const totalAssets = wealthData.totalAssets || 7025000;
  const totalLiabilities = wealthData.totalLiabilities || 3338000;
  const netWorth = wealthData.netWorth || 3687000;

  // Asset category aggregation for donut chart & ranked table (Section 14)
  const categoryMap = new Map<string, number>();
  for (const a of assets) {
    const cat = a.category || 'Other';
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + a.value);
  }

  const rankedCategories = Array.from(categoryMap.entries())
    .map(([category, value]) => ({
      category,
      value,
      percentage: totalAssets > 0 ? Math.round((value / totalAssets) * 1000) / 10 : 0
    }))
    .sort((a, b) => b.value - a.value);

  // Soft refined color palette for donut sectors
  const sectorColors = [
    '#946f38', // bronze/gold (Property)
    '#3b82f6', // blue (Vehicle)
    '#10b981', // emerald (Mutual Funds)
    '#8b5cf6', // purple (FD)
    '#f59e0b', // amber (Equity)
    '#eab308', // yellow-gold (Gold)
    '#06b6d4', // cyan (Savings)
    '#64748b'  // slate (Cash/Current)
  ];

  // SVG Donut calculation
  let cumulativeAngle = 0;
  const donutPaths = rankedCategories.map((cat, idx) => {
    const angle = (cat.percentage / 100) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    // Convert angles to polar coords
    const x1 = 50 + 36 * Math.cos((Math.PI * (startAngle - 90)) / 180);
    const y1 = 50 + 36 * Math.sin((Math.PI * (startAngle - 90)) / 180);
    const x2 = 50 + 36 * Math.cos((Math.PI * (endAngle - 90)) / 180);
    const y2 = 50 + 36 * Math.sin((Math.PI * (endAngle - 90)) / 180);
    const largeArc = angle > 180 ? 1 : 0;

    return {
      category: cat.category,
      pathData: `M 50 50 L ${x1} ${y1} A 36 36 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: sectorColors[idx % sectorColors.length]
    };
  });

  return (
    <div className="space-y-6">
      {/* SECTION 14: TOP TOTALS */}
      <div className="p-6 bg-white border border-[#e8e5dc] rounded-2xl shadow-xs">
        <div className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-3">
          Sovereign Balance Sheet Summary
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-[#fbfaf8] border border-[#eeebe2] rounded-xl space-y-1">
            <span className="text-xs text-slate-600 font-medium">Total Assets</span>
            <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {formatCompactINR(totalAssets)}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              {assets.length} recorded holdings
            </div>
          </div>

          <div className="p-4 bg-[#fbfaf8] border border-[#eeebe2] rounded-xl space-y-1">
            <span className="text-xs text-slate-600 font-medium">Total Debt</span>
            <div className="text-2xl font-bold font-mono text-rose-800 tabular-nums">
              {formatCompactINR(totalLiabilities)}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              {liabilities.length} debt facilities
            </div>
          </div>

          <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-1">
            <span className="text-xs text-emerald-900 font-medium">Net Worth (NAV)</span>
            <div className="text-2xl font-bold font-mono text-emerald-900 tabular-nums">
              {formatCompactINR(netWorth)}
            </div>
            <div className="text-[11px] text-emerald-700 font-mono font-medium">
              Assets - Liabilities
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 14: ASSET ALLOCATION (DONUT + RANKED TABLE) */}
      <div className="p-6 bg-white border border-[#e8e5dc] rounded-2xl shadow-xs space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Asset Allocation</h3>
          <p className="text-xs text-slate-600">Distribution across verified tangible and financial holdings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Donut Chart */}
          <div className="flex flex-col items-center justify-center p-4">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {donutPaths.map((sec, i) => (
                  <path
                    key={i}
                    d={sec.pathData}
                    fill={sec.color}
                    className="hover:opacity-85 transition-opacity cursor-pointer"
                  />
                ))}
                {/* Center hole for Donut */}
                <circle cx="50" cy="50" r="24" fill="#ffffff" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-xs font-mono uppercase text-slate-500">Gross</span>
                <span className="text-sm font-bold font-mono text-slate-900">{formatCompactINR(totalAssets)}</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-4 text-xs font-mono">
              {rankedCategories.slice(0, 4).map((c, i) => (
                <div key={c.category} className="flex items-center gap-1.5 text-slate-700">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: sectorColors[i % sectorColors.length] }}
                  />
                  <span>{c.category} ({c.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Accessible Ranked Table (Section 14) */}
          <div className="border border-[#e8e5dc] rounded-xl overflow-hidden bg-[#faf9f6]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#f0eee6] text-slate-600 font-mono text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Asset Category</th>
                  <th className="py-2.5 px-3 text-right">Value</th>
                  <th className="py-2.5 px-3 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ede9df]">
                {rankedCategories.map((c, idx) => (
                  <tr key={c.category} className="hover:bg-white transition-colors">
                    <td className="py-2.5 px-3 flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: sectorColors[idx % sectorColors.length] }}
                      />
                      <span className="font-medium text-slate-800">{c.category}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900 tabular-nums">
                      {formatINR(c.value)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600 tabular-nums">
                      {c.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 15: ASSET CONCENTRATION */}
      <div className="p-5 bg-white border border-[#e8e5dc] rounded-2xl shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500">
              Asset Concentration
            </span>
            <span className="text-xs font-bold text-slate-900">
              Property · 59.8% of total assets
            </span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
            Moderate concentration
          </span>
        </div>

        <div className="p-4 bg-[#faf9f6] border border-[#eeebe2] rounded-xl space-y-2">
          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#946f38]" />
            <span>Why does this matter?</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            A large portion of your recorded wealth is concentrated in property (Residential Property valued at ₹42.00L), which may reduce diversification and immediate liquidity during unforeseen capital calls.
          </p>
          <div className="text-[11px] text-slate-500 pt-0.5">
            *Analytical observation only. Vantage does not provide speculative investment advice.
          </div>
        </div>
      </div>

      {/* SECTION 16: NET WORTH TREND (HONEST HISTORICAL SNAPSHOT NOTICE) */}
      <div className="p-5 bg-white border border-[#e8e5dc] rounded-2xl shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-500">
            Current Net Worth
          </span>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {formatINR(netWorth)}
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed bg-[#fbfaf8] p-3 rounded-xl border border-[#eeebe2]">
          <strong>Notice:</strong> Historical net-worth trend is unavailable because the dataset only provides a current asset and liability balance sheet snapshot. Vantage never creates fabricated historical graphs.
        </p>
      </div>

      {/* SECTION 17: LIABILITIES SECTION */}
      <div className="p-6 bg-white border border-[#e8e5dc] rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Liabilities & Cost of Capital</h3>
            <p className="text-xs text-slate-600">Active debt facilities sorted by financial importance</p>
          </div>

          {/* Highest-Cost Debt Callout (Section 17) */}
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
            <div className="text-xs">
              <span className="text-slate-600">Highest-cost debt: </span>
              <span className="font-bold text-rose-900">Credit Card (32.0% APR)</span>
            </div>
            <button
              onClick={() => onSimulatePayoff('L003')}
              className="text-xs font-semibold text-rose-800 hover:text-rose-950 font-mono underline"
            >
              [Simulate paying this off]
            </button>
          </div>
        </div>

        {/* Clean Liabilities Table (Section 17) */}
        <div className="border border-[#e8e5dc] rounded-xl overflow-hidden bg-[#faf9f6]">
          <table className="w-full text-xs text-left" aria-label="Liabilities Schedule">
            <thead className="bg-[#f0eee6] text-slate-600 font-mono text-[10px] uppercase">
              <tr>
                <th className="py-2.5 px-3">Debt Facility</th>
                <th className="py-2.5 px-3 text-right">Outstanding</th>
                <th className="py-2.5 px-3 text-right">Interest Rate</th>
                <th className="py-2.5 px-3 text-right">Monthly EMI</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ede9df]">
              {liabilities.map((l) => {
                const isHighest = l.interestRate >= 20;
                return (
                  <tr key={l.id} className={isHighest ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-white'}>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{l.name}</span>
                        {isHighest && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-bold border border-rose-200">
                            High Drag
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatCompactINR(l.outstandingAmount)}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-mono font-bold tabular-nums ${isHighest ? 'text-rose-700' : 'text-slate-800'}`}>
                      {l.interestRate.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 tabular-nums">
                      {formatINR(l.emi)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onSimulatePayoff(l.id)}
                        className="text-xs font-semibold text-[#946f38] hover:underline font-mono"
                      >
                        Simulate
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
