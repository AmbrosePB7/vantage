/**
 * Vantage Financial Intelligence — Platform Manager & Orchestrator
 * Exposes clean, centralized interfaces for both Express API routes and frontend direct access.
 */

import {
  ActionRecommendation,
  CanonicalAsset,
  CanonicalLiability,
  CanonicalTransaction,
  DataQualityReport,
  FinancialAnomaly,
  FinancialHealthBreakdown,
  FinancialState,
  ScenarioInput,
  ScenarioResult,
  WhatChangedInsight
} from './models';
import { detectDatasetType, parseCsv } from './ingestion';
import {
  validateAndNormalizeAssets,
  validateAndNormalizeLiabilities,
  validateAndNormalizeTransactions
} from './validation';
import {
  aggregateMonthlyCashFlows,
  buildFinancialState,
  calculateCategoryBreakdown,
  CategoryBreakdown,
  MonthlyCashFlowSummary
} from './analytics';
import {
  calculateDataConfidenceScore,
  calculateFinancialHealthScore,
  calculateResilienceScore
} from './scoring';
import { generateWhatChangedInsights } from './trends';
import { detectFinancialAnomalies } from './anomalies';
import { generateTopRecommendations } from './recommendations';
import { simulateScenario } from './scenarios';
import { askVantageCopilot, CopilotResponse } from './copilot';

export class VantagePlatform {
  private assets: CanonicalAsset[] = [];
  private liabilities: CanonicalLiability[] = [];
  private transactions: CanonicalTransaction[] = [];
  private snapshotDate: string = '2026-10-01';

  private financialState!: FinancialState;
  private healthBreakdown!: FinancialHealthBreakdown;
  private monthlyCashFlows: Map<string, MonthlyCashFlowSummary> = new Map();
  private categoryBreakdowns: CategoryBreakdown[] = [];
  private whatChangedInsights: WhatChangedInsight[] = [];
  private anomalies: FinancialAnomaly[] = [];
  private recommendations: ActionRecommendation[] = [];
  private dataQualityReport!: DataQualityReport;

  constructor() {
    // Initialized via initializeWithCsv or initializeDefault
  }

