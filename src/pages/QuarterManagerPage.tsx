import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Home, ChevronRight, Building2, CheckCircle, Clock,
  Eye, Settings, Calendar, Users, Hash,
  FileCheck, XCircle, Send, PauseCircle, BarChart3, RefreshCw,
  ThumbsUp, ThumbsDown, ArrowRightCircle, LogOut, Search,
  Layers, Trash2, Ban, Star, Plus, ArrowLeftRight, Shuffle,
  UserCheck, UserPlus, Phone, Mail, CreditCard,
} from 'lucide-react';
import { SummaryStatsCard } from '../components/ui/SummaryStatsCard';
import { MandatorySearchBar } from '../components/ui/MandatorySearchBar';
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

  // DP summary cards
  type DPFilter = 'all' | 'occupied' | 'allotted' | 'allocated' | 'submitted' | 'draft';
  const [dpFilter, setDpFilter] = useState<DPFilter>('all');
  const [quartersSummary, setQuartersSummary] = useState<{ total: number; available: number; occupied: number } | null>(null);

  // View mode: dp cards + filtered list vs allocation table
  type ViewMode = 'dp' | 'allocation';
  const [viewMode, setViewMode] = useState<ViewMode>('dp');

  // Override mini-menu for Allocated DP rows
  const [miniMenuTarget, setMiniMenuTarget] = useState<{ req: QuarterRequest; allotment: QuarterAllotment } | null>(null);
  const miniMenuRef = useRef<HTMLDivElement>(null);
  const [overrideInitialAction, setOverrideInitialAction] = useState<string | undefined>(undefined);

  // Cycle Requests (submitted) filter
  const [cycleReqSearch, setCycleReqSearch] = useState('');

  // Allotments filter
  const [allotSearch, setAllotSearch] = useState('');

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
      if (data.length > 0) setSelectedCycle(prev => prev ?? data[0]);
    } catch {
      addToast('Failed to load cycles', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

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

  const loadQuartersSummary = useCallback(async () => {
    try {
      const s = await quartersService.getQuartersSummary();
      setQuartersSummary(s);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    loadCycles();
    loadAllRequests();
    loadAllTenantRequests();
    loadQuartersSummary();
  }, [loadCycles, loadAllRequests, loadAllTenantRequests, loadQuartersSummary]);

  // Close mini-menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (miniMenuRef.current && !miniMenuRef.current.contains(e.target as Node)) {
        setMiniMenuTarget(null);
      }
    }
    if (miniMenuTarget) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [miniMenuTarget]);

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

  const handleDeallocate = async (req: QuarterRequest) => {
    const allotment = req.allotment;
    if (!allotment) return;
    try {
      await quartersService.deallocateRequest(allotment.id, req.id);
      addToast('Request deallocated — returned to Submitted', 'success');
      setMiniMenuTarget(null);
      loadAllRequests();
    } catch {
      addToast('Failed to deallocate', 'error');
    }
  };

  const handleCancelAllocated = async (req: QuarterRequest) => {
    const allotment = req.allotment;
    if (!allotment) return;
    try {
      await quartersService.cancelAllocatedRequest(allotment.id, req.id);
      addToast('Request cancelled', 'success');
      setMiniMenuTarget(null);
      loadAllRequests();
    } catch {
      addToast('Failed to cancel request', 'error');
    }
  };

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

  // DP counts: Occupied → Allotted → Allocated (pending approval) → Submitted → Draft
  const dpCounts = React.useMemo(() => ({
    occupied:  allRequests.filter(r => r.request_status === 'ACKNOWLEDGED').length,
    allotted:  allRequests.filter(r => r.request_status === 'ALLOTTED' && r.allotment?.approval_status !== 'PENDING').length,
    allocated: allRequests.filter(r => r.request_status === 'ALLOTTED' && r.allotment?.approval_status === 'PENDING').length,
    submitted: allRequests.filter(r => r.request_status === 'SUBMITTED').length,
    draft:     allRequests.filter(r => r.request_status === 'DRAFT').length,
  }), [allRequests]);

  const dpFilteredRequests = React.useMemo(() => {
    if (dpFilter === 'all') return [];
    if (dpFilter === 'occupied')  return allRequests.filter(r => r.request_status === 'ACKNOWLEDGED');
    if (dpFilter === 'allotted')  return allRequests.filter(r => r.request_status === 'ALLOTTED' && r.allotment?.approval_status !== 'PENDING');
    if (dpFilter === 'allocated') return allRequests.filter(r => r.request_status === 'ALLOTTED' && r.allotment?.approval_status === 'PENDING');
    if (dpFilter === 'submitted') return allRequests.filter(r => r.request_status === 'SUBMITTED');
    if (dpFilter === 'draft')     return allRequests.filter(r => r.request_status === 'DRAFT');
    return [];
  }, [allRequests, dpFilter]);

  return (
    <div className="min-h-screen bg-gray-50">
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
          <button
            onClick={() => setViewMode(v => v === 'allocation' ? 'dp' : 'allocation')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'allocation'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            <BarChart3 size={15} />
            Allocation
          </button>
        </div>

        {/* DP Summary Cards — only in dp mode */}
        {viewMode === 'dp' && <div className="mb-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quartersSummary && (
              <SummaryStatsCard
                label="Total Quarters"
                value={quartersSummary.total}
                icon={Building2}
                gradient="bg-gradient-to-r from-slate-600 to-slate-500"
                delay={0}
                subtitle="All housing units"
                secondaryValue={quartersSummary.available}
                secondaryLabel="Free"
              />
            )}
            {quartersSummary && quartersSummary.available > 0 && (
              <SummaryStatsCard
                label="Available"
                value={quartersSummary.available}
                icon={CheckCircle}
                gradient="bg-gradient-to-r from-emerald-400 to-teal-400"
                delay={25}
                subtitle="Ready for allotment"
                trend={quartersSummary.total > 0 ? Math.round((quartersSummary.available / quartersSummary.total) * 100) : 0}
              />
            )}
            {dpCounts.occupied > 0 && (
              <SummaryStatsCard
                label="Occupied"
                value={dpCounts.occupied}
                icon={ThumbsUp}
                gradient="bg-gradient-to-r from-teal-500 to-emerald-600"
                onClick={() => setDpFilter(dpFilter === 'occupied' ? 'all' : 'occupied')}
                isActive={dpFilter === 'occupied'}
                delay={75}
                subtitle="Currently occupied"
              />
            )}
            {dpCounts.allotted > 0 && (
              <SummaryStatsCard
                label="Allotted"
                value={dpCounts.allotted}
                icon={CheckCircle}
                gradient="bg-gradient-to-r from-cyan-500 to-blue-500"
                onClick={() => setDpFilter(dpFilter === 'allotted' ? 'all' : 'allotted')}
                isActive={dpFilter === 'allotted'}
                delay={125}
                subtitle="Confirmed allotments"
              />
            )}
            {dpCounts.allocated > 0 && (
              <SummaryStatsCard
                label="Allocated"
                value={dpCounts.allocated}
                icon={Clock}
                gradient="bg-gradient-to-r from-amber-500 to-orange-400"
                onClick={() => setDpFilter(dpFilter === 'allocated' ? 'all' : 'allocated')}
                isActive={dpFilter === 'allocated'}
                delay={175}
                subtitle="Pending check-in"
              />
            )}
            {dpCounts.submitted > 0 && (
              <SummaryStatsCard
                label="Submitted"
                value={dpCounts.submitted}
                icon={Send}
                gradient="bg-gradient-to-r from-blue-600 to-sky-500"
                onClick={() => setDpFilter(dpFilter === 'submitted' ? 'all' : 'submitted')}
                isActive={dpFilter === 'submitted'}
                delay={225}
                subtitle="Awaiting review"
              />
            )}
            {dpCounts.draft > 0 && (
              <SummaryStatsCard
                label="Draft"
                value={dpCounts.draft}
                icon={Hash}
                gradient="bg-gradient-to-r from-slate-400 to-gray-500"
                onClick={() => setDpFilter(dpFilter === 'draft' ? 'all' : 'draft')}
                isActive={dpFilter === 'draft'}
                delay={275}
                subtitle="Incomplete requests"
              />
            )}
          </div>
        </div>}

        {/* Allocation Panel — only in allocation mode */}
        {viewMode === 'allocation' && (
          <div className="mb-5 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <BarChart3 size={15} className="text-slate-600" />
                  <span className="text-sm font-semibold text-gray-900">Allocation Overview</span>
                  {selectedCycle && (
                    <span className="text-xs text-gray-500">— {selectedCycle.cycle_name}</span>
                  )}
                </div>
                {cycleAllotments.length > 0 && (
                  <div className="flex items-center gap-3 ml-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                      {cycleAllotments.length} Total
                    </span>
                    <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
                      {cycleAllotments.filter(a => a.approval_status === 'PENDING').length} Pending
                    </span>
                    <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full font-medium">
                      {cycleAllotments.filter(a => a.approval_status === 'ACKNOWLEDGED').length} Acknowledged
                    </span>
                    <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
                      {cycleAllotments.filter(a => a.approval_status === 'APPROVED').length} Approved
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setViewMode('dp')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle size={15} />
              </button>
            </div>
            {loadingCycleData ? (
              <div className="py-10 text-center text-sm text-gray-400">Loading…</div>
            ) : cycleAllotments.length === 0 ? (
              <div className="py-12 text-center">
                <Building2 size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No allotments for the selected cycle.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {['Sl. No.', 'Quarter', 'Request No.', 'BHK / Rent', 'Pref Used', 'Allotted On', 'Overridden', 'Status', ''].map(h => (
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
                          <td className="px-4 py-3 text-xs text-gray-500 font-medium">{i + 1}</td>
                          <td className="px-4 py-3">
                            {q ? (
                              <div className="flex items-center gap-2.5">
                                <img src={getImage(q, i)} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                                <div className="font-semibold text-gray-900 text-sm">{q.quarter_number}</div>
                              </div>
                            ) : <span className="text-xs text-gray-400">—</span>}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-700">{req?.request_number ?? '—'}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {q ? <>{q.bhk_config} · {fmtINR(q.monthly_rent)}</> : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {prefUsed !== undefined ? (
                              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">P-{prefUsed}</span>
                            ) : <span className="text-xs text-gray-400">—</span>}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                            {fmtDate(allot.allotment_date)}
                          </td>
                          <td className="px-4 py-3">
                            {allot.is_overridden ? (
                              <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">Yes</span>
                            ) : <span className="text-xs text-gray-400">—</span>}
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

        {/* DP filtered list — only in dp mode */}
        {viewMode === 'dp' && dpFilter !== 'all' && (
          <div className="mb-5 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{dpFilter.charAt(0).toUpperCase() + dpFilter.slice(1)} Requests</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{dpFilteredRequests.length}</span>
              </div>
              <button onClick={() => setDpFilter('all')} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                <XCircle size={14} />
              </button>
            </div>
            {dpFilteredRequests.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">No records in this category</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {['Request No.', 'Quarter', 'BHK / Location', 'Move-in', 'Family', 'Status', dpFilter === 'allocated' ? 'Override' : 'Updated'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dpFilteredRequests.map((req, i) => {
                      const sc = reqStatusConfig(req.request_status);
                      const q = req.allotment?.quarter;
                      const isAllocated = dpFilter === 'allocated';
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
                          <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap relative">
                            {isAllocated && req.allotment ? (
                              <div className="relative inline-block">
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    setMiniMenuTarget(
                                      miniMenuTarget?.req.id === req.id ? null : { req, allotment: req.allotment! }
                                    );
                                  }}
                                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors font-medium"
                                >
                                  <Settings size={12} /> Override
                                </button>
                              </div>
                            ) : fmtDate(req.updated_at)}
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

        {/* Override Mini-menu */}
        {miniMenuTarget && (() => {
          const { req } = miniMenuTarget;
          return (
            <div
              ref={miniMenuRef}
              className="fixed z-50 right-8 bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 overflow-hidden"
              style={{ top: '50%', transform: 'translateY(-50%)' }}
            >
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-gray-900">Override — {req.request_number}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{req.allotment?.quarter?.quarter_number ?? '—'} · {req.allotment?.quarter?.bhk_config}</div>
                </div>
                <button onClick={() => setMiniMenuTarget(null)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                  <XCircle size={16} />
                </button>
              </div>

              <div className="py-1">
                {/* Destructive group */}
                <div className="px-3 pt-2 pb-1">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Destructive</div>
                  <button
                    onClick={() => handleDeallocate(req)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-red-50 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0 group-hover:bg-red-100">
                      <Trash2 size={13} className="text-red-600" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-800">Deallocate Request</div>
                      <div className="text-[10px] text-gray-400">Return to Submitted — quarter back to pool</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleCancelAllocated(req)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-red-50 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0 group-hover:bg-red-100">
                      <Ban size={13} className="text-red-600" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-800">Cancel Request</div>
                      <div className="text-[10px] text-gray-400">Permanently cancel — mark as Withdrawn</div>
                    </div>
                  </button>
                </div>

                <div className="border-t border-gray-100 mx-3 my-1" />

                {/* Reassign group */}
                <div className="px-3 py-1">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Reassign</div>
                  {[
                    { icon: <Star size={13} className="text-amber-600" />, bg: 'bg-amber-50', label: 'Assign Another Preference', desc: "Pick from Request A's preference list", action: 'pref' },
                    { icon: <Plus size={13} className="text-blue-600" />, bg: 'bg-blue-50', label: 'Assign Available Property', desc: 'Search and assign any available quarter', action: 'new' },
                  ].map(item => (
                    <button
                      key={item.action}
                      onClick={() => {
                        setOverrideInitialAction(item.action);
                        setOverrideTarget(req.allotment!);
                        setMiniMenuTarget(null);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-gray-50 transition-colors group"
                    >
                      <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                        {item.icon}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-800">{item.label}</div>
                        <div className="text-[10px] text-gray-400">{item.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="border-t border-gray-100 mx-3 my-1" />

                {/* Swap group */}
                <div className="px-3 py-1 pb-2">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Swap with Request B</div>
                  {[
                    { icon: <ArrowLeftRight size={13} className="text-emerald-600" />, bg: 'bg-emerald-50', label: 'Swap A↔B', desc: 'Assign B to A · Cancel Request B', action: 'swap' },
                    { icon: <Shuffle size={13} className="text-sky-600" />, bg: 'bg-sky-50', label: "Swap + B's Preference", desc: "Assign B to A · Assign B a new preference", action: 'swapPref' },
                    { icon: <Layers size={13} className="text-violet-600" />, bg: 'bg-violet-50', label: 'Swap + B Available', desc: 'Assign B to A · Assign B an available property', action: 'swapNew' },
                  ].map(item => (
                    <button
                      key={item.action}
                      onClick={() => {
                        setOverrideInitialAction(item.action);
                        setOverrideTarget(req.allotment!);
                        setMiniMenuTarget(null);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-gray-50 transition-colors group"
                    >
                      <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                        {item.icon}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-800">{item.label}</div>
                        <div className="text-[10px] text-gray-400">{item.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Compact Cycle Selector — hidden in DP view */}
        {viewMode !== 'dp' && selectedCycle && (
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-2.5 mb-4 flex flex-wrap items-center gap-3">
            <Calendar size={13} className="text-gray-400 shrink-0" />
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
            {selectedCycle.status === 'OPEN' && (
              <>
                <div className="flex-1" />
                <button
                  onClick={handleFinaliseCycle}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-medium hover:bg-slate-700 transition-colors"
                >
                  <CheckCircle size={13} /> Finalise Cycle
                </button>
              </>
            )}
          </div>
        )}

        {/* Tabs — hidden in DP view */}
        {viewMode !== 'dp' && <div className="flex gap-1 mb-5 bg-white rounded-xl border border-gray-200 p-1 w-fit flex-wrap">
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
        </div>}

        {viewMode !== 'dp' && (loading ? (
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
            {activeTab === 'requests' && (() => {
              const submittedRequests = cycleRequests.filter(r => r.request_status === 'SUBMITTED');
              const visibleCycleReqs = cycleReqSearch
                ? submittedRequests.filter(r =>
                    r.request_number?.toLowerCase().includes(cycleReqSearch.toLowerCase()) ||
                    r.required_bhk_config?.toLowerCase().includes(cycleReqSearch.toLowerCase()) ||
                    r.preferred_location?.toLowerCase().includes(cycleReqSearch.toLowerCase())
                  )
                : submittedRequests;
              return (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">Submitted Requests</span>
                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-medium">
                      {visibleCycleReqs.length}
                    </span>
                  </div>
                  <div className="px-5 py-3 border-b border-gray-100">
                    <MandatorySearchBar
                      fields={[
                        {
                          key: 'search',
                          label: 'Search',
                          type: 'text',
                          placeholder: 'Request no., BHK, preferred location…',
                          value: cycleReqSearch,
                          onChange: setCycleReqSearch,
                          icon: <Search size={14} />,
                        },
                      ]}
                    />
                  </div>
                  {loadingCycleData ? (
                    <div className="py-12 text-center text-gray-400 text-sm">Loading…</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            {['Sl. No.', 'Request No.', 'Requested For', 'Reason', 'BHK Required', 'Preferred Location', 'Preferences', 'Move-in', ''].map(h => (
                              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {visibleCycleReqs.length === 0 ? (
                            <tr><td colSpan={9} className="text-center py-12 text-gray-400 text-sm">No submitted requests for this cycle</td></tr>
                          ) : visibleCycleReqs.map((req, idx) => (
                            <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-xs text-gray-500 font-medium">{idx + 1}</td>
                              <td className="px-4 py-3 font-mono text-xs text-gray-700">{req.request_number}</td>
                              <td className="px-4 py-3">
                                {req.request_for === 'EMPLOYEE' && req.on_behalf_employee_name ? (
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{req.on_behalf_employee_name.charAt(0)}</div>
                                    <div className="min-w-0">
                                      <div className="text-xs font-semibold text-blue-900 truncate max-w-[100px]">{req.on_behalf_employee_name}</div>
                                      <div className="text-[10px] text-blue-500">{req.on_behalf_employee_id}</div>
                                    </div>
                                  </div>
                                ) : req.request_for === 'TP' && req.tp_name ? (
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{req.tp_name.charAt(0)}</div>
                                    <div className="min-w-0">
                                      <div className="text-xs font-semibold text-amber-900 truncate max-w-[100px]">{req.tp_name}</div>
                                      <div className="text-[10px] text-amber-600 truncate max-w-[100px]">{req.tp_organization}</div>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Self</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-600 max-w-[150px] truncate">{req.request_reason || '—'}</td>
                              <td className="px-4 py-3 text-gray-600">{req.required_bhk_config || '—'}</td>
                              <td className="px-4 py-3 text-gray-600">{req.preferred_location || '—'}</td>
                              <td className="px-4 py-3">
                                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                                  {req.preferences?.length ?? 0} prefs
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                {req.move_in_date ? fmtDate(req.move_in_date) : '—'}
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
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Allotments Tab ─────────────────────────────────────── */}
            {activeTab === 'allotments' && (() => {
              const visibleAllotments = allotSearch
                ? cycleAllotments.filter(a => {
                    const q = a.quarter as Quarter | undefined;
                    const req = a.request as QuarterRequest | undefined;
                    const s = allotSearch.toLowerCase();
                    return (
                      q?.quarter_number?.toLowerCase().includes(s) ||
                      req?.request_number?.toLowerCase().includes(s)
                    );
                  })
                : cycleAllotments;
              return (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {cycleAllotments.length > 0 && (
                  <div className="px-5 py-3 border-b border-gray-100">
                    <MandatorySearchBar
                      fields={[
                        {
                          key: 'search',
                          label: 'Search',
                          type: 'text',
                          placeholder: 'Quarter number or request no…',
                          value: allotSearch,
                          onChange: setAllotSearch,
                          icon: <Search size={14} />,
                        },
                      ]}
                    />
                  </div>
                )}
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
                          {['Sl. No.', 'Allotted Quarter', 'Request No.', 'Pref Used', 'Allotted On', 'Overridden', 'Status', ''].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {visibleAllotments.map((allot, i) => {
                          const q = allot.quarter as Quarter | undefined;
                          const req = allot.request as QuarterRequest | undefined;
                          const prefUsed = req?.preferences?.find(p => p.quarter_id === q?.id)?.preference_rank;
                          return (
                            <tr key={allot.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-xs text-gray-500 font-medium">{i + 1}</td>
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
              );
            })()}

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
                <MandatorySearchBar
                  fields={[
                    {
                      key: 'search',
                      label: 'Search',
                      type: 'text',
                      placeholder: 'Request no., BHK, location…',
                      value: allReqSearch,
                      onChange: setAllReqSearch,
                      icon: <Search size={14} />,
                    },
                    {
                      key: 'status',
                      label: 'Status',
                      type: 'chips',
                      value: allReqStatus,
                      onChange: setAllReqStatus,
                      options: ALL_STATUS_OPTIONS.map(s => ({ value: s.value, label: s.label })),
                    },
                  ]}
                  className="mb-0"
                />
                <div className="flex justify-end mt-1.5">
                  <span className="text-xs text-gray-500">{filteredAllRequests.length} of {allRequests.length} requests</span>
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
                <MandatorySearchBar
                  fields={[
                    {
                      key: 'search',
                      label: 'Search',
                      type: 'text',
                      placeholder: 'Quarter no., reason…',
                      value: tenantSearch,
                      onChange: setTenantSearch,
                      icon: <Search size={14} />,
                    },
                    {
                      key: 'type',
                      label: 'Request Type',
                      type: 'chips',
                      value: tenantTypeFilter,
                      onChange: setTenantTypeFilter,
                      options: [
                        { value: 'ALL', label: 'All' },
                        { value: 'EXTEND', label: 'Extend' },
                        { value: 'UPGRADE', label: 'Upgrade' },
                        { value: 'VACATE', label: 'Vacate' },
                      ],
                    },
                    {
                      key: 'status',
                      label: 'Status',
                      type: 'chips',
                      value: tenantStatusFilter,
                      onChange: setTenantStatusFilter,
                      options: [
                        { value: 'ALL', label: 'All' },
                        { value: 'PENDING', label: 'Pending' },
                        { value: 'APPROVED', label: 'Approved' },
                        { value: 'REJECTED', label: 'Rejected' },
                      ],
                    },
                  ]}
                  className="mb-0"
                />
                <div className="flex justify-end mt-1.5">
                  <span className="text-xs text-gray-500">{filteredTenantRequests.length} of {allTenantRequests.length} requests</span>
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
        ))}
      </main>

      <QuarterOverrideModal
        isOpen={!!overrideTarget}
        onClose={() => { setOverrideTarget(null); setOverrideInitialAction(undefined); }}
        allotment={overrideTarget}
        allCycleAllotments={overrideInitialAction
          ? allRequests.filter(r => r.allotment).map(r => r.allotment!) as QuarterAllotment[]
          : cycleAllotments}
        eoAuthId={user?.id ?? ''}
        initialAction={overrideInitialAction}
        onOverrideSaved={() => {
          if (selectedCycle) loadCycleData(selectedCycle);
          loadAllRequests();
        }}
      />
    </div>
  );
};
