import React, { useState, useEffect, useCallback } from 'react';
import {
  Home, ChevronRight, Building2, CheckCircle, Clock, AlertTriangle,
  Eye, Settings, RotateCcw, Calendar, Users, Hash, ChevronDown,
  FileCheck, XCircle, Send, PauseCircle, BarChart3, RefreshCw
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { QuarterOverrideModal } from '../components/quarters/QuarterOverrideModal';
import {
  quartersService,
  QuarterAllotmentCycle,
  QuarterRequest,
  QuarterAllotment,
  Quarter,
} from '../services/quartersService';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80',
];
function getImage(q: Quarter, idx: number) {
  return q.images?.[0] || PLACEHOLDER_IMAGES[idx % PLACEHOLDER_IMAGES.length];
}
function fmtINR(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function cycleStatusBadge(status: string) {
  if (status === 'OPEN') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (status === 'CLOSED') return 'bg-gray-100 text-gray-600 border border-gray-200';
  return 'bg-amber-50 text-amber-700 border border-amber-200';
}

function reqStatusConfig(status: string) {
  const cfg: Record<string, { cls: string; label: string; icon: React.ReactNode }> = {
    DRAFT: { cls: 'bg-amber-50 text-amber-700 border border-amber-200', label: 'Draft', icon: <Clock size={11} /> },
    SUBMITTED: { cls: 'bg-blue-50 text-blue-700 border border-blue-200', label: 'Submitted', icon: <Send size={11} /> },
    ALLOTTED: { cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'Allotted', icon: <CheckCircle size={11} /> },
    WITHDRAWN: { cls: 'bg-gray-100 text-gray-500 border border-gray-200', label: 'Withdrawn', icon: <XCircle size={11} /> },
  };
  return cfg[status] ?? cfg.DRAFT;
}

type Tab = 'cycles' | 'allotments' | 'requests';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'cycles', label: 'Allotment Cycles', icon: <Calendar size={16} /> },
  { key: 'requests', label: 'Requests', icon: <FileCheck size={16} /> },
  { key: 'allotments', label: 'Allotment Table', icon: <BarChart3 size={16} /> },
];

