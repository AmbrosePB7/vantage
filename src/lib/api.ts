/**
 * Vantage Financial Intelligence — Client API Layer
 * Fetches from /api/* endpoints with zero-latency deterministic fallback to platform singleton.
 */

import { platform } from '../engine/vantageManager';
import {
  DEFAULT_ASSETS_CSV,
  DEFAULT_LIABILITIES_CSV,
  SAMPLE_DEBIT_CREDIT_TRANSACTIONS,
  SAMPLE_MERCHANT_VALUE_TRANSACTIONS
} from '../engine/defaultData';
import { ScenarioInput, ScenarioResult } from '../engine/models';

// Ensure browser-side platform is initialized immediately with challenge data
let isInitialized = false;

export async function ensurePlatformInitialized() {
  if (isInitialized) return;
  try {
    // If backend is running, verify with health check
    const res = await fetch('/api/overview');
    if (res.ok) {
      isInitialized = true;
      return;
    }
  } catch (e) {
    // Fetch failed, initialize in-memory client engine
  }

  // Fallback to client-side initialization
  try {
    const txRes = await fetch('/data/transactions.csv');
    const txCsv = txRes.ok ? await txRes.text() : '';
    platform.initialize(txCsv, DEFAULT_ASSETS_CSV, DEFAULT_LIABILITIES_CSV, '2026-10-01');
    isInitialized = true;
  } catch (err) {
    console.warn('Fallback initializing with default data:', err);
    platform.initialize('', DEFAULT_ASSETS_CSV, DEFAULT_LIABILITIES_CSV, '2026-10-01');
    isInitialized = true;
  }
}

export async function fetchOverview() {
  try {
    const res = await fetch('/api/overview');
    if (res.ok) return await res.json();
  } catch {}
  await ensurePlatformInitialized();
  return platform.getOverview();
}

export async function fetchWealth() {
  try {
    const res = await fetch('/api/wealth');
    if (res.ok) return await res.json();
  } catch {}
  await ensurePlatformInitialized();
  return platform.getWealth();
}

export async function fetchCashFlow() {
  try {
    const res = await fetch('/api/cashflow');
    if (res.ok) return await res.json();
  } catch {}
  await ensurePlatformInitialized();
  return platform.getCashFlow();
}

export async function fetchTrends() {
  try {
    const res = await fetch('/api/trends');
    if (res.ok) return await res.json();
  } catch {}
  await ensurePlatformInitialized();
  return platform.getTrends();
}

export async function fetchRisks() {
  try {
    const res = await fetch('/api/risks');
    if (res.ok) return await res.json();
  } catch {}
  await ensurePlatformInitialized();
  return platform.getRisks();
}

export async function fetchAnomalies() {
  try {
    const res = await fetch('/api/anomalies');
    if (res.ok) return await res.json();
  } catch {}
  await ensurePlatformInitialized();
  return platform.getAnomalies();
}

export async function fetchRecommendations() {
  try {
    const res = await fetch('/api/recommendations');
    if (res.ok) return await res.json();
  } catch {}
  await ensurePlatformInitialized();
  return platform.getRecommendations();
}

export async function fetchDataQuality() {
  try {
    const res = await fetch('/api/data-quality');
    if (res.ok) return await res.json();
  } catch {}
  await ensurePlatformInitialized();
  return platform.getDataQuality();
}

export async function fetchTransactions(limit = 100, status = 'ALL', search = '') {
  try {
    const res = await fetch(`/api/transactions?limit=${limit}&status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`);
    if (res.ok) return await res.json();
  } catch {}
  await ensurePlatformInitialized();
  return platform.getTransactions(limit, status, search);
}

export async function runScenarioApi(input: ScenarioInput): Promise<ScenarioResult> {
  try {
    const res = await fetch('/api/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (res.ok) return await res.json();
  } catch {}
  await ensurePlatformInitialized();
  return platform.runScenario(input);
}

export async function askCopilotApi(question: string) {
  try {
    const res = await fetch('/api/copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    if (res.ok) return await res.json();
  } catch {}
  await ensurePlatformInitialized();
  return platform.askCopilot(question);
}

export async function uploadCustomDataset(
  transactionsCsv: string,
  assetsCsv?: string,
  liabilitiesCsv?: string,
  snapshotDate?: string
) {
  const effectiveAssets = assetsCsv || DEFAULT_ASSETS_CSV;
  const effectiveLiab = liabilitiesCsv || DEFAULT_LIABILITIES_CSV;
  const effectiveDate = snapshotDate || '2026-10-01';

  // Always keep in-memory client platform in sync
  platform.initialize(transactionsCsv, effectiveAssets, effectiveLiab, effectiveDate);
  isInitialized = true;

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionsCsv,
        assetsCsv: effectiveAssets,
        liabilitiesCsv: effectiveLiab,
        snapshotDate: effectiveDate
      })
    });
    if (res.ok) return await res.json();
  } catch {}

  return {
    message: 'Loaded into intelligence engine successfully',
    dataQuality: platform.getDataQuality(),
    overview: platform.getOverview()
  };
}

export async function resetToDefaultDataset() {
  try {
    const res = await fetch('/api/reset', { method: 'POST' });
    if (res.ok) {
      try {
        const txRes = await fetch('/data/transactions.csv');
        const txCsv = txRes.ok ? await txRes.text() : '';
        platform.initialize(txCsv, DEFAULT_ASSETS_CSV, DEFAULT_LIABILITIES_CSV, '2026-10-01');
      } catch {}
      return await res.json();
    }
  } catch {}
  isInitialized = false;
  await ensurePlatformInitialized();
  return { message: 'Reset locally to challenge dataset', overview: platform.getOverview() };
}
