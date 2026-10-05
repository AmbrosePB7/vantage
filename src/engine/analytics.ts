/**
 * Vantage Financial Intelligence — Centralized Deterministic Financial Engine
 * "One source of truth. Validate once. Calculate once. Reuse everywhere."
 */

import {
  CanonicalAsset,
  CanonicalLiability,
  CanonicalTransaction,
  FinancialState
} from './models';

export interface MonthlyCashFlowSummary {
  month: string; // YYYY-MM
  income: number;
  consumption: number;
  debtService: number;
  wealthBuilding: number;
  netSavings: number; // Income - Consumption - DebtService
  totalOutflow: number;
  transactionCount: number;
  topCategory: string;
}

export interface CategoryBreakdown {
  category: string;
  classification: string;
  totalAmount: number;
  percentageOfOutflow: number;
  transactionCount: number;
  monthlyAverage: number;
}

/**
 * Calculates total assets from canonical assets list
 */
export function calculateTotalAssets(assets: CanonicalAsset[]): number {
  return assets.reduce((sum, a) => sum + (Number.isFinite(a.value) ? a.value : 0), 0);
}

/**
 * Calculates total liabilities from canonical liabilities list
 */
export function calculateTotalLiabilities(liabilities: CanonicalLiability[]): number {
  return liabilities.reduce((sum, l) => sum + (Number.isFinite(l.outstandingAmount) ? l.outstandingAmount : 0), 0);
}

/**
 * Calculates net worth: Assets - Liabilities
 */
export function calculateNetWorth(totalAssets: number, totalLiabilities: number): number {
  return totalAssets - totalLiabilities;
}

/**
 * Calculates liquid assets (Savings, Current, Fixed Deposit, Cash)
 */
export function calculateLiquidAssets(assets: CanonicalAsset[]): {
  liquid: number;
  semiLiquid: number;
  illiquid: number;
} {
  let liquid = 0;
  let semiLiquid = 0;
  let illiquid = 0;

  for (const a of assets) {
    if (a.liquidity === 'liquid') liquid += a.value;
    else if (a.liquidity === 'semi-liquid') semiLiquid += a.value;
    else illiquid += a.value;
  }

  return { liquid, semiLiquid, illiquid };
}

/**
 * Groups valid historical transactions into monthly buckets (excluding future-dated and exact duplicates)
 */
export function aggregateMonthlyCashFlows(
  transactions: CanonicalTransaction[],
  snapshotDate: string = '2026-10-01'
): Map<string, MonthlyCashFlowSummary> {
  const map = new Map<string, MonthlyCashFlowSummary>();

  for (const tx of transactions) {
    // Exclude exact duplicates and future-dated records from historical cash flow averages
    if (tx.status === 'EXACT_DUPLICATE' || tx.status === 'MALFORMED') continue;
    if (!tx.date || (snapshotDate && tx.date > snapshotDate)) continue;

    const month = tx.date.slice(0, 7); // YYYY-MM
    let summary = map.get(month);
    if (!summary) {
      summary = {
        month,
        income: 0,
        consumption: 0,
        debtService: 0,
        wealthBuilding: 0,
        netSavings: 0,
        totalOutflow: 0,
        transactionCount: 0,
        topCategory: ''
      };
      map.set(month, summary);
    }

    summary.transactionCount++;

    switch (tx.classification) {
      case 'INCOME':
        summary.income += tx.amount;
        break;
      case 'CONSUMPTION':
        summary.consumption += tx.amount;
        summary.totalOutflow += tx.amount;
        break;
      case 'DEBT_SERVICE':
        summary.debtService += tx.amount;
        summary.totalOutflow += tx.amount;
        break;
      case 'WEALTH_BUILDING':
        summary.wealthBuilding += tx.amount;
        summary.totalOutflow += tx.amount;
        break;
      case 'ADJUSTMENT':
        // If it's a correction, apply according to type
        if (tx.transactionType === 'expense') {
          summary.consumption += tx.amount;
        }
        break;
      default:
        break;
    }
  }

  // Calculate net free cash flow for each month
  for (const [, summary] of map) {
    summary.netSavings = summary.income - summary.consumption - summary.debtService;
  }

  return map;
}

/**
 * Computes normalized recent monthly metrics (last 6 months average if available, or all history)
 */
export function calculateRecentMonthlyAverages(
  monthlyMap: Map<string, MonthlyCashFlowSummary>,
  monthsToAverage: number = 6
): {
  monthlyIncome: number;
  monthlyConsumption: number;
  monthlyDebtService: number;
  monthlyWealthBuilding: number;
  freeCashFlow: number;
  savingsRate: number;
  wealthBuildingRate: number;
} {
  const sortedMonths = Array.from(monthlyMap.keys()).sort();
  if (sortedMonths.length === 0) {
    return {
      monthlyIncome: 0,
      monthlyConsumption: 0,
      monthlyDebtService: 0,
      monthlyWealthBuilding: 0,
      freeCashFlow: 0,
      savingsRate: 0,
      wealthBuildingRate: 0
    };
  }

  const recentKeys = sortedMonths.slice(-monthsToAverage);
  const count = recentKeys.length;

  let totalIncome = 0;
  let totalConsumption = 0;
  let totalDebtService = 0;
  let totalWealthBuilding = 0;

  for (const k of recentKeys) {
    const s = monthlyMap.get(k)!;
    totalIncome += s.income;
    totalConsumption += s.consumption;
    totalDebtService += s.debtService;
    totalWealthBuilding += s.wealthBuilding;
  }

  const monthlyIncome = Math.round(totalIncome / count);
  const monthlyConsumption = Math.round(totalConsumption / count);
  const monthlyDebtService = Math.round(totalDebtService / count);
  const monthlyWealthBuilding = Math.round(totalWealthBuilding / count);

  // Free Cash Flow = Income - Consumption - Debt Service
  const freeCashFlow = monthlyIncome - monthlyConsumption - monthlyDebtService;

  // Savings Rate = (Free Cash Flow + Wealth Building) / Income (safely handled)
  const savingsRate = monthlyIncome > 0
    ? Math.max(0, Math.min(100, Math.round(((freeCashFlow + monthlyWealthBuilding) / monthlyIncome) * 100)))
    : 0;

  const wealthBuildingRate = monthlyIncome > 0
    ? Math.max(0, Math.min(100, Math.round((monthlyWealthBuilding / monthlyIncome) * 100)))
    : 0;

  return {
    monthlyIncome,
    monthlyConsumption,
    monthlyDebtService,
    monthlyWealthBuilding,
    freeCashFlow,
    savingsRate,
    wealthBuildingRate
  };
}

