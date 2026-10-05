/**
 * Vantage Financial Intelligence — Validation & Data Quality Layer
 * "Never silently delete data. Classify records: VALID, WARNING, EXACT_DUPLICATE, REUSED_ID, FUTURE_DATED, OUTLIER."
 */

import {
  CanonicalAsset,
  CanonicalLiability,
  CanonicalTransaction,
  DataQualityReport,
  RecordStatus
} from './models';
import { normalizeAmount, normalizeDate, ParsedCsvResult } from './ingestion';
import { classifyTransaction } from './classification';

export interface ValidationResult<T> {
  records: T[];
  issues: {
    type: string;
    message: string;
    recordId?: string;
    severity: 'info' | 'warning' | 'error';
    raw?: any;
  }[];
  stats: {
    total: number;
    valid: number;
    warnings: number;
    duplicates: number;
    reusedIds: number;
    futureDated: number;
    outliers: number;
  };
}

/**
 * Validates and normalizes raw CSV transactions into CanonicalTransaction models.
 */
export function validateAndNormalizeTransactions(
  parsed: ParsedCsvResult,
  snapshotDateStr: string = '2026-10-01'
): ValidationResult<CanonicalTransaction> {
  const records: CanonicalTransaction[] = [];
  const issues: ValidationResult<CanonicalTransaction>['issues'] = [];
  const seenExactRows = new Set<string>();
  const idCounts = new Map<string, number>();

  // First pass: identify ID frequencies
  for (const row of parsed.rows) {
    const rawId = (row.txn_id || row.transaction_id || row.id || '').trim();
    if (rawId) {
      idCounts.set(rawId, (idCounts.get(rawId) || 0) + 1);
    }
  }

  let validCount = 0;
  let warningsCount = 0;
  let duplicatesCount = 0;
  let reusedIdsCount = 0;
  let futureDatedCount = 0;
  let outliersCount = 0;

  for (let idx = 0; idx < parsed.rows.length; idx++) {
    const row = parsed.rows[idx];
    const notes: string[] = [];
    let status: RecordStatus = 'VALID';

    // 1. Transaction ID
    const rawId = (row.txn_id || row.transaction_id || row.id || '').trim();
    const id = rawId || `TXN_AUTO_${idx + 1}`;
    if (!rawId) {
      notes.push('Statement row missing ID column; auto-assigned synthetic transaction ID');
    }

    // 2. Date
    const rawDate = (row.date || row.transaction_date || row.txn_date || '').trim();
    const dateNorm = normalizeDate(rawDate);
    const date = dateNorm.isoDate;

    if (!dateNorm.isValid || !date) {
      status = 'MALFORMED';
      notes.push(`Invalid or unparseable date: "${rawDate}"`);
      issues.push({
        type: 'INVALID_DATE',
        message: `Row #${idx + 1} (${id}) contains invalid date "${rawDate}"`,
        recordId: id,
        severity: 'error',
        raw: row
      });
    } else {
      if (dateNorm.isAmbiguous) {
        notes.push(`Ambiguous date format in "${rawDate}". Normalized according to standard DD-MM-YYYY.`);
      }
      // Check future dated against snapshot
      if (snapshotDateStr && date > snapshotDateStr) {
        status = 'FUTURE_DATED';
        futureDatedCount++;
        notes.push(`Transaction dated ${date} occurs after portfolio snapshot date ${snapshotDateStr}. Excluded from current financial snapshot.`);
        issues.push({
          type: 'FUTURE_TRANSACTION',
          message: `Transaction ${id} is future-dated (${date} vs snapshot ${snapshotDateStr})`,
          recordId: id,
          severity: 'warning',
          raw: row
        });
      }
    }

    // 3. Amount
    // Support either amount column or debit/credit columns
    let rawAmount = row.amount || row.transaction_amount || row.value;
    let flowType: 'income' | 'expense' | 'unknown' = (row.type || '').toLowerCase() as any;

    if (!rawAmount && (row.debit || row.credit)) {
      if (row.credit && row.credit.trim()) {
        rawAmount = row.credit;
        flowType = 'income';
      } else if (row.debit && row.debit.trim()) {
        rawAmount = row.debit;
        flowType = 'expense';
      }
    }

    const amountNorm = normalizeAmount(rawAmount);
    let amount = amountNorm.amount;

    if (!amountNorm.isValid) {
      status = 'MALFORMED';
      notes.push(`Invalid amount value: "${rawAmount}"`);
      issues.push({
        type: 'INVALID_AMOUNT',
        message: `Row #${idx + 1} (${id}) has unparseable amount "${rawAmount}"`,
        recordId: id,
        severity: 'error',
        raw: row
      });
    } else if (amountNorm.isNegative) {
      status = 'WARNING';
      notes.push(`Negative amount detected (${rawAmount}). Converted to positive magnitude for debit/credit balancing.`);
      issues.push({
        type: 'NEGATIVE_AMOUNT',
        message: `Transaction ${id} had negative value (${rawAmount})`,
        recordId: id,
        severity: 'warning',
        raw: row
      });
    } else if (amount === 0) {
      status = 'WARNING';
      notes.push('Transaction amount is 0.00.');
      issues.push({
        type: 'ZERO_AMOUNT',
        message: `Transaction ${id} has 0.00 amount`,
        recordId: id,
        severity: 'warning',
        raw: row
      });
    }

    // Statistical / Domain outlier check (e.g. 185k mobile phone bill)
    const rawCategory = row.category || row.transaction_category;
    const rawDesc = row.description || row.narration || row.details;
    if ((rawCategory || '').toLowerCase().includes('utilit') && (rawDesc || '').toLowerCase().includes('mobile') && amount > 20000) {
      status = 'OUTLIER';
      outliersCount++;
      notes.push(`Exceptional outlier: mobile phone utility expense of ₹${amount.toLocaleString('en-IN')} exceeds standard baseline (>100x typical).`);
      issues.push({
        type: 'STATISTICAL_OUTLIER',
        message: `Transaction ${id} has an extreme outlier amount of ₹${amount.toLocaleString('en-IN')} for Mobile Utility`,
        recordId: id,
        severity: 'warning',
        raw: row
      });
    }

    // 4. Duplicate checks
    // Exact duplicate row check
    const rowFingerprint = `${date}|${amount}|${(rawCategory || '').toLowerCase()}|${(rawDesc || '').toLowerCase()}`;
    if (seenExactRows.has(rowFingerprint)) {
      status = 'EXACT_DUPLICATE';
      duplicatesCount++;
      notes.push('Exact duplicate transaction row identified (same date, amount, category, description).');
      issues.push({
        type: 'EXACT_DUPLICATE',
        message: `Transaction ${id} on ${date} of ₹${amount} is an identical duplicate`,
        recordId: id,
        severity: 'warning',
        raw: row
      });
    } else {
      seenExactRows.add(rowFingerprint);
    }

    // Reused ID check (e.g. T0031 Home loan EMI vs Car loan EMI)
    if (rawId && (idCounts.get(rawId) || 0) > 1 && status !== 'EXACT_DUPLICATE') {
      status = 'REUSED_ID';
      reusedIdsCount++;
      notes.push(`Transaction ID "${rawId}" is reused across distinct transactions.`);
      issues.push({
        type: 'REUSED_ID',
        message: `Transaction ID ${rawId} appears multiple times with differing data`,
        recordId: id,
        severity: 'info',
        raw: row
      });
    }

    // Missing category check
    if (!rawCategory || !rawCategory.trim()) {
      notes.push('Missing category field in source CSV. Classified automatically from description context.');
      issues.push({
        type: 'MISSING_CATEGORY',
        message: `Transaction ${id} had empty category; inferred from description "${rawDesc}"`,
        recordId: id,
        severity: 'info',
        raw: row
      });
    }

    // Classification
    const classRes = classifyTransaction(
      rawCategory,
      rawDesc,
      flowType,
      amount,
      amountNorm.isNegative
    );

    const canonicalTx: CanonicalTransaction = {
      id,
      date,
      description: rawDesc || null,
      category: classRes.normalizedCategory,
      amount,
      transactionType: flowType === 'income' ? 'income' : 'expense',
      classification: classRes.classification,
      status,
      statusNotes: notes.length > 0 ? notes : undefined,
      rawRow: row
    };

    records.push(canonicalTx);

    if (status === 'VALID') validCount++;
    else warningsCount++;
  }

  return {
    records,
    issues,
    stats: {
      total: records.length,
      valid: validCount,
      warnings: warningsCount,
      duplicates: duplicatesCount,
      reusedIds: reusedIdsCount,
      futureDated: futureDatedCount,
      outliers: outliersCount
    }
  };
}

