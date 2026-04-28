import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home, ChevronRight, Plus, FileText, CheckCircle, Clock, XCircle,
  ArrowUp, ArrowDown, Trash2, Search, Star, Filter, X, Eye, Send,
  Bed, Ruler, AlertCircle, Building2, CalendarDays, Upload,
  ThumbsUp, ThumbsDown, ArrowRightCircle, RefreshCw, LogOut,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import {
  quartersService,
  Quarter,
  QuarterRequest,
  QuarterRequestPreference,
  QuarterAllotmentCycle,
  QuarterTenantRequest,
  CreateTenantRequestInput,
} from '../services/quartersService';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { ROUTES } from '../constants/routes';

// ─── helpers ──────────────────────────────────────────────────────────────────

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

function fmtINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN');
}

function statusConfig(status: string) {
  const cfg: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    DRAFT:              { label: 'Draft',            cls: 'bg-amber-50 text-amber-700 border border-amber-200',   icon: <Clock size={11} /> },
    SUBMITTED:         { label: 'Submitted',         cls: 'bg-blue-50 text-blue-700 border border-blue-200',      icon: <Send size={11} /> },
    ALLOTTED:          { label: 'Allotted',          cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: <CheckCircle size={11} /> },
    ACKNOWLEDGED:      { label: 'Acknowledged',      cls: 'bg-teal-50 text-teal-700 border border-teal-200',      icon: <ThumbsUp size={11} /> },
    REJECTED:          { label: 'Rejected',          cls: 'bg-red-50 text-red-700 border border-red-200',         icon: <ThumbsDown size={11} /> },
    EXTEND_REQUESTED:  { label: 'Extension Req.',    cls: 'bg-amber-50 text-amber-700 border border-amber-200',   icon: <RefreshCw size={11} /> },
    UPGRADE_REQUESTED: { label: 'Upgrade Req.',      cls: 'bg-sky-50 text-sky-700 border border-sky-200',         icon: <ArrowRightCircle size={11} /> },
    VACATE_REQUESTED:  { label: 'Vacate Req.',       cls: 'bg-orange-50 text-orange-700 border border-orange-200',icon: <LogOut size={11} /> },
    VACATED:           { label: 'Vacated',           cls: 'bg-gray-100 text-gray-500 border border-gray-200',     icon: <XCircle size={11} /> },
    WITHDRAWN:         { label: 'Withdrawn',         cls: 'bg-gray-100 text-gray-500 border border-gray-200',     icon: <XCircle size={11} /> },
  };
  return cfg[status] ?? cfg.DRAFT;
}

