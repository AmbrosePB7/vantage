/**
 * Automated Test: Dataset Switching & Multi-Dataset Output Integrity
 */
import { platform } from '../src/engine/vantageManager.ts';
import {
  DEFAULT_ASSETS_CSV,
  DEFAULT_LIABILITIES_CSV,
  SAMPLE_DEBIT_CREDIT_TRANSACTIONS,
  SAMPLE_MERCHANT_VALUE_TRANSACTIONS
} from '../src/engine/defaultData.ts';
import fs from 'fs';
import path from 'path';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

async function runDatasetSwitchingTests() {
  console.log('\n--- TEST SUITE 1: Original Challenge Dataset ---');
  const txCsv = fs.readFileSync(path.resolve(process.cwd(), 'data/transactions.csv'), 'utf-8');
  platform.initialize(txCsv, DEFAULT_ASSETS_CSV, DEFAULT_LIABILITIES_CSV, '2026-10-01');

  const ov1 = platform.getOverview();
  assert(ov1.netWorth === 3687000, `Challenge NAV correct: ₹${ov1.netWorth} (expected 36,87,000)`);
  assert(ov1.totalAssets === 7025000, `Challenge Assets: ₹${ov1.totalAssets} (expected 70,25,000)`);
  assert(ov1.totalLiabilities === 3338000, `Challenge Liabilities: ₹${ov1.totalLiabilities} (expected 33,38,000)`);
  assert(ov1.liquidAssets === 860000, `Challenge Liquid Treasury: ₹${ov1.liquidAssets}`);
  assert(ov1.liquidityRunwayMonths >= 3.5 && ov1.liquidityRunwayMonths <= 4.2, `Challenge Runway: ${ov1.liquidityRunwayMonths} months`);
  assert(ov1.financialHealthScore >= 70 && ov1.financialHealthScore <= 80, `Challenge Health Score: ${ov1.financialHealthScore}/100`);

  const copilotAns1 = await platform.askCopilot('What is my biggest financial risk?');
  assert(
    copilotAns1.answer.toLowerCase().includes('credit card') || copilotAns1.answer.includes('32'),
    `Copilot correctly identifies Credit card 32% APR risk on challenge dataset: ${copilotAns1.answer.slice(0, 80)}...`
  );

  console.log('\n--- TEST SUITE 2: Switching to HNW Family Office Portfolio (₹27 Cr NAV) ---');
  const HNW_ASSETS = `asset_id,name,value,type,date
A_HNW_1,Swiss Private Bank Liquidity,45000000,liquid,2026-10-01
A_HNW_2,Global Equities Portfolio,85000000,semi-liquid,2026-10-01
A_HNW_3,Private Equity & Venture Stakes,55000000,semi-liquid,2026-10-01
A_HNW_4,Commercial Real Estate Holdings,120000000,illiquid,2026-10-01`;

  const HNW_LIABILITIES = `liability_id,name,outstanding,interest_rate,emi
L_HNW_1,Commercial Lombard Facility,35000000,6.25,250000`;

  const HNW_TRANSACTIONS = `date,details,category,amount,flow
2026-07-01,Dividend Distribution,Income,3500000,income
2026-07-03,Family Office Operating Costs,Operations,850000,expense
2026-07-05,Lombard Interest Service,Debt Payment,250000,expense
2026-07-10,Direct Private Equity Call,Investments,1200000,expense
2026-08-01,Dividend Distribution,Income,3500000,income
2026-08-03,Family Office Operating Costs,Operations,850000,expense
2026-08-05,Lombard Interest Service,Debt Payment,250000,expense
2026-08-10,Direct Private Equity Call,Investments,1200000,expense
2026-09-01,Dividend Distribution,Income,3500000,income
2026-09-03,Family Office Operating Costs,Operations,850000,expense
2026-09-05,Lombard Interest Service,Debt Payment,250000,expense
2026-09-10,Direct Private Equity Call,Investments,1200000,expense`;

  platform.initialize(HNW_TRANSACTIONS, HNW_ASSETS, HNW_LIABILITIES, '2026-10-01');

  const ov2 = platform.getOverview();
  assert(ov2.totalAssets === 305000000, `HNW Assets correct: ₹${ov2.totalAssets} (30.5 Cr)`);
  assert(ov2.totalLiabilities === 35000000, `HNW Liabilities correct: ₹${ov2.totalLiabilities} (3.5 Cr)`);
  assert(ov2.netWorth === 270000000, `HNW NAV correct: ₹${ov2.netWorth} (27.0 Cr)`);
  assert(ov2.liquidAssets === 45000000, `HNW Liquid Treasury: ₹${ov2.liquidAssets} (4.5 Cr)`);
  assert(ov2.monthlyIncome === 3500000, `HNW Monthly Inflow: ₹${ov2.monthlyIncome} (35L)`);
  assert(ov2.liquidityRunwayMonths >= 30, `HNW Runway: ${ov2.liquidityRunwayMonths} months (ample runway)`);
  assert(ov2.financialHealthScore >= 80, `HNW Health Score: ${ov2.financialHealthScore}/100`);

  const wealth2 = platform.getWealth();
  assert(wealth2.assets.length === 4, `HNW assets loaded: ${wealth2.assets.length}`);
  assert(wealth2.liabilities.length === 1, `HNW liabilities loaded: ${wealth2.liabilities.length}`);

  const copilotAns2 = await platform.askCopilot('What is my Net Worth and portfolio standing?');
  assert(
    copilotAns2.answer.includes('27,00,00,000') || copilotAns2.answer.includes('27.0') || copilotAns2.answer.includes('270000000') || copilotAns2.answer.includes('Cr'),
    `Copilot dynamically switched to HNW facts: ${copilotAns2.answer.slice(0, 100)}...`
  );

  console.log('\n--- TEST SUITE 3: Switching to Debit/Credit Format CSV ---');
  platform.initialize(SAMPLE_DEBIT_CREDIT_TRANSACTIONS, DEFAULT_ASSETS_CSV, DEFAULT_LIABILITIES_CSV, '2026-10-01');
  const dq3 = platform.getDataQuality();
  assert(dq3.validTransactions > 0, `Debit/Credit format parsed successfully: ${dq3.validTransactions} valid txns`);
  const cf3 = platform.getCashFlow();
  assert(cf3.monthlyHistory.length > 0, `Cashflow computed from debit/credit schema`);

  console.log('\n--- TEST SUITE 4: Restoring Original Challenge Dataset ---');
  platform.initialize(txCsv, DEFAULT_ASSETS_CSV, DEFAULT_LIABILITIES_CSV, '2026-10-01');
  const ov4 = platform.getOverview();
  assert(ov4.netWorth === 3687000, `Successfully restored challenge dataset with ₹36.87L NAV`);

  console.log('\n🎉 ALL DATASET SWITCHING TESTS PASSED PERFECTLY!\n');
}

runDatasetSwitchingTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
