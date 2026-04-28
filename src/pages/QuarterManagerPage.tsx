import React, { useState, useEffect, useCallback } from 'react';
import {
  Home, ChevronRight, Building2, CheckCircle, Clock, AlertTriangle,
  Eye, Settings, RotateCcw, Calendar, Users, Hash, ChevronDown,
  FileCheck, XCircle, Send, PauseCircle, BarChart3, RefreshCw,
  ThumbsUp, ThumbsDown, ArrowRightCircle, LogOut, Search,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { QuarterOverrideModal } from '../components/quarters/QuarterOverrideModal';
import {
  quartersService,
  QuarterAllotmentCycle,
  QuarterRequest,
  QuarterAllotment,
  QuarterTenantRequest,
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
  let images = q.images;
  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch {
      images = (images as unknown as string).replace(/^\{/, '').replace(/\}$/, '').split(',').map((s: string) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
    }
  }
  const first = Array.isArray(images) && images.length > 0 ? images[0] : null;
  return first || PLACEHOLDER_IMAGES[idx % PLACEHOLDER_IMAGES.length];
}
function fmtINR(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN');
}

function cycleStatusBadge(status: string) {
  if (status === 'OPEN') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (status === 'CLOSED') return 'bg-gray-100 text-gray-600 border border-gray-200';
  return 'bg-amber-50 text-amber-700 border border-amber-200';
}

function reqStatusConfig(status: string) {
  const cfg: Record<string, { cls: string; label: string; icon: React.ReactNode }> = {
    DRAFT:              { cls: 'bg-amber-50 text-amber-700 border border-amber-200',      label: 'Draft',          icon: <Clock size={11} /> },
    SUBMITTED:         { cls: 'bg-blue-50 text-blue-700 border border-blue-200',          label: 'Submitted',      icon: <Send size={11} /> },
    ALLOTTED:          { cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'Allotted',       icon: <CheckCircle size={11} /> },
    ACKNOWLEDGED:      { cls: 'bg-teal-50 text-teal-700 border border-teal-200',          label: 'Occupied',       icon: <ThumbsUp size={11} /> },
    REJECTED:          { cls: 'bg-red-50 text-red-700 border border-red-200',             label: 'Rejected',       icon: <ThumbsDown size={11} /> },
    WITHDRAWN:         { cls: 'bg-gray-100 text-gray-500 border border-gray-200',         label: 'Withdrawn',      icon: <XCircle size={11} /> },
    EXTEND_REQUESTED:  { cls: 'bg-amber-50 text-amber-700 border border-amber-200',       label: 'Extension Req.', icon: <RefreshCw size={11} /> },
    UPGRADE_REQUESTED: { cls: 'bg-sky-50 text-sky-700 border border-sky-200',             label: 'Upgrade Req.',   icon: <ArrowRightCircle size={11} /> },
    VACATE_REQUESTED:  { cls: 'bg-orange-50 text-orange-700 border border-orange-200',    label: 'Vacate Req.',    icon: <LogOut size={11} /> },
    VACATED:           { cls: 'bg-gray-100 text-gray-500 border border-gray-200',         label: 'Vacated',        icon: <XCircle size={11} /> },
    ON_HOLD:           { cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200',    label: 'On Hold',        icon: <PauseCircle size={11} /> },
  };
  return cfg[status] ?? cfg.DRAFT;
}

function tenantServiceConfig(type: string) {
  const cfg: Record<string, { cls: string; label: string; icon: React.ReactNode }> = {
    EXTEND:  { cls: 'bg-amber-50 text-amber-700 border border-amber-200',    label: 'Extend',  icon: <RefreshCw size={11} /> },
    UPGRADE: { cls: 'bg-sky-50 text-sky-700 border border-sky-200',          label: 'Upgrade', icon: <ArrowRightCircle size={11} /> },
    VACATE:  { cls: 'bg-orange-50 text-orange-700 border border-orange-200', label: 'Vacate',  icon: <LogOut size={11} /> },
  };
  return cfg[type] ?? cfg.VACATE;
}

function tenantStatusBadge(status: string) {
  const cfg: Record<string, string> = {
    PENDING:   'bg-amber-50 text-amber-700 border border-amber-200',
    APPROVED:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
    REJECTED:  'bg-red-50 text-red-700 border border-red-200',
    WITHDRAWN: 'bg-gray-100 text-gray-500 border border-gray-200',
  };
  return cfg[status] ?? cfg.PENDING;
}

type Tab = 'cycles' | 'allotments' | 'requests' | 'all_requests' | 'tenant_requests';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'cycles',          label: 'Allotment Cycles', icon: <Calendar size={16} /> },
  { key: 'requests',        label: 'Cycle Requests',   icon: <FileCheck size={16} /> },
  { key: 'allotments',      label: 'Allotment Table',  icon: <BarChart3 size={16} /> },
  { key: 'all_requests',    label: 'All Requests',     icon: <Users size={16} /> },
  { key: 'tenant_requests', label: 'Tenant Services',  icon: <Settings size={16} /> },
];

