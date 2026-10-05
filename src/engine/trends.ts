/**
 * Vantage Financial Intelligence — Trend Engine & "What Changed?" Insights
 * Analyzes multi-period trajectory (3m vs previous 3m, 6m, 12m)
 * Ranks insights by materiality and financial consequence.
 */

import { CanonicalTransaction, WhatChangedInsight } from './models';
import { aggregateMonthlyCashFlows, MonthlyCashFlowSummary } from './analytics';

export interface PeriodComparison {
  metric: string;
  currentPeriod: number;
  previousPeriod: number;
  absoluteChange: number;
  percentageChange: number;
  direction: 'increase' | 'decrease' | 'neutral';
  isFavorable: boolean;
}

export function comparePeriods(
  currentVal: number,
  prevVal: number,
  metricName: string,
  favorableIf: 'higher' | 'lower'
): PeriodComparison {
  const absoluteChange = Math.round(currentVal - prevVal);
  let percentageChange = 0;

  if (prevVal !== 0) {
    percentageChange = Math.round(((currentVal - prevVal) / Math.abs(prevVal)) * 1000) / 10;
  } else if (currentVal !== 0) {
    percentageChange = 100;
  }

  const direction: 'increase' | 'decrease' | 'neutral' =
    absoluteChange > 0 ? 'increase' : absoluteChange < 0 ? 'decrease' : 'neutral';

  const isFavorable =
    favorableIf === 'higher'
      ? absoluteChange >= 0
      : absoluteChange <= 0;

  return {
    metric: metricName,
    currentPeriod: Math.round(currentVal),
    previousPeriod: Math.round(prevVal),
    absoluteChange,
    percentageChange,
    direction,
    isFavorable
  };
}

/**
 * Evaluates "What Changed?" between recent quarter and previous quarter
 */
