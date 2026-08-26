import React, { useState, useEffect, useCallback } from 'react';
import {
  Download, Loader2, AlertTriangle, FileText, Users,
  TrendingUp, Clock, CheckCircle2,
} from 'lucide-react';
import { dccService } from '../../services/dccService';
import type { DccReportRow, DccOwnerReportRow } from '../../types/dcc';

const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

type ReportTab = 'by_type' | 'by_owner' | 'overdue';

export const DCCReportsTab: React.FC = () => {
  const [reportTab, setReportTab] = useState<ReportTab>('by_type');
  const [byType, setByType] = useState<DccReportRow[]>([]);
  const [byOwner, setByOwner] = useState<DccOwnerReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, o] = await Promise.all([
        dccService.getReportByDemandType(),
        dccService.getReportByOwner(),
      ]);
      setByType(t);
      setByOwner(o);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleExport = () => {
    let title = '';
    let headers: string[] = [];
    let rows: string[][] = [];

    if (reportTab === 'by_type') {
      title = 'MIS Report — By Demand Type';
      headers = ['Demand Type', 'Count', 'Total Demand', 'Collected', 'Outstanding', 'Overdue Amt', 'Collection Rate'];
      rows = byType.map((r) => [
        r.demand_type_label, String(r.demand_count), fmtINR(r.total_demand),
        fmtINR(r.total_collected), fmtINR(r.total_outstanding), fmtINR(r.overdue_amount),
        `${r.collection_rate}%`,
      ]);
    } else if (reportTab === 'by_owner') {
      title = 'MIS Report — By Owner';
      headers = ['Owner', 'Demands', 'Total Demand', 'Collected', 'Outstanding', 'Overdue Amt'];
      rows = byOwner.map((r) => [
        r.owner_name, String(r.demand_count), fmtINR(r.total_demand),
        fmtINR(r.total_collected), fmtINR(r.total_outstanding), fmtINR(r.overdue_amount),
      ]);
    } else {
      title = 'Exception Report — Overdue Demands';
      headers = ['Owner', 'Demand Type', 'Demand', 'Collected', 'Outstanding', 'Overdue Amt'];
      const overdueOwners = byOwner.filter((r) => r.overdue_count > 0);
      rows = overdueOwners.map((r) => [
        r.owner_name, '—', fmtINR(r.total_demand), fmtINR(r.total_collected),
        fmtINR(r.total_outstanding), fmtINR(r.overdue_amount),
      ]);
    }

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>body{font-family:sans-serif;font-size:13px;color:#1f2937;margin:32px}h2{margin:0 0 4px}p{margin:2px 0;color:#6b7280;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#0f766e;color:#fff;padding:8px 10px;text-align:left}td{padding:7px 10px;border-bottom:1px solid #f3f4f6}</style></head>
    <body><h2>${title}</h2><p>Generated: ${new Date().toLocaleString('en-IN')}</p>
    <table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>
    ${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}
    </tbody></table></body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="animate-spin text-teal-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-red-500">
        <AlertTriangle size={28} className="mb-2" />
        <span className="text-sm font-medium">{error}</span>
      </div>
    );
  }

  const tabs: { key: ReportTab; label: string; icon: typeof FileText }[] = [
    { key: 'by_type', label: 'By Demand Type', icon: FileText },
    { key: 'by_owner', label: 'By Owner', icon: Users },
    { key: 'overdue', label: 'Overdue Exceptions', icon: AlertTriangle },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Report sub-tabs */}
      <div className="px-5 py-3 flex items-center gap-2 shrink-0">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setReportTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                reportTab === t.key
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
        <button
          onClick={handleExport}
          className="ml-auto flex items-center gap-1 px-3 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors"
        >
          <Download size={13} /> Export
        </button>
      </div>

      {/* Report body */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {reportTab === 'by_type' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase text-gray-500">Demand Type</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase text-gray-500">Count</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase text-gray-500">Total Demand</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase text-gray-500">Collected</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase text-gray-500">Outstanding</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase text-gray-500">Overdue</th>
                  <th className="px-4 py-2.5 text-center text-[10px] font-bold uppercase text-gray-500">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {byType.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-900">{r.demand_type_label}</td>
                    <td className="px-4 py-2.5 text-xs text-right text-gray-600">{r.demand_count}</td>
                    <td className="px-4 py-2.5 text-xs text-right font-semibold text-gray-900">{fmtINR(r.total_demand)}</td>
                    <td className="px-4 py-2.5 text-xs text-right font-semibold text-emerald-700">{fmtINR(r.total_collected)}</td>
                    <td className="px-4 py-2.5 text-xs text-right font-semibold text-amber-700">{fmtINR(r.total_outstanding)}</td>
                    <td className="px-4 py-2.5 text-xs text-right font-semibold text-red-700">{fmtINR(r.overdue_amount)}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.collection_rate >= 75 ? 'bg-emerald-50 text-emerald-700' :
                        r.collection_rate >= 50 ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {r.collection_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportTab === 'by_owner' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase text-gray-500">Owner</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase text-gray-500">Demands</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase text-gray-500">Total Demand</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase text-gray-500">Collected</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase text-gray-500">Outstanding</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase text-gray-500">Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {byOwner.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-900">{r.owner_name}</td>
                    <td className="px-4 py-2.5 text-xs text-right text-gray-600">{r.demand_count}</td>
                    <td className="px-4 py-2.5 text-xs text-right font-semibold text-gray-900">{fmtINR(r.total_demand)}</td>
                    <td className="px-4 py-2.5 text-xs text-right font-semibold text-emerald-700">{fmtINR(r.total_collected)}</td>
                    <td className="px-4 py-2.5 text-xs text-right font-semibold text-amber-700">{fmtINR(r.total_outstanding)}</td>
                    <td className="px-4 py-2.5 text-xs text-right font-semibold text-red-700">{fmtINR(r.overdue_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportTab === 'overdue' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase text-gray-500">Owner</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase text-gray-500">Demands</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase text-gray-500">Total Demand</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase text-gray-500">Collected</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase text-gray-500">Outstanding</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase text-gray-500">Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {byOwner.filter((r) => r.overdue_count > 0).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      <CheckCircle2 size={28} className="mx-auto mb-2 text-emerald-400" />
                      <span className="text-sm">No overdue demands found</span>
                    </td>
                  </tr>
                ) : (
                  byOwner.filter((r) => r.overdue_count > 0).map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 text-xs font-semibold text-gray-900">{r.owner_name}</td>
                      <td className="px-4 py-2.5 text-xs text-right text-gray-600">{r.demand_count}</td>
                      <td className="px-4 py-2.5 text-xs text-right font-semibold text-gray-900">{fmtINR(r.total_demand)}</td>
                      <td className="px-4 py-2.5 text-xs text-right font-semibold text-emerald-700">{fmtINR(r.total_collected)}</td>
                      <td className="px-4 py-2.5 text-xs text-right font-semibold text-amber-700">{fmtINR(r.total_outstanding)}</td>
                      <td className="px-4 py-2.5 text-xs text-right font-semibold text-red-700">{fmtINR(r.overdue_amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DCCReportsTab;