function tenantStatusConfig(status: string) {
  const cfg: Record<string, { label: string; cls: string }> = {
    PENDING:   { label: 'Pending',   cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    APPROVED:  { label: 'Approved',  cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    REJECTED:  { label: 'Rejected',  cls: 'bg-red-50 text-red-700 border border-red-200' },
    WITHDRAWN: { label: 'Withdrawn', cls: 'bg-gray-100 text-gray-500 border border-gray-200' },
  };
  return cfg[status] ?? cfg.PENDING;
}

function serviceTypeConfig(type: string) {
  const cfg: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    EXTEND:  { label: 'Extension',  cls: 'bg-amber-50 text-amber-700 border border-amber-200',  icon: <RefreshCw size={11} /> },
    UPGRADE: { label: 'Upgrade',    cls: 'bg-sky-50 text-sky-700 border border-sky-200',         icon: <ArrowRightCircle size={11} /> },
    VACATE:  { label: 'Vacate',     cls: 'bg-orange-50 text-orange-700 border border-orange-200',icon: <LogOut size={11} /> },
  };
  return cfg[type] ?? cfg.EXTEND;
}

// ─── types ────────────────────────────────────────────────────────────────────

type DPFilter = 'all' | 'open' | 'allotted' | 'occupied' | 'tenantServices' | 'vacated';

interface PrefItem { quarter: Quarter; rank: number; }

interface NewRequestForm {
  request_reason: string;
  required_bhk_config: string;
  preferred_location: string;
  move_in_date: string;
  family_member_count: number;
  employee_notes: string;
}

const DEFAULT_FORM: NewRequestForm = {
  request_reason: '',
  required_bhk_config: '',
  preferred_location: '',
  move_in_date: '',
  family_member_count: 1,
  employee_notes: '',
};

// ─── component ────────────────────────────────────────────────────────────────

export const QuarterRequestsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const addToast = useUIStore(s => s.addToast);

  const [requests, setRequests] = useState<QuarterRequest[]>([]);
  const [tenantRequests, setTenantRequests] = useState<QuarterTenantRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<QuarterRequest | null>(null);
  const [selectedTenantReq, setSelectedTenantReq] = useState<QuarterTenantRequest | null>(null);
  const [activeCycle, setActiveCycle] = useState<QuarterAllotmentCycle | null>(null);
  const [loading, setLoading] = useState(true);

  // Header DP filter
  const [dpFilter, setDpFilter] = useState<DPFilter>('all');

  // New-request modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [form, setForm] = useState<NewRequestForm>(DEFAULT_FORM);
  const [prefs, setPrefs] = useState<PrefItem[]>([]);
  const [modalQuarters, setModalQuarters] = useState<Quarter[]>([]);
  const [modalSearch, setModalSearch] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // My Requests list filters
  const [reqSearch, setReqSearch] = useState('');
  const [reqSort, setReqSort] = useState<'newest' | 'oldest'>('newest');

  // Right-panel action state
  type RightAction = null | 'acknowledge' | 'reject' | 'extend' | 'upgrade' | 'vacate';
  const [rightAction, setRightAction] = useState<RightAction>(null);
  const [actionRemarks, setActionRemarks] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionDocUrl, setActionDocUrl] = useState('');
  const [actionDate, setActionDate] = useState('');
  const [actionBhk, setActionBhk] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  function resetActionForm() {
    setRightAction(null);
    setActionRemarks('');
    setActionReason('');
    setActionDocUrl('');
    setActionDate('');
    setActionBhk('');
  }

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [reqs, cycle, tReqs] = await Promise.all([
        quartersService.getMyRequests(user.id),
        quartersService.getActiveCycle(),
        quartersService.getMyTenantRequests(user.id),
      ]);
      setRequests(reqs);
      setActiveCycle(cycle);
      setTenantRequests(tReqs);
      if (reqs.length > 0 && !selectedRequest) setSelectedRequest(reqs[0]);
    } catch {
      addToast('Failed to load requests', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, addToast]);

  useEffect(() => { loadData(); }, [loadData]);

  // Prefill from freeview "Add to Request"
  useEffect(() => {
    const prefill = (location.state as { prefill?: Quarter })?.prefill;
    if (prefill) {
      setPrefs([{ quarter: prefill, rank: 1 }]);
      setShowNewModal(true);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const loadModalQuarters = useCallback(async () => {
    setModalLoading(true);
    try {
      const data = await quartersService.getQuarters({ occupancy_status: 'AVAILABLE', search: modalSearch || undefined });
      setModalQuarters(data.filter(q => !prefs.find(p => p.quarter.id === q.id)));
    } catch {
      addToast('Failed to load quarters', 'error');
    } finally {
      setModalLoading(false);
    }
  }, [modalSearch, prefs, addToast]);

  useEffect(() => {
    if (showNewModal) {
      const t = setTimeout(loadModalQuarters, 300);
      return () => clearTimeout(t);
    }
  }, [showNewModal, modalSearch, loadModalQuarters]);

  // ─── pref list helpers ──────────────────────────────────────────────────────

  const addPref = (q: Quarter) => {
    if (prefs.length >= 5) { addToast('Maximum 5 preferences allowed', 'warning'); return; }
    if (prefs.find(p => p.quarter.id === q.id)) return;
    setPrefs(prev => [...prev, { quarter: q, rank: prev.length + 1 }]);
  };

  const removePref = (quarterId: string) => {
    setPrefs(prev => prev.filter(p => p.quarter.id !== quarterId).map((p, i) => ({ ...p, rank: i + 1 })));
  };

  const movePref = (idx: number, dir: 'up' | 'down') => {
    setPrefs(prev => {
      const arr = [...prev];
      const target = dir === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr.map((p, i) => ({ ...p, rank: i + 1 }));
    });
  };

  const openNewModal = (req?: QuarterRequest) => {
    if (req) {
      setForm({
        request_reason: req.request_reason,
        required_bhk_config: req.required_bhk_config,
        preferred_location: req.preferred_location,
        move_in_date: req.move_in_date ?? '',
        family_member_count: req.family_member_count,
        employee_notes: req.employee_notes,
      });
      const existing = req.preferences?.map(p => ({ quarter: p.quarter as Quarter, rank: p.preference_rank })) ?? [];
      setPrefs(existing.sort((a, b) => a.rank - b.rank));
    } else {
      setForm(DEFAULT_FORM);
      setPrefs([]);
    }
    setShowNewModal(true);
  };

  // ─── submit handlers ────────────────────────────────────────────────────────

  const handleSaveDraft = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await quartersService.createRequest(user.id, {
        cycle_id: activeCycle?.id ?? null,
        ...form,
        move_in_date: form.move_in_date || null,
        preferences: prefs.map(p => ({ quarter_id: p.quarter.id, preference_rank: p.rank })),
      });
      addToast('Request saved as draft', 'success');
      setShowNewModal(false);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      addToast(
        msg === 'MAX_QUARTERS_REACHED'
          ? 'You already have 2 active quarter requests. The maximum allowed is 2.'
          : 'Failed to save request',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (prefs.length === 0) { addToast('Add at least one preference before submitting', 'warning'); return; }
    setSubmitting(true);
    try {
      const req = await quartersService.createRequest(user.id, {
        cycle_id: activeCycle?.id ?? null,
        ...form,
        move_in_date: form.move_in_date || null,
        preferences: prefs.map(p => ({ quarter_id: p.quarter.id, preference_rank: p.rank })),
      });
      await quartersService.submitRequest(req.id);
      addToast('Request submitted successfully', 'success');
      setShowNewModal(false);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      addToast(
        msg === 'MAX_QUARTERS_REACHED'
          ? 'You already have 2 active quarter requests. The maximum allowed is 2.'
          : 'Failed to submit request',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (reqId: string) => {
    try {
      await quartersService.withdrawRequest(reqId);
      addToast('Request withdrawn', 'success');
      loadData();
    } catch {
      addToast('Failed to withdraw request', 'error');
    }
  };

  const handleAcknowledge = async () => {
    if (!selectedRequest?.allotment) return;
    setActionSubmitting(true);
    try {
      await quartersService.acknowledgeAllotment(selectedRequest.allotment.id, selectedRequest.id, actionRemarks);
      addToast('Allotment acknowledged', 'success');
      resetActionForm();
      loadData();
    } catch {
      addToast('Failed to acknowledge', 'error');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest?.allotment) return;
    if (!actionReason.trim()) { addToast('Please provide a rejection reason', 'warning'); return; }
    setActionSubmitting(true);
    try {
      await quartersService.rejectAllotment(selectedRequest.allotment.id, selectedRequest.id, actionReason, actionDocUrl || undefined);
      addToast('Allotment rejected', 'success');
      resetActionForm();
      loadData();
    } catch {
      addToast('Failed to reject', 'error');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleTenantRequest = async (serviceType: 'EXTEND' | 'UPGRADE' | 'VACATE') => {
    if (!user || !selectedRequest?.allotment) return;
    if (!actionReason.trim()) { addToast('Please provide a reason', 'warning'); return; }
    setActionSubmitting(true);
    try {
      const input: CreateTenantRequestInput = {
        service_type: serviceType,
        remarks: actionRemarks,
        reason: actionReason,
        document_url: actionDocUrl || undefined,
        requested_date: actionDate || null,
        required_bhk_config: actionBhk || undefined,
      };
      await quartersService.createTenantRequest(user.id, selectedRequest.allotment.id, input);
      addToast('Request submitted successfully', 'success');
      resetActionForm();
      loadData();
    } catch {
      addToast('Failed to submit request', 'error');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleWithdrawTenantReq = async (id: string) => {
    try {
      await quartersService.withdrawTenantRequest(id);
      addToast('Request withdrawn', 'success');
      loadData();
    } catch {
      addToast('Failed to withdraw', 'error');
    }
  };

  // ─── derived counts ─────────────────────────────────────────────────────────

  const statCounts = {
    open:            requests.filter(r => ['DRAFT', 'SUBMITTED'].includes(r.request_status)).length,
    allotted:        requests.filter(r => ['ALLOTTED', 'UPGRADE_REQUESTED'].includes(r.request_status)).length,
    occupied:        requests.filter(r => r.request_status === 'ACKNOWLEDGED').length,
    tenantServices:  requests.filter(r => ['EXTEND_REQUESTED', 'VACATE_REQUESTED'].includes(r.request_status)).length,
    vacated:         requests.filter(r => r.request_status === 'VACATED').length,
  };

  // ─── filtered request lists ─────────────────────────────────────────────────

  const filteredRequests = React.useMemo(() => {
    let result = [...requests];

    if (dpFilter === 'open')           result = result.filter(r => ['DRAFT', 'SUBMITTED'].includes(r.request_status));
    else if (dpFilter === 'allotted')  result = result.filter(r => ['ALLOTTED', 'UPGRADE_REQUESTED'].includes(r.request_status));
    else if (dpFilter === 'occupied')  result = result.filter(r => r.request_status === 'ACKNOWLEDGED');
    else if (dpFilter === 'tenantServices') result = result.filter(r => ['EXTEND_REQUESTED', 'VACATE_REQUESTED'].includes(r.request_status));
    else if (dpFilter === 'vacated')   result = result.filter(r => r.request_status === 'VACATED');

    if (reqSearch.trim()) {
      const q = reqSearch.toLowerCase();
      result = result.filter(r =>
        r.request_number?.toLowerCase().includes(q) ||
        r.required_bhk_config?.toLowerCase().includes(q) ||
        r.preferred_location?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return reqSort === 'newest' ? diff : -diff;
    });
    return result;
  }, [requests, dpFilter, reqSearch, reqSort]);

  const filteredTenantRequests = React.useMemo(() => {
    return [...tenantRequests].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [tenantRequests]);

  const isTenantView = dpFilter === 'tenantServices';
  const selectedPrefs = selectedRequest?.preferences?.sort((a, b) => a.preference_rank - b.preference_rank) ?? [];

  const dpItems: { key: DPFilter; label: string; count: number; color: string }[] = [
    { key: 'open',           label: 'Open',           count: statCounts.open,           color: 'text-blue-700 bg-blue-50 border-blue-200' },
    { key: 'allotted',       label: 'Allotted',       count: statCounts.allotted,       color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { key: 'occupied',       label: 'Occupied',       count: statCounts.occupied,       color: 'text-teal-700 bg-teal-50 border-teal-200' },
    { key: 'tenantServices', label: 'Tenant Services',count: statCounts.tenantServices, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { key: 'vacated',        label: 'Vacated',        count: statCounts.vacated,        color: 'text-gray-600 bg-gray-100 border-gray-200' },
  ];

  // ─── right panel sections ────────────────────────────────────────────────────

  const RightPanelAllotted = () => {
    if (!selectedRequest?.allotment) return null;
    const allotment = selectedRequest.allotment;
    const q = allotment.quarter;
    return (
      <>
        {/* Allotted quarter detail */}
        {q && (
          <div className="p-5 border-b border-gray-100">
            <div className="flex gap-4 bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <img src={getImage(q, 0)} alt={q.quarter_number} className="w-20 h-20 rounded-lg object-cover shrink-0" />
              <div>
                <div className="font-bold text-gray-900 text-base">{q.quarter_number}</div>
                <div className="text-xs text-gray-500 mt-0.5">{q.address || `${q.block_name} Block`}</div>
                <div className="flex items-center gap-3 text-xs text-gray-700 mt-2">
                  <span className="flex items-center gap-1"><Bed size={11} />{q.bhk_config}</span>
                  <span className="flex items-center gap-1"><Ruler size={11} />{q.area_sqft} sq.ft</span>
                  <span className="font-semibold text-emerald-700">{fmtINR(q.monthly_rent)}/mo</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Allotment date: {fmtDate(allotment.allotment_date)}</div>
              </div>
            </div>
            {allotment.allotment_conditions && (
              <div className="mt-3 text-xs text-gray-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                <span className="font-medium text-amber-700">Conditions: </span>{allotment.allotment_conditions}
              </div>
            )}
          </div>
        )}

        {/* Action zone */}
        <div className="p-5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Your Action Required</div>

          {rightAction === null && (
            <div className="space-y-2">
              <div className="flex gap-3">
                <button
                  onClick={() => setRightAction('acknowledge')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  <ThumbsUp size={15} /> Acknowledge
                </button>
                <button
                  onClick={() => setRightAction('reject')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  <ThumbsDown size={15} /> Reject
                </button>
              </div>
              <button
                onClick={() => setRightAction('upgrade')}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-sky-200 text-sky-700 text-sm font-medium hover:bg-sky-50 transition-colors"
              >
                <ArrowRightCircle size={15} /> Request Upgrade
              </button>
              <p className="text-[10px] text-gray-400 text-center">Request a higher-grade quarter instead of accepting this allotment</p>
            </div>
          )}

          {rightAction === 'upgrade' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-sky-700 flex items-center gap-1.5"><ArrowRightCircle size={14} /> Upgrade Request</span>
                <button onClick={resetActionForm} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Required BHK Config *</label>
                <input
                  value={actionBhk}
                  onChange={e => setActionBhk(e.target.value)}
                  placeholder="e.g. 4 BHK"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Reason *</label>
                <textarea
                  value={actionReason}
                  onChange={e => setActionReason(e.target.value)}
                  rows={2}
                  placeholder="Reason for requesting an upgrade…"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
                <input
                  value={actionRemarks}
                  onChange={e => setActionRemarks(e.target.value)}
                  placeholder="Additional remarks…"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Document URL (optional)</label>
                <div className="relative">
                  <Upload size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={actionDocUrl}
                    onChange={e => setActionDocUrl(e.target.value)}
                    placeholder="https://…"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={resetActionForm} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                <button
                  onClick={() => handleTenantRequest('UPGRADE')}
                  disabled={actionSubmitting}
                  className="flex-1 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-50 transition-colors"
                >
                  {actionSubmitting ? 'Submitting…' : 'Submit Upgrade Request'}
                </button>
              </div>
            </div>
          )}

          {rightAction === 'acknowledge' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5"><ThumbsUp size={14} /> Acknowledge Allotment</span>
                <button onClick={resetActionForm} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Remarks (optional)</label>
                <textarea
                  value={actionRemarks}
                  onChange={e => setActionRemarks(e.target.value)}
                  rows={3}
                  placeholder="Any remarks about the allotment…"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={resetActionForm} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                <button
                  onClick={handleAcknowledge}
                  disabled={actionSubmitting}
                  className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {actionSubmitting ? 'Saving…' : 'Confirm Acknowledgement'}
                </button>
              </div>
            </div>
          )}

          {rightAction === 'reject' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-red-700 flex items-center gap-1.5"><ThumbsDown size={14} /> Reject Allotment</span>
                <button onClick={resetActionForm} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Rejection Reason *</label>
                <textarea
                  value={actionReason}
                  onChange={e => setActionReason(e.target.value)}
                  rows={3}
                  placeholder="State the reason for rejection…"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Supporting Document URL (optional)</label>
                <div className="relative">
                  <Upload size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={actionDocUrl}
                    onChange={e => setActionDocUrl(e.target.value)}
                    placeholder="https://…"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={resetActionForm} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                <button
                  onClick={handleReject}
                  disabled={actionSubmitting}
                  className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {actionSubmitting ? 'Saving…' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  const RightPanelOccupied = () => {
    if (!selectedRequest?.allotment) return null;
    const allotment = selectedRequest.allotment;
    const q = allotment.quarter;
    return (
      <>
        {q && (
          <div className="p-5 border-b border-gray-100">
            <div className="flex gap-4 bg-teal-50 rounded-xl p-4 border border-teal-100">
              <img src={getImage(q, 0)} alt={q.quarter_number} className="w-20 h-20 rounded-lg object-cover shrink-0" />
              <div>
                <div className="font-bold text-gray-900 text-base">{q.quarter_number}</div>
                <div className="text-xs text-gray-500 mt-0.5">{q.address || `${q.block_name} Block`}</div>
                <div className="flex items-center gap-3 text-xs text-gray-700 mt-2">
                  <span className="flex items-center gap-1"><Bed size={11} />{q.bhk_config}</span>
                  <span className="flex items-center gap-1"><Ruler size={11} />{q.area_sqft} sq.ft</span>
                  <span className="font-semibold text-teal-700">{fmtINR(q.monthly_rent)}/mo</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Occupied since: {fmtDate(allotment.acknowledged_at ?? allotment.allotment_date)}</div>
              </div>
            </div>
          </div>
        )}

        <div className="p-5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tenant Services</div>

          {rightAction === null && (
            <div className="grid grid-cols-2 gap-3">
              {([
                { action: 'extend' as RightAction, label: 'Extend Lease', icon: <RefreshCw size={15} />, cls: 'border-amber-200 text-amber-700 hover:bg-amber-50' },
                { action: 'vacate' as RightAction, label: 'Vacate Quarter', icon: <LogOut size={15} />, cls: 'border-orange-200 text-orange-700 hover:bg-orange-50' },
              ]).map(({ action, label, icon, cls }) => (
                <button
                  key={action as string}
                  onClick={() => setRightAction(action)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm font-medium transition-colors ${cls}`}
                >
                  {icon}
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
          )}

          {(rightAction === 'extend' || rightAction === 'vacate') && (() => {
            const serviceType = (rightAction.toUpperCase()) as 'EXTEND' | 'VACATE';
            const cfg = serviceTypeConfig(serviceType);
            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-semibold flex items-center gap-1.5 ${cfg.cls.split(' ').filter(c => c.startsWith('text-')).join(' ')}`}>
                    {cfg.icon} {cfg.label} Request
                  </span>
                  <button onClick={resetActionForm} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Reason *</label>
                  <textarea
                    value={actionReason}
                    onChange={e => setActionReason(e.target.value)}
                    rows={2}
                    placeholder="Reason for this request…"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
                  <input
                    value={actionRemarks}
                    onChange={e => setActionRemarks(e.target.value)}
                    placeholder="Additional remarks…"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                {(rightAction === 'extend' || rightAction === 'vacate') && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {rightAction === 'extend' ? 'Extension Until Date' : 'Intended Vacate Date'}
                    </label>
                    <div className="relative">
                      <CalendarDays size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        value={actionDate}
                        onChange={e => setActionDate(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Document URL (optional)</label>
                  <div className="relative">
                    <Upload size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={actionDocUrl}
                      onChange={e => setActionDocUrl(e.target.value)}
                      placeholder="https://…"
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={resetActionForm} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                  <button
                    onClick={() => handleTenantRequest(serviceType)}
                    disabled={actionSubmitting}
                    className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {actionSubmitting ? 'Submitting…' : 'Submit Request'}
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </>
    );
  };

  const RightPanelTenantServices = () => {
    const tr = selectedTenantReq;
    if (!tr) {
      return (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          Select a request from the left to view details
        </div>
      );
    }
    const q = tr.allotment?.quarter;
    const sc = tenantStatusConfig(tr.request_status);
    const stc = serviceTypeConfig(tr.service_type);
    return (
      <>
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Request Details</h2>
            <div className="flex gap-2">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1 ${stc.cls}`}>{stc.icon}{stc.label}</span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${sc.cls}`}>{sc.label}</span>
            </div>
          </div>
          {q && (
            <div className="flex gap-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
              <img src={getImage(q, 0)} alt={q.quarter_number} className="w-14 h-14 rounded-lg object-cover shrink-0" />
              <div>
                <div className="font-semibold text-gray-900 text-sm">{q.quarter_number}</div>
                <div className="text-xs text-gray-500">{q.address || `${q.block_name} Block`}</div>
                <div className="text-xs text-gray-600 mt-1">{q.bhk_config} · {fmtINR(q.monthly_rent)}/mo</div>
              </div>
            </div>
          )}
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {tr.reason && (
              <div className="col-span-2">
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Reason</div>
                <div className="text-gray-800">{tr.reason}</div>
              </div>
            )}
            {tr.remarks && (
              <div className="col-span-2">
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Remarks</div>
                <div className="text-gray-700 text-xs">{tr.remarks}</div>
              </div>
            )}
            {tr.requested_date && (
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Requested Date</div>
                <div className="text-gray-800 text-xs flex items-center gap-1"><CalendarDays size={11} />{fmtDate(tr.requested_date)}</div>
              </div>
            )}
            {tr.required_bhk_config && (
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Required BHK</div>
                <div className="text-gray-800 text-xs">{tr.required_bhk_config}</div>
              </div>
            )}
            {tr.document_url && (
              <div className="col-span-2">
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Document</div>
                <a href={tr.document_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate block">{tr.document_url}</a>
              </div>
            )}
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Submitted</div>
              <div className="text-gray-700 text-xs">{fmtDate(tr.created_at)}</div>
            </div>
          </div>
          {tr.eo_notes && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-800">
              <span className="font-semibold">Officer Notes: </span>{tr.eo_notes}
            </div>
          )}
          {tr.request_status === 'PENDING' && (
            <button
              onClick={() => handleWithdrawTenantReq(tr.id)}
              className="w-full py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Withdraw Request
            </button>
          )}
        </div>
      </>
    );
  };

  const RightPanelPreferences = () => (
    <>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Star size={16} className="text-amber-500" /> Preference List
          </h2>
          <div className="text-xs text-gray-500 mt-0.5">
            For <span className="font-mono text-gray-700">{selectedRequest?.request_number}</span> ·{' '}
            <span className={`font-medium ${selectedPrefs.length >= 5 ? 'text-red-600' : 'text-amber-600'}`}>
              {selectedPrefs.length} of 5
            </span> selected
          </div>
        </div>
        {selectedRequest && (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${statusConfig(selectedRequest.request_status).cls}`}>
            {statusConfig(selectedRequest.request_status).icon}
            {statusConfig(selectedRequest.request_status).label}
          </span>
        )}
      </div>

      <div className="p-5">
        {selectedRequest?.request_status === 'DRAFT' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-sm text-amber-800 flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            Drag or use arrows to reorder. Submit when ready.
          </div>
        )}

        {selectedPrefs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Star size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No preferences added yet.</p>
            {selectedRequest?.request_status === 'DRAFT' && (
              <button onClick={() => openNewModal(selectedRequest)} className="mt-3 text-sm text-blue-600 hover:underline">
                Add preferences
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {selectedPrefs.map((pref, i) => {
              const q = pref.quarter as Quarter | undefined;
              if (!q) return null;
              return (
                <div key={pref.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="relative shrink-0">
                    <img src={getImage(q, i)} alt={q.quarter_number} className="w-16 h-16 rounded-lg object-cover" />
                    <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
                      {pref.preference_rank}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm">{q.quarter_number}</div>
                    {q.address && <div className="text-xs text-gray-500 truncate">{q.address}</div>}
                    <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                      <span className="flex items-center gap-1"><Bed size={11} />{q.bhk_config}</span>
                      <span className="flex items-center gap-1"><Ruler size={11} />{q.area_sqft} sq.ft</span>
                      <span className="font-medium text-gray-800">{fmtINR(q.monthly_rent)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedRequest?.request_status === 'DRAFT' && (
          <div className="flex gap-3 mt-5 pt-5 border-t border-gray-100 justify-end">
            <button
              onClick={() => selectedRequest && openNewModal(selectedRequest)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Plus size={14} /> Add / Reorder Preferences
            </button>
            <Button onClick={async () => {
              if (!selectedRequest) return;
              try {
                await quartersService.submitRequest(selectedRequest.id);
                addToast('Request submitted', 'success');
                loadData();
              } catch { addToast('Failed to submit', 'error'); }
            }}>
              <Send size={14} className="mr-1" /> Submit Request
            </Button>
          </div>
        )}
      </div>
    </>
  );

  // ─── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

        {/* ── Compact header card ─────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 mb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                <Home size={11} />
                <ChevronRight size={10} />
                <span>My Workspace</span>
                <ChevronRight size={10} />
                <span className="text-gray-600 font-medium">Quarter Requests</span>
              </div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Quarter Requests</h1>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => navigate(ROUTES.QUARTERS_FREEVIEW)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <Eye size={13} /> Browse Quarters
              </button>
              <Button onClick={() => openNewModal()}>
                <Plus size={13} className="mr-1" /> New Request
              </Button>
            </div>
          </div>

          {/* Info strip + DP pills */}
          {user && (
            <div className="flex items-center mt-2.5 pt-2.5 border-t border-gray-100 flex-wrap gap-y-1.5">
              <div className="flex items-center gap-1.5 pr-3">
                <span className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">Employee</span>
                <span className="text-xs font-semibold text-gray-800">{user.fullName}</span>
              </div>
              <div className="w-px h-4 bg-gray-200 mx-1 shrink-0" />
              <div className="flex items-center gap-1.5 px-3">
                <span className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">Cycle</span>
                <span className="text-xs font-semibold text-gray-800">
                  {activeCycle ? `${activeCycle.cycle_name} · Closes ${new Date(activeCycle.end_date).toLocaleDateString('en-IN')}` : 'No active cycle'}
                </span>
              </div>
              <div className="w-px h-4 bg-gray-200 mx-1 shrink-0" />
              {/* Clickable DP filter pills */}
              <div className="flex items-center gap-1 flex-wrap pl-1">
                <button
                  onClick={() => { setDpFilter('all'); resetActionForm(); }}
                  className={`text-[10px] px-2.5 py-1 rounded-full border font-medium transition-all ${
                    dpFilter === 'all'
                      ? 'bg-gray-700 text-white border-gray-700'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  All ({requests.length})
                </button>
                {dpItems.map(item => {
                  const active = dpFilter === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => { setDpFilter(item.key); resetActionForm(); setSelectedRequest(null); setSelectedTenantReq(null); }}
                      className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full border font-medium transition-all ${
                        active
                          ? 'bg-gray-700 text-white border-gray-700'
                          : `${item.color} hover:opacity-90`
                      }`}
                    >
                      {item.label}
                      <span className={`ml-0.5 font-bold ${active ? 'text-white' : ''}`}>{item.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Main content ──────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 h-64 animate-pulse" />
            ))}
          </div>
        ) : !isTenantView && filteredRequests.length === 0 && requests.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
            <FileText size={40} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-semibold text-gray-700 mb-1">No quarter requests yet</h3>
            <p className="text-sm text-gray-500 mb-6">Create your first request to start the allotment process.</p>
            <Button onClick={() => openNewModal()}><Plus size={15} className="mr-1" /> New Request</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

            {/* ── Left: list ────────────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <FileText size={15} />
                  {isTenantView ? 'Tenant Service Requests' : 'My Requests'}
                </h2>
                <span className="text-xs text-gray-500">
                  {isTenantView
                    ? `${filteredTenantRequests.length} total`
                    : `${filteredRequests.length}${filteredRequests.length < requests.length ? ` of ${requests.length}` : ''} total`}
                </span>
              </div>

              {/* Search + sort (not shown for tenant view for brevity) */}
              {!isTenantView && (
                <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2 shadow-sm">
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by number, BHK, location…"
                      value={reqSearch}
                      onChange={e => setReqSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                    {reqSearch && (
                      <button onClick={() => setReqSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => setReqSort(o => o === 'newest' ? 'oldest' : 'newest')}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                    >
                      <ArrowUp size={11} className={reqSort === 'newest' ? 'text-blue-600' : 'text-gray-400'} />
                      <ArrowDown size={11} className={reqSort === 'oldest' ? 'text-blue-600' : 'text-gray-400'} />
                      {reqSort === 'newest' ? 'Newest first' : 'Oldest first'}
                    </button>
                  </div>
                </div>
              )}

              {/* Tenant service request cards */}
              {isTenantView && (
                filteredTenantRequests.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 py-10 text-center">
                    <Building2 size={28} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">No tenant service requests yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Go to Occupied to raise Extend / Upgrade / Vacate requests.</p>
                  </div>
                ) : filteredTenantRequests.map(tr => {
                  const stc = serviceTypeConfig(tr.service_type);
                  const sc = tenantStatusConfig(tr.request_status);
                  const isSelected = selectedTenantReq?.id === tr.id;
                  const q = tr.allotment?.quarter;
                  return (
                    <div
                      key={tr.id}
                      onClick={() => setSelectedTenantReq(tr)}
                      className={`bg-white rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden hover:shadow-md ${isSelected ? 'border-blue-400 shadow-md ring-1 ring-blue-100' : 'border-gray-200'}`}
                    >
                      <div className="flex">
                        <div className="w-24 shrink-0">
                          {q && <img src={getImage(q, 0)} alt="" className="w-full h-full object-cover" style={{ minHeight: 80 }} />}
                          {!q && <div className="w-full h-full bg-gray-100 flex items-center justify-center" style={{ minHeight: 80 }}><Building2 size={20} className="text-gray-300" /></div>}
                        </div>
                        <div className="flex-1 p-3 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 border ${stc.cls}`}>{stc.icon}{stc.label}</span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${sc.cls}`}>{sc.label}</span>
                          </div>
                          {q && <div className="font-semibold text-gray-900 text-xs truncate">{q.quarter_number} · {q.bhk_config}</div>}
                          <div className="text-xs text-gray-400 mt-0.5">{fmtDate(tr.created_at)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Quarter request cards */}
              {!isTenantView && (
                filteredRequests.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 py-8 text-center">
                    <Filter size={24} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">No requests match this filter.</p>
                    <button onClick={() => { setDpFilter('all'); setReqSearch(''); }} className="mt-2 text-xs text-blue-600 hover:underline">Clear filters</button>
                  </div>
                ) : filteredRequests.map(req => {
                  const sc = statusConfig(req.request_status);
                  const isSelected = selectedRequest?.id === req.id;
                  return (
                    <div
                      key={req.id}
                      onClick={() => { setSelectedRequest(req); resetActionForm(); }}
                      className={`bg-white rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden hover:shadow-md ${isSelected ? 'border-blue-400 shadow-md ring-1 ring-blue-100' : 'border-gray-200'}`}
                    >
                      <div className="flex">
                        <div className="w-28 shrink-0">
                          <img
                            src={req.preferences?.[0]?.quarter ? getImage(req.preferences[0].quarter as Quarter, 0) : PLACEHOLDER_IMAGES[0]}
                            alt=""
                            className="w-full h-full object-cover"
                            style={{ minHeight: 90 }}
                          />
                        </div>
                        <div className="flex-1 p-3 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-xs text-gray-500">{req.request_number}</span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${sc.cls}`}>{sc.icon}{sc.label}</span>
                          </div>
                          <div className="font-semibold text-gray-900 text-sm truncate mb-1">
                            {req.required_bhk_config || 'Any BHK'} · {req.preferred_location || 'Any location'}
                          </div>
                          <div className="text-xs text-gray-500 mb-2">
                            {req.preferences?.length ?? 0} preferences · {fmtDate(req.created_at)}
                          </div>
                          <div className="flex gap-1.5 flex-wrap">
                            {req.request_status === 'DRAFT' && (
                              <button onClick={e => { e.stopPropagation(); openNewModal(req); }} className="text-xs px-2.5 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                                Modify
                              </button>
                            )}
                            {req.request_status === 'SUBMITTED' && (
                              <button onClick={e => { e.stopPropagation(); handleWithdraw(req.id); }} className="text-xs px-2.5 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                                Withdraw
                              </button>
                            )}
                            {req.request_status === 'ALLOTTED' && req.allotment && (
                              <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                                <CheckCircle size={11} /> Allotted: {(req.allotment as any).quarter?.quarter_number}
                              </span>
                            )}
                            {req.request_status === 'ACKNOWLEDGED' && (
                              <span className="text-xs text-teal-700 font-medium flex items-center gap-1">
                                <ThumbsUp size={11} /> Occupying
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── Right: detail panel ───────────────────────────────────── */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl border border-gray-200 min-h-[400px]">
                {isTenantView ? (
                  <RightPanelTenantServices />
                ) : selectedRequest ? (() => {
                  const s = selectedRequest.request_status;
                  if (s === 'ALLOTTED' || s === 'UPGRADE_REQUESTED') return <RightPanelAllotted />;
                  if (s === 'ACKNOWLEDGED' || ['EXTEND_REQUESTED', 'VACATE_REQUESTED'].includes(s)) return <RightPanelOccupied />;
                  return <RightPanelPreferences />;
                })() : (
                  <div className="flex items-center justify-center h-64 text-gray-400">
                    <div className="text-center">
                      <Star size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Select a request to view details</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>

      {/* ── New/Modify Request Modal ──────────────────────────────────────── */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} size="2xl" noPadding>
        <div className="flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-xl">
            <div>
              <h2 className="text-lg font-bold text-gray-900">New Allotment Request</h2>
              <div className="text-xs text-gray-500 mt-0.5">
                {activeCycle ? `Cycle ${activeCycle.cycle_name} · Closes ${new Date(activeCycle.end_date).toLocaleDateString('en-IN')}` : 'No active cycle — will be saved as draft'}
              </div>
            </div>
            <button onClick={() => setShowNewModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Request Reason *', key: 'request_reason' as const, placeholder: 'e.g. Transfer-in' },
                { label: 'Required BHK Config', key: 'required_bhk_config' as const, placeholder: 'e.g. 3 BHK' },
                { label: 'Preferred Location', key: 'preferred_location' as const, placeholder: 'e.g. Block A' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                  <input
                    value={form[key] as string}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Preferred Move-in Date</label>
                <input type="date" value={form.move_in_date} onChange={e => setForm(f => ({ ...f, move_in_date: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Family Members</label>
                <input type="number" min={1} value={form.family_member_count} onChange={e => setForm(f => ({ ...f, family_member_count: Number(e.target.value) }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes (optional)</label>
                <input value={form.employee_notes} onChange={e => setForm(f => ({ ...f, employee_notes: e.target.value }))} placeholder="Any additional notes" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-0">
            <div className="flex flex-col border-r border-gray-100 min-h-0">
              <div className="px-4 pt-4 pb-3 border-b border-gray-100 bg-white">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={modalSearch} onChange={e => setModalSearch(e.target.value)} placeholder="Search available quarters…" className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  <span className="font-medium text-gray-700">{modalQuarters.length}</span> available · click <span className="font-medium text-blue-700">Add</span> to push to preferences
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {modalLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)
                ) : modalQuarters.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">No available quarters found</div>
                ) : (
                  modalQuarters.map((q, i) => (
                    <div key={q.id} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3 hover:bg-white hover:border-gray-200 transition-all">
                      <img src={getImage(q, i)} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm">{q.quarter_number}</div>
                        <div className="text-xs text-gray-500 truncate">{q.address || `${q.block_name} Block`}</div>
                        <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                          <span>{q.bhk_config}</span><span>{q.area_sqft} sq.ft</span>
                          <span className="font-medium text-gray-800">{fmtINR(q.monthly_rent)}</span>
                        </div>
                      </div>
                      <button onClick={() => addPref(q)} disabled={prefs.length >= 5 || !!prefs.find(p => p.quarter.id === q.id)} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0">
                        <Plus size={12} className="inline" /> Add
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-col min-h-0 bg-gray-50/50">
              <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Star size={14} className="text-amber-500" /> Your Preferences</h3>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${prefs.length >= 5 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{prefs.length} / 5</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Reorder with arrows · Remove with trash · Order = priority</p>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {prefs.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    <Star size={28} className="mx-auto mb-2 opacity-30" />
                    <p>No preferences selected.</p>
                    <p>Pick from the left panel.</p>
                  </div>
                ) : (
                  prefs.map((p, i) => (
                    <div key={p.quarter.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                      <div className="relative shrink-0">
                        <img src={getImage(p.quarter, i)} alt="" className="w-12 h-12 rounded-lg object-cover" />
                        <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center">{p.rank}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm">{p.quarter.quarter_number}</div>
                        <div className="text-xs text-gray-500">{p.quarter.bhk_config} · {fmtINR(p.quarter.monthly_rent)}/mo</div>
                      </div>
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button onClick={() => movePref(i, 'up')} disabled={i === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded transition-colors"><ArrowUp size={12} /></button>
                        <button onClick={() => movePref(i, 'down')} disabled={i === prefs.length - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded transition-colors"><ArrowDown size={12} /></button>
                        <button onClick={() => removePref(p.quarter.id)} className="p-1 text-red-400 hover:text-red-600 rounded transition-colors"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-gray-200 flex gap-2">
                <button onClick={handleSaveDraft} disabled={submitting} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">Save as Draft</button>
                <button onClick={handleSubmit} disabled={submitting || prefs.length === 0} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">Submit Request</button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
