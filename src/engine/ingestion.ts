/**
 * Vantage Financial Intelligence — Ingestion Layer
 * Multi-format CSV parser, intelligent schema detector, column normalizer, and alias mapper.
 */

export interface ParsedCsvResult {
  headers: string[];
  rows: Record<string, string>[];
}

export type DatasetType = 'TRANSACTIONS' | 'ASSETS' | 'LIABILITIES' | 'UNKNOWN';

export interface SchemaDetectionResult {
  datasetType: DatasetType;
  confidence: number;
  mappedColumns: Record<string, string>;
  warnings: string[];
}

/**
 * Robust CSV parser that handles quotes, escaped quotes, newlines within quotes, and trailing empty lines.
 */
export function parseCsv(csvText: string): ParsedCsvResult {
  if (!csvText || !csvText.trim()) {
    return { headers: [], rows: [] };
  }

  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  const text = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      lines.push(currentRow);
    }
  }

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const rawHeaders = lines[0];
  const headers = rawHeaders.map((h) => cleanHeader(h));
  const rows: Record<string, string>[] = [];

  for (let r = 1; r < lines.length; r++) {
    const rowObj: Record<string, string> = {};
    const rowValues = lines[r];
    for (let c = 0; c < headers.length; c++) {
      const headerKey = headers[c];
      const val = rowValues[c] !== undefined ? rowValues[c] : '';
      rowObj[headerKey] = val;
    }
    rows.push(rowObj);
  }

  return { headers, rows };
}

/**
 * Cleans and normalizes header keys:
 * "Transaction Date" -> "transaction_date"
 * "Amount (INR)" -> "amount_inr"
 */
export function cleanHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .trim()
    .replace(/\s+/g, '_');
}

/**
 * Standard column aliases
 */
export const COLUMN_ALIASES: Record<string, string[]> = {
  id: ['id', 'txn_id', 'transaction_id', 'asset_id', 'liability_id', 'transaction_number', 'txn_no', 'identifier'],
  date: ['date', 'txn_date', 'transaction_date', 'as_of_date', 'snapshot_date', 'due_date', 'timestamp', 'txn_datetime'],
  description: ['description', 'details', 'narration', 'merchant', 'particulars', 'remarks', 'memo'],
  category: ['category', 'transaction_category', 'expense_category', 'type', 'asset_type', 'liability_type', 'classification'],
  amount: ['amount', 'transaction_amount', 'value', 'transaction_value', 'outstanding', 'outstanding_amount', 'emi', 'balance'],
  type: ['type', 'transaction_type', 'txn_type', 'flow', 'dr_cr'],
  debit: ['debit', 'withdrawal', 'dr', 'expense', 'spent'],
  credit: ['credit', 'deposit', 'cr', 'income', 'received'],
  interest_rate: ['interest_rate', 'rate', 'roi', 'interest', 'apr'],
  emi: ['emi', 'monthly_payment', 'installment', 'monthly_emi'],
  outstanding: ['outstanding', 'outstanding_amount', 'balance_due', 'principal_remaining'],
  as_of_date: ['as_of_date', 'snapshot_date', 'date', 'valuation_date']
};

/**
 * Detects the dataset type by analyzing headers and sample values
 */
export function detectDatasetType(headers: string[], sampleRows: Record<string, string>[] = []): SchemaDetectionResult {
  const warnings: string[] = [];
  const normalizedHeaders = headers.map(cleanHeader);

  // Score each dataset candidate
  let txScore = 0;
  let assetScore = 0;
  let liabilityScore = 0;

  // Check headers
  if (normalizedHeaders.some((h) => h.includes('txn') || h.includes('transaction'))) txScore += 3;
  if (normalizedHeaders.some((h) => h.includes('asset'))) assetScore += 4;
  if (normalizedHeaders.some((h) => h.includes('liability') || h.includes('loan'))) liabilityScore += 4;

  if (normalizedHeaders.includes('date') || normalizedHeaders.includes('transaction_date')) txScore += 2;
  if (normalizedHeaders.includes('description') || normalizedHeaders.includes('narration') || normalizedHeaders.includes('merchant')) txScore += 2;
  if (normalizedHeaders.includes('category')) txScore += 1;
  if (normalizedHeaders.includes('debit') || normalizedHeaders.includes('credit')) txScore += 3;

  if (normalizedHeaders.includes('as_of_date') || normalizedHeaders.includes('valuation_date')) assetScore += 2;
  if (normalizedHeaders.includes('value') && !normalizedHeaders.includes('interest_rate')) assetScore += 2;

  if (normalizedHeaders.includes('outstanding') || normalizedHeaders.includes('outstanding_amount')) liabilityScore += 3;
  if (normalizedHeaders.includes('interest_rate') || normalizedHeaders.includes('rate')) liabilityScore += 3;
  if (normalizedHeaders.includes('emi')) liabilityScore += 2;

  // Sample values inspection
  if (sampleRows.length > 0) {
    const firstRowValues = Object.values(sampleRows[0]).join(' ').toLowerCase();
    if (firstRowValues.includes('salary') || firstRowValues.includes('grocery') || firstRowValues.includes('fuel')) {
      txScore += 2;
    }
    if (firstRowValues.includes('home loan') || firstRowValues.includes('car loan') || firstRowValues.includes('credit card')) {
      if (normalizedHeaders.includes('interest_rate')) {
        liabilityScore += 3;
      }
    }
    if (firstRowValues.includes('mutual funds') || firstRowValues.includes('savings account') || firstRowValues.includes('property')) {
      assetScore += 2;
    }
  }

  let datasetType: DatasetType = 'UNKNOWN';
  let maxScore = Math.max(txScore, assetScore, liabilityScore);

  if (maxScore >= 3) {
    if (liabilityScore === maxScore) datasetType = 'LIABILITIES';
    else if (assetScore === maxScore) datasetType = 'ASSETS';
    else datasetType = 'TRANSACTIONS';
  } else {
    warnings.push('Low confidence in schema identification. Verifying against standard column structures.');
    if (normalizedHeaders.includes('amount') || normalizedHeaders.includes('debit') || normalizedHeaders.includes('credit')) {
      datasetType = 'TRANSACTIONS';
    }
  }

  // Create mapping for the detected dataset
  const mappedColumns: Record<string, string> = {};
  for (const [targetField, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const h of normalizedHeaders) {
      if (aliases.includes(h) && !mappedColumns[targetField]) {
        mappedColumns[targetField] = h;
        break;
      }
    }
  }

  const confidence = Math.min(100, Math.round((maxScore / 8) * 100));

  return {
    datasetType,
    confidence: isNaN(confidence) || confidence <= 0 ? 50 : confidence,
    mappedColumns,
    warnings
  };
}