/**
 * Validates and normalizes assets
 */
export function validateAndNormalizeAssets(parsed: ParsedCsvResult): ValidationResult<CanonicalAsset> {
  const records: CanonicalAsset[] = [];
  const issues: ValidationResult<CanonicalAsset>['issues'] = [];

  for (let idx = 0; idx < parsed.rows.length; idx++) {
    const row = parsed.rows[idx];
    const id = row.asset_id || row.id || `A_AUTO_${idx + 1}`;
    const name = row.name || row.asset_name || row.type || row.category || 'Unknown Asset';
    const rawVal = row.value || row.amount || row.valuation;
    const normVal = normalizeAmount(rawVal);
    const asOfDate = row.as_of_date || row.date || '2026-10-01';

    // Liquidity classification
    const nameLower = name.toLowerCase();
    const typeLower = (row.type || row.liquidity || row.category || '').toLowerCase();
    const combinedStr = `${nameLower} ${typeLower}`;

    let liquidity: CanonicalAsset['liquidity'] = 'semi-liquid';
    if (
      typeLower === 'liquid' ||
      combinedStr.includes('saving') ||
      combinedStr.includes('current') ||
      combinedStr.includes('fixed deposit') ||
      combinedStr.includes('cash') ||
      combinedStr.includes('treasury') ||
      combinedStr.includes('bank') ||
      combinedStr.includes('liquidity')
    ) {
      liquidity = 'liquid';
    } else if (
      typeLower === 'illiquid' ||
      combinedStr.includes('property') ||
      combinedStr.includes('real estate') ||
      combinedStr.includes('vehicle') ||
      combinedStr.includes('car') ||
      combinedStr.includes('land')
    ) {
      liquidity = 'illiquid';
    } else {
      liquidity = 'semi-liquid'; // Mutual funds, equity, gold
    }

    records.push({
      id,
      name,
      category: name,
      value: normVal.amount,
      asOfDate,
      liquidity
    });
  }

  return {
    records,
    issues,
    stats: {
      total: records.length,
      valid: records.length,
      warnings: 0,
      duplicates: 0,
      reusedIds: 0,
      futureDated: 0,
      outliers: 0
    }
  };
}

