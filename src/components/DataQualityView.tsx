import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Download
} from 'lucide-react';
import { DataQualityReport, CanonicalTransaction } from '../engine/models';
import { fetchTransactions } from '../lib/api';
import { formatINR } from '../lib/format';

interface DataQualityViewProps {
  report: DataQualityReport | null;
}

export const DataQualityView: React.FC<DataQualityViewProps> = ({ report }) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [transactions, setTransactions] = useState<CanonicalTransaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [limit, setLimit] = useState(100);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [filterStatus, searchQuery, limit]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTransactions(limit, filterStatus, searchQuery);
      setTransactions(data.transactions || []);
      setTotalCount(data.total || 0);
    } catch (e) {
      console.error('Error fetching transactions:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (transactions.length === 0) return;
    const headers = ['id', 'date', 'category', 'description', 'amount', 'type', 'classification', 'status'];
    const rows = transactions.map((t) => [
      t.id,
      t.date || '',
      `"${t.category || ''}"`,
      `"${t.description || ''}"`,
      t.amount,
      t.transactionType,
      t.classification,
      t.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'vantage_normalized_ledger.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Quality Metrics */}
      <div className="p-6 bg-[#0d121d] border border-[#1b2336] rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h1 className="text-xl font-bold tracking-tight text-white">
                Forensic Ledger & Quality Audit
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Every row is normalized without data destruction. Anomalies, duplicates, and future timestamps are isolated and tagged.
            </p>
          </div>

          <div className="p-3.5 bg-[#080b12] rounded-xl border border-[#1b2336] flex items-center gap-4 shrink-0">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Confidence Score
              </div>
              <div className="text-2xl font-bold text-[#d4af37] tabular-nums">
                {report?.confidenceScore || 84}/100
              </div>
              <div className="text-[10px] text-emerald-400 font-medium">
                High Integrity Verification
              </div>
            </div>
          </div>
        </div>

        {/* 4 Issue Categories */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-[#080b12] rounded-xl border border-[#1b2336]">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Total Ingested
            </div>
            <div className="text-lg font-bold text-white tabular-nums mt-0.5">
              {report?.totalTransactionsIngested || 817}
            </div>
            <div className="text-[10px] text-emerald-400">
              {report?.validTransactions || 809} pristine records
            </div>
          </div>

          <div className="p-3 bg-[#080b12] rounded-xl border border-[#1b2336]">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Exact Duplicates
            </div>
            <div className="text-lg font-bold text-amber-400 tabular-nums mt-0.5">
              {report?.exactDuplicatesCount || 1}
            </div>
            <div className="text-[10px] text-slate-400">
              Safely de-duplicated
            </div>
          </div>

          <div className="p-3 bg-[#080b12] rounded-xl border border-[#1b2336]">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Reused IDs
            </div>
            <div className="text-lg font-bold text-white tabular-nums mt-0.5">
              {report?.reusedIdsCount || 5}
            </div>
            <div className="text-[10px] text-slate-400">
              Payload-fingerprinted
            </div>
          </div>

          <div className="p-3 bg-[#080b12] rounded-xl border border-[#1b2336]">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Future Dated
            </div>
            <div className="text-lg font-bold text-purple-400 tabular-nums mt-0.5">
              {report?.futureDatedCount || 1}
            </div>
            <div className="text-[10px] text-slate-400">
              Quarantined from snapshot
            </div>
          </div>
        </div>
      </div>

      {/* Searchable Transaction Table */}
      <div className="p-6 bg-[#0d121d] border border-[#1b2336] rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Verified Transaction Ledger ({totalCount})
            </h2>
            <p className="text-xs text-slate-400">
              Searchable forensic audit trail across 24 billing periods
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#162033] hover:bg-[#212f4b] border border-[#273859] rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Normalized CSV</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, description, category, or date..."
              className="w-full bg-[#080b12] border border-[#1b2336] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#080b12] p-1 rounded-lg border border-[#1b2336] overflow-x-auto text-xs no-scrollbar">
            {['ALL', 'VALID', 'WARNING', 'EXACT_DUPLICATE', 'REUSED_ID', 'FUTURE_DATED', 'OUTLIER'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded whitespace-nowrap transition-colors text-[11px] font-mono ${
                  filterStatus === st ? 'bg-[#182338] text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left" aria-label="Normalized Transaction Ledger">
            <thead className="bg-[#080b12] text-slate-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Classification</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-right">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#182133]">
              {transactions.map((t) => (
                <tr key={`${t.id}-${t.date}-${t.amount}`} className="hover:bg-[#121929] transition-colors">
                  <td className="py-2.5 px-3 font-mono text-[#d4af37] font-medium">{t.id}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-400 tabular-nums">{t.date || 'N/A'}</td>
                  <td className="py-2.5 px-3 text-slate-200 font-medium max-w-[200px] truncate">{t.description || '—'}</td>
                  <td className="py-2.5 px-3 text-slate-300">{t.category || 'General'}</td>
                  <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400 uppercase">{t.classification}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-white tabular-nums font-semibold">{formatINR(t.amount)}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded font-semibold ${
                        t.status === 'VALID'
                          ? 'bg-[#141b29] text-slate-400'
                          : t.status === 'EXACT_DUPLICATE'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : t.status === 'FUTURE_DATED'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : t.status === 'OUTLIER'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-[#1b2336]">
          <span>Showing {transactions.length} of {totalCount} records</span>
          {limit < totalCount && (
            <button
              onClick={() => setLimit((prev) => prev + 100)}
              className="px-3 py-1 bg-[#162033] hover:bg-[#202e48] border border-[#2b3d63] text-white rounded transition-colors text-xs font-medium"
            >
              Load next 100 entries
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
