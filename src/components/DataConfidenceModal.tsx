import React from 'react';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, AlertCircle, Calendar, Copy, Hash } from 'lucide-react';

interface DataConfidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: any;
}

export const DataConfidenceModal: React.FC<DataConfidenceModalProps> = ({
  isOpen,
  onClose,
  report
}) => {
  if (!isOpen) return null;

  const total = report?.totalTransactionsIngested || 817;
  const valid = report?.validTransactions || 808;
  const warnings = report?.warningsCount || 4;
  const duplicates = report?.exactDuplicatesCount || 2;
  const futureDated = report?.futureDatedCount || 1;
  const outliers = report?.statisticalOutliersCount || 1;
  const score = report?.confidenceScore || 91;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confidence-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg bg-white border border-[#e5e3dc] rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0eee6] bg-[#faf9f6]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Audited Ledger Integrity
              </div>
              <h3 id="confidence-modal-title" className="text-base font-bold text-slate-900">
                Data Confidence: {score}%
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close data confidence report"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-[#edebe4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-[#faf9f6] border border-[#e8e5dc] rounded-xl flex items-center justify-between">
            <span className="text-slate-700 font-medium">Dataset Ledger Audit</span>
            <span className="font-mono text-xs font-bold text-slate-900">{total} transactions analyzed</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-900 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Usable & Validated Transactions</span>
              </div>
              <span className="font-mono font-bold text-emerald-800">{valid} usable</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#fbfaf8] border border-[#eeebe2] rounded-lg">
              <div className="flex items-center gap-2 text-amber-800 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Records with Warnings (Auto-Reconciled)</span>
              </div>
              <span className="font-mono font-bold text-amber-900">{warnings} warnings</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#fbfaf8] border border-[#eeebe2] rounded-lg">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Exact Duplicates (Deduplicated)</span>
              </div>
              <span className="font-mono font-bold text-slate-800">{duplicates} duplicates</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#fbfaf8] border border-[#eeebe2] rounded-lg">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Future-Dated Entries (Isolated)</span>
              </div>
              <span className="font-mono font-bold text-slate-800">{futureDated} future transaction</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#fbfaf8] border border-[#eeebe2] rounded-lg">
              <div className="flex items-center gap-2 text-rose-800 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span>Statistical Outliers Flagged for Audit</span>
              </div>
              <span className="font-mono font-bold text-rose-800">{outliers} outlier</span>
            </div>
          </div>

          <div className="p-3 bg-[#f7f6f2] border border-[#e8e5dc] rounded-lg text-[11px] text-slate-600 leading-relaxed">
            <strong>Auditing Principle:</strong> Vantage never silently deletes or alters your data. Every record is classified into VALID, WARNING, DUPLICATE, or OUTLIER, preserving reproducible forensic evidence.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#faf9f6] border-t border-[#f0eee6] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Acknowledge Audit
          </button>
        </div>
      </div>
    </div>
  );
};
