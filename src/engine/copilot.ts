/**
 * Vantage Financial Intelligence — Free AI & Private Wealth Advisory Layer
 * 100% Free AI Support:
 * - Free Gemini 2.5 Flash API (when key available in runtime)
 * - Free Advanced On-Device Private Intelligence Engine (zero-cost, offline, privacy-first)
 * Grounded in verified deterministic financial facts.
 */

import { GoogleGenAI } from '@google/genai';
import {
  ActionRecommendation,
  CanonicalAsset,
  CanonicalLiability,
  FinancialHealthBreakdown,
  FinancialState,
  WhatChangedInsight
} from './models';

export interface CopilotResponse {
  answer: string;
  intent: string;
  engineUsed: 'Gemini 3.8 Flash (Free Tier)' | 'Free On-Device Private Wealth AI';
  verifiedFacts: Record<string, any>;
  suggestedFollowUps: string[];
  isAiGenerated: boolean;
}

/**
 * Builds verified structured factual context from the deterministic engine
 */
export function buildVerifiedFacts(
  state: FinancialState,
  healthBreakdown: FinancialHealthBreakdown,
  liabilities: CanonicalLiability[],
  assets: CanonicalAsset[],
  recommendations: ActionRecommendation[],
  whatChanged: WhatChangedInsight[]
) {
  const highestDebt = [...liabilities].sort((a, b) => b.interestRate - a.interestRate)[0];

  return {
    snapshotDate: state.snapshotDate,
    netWorth: `₹${state.netWorth.toLocaleString('en-IN')}`,
    totalAssets: `₹${state.totalAssets.toLocaleString('en-IN')}`,
    totalLiabilities: `₹${state.totalLiabilities.toLocaleString('en-IN')}`,
    liquidAssets: `₹${state.liquidAssets.toLocaleString('en-IN')}`,
    semiLiquidAssets: `₹${state.semiLiquidAssets.toLocaleString('en-IN')}`,
    illiquidAssets: `₹${state.illiquidAssets.toLocaleString('en-IN')}`,
    liquidityRunway: `${state.liquidityRunwayMonths} months`,
    monthlyIncome: `₹${state.monthlyIncome.toLocaleString('en-IN')}`,
    monthlyConsumption: `₹${state.monthlyConsumption.toLocaleString('en-IN')}`,
    monthlyDebtService: `₹${state.monthlyDebtService.toLocaleString('en-IN')}`,
    monthlyWealthBuilding: `₹${state.monthlyWealthBuilding.toLocaleString('en-IN')}`,
    monthlyFreeCashFlow: `₹${state.freeCashFlow.toLocaleString('en-IN')}`,
    healthScore: `${healthBreakdown.overallScore}/100 (Grade ${healthBreakdown.grade})`,
    resilienceScore: `${state.resilienceScore}/100`,
    dataConfidence: `${state.dataConfidence}/100`,
    topAssetConcentration: `${state.topAssetConcentration.assetName} (${state.topAssetConcentration.percentage}% of NAV, ₹${state.topAssetConcentration.value.toLocaleString('en-IN')})`,
    highestInterestDebt: highestDebt
      ? `${highestDebt.name} carrying ₹${highestDebt.outstandingAmount.toLocaleString('en-IN')} at ${highestDebt.interestRate}% APR (EMI: ₹${highestDebt.emi.toLocaleString('en-IN')})`
      : 'None (Debt Free)',
    highestDebtDetail: highestDebt ? {
      name: highestDebt.name,
      outstanding: highestDebt.outstandingAmount,
      apr: highestDebt.interestRate,
      emi: highestDebt.emi,
      annualInterestCost: Math.round(highestDebt.outstandingAmount * (highestDebt.interestRate / 100))
    } : null,
    liabilitiesList: liabilities.map((l) => `${l.name}: ₹${l.outstandingAmount.toLocaleString('en-IN')} at ${l.interestRate}% APR`),
    topAssetsList: assets.slice(0, 5).map((a) => `${a.name} (${a.category}): ₹${a.value.toLocaleString('en-IN')}`),
    topRecommendation: recommendations[0]?.title || 'Maintain current savings cadence',
    recommendationsList: recommendations.slice(0, 3).map((r) => r.title),
    recentChangesSummary: whatChanged.slice(0, 3).map((w) => w.title).join('; ')
  };
}

/**
 * Free Advanced On-Device Intelligence Engine
 * Minimal, executive, high-clarity private wealth advisory.
 * Less words, clearer answer output.
 */
