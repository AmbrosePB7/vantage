import React from 'react';
import { X, Info, Calculator, Database, ShieldCheck } from 'lucide-react';

export interface KpiDetailData {
  title: string;
  value: string;
  trend?: string;
  definition: string;
  calculation: string;
  source: string;
  assumptions: string;
}

interface KpiDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpi: KpiDetailData | null;
}

export const KpiDetailModal: React.FC<KpiDetailModalProps> = ({
  isOpen,
  onClose,
  kpi
}) => {
  if (!isOpen || !kpi) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kpi-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg bg-white border border-[#e5e3dc] rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0eee6] bg-[#faf9f6]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#f0eee6] flex items-center justify-center text-[#785b28]">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                KPI Analytical Breakdown
              </div>
              <h3 id="kpi-detail-title" className="text-base font-bold text-slate-900">
                {kpi.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close KPI breakdown"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-[#edebe4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Current Metric Value */}
          <div className="p-3.5 bg-[#fbfaf8] border border-[#eeebe2] rounded-xl flex items-baseline justify-between">
            <span className="text-slate-600 font-medium">Recorded Value</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-slate-900">{kpi.value}</span>
              {kpi.trend && (
                <span className="text-xs font-mono text-emerald-700 font-semibold">{kpi.trend}</span>
              )}
            </div>
          </div>

          {/* Definition */}
          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
              <span>Definition</span>
            </div>
            <p className="text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-[#eeebe2]">
              {kpi.definition}
            </p>
          </div>

          {/* Mathematical Calculation */}
          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-[#946f38]" />
              <span>Calculation & Formula</span>
            </div>
            <div className="p-3 bg-[#f7f6f2] rounded-lg border border-[#e8e5dc] font-mono text-[11px] text-slate-800 break-words">
              {kpi.calculation}
            </div>
          </div>

          {/* Source & Assumptions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-[#fbfaf8] rounded-lg border border-[#eeebe2] space-y-1">
              <div className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-1">
                <Database className="w-3 h-3 text-slate-400" />
                <span>Source Records</span>
              </div>
              <p className="text-slate-700 text-[11px]">{kpi.source}</p>
            </div>

            <div className="p-3 bg-[#fbfaf8] rounded-lg border border-[#eeebe2] space-y-1">
              <div className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#946f38]" />
                <span>Analytical Assumptions</span>
              </div>
              <p className="text-slate-700 text-[11px]">{kpi.assumptions}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#faf9f6] border-t border-[#f0eee6] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
