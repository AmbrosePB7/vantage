import React, { useState } from 'react';
import { X, Upload, CheckCircle2, RotateCcw, AlertTriangle, Building2, Landmark } from 'lucide-react';
import {
  DEFAULT_ASSETS_CSV,
  DEFAULT_LIABILITIES_CSV,
  SAMPLE_DEBIT_CREDIT_TRANSACTIONS,
  SAMPLE_MERCHANT_VALUE_TRANSACTIONS
} from '../engine/defaultData';
import { uploadCustomDataset, resetToDefaultDataset } from '../lib/api';
import { detectDatasetType, parseCsv } from '../engine/ingestion';

interface DatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetReloaded: () => void;
}

const HNW_FAMILY_OFFICE_ASSETS = `asset_id,name,value,type,date
A_HNW_1,Swiss Private Bank Liquidity,45000000,liquid,2026-10-01
A_HNW_2,Global Equities Portfolio,85000000,semi-liquid,2026-10-01
A_HNW_3,Private Equity & Venture Stakes,55000000,semi-liquid,2026-10-01
A_HNW_4,Commercial Real Estate Holdings,120000000,illiquid,2026-10-01`;

const HNW_FAMILY_OFFICE_LIABILITIES = `liability_id,name,outstanding,interest_rate,emi
L_HNW_1,Commercial Lombard Facility,35000000,6.25,250000`;

