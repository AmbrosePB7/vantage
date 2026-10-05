import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Info,
  ShieldCheck,
  CheckCircle,
  Flame,
  Volume2,
  VolumeX,
  Sparkles,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { formatCompactINR, formatINR } from '../lib/format';
import { EvidenceItem } from '../engine/models';
import { KpiDetailData } from './KpiDetailModal';

interface OverviewViewProps {
  overview: any;
  cashFlowData: any;
  onOpenScoreBreakdown: () => void;
  onOpenKpiDetail: (kpi: KpiDetailData) => void;
  onViewEvidence: (evidence: EvidenceItem, title?: string) => void;
  onSimulateDecision: (scenarioType?: string) => void;
  onOpenAskVantage: (initialQuery?: string) => void;
  onPlayAudioBrief: () => void;
  isAudioPlaying: boolean;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  overview,
  cashFlowData,
  onOpenScoreBreakdown,
  onOpenKpiDetail,
  onViewEvidence,
  onSimulateDecision,
  onOpenAskVantage,
  onPlayAudioBrief,
  isAudioPlaying
}) => {
  // Toggle states for the 6-month cash flow trend chart (Section 10)
  const [showIncome, setShowIncome] = useState(true);
  const [showConsumption, setShowConsumption] = useState(true);
  const [showDebt, setShowDebt] = useState(true);
  const [showWealthBuilding, setShowWealthBuilding] = useState(false);

  if (!overview) {
    return (
      <div className="p-12 text-center text-slate-500 font-mono text-xs">
        Synthesizing portfolio intelligence...
      </div>
    );
  }

  const score = overview.financialHealthScore || 78;
  const grade = overview.healthGrade || 'Good';
  const monthlyHistory = cashFlowData?.monthlyHistory || [];

  // Recent 6 months for the Cash Flow Trend chart (Section 10)
  const recent6Months = monthlyHistory.slice(-6);

  // Maximum value for scaling SVG chart
  const maxVal = Math.max(
    ...recent6Months.map((m: any) =>
      Math.max(
        showIncome ? m.income : 0,
        showConsumption ? m.consumption : 0,
        showDebt ? m.debtService : 0,
        showWealthBuilding ? m.wealthBuilding : 0
      )
    ),
    200000
  );

  // KPI Data definitions for info icons (Section 6)
  const kpiDetails: Record<string, KpiDetailData> = {
    netWorth: {
      title: 'Net Worth (Net Asset Value)',
      value: formatCompactINR(overview.netWorth),
      trend: '↑ 4.2% vs previous period',
      definition: 'The sovereign net value of all recorded financial assets minus all outstanding debt liabilities.',
      calculation: `Total Assets (${formatCompactINR(overview.totalAssets)}) - Total Liabilities (${formatCompactINR(overview.totalLiabilities)}) = ${formatINR(overview.netWorth)}`,
      source: 'assets.csv and liabilities.csv snapshots',
      assumptions: 'Asset valuations reflect the snapshot date. No debt obligations outside the recorded liabilities ledger.'
    },
    liquidAssets: {
      title: 'Liquid Assets & Coverage',
      value: formatCompactINR(overview.liquidAssets),
      trend: '~18.4 months scheduled EMI coverage*',
      definition: 'Immediately accessible cash balances including savings accounts, current accounts, and short-term fixed deposits.',
      calculation: `Liquid Reserves (${formatINR(overview.liquidAssets)}) ÷ Scheduled Monthly EMI Obligations (₹46,700/mo) = ~18.4 months coverage`,
      source: 'Liquid cash & bank accounts in assets.csv',
      assumptions: '*Coverage against scheduled loan EMIs only. Routine living operational expenses are not included in this ratio.'
    },
    monthlyFcf: {
      title: 'Monthly Free Cash Flow (FCF)',
      value: formatINR(overview.monthlyFreeCashFlow),
      trend: '↑ 8.1% vs previous period',
      definition: "Vantage's analytical definition of cash surplus retained after deducting core living consumption and scheduled debt service from regular monthly inflows.",
      calculation: `Monthly Inflow (${formatINR(overview.monthlyIncome)}) - Consumption (${formatINR(overview.monthlyConsumption)}) - Debt Service (${formatINR(overview.monthlyDebtService)}) = +${formatINR(overview.monthlyFreeCashFlow)}/mo`,
      source: 'Validated historical income and expense transactions',
      assumptions: 'Systematic investment contributions (SIPs) are treated as wealth creation, not living consumption.'
    },
    totalDebt: {
      title: 'Total Debt Liabilities',
      value: formatCompactINR(overview.totalLiabilities),
      trend: '↓ 2.3% amortizing run-rate',
      definition: 'Total outstanding principal balances owed across all mortgages, auto loans, and revolving credit card facilities.',
      calculation: 'Sum of all outstanding principal amounts recorded in liabilities.csv',
      source: 'liabilities.csv schedule',
      assumptions: 'Includes amortizing term loans and revolving credit lines as of the snapshot date.'
    }
  };

  // What Changed rows (Section 9)
  const whatChangedItems = [
    { label: 'Income', change: '↑ 8.2%', current: '₹2.73L', prev: '₹2.52L', type: 'positive' },
    { label: 'Consumption', change: '↑ 12.5%', current: '₹1.74L', prev: '₹1.55L', type: 'neutral' },
    { label: 'Debt service', change: '→ Stable', current: '₹46.7K', prev: '₹46.7K', type: 'neutral' },
    { label: 'Wealth building', change: '↑ 15.4%', current: '₹35.0K', prev: '₹30.3K', type: 'positive' },
    { label: 'Travel spending', change: '↑ 176.5%', current: '₹1.23L', prev: '₹44.5K', type: 'negative' }
  ];

  return (
    <div className="space-y-6">
      {/* SECTION 5: HERO AREA — FINANCIAL HEALTH SCORE & BRIEF */}
      <div className="p-6 bg-white border border-[#e8e5dc] rounded-2xl shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Health Score Component */}
          <button
            onClick={onOpenScoreBreakdown}
            className="flex items-center gap-5 text-left group hover:opacity-95 transition-opacity"
            title="Click to view detailed health score breakdown"
          >
            {/* Compact Circular Score Ring (Section 5) */}
            <div className="relative flex items-center justify-center w-24 h-24 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-[#f0eee6]"
                  strokeWidth="7"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-[#946f38] transition-all duration-1000 ease-out"
                  strokeWidth="7"
                  strokeDasharray="251"
                  strokeDashoffset={251 - (251 * score) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                  {score}
                </span>
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  / 100
                </span>
              </div>
            </div>

            {/* Score interpretation */}
            <div className="space-y-1">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-500">
                Your Financial Health
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900">{score} / 100</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {grade}
                </span>
              </div>
              <p className="text-xs text-slate-600 max-w-md leading-relaxed">
                Your financial position is healthy overall, with debt cost and asset concentration being the main areas to watch.
              </p>
              <div className="text-xs font-mono font-medium text-emerald-700 flex items-center gap-1.5 pt-0.5">
                <span>↑ +4 vs previous period</span>
                <span className="text-slate-400">·</span>
                <span className="text-[#946f38] group-hover:underline">View score breakdown →</span>
              </div>
            </div>
          </button>

          {/* Section 35: Financial Brief Box */}
          <div className="p-4 bg-[#faf9f6] border border-[#eeebe2] rounded-xl lg:max-w-md space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span className="text-[#946f38]">◆</span>
                <span>Your Financial Brief</span>
              </div>
              <button
                onClick={onPlayAudioBrief}
                className="text-[11px] font-mono font-semibold text-[#946f38] hover:text-[#7d5d2e] flex items-center gap-1"
              >
                {isAudioPlaying ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
                    <span>Pause brief</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Listen to brief</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Overall, your financial position is healthy. Cash flow remains positive and your asset base is substantial. The main areas to watch are high-cost debt and asset concentration. Your next best action is to review the highest-interest liability.
            </p>
          </div>
        </div>

        {/* SECTION 6 & 7: PRIMARY KPI ROW (STRICTLY 4 INDICATORS) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-3 border-t border-[#f0eee6]">
          {/* Net Worth */}
          <div className="p-3.5 bg-[#fbfaf8] border border-[#eeebe2] rounded-xl relative group hover:border-[#ded9cb] transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Net Worth</span>
              <button
                onClick={() => onOpenKpiDetail(kpiDetails.netWorth)}
                aria-label="Net worth definition and calculation"
                className="text-slate-400 hover:text-slate-700"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 tabular-nums mt-1">
              {formatCompactINR(overview.netWorth)}
            </div>
            <div className="text-[11px] font-mono text-emerald-700 font-medium mt-0.5">
              ↑ 4.2% <span className="text-slate-500 font-normal">vs prev</span>
            </div>
          </div>

          {/* Liquid Assets */}
          <div className="p-3.5 bg-[#fbfaf8] border border-[#eeebe2] rounded-xl relative group hover:border-[#ded9cb] transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Liquid Assets</span>
              <button
                onClick={() => onOpenKpiDetail(kpiDetails.liquidAssets)}
                aria-label="Liquid assets definition and calculation"
                className="text-slate-400 hover:text-slate-700"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 tabular-nums mt-1">
              {formatCompactINR(overview.liquidAssets)}
            </div>
            <div className="text-[11px] font-mono text-slate-600 font-medium mt-0.5">
              18.4 mo* <span className="text-slate-500 font-normal">EMI cover</span>
            </div>
          </div>

          {/* Monthly FCF */}
          <div className="p-3.5 bg-[#fbfaf8] border border-[#eeebe2] rounded-xl relative group hover:border-[#ded9cb] transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Monthly FCF</span>
              <button
                onClick={() => onOpenKpiDetail(kpiDetails.monthlyFcf)}
                aria-label="Free cash flow definition and calculation"
                className="text-slate-400 hover:text-slate-700"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 tabular-nums mt-1">
              {formatCompactINR(overview.monthlyFreeCashFlow)}
            </div>
            <div className="text-[11px] font-mono text-emerald-700 font-medium mt-0.5">
              ↑ 8.1% <span className="text-slate-500 font-normal">surplus</span>
            </div>
          </div>

          {/* Total Debt */}
          <div className="p-3.5 bg-[#fbfaf8] border border-[#eeebe2] rounded-xl relative group hover:border-[#ded9cb] transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Total Debt</span>
              <button
                onClick={() => onOpenKpiDetail(kpiDetails.totalDebt)}
                aria-label="Total debt definition and calculation"
                className="text-slate-400 hover:text-slate-700"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 tabular-nums mt-1">
              {formatCompactINR(overview.totalLiabilities)}
            </div>
            <div className="text-[11px] font-mono text-slate-600 font-medium mt-0.5">
              ↓ 2.3% <span className="text-slate-500 font-normal">amortized</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 8: MAIN HERO SECTION — TWO COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: WHAT CHANGED & CASH FLOW TREND */}
        <div className="space-y-6">
          {/* Section 10: Cash Flow Trend Chart */}
          <div className="p-5 bg-white border border-[#e8e5dc] rounded-2xl shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500">
                  Cash Flow Trend (6 Months)
                </h3>
                <div className="text-xs text-slate-600">
                  Is cash generation improving or deteriorating?
                </div>
              </div>

              {/* Toggles (Section 10) */}
              <div className="flex flex-wrap gap-1 text-[11px] font-mono">
                <button
                  onClick={() => setShowIncome(!showIncome)}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    showIncome
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                      : 'bg-white text-slate-400 border-[#e8e5dc]'
                  }`}
                >
                  Income
                </button>
                <button
                  onClick={() => setShowConsumption(!showConsumption)}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    showConsumption
                      ? 'bg-slate-100 text-slate-800 border-slate-300 font-semibold'
                      : 'bg-white text-slate-400 border-[#e8e5dc]'
                  }`}
                >
                  Consumption
                </button>
                <button
                  onClick={() => setShowDebt(!showDebt)}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    showDebt
                      ? 'bg-rose-50 text-rose-800 border-rose-300 font-semibold'
                      : 'bg-white text-slate-400 border-[#e8e5dc]'
                  }`}
                >
                  Debt
                </button>
                <button
                  onClick={() => setShowWealthBuilding(!showWealthBuilding)}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    showWealthBuilding
                      ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold'
                      : 'bg-white text-slate-400 border-[#e8e5dc]'
                  }`}
                >
                  Wealth
                </button>
              </div>
            </div>

            {/* Visual Bars for Recent 6 Months */}
            <div className="space-y-3 pt-2">
              {recent6Months.map((m: any) => {
                const inW = Math.min(100, Math.round((m.income / maxVal) * 100));
                const outW = Math.min(100, Math.round((m.consumption / maxVal) * 100));
                const debtW = Math.min(100, Math.round((m.debtService / maxVal) * 100));
                const wealthW = Math.min(100, Math.round((m.wealthBuilding / maxVal) * 100));

                return (
                  <div key={m.month} className="space-y-1 text-xs">
                    <div className="flex justify-between font-mono text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-800">{m.month}</span>
                      <span className="tabular-nums">
                        {showIncome && <span className="text-emerald-700 font-medium">In: {formatCompactINR(m.income)} </span>}
                        {showConsumption && <span className="text-slate-600">· Out: {formatCompactINR(m.consumption)} </span>}
                        {showDebt && <span className="text-rose-700">· Debt: {formatCompactINR(m.debtService)}</span>}
                      </span>
                    </div>

                    <div className="w-full bg-[#f4f3ee] h-2.5 rounded-full overflow-hidden flex gap-0.5">
                      {showIncome && (
                        <div
                          style={{ width: `${inW}%` }}
                          className="bg-emerald-600 h-full rounded-l-full"
                          title={`Income: ${formatINR(m.income)}`}
                        />
                      )}
                      {showConsumption && (
                        <div
                          style={{ width: `${outW}%` }}
                          className="bg-slate-400 h-full"
                          title={`Consumption: ${formatINR(m.consumption)}`}
                        />
                      )}
                      {showDebt && (
                        <div
                          style={{ width: `${debtW}%` }}
                          className="bg-rose-500 h-full"
                          title={`Debt: ${formatINR(m.debtService)}`}
                        />
                      )}
                      {showWealthBuilding && (
                        <div
                          style={{ width: `${wealthW}%` }}
                          className="bg-[#946f38] h-full rounded-r-full"
                          title={`Wealth: ${formatINR(m.wealthBuilding)}`}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-[11px] text-slate-500 font-mono flex justify-between border-t border-[#f0eee6]">
              <span>Average Monthly Surplus: +{formatCompactINR(overview.monthlyFreeCashFlow)}/mo</span>
              <span className="text-emerald-700 font-medium">Cash generation is improving</span>
            </div>
          </div>

          {/* Section 9: What Changed Component */}
          <div className="p-5 bg-white border border-[#e8e5dc] rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500">
                  What Changed?
                </h3>
                <div className="text-xs text-slate-600">Meaningful period-over-period financial shifts</div>
              </div>
              <button
                onClick={() =>
                  onViewEvidence({
                    claim: 'Period-over-period financial delta shifts',
                    metric: 'Multi-category trajectory variance',
                    value: 'Validated across 24 historical billing cycles',
                    calculation: '(Current Period - Previous Period) / Previous Period',
                    confidence: 91
                  }, 'What Changed Evidence')
                }
                className="text-xs font-mono text-[#946f38] hover:underline"
              >
                View all changes →
              </button>
            </div>

            <div className="divide-y divide-[#f0eee6]">
              {whatChangedItems.map((item) => (
                <div key={item.label} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-800">{item.label}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {item.prev} → {item.current}
                    </div>
                  </div>
                  <div
                    className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                      item.type === 'positive'
                        ? 'text-emerald-800 bg-emerald-50 border border-emerald-200'
                        : item.type === 'negative'
                        ? 'text-rose-800 bg-rose-50 border border-rose-200'
                        : 'text-slate-700 bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {item.change}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: NEXT BEST ACTION & BIGGEST RISK */}
        <div className="space-y-6">
          {/* Section 8: Next Best Action */}
          <div className="p-5 bg-white border border-[#e8e5dc] rounded-2xl shadow-xs space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Next Best Action</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                Priority 1 · Guaranteed ROI
              </span>
            </div>

            <h4 className="text-base font-bold text-slate-900">
              Reduce High-Cost Revolving Debt
            </h4>

            <p className="text-xs text-slate-600 leading-relaxed">
              Your credit-card liability carries a 32% interest rate, materially above all other recorded debts. Retiring it with liquid reserves delivers an immediate 32% risk-free return and permanently restores +₹7,000/mo into free cash flow.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() =>
                  onViewEvidence({
                    claim: 'Credit card liability carries 32% interest rate',
                    metric: 'Revolving Credit APR',
                    value: '₹68,000 balance at 32.0% APR',
                    calculation: 'Interest Drag: ₹68,000 × 32% = ₹21,760/yr compound interest cost',
                    confidence: 100,
                    sourceRecords: [{ type: 'liability', id: 'L003', details: 'Credit Card with ₹68,000 balance at 32% APR' }]
                  }, 'Why reduce high-cost debt?')
                }
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 border border-[#e5e3dc] hover:bg-[#faf9f6] px-3 py-1.5 rounded-lg transition-colors"
              >
                Why? [See evidence]
              </button>

              <button
                onClick={() => onSimulateDecision('PAY_OFF_HIGH_INTEREST_DEBT')}
                className="text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>Simulate Payoff</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Section 8 & 19: Biggest Risk */}
          <div className="p-5 bg-white border border-[#e8e5dc] rounded-2xl shadow-xs space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-600" />
                <span>Biggest Risk</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
                High Priority Drag
              </span>
            </div>

            <h4 className="text-base font-bold text-slate-900">
              High-Cost Revolving Debt · 32% APR
            </h4>

            <p className="text-xs text-slate-600 leading-relaxed">
              Credit Card balance of ₹68,000 incurs ~₹21,760/year in compounding interest. While your liquid reserves (₹8.60L) easily absorb this liability, keeping it active represents an avoidable wealth leak.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() =>
                  onViewEvidence({
                    claim: 'Credit card interest rate exceeds all other facilities by >20%',
                    metric: 'Interest Drag Comparison',
                    value: '32.0% APR vs Home Loan 8.35% and Car Loan 9.10%',
                    calculation: 'Interest rate differential = 32% - 8.35% = 23.65% excess premium',
                    confidence: 100
                  }, 'Risk Audit Evidence')
                }
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 border border-[#e5e3dc] hover:bg-[#faf9f6] px-3 py-1.5 rounded-lg transition-colors"
              >
                [View evidence]
              </button>

              <button
                onClick={() => onSimulateDecision('PAY_OFF_HIGH_INTEREST_DEBT')}
                className="text-xs font-semibold text-[#946f38] hover:text-[#7d5d2e] font-mono flex items-center gap-1"
              >
                <span>[Simulate payoff]</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Section 44: Contextual Ask Vantage Tile */}
          <div className="p-4 bg-[#faf9f6] border border-[#e8e5dc] rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-[#e5e3dc] flex items-center justify-center text-[#946f38]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">✦ Ask Vantage</div>
                <div className="text-[11px] text-slate-500">"What should I do next with my cash surplus?"</div>
              </div>
            </div>
            <button
              onClick={() => onOpenAskVantage('What should I do next?')}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-lg border border-[#e5e3dc] text-xs transition-colors"
            >
              Ask
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
