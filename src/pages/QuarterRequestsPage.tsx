import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home, ChevronRight, Plus, FileText, CheckCircle, Clock, XCircle,
  ArrowUp, ArrowDown, Trash2, Search, Star, X, Eye, Send,
  Bed, Ruler, AlertCircle, Building2, CalendarDays, Upload,
  ThumbsUp, ThumbsDown, ArrowRightCircle, RefreshCw, LogOut,
  MapPin, Layers, IndianRupee, Wrench, Filter,
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { ImageCarousel } from '../components/ui/ImageCarousel';
import { FilterDrawer } from '../components/ui/FilterDrawer';
import { SummaryStatsCard } from '../components/ui/SummaryStatsCard';
import { MandatorySearchBar } from '../components/ui/MandatorySearchBar';
import { QuarterDetailModal } from '../components/quarters/QuarterDetailModal';
import {
  quartersService,
  Quarter,
  QuarterRequest,
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

function resolveAllImages(q: Quarter): string[] {
  let images: unknown = q.images;
  if (typeof images === 'string') {
    try { images = JSON.parse(images as string); } catch {
      images = (images as string).replace(/^\{/, '').replace(/\}$/, '').split(',').map((s: string) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
    }
  }
  if (Array.isArray(images) && (images as string[]).length > 0) return images as string[];
  return PLACEHOLDER_IMAGES;
}

function getOccupancyBadge(status: string) {
  if (status === 'AVAILABLE') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'OCCUPIED')  return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

interface QuarterDetailCardProps { quarter: Quarter; compact?: boolean }

const QuarterDetailCard: React.FC<QuarterDetailCardProps> = ({ quarter, compact }) => {
  const images = resolveAllImages(quarter);
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
      <div className={compact ? 'h-44' : 'h-56'}>
        <ImageCarousel images={images} alt={quarter.quarter_number} className="h-full" showFullscreen autoPlay={false} />
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-gray-900 text-base leading-tight">{quarter.quarter_number}</h3>
            {quarter.address && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <MapPin size={11} className="flex-shrink-0" /><span className="truncate">{quarter.address}</span>
              </div>
            )}
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${getOccupancyBadge(quarter.occupancy_status)}`}>
            {quarter.occupancy_status === 'AVAILABLE' ? 'Available' : quarter.occupancy_status === 'OCCUPIED' ? 'Occupied' : quarter.occupancy_status}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: <Bed size={13} />,       label: 'Config',   value: quarter.bhk_config },
            { icon: <Ruler size={13} />,     label: 'Area',     value: `${quarter.area_sqft} sq.ft` },
            { icon: <Building2 size={13} />, label: 'Block/Fl', value: `${quarter.block_name || '—'} / ${quarter.floor_number}` },
            { icon: <Layers size={13} />,    label: 'Furnish',  value: quarter.furnishing_status },
          ].map(item => (
            <div key={item.label} className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
              <div className="flex items-center gap-1 text-gray-400 mb-0.5">{item.icon}<span className="text-[10px] font-medium uppercase tracking-wide">{item.label}</span></div>
              <div className="text-xs font-semibold text-gray-800 truncate">{item.value}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
          <div className="text-xs text-blue-600 font-medium">Monthly Rent</div>
          <div className="font-bold text-gray-900">{fmtINR(quarter.monthly_rent)}</div>
        </div>
        {quarter.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {quarter.amenities.slice(0, 6).map(a => (
              <span key={a} className="text-xs bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-full">{a}</span>
            ))}
            {quarter.amenities.length > 6 && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{quarter.amenities.length - 6}</span>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-xs bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full font-medium">{quarter.quarter_type}</span>
          {quarter.block_name && <span className="text-xs text-gray-500">Block {quarter.block_name}</span>}
        </div>
      </div>
    </div>
  );
};

function fmtINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN'); }

function statusConfig(status: string) {
  const cfg: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    DRAFT:              { label: 'Draft',           cls: 'bg-amber-50 text-amber-700 border border-amber-200',    icon: <Clock size={11} /> },
    SUBMITTED:         { label: 'Submitted',        cls: 'bg-blue-50 text-blue-700 border border-blue-200',       icon: <Send size={11} /> },
    ALLOTTED:          { label: 'Allotted',         cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: <CheckCircle size={11} /> },
    ACKNOWLEDGED:      { label: 'Occupied',         cls: 'bg-teal-50 text-teal-700 border border-teal-200',       icon: <ThumbsUp size={11} /> },
    REJECTED:          { label: 'Rejected',         cls: 'bg-red-50 text-red-700 border border-red-200',          icon: <ThumbsDown size={11} /> },
    EXTEND_REQUESTED:  { label: 'Extension Req.',   cls: 'bg-amber-50 text-amber-700 border border-amber-200',    icon: <RefreshCw size={11} /> },
    UPGRADE_REQUESTED: { label: 'Upgrade Req.',     cls: 'bg-sky-50 text-sky-700 border border-sky-200',          icon: <ArrowRightCircle size={11} /> },
    VACATE_REQUESTED:  { label: 'Vacate Req.',      cls: 'bg-orange-50 text-orange-700 border border-orange-200', icon: <LogOut size={11} /> },
    VACATED:           { label: 'Vacated',          cls: 'bg-gray-100 text-gray-500 border border-gray-200',      icon: <XCircle size={11} /> },
    WITHDRAWN:         { label: 'Withdrawn',        cls: 'bg-gray-100 text-gray-500 border border-gray-200',      icon: <XCircle size={11} /> },
    ON_HOLD:           { label: 'On Hold',          cls: 'bg-purple-50 text-purple-700 border border-purple-200', icon: <Clock size={11} /> },
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
    EXTEND:      { label: 'Extension',   cls: 'bg-amber-50 text-amber-700 border border-amber-200',    icon: <RefreshCw size={11} /> },
    UPGRADE:     { label: 'Upgrade',     cls: 'bg-sky-50 text-sky-700 border border-sky-200',           icon: <ArrowRightCircle size={11} /> },
    VACATE:      { label: 'Vacate',      cls: 'bg-orange-50 text-orange-700 border border-orange-200',  icon: <LogOut size={11} /> },
    GRIEVANCE:   { label: 'Grievance',   cls: 'bg-rose-50 text-rose-700 border border-rose-200',        icon: <AlertCircle size={11} /> },
    MAINTENANCE: { label: 'Maintenance', cls: 'bg-slate-50 text-slate-700 border border-slate-200',     icon: <Wrench size={11} /> },
  };
  return cfg[type] ?? cfg.EXTEND;
}

type DPFilter = 'all' | 'draft' | 'submitted' | 'allotted' | 'occupied' | 'tenantServices' | 'vacated';

interface PrefItem { quarter: Quarter; rank: number }

interface NewRequestForm {
  request_reason: string; required_bhk_config: string; preferred_location: string;
  move_in_date: string; family_member_count: number; employee_notes: string;
}

const DEFAULT_FORM: NewRequestForm = {
  request_reason: '', required_bhk_config: '', preferred_location: '',
  move_in_date: '', family_member_count: 1, employee_notes: '',
};

// ─── Status dashboard card ─────────────────────────────────────────────────────

interface StatusCard {
  key: DPFilter; label: string; description: string;
  count: number;
  gradient: string; iconBg: string; textColor: string; countColor: string;
  icon: React.ReactNode;
}

// ─── Action popup types ────────────────────────────────────────────────────────

type ActionPopupType = 'EXTEND' | 'VACATE' | 'GRIEVANCE' | 'MAINTENANCE' | null;

interface ActionPopupState {
  type: ActionPopupType;
  requestId: string;
  allotmentId: string;
}

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

  // Dashboard filter — default to 'allotted' per spec
  const [dpFilter, setDpFilter] = useState<DPFilter>('allotted');

  // New-request modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [form, setForm] = useState<NewRequestForm>(DEFAULT_FORM);
  const [prefs, setPrefs] = useState<PrefItem[]>([]);
  const [modalQuarters, setModalQuarters] = useState<Quarter[]>([]);
  const [modalSearch, setModalSearch] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // List filters
  const [reqSearch, setReqSearch] = useState('');
  const [reqSort, setReqSort] = useState<'newest' | 'oldest'>('newest');
  const [reqBhkFilter, setReqBhkFilter] = useState<string>('ALL');
  const [reqToiletFilter, setReqToiletFilter] = useState<string[]>([]);
  const [reqFloorFilter, setReqFloorFilter] = useState<number[]>([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Selected preference quarter for detail view
  const [selectedPrefQuarter, setSelectedPrefQuarter] = useState<Quarter | null>(null);

  // Right-panel action state
  type RightAction = null | 'acknowledge' | 'reject' | 'extend' | 'upgrade' | 'vacate';
  const [rightAction, setRightAction] = useState<RightAction>(null);
  const [actionRemarks, setActionRemarks] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionDocUrl, setActionDocUrl] = useState('');
  const [actionDate, setActionDate] = useState('');
  const [actionBhk, setActionBhk] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Quarter preview modal (photo click)
  const [previewQuarterId, setPreviewQuarterId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Inline action popup (card-level icons)
  const [actionPopup, setActionPopup] = useState<ActionPopupState>({ type: null, requestId: '', allotmentId: '' });
  const [popupReason, setPopupReason] = useState('');
  const [popupRemarks, setPopupRemarks] = useState('');
  const [popupDocUrl, setPopupDocUrl] = useState('');
  const [popupDate, setPopupDate] = useState('');
  const [popupSubject, setPopupSubject] = useState('');
  const [popupUrgency, setPopupUrgency] = useState('NORMAL');
  const [popupSubmitting, setPopupSubmitting] = useState(false);

  function resetActionForm() {
    setRightAction(null); setActionRemarks(''); setActionReason('');
    setActionDocUrl(''); setActionDate(''); setActionBhk('');
  }

  function openActionPopup(type: ActionPopupType, requestId: string, allotmentId: string) {
    setActionPopup({ type, requestId, allotmentId });
    setPopupReason(''); setPopupRemarks(''); setPopupDocUrl('');
    setPopupDate(''); setPopupSubject(''); setPopupUrgency('NORMAL');
  }

  function closeActionPopup() {
    setActionPopup({ type: null, requestId: '', allotmentId: '' });
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
      // Auto-select the first request matching the default 'allotted' filter
      const allottedReq = reqs.find(r => ['ALLOTTED', 'UPGRADE_REQUESTED'].includes(r.request_status));
      if (allottedReq) setSelectedRequest(allottedReq);
    } catch {
      addToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, addToast]);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-select top preference for detail view
  useEffect(() => {
    if (!selectedRequest) return;
    const prefs = selectedRequest.preferences?.sort((a, b) => a.preference_rank - b.preference_rank) ?? [];
    const topQ = prefs[0]?.quarter as Quarter | undefined;
    setSelectedPrefQuarter(topQ ?? null);
  }, [selectedRequest?.id]);

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
        request_reason: req.request_reason, required_bhk_config: req.required_bhk_config,
        preferred_location: req.preferred_location, move_in_date: req.move_in_date ?? '',
        family_member_count: req.family_member_count, employee_notes: req.employee_notes,
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
      const existing = requests.find(r => r.request_status === 'DRAFT' && showNewModal);
      if (existing && selectedRequest?.request_status === 'DRAFT') {
        await quartersService.updateRequestPreferences(
          selectedRequest.id,
          prefs.map(p => ({ quarter_id: p.quarter.id, preference_rank: p.rank }))
        );
      } else {
        const req = await quartersService.createRequest(user.id, {
          ...form,
          move_in_date: form.move_in_date || null,
          preferred_location: form.preferred_location || '',
          required_bhk_config: form.required_bhk_config || '',
          employee_notes: form.employee_notes,
        });
        await quartersService.updateRequestPreferences(
          req.id,
          prefs.map(p => ({ quarter_id: p.quarter.id, preference_rank: p.rank }))
        );
      }
      addToast('Draft saved', 'success');
      setShowNewModal(false);
      loadData();
    } catch { addToast('Failed to save draft', 'error'); } finally { setSubmitting(false); }
  };

  const handleSubmit = async () => {
    if (!user || !form.request_reason.trim()) { addToast('Please provide a request reason', 'warning'); return; }
    setSubmitting(true);
    try {
      const req = await quartersService.createRequest(user.id, {
        ...form,
        move_in_date: form.move_in_date || null,
        preferred_location: form.preferred_location || '',
        required_bhk_config: form.required_bhk_config || '',
        employee_notes: form.employee_notes,
      });
      await quartersService.updateRequestPreferences(
        req.id,
        prefs.map(p => ({ quarter_id: p.quarter.id, preference_rank: p.rank }))
      );
      await quartersService.submitRequest(req.id);
      addToast('Request submitted successfully', 'success');
      setShowNewModal(false);
      loadData();
    } catch { addToast('Failed to submit request', 'error'); } finally { setSubmitting(false); }
  };

  const handleAcknowledge = async () => {
    if (!selectedRequest?.allotment) return;
    setActionSubmitting(true);
    try {
      await quartersService.acknowledgeAllotment(selectedRequest.allotment.id, selectedRequest.id, actionRemarks);
      addToast('Allotment acknowledged', 'success');
      resetActionForm();
      loadData();
    } catch { addToast('Failed to acknowledge', 'error'); } finally { setActionSubmitting(false); }
  };

  const handleReject = async () => {
    if (!selectedRequest?.allotment || !actionReason.trim()) { addToast('Please provide a reason', 'warning'); return; }
    setActionSubmitting(true);
    try {
      await quartersService.rejectAllotment(selectedRequest.allotment.id, selectedRequest.id, actionReason, actionDocUrl || undefined);
      addToast('Allotment rejected', 'success');
      resetActionForm();
      loadData();
    } catch { addToast('Failed to reject', 'error'); } finally { setActionSubmitting(false); }
  };

  const handleTenantRequest = async (serviceType: 'EXTEND' | 'UPGRADE' | 'VACATE') => {
    if (!user || !selectedRequest?.allotment) return;
    if (!actionReason.trim()) { addToast('Please provide a reason', 'warning'); return; }
    setActionSubmitting(true);
    try {
      const input: CreateTenantRequestInput = {
        service_type: serviceType, remarks: actionRemarks, reason: actionReason,
        document_url: actionDocUrl || undefined, requested_date: actionDate || null,
        required_bhk_config: actionBhk || undefined,
      };
      await quartersService.createTenantRequest(user.id, selectedRequest.allotment.id, input);
      addToast('Request submitted successfully', 'success');
      resetActionForm();
      loadData();
    } catch { addToast('Failed to submit request', 'error'); } finally { setActionSubmitting(false); }
  };

  const handleWithdraw = async (id: string) => {
    try {
      await quartersService.withdrawRequest(id);
      addToast('Request withdrawn', 'success');
      setSelectedRequest(null);
      loadData();
    } catch { addToast('Failed to withdraw', 'error'); }
  };

  const handleWithdrawTenantReq = async (id: string) => {
    try {
      await quartersService.withdrawTenantRequest(id);
      addToast('Request withdrawn', 'success');
      loadData();
    } catch { addToast('Failed to withdraw', 'error'); }
  };

  // ─── inline action popup submit ────────────────────────────────────────────

  const handlePopupSubmit = async () => {
    if (!user || !actionPopup.type || !actionPopup.allotmentId) return;
    if (!popupReason.trim() && actionPopup.type !== 'GRIEVANCE') {
      addToast('Please provide a reason', 'warning'); return;
    }
    if (actionPopup.type === 'GRIEVANCE' && !popupSubject.trim()) {
      addToast('Please provide a subject', 'warning'); return;
    }
    setPopupSubmitting(true);
    try {
      const input: CreateTenantRequestInput = {
        service_type: actionPopup.type,
        reason: popupReason,
        remarks: popupRemarks,
        document_url: popupDocUrl || undefined,
        requested_date: popupDate || null,
        grievance_subject: popupSubject || undefined,
        urgency_level: popupUrgency,
      };
      await quartersService.createTenantRequest(user.id, actionPopup.allotmentId, input);
      addToast('Request submitted successfully', 'success');
      closeActionPopup();
      loadData();
    } catch { addToast('Failed to submit request', 'error'); } finally { setPopupSubmitting(false); }
  };

  // ─── derived counts ─────────────────────────────────────────────────────────

  const statCounts = {
    draft:          requests.filter(r => r.request_status === 'DRAFT').length,
    submitted:      requests.filter(r => r.request_status === 'SUBMITTED').length,
    allotted:       requests.filter(r => ['ALLOTTED', 'UPGRADE_REQUESTED'].includes(r.request_status)).length,
    occupied:       requests.filter(r => r.request_status === 'ACKNOWLEDGED').length,
    tenantServices: requests.filter(r => ['EXTEND_REQUESTED', 'VACATE_REQUESTED'].includes(r.request_status)).length,
    vacated:        requests.filter(r => r.request_status === 'VACATED').length,
  };

  const STATUS_CARDS: StatusCard[] = [
    {
      key: 'draft', label: 'Draft Requests', description: 'Not yet submitted',
      count: statCounts.draft,
      gradient: 'from-amber-500 to-yellow-400',
      iconBg: 'bg-amber-100', textColor: 'text-amber-700', countColor: 'text-amber-900',
      icon: <FileText size={20} className="text-amber-600" />,
    },
    {
      key: 'submitted', label: 'Submitted', description: 'Awaiting EO review',
      count: statCounts.submitted,
      gradient: 'from-blue-500 to-sky-400',
      iconBg: 'bg-blue-100', textColor: 'text-blue-700', countColor: 'text-blue-900',
      icon: <Send size={20} className="text-blue-600" />,
    },
    {
      key: 'allotted', label: 'Allotted', description: 'Pending your action',
      count: statCounts.allotted,
      gradient: 'from-emerald-500 to-green-400',
      iconBg: 'bg-emerald-100', textColor: 'text-emerald-700', countColor: 'text-emerald-900',
      icon: <CheckCircle size={20} className="text-emerald-600" />,
    },
    {
      key: 'occupied', label: 'Occupied', description: 'Currently occupying',
      count: statCounts.occupied,
      gradient: 'from-teal-500 to-cyan-400',
      iconBg: 'bg-teal-100', textColor: 'text-teal-700', countColor: 'text-teal-900',
      icon: <Home size={20} className="text-teal-600" />,
    },
    {
      key: 'tenantServices', label: 'Tenant Services', description: 'Ext / Vacate in progress',
      count: statCounts.tenantServices,
      gradient: 'from-orange-500 to-amber-400',
      iconBg: 'bg-orange-100', textColor: 'text-orange-700', countColor: 'text-orange-900',
      icon: <RefreshCw size={20} className="text-orange-600" />,
    },
    {
      key: 'vacated', label: 'Vacated', description: 'Historical records',
      count: statCounts.vacated,
      gradient: 'from-slate-400 to-gray-400',
      iconBg: 'bg-slate-100', textColor: 'text-slate-600', countColor: 'text-slate-700',
      icon: <Building2 size={20} className="text-slate-500" />,
    },
  ];

  // ─── filtered request lists ─────────────────────────────────────────────────

  const filteredRequests = React.useMemo(() => {
    let result = [...requests];

    if (dpFilter === 'draft') result = result.filter(r => r.request_status === 'DRAFT');
    else if (dpFilter === 'submitted') result = result.filter(r => r.request_status === 'SUBMITTED');
    else if (dpFilter === 'allotted') result = result.filter(r => ['ALLOTTED', 'UPGRADE_REQUESTED'].includes(r.request_status));
    else if (dpFilter === 'occupied') result = result.filter(r => r.request_status === 'ACKNOWLEDGED');
    else if (dpFilter === 'tenantServices') result = result.filter(r => ['EXTEND_REQUESTED', 'VACATE_REQUESTED'].includes(r.request_status));
    else if (dpFilter === 'vacated') result = result.filter(r => r.request_status === 'VACATED');

    if (reqBhkFilter !== 'ALL') result = result.filter(r => r.required_bhk_config?.includes(reqBhkFilter));

    if (reqToiletFilter.length > 0) {
      result = result.filter(r => {
        const quarter = (r.allotment?.quarter as Quarter | undefined) ?? r.preferences?.[0]?.quarter;
        if (!quarter) return false;
        return reqToiletFilter.includes((quarter as Quarter).toilet_type ?? 'Western');
      });
    }

    if (reqFloorFilter.length > 0) {
      result = result.filter(r => {
        const quarter = (r.allotment?.quarter as Quarter | undefined) ?? r.preferences?.[0]?.quarter;
        if (!quarter) return false;
        const floor = (quarter as Quarter).floor_number ?? 0;
        return reqFloorFilter.some(f => f === 4 ? floor >= 4 : floor === f);
      });
    }

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
  }, [requests, dpFilter, reqSearch, reqSort, reqBhkFilter, reqToiletFilter, reqFloorFilter]);

  const filteredTenantRequests = React.useMemo(() => {
    return [...tenantRequests].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [tenantRequests]);

  const isTenantView = dpFilter === 'tenantServices';
  const selectedPrefs = selectedRequest?.preferences?.sort((a, b) => a.preference_rank - b.preference_rank) ?? [];

  const activeFilterCount = [
    reqBhkFilter !== 'ALL',
    reqSearch.trim().length > 0,
  ].filter(Boolean).length + reqToiletFilter.length + reqFloorFilter.length;

  // ─── helper to open preview modal ──────────────────────────────────────────

  function openQuarterPreview(req: QuarterRequest) {
    const qId = (req.allotment?.quarter as Quarter | undefined)?.id
      ?? (req.preferences?.[0]?.quarter as Quarter | undefined)?.id;
    if (!qId) { addToast('No quarter linked to this request yet', 'info'); return; }
    setPreviewQuarterId(qId);
    setIsPreviewOpen(true);
  }

  // ─── right panel sections ────────────────────────────────────────────────────

  const RightPanelAllotted = () => {
    if (!selectedRequest?.allotment) return null;
    const allotment = selectedRequest.allotment;
    const q = allotment.quarter;
    return (
      <>
        <div className="flex items-center gap-3 px-5 py-4 bg-emerald-600 rounded-t-xl">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
            <CheckCircle size={18} className="text-white" />
          </div>
          <div>
            <div className="text-xs font-medium text-emerald-100 uppercase tracking-wide">Quarter Allotted</div>
            <div className="text-sm font-semibold text-white">{selectedRequest.request_number}</div>
          </div>
          <span className="ml-auto text-xs font-medium bg-white/20 text-white px-2.5 py-1 rounded-full">
            {allotment.approval_status}
          </span>
        </div>

        <div className="p-5 border-b border-gray-100">
          {q ? (
            <>
              <QuarterDetailCard quarter={q} />
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  <div className="text-gray-400 mb-0.5">Allotted On</div>
                  <div className="font-medium text-gray-800">{fmtDate(allotment.allotment_date)}</div>
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  <div className="text-gray-400 mb-0.5">Status</div>
                  <div className="font-medium text-gray-800">{allotment.approval_status}</div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 size={16} className="text-emerald-600" />
                <span className="font-semibold text-gray-900">Quarter Allotted</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><div className="text-gray-400 mb-0.5">BHK Requested</div><div className="font-medium text-gray-800">{selectedRequest.required_bhk_config || '—'}</div></div>
                <div><div className="text-gray-400 mb-0.5">Location</div><div className="font-medium text-gray-800">{selectedRequest.preferred_location || '—'}</div></div>
                <div><div className="text-gray-400 mb-0.5">Allotted On</div><div className="font-medium text-gray-800">{fmtDate(allotment.allotment_date)}</div></div>
                <div><div className="text-gray-400 mb-0.5">Status</div><div className="font-medium text-gray-800">{allotment.approval_status}</div></div>
              </div>
            </div>
          )}
          {allotment.allotment_conditions && (
            <div className="mt-3 text-xs text-gray-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              <span className="font-medium text-amber-700">Conditions: </span>{allotment.allotment_conditions}
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Your Action Required</div>

          {rightAction === null && (
            <div className="space-y-2">
              <div className="flex gap-3">
                <button onClick={() => setRightAction('acknowledge')} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors">
                  <ThumbsUp size={15} /> Acknowledge
                </button>
                <button onClick={() => setRightAction('reject')} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors">
                  <ThumbsDown size={15} /> Reject
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
                <textarea value={actionRemarks} onChange={e => setActionRemarks(e.target.value)} rows={3} placeholder="Any remarks…" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={resetActionForm} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={handleAcknowledge} disabled={actionSubmitting} className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
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
                <textarea value={actionReason} onChange={e => setActionReason(e.target.value)} rows={3} placeholder="State the reason…" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Supporting Document URL (optional)</label>
                <div className="relative">
                  <Upload size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={actionDocUrl} onChange={e => setActionDocUrl(e.target.value)} placeholder="https://…" className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={resetActionForm} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={handleReject} disabled={actionSubmitting} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
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
            <QuarterDetailCard quarter={q} />
            <div className="mt-3 bg-teal-50 rounded-lg border border-teal-100 px-3 py-2 text-xs text-teal-800">
              <span className="font-medium">Occupied since: </span>
              {fmtDate(allotment.acknowledged_at ?? allotment.allotment_date)}
            </div>
          </div>
        )}

        <div className="p-5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tenant Services</div>

          {rightAction === null && (
            <div className="grid grid-cols-2 gap-3">
              {([
                { action: 'extend' as RightAction,  label: 'Extend Lease',    icon: <RefreshCw size={15} />,    cls: 'border-amber-200 text-amber-700 hover:bg-amber-50' },
                { action: 'upgrade' as RightAction, label: 'Upgrade Quarter', icon: <ArrowRightCircle size={15} />, cls: 'border-sky-200 text-sky-700 hover:bg-sky-50' },
                { action: 'vacate' as RightAction,  label: 'Vacate Quarter',  icon: <LogOut size={15} />,       cls: 'border-orange-200 text-orange-700 hover:bg-orange-50' },
              ]).map(({ action, label, icon, cls }) => (
                <button key={action as string} onClick={() => setRightAction(action)} className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm font-medium transition-colors ${cls}`}>
                  {icon}<span className="text-xs">{label}</span>
                </button>
              ))}
              {/* Rent Details & Maintenance */}
              <button
                onClick={() => navigate(`${ROUTES.QUARTERS_RENT}?allotment_id=${allotment.id}`)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-teal-200 text-teal-700 hover:bg-teal-50 text-sm font-medium transition-colors"
              >
                <IndianRupee size={15} />
                <span className="text-xs">Rent Details</span>
              </button>
              <button
                onClick={() => openActionPopup('MAINTENANCE', selectedRequest.id, allotment.id)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors"
              >
                <Wrench size={15} />
                <span className="text-xs">Maintenance</span>
              </button>
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
                  <textarea value={actionReason} onChange={e => setActionReason(e.target.value)} rows={2} placeholder="Reason for this request…" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
                  <input value={actionRemarks} onChange={e => setActionRemarks(e.target.value)} placeholder="Additional remarks…" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {rightAction === 'extend' ? 'Extension Until Date' : 'Intended Vacate Date'}
                  </label>
                  <div className="relative">
                    <CalendarDays size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="date" value={actionDate} onChange={e => setActionDate(e.target.value)} className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Document URL (optional)</label>
                  <div className="relative">
                    <Upload size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={actionDocUrl} onChange={e => setActionDocUrl(e.target.value)} placeholder="https://…" className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={resetActionForm} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                  <button onClick={() => handleTenantRequest(serviceType)} disabled={actionSubmitting} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    {actionSubmitting ? 'Submitting…' : 'Submit Request'}
                  </button>
                </div>
              </div>
            );
          })()}

          {rightAction === 'upgrade' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-sky-700 flex items-center gap-1.5"><ArrowRightCircle size={14} /> Upgrade Quarter</span>
                <button onClick={resetActionForm} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Required BHK Config *</label>
                <input value={actionBhk} onChange={e => setActionBhk(e.target.value)} placeholder="e.g. 3 BHK" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Reason *</label>
                <textarea value={actionReason} onChange={e => setActionReason(e.target.value)} rows={2} placeholder="Reason for upgrade…" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Document URL (optional)</label>
                <div className="relative">
                  <Upload size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={actionDocUrl} onChange={e => setActionDocUrl(e.target.value)} placeholder="https://…" className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={resetActionForm} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={() => handleTenantRequest('UPGRADE')} disabled={actionSubmitting} className="flex-1 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-50 transition-colors">
                  {actionSubmitting ? 'Submitting…' : 'Submit Upgrade Request'}
                </button>
              </div>
            </div>
          )}
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
          {q && <QuarterDetailCard quarter={q} compact />}
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
            <button onClick={() => handleWithdrawTenantReq(tr.id)} className="w-full py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
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

      {selectedPrefQuarter && (
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 bg-gray-50/60">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
              Viewing Preference #{selectedPrefs.findIndex(p => (p.quarter as Quarter | undefined)?.id === selectedPrefQuarter.id) + 1}
            </div>
            <button onClick={() => setSelectedPrefQuarter(null)} className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded"><X size={14} /></button>
          </div>
          <QuarterDetailCard quarter={selectedPrefQuarter} compact />
        </div>
      )}

      <div className="p-5">
        {selectedRequest?.request_status === 'DRAFT' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-sm text-amber-800 flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            Click <Eye size={12} className="inline mx-1" /> to view quarter details. Reorder with arrows.
          </div>
        )}

        {selectedPrefs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Star size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No preferences added yet.</p>
            {selectedRequest?.request_status === 'DRAFT' && (
              <button onClick={() => openNewModal(selectedRequest)} className="mt-3 text-sm text-blue-600 hover:underline">Add preferences</button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {selectedPrefs.map((pref, i) => {
              const q = pref.quarter as Quarter | undefined;
              if (!q) return null;
              const isViewing = selectedPrefQuarter?.id === q.id;
              return (
                <div
                  key={pref.id}
                  className={`flex items-center gap-3 rounded-xl p-3 border transition-all cursor-pointer hover:shadow-sm ${isViewing ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200 shadow-sm' : 'bg-gray-50 border-gray-100 hover:bg-white hover:border-gray-200'}`}
                  onClick={() => setSelectedPrefQuarter(isViewing ? null : q)}
                >
                  <div className="relative shrink-0">
                    <img src={getImage(q, i)} alt={q.quarter_number} className="w-16 h-16 rounded-lg object-cover" />
                    <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center ${isViewing ? 'bg-blue-600' : 'bg-slate-800'}`}>{pref.preference_rank}</div>
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
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); setPreviewQuarterId(q.id); setIsPreviewOpen(true); }}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
                      title="View quarter details"
                    ><Eye size={13} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedRequest?.request_status === 'DRAFT' && (
          <div className="mt-4 flex gap-2">
            <button onClick={() => openNewModal(selectedRequest)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <Plus size={14} /> Add / Reorder
            </button>
            <Button onClick={async () => {
              if (!selectedRequest) return;
              try {
                await quartersService.submitRequest(selectedRequest.id);
                addToast('Request submitted', 'success');
                loadData();
              } catch { addToast('Failed to submit', 'error'); }
            }}>
              <Send size={14} className="mr-1" /> Submit
            </Button>
          </div>
        )}
      </div>
    </>
  );

  // ─── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

        {/* ── Compact header ─────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 mb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                <Home size={11} />
                <ChevronRight size={10} />
                <span>My Workspace</span>
                <ChevronRight size={10} />
                <button
                  onClick={() => { setSelectedRequest(null); setDpFilter('allotted'); resetActionForm(); }}
                  className="text-gray-600 font-medium hover:text-blue-600 transition-colors"
                >
                  Quarter Requests
                </button>
                {selectedRequest && (
                  <>
                    <ChevronRight size={10} />
                    <span className="font-mono text-gray-700 font-medium">{selectedRequest.request_number}</span>
                  </>
                )}
              </div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Quarter Requests</h1>
            </div>
            <div className="flex gap-2 shrink-0 items-center">
              {user && activeCycle && (
                <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
                  <Clock size={11} className="text-blue-500" />
                  {activeCycle.cycle_name} · Closes {new Date(activeCycle.end_date).toLocaleDateString('en-IN')}
                </span>
              )}
              <button onClick={() => navigate(ROUTES.QUARTERS_FREEVIEW)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <Eye size={13} /> Browse
              </button>
              <Button onClick={() => openNewModal()}>
                <Plus size={13} className="mr-1" /> New Request
              </Button>
            </div>
          </div>
        </div>

        {/* ── Status summary cards (SummaryStatsCard, matches QuarterManagerPage) ── */}
        <div className="mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {STATUS_CARDS.map((card, idx) => (
              <SummaryStatsCard
                key={card.key}
                label={card.label}
                value={card.count}
                icon={(() => {
                  const iconMap: Record<DPFilter, React.FC<any>> = {
                    all: FileText,
                    draft: FileText,
                    submitted: Send,
                    allotted: CheckCircle,
                    occupied: Home,
                    tenantServices: RefreshCw,
                    vacated: Building2,
                  };
                  return iconMap[card.key];
                })()}
                gradient={`bg-gradient-to-r ${card.gradient}`}
                delay={idx * 50}
                subtitle={card.description}
                isActive={dpFilter === card.key}
                onClick={() => {
                  setDpFilter(card.key);
                  resetActionForm();
                  setSelectedTenantReq(null);
                  setReqSearch('');
                  setReqBhkFilter('ALL');
                  const statusMap: Record<DPFilter, string[]> = {
                    all: [],
                    draft: ['DRAFT'],
                    submitted: ['SUBMITTED'],
                    allotted: ['ALLOTTED', 'UPGRADE_REQUESTED'],
                    occupied: ['ACKNOWLEDGED'],
                    tenantServices: ['EXTEND_REQUESTED', 'VACATE_REQUESTED'],
                    vacated: ['VACATED'],
                  };
                  const statuses = statusMap[card.key];
                  const first = statuses.length
                    ? requests.find(r => statuses.includes(r.request_status)) ?? null
                    : (requests[0] ?? null);
                  setSelectedRequest(first);
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Main content ──────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map(i => <div key={i} className="bg-white rounded-xl border border-gray-200 h-64 animate-pulse" />)}
          </div>
        ) : !isTenantView && filteredRequests.length === 0 && requests.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
            <FileText size={40} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-semibold text-gray-700 mb-1">No quarter requests yet</h3>
            <p className="text-sm text-gray-500 mb-6">Create your first request to start the allotment process.</p>
            <Button onClick={() => openNewModal()}><Plus size={15} className="mr-1" /> New Request</Button>
          </div>
        ) : (
          <>
            {/* ── MandatorySearchBar (matches QuarterManagerPage filter style) ── */}
            {!isTenantView && (
              <div className="mb-3 space-y-2">
                <MandatorySearchBar
                  fields={[
                    {
                      key: 'search',
                      label: 'Search',
                      type: 'text',
                      placeholder: 'Request no., BHK, location…',
                      value: reqSearch,
                      onChange: setReqSearch,
                      icon: <Search size={14} />,
                    },
                    {
                      key: 'bhk',
                      label: 'BHK Config',
                      type: 'chips',
                      value: reqBhkFilter,
                      onChange: setReqBhkFilter,
                      options: [
                        { value: 'ALL', label: 'Any' },
                        { value: '1BHK', label: '1 BHK' },
                        { value: '2BHK', label: '2 BHK' },
                        { value: '3BHK', label: '3 BHK' },
                        { value: '4BHK', label: '4 BHK' },
                      ],
                    },
                    {
                      key: 'sort',
                      label: 'Sort By',
                      type: 'chips',
                      value: reqSort,
                      onChange: v => setReqSort(v as 'newest' | 'oldest'),
                      options: [
                        { value: 'newest', label: 'Newest' },
                        { value: 'oldest', label: 'Oldest' },
                      ],
                    },
                  ]}
                />
                <div className="flex justify-end">
                  <span className="text-xs text-gray-500">{filteredRequests.length} of {requests.length} requests</span>
                </div>
              </div>
            )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

            {/* ── LEFT: request list ──────────────────────────── */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <FileText size={15} />
                  {isTenantView ? 'Tenant Service Requests' : 'My Requests'}
                  <span className="text-xs text-gray-400 font-normal">
                    ({isTenantView ? filteredTenantRequests.length : filteredRequests.length})
                  </span>
                </h2>
                {isTenantView && (
                  <button
                    onClick={() => setFilterDrawerOpen(true)}
                    className={`lg:hidden relative flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
                      activeFilterCount > 0 ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <Filter size={14} />
                    {activeFilterCount > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />}
                  </button>
                )}
              </div>

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
                      className={`bg-white rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 ${isSelected ? 'border-blue-400 shadow-md ring-2 ring-blue-100' : 'border-gray-200'}`}
                    >
                      <div className="flex">
                        <div className="w-32 shrink-0">
                          {q && <img src={getImage(q, 0)} alt="" className="w-full h-full object-cover" style={{ minHeight: 104 }} />}
                          {!q && <div className="w-full h-full bg-gray-100 flex items-center justify-center" style={{ minHeight: 104 }}><Building2 size={24} className="text-gray-300" /></div>}
                        </div>
                        <div className="flex-1 p-4 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${stc.cls}`}>{stc.icon}{stc.label}</span>
                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${sc.cls}`}>{sc.label}</span>
                          </div>
                          {q && <div className="font-bold text-gray-900 text-sm truncate mb-1">{q.quarter_number} · {q.bhk_config}</div>}
                          <div className="text-xs text-gray-400">{fmtDate(tr.created_at)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Quarter request cards */}
              {!isTenantView && (
                filteredRequests.length === 0 ? (
                  dpFilter === 'allotted' ? (
                    // Special empty state for allotted filter (default landing)
                    <div className="bg-white rounded-xl border border-gray-200 py-14 text-center px-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-100 border-dashed mb-4">
                        <Building2 size={28} className="text-emerald-300" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-700 mb-2">No Quarter Allocated Yet</h3>
                      <p className="text-xs text-gray-500 leading-relaxed mb-4">
                        Your quarter allocation will appear here once an Estate Officer processes and approves your request.
                      </p>
                      <button
                        onClick={() => setDpFilter('all')}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
                      >
                        View all requests →
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-gray-200 py-8 text-center">
                      <Filter size={24} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">No requests match this filter.</p>
                      <button onClick={() => { setDpFilter('all'); setReqSearch(''); }} className="mt-2 text-xs text-blue-600 hover:underline">Clear filters</button>
                    </div>
                  )
                ) : filteredRequests.map(req => {
                  const sc = statusConfig(req.request_status);
                  const isSelected = selectedRequest?.id === req.id;
                  const isOccupied = req.request_status === 'ACKNOWLEDGED';
                  const thumbQ = (req.allotment?.quarter as Quarter | undefined) ?? (req.preferences?.[0]?.quarter as Quarter | undefined);

                  return (
                    <div
                      key={req.id}
                      onClick={() => { setSelectedRequest(req); resetActionForm(); }}
                      className={`bg-white rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 ${isSelected ? 'border-blue-400 shadow-md ring-2 ring-blue-100' : 'border-gray-200'}`}
                    >
                      <div className="flex">
                        {/* Thumbnail — clickable to preview */}
                        <div
                          className="w-32 shrink-0 relative group/thumb"
                          onClick={e => { e.stopPropagation(); openQuarterPreview(req); }}
                        >
                          <img
                            src={thumbQ ? getImage(thumbQ, 0) : PLACEHOLDER_IMAGES[0]}
                            alt=""
                            className="w-full h-full object-cover"
                            style={{ minHeight: 104 }}
                          />
                          {/* Eye overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/25 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover/thumb:opacity-100 transition-opacity bg-white/90 rounded-full p-1.5 shadow">
                              <Eye size={14} className="text-gray-700" />
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 p-4 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-mono text-xs font-medium text-gray-500">{req.request_number}</span>
                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${sc.cls}`}>{sc.icon}{sc.label}</span>
                          </div>
                          <div className="font-bold text-gray-900 text-base truncate mb-1">
                            {req.required_bhk_config || 'Any BHK'} · {req.preferred_location || 'Any location'}
                          </div>
                          <div className="text-xs text-gray-500 mb-3">
                            {req.preferences?.length ?? 0} preferences · {fmtDate(req.created_at)}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {req.request_status === 'DRAFT' && (
                              <button onClick={e => { e.stopPropagation(); openNewModal(req); }} className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium">
                                Modify
                              </button>
                            )}
                            {req.request_status === 'SUBMITTED' && (
                              <button onClick={e => { e.stopPropagation(); handleWithdraw(req.id); }} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors font-medium">
                                Withdraw
                              </button>
                            )}
                            {req.request_status === 'ALLOTTED' && req.allotment && (
                              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                                <CheckCircle size={11} />
                                {(req.allotment as any).quarter?.quarter_number
                                  ? `${(req.allotment as any).quarter.quarter_number} · ${(req.allotment as any).quarter.bhk_config}`
                                  : 'Allotted'}
                              </span>
                            )}
                            {isOccupied && (
                              <span className="text-xs text-teal-700 font-semibold flex items-center gap-1 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                                <ThumbsUp size={11} /> Occupying
                              </span>
                            )}

                            {/* Inline action icons for occupied quarters */}
                            {isOccupied && req.allotment && (
                              <div className="ml-auto flex items-center gap-1.5">
                                <button
                                  onClick={e => { e.stopPropagation(); openActionPopup('EXTEND', req.id, req.allotment!.id); }}
                                  title="Request Extension"
                                  className="p-2 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors"
                                >
                                  <RefreshCw size={13} />
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); openActionPopup('VACATE', req.id, req.allotment!.id); }}
                                  title="Request Vacate"
                                  className="p-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                  <LogOut size={13} />
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); openActionPopup('GRIEVANCE', req.id, req.allotment!.id); }}
                                  title="Raise Grievance"
                                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                  <AlertCircle size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── RIGHT: detail panel ───────────────────────────── */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl border border-gray-200 min-h-[400px] overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
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
          </>
        )}
      </main>

      {/* ── Mobile filter drawer ──────────────────────────────────────── */}
      <FilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filters"
        activeFilterCount={activeFilterCount}
        onClearAll={() => { setReqSearch(''); setReqBhkFilter('ALL'); setReqToiletFilter([]); setReqFloorFilter([]); }}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Number, BHK, location…" value={reqSearch} onChange={e => setReqSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">BHK Config</label>
            <div className="flex flex-wrap gap-2">
              {['ALL', '1BHK', '2BHK', '3BHK', '4BHK'].map(v => (
                <button key={v} onClick={() => setReqBhkFilter(v)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${reqBhkFilter === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                  {v === 'ALL' ? 'Any' : v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Toilet Type</label>
            <div className="flex flex-wrap gap-2">
              {['Indian', 'Western', 'Both'].map(v => (
                <button key={v} onClick={() => setReqToiletFilter(prev =>
                  prev.includes(v) ? prev.filter(t => t !== v) : [...prev, v]
                )}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${reqToiletFilter.includes(v) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Floor</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 0, label: 'Ground' },
                { value: 1, label: '1st' },
                { value: 2, label: '2nd' },
                { value: 3, label: '3rd' },
                { value: 4, label: '4th+' },
              ].map(({ value, label }) => (
                <button key={value} onClick={() => setReqFloorFilter(prev =>
                  prev.includes(value) ? prev.filter(f => f !== value) : [...prev, value]
                )}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${reqFloorFilter.includes(value) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Sort By</label>
            <div className="space-y-2">
              {[{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }].map(({ value, label }) => (
                <button key={value} onClick={() => setReqSort(value as 'newest' | 'oldest')}
                  className={`w-full px-4 py-2.5 rounded-lg text-left text-sm font-medium transition-all ${reqSort === value ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FilterDrawer>

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
                  <input value={form[key] as string} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Preferred Move-in Date</label>
                <input type="date" value={form.move_in_date} onChange={e => setForm(f => ({ ...f, move_in_date: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Family Members</label>
                <input type="number" min={1} value={form.family_member_count} onChange={e => setForm(f => ({ ...f, family_member_count: Number(e.target.value) }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes (optional)</label>
                <input value={form.employee_notes} onChange={e => setForm(f => ({ ...f, employee_notes: e.target.value }))} placeholder="Any additional notes"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-0">
            <div className="flex flex-col border-r border-gray-100 min-h-0">
              <div className="px-4 pt-4 pb-3 border-b border-gray-100 bg-white">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={modalSearch} onChange={e => setModalSearch(e.target.value)} placeholder="Search available quarters…"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
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
                      <button onClick={() => addPref(q)} disabled={prefs.length >= 5 || !!prefs.find(p => p.quarter.id === q.id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0">
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

      {/* ── Inline Action Popup (Extension / Vacate / Grievance / Maintenance) ── */}
      <Modal
        isOpen={!!actionPopup.type}
        onClose={closeActionPopup}
        size="sm"
        noPadding={false}
      >
        {actionPopup.type && (() => {
          const typeLabels: Record<string, { title: string; color: string; icon: React.ReactNode }> = {
            EXTEND:      { title: 'Extension Request',    color: 'text-amber-700',  icon: <RefreshCw size={16} className="text-amber-600" /> },
            VACATE:      { title: 'Vacate Request',       color: 'text-rose-700',   icon: <LogOut size={16} className="text-rose-600" /> },
            GRIEVANCE:   { title: 'Raise Grievance',      color: 'text-slate-700',  icon: <AlertCircle size={16} className="text-slate-600" /> },
            MAINTENANCE: { title: 'Maintenance Request',  color: 'text-teal-700',   icon: <Wrench size={16} className="text-teal-600" /> },
          };
          const cfg = typeLabels[actionPopup.type];
          const isGrievance = actionPopup.type === 'GRIEVANCE';
          const isMaintenance = actionPopup.type === 'MAINTENANCE';
          const hasDate = actionPopup.type === 'EXTEND' || actionPopup.type === 'VACATE';

          return (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                {cfg.icon}
                <h3 className={`text-base font-bold ${cfg.color}`}>{cfg.title}</h3>
              </div>

              {isGrievance && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Subject *</label>
                  <input value={popupSubject} onChange={e => setPopupSubject(e.target.value)} placeholder="Brief subject of your grievance"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500/20" />
                </div>
              )}

              {isMaintenance && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Urgency Level</label>
                  <div className="flex gap-2">
                    {(['LOW', 'NORMAL', 'HIGH'] as const).map(u => (
                      <button key={u} onClick={() => setPopupUrgency(u)}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                          popupUrgency === u
                            ? u === 'HIGH' ? 'bg-red-600 text-white border-red-600' : u === 'LOW' ? 'bg-gray-600 text-white border-gray-600' : 'bg-teal-600 text-white border-teal-600'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}>
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {isGrievance ? 'Description *' : 'Reason *'}
                </label>
                <textarea value={popupReason} onChange={e => setPopupReason(e.target.value)} rows={3}
                  placeholder={isGrievance ? 'Describe your grievance in detail…' : isMaintenance ? 'Describe the issue…' : 'Reason for this request…'}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Remarks (optional)</label>
                <input value={popupRemarks} onChange={e => setPopupRemarks(e.target.value)} placeholder="Additional remarks…"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>

              {hasDate && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {actionPopup.type === 'EXTEND' ? 'Extension Until Date' : 'Intended Vacate Date'}
                  </label>
                  <div className="relative">
                    <CalendarDays size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="date" value={popupDate} onChange={e => setPopupDate(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Document URL (optional)</label>
                <div className="relative">
                  <Upload size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={popupDocUrl} onChange={e => setPopupDocUrl(e.target.value)} placeholder="https://…"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={closeActionPopup} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={handlePopupSubmit} disabled={popupSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {popupSubmitting ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ── Quarter Preview Modal ──────────────────────────────────────── */}
      {previewQuarterId && (
        <QuarterDetailModal
          isOpen={isPreviewOpen}
          onClose={() => { setIsPreviewOpen(false); setPreviewQuarterId(null); }}
          quarterId={previewQuarterId}
        />
      )}
    </div>
  );
};