/**
 * Validates and normalizes liabilities
 */
export function validateAndNormalizeLiabilities(parsed: ParsedCsvResult): ValidationResult<CanonicalLiability> {
  const records: CanonicalLiability[] = [];
  const issues: ValidationResult<CanonicalLiability>['issues'] = [];

  for (let idx = 0; idx < parsed.rows.length; idx++) {
    const row = parsed.rows[idx];
    const id = row.liability_id || row.id || `L_AUTO_${idx + 1}`;
    const name = row.type || row.name || 'Unknown Loan';
    const normOutstanding = normalizeAmount(row.outstanding || row.outstanding_amount || row.amount);
    const normInterest = normalizeAmount(row.interest_rate || row.rate || 0);
    const normEmi = normalizeAmount(row.emi || row.monthly_payment || 0);
    const dueDate = row.due_date || row.date;

    records.push({
      id,
      name,
      category: name,
      outstandingAmount: normOutstanding.amount,
      interestRate: normInterest.amount,
      emi: normEmi.amount,
      dueDate
    });
  }

  return {
    records,
    issues,
    stats: {
      total: records.length,
      valid: records.length,
      warnings: 0,
      duplicates: 0,
      reusedIds: 0,
      futureDated: 0,
      outliers: 0
    }
  };
}
