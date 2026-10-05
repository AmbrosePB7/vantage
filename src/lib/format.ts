/**
 * Vantage Financial Intelligence — Formatting Helpers
 * Indian number formatting and currency utilities.
 */

export function formatINR(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '₹0';
  return '₹' + Math.round(val).toLocaleString('en-IN');
}

export function formatCompactINR(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '₹0';
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';

  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)}L`;
  }
  if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(1)}k`;
  }
  return `${sign}₹${Math.round(abs).toLocaleString('en-IN')}`;
}

export function formatPct(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0%';
  return `${Math.round(val * 10) / 10}%`;
}
