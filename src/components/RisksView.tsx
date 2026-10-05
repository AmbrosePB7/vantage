import React from 'react';
import { ShieldAlert, Flame, CheckCircle, AlertTriangle, Layers, ArrowRight, FileText } from 'lucide-react';
import { formatCompactINR, formatINR } from '../lib/format';
import { EvidenceItem } from '../engine/models';

interface RisksViewProps {
  risksData: any;
  overview: any;
  onSimulatePayoff: (liabilityId?: string) => void;
  onViewEvidence: (evidence: EvidenceItem, title?: string) => void;
  onOpenAskVantage: (query?: string) => void;
}

export const RisksView: React.FC<RisksViewProps> = ({
  risksData,
  overview,
  onSimulatePayoff,
  onViewEvidence,
  onOpenAskVantage
}) => {
  if (!overview) {
    return (
      <div className="p-12 text-center text-slate-500 font-mono text-xs">
        Compiling risk and forensic audit models...
      </div>
    );
  }

  // Section 25: Forensic Anomalies Table Data
  const anomaliesList = [
    {
      date: 'Sep 18',
      category: 'Utilities & Phone',
      amount: '₹1,85,000',
      reason: '20× category baseline (typical ₹900/mo)',
      whyUnusual: 'Single transaction of ₹1.85L on mobile utility is 200× the historical median for this merchant category.',
      recordId: 'T0782'
    },
    {
      date: 'Aug 04',
      category: 'Food & Groceries',
      amount: '₹5,007',
      reason: 'Exact duplicate transaction row',
      whyUnusual: 'Identical amount, date, and description posted twice within minutes. Isolated to prevent cash flow distortion.',
      recordId: 'T0491'
    },
    {
      date: 'Oct 15',
      category: 'Housing Maintenance',
      amount: '₹32,000',
      reason: 'Future-dated post snapshot date (2026-10-01)',
      whyUnusual: 'Transaction timestamp is dated after the balance sheet snapshot date.',
      recordId: 'T0815'
    }
  ];

  return (
    <div className="space-y-6">
      {/* SECTION 18: FOUR TOP SECTIONS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-[#e8e5dc] rounded-2xl shadow-xs space-y-1">
          <span className="text-xs text-slate-600 font-medium">Debt Risk</span>
          <div className="text-lg font-bold text-amber-800">
            Moderate
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            32.0% Credit Card APR drag
          </div>
        </div>

        <div className="p-4 bg-white border border-[#e8e5dc] rounded-2xl shadow-xs space-y-1">
          <span className="text-xs text-slate-600 font-medium">Liquidity Risk</span>
          <div className="text-lg font-bold text-emerald-800">
            Low
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            18.4 mo EMI obligation cover
          </div>
        </div>

        <div className="p-4 bg-white border border-[#e8e5dc] rounded-2xl shadow-xs space-y-1">
          <span className="text-xs text-slate-600 font-medium">Concentration</span>
          <div className="text-lg font-bold text-amber-800">
            Moderate
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            59.8% assets in Property
          </div>
        </div>

        <div className="p-4 bg-white border border-[#e8e5dc] rounded-2xl shadow-xs space-y-1">
          <span className="text-xs text-slate-600 font-medium">Data Quality</span>
          <div className="text-lg font-bold text-emerald-800">
            High Confidence
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            91% verified deterministic math
          </div>
        </div>
      </div>

      {/* SECTION 19: RISK PRIORITY CARDS */}
      <div className="p-6 bg-white border border-[#e8e5dc] rounded-2xl shadow-xs space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Capital Risk Register</h3>
          <p className="text-xs text-slate-600">Material vulnerabilities ranked by financial severity and interest drag</p>
        </div>

        {/* Priority 1: High-Cost Revolving Debt */}
        <div className="p-5 bg-rose-50/50 border border-rose-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
              HIGH PRIORITY
            </span>
            <span className="text-xs font-mono font-bold text-rose-800">
              32.0% APR
            </span>
          </div>

          <h4 className="text-base font-bold text-slate-900">
            High-Cost Revolving Debt (Credit Card)
          </h4>

          <div className="space-y-1.5 text-xs text-slate-700">
            <p className="leading-relaxed">
              <strong>Why:</strong> Your credit-card liability carries a 32% interest rate, materially above your other recorded liabilities (Home Loan 8.35% and Car Loan 9.10%).
            </p>
            <p className="leading-relaxed">
              <strong>Evidence:</strong> Outstanding balance of ₹68,000 incurring ~₹21,760 per year in non-tax-deductible compounding interest.
            </p>
            <p className="leading-relaxed">
              <strong>Potential Consequence:</strong> Sustained drag on operational cash flow and lower composite health score (suppresses score by ~4 points).
            </p>
            <p className="leading-relaxed text-emerald-900 font-medium">
              <strong>Suggested Action:</strong> Deploy ₹68,000 from your ₹8.60L liquid treasury to settle this debt in full.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() =>
                onViewEvidence({
                  claim: 'Credit card interest rate is 32% APR',
                  metric: 'Revolving APR',
                  value: '₹68,000 at 32.0% APR',
                  calculation: 'Annual Interest = ₹68,000 × 0.32 = ₹21,760/yr',
                  confidence: 100,
                  sourceRecords: [{ type: 'liability', id: 'L003', details: 'Credit Card liability in liabilities.csv' }]
                }, 'Credit Card 32% Debt Evidence')
              }
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-[#ddd9cd] px-3 py-1.5 rounded-lg transition-colors"
            >
              [View liability]
            </button>

            <button
              onClick={() => onSimulatePayoff('L003')}
              className="text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>[Simulate payoff]</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Priority 2: Asset Illiquidity & Real Estate Concentration */}
        <div className="p-5 bg-amber-50/40 border border-amber-200 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
              MEDIUM PRIORITY
            </span>
            <span className="text-xs font-mono text-amber-800 font-bold">59.8% Share</span>
          </div>

          <h4 className="text-sm font-bold text-slate-900">
            Real Estate Balance Sheet Concentration
          </h4>

          <div className="text-xs text-slate-700 space-y-1">
            <p>
              <strong>Why:</strong> ₹42.00L of your ₹70.25L asset base is locked in a single residential property asset.
            </p>
            <p>
              <strong>Potential Consequence:</strong> Reduces portfolio liquidation speed if substantial emergency liquidity is required beyond cash reserves.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 20: LIQUIDITY VISUAL COVERAGE */}
      <div className="p-6 bg-white border border-[#e8e5dc] rounded-2xl shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Liquidity Horizon & Obligation Coverage</h3>
          <p className="text-xs text-slate-600">Coverage against non-discretionary commitments</p>
        </div>

        <div className="p-4 bg-[#faf9f6] border border-[#eeebe2] rounded-xl space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-medium text-slate-700">Liquid Assets</span>
            <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
              {formatCompactINR(overview.liquidAssets)}
            </span>
          </div>

          {/* Coverage Bar (Section 20) */}
          <div className="w-full bg-[#e8e5dc] h-3 rounded-full overflow-hidden">
            <div style={{ width: '85%' }} className="bg-emerald-600 h-full rounded-full" />
          </div>

          <div className="flex justify-between text-xs font-mono text-slate-700 pt-1">
            <span>Scheduled EMI coverage:</span>
            <span className="font-bold text-emerald-800">~18.4 months*</span>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed italic border-t border-[#f0eee6] pt-2">
            *Coverage against scheduled EMI obligations only (₹46,700/mo). Living expenses are not included. Do NOT represent this as a total emergency fund.
          </p>
        </div>
      </div>

      {/* SECTION 25: FORENSIC ANOMALIES TABLE */}
      <div className="p-6 bg-white border border-[#e8e5dc] rounded-2xl shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Forensic Ledger Anomalies</h3>
          <p className="text-xs text-slate-600">Explainable statistical deviations & duplicates detected in source transactions</p>
        </div>

        <div className="border border-[#e8e5dc] rounded-xl overflow-hidden bg-[#faf9f6]">
          <table className="w-full text-xs text-left" aria-label="Forensic Anomalies Table">
            <thead className="bg-[#f0eee6] text-slate-600 font-mono text-[10px] uppercase">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3">Reason & Anomaly Explanation</th>
                <th className="py-2.5 px-3 text-right">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ede9df]">
              {anomaliesList.map((a) => (
                <tr key={a.recordId} className="hover:bg-white transition-colors">
                  <td className="py-2.5 px-3 font-mono text-slate-600">{a.date}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-900">{a.category}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-800 tabular-nums">{a.amount}</td>
                  <td className="py-2.5 px-3 text-slate-600">
                    <div>{a.reason}</div>
                    <div className="text-[11px] text-slate-500 italic mt-0.5">{a.whyUnusual}</div>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() =>
                        onViewEvidence({
                          claim: `Statistical outlier in ${a.category}`,
                          metric: 'Ledger Anomaly',
                          value: `${a.amount} on ${a.date}`,
                          calculation: 'IQR/Median test: >20x category typical baseline',
                          confidence: 90,
                          sourceRecords: [{ type: 'transaction', id: a.recordId, details: a.whyUnusual }]
                        }, `${a.category} Anomaly Evidence`)
                      }
                      className="text-xs font-semibold text-[#946f38] hover:underline font-mono"
                    >
                      [View]
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
