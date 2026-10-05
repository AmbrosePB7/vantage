/**
 * Vantage Financial Intelligence — Deterministic What-If / Decision Simulator
 * Clones financial state, applies scenario hypotheses, recalculates health score & resilience.
 * "Never modify source data. Scenarios are hypothetical only."
 */

import {
  CanonicalAsset,
  CanonicalLiability,
  CanonicalTransaction,
  FinancialState,
  ScenarioInput,
  ScenarioResult
} from './models';
import { calculateFinancialHealthScore, calculateResilienceScore } from './scoring';

export function simulateScenario(
  baselineState: FinancialState,
  baselineAssets: CanonicalAsset[],
  baselineLiabilities: CanonicalLiability[],
  transactions: CanonicalTransaction[],
  input: ScenarioInput
): ScenarioResult {
  // Deep clone baseline state and entities
  const scenarioAssets: CanonicalAsset[] = JSON.parse(JSON.stringify(baselineAssets));
  const scenarioLiabilities: CanonicalLiability[] = JSON.parse(JSON.stringify(baselineLiabilities));

  let scenarioState: FinancialState = JSON.parse(JSON.stringify(baselineState));
  const assumptions: string[] = [];
  let scenarioName = 'Hypothetical Decision Simulation';
  let description = '';
  let verdict: ScenarioResult['verdict'] = 'neutral';
  let recommendationExplanation = '';

  switch (input.scenarioType) {
    case 'PAY_OFF_HIGH_INTEREST_DEBT': {
      scenarioName = 'Pay Off High-Interest Revolving Debt';
      const targetLiabilityId = input.liabilityIdToPayOff || 'L003'; // Default to Credit Card L003
      const targetLiability = scenarioLiabilities.find((l) => l.id === targetLiabilityId);

      if (targetLiability) {
        const payoffAmount = targetLiability.outstandingAmount;
        const freedEmi = targetLiability.emi;

        assumptions.push(`Deploy ₹${payoffAmount.toLocaleString('en-IN')} of liquid cash from savings/current account to fully retire ${targetLiability.name}.`);
        assumptions.push(`Monthly EMI payment of ₹${freedEmi.toLocaleString('en-IN')} is eliminated, directly increasing free cash flow.`);
        assumptions.push(`Annual interest charges at ${targetLiability.interestRate}% APR are permanently halted.`);

        // Apply changes
        scenarioState.liquidAssets = Math.max(0, scenarioState.liquidAssets - payoffAmount);
        scenarioState.totalAssets -= payoffAmount;
        scenarioState.totalLiabilities -= payoffAmount;
        scenarioState.netWorth = scenarioState.totalAssets - scenarioState.totalLiabilities; // Net worth remains unchanged!

        scenarioState.monthlyDebtService = Math.max(0, scenarioState.monthlyDebtService - freedEmi);
        scenarioState.freeCashFlow = scenarioState.monthlyIncome - scenarioState.monthlyConsumption - scenarioState.monthlyDebtService;

        // Remove from scenario liabilities
        const index = scenarioLiabilities.findIndex((l) => l.id === targetLiabilityId);
        if (index !== -1) scenarioLiabilities.splice(index, 1);

        description = `Simulating full repayment of ${targetLiability.name} (balance: ₹${payoffAmount.toLocaleString('en-IN')}) using available liquid cash reserves.`;
        verdict = 'beneficial';
        recommendationExplanation = `This move is highly recommended. Because your liquid buffer remains ample (₹${scenarioState.liquidAssets.toLocaleString('en-IN')}), retiring this ${targetLiability.interestRate}% APR liability saves high compounding interest without creating cash stress.`;
      }
      break;
    }

    case 'INCREASE_SIP': {
      const increment = input.monthlySipIncrease || 25000;
      scenarioName = `Increase Systematic Monthly SIP (+₹${increment.toLocaleString('en-IN')}/mo)`;
      assumptions.push(`Increase monthly wealth-building investment transfers by ₹${increment.toLocaleString('en-IN')} into equity/mutual funds.`);
      assumptions.push(`Funded directly from existing free cash flow surplus (no debt required).`);

      scenarioState.monthlyWealthBuilding += increment;
      scenarioState.wealthBuildingRate = Math.round((scenarioState.monthlyWealthBuilding / scenarioState.monthlyIncome) * 100);

      description = `Simulating an additional ₹${increment.toLocaleString('en-IN')} monthly capital deployment into compounding wealth assets.`;
      verdict = scenarioState.freeCashFlow >= increment ? 'beneficial' : 'caution';
      recommendationExplanation = `Excellent wealth-building strategy. Your existing free cash flow surplus easily absorbs this increment, accelerating long-term net worth compounding.`;
      break;
    }

    case 'INCOME_SHOCK': {
      const reductionPct = input.incomeReductionPercent || 25;
      scenarioName = `Income Shock: -${reductionPct}% Gross Earnings Drop`;
      const lostIncome = Math.round((scenarioState.monthlyIncome * reductionPct) / 100);

      assumptions.push(`Gross monthly income drops by ${reductionPct}% (-₹${lostIncome.toLocaleString('en-IN')}/mo) due to job transition, contract loss, or business downtime.`);
      assumptions.push(`Fixed loan EMIs (₹${scenarioState.monthlyDebtService.toLocaleString('en-IN')}) and base living expenses remain unchanged.`);

      scenarioState.monthlyIncome -= lostIncome;
      scenarioState.freeCashFlow = scenarioState.monthlyIncome - scenarioState.monthlyConsumption - scenarioState.monthlyDebtService;

      description = `Stress-testing portfolio endurance if primary income falls by ${reductionPct}%.`;
      verdict = scenarioState.freeCashFlow >= 0 ? 'caution' : 'high_risk';
      recommendationExplanation = scenarioState.freeCashFlow >= 0
        ? `Even with a ${reductionPct}% income drop, your cash flow remains positive (₹${scenarioState.freeCashFlow.toLocaleString('en-IN')}/mo surplus), demonstrating resilient financial architecture.`
        : `Deficit cash flow requires drawing from liquid emergency funds. Discretionary spending cuts would be required.`;
      break;
    }

    case 'EXPENSE_SURGE': {
      const increasePct = input.expenseIncreasePercent || 20;
      scenarioName = `Inflation / Lifestyle Surge: +${increasePct}% Monthly Spending`;
      const addedExpense = Math.round((scenarioState.monthlyConsumption * increasePct) / 100);

      assumptions.push(`Living consumption rises by ${increasePct}% (+₹${addedExpense.toLocaleString('en-IN')}/mo) across food, travel, and healthcare.`);
      scenarioState.monthlyConsumption += addedExpense;
      scenarioState.freeCashFlow = scenarioState.monthlyIncome - scenarioState.monthlyConsumption - scenarioState.monthlyDebtService;

      description = `Simulating a ${increasePct}% escalation in monthly household consumption.`;
      verdict = scenarioState.freeCashFlow >= 20000 ? 'neutral' : 'caution';
      recommendationExplanation = `Your strong initial cash flow cushion absorbs the +${increasePct}% expense increase, leaving ₹${scenarioState.freeCashFlow.toLocaleString('en-IN')}/mo in surplus.`;
      break;
    }

    case 'PURCHASE_ASSET': {
      const p = input.assetPurchase || {
        name: 'Electric Vehicle / Equipment',
        category: 'Vehicle',
        value: 1200000,
        fundingSource: 'mixed',
        cashUsed: 400000,
        debtAmount: 800000,
        debtInterestRate: 9.5,
        monthlyEmi: 17000
      };

      scenarioName = `Asset Acquisition: ${p.name} (₹${p.value.toLocaleString('en-IN')})`;
      assumptions.push(`Acquire new asset "${p.name}" valued at ₹${p.value.toLocaleString('en-IN')}.`);

      if (p.fundingSource === 'cash') {
        assumptions.push(`100% funded with liquid cash: ₹${p.value.toLocaleString('en-IN')} deducted from liquid assets.`);
        scenarioState.liquidAssets = Math.max(0, scenarioState.liquidAssets - p.value);
        // Liquid cash drops, asset value rises -> Net worth stays roughly equal!
      } else if (p.fundingSource === 'debt') {
        assumptions.push(`100% financed via loan of ₹${p.value.toLocaleString('en-IN')} at ${p.debtInterestRate}% APR.`);
        assumptions.push(`Monthly EMI obligation increases by ₹${p.monthlyEmi.toLocaleString('en-IN')}.`);
        scenarioState.totalLiabilities += p.debtAmount;
        scenarioState.monthlyDebtService += p.monthlyEmi;
      } else {
        assumptions.push(`Funded with ₹${p.cashUsed.toLocaleString('en-IN')} cash down payment and ₹${p.debtAmount.toLocaleString('en-IN')} loan.`);
        assumptions.push(`New monthly loan EMI of ₹${p.monthlyEmi.toLocaleString('en-IN')}.`);
        scenarioState.liquidAssets = Math.max(0, scenarioState.liquidAssets - p.cashUsed);
        scenarioState.totalLiabilities += p.debtAmount;
        scenarioState.monthlyDebtService += p.monthlyEmi;
      }

      scenarioState.totalAssets += p.value;
      scenarioState.netWorth = scenarioState.totalAssets - scenarioState.totalLiabilities;
      scenarioState.freeCashFlow = scenarioState.monthlyIncome - scenarioState.monthlyConsumption - scenarioState.monthlyDebtService;

      description = `Evaluating balance sheet and cash flow impact of acquiring a ₹${p.value.toLocaleString('en-IN')} asset.`;
      verdict = scenarioState.liquidAssets < 200000 ? 'high_risk' : 'neutral';
      recommendationExplanation = `Asset value enters balance sheet. Pay attention to liquid buffer retention and new monthly EMI commitments.`;
      break;
    }

    default:
      break;
  }

  // Recalculate derived ratios
  scenarioState.debtToAssetRatio = scenarioState.totalAssets > 0
    ? Math.round((scenarioState.totalLiabilities / scenarioState.totalAssets) * 1000) / 10
    : 0;

  scenarioState.debtServiceToIncomeRatio = scenarioState.monthlyIncome > 0
    ? Math.round((scenarioState.monthlyDebtService / scenarioState.monthlyIncome) * 1000) / 10
    : 0;

  const monthlyObligations = scenarioState.monthlyConsumption + scenarioState.monthlyDebtService;
  scenarioState.liquidityRunwayMonths = monthlyObligations > 0
    ? Math.round((scenarioState.liquidAssets / monthlyObligations) * 10) / 10
    : 99.9;

  // Recalculate health score & resilience
  const scenarioHealth = calculateFinancialHealthScore(scenarioState, scenarioLiabilities, scenarioAssets, transactions);
  scenarioState.healthScore = scenarioHealth.overallScore;

  const scenarioResilience = calculateResilienceScore(scenarioState);
  scenarioState.resilienceScore = scenarioResilience;

  // Compute exact deltas
  const deltas = {
    netWorthChange: scenarioState.netWorth - baselineState.netWorth,
    liquidAssetsChange: scenarioState.liquidAssets - baselineState.liquidAssets,
    monthlyFreeCashFlowChange: scenarioState.freeCashFlow - baselineState.freeCashFlow,
    liquidityRunwayChangeMonths: Math.round((scenarioState.liquidityRunwayMonths - baselineState.liquidityRunwayMonths) * 10) / 10,
    debtToAssetRatioChange: Math.round((scenarioState.debtToAssetRatio - baselineState.debtToAssetRatio) * 10) / 10,
    healthScoreChange: scenarioState.healthScore - baselineState.healthScore,
    resilienceScoreChange: scenarioState.resilienceScore - baselineState.resilienceScore
  };

  return {
    scenarioName,
    description,
    assumptions,
    baseline: baselineState,
    scenario: scenarioState,
    deltas,
    verdict,
    recommendationExplanation
  };
}
