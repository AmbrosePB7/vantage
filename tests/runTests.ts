/**
 * Vantage Financial Intelligence — Automated Test Suite
 * Verifies Ingestion, Normalization, Validation, Analytics, Scoring, Recommendations, and Scenarios.
 */

import { parseCsv, cleanHeader, normalizeAmount, normalizeDate, detectDatasetType } from '../src/engine/ingestion';
import { validateAndNormalizeTransactions, validateAndNormalizeAssets, validateAndNormalizeLiabilities } from '../src/engine/validation';
import { buildFinancialState, calculateLiquidAssets } from '../src/engine/analytics';
import { calculateFinancialHealthScore, calculateResilienceScore, calculateDataConfidenceScore } from '../src/engine/scoring';
import { generateTopRecommendations } from '../src/engine/recommendations';
import { simulateScenario } from '../src/engine/scenarios';
import { DEFAULT_ASSETS_CSV, DEFAULT_LIABILITIES_CSV, SAMPLE_DEBIT_CREDIT_TRANSACTIONS, SAMPLE_MERCHANT_VALUE_TRANSACTIONS } from '../src/engine/defaultData';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${testName}`);
  } else {
    failed++;
    console.error(`  ✗ ${testName} ${detail ? `- ${detail}` : ''}`);
  }
}

console.log('=== VANTAGE TEST SUITE ===\n');

// 1. Ingestion & Header Normalization Tests
console.log('1. Ingestion & Normalization:');
assert(cleanHeader('Transaction ID') === 'transaction_id', 'Normalizes spaces to underscores');
assert(cleanHeader('Amount (INR)') === 'amount_inr', 'Cleans special punctuation and brackets');
assert(cleanHeader('  Txn Date  ') === 'txn_date', 'Trims whitespace');

// Amount normalization
const amt1 = normalizeAmount('₹50,000');
assert(amt1.amount === 50000 && amt1.isValid && !amt1.isNegative, 'Normalizes INR currency symbol "₹50,000" to 50000');
const amt2 = normalizeAmount('1,00,000');
assert(amt2.amount === 100000 && amt2.isValid, 'Correctly parses Indian lakh format "1,00,000" to 100000 without truncating');
const amt3 = normalizeAmount('-4500');
assert(amt3.amount === 4500 && amt3.isNegative, 'Detects negative sign');
const amt4 = normalizeAmount('(1500)');
assert(amt4.amount === 1500 && amt4.isNegative, 'Parses accounting brackets (1500)');

// Date normalization
const dt1 = normalizeDate('2026-10-01');
assert(dt1.isoDate === '2026-10-01' && dt1.isValid, 'Parses ISO YYYY-MM-DD');
const dt2 = normalizeDate('2026/06/15');
assert(dt2.isoDate === '2026-06-15' && dt2.isValid, 'Parses slash format YYYY/06/15');
const dt3 = normalizeDate('01-10-2026');
assert(dt3.isoDate === '2026-10-01' && dt3.isValid, 'Parses DD-MM-YYYY');

// 2. Schema Auto-Detection Tests
console.log('\n2. Schema Auto-Detection on Diverse Formats:');
const pDebitCredit = parseCsv(SAMPLE_DEBIT_CREDIT_TRANSACTIONS);
const det1 = detectDatasetType(pDebitCredit.headers, pDebitCredit.rows);
assert(det1.datasetType === 'TRANSACTIONS', 'Auto-detects Debit/Credit bank format as TRANSACTIONS');

const pMerchantVal = parseCsv(SAMPLE_MERCHANT_VALUE_TRANSACTIONS);
const det2 = detectDatasetType(pMerchantVal.headers, pMerchantVal.rows);
assert(det2.datasetType === 'TRANSACTIONS', 'Auto-detects Merchant/Value format as TRANSACTIONS');

const pAssets = parseCsv(DEFAULT_ASSETS_CSV);
const detAssets = detectDatasetType(pAssets.headers, pAssets.rows);
assert(detAssets.datasetType === 'ASSETS', 'Auto-detects Asset portfolio schema as ASSETS');

const pLiab = parseCsv(DEFAULT_LIABILITIES_CSV);
const detLiab = detectDatasetType(pLiab.headers, pLiab.rows);
assert(detLiab.datasetType === 'LIABILITIES', 'Auto-detects Liabilities schema as LIABILITIES');

// 3. Validation & Quality Checks
console.log('\n3. Data Validation & Issue Classification:');
const txRaw = fs.readFileSync(path.resolve(process.cwd(), 'data/transactions.csv'), 'utf-8');
const pTx = parseCsv(txRaw);
assert(pTx.rows.length === 817, `Parsed all 817 rows from challenge dataset (got ${pTx.rows.length})`);

const txVal = validateAndNormalizeTransactions(pTx, '2026-10-01');
assert(txVal.stats.duplicates >= 1, `Detected duplicate records (found ${txVal.stats.duplicates})`);
assert(txVal.stats.reusedIds >= 1, `Detected reused IDs (found ${txVal.stats.reusedIds})`);
assert(txVal.stats.futureDated >= 1, `Detected future-dated transactions (found ${txVal.stats.futureDated})`);
assert(txVal.stats.outliers >= 1, `Detected statistical outliers (found ${txVal.stats.outliers})`);

// 4. Analytics & Deterministic Calculations
console.log('\n4. Financial Analytics Engine:');
const assetVal = validateAndNormalizeAssets(pAssets);
const liabVal = validateAndNormalizeLiabilities(pLiab);

const state = buildFinancialState(assetVal.records, liabVal.records, txVal.records, '2026-10-01');

// Assets: 325k+85k+450k+625k+410k+280k+650k+4200k = 7,025,000
assert(state.totalAssets === 7025000, `Calculates total assets accurately: ₹${state.totalAssets} (expected 7,025,000)`);
// Liabilities: 2850000 + 420000 + 68000 = 3,338,000
assert(state.totalLiabilities === 3338000, `Calculates total liabilities accurately: ₹${state.totalLiabilities} (expected 3,338,000)`);
// Net worth: 7,025,000 - 3,338,000 = 3,687,000
assert(state.netWorth === 3687000, `Calculates net worth accurately: ₹${state.netWorth} (expected 3,687,000)`);

// Liquid assets: Savings (325k) + Current (85k) + FD (450k) = 860,000
assert(state.liquidAssets === 860000, `Identifies liquid assets accurately: ₹${state.liquidAssets} (expected 860,000)`);
assert(state.liquidityRunwayMonths >= 3, `Calculates runway accurately: ${state.liquidityRunwayMonths} months`);
assert(state.monthlyIncome > 200000, `Computes monthly income average accurately: ₹${state.monthlyIncome}`);
assert(state.freeCashFlow > 50000, `Computes positive free cash flow: ₹${state.freeCashFlow}`);

// 5. Scoring & Explainability
console.log('\n5. Scoring Engine:');
const health = calculateFinancialHealthScore(state, liabVal.records, assetVal.records, txVal.records);
state.healthScore = health.overallScore;
assert(health.overallScore >= 60 && health.overallScore <= 95, `Health score calculated in valid range: ${health.overallScore}/100`);
assert(health.components.liquidityResilience.score > 0, 'Liquidity component calculated');
assert(health.components.debtRisk.score > 0, 'Debt component calculated');
assert(health.components.cashFlowStrength.score > 0, 'Cash flow component calculated');

const resilience = calculateResilienceScore(state);
state.resilienceScore = resilience;
assert(resilience >= 60 && resilience <= 100, `Resilience score calculated: ${resilience}/100`);

const confidence = calculateDataConfidenceScore(
  txVal.stats.total,
  txVal.stats.valid,
  txVal.stats.duplicates,
  txVal.stats.outliers,
  txVal.stats.reusedIds,
  txVal.stats.futureDated,
  24
);
assert(confidence >= 70 && confidence <= 100, `Data confidence calculated: ${confidence}/100`);

// 6. Recommendation Prioritization
console.log('\n6. Recommendations:');
const recs = generateTopRecommendations(state, liabVal.records, assetVal.records);
assert(recs.length >= 2, `Generated prioritized recommendations: ${recs.length}`);
assert(recs[0].id === 'rec-payoff-credit-card', 'Priority 1 correctly targets 32% high-cost credit card debt');
assert(recs[0].evidence.claim.includes('Highest-interest'), 'Recommendation contains traceable evidence');

// 7. What-If / Decision Simulation
console.log('\n7. Decision Simulator:');
const simDebt = simulateScenario(state, assetVal.records, liabVal.records, txVal.records, {
  scenarioType: 'PAY_OFF_HIGH_INTEREST_DEBT',
  liabilityIdToPayOff: 'L003'
});
assert(simDebt.scenario.totalLiabilities === state.totalLiabilities - 68000, 'Liability balance drops by exactly ₹68,000');
assert(simDebt.scenario.liquidAssets === state.liquidAssets - 68000, 'Liquid assets drops by payoff amount');
assert(simDebt.scenario.netWorth === state.netWorth, 'Net worth is preserved (cash traded for liability cancellation)');
assert(simDebt.scenario.freeCashFlow === state.freeCashFlow + 7000, 'Free cash flow gains ₹7,000/mo EMI elimination');
assert(simDebt.deltas.healthScoreChange > 0, `Health score improves (+${simDebt.deltas.healthScoreChange} pts)`);

console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);

if (failed > 0) {
  process.exit(1);
}