export const QuarterManagerPage: React.FC = () => {
  const { user } = useAuthStore();
  const addToast = useUIStore(s => s.addToast);

  const [activeTab, setActiveTab] = useState<Tab>('cycles');
  const [cycles, setCycles] = useState<QuarterAllotmentCycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<QuarterAllotmentCycle | null>(null);
  const [cycleRequests, setCycleRequests] = useState<QuarterRequest[]>([]);
  const [cycleAllotments, setCycleAllotments] = useState<QuarterAllotment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCycleData, setLoadingCycleData] = useState(false);

  // Override modal
  const [overrideTarget, setOverrideTarget] = useState<QuarterAllotment | null>(null);

  const loadCycles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await quartersService.getAllotmentCycles();
      setCycles(data);
      if (data.length > 0 && !selectedCycle) {
        setSelectedCycle(data[0]);
      }
    } catch {
      addToast('Failed to load cycles', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { loadCycles(); }, [loadCycles]);

  const loadCycleData = useCallback(async (cycle: QuarterAllotmentCycle) => {
    setLoadingCycleData(true);
    try {
      const [reqs, allots] = await Promise.all([
        quartersService.getRequestsForCycle(cycle.id),
        quartersService.getAllotmentsForCycle(cycle.id),
      ]);
      setCycleRequests(reqs);
      setCycleAllotments(allots);
    } catch {
      addToast('Failed to load cycle data', 'error');
    } finally {
      setLoadingCycleData(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (selectedCycle) loadCycleData(selectedCycle);
  }, [selectedCycle, loadCycleData]);

  const handleFinaliseCycle = async () => {
    if (!selectedCycle || !user) return;
    try {
      await quartersService.finaliseAllotments(selectedCycle.id, user.id, cycleRequests);
      addToast('Cycle finalised', 'success');
      loadCycles();
    } catch {
      addToast('Failed to finalise cycle', 'error');
    }
  };

  const cycleStats = selectedCycle ? {
    total: cycleRequests.length,
    allotted: cycleRequests.filter(r => r.request_status === 'ALLOTTED').length,
    pending: cycleRequests.filter(r => r.request_status === 'SUBMITTED').length,
    overridden: cycleAllotments.filter(a => a.is_overridden).length,
  } : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <Home size={13} />
              <ChevronRight size={12} />
              <span>Estate Officer</span>
              <ChevronRight size={12} />
              <span className="text-gray-800 font-medium">Quarters Management</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Quarters Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage allotment cycles, review requests, and process overrides.</p>
          </div>
          {selectedCycle?.status === 'OPEN' && (
            <button
              onClick={handleFinaliseCycle}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              <CheckCircle size={15} /> Finalise Active Cycle
            </button>
          )}
        </div>

        {/* Cycle Selector + Stats */}
        {selectedCycle && cycleStats && (
          <div className="bg-white rounded-xl border-l-4 border-amber-400 border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Active View:</span>
                <select
                  value={selectedCycle.id}
                  onChange={e => setSelectedCycle(cycles.find(c => c.id === e.target.value) ?? null)}
                  className="text-sm font-semibold text-gray-900 border-0 bg-transparent focus:outline-none cursor-pointer pr-6"
                >
                  {cycles.map(c => (
                    <option key={c.id} value={c.id}>{c.cycle_name}</option>
                  ))}
                </select>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cycleStatusBadge(selectedCycle.status)}`}>
                  {selectedCycle.status}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Requests', value: cycleStats.total, color: 'text-gray-900' },
                { label: 'Allotted', value: cycleStats.allotted, color: 'text-emerald-700' },
                { label: 'Pending Review', value: cycleStats.pending, color: 'text-amber-700' },
                { label: 'Overridden', value: cycleStats.overridden, color: 'text-blue-700' },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-xs text-gray-500 mb-0.5">{s.label}</div>
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>
            {selectedCycle.end_date && (
              <div className="mt-3 text-xs text-gray-500">
                Cycle closes: <span className="font-semibold text-gray-700">{new Date(selectedCycle.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-white rounded-xl border border-gray-200 p-1 w-fit">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-white rounded-xl border border-gray-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Cycles Tab */}
            {activeTab === 'cycles' && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {['Cycle', 'Code', 'Period', 'Closes', 'Status', ''].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cycles.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">No allotment cycles found</td>
                        </tr>
                      ) : cycles.map(cycle => (
                        <tr key={cycle.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4 font-semibold text-gray-900">{cycle.cycle_name}</td>
                          <td className="px-5 py-4 font-mono text-xs text-gray-500">{cycle.cycle_code}</td>
                          <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                            {new Date(cycle.start_date).toLocaleDateString('en-IN')} — {new Date(cycle.end_date).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-5 py-4 text-gray-600">{new Date(cycle.end_date).toLocaleDateString('en-IN')}</td>
                          <td className="px-5 py-4">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cycleStatusBadge(cycle.status)}`}>
                              {cycle.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => { setSelectedCycle(cycle); setActiveTab('requests'); }}
                              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              <Eye size={12} /> View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loadingCycleData ? (
                  <div className="py-12 text-center text-gray-400 text-sm">Loading…</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          {['Request No.', 'Reason', 'BHK Required', 'Preferred Location', 'Preferences', 'Move-in', 'Status', ''].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {cycleRequests.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">No requests for this cycle</td>
                          </tr>
                        ) : cycleRequests.map(req => {
                          const sc = reqStatusConfig(req.request_status);
                          return (
                            <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 font-mono text-xs text-gray-700">{req.request_number}</td>
                              <td className="px-4 py-3 text-gray-600 max-w-[150px] truncate">{req.request_reason || '—'}</td>
                              <td className="px-4 py-3 text-gray-600">{req.required_bhk_config || '—'}</td>
                              <td className="px-4 py-3 text-gray-600">{req.preferred_location || '—'}</td>
                              <td className="px-4 py-3">
                                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                                  {req.preferences?.length ?? 0} prefs
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                {req.move_in_date ? new Date(req.move_in_date).toLocaleDateString('en-IN') : '—'}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 w-fit ${sc.cls}`}>
                                  {sc.icon}{sc.label}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => setActiveTab('allotments')}
                                  className="text-xs px-2.5 py-1.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                  <Eye size={12} className="inline" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Allotments Tab */}
            {activeTab === 'allotments' && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loadingCycleData ? (
                  <div className="py-12 text-center text-gray-400 text-sm">Loading…</div>
                ) : cycleAllotments.length === 0 && cycleRequests.length > 0 ? (
                  <div className="py-16 text-center">
                    <Building2 size={36} className="mx-auto text-gray-300 mb-3" />
                    <h3 className="text-base font-semibold text-gray-700 mb-1">No allotments generated yet</h3>
                    <p className="text-sm text-gray-500 mb-5">Run the auto-allotment to assign quarters based on preferences.</p>
                    <button
                      onClick={handleFinaliseCycle}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
                    >
                      <RefreshCw size={15} /> Run Auto-Allotment
                    </button>
                  </div>
                ) : cycleAllotments.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-sm">
                    No allotments for this cycle. Select a cycle with requests first.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          {['Allotted Quarter', 'Request No.', 'Pref Used', 'Allotted On', 'Overridden', 'Status', ''].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {cycleAllotments.map((allot, i) => {
                          const q = allot.quarter as Quarter | undefined;
                          const req = allot.request as QuarterRequest | undefined;
                          const prefUsed = req?.preferences?.find(p => p.quarter_id === q?.id)?.preference_rank;
                          return (
                            <tr key={allot.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3">
                                {q ? (
                                  <div className="flex items-center gap-3">
                                    <img src={getImage(q, i)} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                    <div>
                                      <div className="font-semibold text-gray-900 text-sm">{q.quarter_number}</div>
                                      <div className="text-xs text-gray-500">{q.bhk_config} · {fmtINR(q.monthly_rent)}</div>
                                    </div>
                                  </div>
                                ) : '—'}
                              </td>
                              <td className="px-4 py-3 font-mono text-xs text-gray-700">{req?.request_number ?? '—'}</td>
                              <td className="px-4 py-3">
                                {prefUsed !== undefined ? (
                                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">P-{prefUsed}</span>
                                ) : '—'}
                              </td>
                              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                {new Date(allot.allotment_date).toLocaleDateString('en-IN')}
                              </td>
                              <td className="px-4 py-3">
                                {allot.is_overridden ? (
                                  <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">Overridden</span>
                                ) : (
                                  <span className="text-xs text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                  allot.approval_status === 'APPROVED'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {allot.approval_status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setOverrideTarget(allot)}
                                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors font-medium"
                                  >
                                    <Settings size={12} /> Override
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <QuarterOverrideModal
        isOpen={!!overrideTarget}
        onClose={() => setOverrideTarget(null)}
        allotment={overrideTarget}
        allCycleAllotments={cycleAllotments}
        eoAuthId={user?.id ?? ''}
        onOverrideSaved={() => {
          if (selectedCycle) loadCycleData(selectedCycle);
        }}
      />
    </div>
  );
};