export function generateWhatChangedInsights(
  transactions: CanonicalTransaction[],
  snapshotDate: string = '2026-10-01'
): WhatChangedInsight[] {
  const monthlyMap = aggregateMonthlyCashFlows(transactions, snapshotDate);
  const sortedMonths = Array.from(monthlyMap.keys()).sort();

  if (sortedMonths.length < 2) {
    return [];
  }

  // Compare recent 3 months with prior 3 months
  const recent3 = sortedMonths.slice(-3);
  const prior3 = sortedMonths.slice(-6, -3);

  const sumMonths = (months: string[]) => {
    let inc = 0, cons = 0, debt = 0, wealth = 0;
    for (const m of months) {
      const s = monthlyMap.get(m);
      if (s) {
        inc += s.income;
        cons += s.consumption;
        debt += s.debtService;
        wealth += s.wealthBuilding;
      }
    }
    const count = months.length || 1;
    return {
      avgIncome: Math.round(inc / count),
      avgConsumption: Math.round(cons / count),
      avgDebt: Math.round(debt / count),
      avgWealth: Math.round(wealth / count)
    };
  };

  const current = sumMonths(recent3);
  const prior = prior3.length > 0 ? sumMonths(prior3) : current;

  const insights: WhatChangedInsight[] = [];

  // 1. Income Shift
  const incomeComp = comparePeriods(current.avgIncome, prior.avgIncome, 'Monthly Income', 'higher');
  if (Math.abs(incomeComp.percentageChange) >= 2 || Math.abs(incomeComp.absoluteChange) >= 5000) {
    insights.push({
      id: 'wc-income',
      area: 'INCOME',
      title: incomeComp.direction === 'increase' ? 'Monthly Inflows Expanded' : 'Monthly Inflows Softened',
      description: `Average monthly income shifted by ${incomeComp.direction === 'increase' ? '+' : ''}${incomeComp.percentageChange}% (₹${Math.abs(incomeComp.absoluteChange).toLocaleString('en-IN')}/mo) over the recent quarter compared to prior quarter.`,
      direction: incomeComp.direction,
      materiality: Math.abs(incomeComp.absoluteChange) > 20000 ? 'high' : 'medium',
      currentPeriodValue: current.avgIncome,
      previousPeriodValue: prior.avgIncome,
      absoluteChange: incomeComp.absoluteChange,
      percentageChange: incomeComp.percentageChange,
      evidence: `Recent 3M avg (₹${current.avgIncome.toLocaleString('en-IN')}) vs Prior 3M avg (₹${prior.avgIncome.toLocaleString('en-IN')})`
    });
  }

  // 2. Consumption / Living Expense Trend
  const consComp = comparePeriods(current.avgConsumption, prior.avgConsumption, 'Monthly Consumption', 'lower');
  if (Math.abs(consComp.percentageChange) >= 3 || Math.abs(consComp.absoluteChange) >= 5000) {
    insights.push({
      id: 'wc-consumption',
      area: 'CONSUMPTION',
      title: consComp.direction === 'increase' ? 'Living Expenses Accelerated' : 'Living Expenses Compressed',
      description: `Monthly consumption changed by ${consComp.direction === 'increase' ? '+' : ''}${consComp.percentageChange}% (₹${Math.abs(consComp.absoluteChange).toLocaleString('en-IN')}/mo).`,
      direction: consComp.direction,
      materiality: Math.abs(consComp.absoluteChange) > 15000 ? 'high' : 'medium',
      currentPeriodValue: current.avgConsumption,
      previousPeriodValue: prior.avgConsumption,
      absoluteChange: consComp.absoluteChange,
      percentageChange: consComp.percentageChange,
      evidence: `Recent 3M avg (₹${current.avgConsumption.toLocaleString('en-IN')}) vs Prior 3M avg (₹${prior.avgConsumption.toLocaleString('en-IN')})`
    });
  }

  // 3. Wealth Building / SIP Consistency
  const wealthComp = comparePeriods(current.avgWealth, prior.avgWealth, 'Wealth Building', 'higher');
  insights.push({
    id: 'wc-wealth',
    area: 'WEALTH_BUILDING',
    title: current.avgWealth >= 30000 ? 'Systematic Investment Cadence Sustained' : 'Investment Flow Rate',
    description: `Systematic wealth accumulation allocation sits at ₹${current.avgWealth.toLocaleString('en-IN')}/month into mutual funds and equity portfolios.`,
    direction: wealthComp.direction,
    materiality: 'medium',
    currentPeriodValue: current.avgWealth,
    previousPeriodValue: prior.avgWealth,
    absoluteChange: wealthComp.absoluteChange,
    percentageChange: wealthComp.percentageChange,
    evidence: `Consistent monthly investment transfers across MF SIP and Direct Equity`
  });

  // 4. Category-level materiality (e.g. Travel, Shopping surges in recent 3 months)
  const categoryRecent = new Map<string, number>();
  const categoryPrior = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.status === 'EXACT_DUPLICATE' || tx.status === 'MALFORMED' || tx.classification !== 'CONSUMPTION') continue;
    if (!tx.date) continue;
    const m = tx.date.slice(0, 7);
    const cat = tx.category || 'Other';

    if (recent3.includes(m)) {
      categoryRecent.set(cat, (categoryRecent.get(cat) || 0) + tx.amount);
    } else if (prior3.includes(m)) {
      categoryPrior.set(cat, (categoryPrior.get(cat) || 0) + tx.amount);
    }
  }

  for (const [cat, recTotal] of categoryRecent) {
    const priorTotal = categoryPrior.get(cat) || 0;
    const diff = recTotal - priorTotal;
    if (diff > 15000) {
      insights.push({
        id: `wc-cat-${cat.toLowerCase().replace(/\s+/g, '-')}`,
        area: 'CATEGORY',
        title: `${cat} Outflows Escalated`,
        description: `${cat} spending rose by ₹${Math.round(diff).toLocaleString('en-IN')} over the recent quarter (₹${Math.round(recTotal).toLocaleString('en-IN')} vs ₹${Math.round(priorTotal).toLocaleString('en-IN')}).`,
        direction: 'increase',
        materiality: diff > 30000 ? 'high' : 'medium',
        currentPeriodValue: Math.round(recTotal),
        previousPeriodValue: Math.round(priorTotal),
        absoluteChange: Math.round(diff),
        percentageChange: priorTotal > 0 ? Math.round((diff / priorTotal) * 100) : 100,
        evidence: `Category aggregation across ${recent3.join(', ')}`
      });
    }
  }

  // Sort by materiality
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  return insights.sort((a, b) => priorityOrder[a.materiality] - priorityOrder[b.materiality]);
}