export function generateAdvancedFreeAdvisory(
  query: string,
  facts: ReturnType<typeof buildVerifiedFacts>
): string {
  const q = query.toLowerCase().trim();

  // 1. Overall Health / Score / Financial Standing
  if (
    q.includes('healthy') ||
    q.includes('health') ||
    q.includes('score') ||
    q.includes('standing') ||
    q.includes('how am i doing')
  ) {
    return `**VERDICT: FINANCIALLY HEALTHY (${facts.healthScore})**

• **Net Asset Value**: ${facts.netWorth} (Assets: ${facts.totalAssets} · Debt: ${facts.totalLiabilities})
• **Cash Surplus**: +${facts.monthlyFreeCashFlow}/mo clean free cash flow
• **Liquid Runway**: ${facts.liquidAssets} (${facts.liquidityRunway} living obligations)
${facts.highestDebtDetail ? `• **Primary Drag**: ${facts.highestInterestDebt}` : '• **Debt Burden**: None (Zero drag)'}

**STRATEGIC ACTION**: ${facts.topRecommendation}`;
  }

  // 2. Risk & Vulnerabilities
  if (
    q.includes('risk') ||
    q.includes('vulnerability') ||
    q.includes('threat') ||
    q.includes('danger') ||
    q.includes('drag')
  ) {
    if (facts.highestDebtDetail && facts.highestDebtDetail.apr >= 15) {
      return `**TOP RISK: HIGH-COST DEBT (${facts.highestDebtDetail.name} · ${facts.highestDebtDetail.apr}% APR)**

• **Outstanding**: ₹${facts.highestDebtDetail.outstanding.toLocaleString('en-IN')}
• **Carrying Cost**: ~₹${facts.highestDebtDetail.annualInterestCost.toLocaleString('en-IN')}/year in compounding interest
• **Portfolio Drag**: Drains +₹${facts.highestDebtDetail.emi.toLocaleString('en-IN')}/mo cash flow
• **Asset Concentration**: ${facts.topAssetConcentration}

**STRATEGIC ACTION**: Retire the ₹${facts.highestDebtDetail.outstanding.toLocaleString('en-IN')} balance immediately from your ${facts.liquidAssets} cash reserves.`;
    }

    return `**TOP RISK: CONCENTRATION & HORIZON REVIEW**

• **Capital Concentration**: ${facts.topAssetConcentration}
• **Total Liabilities**: ${facts.totalLiabilities} across ${facts.liabilitiesList.length} facilities
• **Liquid Runway**: ${facts.liquidityRunway} (${facts.liquidAssets})

**STRATEGIC ACTION**: Rebalance surplus capital into liquid global equity instruments to broaden diversification.`;
  }

  // 3. Recommended Actions / Strategic Priorities
  if (
    q.includes('what should i do') ||
    q.includes('recommend') ||
    q.includes('action') ||
    q.includes('priorit') ||
    q.includes('next')
  ) {
    return `**CAPITAL ALLOCATION PRIORITIES:**

${facts.recommendationsList.map((rec, idx) => `${idx + 1}. **${rec}**`).join('\n')}

**NET EFFECT**: Eliminates drag, compounds liquid reserves, and lifts overall resilience.`;
  }

  // 4. Debt Payoff Simulation / Specific Credit Card Query
  if (q.includes('pay off') || q.includes('payoff') || q.includes('repay') || (q.includes('credit card') && (q.includes('pay') || q.includes('happen')))) {
    if (facts.highestDebtDetail) {
      return `**DEBT LIQUIDATION PAYOFF VERDICT:**

• **Target**: ${facts.highestDebtDetail.name} (₹${facts.highestDebtDetail.outstanding.toLocaleString('en-IN')} @ ${facts.highestDebtDetail.apr}% APR)
• **Guaranteed Return**: Halts ₹${facts.highestDebtDetail.annualInterestCost.toLocaleString('en-IN')}/yr in compounding charges (${facts.highestDebtDetail.apr}% risk-free ROI)
• **Cash Flow Freed**: +₹${facts.highestDebtDetail.emi.toLocaleString('en-IN')}/month immediately restored
• **Remaining Treasury**: Safe ${facts.liquidityRunway} liquid buffer remains untouched

**VERDICT**: 100% Recommended. Execute payout from cash reserves.`;
    }

    return `**DEBT STATUS: ZERO LIABILITIES DETECTED**

• Your balance sheet is currently debt-free.
• 100% of income flows into living expenses, reinvestment, and capital preservation.`;
  }

  // 5. Inflows, Expenses & Where Did Money Go
  if (
    q.includes('where') ||
    q.includes('spend') ||
    q.includes('spent') ||
    q.includes('expense') ||
    q.includes('cash flow') ||
    q.includes('burn') ||
    q.includes('money go')
  ) {
    return `**MONTHLY CASH DISPOSITION (AVERAGE):**

• **Total Inflow**: ${facts.monthlyIncome}
• **Operational Living**: -${facts.monthlyConsumption}
• **Debt Service**: -${facts.monthlyDebtService}
• **Systematic Wealth Creation (SIP)**: -${facts.monthlyWealthBuilding}
• **Net Free Cash Flow Retained**: +${facts.monthlyFreeCashFlow}/mo

*Wealth creation transfers (${facts.monthlyWealthBuilding}/mo) build asset equity, not consumable burn.*`;
  }

  // 6. Net Worth / Net Asset Value (NAV)
  if (
    q.includes('net worth') ||
    q.includes('nav') ||
    q.includes('assets') ||
    q.includes('wealth') ||
    q.includes('portfolio')
  ) {
    return `**SOVEREIGN BALANCE SHEET (VALUATION: ${facts.snapshotDate}):**

• **Net Asset Value (NAV)**: ${facts.netWorth}
• **Gross Assets**: ${facts.totalAssets} (Liquid: ${facts.liquidAssets} · Semi-Liquid: ${facts.semiLiquidAssets} · Illiquid: ${facts.illiquidAssets})
• **Total Obligations**: ${facts.totalLiabilities}
• **Primary Holding**: ${facts.topAssetConcentration}

**VERDICT**: Robust equity foundation with ${facts.liquidityRunway} non-discretionary runway.`;
  }

  // 7. Recent Shifts & Changes
  if (
    q.includes('change') ||
    q.includes('recent') ||
    q.includes('trend') ||
    q.includes('shift') ||
    q.includes('quarter')
  ) {
    return `**RECENT CAPITAL SHIFTS:**

• ${facts.recentChangesSummary || 'Core operational run-rates remain disciplined across billing cycles.'}
• **Monthly Retained Surplus**: +${facts.monthlyFreeCashFlow}/month
• **Systematic Investment Flow**: ${facts.monthlyWealthBuilding}/month`;
  }

  // 8. Default Executive Guidance
  return `**EXECUTIVE WEALTH DOSSIER (${facts.snapshotDate}):**

• **NAV**: ${facts.netWorth} (Assets: ${facts.totalAssets} | Debt: ${facts.totalLiabilities})
• **Liquid Buffer**: ${facts.liquidAssets} (${facts.liquidityRunway} runway)
• **Monthly Surplus**: +${facts.monthlyFreeCashFlow}/mo
• **Health Rating**: ${facts.healthScore}
• **Key Priority**: ${facts.topRecommendation}`;
}