const HNW_FAMILY_OFFICE_TRANSACTIONS = `date,details,category,amount,flow
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

export const DatasetModal: React.FC<DatasetModalProps> = ({
  isOpen,
  onClose,
  onDatasetReloaded
}) => {
  const [activeMode, setActiveMode] = useState<'presets' | 'custom'>('presets');
  const [customCsv, setCustomCsv] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [detectionPreview, setDetectionPreview] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCsvChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setCustomCsv(text);
    if (text.trim().length > 20) {
      const parsed = parseCsv(text);
      const detection = detectDatasetType(parsed.headers, parsed.rows);
      setDetectionPreview({
        headers: parsed.headers,
        rowCount: parsed.rows.length,
        detection
      });
    } else {
      setDetectionPreview(null);
    }
  };

  const handleLoadChallenge = async () => {
    setIsLoading(true);
    setStatusMessage('Restoring Asset Vantage challenge dataset (817 transactions)...');
    try {
      await resetToDefaultDataset();
      setStatusMessage('Active: Asset Vantage Challenge (₹36.87L NAV, 817 txns, 8 assets).');
      setTimeout(() => {
        onDatasetReloaded();
        onClose();
      }, 700);
    } catch (e: any) {
      setStatusMessage('Error reloading dataset: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadHnwPortfolio = async () => {
    setIsLoading(true);
    setStatusMessage('Loading High-Net-Worth Family Office Portfolio (₹27.0 Cr NAV)...');
    try {
      await uploadCustomDataset(
        HNW_FAMILY_OFFICE_TRANSACTIONS,
        HNW_FAMILY_OFFICE_ASSETS,
        HNW_FAMILY_OFFICE_LIABILITIES,
        '2026-10-01'
      );
      setStatusMessage('Active: HNW Family Office Portfolio (₹27.0 Cr NAV, ₹4.5 Cr Treasury).');
      setTimeout(() => {
        onDatasetReloaded();
        onClose();
      }, 700);
    } catch (e: any) {
      setStatusMessage('Error loading HNW portfolio: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadDebitCredit = async () => {
    setIsLoading(true);
    setStatusMessage('Normalizing West Coast Bank debit/credit schema...');
    try {
      await uploadCustomDataset(SAMPLE_DEBIT_CREDIT_TRANSACTIONS);
      setStatusMessage('Active: Normalized dual-column debit/credit transactions.');
      setTimeout(() => {
        onDatasetReloaded();
        onClose();
      }, 700);
    } catch (e: any) {
      setStatusMessage('Error loading format: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMerchantValue = async () => {
    setIsLoading(true);
    setStatusMessage('Normalizing Merchant/Value schema...');
    try {
      await uploadCustomDataset(SAMPLE_MERCHANT_VALUE_TRANSACTIONS);
      setStatusMessage('Active: Normalized merchant/value transactions.');
      setTimeout(() => {
        onDatasetReloaded();
        onClose();
      }, 700);
    } catch (e: any) {
      setStatusMessage('Error loading format: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadCustom = async () => {
    if (!customCsv.trim()) return;
    setIsLoading(true);
    setStatusMessage('Auditing schema, normalizing headers, and recalculating NAV...');
    try {
      await uploadCustomDataset(customCsv);
      setStatusMessage('Active: Custom CSV successfully parsed and normalized!');
      setTimeout(() => {
        onDatasetReloaded();
        onClose();
      }, 700);
    } catch (e: any) {
      setStatusMessage('Ingestion error: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dataset-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-2xl bg-[#0c101a] border border-[#1b2336] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1b2336] bg-[#070a10]">
          <div>
            <h3 id="dataset-modal-title" className="text-base font-semibold text-white">
              Portfolio & Schema Ingestion Terminal
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select an executive portfolio or upload a new financial CSV dataset
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#161e2e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-[#1b2336] bg-[#090d15] px-6 pt-3 gap-5">
          <button
            onClick={() => setActiveMode('presets')}
            className={`pb-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeMode === 'presets'
                ? 'border-[#d4af37] text-[#d4af37]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Curated Portfolios & Schemas
          </button>
          <button
            onClick={() => setActiveMode('custom')}
            className={`pb-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeMode === 'custom'
                ? 'border-[#d4af37] text-[#d4af37]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Upload Custom CSV
          </button>
        </div>

        {/* Modal body */}
        <div className="p-6 space-y-3.5 max-h-[70vh] overflow-y-auto">
          {activeMode === 'presets' ? (
            <div className="space-y-3">
              {/* Option 1: Challenge Dataset */}
              <div className="p-4 bg-[#080b12] rounded-xl border border-[#1b2336] hover:border-[#2e3d5e] transition-colors flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      Asset Vantage Challenge Portfolio
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-[#14231b] text-emerald-300 rounded border border-emerald-800/40">
                      817 Transactions
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    ₹36.87L Net Asset Value · 24 billing periods · 8 assets · 3 liabilities with intentional data quality issues.
                  </p>
                </div>
                <button
                  disabled={isLoading}
                  onClick={handleLoadChallenge}
                  className="px-3.5 py-1.5 text-xs font-medium bg-[#162033] hover:bg-[#202e48] border border-[#2b3d63] text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Load Challenge
                </button>
              </div>

              {/* Option 2: High-Net-Worth Family Office */}
              <div className="p-4 bg-[#080b12] rounded-xl border border-[#3e341a]/60 hover:border-[#d4af37]/60 transition-colors flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#f3e5ab] flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-[#d4af37]" />
                      High-Net-Worth Family Office Portfolio
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-[#1a1710] text-[#d4af37] rounded border border-[#3e341a]">
                      ₹27.0 Cr NAV
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Swiss private banking treasury (₹4.5 Cr), private equity, commercial real estate (₹12 Cr), and Lombard facility.
                  </p>
                </div>
                <button
                  disabled={isLoading}
                  onClick={handleLoadHnwPortfolio}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#d4af37] hover:bg-[#ebd593] text-slate-950 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
                >
                  Load HNW Dossier
                </button>
              </div>

              {/* Option 3: Debit / Credit */}
              <div className="p-4 bg-[#080b12] rounded-xl border border-[#1b2336] hover:border-[#2e3d5e] transition-colors flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      Debit / Credit Dual-Column Statement
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-[#141a29] text-slate-300 rounded border border-[#232e47]">
                      Format 2
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Tests automated normalization of debit/credit columns without explicit inflow/outflow flags.
                  </p>
                </div>
                <button
                  disabled={isLoading}
                  onClick={handleLoadDebitCredit}
                  className="px-3.5 py-1.5 text-xs font-medium bg-[#162033] hover:bg-[#202e48] border border-[#2b3d63] text-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Load Preset
                </button>
              </div>

              {/* Option 4: Merchant / Value */}
              <div className="p-4 bg-[#080b12] rounded-xl border border-[#1b2336] hover:border-[#2e3d5e] transition-colors flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      Merchant / Value Ledger
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-[#141a29] text-slate-300 rounded border border-[#232e47]">
                      Format 3
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Tests alias mapping across alternate column identifiers (merchant, transaction_value).
                  </p>
                </div>
                <button
                  disabled={isLoading}
                  onClick={handleLoadMerchantValue}
                  className="px-3.5 py-1.5 text-xs font-medium bg-[#162033] hover:bg-[#202e48] border border-[#2b3d63] text-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Load Preset
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Paste Custom CSV Text
                </label>
                <textarea
                  value={customCsv}
                  onChange={handleCsvChange}
                  placeholder={`Date,Description,Category,Amount,Type\n2026-08-01,Dividend Inflow,Income,500000,income\n2026-08-05,Equity SIP,Investments,100000,expense`}
                  rows={8}
                  className="w-full bg-[#080b12] border border-[#1b2336] rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {detectionPreview && (
                <div className="p-3.5 bg-[#080b12] rounded-xl border border-[#1b2336] text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Schema Diagnostics:</span>
                    <span className="font-mono text-[#d4af37]">
                      {detectionPreview.detection.datasetType} ({detectionPreview.detection.confidence}% confidence)
                    </span>
                  </div>
                  <div className="text-slate-400 font-mono text-[11px]">
                    Headers: {detectionPreview.headers.join(', ')} ({detectionPreview.rowCount} rows)
                  </div>
                </div>
              )}

              <button
                disabled={isLoading || !customCsv.trim()}
                onClick={handleUploadCustom}
                className="w-full py-2.5 text-xs font-semibold bg-[#d4af37] hover:bg-[#ebce80] disabled:bg-[#161e2e] disabled:text-slate-600 text-slate-950 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Upload className="w-4 h-4" />
                <span>Normalize & Ingest Into Intelligence Engine</span>
              </button>
            </div>
          )}

          {statusMessage && (
            <div className="p-3 bg-[#080b12] rounded-xl border border-[#1b2336] text-xs text-emerald-400 font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#070a10] border-t border-[#1b2336] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#141b29] hover:bg-[#1e283d] rounded-lg transition-colors border border-[#222e44]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
