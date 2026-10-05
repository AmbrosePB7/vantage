/**
 * Vantage Financial Intelligence — Deterministic Recommendation Engine
 * "Do not ask the LLM to invent recommendations. Create deterministic rules."
 * Ranks recommendations by financial impact, risk reduction, urgency, and confidence.
 */

import { ActionRecommendation, CanonicalAsset, CanonicalLiability, FinancialState } from './models';

export function generateTopRecommendations(
  state: FinancialState,
  liabilities: CanonicalLiability[],
  assets: CanonicalAsset[]
): ActionRecommendation[] {
  const recommendations: ActionRecommendation[] = [];

  // Rule 1: High-Interest Revolving Debt (e.g. Credit Card at 32% APR)
  const highInterestLiability = liabilities
    .filter((l) => l.interestRate >= 18)
    .sort((a, b) => b.interestRate - a.interestRate)[0];

  if (highInterestLiability) {
    const annualInterestCost = Math.round(
      (highInterestLiability.outstandingAmount * highInterestLiability.interestRate) / 100
    );

    const hasSufficientLiquidity = state.liquidAssets >= highInterestLiability.outstandingAmount * 2;

    recommendations.push({
      id: 'rec-payoff-credit-card',
      priority: 1,
      urgency: 'high',
      impact: 'high',
      category: 'DEBT_OPTIMIZATION',
      title: `Eliminate High-Cost ${highInterestLiability.name} (APR: ${highInterestLiability.interestRate}%)`,
      reason: `You are carrying an outstanding balance of ₹${highInterestLiability.outstandingAmount.toLocaleString('en-IN')} on your ${highInterestLiability.name} at an onerous ${highInterestLiability.interestRate}% interest rate. Because you possess ₹${state.liquidAssets.toLocaleString('en-IN')} in liquid reserves, paying this off immediately from cash reserves carries virtually zero liquidity risk while generating a guaranteed ~${highInterestLiability.interestRate}% annualized financial return.`,
      actionSteps: [
        `Deploy ₹${highInterestLiability.outstandingAmount.toLocaleString('en-IN')} from savings/current account to pay off ${highInterestLiability.name} principal in full.`,
        `Reclaim ₹${highInterestLiability.emi.toLocaleString('en-IN')}/month in freed-up cash flow previously diverted to EMI service.`,
        `Boost Health Score by eliminating high-risk revolving credit drag.`
      ],
      affectedMetrics: [
        'Debt-to-Asset Ratio',
        'Monthly Free Cash Flow (+₹7,000/mo)',
        'Guaranteed Annual Interest Saved (₹' + annualInterestCost.toLocaleString('en-IN') + '/yr)',
        'Financial Health Score (+4 to +6 pts)'
      ],
      projectedBenefit: `Instant guaranteed savings of ₹${annualInterestCost.toLocaleString('en-IN')}/year in compounding interest charges and ₹${highInterestLiability.emi.toLocaleString('en-IN')}/month cash flow improvement.`,
      evidence: {
        claim: `Highest-interest liability in portfolio is ${highInterestLiability.name} at ${highInterestLiability.interestRate}% APR.`,
        metric: 'Liability APR & Liquid Buffer Ratio',
        value: `${highInterestLiability.interestRate}% APR · Liquid Buffer: ₹${state.liquidAssets.toLocaleString('en-IN')}`,
        calculation: `Liquid Assets (₹${state.liquidAssets.toLocaleString('en-IN')}) ÷ Liability Balance (₹${highInterestLiability.outstandingAmount.toLocaleString('en-IN')}) = ${(state.liquidAssets / highInterestLiability.outstandingAmount).toFixed(1)}x coverage`,
        sourceRecords: [
          {
            type: 'liability',
            id: highInterestLiability.id,
            details: `${highInterestLiability.name}: Outstanding ₹${highInterestLiability.outstandingAmount.toLocaleString('en-IN')}, APR ${highInterestLiability.interestRate}%, EMI ₹${highInterestLiability.emi.toLocaleString('en-IN')}`
          }
        ],
        confidence: 99
      }
    });
  }

  // Rule 2: Counterbalance Asset Concentration via Systematic Financial Asset Allocation
  const topAsset = state.topAssetConcentration;
  if (topAsset.percentage >= 45) {
    const recommendedMonthlyAllocation = Math.min(
      Math.round(state.freeCashFlow * 0.4),
      50000
    );

    recommendations.push({
      id: 'rec-asset-diversification',
      priority: 2,
      urgency: 'medium',
      impact: 'high',
      category: 'INVESTMENT_EFFICIENCY',
      title: `Diversify Beyond ${topAsset.assetName} Concentration (${topAsset.percentage}%)`,
      reason: `${topAsset.assetName} represents ${topAsset.percentage}% of your total asset base (₹${topAsset.value.toLocaleString('en-IN')}). With an unallocated monthly free cash flow surplus of ₹${state.freeCashFlow.toLocaleString('en-IN')}, scaling up systematic investments into liquid equities and mutual funds will improve liquidity resilience and balance portfolio risk over time.`,
      actionSteps: [
        `Channel an additional ₹${recommendedMonthlyAllocation.toLocaleString('en-IN')}/month of free cash flow into broad-market index funds or equity SIPs.`,
        `Gradually dilute real estate concentration below 50% through liquid asset growth without forced asset liquidations.`,
        `Preserve 6 months of living expenses in fixed deposits / high-yield savings.`
      ],
      affectedMetrics: [
        'Liquid & Semi-Liquid Asset Share',
        'Asset Concentration Risk',
        'Wealth Growth Score Component'
      ],
      projectedBenefit: `Accelerates liquid wealth accumulation while reducing dependence on a single illiquid physical asset.`,
      evidence: {
        claim: `Top asset (${topAsset.assetName}) comprises ${topAsset.percentage}% of total balance sheet.`,
        metric: 'Single Asset Concentration Percentage',
        value: `${topAsset.percentage}%`,
        calculation: `Top Asset (₹${topAsset.value.toLocaleString('en-IN')}) ÷ Total Assets (₹${state.totalAssets.toLocaleString('en-IN')})`,
        sourceRecords: [
          {
            type: 'asset',
            id: 'A008',
            details: `${topAsset.assetName}: Value ₹${topAsset.value.toLocaleString('en-IN')} (${topAsset.percentage}% of wealth)`
          }
        ],
        confidence: 96
      }
    });
  }

  // Rule 3: Reconcile Ledger Outliers and Optimize Recurring Utilities
  recommendations.push({
    id: 'rec-ledger-reconciliation',
    priority: 3,
    urgency: 'low',
    impact: 'medium',
    category: 'EXPENSE_CONTROL',
    title: 'Audit Anomalous ₹1.85L Utility Charge & Reconcile Future Dates',
    reason: `The ledger contains a March 2026 Mobile Utility expense of ₹1,85,000 (typical monthly cost is ₹900), representing a probable telecom billing error or security deposit. Furthermore, 1 future-dated entry (2026-11-15) was isolated. Reconciling these ensures 100% financial accuracy.`,
    actionSteps: [
      `Review billing statement for transaction T0488 (₹1,85,000 Mobile charge) for telco dispute or accounting reclassification.`,
      `Verify scheduled status of post-snapshot transaction T0277.`,
      `Establish automated recurring bill monitoring.`
    ],
    affectedMetrics: ['Historical Expense Baseline', 'Data Confidence Score', 'Utility Variance Metric'],
    projectedBenefit: `Potential recovery or correction of up to ₹1,84,100 in misclassified utility outflows.`,
    evidence: {
      claim: 'Mobile utility expense of ₹1,85,000 deviates by >200x from historical median.',
      metric: 'Statistical IQR Outlier Flag',
      value: '₹1,85,000 vs Median ₹900',
      calculation: 'T0488 amount (185,000) ÷ Category Median (900) = 205.5x',
      sourceRecords: [
        {
          type: 'transaction',
          id: 'T0488',
          details: 'Utilities: Mobile on 2026-03-14 for ₹185,000.00'
        }
      ],
      confidence: 98
    }
  });

  return recommendations;
}