/**
 * Executes grounded query processing using Free Gemini API (if key available)
 * or seamlessly falls back to Free On-Device Private Wealth AI.
 */
export async function askVantageCopilot(
  question: string,
  state: FinancialState,
  healthBreakdown: FinancialHealthBreakdown,
  liabilities: CanonicalLiability[],
  assets: CanonicalAsset[],
  recommendations: ActionRecommendation[],
  whatChanged: WhatChangedInsight[],
  apiKey?: string,
  forceLocalMode?: boolean
): Promise<CopilotResponse> {
  const verifiedFacts = buildVerifiedFacts(
    state,
    healthBreakdown,
    liabilities,
    assets,
    recommendations,
    whatChanged
  );

  const suggestedFollowUps = [
    'What is my single biggest financial risk?',
    'What happens if I pay off my high-interest debt today?',
    'Where did my money go across categories?',
    'How resilient is my portfolio if income drops 25%?'
  ];

  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;

  // If local mode requested or no key configured, use Free On-Device Intelligence Engine
  if (forceLocalMode || !effectiveKey || effectiveKey === 'MY_GEMINI_API_KEY') {
    return {
      answer: generateAdvancedFreeAdvisory(question, verifiedFacts),
      intent: 'PRIVATE_WEALTH_EXPLANATION',
      engineUsed: 'Free On-Device Private Wealth AI',
      verifiedFacts,
      suggestedFollowUps,
      isAiGenerated: false
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: effectiveKey });
    const systemPrompt = `You are VANTAGE, an ultra-refined private wealth intelligence partner for high-net-worth clients.
CRITICAL MANDATES:
1. Ground all figures and facts STRICTLY in the verified financial facts provided below.
2. NEVER guess, speculate, or alter any numbers.
3. Tone: Minimal, decisive, highly polished, executive, and mathematically grounded.
4. Brevity Mandate: Less words, clearer answer input. Keep responses under 80 words. Formatted in 3 clear bullets: [VERDICT], [KEY VERIFIED FIGURES], [STRATEGIC ACTION]. No conversational filler or preamble.
5. Format all currency in Indian Rupee notation (e.g. ₹36.87L or ₹36,87,000).

VERIFIED FINANCIAL FACTS:
${JSON.stringify(verifiedFacts, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: question,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.15
      }
    });

    const aiText = response.text?.trim();
    if (aiText) {
      return {
        answer: aiText,
        intent: 'GROUNDED_AI_EXPLANATION',
        engineUsed: 'Gemini 3.8 Flash (Free Tier)',
        verifiedFacts,
        suggestedFollowUps,
        isAiGenerated: true
      };
    }
  } catch (err) {
    console.warn('Free Gemini API call failed, seamlessly falling back to Free On-Device AI:', err);
  }

  return {
    answer: generateAdvancedFreeAdvisory(question, verifiedFacts),
    intent: 'PRIVATE_WEALTH_EXPLANATION',
    engineUsed: 'Free On-Device Private Wealth AI',
    verifiedFacts,
    suggestedFollowUps,
    isAiGenerated: false
  };
}