/**
 * Normalizes monetary amounts across formats:
 * - "₹50,000" -> 50000
 * - "INR 1,00,000" -> 100000 (Indian lakh system)
 * - "-4,500" -> -4500
 * - "(1500)" -> -1500
 * - "50000.50" -> 50000.5
 */
export function normalizeAmount(rawVal: any): { amount: number; isNegative: boolean; isValid: boolean } {
  if (rawVal === undefined || rawVal === null) {
    return { amount: 0, isNegative: false, isValid: false };
  }

  if (typeof rawVal === 'number') {
    if (isNaN(rawVal)) return { amount: 0, isNegative: false, isValid: false };
    return { amount: Math.abs(rawVal), isNegative: rawVal < 0, isValid: true };
  }

  let str = String(rawVal).trim();
  if (str === '') {
    return { amount: 0, isNegative: false, isValid: false };
  }

  let isNegative = false;
  // Handle brackets (1000)
  if (str.startsWith('(') && str.endsWith(')')) {
    isNegative = true;
    str = str.slice(1, -1).trim();
  }

  // Remove currency symbols & letters
  str = str.replace(/[₹$€£]|INR|Rs\.?|USD|EUR/gi, '').trim();

  if (str.startsWith('-')) {
    isNegative = true;
    str = str.slice(1).trim();
  } else if (str.endsWith('-')) {
    isNegative = true;
    str = str.slice(0, -1).trim();
  }

  // Remove commas (both standard western "100,000" and Indian "1,00,000")
  str = str.replace(/,/g, '');

  const num = parseFloat(str);
  if (isNaN(num)) {
    return { amount: 0, isNegative: false, isValid: false };
  }

  return {
    amount: Math.abs(num),
    isNegative,
    isValid: true
  };
}

/**
 * Normalizes dates to ISO YYYY-MM-DD
 * Supports:
 * - YYYY-MM-DD
 * - YYYY/MM/DD
 * - DD-MM-YYYY
 * - DD/MM/YYYY
 * - MM/DD/YYYY (if day > 12 detected or standard format)
 */
export function normalizeDate(rawVal: string): { isoDate: string | null; isAmbiguous: boolean; isValid: boolean } {
  if (!rawVal || !rawVal.trim()) {
    return { isoDate: null, isAmbiguous: false, isValid: false };
  }

  const str = rawVal.trim();

  // Pattern 1: YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { isoDate: iso, isAmbiguous: false, isValid: true };
    }
  }

  // Pattern 2: DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const p1 = parseInt(dmyMatch[1], 10);
    const p2 = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);

    // If p1 > 12, p1 must be day, p2 month
    if (p1 > 12 && p2 <= 12) {
      const iso = `${year}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
      return { isoDate: iso, isAmbiguous: false, isValid: true };
    }

    // If p2 > 12, p2 must be day, p1 month (US MM/DD/YYYY)
    if (p2 > 12 && p1 <= 12) {
      const iso = `${year}-${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}`;
      return { isoDate: iso, isAmbiguous: false, isValid: true };
    }

    // Default to Indian/UK DD-MM-YYYY as standard for INR datasets
    const iso = `${year}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
    return { isoDate: iso, isAmbiguous: true, isValid: true };
  }

  // Native Date parsing fallback
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const iso = d.toISOString().slice(0, 10);
    return { isoDate: iso, isAmbiguous: false, isValid: true };
  }

  return { isoDate: null, isAmbiguous: false, isValid: false };
}