/**
 * Calculates asset concentration breakdown
 */
export function calculateAssetConcentration(assets: CanonicalAsset[], totalAssets: number): {
  assetName: string;
  category: string;
  value: number;
  percentage: number;
} {
  if (assets.length === 0 || totalAssets <= 0) {
    return { assetName: 'None', category: 'None', value: 0, percentage: 0 };
  }

  let maxAsset = assets[0];
  for (const a of assets) {
    if (a.value > maxAsset.value) {
      maxAsset = a;
    }
  }

  const percentage = Math.round((maxAsset.value / totalAssets) * 1000) / 10;

  return {
    assetName: maxAsset.name,
    category: maxAsset.category,
    value: maxAsset.value,
    percentage
  };
}

/**
 * Computes expense category breakdown
 */
export function calculateCategoryBreakdown(
  transactions: CanonicalTransaction[],
  snapshotDate: string = '2026-10-01'
): CategoryBreakdown[] {
  const catMap = new Map<string, { total: number; count: number; classification: string }>();
  let totalOutflow = 0;

  for (const tx of transactions) {
    if (tx.status === 'EXACT_DUPLICATE' || tx.status === 'MALFORMED') continue;
    if (tx.date && snapshotDate && tx.date > snapshotDate) continue;
    if (tx.classification === 'INCOME' || tx.classification === 'TRANSFER') continue;

    const cat = tx.category || 'General';
    totalOutflow += tx.amount;

    const existing = catMap.get(cat) || { total: 0, count: 0, classification: tx.classification };
    existing.total += tx.amount;
    existing.count++;
    catMap.set(cat, existing);
  }

  // Count months to get average
  const months = new Set(
    transactions
      .filter((t) => t.date && (!snapshotDate || t.date <= snapshotDate))
      .map((t) => t.date!.slice(0, 7))
  ).size || 1;

  const result: CategoryBreakdown[] = [];
  for (const [cat, data] of catMap) {
    result.push({
      category: cat,
      classification: data.classification,
      totalAmount: Math.round(data.total),
      percentageOfOutflow: totalOutflow > 0 ? Math.round((data.total / totalOutflow) * 1000) / 10 : 0,
      transactionCount: data.count,
      monthlyAverage: Math.round(data.total / months)
    });
  }

  return result.sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * Assembles the centralized canonical FinancialState
 */
export function buildFinancialState(
  assets: CanonicalAsset[],
  liabilities: CanonicalLiability[],
  transactions: CanonicalTransaction[],
  snapshotDate: string = '2026-10-01'
): FinancialState {
  const totalAssets = calculateTotalAssets(assets);
  const totalLiabilities = calculateTotalLiabilities(liabilities);
  const netWorth = calculateNetWorth(totalAssets, totalLiabilities);

  const { liquid, semiLiquid, illiquid } = calculateLiquidAssets(assets);

  const monthlyMap = aggregateMonthlyCashFlows(transactions, snapshotDate);
  const {
    monthlyIncome,
    monthlyConsumption,
    monthlyDebtService,
    monthlyWealthBuilding,
    freeCashFlow,
    savingsRate,
    wealthBuildingRate
  } = calculateRecentMonthlyAverages(monthlyMap, 6);

  // Ratios
  const debtToAssetRatio = totalAssets > 0 ? Math.round((totalLiabilities / totalAssets) * 1000) / 10 : 0;
  const debtServiceToIncomeRatio = monthlyIncome > 0 ? Math.round((monthlyDebtService / monthlyIncome) * 1000) / 10 : 0;

  // Liquidity runway = Liquid Assets / Total Monthly Non-Discretionary Obligations (Consumption + Debt Service)
  const monthlyObligations = monthlyConsumption + monthlyDebtService;
  const liquidityRunwayMonths = monthlyObligations > 0
    ? Math.round((liquid / monthlyObligations) * 10) / 10
    : 99.9;

  const topAssetConcentration = calculateAssetConcentration(assets, totalAssets);

  return {
    snapshotDate,
    totalAssets,
    totalLiabilities,
    netWorth,
    liquidAssets: liquid,
    semiLiquidAssets: semiLiquid,
    illiquidAssets: illiquid,
    monthlyIncome,
    monthlyConsumption,
    monthlyDebtService,
    monthlyWealthBuilding,
    freeCashFlow,
    savingsRate,
    wealthBuildingRate,
    debtToAssetRatio,
    debtServiceToIncomeRatio,
    liquidityRunwayMonths,
    topAssetConcentration,
    healthScore: 0, // Will be injected by scoring module
    resilienceScore: 0,
    dataConfidence: 0
  };
}