  public initialize(
    transactionsCsv: string,
    assetsCsv: string,
    liabilitiesCsv: string,
    snapshotDate: string = '2026-10-01'
  ) {
    this.snapshotDate = snapshotDate;

    // 1. Ingest & Validate Assets
    const parsedAssets = parseCsv(assetsCsv);
    const assetValidation = validateAndNormalizeAssets(parsedAssets);
    this.assets = assetValidation.records;

    // 2. Ingest & Validate Liabilities
    const parsedLiab = parseCsv(liabilitiesCsv);
    const liabValidation = validateAndNormalizeLiabilities(parsedLiab);
    this.liabilities = liabValidation.records;

    // 3. Ingest & Validate Transactions
    const parsedTx = parseCsv(transactionsCsv);
    const txValidation = validateAndNormalizeTransactions(parsedTx, snapshotDate);
    this.transactions = txValidation.records;

    // Schema detection stats
    const txSchema = detectDatasetType(parsedTx.headers, parsedTx.rows);
    const assetSchema = detectDatasetType(parsedAssets.headers, parsedAssets.rows);
    const liabSchema = detectDatasetType(parsedLiab.headers, parsedLiab.rows);

    // 4. Calculate Core Financial Engine State
    this.financialState = buildFinancialState(
      this.assets,
      this.liabilities,
      this.transactions,
      this.snapshotDate
    );

    // 5. Aggregate Monthly Cash Flows & Categories
    this.monthlyCashFlows = aggregateMonthlyCashFlows(this.transactions, this.snapshotDate);
    this.categoryBreakdowns = calculateCategoryBreakdown(this.transactions, this.snapshotDate);

    // 6. Trends & What Changed
    this.whatChangedInsights = generateWhatChangedInsights(this.transactions, this.snapshotDate);

    // 7. Anomalies
    this.anomalies = detectFinancialAnomalies(this.transactions, this.snapshotDate);

    // 8. Scoring
    this.healthBreakdown = calculateFinancialHealthScore(
      this.financialState,
      this.liabilities,
      this.assets,
      this.transactions
    );
    this.financialState.healthScore = this.healthBreakdown.overallScore;

    this.financialState.resilienceScore = calculateResilienceScore(this.financialState);

    const distinctMonths = this.monthlyCashFlows.size;
    this.financialState.dataConfidence = calculateDataConfidenceScore(
      txValidation.stats.total,
      txValidation.stats.valid,
      txValidation.stats.duplicates,
      txValidation.stats.outliers,
      txValidation.stats.reusedIds,
      txValidation.stats.futureDated,
      distinctMonths
    );

    // 9. Recommendations
    this.recommendations = generateTopRecommendations(
      this.financialState,
      this.liabilities,
      this.assets
    );

    // 10. Data Quality Report
    this.dataQualityReport = {
      totalTransactionsIngested: txValidation.stats.total,
      validTransactions: txValidation.stats.valid,
      warningsCount: txValidation.stats.warnings,
      exactDuplicatesCount: txValidation.stats.duplicates,
      reusedIdsCount: txValidation.stats.reusedIds,
      futureDatedCount: txValidation.stats.futureDated,
      statisticalOutliersCount: txValidation.stats.outliers,
      missingFieldsCount: txValidation.issues.filter((i) => i.type === 'MISSING_CATEGORY').length,
      confidenceScore: this.financialState.dataConfidence,
      detectedSchemas: {
        transactions: {
          detected: txSchema.datasetType === 'TRANSACTIONS',
          confidence: txSchema.confidence,
          mappedColumns: txSchema.mappedColumns
        },
        assets: {
          detected: assetSchema.datasetType === 'ASSETS',
          confidence: assetSchema.confidence,
          mappedColumns: assetSchema.mappedColumns
        },
        liabilities: {
          detected: liabSchema.datasetType === 'LIABILITIES',
          confidence: liabSchema.confidence,
          mappedColumns: liabSchema.mappedColumns
        }
      },
      issues: [
        {
          type: 'EXACT_DUPLICATES',
          count: txValidation.stats.duplicates,
          impact: 'Excluded from monthly cash flow averages to prevent double-counting',
          sampleIds: txValidation.issues.filter((i) => i.type === 'EXACT_DUPLICATE').slice(0, 3).map((i) => i.recordId || '')
        },
        {
          type: 'REUSED_IDS',
          count: txValidation.stats.reusedIds,
          impact: 'Preserved as distinct transaction entries using payload fingerprinting',
          sampleIds: txValidation.issues.filter((i) => i.type === 'REUSED_ID').slice(0, 3).map((i) => i.recordId || '')
        },
        {
          type: 'FUTURE_DATED',
          count: txValidation.stats.futureDated,
          impact: 'Isolated from current financial snapshot date (2026-10-01)',
          sampleIds: txValidation.issues.filter((i) => i.type === 'FUTURE_TRANSACTION').slice(0, 3).map((i) => i.recordId || '')
        },
        {
          type: 'STATISTICAL_OUTLIERS',
          count: txValidation.stats.outliers,
          impact: 'Flagged for user audit (e.g. ₹1.85L mobile phone charge vs typical ₹900)',
          sampleIds: txValidation.issues.filter((i) => i.type === 'STATISTICAL_OUTLIER').slice(0, 3).map((i) => i.recordId || '')
        }
      ]
    };
  }

  // API Accessors
  public getOverview() {
    const highestDebt = [...this.liabilities].sort((a, b) => b.interestRate - a.interestRate)[0];

    return {
      financialHealthScore: this.financialState.healthScore,
      healthGrade: this.healthBreakdown.grade,
      healthSummary: this.healthBreakdown.summary,
      netWorth: this.financialState.netWorth,
      totalAssets: this.financialState.totalAssets,
      totalLiabilities: this.financialState.totalLiabilities,
      liquidAssets: this.financialState.liquidAssets,
      liquidityRunwayMonths: this.financialState.liquidityRunwayMonths,
      monthlyIncome: this.financialState.monthlyIncome,
      monthlyConsumption: this.financialState.monthlyConsumption,
      monthlyDebtService: this.financialState.monthlyDebtService,
      monthlyWealthBuilding: this.financialState.monthlyWealthBuilding,
      monthlyFreeCashFlow: this.financialState.freeCashFlow,
      resilienceScore: this.financialState.resilienceScore,
      dataConfidenceScore: this.financialState.dataConfidence,
      snapshotDate: this.snapshotDate,

      biggestRisk: {
        title: `High-Cost Debt: ${highestDebt?.name || 'Revolving Credit'}`,
        description: `${highestDebt?.name || 'Debt'} carries a high interest rate of ${highestDebt?.interestRate || 0}% APR with an outstanding balance of ₹${(highestDebt?.outstandingAmount || 0).toLocaleString('en-IN')}.`,
        severity: 'high'
      },
      nextBestAction: this.recommendations[0] || null,
      whatChangedSummary: this.whatChangedInsights.slice(0, 3),
      scoreComponents: this.healthBreakdown.components
    };
  }

