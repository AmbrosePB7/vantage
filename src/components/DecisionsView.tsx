import React, { useState } from 'react';
import { Sliders, ArrowRight, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import { formatCompactINR, formatINR } from '../lib/format';
import { ScenarioInput, ScenarioResult } from '../engine/models';

interface DecisionsViewProps {
  overview: any;
  onRunSimulation: (input: ScenarioInput) => Promise<ScenarioResult>;
  onOpenAskVantage: (query?: string) => void;
  initialPreset?: ScenarioInput['scenarioType'];
}

export const DecisionsView: React.FC<DecisionsViewProps> = ({
  overview,
  onRunSimulation,
  onOpenAskVantage,
  initialPreset = 'PAY_OFF_HIGH_INTEREST_DEBT'
}) => {
  const [selectedType, setSelectedType] = useState<ScenarioInput['scenarioType']>(initialPreset);
  const [payoffLiabilityId, setPayoffLiabilityId] = useState('L003');
  const [sipAmount, setSipAmount] = useState(25000);
  const [incomeCutPct, setIncomeCutPct] = useState(25);
  const [expenseSpikePct, setExpenseSpikePct] = useState(20);
  const [assetPrice, setAssetPrice] = useState(1200000);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScenarioResult | null>(null);

  // Scenarios matching Section 26
  const scenarioOptions: { id: ScenarioInput['scenarioType']; label: string; desc: string }[] = [
    { id: 'PAY_OFF_HIGH_INTEREST_DEBT', label: 'Pay off debt', desc: 'Retire 32% APR Credit Card using cash reserves' },
    { id: 'INCREASE_SIP', label: 'Increase investment', desc: 'Step up monthly equity SIP contribution by ₹25,000/mo' },
    { id: 'INCOME_SHOCK', label: 'Reduce income', desc: 'Stress-test a 25% reduction in recurring monthly income' },
    { id: 'EXPENSE_SURGE', label: 'Increase spending', desc: 'Simulate a 20% living cost inflation spike' },
    { id: 'PURCHASE_ASSET', label: 'Buy an asset', desc: 'Acquire capital vehicle (₹12L) with 20% down payment' }
  ];

  const handleApply = async () => {
    setIsLoading(true);
    try {
      const res = await onRunSimulation({
        scenarioType: selectedType,
        liabilityIdToPayOff: payoffLiabilityId,
        monthlySipIncrease: sipAmount,
        incomeReductionPercent: incomeCutPct,
        expenseIncreasePercent: expenseSpikePct,
        assetPurchase: selectedType === 'PURCHASE_ASSET' ? {
          name: 'Executive Vehicle',
          category: 'Vehicle',
          value: assetPrice,
          fundingSource: 'mixed',
          cashUsed: Math.round(assetPrice * 0.2),
          debtAmount: Math.round(assetPrice * 0.8),
          debtInterestRate: 9.1,
          monthlyEmi: 21500
        } : undefined
      });
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Run on mount or preset change
  React.useEffect(() => {
    handleApply();
  }, [selectedType]);

  const baseline = result?.baseline || {
    netWorth: overview?.netWorth || 3687000,
    liquidAssets: overview?.liquidAssets || 860000,
    totalLiabilities: overview?.totalLiabilities || 3338000,
    healthScore: overview?.financialHealthScore || 78
  };

  const simulated = result?.scenario || {
    netWorth: 3687000,
    liquidAssets: 792000,
    totalLiabilities: 3270000,
    healthScore: 82
  };

  return (
    <div className="space-y-6">
      {/* SECTION 26: HEADER */}
      <div className="p-6 bg-white border border-[#e8e5dc] rounded-2xl shadow-xs space-y-1">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-[#946f38]" />
          <h2 className="text-base font-bold text-slate-900">
            Decision Simulator
          </h2>
        </div>
        <p className="text-xs text-slate-600">
          Explore a financial decision before you make it. Zero data mutation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: SCENARIO SELECTION & CONTROLS (Section 26) */}
        <div className="lg:col-span-5 p-6 bg-white border border-[#e8e5dc] rounded-2xl shadow-xs space-y-5">
          <div className="space-y-1">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500">
              Choose a Scenario
            </h3>
            <div className="text-xs text-slate-600">Select a strategic capital hypothesis</div>
          </div>

          {/* Radio list */}
          <div className="space-y-2">
            {scenarioOptions.map((opt) => (
              <label
                key={opt.id}
                onClick={() => setSelectedType(opt.id)}
                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all text-xs ${
                  selectedType === opt.id
                    ? 'bg-[#faf9f6] border-[#946f38] shadow-xs'
                    : 'bg-white border-[#eeebe2] hover:border-[#ded9cb]'
                }`}
              >
                <input
                  type="radio"
                  name="scenario"
                  checked={selectedType === opt.id}
                  onChange={() => setSelectedType(opt.id)}
                  className="mt-0.5 text-[#946f38] focus:ring-[#946f38]"
                />
                <div>
                  <div className="font-semibold text-slate-900">{opt.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>

          {/* Dynamic Scenario Controls */}
          <div className="p-4 bg-[#fbfaf8] border border-[#eeebe2] rounded-xl space-y-3 pt-3">
            <div className="text-xs font-bold text-slate-900">Scenario Parameters</div>

            {selectedType === 'PAY_OFF_HIGH_INTEREST_DEBT' && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Target Liability:</span>
                  <span className="font-bold text-slate-900">Credit Card (32% APR)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Payoff Amount:</span>
                  <span className="font-mono font-bold text-slate-900">₹68,000</span>
                </div>
              </div>
            )}

            {selectedType === 'INCREASE_SIP' && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Monthly Contribution Step-Up:</span>
                  <span className="font-mono font-bold text-slate-900">+₹{sipAmount.toLocaleString('en-IN')}/mo</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="50000"
                  step="5000"
                  value={sipAmount}
                  onChange={(e) => setSipAmount(Number(e.target.value))}
                  className="w-full accent-[#946f38]"
                />
              </div>
            )}

            {selectedType === 'INCOME_SHOCK' && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Income Reduction:</span>
                  <span className="font-mono font-bold text-rose-700">-{incomeCutPct}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={incomeCutPct}
                  onChange={(e) => setIncomeCutPct(Number(e.target.value))}
                  className="w-full accent-rose-600"
                />
              </div>
            )}

            <button
              onClick={handleApply}
              disabled={isLoading}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors mt-2"
            >
              {isLoading ? 'Simulating...' : 'Apply Scenario'}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: SCENARIO RESULTS & ASSUMPTIONS (Section 27 & 28) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 bg-white border border-[#e8e5dc] rounded-2xl shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#f0eee6] pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  Simulation Outcome
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {result?.scenarioName || 'Capital Decision Analysis'}
                </h3>
              </div>

              {result?.verdict && (
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {result.verdict.toUpperCase().replace('_', ' ')}
                </span>
              )}
            </div>

            {/* SECTION 27: CURRENT VS AFTER DECISION SIDE BY SIDE */}
            <div className="grid grid-cols-2 gap-4">
              {/* CURRENT */}
              <div className="p-4 bg-[#fbfaf8] border border-[#eeebe2] rounded-xl space-y-3">
                <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                  CURRENT
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="text-[11px] text-slate-500">Net Worth</div>
                    <div className="font-mono font-bold text-slate-900 text-base">
                      {formatCompactINR(baseline.netWorth)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-500">Liquid Assets</div>
                    <div className="font-mono font-bold text-slate-900 text-base">
                      {formatCompactINR(baseline.liquidAssets)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-500">Debt Liabilities</div>
                    <div className="font-mono font-bold text-rose-800 text-base">
                      {formatCompactINR(baseline.totalLiabilities)}
                    </div>
                  </div>

                  <div className="pt-1 border-t border-[#eeebe2]">
                    <div className="text-[11px] text-slate-500">Health Score</div>
                    <div className="font-mono font-bold text-slate-900 text-lg">
                      {baseline.healthScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AFTER DECISION */}
              <div className="p-4 bg-emerald-50/40 border border-emerald-200/80 rounded-xl space-y-3">
                <div className="text-xs font-mono font-bold text-emerald-900 uppercase tracking-wider">
                  AFTER DECISION
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="text-[11px] text-slate-600">Net Worth</div>
                    <div className="font-mono font-bold text-slate-900 text-base">
                      {formatCompactINR(simulated.netWorth)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-600">Liquid Assets</div>
                    <div className="font-mono font-bold text-slate-900 text-base">
                      {formatCompactINR(simulated.liquidAssets)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-600">Debt Liabilities</div>
                    <div className="font-mono font-bold text-slate-900 text-base">
                      {formatCompactINR(simulated.totalLiabilities)}
                    </div>
                  </div>

                  <div className="pt-1 border-t border-emerald-200/60">
                    <div className="text-[11px] text-emerald-800 font-medium">Health Score</div>
                    <div className="font-mono font-bold text-emerald-800 text-lg">
                      {simulated.healthScore} <span className="text-xs font-normal">/ 100</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Impact Badges (Section 27) */}
            <div className="p-3 bg-[#faf9f6] border border-[#e8e5dc] rounded-xl space-y-2">
              <div className="text-[11px] font-mono font-bold text-slate-700 uppercase">
                Analytical Impact
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2 bg-white rounded border border-[#e8e5dc] text-center">
                  <span className="text-slate-500 text-[10px] block">Debt Risk</span>
                  <span className="font-bold text-emerald-700">↓ Reduced</span>
                </div>
                <div className="p-2 bg-white rounded border border-[#e8e5dc] text-center">
                  <span className="text-slate-500 text-[10px] block">Liquidity</span>
                  <span className="font-bold text-slate-700">↓ -₹68K</span>
                </div>
                <div className="p-2 bg-white rounded border border-[#e8e5dc] text-center">
                  <span className="text-slate-500 text-[10px] block">Interest Cost</span>
                  <span className="font-bold text-emerald-700">↓ -₹21.7K/yr</span>
                </div>
                <div className="p-2 bg-white rounded border border-[#e8e5dc] text-center">
                  <span className="text-slate-500 text-[10px] block">Health Score</span>
                  <span className="font-bold text-emerald-700">↑ +4 Pts</span>
                </div>
              </div>
            </div>

            {/* SECTION 28: SCENARIO ASSUMPTIONS */}
            <div className="p-4 bg-[#fbfaf8] border border-[#eeebe2] rounded-xl space-y-1.5 text-xs">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#946f38]" />
                <span>Analytical Assumptions</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                {result?.assumptions && result.assumptions.length > 0
                  ? result.assumptions.join(' ')
                  : 'This scenario assumes the credit-card balance is fully paid using current liquid assets and no new debt is taken.'}
              </p>
            </div>

            {/* SECTION 29: AI EXPLAIN THIS DECISION */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => onOpenAskVantage(`Is this decision worth doing? I am simulating ${selectedType}`)}
                className="px-4 py-2 bg-[#faf9f6] hover:bg-[#f3f0e6] text-[#7d5d2e] border border-[#ded9cb] font-semibold rounded-xl text-xs transition-colors flex items-center gap-2 group"
              >
                <Sparkles className="w-4 h-4 text-[#946f38]" />
                <span>Explain this decision with AI</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#946f38] group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