const ALL_STATUS_OPTIONS = [
  { value: 'ALL',               label: 'All statuses' },
  { value: 'DRAFT',             label: 'Draft' },
  { value: 'SUBMITTED',         label: 'Submitted' },
  { value: 'ALLOTTED',          label: 'Allotted' },
  { value: 'ACKNOWLEDGED',      label: 'Occupied' },
  { value: 'UPGRADE_REQUESTED', label: 'Upgrade Req.' },
  { value: 'EXTEND_REQUESTED',  label: 'Extension Req.' },
  { value: 'VACATE_REQUESTED',  label: 'Vacate Req.' },
  { value: 'VACATED',           label: 'Vacated' },
  { value: 'REJECTED',          label: 'Rejected' },
  { value: 'WITHDRAWN',         label: 'Withdrawn' },
];

export const QuarterManagerPage: React.FC = () => {
  const { user } = useAuthStore();
  const addToast = useUIStore(s => s.addToast);

  const [activeTab, setActiveTab] = useState<Tab>('cycles');
  const [cycles, setCycles] = useState<QuarterAllotmentCycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<QuarterAllotmentCycle | null>(null);
  const [cycleRequests, setCycleRequests] = useState<QuarterRequest[]>([]);
  const [cycleAllotments, setCycleAllotments] = useState<QuarterAllotment[]>([]);
  const [allRequests, setAllRequests] = useState<QuarterRequest[]>([]);
  const [allTenantRequests, setAllTenantRequests] = useState<QuarterTenantRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCycleData, setLoadingCycleData] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [loadingTenant, setLoadingTenant] = useState(false);

  // All Requests filters
  const [allReqSearch, setAllReqSearch] = useState('');
  const [allReqStatus, setAllReqStatus] = useState('ALL');

  // Tenant Requests filters
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantStatusFilter, setTenantStatusFilter] = useState('ALL');
  const [tenantTypeFilter, setTenantTypeFilter] = useState('ALL');

  // EO action on tenant request
  const [eoNotesMap, setEoNotesMap] = useState<Record<string, string>>({});
  const [processingTenant, setProcessingTenant] = useState<string | null>(null);

  // Override modal
  const [overrideTarget, setOverrideTarget] = useState<QuarterAllotment | null>(null);

  const loadCycles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await quartersService.getAllotmentCycles();
      setCycles(data);
      if (data.length > 0 && !selectedCycle) setSelectedCycle(data[0]);
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

  const loadAllRequests = useCallback(async () => {
    setLoadingAll(true);
    try {
      const data = await quartersService.getAllRequests();
      setAllRequests(data);
    } catch {
      addToast('Failed to load all requests', 'error');
    } finally {
      setLoadingAll(false);
    }
  }, [addToast]);

  const loadAllTenantRequests = useCallback(async () => {
    setLoadingTenant(true);
    try {
      const data = await quartersService.getAllTenantRequests();
      setAllTenantRequests(data);
    } catch {
      addToast('Failed to load tenant requests', 'error');
    } finally {
      setLoadingTenant(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (activeTab === 'all_requests') loadAllRequests();
    if (activeTab === 'tenant_requests') loadAllTenantRequests();
  }, [activeTab, loadAllRequests, loadAllTenantRequests]);

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

  const handleApproveTenant = async (tr: QuarterTenantRequest) => {
    if (!tr.allotment?.request_id) return;
    setProcessingTenant(tr.id);
    try {
      await quartersService.approveTenantRequest(tr.id, tr.allotment.request_id, tr.service_type, eoNotesMap[tr.id] ?? '');
      addToast('Request approved', 'success');
      loadAllTenantRequests();
    } catch {
      addToast('Failed to approve', 'error');
    } finally {
      setProcessingTenant(null);
    }
  };

  const handleRejectTenant = async (tr: QuarterTenantRequest) => {
    if (!tr.allotment?.request_id) return;
    setProcessingTenant(tr.id);
    try {
      await quartersService.rejectTenantRequest(tr.id, tr.allotment.request_id, tr.service_type, eoNotesMap[tr.id] ?? '');
      addToast('Request rejected', 'success');
      loadAllTenantRequests();
    } catch {
      addToast('Failed to reject', 'error');
    } finally {
      setProcessingTenant(null);
    }
  };

  const cycleStats = selectedCycle ? {
    total: cycleRequests.length,
    allotted: cycleRequests.filter(r => r.request_status === 'ALLOTTED').length,
    pending: cycleRequests.filter(r => r.request_status === 'SUBMITTED').length,
    overridden: cycleAllotments.filter(a => a.is_overridden).length,
  } : null;

  const filteredAllRequests = React.useMemo(() => {
    let r = [...allRequests];
    if (allReqStatus !== 'ALL') r = r.filter(x => x.request_status === allReqStatus);
    if (allReqSearch.trim()) {
      const q = allReqSearch.toLowerCase();
      r = r.filter(x =>
        x.request_number?.toLowerCase().includes(q) ||
        x.required_bhk_config?.toLowerCase().includes(q) ||
        x.preferred_location?.toLowerCase().includes(q)
      );
    }
    return r;
  }, [allRequests, allReqStatus, allReqSearch]);

  const filteredTenantRequests = React.useMemo(() => {
    let r = [...allTenantRequests];
    if (tenantStatusFilter !== 'ALL') r = r.filter(x => x.request_status === tenantStatusFilter);
    if (tenantTypeFilter !== 'ALL') r = r.filter(x => x.service_type === tenantTypeFilter);
    if (tenantSearch.trim()) {
      const q = tenantSearch.toLowerCase();
      r = r.filter(x =>
        x.allotment?.quarter?.quarter_number?.toLowerCase().includes(q) ||
        x.reason?.toLowerCase().includes(q)
      );
    }
    return r;
  }, [allTenantRequests, tenantStatusFilter, tenantTypeFilter, tenantSearch]);

  const allReqCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    allRequests.forEach(r => { counts[r.request_status] = (counts[r.request_status] ?? 0) + 1; });
    return counts;
  }, [allRequests]);

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
            <p className="text-sm text-gray-500 mt-1">Manage allotment cycles, review requests, and process tenant services.</p>
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

        {/* Cycle Selector + Stats Strip */}
        {selectedCycle && cycleStats && (
          <div className="bg-white rounded-xl border-l-4 border-amber-400 border border-gray-200 px-4 py-3 mb-5 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Cycle:</span>
              <select
                value={selectedCycle.id}
                onChange={e => setSelectedCycle(cycles.find(c => c.id === e.target.value) ?? null)}
                className="text-sm font-semibold text-gray-900 border-0 bg-transparent focus:outline-none cursor-pointer"
              >
                {cycles.map(c => (
                  <option key={c.id} value={c.id}>{c.cycle_name}</option>
                ))}
              </select>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cycleStatusBadge(selectedCycle.status)}`}>
                {selectedCycle.status}
              </span>
              {selectedCycle.end_date && (
                <span className="text-xs text-gray-400">· closes {new Date(selectedCycle.end_date).toLocaleDateString('en-IN')}</span>
              )}
            </div>
            <div className="w-px h-5 bg-gray-200 hidden sm:block" />
            {[
              { label: 'Requests', value: cycleStats.total, color: 'text-gray-900' },
              { label: 'Allotted', value: cycleStats.allotted, color: 'text-emerald-700' },
              { label: 'Pending', value: cycleStats.pending, color: 'text-amber-700' },
              { label: 'Overridden', value: cycleStats.overridden, color: 'text-blue-700' },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <div className="w-px h-5 bg-gray-200" />}
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-lg font-bold ${s.color}`}>{s.value}</span>
                  <span className="text-xs text-gray-500">{s.label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-white rounded-xl border border-gray-200 p-1 w-fit flex-wrap">
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
            {/* ── Cycles Tab ─────────────────────────────────────────── */}
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
                        <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">No allotment cycles found</td></tr>
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

            {/* ── Cycle Requests Tab ─────────────────────────────────── */}
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
                          <tr><td colSpan={8} className="text-center py-12 text-gray-400 text-sm">No requests for this cycle</td></tr>
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

            {/* ── Allotments Tab ─────────────────────────────────────── */}
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
                                    : allot.approval_status === 'ACKNOWLEDGED'
                                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {allot.approval_status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => setOverrideTarget(allot)}
                                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors font-medium"
                                >
                                  <Settings size={12} /> Override
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

            {/* ── All Requests Tab ───────────────────────────────────── */}
            {activeTab === 'all_requests' && (
              <div className="space-y-4">
                {/* Status summary tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { key: 'SUBMITTED',        label: 'Submitted',   color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' },
                    { key: 'ALLOTTED',          label: 'Allotted',    color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
                    { key: 'ACKNOWLEDGED',      label: 'Occupied',    color: 'text-teal-700',    bg: 'bg-teal-50 border-teal-200' },
                    { key: 'VACATE_REQUESTED',  label: 'Vacate Req.', color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-200' },
                    { key: 'EXTEND_REQUESTED',  label: 'Extend Req.', color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
                    { key: 'UPGRADE_REQUESTED', label: 'Upgrade Req.',color: 'text-sky-700',     bg: 'bg-sky-50 border-sky-200' },
                  ].map(s => (
                    <button
                      key={s.key}
                      onClick={() => setAllReqStatus(allReqStatus === s.key ? 'ALL' : s.key)}
                      className={`flex flex-col items-center py-3 rounded-xl border transition-all ${
                        allReqStatus === s.key
                          ? `${s.bg} ring-2 ring-offset-1 ring-current ${s.color}`
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-2xl font-bold ${allReqStatus === s.key ? s.color : 'text-gray-800'}`}>
                        {allReqCounts[s.key] ?? 0}
                      </span>
                      <span className={`text-[10px] font-medium mt-0.5 ${allReqStatus === s.key ? s.color : 'text-gray-500'}`}>
                        {s.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Search + filter bar */}
                <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-wrap gap-3 items-center">
                  <div className="relative flex-1 min-w-48">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by request no., BHK, location…"
                      value={allReqSearch}
                      onChange={e => setAllReqSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                  </div>
                  <select
                    value={allReqStatus}
                    onChange={e => setAllReqStatus(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {ALL_STATUS_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{filteredAllRequests.length} of {allRequests.length}</span>
                </div>

                {loadingAll ? (
                  <div className="bg-white rounded-xl border border-gray-200 py-12 text-center text-gray-400 text-sm">Loading…</div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            {['Request No.', 'Quarter Allotted', 'BHK / Location', 'Move-in', 'Family', 'Status', 'Updated'].map(h => (
                              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredAllRequests.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No requests match the current filter</td></tr>
                          ) : filteredAllRequests.map((req, i) => {
                            const sc = reqStatusConfig(req.request_status);
                            const q = req.allotment?.quarter;
                            return (
                              <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap">{req.request_number}</td>
                                <td className="px-4 py-3">
                                  {q ? (
                                    <div className="flex items-center gap-2">
                                      <img src={getImage(q, i)} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                                      <div>
                                        <div className="text-xs font-medium text-gray-800">{q.quarter_number}</div>
                                        <div className="text-[10px] text-gray-400">{q.bhk_config}</div>
                                      </div>
                                    </div>
                                  ) : <span className="text-xs text-gray-400">Not allotted</span>}
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-600">
                                  <div>{req.required_bhk_config || '—'}</div>
                                  <div className="text-gray-400">{req.preferred_location || '—'}</div>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                                  {req.move_in_date ? fmtDate(req.move_in_date) : '—'}
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-600">{req.family_member_count ?? '—'}</td>
                                <td className="px-4 py-3">
                                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 w-fit ${sc.cls}`}>
                                    {sc.icon}{sc.label}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(req.updated_at)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Tenant Services Tab ────────────────────────────────── */}
            {activeTab === 'tenant_requests' && (
              <div className="space-y-4">
                {/* Summary strip */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'PENDING',  label: 'Pending Action', color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
                    { key: 'APPROVED', label: 'Approved',       color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
                    { key: 'REJECTED', label: 'Rejected',       color: 'text-red-700',     bg: 'bg-red-50 border-red-200' },
                  ].map(s => {
                    const cnt = allTenantRequests.filter(t => t.request_status === s.key).length;
                    return (
                      <button
                        key={s.key}
                        onClick={() => setTenantStatusFilter(tenantStatusFilter === s.key ? 'ALL' : s.key)}
                        className={`flex flex-col items-center py-3 rounded-xl border transition-all ${
                          tenantStatusFilter === s.key
                            ? `${s.bg} ring-2 ring-offset-1 ring-current ${s.color}`
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <span className={`text-2xl font-bold ${tenantStatusFilter === s.key ? s.color : 'text-gray-800'}`}>{cnt}</span>
                        <span className={`text-[10px] font-medium mt-0.5 ${tenantStatusFilter === s.key ? s.color : 'text-gray-500'}`}>{s.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Filter bar */}
                <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-wrap gap-3 items-center">
                  <div className="relative flex-1 min-w-48">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by quarter no., reason…"
                      value={tenantSearch}
                      onChange={e => setTenantSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <select
                    value={tenantTypeFilter}
                    onChange={e => setTenantTypeFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
                  >
                    <option value="ALL">All types</option>
                    <option value="EXTEND">Extend</option>
                    <option value="UPGRADE">Upgrade</option>
                    <option value="VACATE">Vacate</option>
                  </select>
                  <select
                    value={tenantStatusFilter}
                    onChange={e => setTenantStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
                  >
                    <option value="ALL">All statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="WITHDRAWN">Withdrawn</option>
                  </select>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{filteredTenantRequests.length} of {allTenantRequests.length}</span>
                </div>

                {loadingTenant ? (
                  <div className="bg-white rounded-xl border border-gray-200 py-12 text-center text-gray-400 text-sm">Loading…</div>
                ) : filteredTenantRequests.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
                    <Building2 size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">No tenant service requests found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTenantRequests.map(tr => {
                      const stc = tenantServiceConfig(tr.service_type);
                      const q = tr.allotment?.quarter;
                      const isPending = tr.request_status === 'PENDING';
                      return (
                        <div
                          key={tr.id}
                          className={`bg-white rounded-xl border border-gray-200 p-5 ${isPending ? 'border-l-4 border-l-amber-400' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex items-start gap-4">
                              {q && (
                                <img src={getImage(q, 0)} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                              )}
                              <div>
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${stc.cls}`}>
                                    {stc.icon}{stc.label}
                                  </span>
                                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${tenantStatusBadge(tr.request_status)}`}>
                                    {tr.request_status}
                                  </span>
                                </div>
                                <div className="font-semibold text-gray-900 text-sm">
                                  {q?.quarter_number ?? 'Quarter'}{q?.bhk_config ? ` · ${q.bhk_config}` : ''}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">{q?.address || q?.block_name}</div>
                                <div className="text-xs text-gray-600 mt-1.5 max-w-sm">{tr.reason || 'No reason provided'}</div>
                                {tr.remarks && (
                                  <div className="text-xs text-gray-500 mt-0.5">Remarks: {tr.remarks}</div>
                                )}
                                <div className="text-xs text-gray-400 mt-1">Requested on {fmtDate(tr.created_at)}</div>
                              </div>
                            </div>

                            {isPending && (
                              <div className="flex flex-col gap-2 min-w-52">
                                <textarea
                                  value={eoNotesMap[tr.id] ?? ''}
                                  onChange={e => setEoNotesMap(prev => ({ ...prev, [tr.id]: e.target.value }))}
                                  rows={2}
                                  placeholder="EO notes (optional)…"
                                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleApproveTenant(tr)}
                                    disabled={processingTenant === tr.id}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                                  >
                                    <CheckCircle size={13} /> Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectTenant(tr)}
                                    disabled={processingTenant === tr.id}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
                                  >
                                    <XCircle size={13} /> Reject
                                  </button>
                                </div>
                              </div>
                            )}

                            {!isPending && tr.eo_notes && (
                              <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 max-w-xs">
                                <span className="font-medium text-gray-700">EO Notes:</span> {tr.eo_notes}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