  public getWealth() {
    return {
      totalAssets: this.financialState.totalAssets,
      totalLiabilities: this.financialState.totalLiabilities,
      netWorth: this.financialState.netWorth,
      debtToAssetRatio: this.financialState.debtToAssetRatio,
      liquidAssets: this.financialState.liquidAssets,
      semiLiquidAssets: this.financialState.semiLiquidAssets,
      illiquidAssets: this.financialState.illiquidAssets,
      assets: this.assets,
      liabilities: this.liabilities,
      topAssetConcentration: this.financialState.topAssetConcentration
    };
  }

  public getCashFlow() {
    const monthlyList = Array.from(this.monthlyCashFlows.values()).sort((a, b) => a.month.localeCompare(b.month));
    return {
      averages: {
        monthlyIncome: this.financialState.monthlyIncome,
        monthlyConsumption: this.financialState.monthlyConsumption,
        monthlyDebtService: this.financialState.monthlyDebtService,
        monthlyWealthBuilding: this.financialState.monthlyWealthBuilding,
        monthlyFreeCashFlow: this.financialState.freeCashFlow,
        savingsRate: this.financialState.savingsRate,
        wealthBuildingRate: this.financialState.wealthBuildingRate
      },
      monthlyHistory: monthlyList,
      categories: this.categoryBreakdowns
    };
  }

  public getTrends() {
    return {
      whatChanged: this.whatChangedInsights,
      monthlyHistory: Array.from(this.monthlyCashFlows.values()).sort((a, b) => a.month.localeCompare(b.month))
    };
  }

  public getRisks() {
    return {
      resilienceScore: this.financialState.resilienceScore,
      debtRisk: {
        debtToAssetRatio: this.financialState.debtToAssetRatio,
        debtServiceToIncomeRatio: this.financialState.debtServiceToIncomeRatio,
        totalDebt: this.financialState.totalLiabilities,
        highestInterestLiability: [...this.liabilities].sort((a, b) => b.interestRate - a.interestRate)[0] || null
      },
      liquidityRisk: {
        liquidAssets: this.financialState.liquidAssets,
        runwayMonths: this.financialState.liquidityRunwayMonths,
        monthlyObligations: this.financialState.monthlyConsumption + this.financialState.monthlyDebtService
      },
      concentrationRisk: this.financialState.topAssetConcentration,
      anomalies: this.anomalies
    };
  }

  public getAnomalies() {
    return this.anomalies;
  }

  public getRecommendations() {
    return this.recommendations;
  }

  public getDataQuality() {
    return this.dataQualityReport;
  }

  public getTransactions(limit: number = 100, filterStatus?: string, search?: string) {
    let list = this.transactions;
    if (filterStatus && filterStatus !== 'ALL') {
      list = list.filter((t) => t.status === filterStatus);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (t) =>
          (t.description || '').toLowerCase().includes(q) ||
          (t.category || '').toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          (t.date || '').includes(q)
      );
    }
    return {
      total: list.length,
      transactions: list.slice(0, limit)
    };
  }

  public runScenario(input: ScenarioInput): ScenarioResult {
    return simulateScenario(
      this.financialState,
      this.assets,
      this.liabilities,
      this.transactions,
      input
    );
  }

  public async askCopilot(question: string, apiKey?: string): Promise<CopilotResponse> {
    return askVantageCopilot(
      question,
      this.financialState,
      this.healthBreakdown,
      this.liabilities,
      this.assets,
      this.recommendations,
      this.whatChangedInsights,
      apiKey
    );
  }
}

// Global singleton instance
export const platform = new VantagePlatform();
