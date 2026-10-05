import React from 'react';
import { X, CheckCircle2, FileText } from 'lucide-react';
import { EvidenceItem } from '../engine/models';

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidence: EvidenceItem | null;
  title?: string;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  isOpen,
  onClose,
  evidence,
  title = 'Verified Financial Evidence'
}) => {
  if (!isOpen || !evidence) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-2xl bg-white border border-[#e5e3dc] rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0eee6] bg-[#faf9f6]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Audited Ledger Evidence
              </div>
              <h3 id="evidence-modal-title" className="text-base font-bold text-slate-900">
                {title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close evidence modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-[#edebe4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Claim */}
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1">
              Deterministic Claim
            </div>
            <p className="text-xs font-medium text-slate-800 bg-[#fbfaf8] p-3 rounded-lg border border-[#eeebe2]">
              {evidence.claim}
            </p>
          </div>

          {/* Metric & Calculation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-[#fbfaf8] p-3 rounded-lg border border-[#eeebe2]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-0.5">
                Verified Metric
              </div>
              <div className="text-sm font-bold text-slate-900 tabular-nums">
                {evidence.metric}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">{evidence.value}</div>
            </div>

            <div className="bg-[#fbfaf8] p-3 rounded-lg border border-[#eeebe2]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-0.5">
                Data Confidence
              </div>
              <div className="text-sm font-bold text-emerald-800 tabular-nums">
                {evidence.confidence}% Deterministic Grounding
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                100% verified from CSV ledger entries
              </div>
            </div>
          </div>

          {/* Formula / Calculation */}
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1">
              Mathematical Derivation
            </div>
            <div className="text-[11px] font-mono text-slate-800 bg-[#f7f6f2] p-3 rounded-lg border border-[#e8e5dc] break-words">
              {evidence.calculation}
            </div>
          </div>

          {/* Source Records */}
          {evidence.sourceRecords && evidence.sourceRecords.length > 0 && (
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-2">
                Traceable Source Records ({evidence.sourceRecords.length})
              </div>
              <div className="space-y-1.5">
                {evidence.sourceRecords.map((rec, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 p-2.5 bg-[#fbfaf8] rounded-lg border border-[#eeebe2] text-xs"
                  >
                    <FileText className="w-4 h-4 text-[#946f38] mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-900 font-semibold">
                          {rec.id}
                        </span>
                        {rec.type && (
                          <span className="uppercase tracking-wider text-slate-500 text-[10px] font-mono">
                            · {rec.type}
                          </span>
                        )}
                      </div>
                      <div className="text-slate-600 mt-0.5 text-[11px]">{rec.details}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#faf9f6] border-t border-[#f0eee6] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
