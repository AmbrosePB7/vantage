/**
 * Vantage Financial Intelligence — Anomaly Detection Engine
 * Explainable statistical & rule-based outlier detection.
 * "What happened? Why is it unusual? What was it compared against?"
 */

import { CanonicalTransaction, FinancialAnomaly } from './models';

export function detectFinancialAnomalies(
  transactions: CanonicalTransaction[],
  snapshotDate: string = '2026-10-01'
): FinancialAnomaly[] {
  const anomalies: FinancialAnomaly[] = [];

  // Group transactions by category to establish statistical medians and IQRs
  const amountsByCategory = new Map<string, number[]>();

  for (const tx of transactions) {
    if (tx.status === 'EXACT_DUPLICATE' || tx.status === 'MALFORMED') continue;
    const cat = tx.category || 'General';
    const list = amountsByCategory.get(cat) || [];
    list.push(tx.amount);
    amountsByCategory.set(cat, list);
  }

  // Calculate median & IQR for each category
  const statsByCategory = new Map<string, { median: number; q1: number; q3: number; iqr: number }>();
  for (const [cat, amounts] of amountsByCategory) {
    if (amounts.length < 4) continue;
    const sorted = [...amounts].sort((a, b) => a - b);
    const n = sorted.length;
    const median = sorted[Math.floor(n / 2)];
    const q1 = sorted[Math.floor(n * 0.25)];
    const q3 = sorted[Math.floor(n * 0.75)];
    const iqr = q3 - q1;
    statsByCategory.set(cat, { median, q1, q3, iqr });
  }

  // Scan transactions for anomalies
  for (const tx of transactions) {
    const cat = tx.category || 'General';
    const stats = statsByCategory.get(cat);

    // 1. Extreme Outlier Check (e.g. T0488: Mobile Utility ₹185,000 vs typical ₹900)
    if (stats && stats.median > 0) {
      const threshold = stats.q3 + Math.max(stats.iqr * 3, stats.median * 4);
      if (tx.amount > threshold && tx.amount > 10000) {
        const multiple = Math.round((tx.amount / stats.median) * 10) / 10;
        anomalies.push({
          id: `anomaly-outlier-${tx.id}`,
          transactionId: tx.id,
          date: tx.date || '',
          title: `Exceptional Outlier: ${tx.description || cat}`,
          description: `Transaction amount of ₹${tx.amount.toLocaleString('en-IN')} is ${multiple}x the median historical cost (₹${Math.round(stats.median).toLocaleString('en-IN')}) for ${cat}.`,
          category: cat,
          amount: tx.amount,
          baseline: Math.round(stats.median),
          deviationMultiple: multiple,
          severity: 'high',
          type: 'STATISTICAL_OUTLIER',
          evidence: {
            statement: `Transaction value ₹${tx.amount.toLocaleString('en-IN')} exceeds IQR upper bound threshold of ₹${Math.round(threshold).toLocaleString('en-IN')}.`,
            metricComparison: `Observed: ₹${tx.amount.toLocaleString('en-IN')} vs Category Median: ₹${Math.round(stats.median).toLocaleString('en-IN')}`,
            supportingIds: [tx.id]
          }
        });
      }
    }

    // 2. Future-dated transaction (e.g. T0277 dated 2026-11-15 vs snapshot 2026-10-01)
    if (tx.status === 'FUTURE_DATED' || (tx.date && snapshotDate && tx.date > snapshotDate)) {
      anomalies.push({
        id: `anomaly-future-${tx.id}`,
        transactionId: tx.id,
        date: tx.date || '',
        title: `Future-Dated Transaction: ${tx.description || cat}`,
        description: `Recorded transaction timestamp (${tx.date}) is ahead of the portfolio valuation date (${snapshotDate}). It has been quarantined from current cash flow averages.`,
        category: cat,
        amount: tx.amount,
        severity: 'medium',
        type: 'FUTURE_DATE',
        evidence: {
          statement: `Date ${tx.date} > Snapshot date ${snapshotDate}`,
          metricComparison: `Transaction timestamp is in the future relative to portfolio state`,
          supportingIds: [tx.id]
        }
      });
    }

    // 3. Exact Duplicate (e.g. T0410)
    if (tx.status === 'EXACT_DUPLICATE') {
      anomalies.push({
        id: `anomaly-dup-${tx.id}`,
        transactionId: tx.id,
        date: tx.date || '',
        title: `Duplicate Entry Detected: ${tx.description || cat}`,
        description: `Identical transaction on ${tx.date} for ₹${tx.amount.toLocaleString('en-IN')} appeared twice in the ledger. De-duplicated in analytics.`,
        category: cat,
        amount: tx.amount,
        severity: 'low',
        type: 'DUPLICATE',
        evidence: {
          statement: `Identical values for date, amount, description, and category`,
          metricComparison: `Duplicate row in source CSV`,
          supportingIds: [tx.id]
        }
      });
    }

    // 4. Reused ID (e.g. T0031 Home loan EMI vs Car loan EMI)
    if (tx.status === 'REUSED_ID') {
      anomalies.push({
        id: `anomaly-reused-${tx.id}-${tx.date}`,
        transactionId: tx.id,
        date: tx.date || '',
        title: `Identifier Conflict: ${tx.id}`,
        description: `Transaction ID ${tx.id} was reused for multiple different ledger entries ("${tx.description}"). Treated as distinct records based on payload fingerprint.`,
        category: cat,
        amount: tx.amount,
        severity: 'low',
        type: 'REUSED_ID',
        evidence: {
          statement: `Multiple rows share primary key identifier ${tx.id}`,
          metricComparison: `Key reuse detected in ingestion audit`,
          supportingIds: [tx.id]
        }
      });
    }

    // 5. Negative values in expense rows (e.g. T0089: -4500)
    if (tx.statusNotes?.some((n) => n.includes('Negative amount'))) {
      anomalies.push({
        id: `anomaly-neg-${tx.id}`,
        transactionId: tx.id,
        date: tx.date || '',
        title: `Negative Value in Expense Ledger: ${tx.id}`,
        description: `Negative amount was supplied in expense record. Converted safely to positive flow magnitude for balance calculations.`,
        category: cat,
        amount: tx.amount,
        severity: 'low',
        type: 'NEGATIVE_AMOUNT',
        evidence: {
          statement: `Negative signed value in debit/expense column`,
          metricComparison: `Raw value: -${tx.amount} converted to absolute ${tx.amount}`,
          supportingIds: [tx.id]
        }
      });
    }
  }

  // Rank by severity
  const severityOrder = { high: 1, medium: 2, low: 3 };
  return anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}
