/**
 * Vantage Financial Intelligence — Canonical Internal Models
 * "Normalize once. Validate once. Calculate once. Reuse everywhere."
 */

export type TransactionClassification =
  | 'INCOME'
  | 'CONSUMPTION'
  | 'DEBT_SERVICE'
  | 'WEALTH_BUILDING'
  | 'TRANSFER'
  | 'REFUND'
  | 'ADJUSTMENT'
  | 'UNKNOWN';

export type RecordStatus =
  | 'VALID'
  | 'WARNING'
  | 'EXACT_DUPLICATE'
  | 'REUSED_ID'
  | 'FUTURE_DATED'
  | 'OUTLIER'
  | 'MALFORMED'
  | 'AMBIGUOUS';

export interface CanonicalTransaction {
  id: string;
  date: string | null; // ISO YYYY-MM-DD
  description: string | null;
  category: string | null;
  amount: number; // positive number
  transactionType: 'income' | 'expense' | 'transfer' | 'unknown';
  classification: TransactionClassification;
  status: RecordStatus;
  statusNotes?: string[];
  rawRow?: Record<string, string>;
}

export type AssetLiquidity = 'liquid' | 'semi-liquid' | 'illiquid';

export interface CanonicalAsset {
  id: string;
  name: string;
  category: string;
  value: number;
  asOfDate: string;
  liquidity: AssetLiquidity;
}

export interface CanonicalLiability {
  id: string;
  name: string;
  category: string;
  outstandingAmount: number;
  interestRate: number; // e.g. 8.35 for 8.35%
  emi: number;
  dueDate?: string;
}

export interface FinancialState {
  snapshotDate: string;

  // Balance sheet
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  liquidAssets: number;
  semiLiquidAssets: number;
  illiquidAssets: number;

  // Monthly cash flow averages (recent normalized)
  monthlyIncome: number;
  monthlyConsumption: number;
  monthlyDebtService: number;
  monthlyWealthBuilding: number; // Investments / SIP
  freeCashFlow: number; // Income - Consumption - DebtService
  savingsRate: number; // (WealthBuilding + FreeCashFlow) / Income
  wealthBuildingRate: number; // WealthBuilding / Income

  // Balance sheet ratios
  debtToAssetRatio: number; // Total Liabilities / Total Assets
  debtServiceToIncomeRatio: number; // Monthly Debt Service / Monthly Income
  liquidityRunwayMonths: number; // Liquid Assets / (Consumption + Debt Service)
  topAssetConcentration: {
    assetName: string;
    category: string;
    value: number;
    percentage: number;
  };

  // Scores (0-100)
  healthScore: number;
  resilienceScore: number;
  dataConfidence: number;
}

export interface ScoreComponentBreakdown {
  score: number; // 0-100
  weight: number; // percentage
  weightedContribution: number;
  status: 'excellent' | 'good' | 'moderate' | 'concerning' | 'critical';
  benchmark: string;
  explanation: string;
  positiveFactors: string[];
  negativeFactors: string[];
  evidence: {
    metric: string;
    value: string;
    calculation: string;
  };
}

export interface FinancialHealthBreakdown {
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
  components: {
    liquidityResilience: ScoreComponentBreakdown;
    debtRisk: ScoreComponentBreakdown;
    cashFlowStrength: ScoreComponentBreakdown;
    wealthGrowth: ScoreComponentBreakdown;
    wealthConcentration: ScoreComponentBreakdown;
    behavioralStability: ScoreComponentBreakdown;
  };
  keyPositiveFactors: string[];
  keyRiskFactors: string[];
}

export interface FinancialAnomaly {
  id: string;
  transactionId?: string;
  date: string;
  title: string;
  description: string;
  category: string;
  amount?: number;
  baseline?: number;
  deviationMultiple?: number;
  severity: 'low' | 'medium' | 'high';
  type: 'STATISTICAL_OUTLIER' | 'FUTURE_DATE' | 'NEGATIVE_AMOUNT' | 'DUPLICATE' | 'REUSED_ID' | 'UNUSUAL_EXPENSE';
  evidence: {
    statement: string;
    metricComparison: string;
    supportingIds: string[];
  };
}

export interface EvidenceItem {
  claim: string;
  metric: string;
  value: string;
  calculation: string;
  sourceRecords?: {
    type: 'transaction' | 'asset' | 'liability';
    id: string;
    details: string;
  }[];
  confidence: number; // 0-100
}

export interface ActionRecommendation {
  id: string;
  priority: number; // 1, 2, 3...
  title: string;
  urgency: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  category: 'DEBT_OPTIMIZATION' | 'LIQUIDITY_BUFFER' | 'INVESTMENT_EFFICIENCY' | 'EXPENSE_CONTROL';
  reason: string;
  actionSteps: string[];
  affectedMetrics: string[];
  projectedBenefit: string;
  evidence: EvidenceItem;
}

export interface WhatChangedInsight {
  id: string;
  area: 'INCOME' | 'CONSUMPTION' | 'WEALTH_BUILDING' | 'DEBT' | 'CATEGORY';
  title: string;
  description: string;
  direction: 'increase' | 'decrease' | 'neutral';
  materiality: 'high' | 'medium' | 'low';
  currentPeriodValue: number;
  previousPeriodValue: number;
  absoluteChange: number;
  percentageChange: number;
  evidence: string;
}

export interface ScenarioInput {
  scenarioType:
    | 'PAY_OFF_HIGH_INTEREST_DEBT'
    | 'INCREASE_SIP'
    | 'INCOME_SHOCK'
    | 'EXPENSE_SURGE'
    | 'PURCHASE_ASSET'
    | 'CUSTOM';
  liabilityIdToPayOff?: string;
  monthlySipIncrease?: number;
  incomeReductionPercent?: number; // e.g. 25 for 25%
  expenseIncreasePercent?: number; // e.g. 20 for 20%
  assetPurchase?: {
    name: string;
    category: string;
    value: number;
    fundingSource: 'cash' | 'debt' | 'mixed';
    cashUsed: number;
    debtAmount: number;
    debtInterestRate: number;
    monthlyEmi: number;
  };
}

export interface ScenarioResult {
  scenarioName: string;
  description: string;
  assumptions: string[];
  baseline: FinancialState;
  scenario: FinancialState;
  deltas: {
    netWorthChange: number;
    liquidAssetsChange: number;
    monthlyFreeCashFlowChange: number;
    liquidityRunwayChangeMonths: number;
    debtToAssetRatioChange: number;
    healthScoreChange: number;
    resilienceScoreChange: number;
  };
  verdict: 'beneficial' | 'caution' | 'high_risk' | 'neutral';
  recommendationExplanation: string;
}

export interface DataQualityReport {
  totalTransactionsIngested: number;
  validTransactions: number;
  warningsCount: number;
  exactDuplicatesCount: number;
  reusedIdsCount: number;
  futureDatedCount: number;
  statisticalOutliersCount: number;
  missingFieldsCount: number;
  confidenceScore: number; // 0-100
  detectedSchemas: {
    transactions: { detected: boolean; confidence: number; mappedColumns: Record<string, string> };
    assets: { detected: boolean; confidence: number; mappedColumns: Record<string, string> };
    liabilities: { detected: boolean; confidence: number; mappedColumns: Record<string, string> };
  };
  issues: {
    type: string;
    count: number;
    impact: string;
    sampleIds: string[];
  }[];
}
