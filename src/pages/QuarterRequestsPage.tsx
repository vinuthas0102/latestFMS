import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home, ChevronRight, Plus, FileText, CheckCircle, Clock, XCircle,
  ArrowUp, ArrowDown, Trash2, Search, Star, Filter, X, Eye, Send,
  Building2, Bed, Ruler, MapPin, CalendarDays, Users, AlertCircle
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
} from '../services/quartersService';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { ROUTES } from '../constants/routes';

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

function statusConfig(status: string) {
  const cfg: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    DRAFT: { label: 'Draft', cls: 'bg-amber-50 text-amber-700 border border-amber-200', icon: <Clock size={11} /> },
    SUBMITTED: { label: 'Submitted', cls: 'bg-blue-50 text-blue-700 border border-blue-200', icon: <Send size={11} /> },
    ALLOTTED: { label: 'Allotted', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: <CheckCircle size={11} /> },
    WITHDRAWN: { label: 'Withdrawn', cls: 'bg-gray-100 text-gray-500 border border-gray-200', icon: <XCircle size={11} /> },
  };
  return cfg[status] ?? cfg.DRAFT;
}

interface PrefItem {
  quarter: Quarter;
  rank: number;
}

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

export const QuarterRequestsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const addToast = useUIStore(s => s.addToast);

  const [requests, setRequests] = useState<QuarterRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<QuarterRequest | null>(null);
  const [activeCycle, setActiveCycle] = useState<QuarterAllotmentCycle | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showNewModal, setShowNewModal] = useState(false);
  const [form, setForm] = useState<NewRequestForm>(DEFAULT_FORM);
  const [prefs, setPrefs] = useState<PrefItem[]>([]);
  const [modalQuarters, setModalQuarters] = useState<Quarter[]>([]);
  const [modalSearch, setModalSearch] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [reqs, cycle] = await Promise.all([
        quartersService.getMyRequests(user.id),
        quartersService.getActiveCycle(),
      ]);
      setRequests(reqs);
      setActiveCycle(cycle);
      if (reqs.length > 0 && !selectedRequest) setSelectedRequest(reqs[0]);
    } catch {
      addToast('Failed to load requests', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, addToast]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

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
      const data = await quartersService.getQuarters({
        occupancy_status: 'AVAILABLE',
        search: modalSearch || undefined,
      });
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

  const addPref = (q: Quarter) => {
    if (prefs.length >= 5) { addToast('Maximum 5 preferences allowed', 'warning'); return; }
    if (prefs.find(p => p.quarter.id === q.id)) return;
    setPrefs(prev => [...prev, { quarter: q, rank: prev.length + 1 }]);
  };

  const removePref = (quarterId: string) => {
    setPrefs(prev => {
      const next = prev.filter(p => p.quarter.id !== quarterId);
      return next.map((p, i) => ({ ...p, rank: i + 1 }));
    });
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
      loadRequests();
    } catch {
      addToast('Failed to save request', 'error');
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
      loadRequests();
    } catch {
      addToast('Failed to submit request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (reqId: string) => {
    try {
      await quartersService.withdrawRequest(reqId);
      addToast('Request withdrawn', 'success');
      loadRequests();
    } catch {
      addToast('Failed to withdraw request', 'error');
    }
  };

  const selectedPrefs = selectedRequest?.preferences?.sort((a, b) => a.preference_rank - b.preference_rank) ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb + Title */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <Home size={13} />
              <ChevronRight size={12} />
              <span>My Workspace</span>
              <ChevronRight size={12} />
              <span className="text-gray-800 font-medium">Quarter Requests</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Quarter Requests</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your allotment requests. Max 5 preferences per request.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate(ROUTES.QUARTERS_FREEVIEW)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Eye size={15} /> Browse Quarters
            </button>
            <Button onClick={() => openNewModal()}>
              <Plus size={15} className="mr-1" /> New Request
            </Button>
          </div>
        </div>

        {/* Stats Banner */}
        {user && (
          <div className="bg-white rounded-xl border-l-4 border-amber-400 border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div>
                <div className="text-xs text-gray-500 mb-0.5 uppercase tracking-wide">Employee</div>
                <div className="font-semibold text-gray-900">{user.fullName}</div>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div>
                <div className="text-xs text-gray-500 mb-0.5 uppercase tracking-wide">Active Cycle</div>
                <div className="font-semibold text-gray-900">
                  {activeCycle ? `${activeCycle.cycle_name} · Closes ${new Date(activeCycle.end_date).toLocaleDateString('en-IN')}` : 'No active cycle'}
                </div>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div>
                <div className="text-xs text-gray-500 mb-0.5 uppercase tracking-wide">Open Requests</div>
                <div className="font-semibold text-gray-900">
                  {requests.filter(r => ['DRAFT', 'SUBMITTED'].includes(r.request_status)).length} active
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 h-64 animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
            <FileText size={40} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-semibold text-gray-700 mb-1">No quarter requests yet</h3>
            <p className="text-sm text-gray-500 mb-6">Create your first request to start the allotment process.</p>
            <Button onClick={() => openNewModal()}>
              <Plus size={15} className="mr-1" /> New Request
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: My Requests */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <FileText size={16} /> My Requests
                </h2>
                <span className="text-xs text-gray-500">{requests.length} total</span>
              </div>
              {requests.map(req => {
                const sc = statusConfig(req.request_status);
                const isSelected = selectedRequest?.id === req.id;
                return (
                  <div
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className={`bg-white rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden hover:shadow-md ${
                      isSelected ? 'border-blue-400 shadow-md ring-1 ring-blue-100' : 'border-gray-200'
                    }`}
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
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${sc.cls}`}>
                            {sc.icon}{sc.label}
                          </span>
                        </div>
                        <div className="font-semibold text-gray-900 text-sm truncate mb-1">
                          {req.required_bhk_config || 'Any BHK'} · {req.preferred_location || 'Any location'}
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          {req.preferences?.length ?? 0} preferences · {new Date(req.created_at).toLocaleDateString('en-IN')}
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {req.request_status === 'DRAFT' && (
                            <button
                              onClick={e => { e.stopPropagation(); openNewModal(req); }}
                              className="text-xs px-2.5 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            >
                              Modify
                            </button>
                          )}
                          {req.request_status === 'SUBMITTED' && (
                            <button
                              onClick={e => { e.stopPropagation(); handleWithdraw(req.id); }}
                              className="text-xs px-2.5 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              Withdraw
                            </button>
                          )}
                          {req.request_status === 'ALLOTTED' && req.allotment && (
                            <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                              <CheckCircle size={11} /> Allotted: {(req.allotment as any).quarter?.quarter_number}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Preference List for selected request */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl border border-gray-200 h-full">
                {selectedRequest ? (
                  <>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                      <div>
                        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                          <Star size={16} className="text-amber-500" /> Preference List
                        </h2>
                        <div className="text-xs text-gray-500 mt-0.5">
                          For <span className="font-mono text-gray-700">{selectedRequest.request_number}</span> ·{' '}
                          <span className={`font-medium ${selectedPrefs.length >= 5 ? 'text-red-600' : 'text-amber-600'}`}>
                            {selectedPrefs.length} of 5
                          </span> selected
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${statusConfig(selectedRequest.request_status).cls}`}>
                        {statusConfig(selectedRequest.request_status).icon}
                        {statusConfig(selectedRequest.request_status).label}
                      </span>
                    </div>

                    <div className="p-5">
                      {selectedRequest.request_status === 'DRAFT' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-sm text-amber-800 flex items-start gap-2">
                          <AlertCircle size={15} className="shrink-0 mt-0.5" />
                          Drag or use arrows to reorder. Submit when ready.
                        </div>
                      )}

                      {selectedPrefs.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                          <Star size={32} className="mx-auto mb-2 opacity-30" />
                          <p className="text-sm">No preferences added yet.</p>
                          {selectedRequest.request_status === 'DRAFT' && (
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
                                  <img
                                    src={getImage(q, i)}
                                    alt={q.quarter_number}
                                    className="w-16 h-16 rounded-lg object-cover"
                                  />
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
                                {selectedRequest.request_status === 'DRAFT' && (
                                  <div className="flex flex-col items-center gap-1 shrink-0">
                                    <button onClick={() => {}} className="p-1 text-gray-400 hover:text-gray-600 rounded" title="Move up">
                                      <ArrowUp size={13} />
                                    </button>
                                    <button onClick={() => {}} className="p-1 text-gray-400 hover:text-gray-600 rounded" title="Move down">
                                      <ArrowDown size={13} />
                                    </button>
                                    <button onClick={() => {}} className="p-1 text-red-400 hover:text-red-600 rounded" title="Remove">
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {selectedRequest.request_status === 'DRAFT' && (
                        <div className="flex gap-3 mt-5 pt-5 border-t border-gray-100 justify-end">
                          <button onClick={() => openNewModal(selectedRequest)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <Plus size={14} /> Add / Reorder Preferences
                          </button>
                          <Button onClick={async () => {
                            try {
                              await quartersService.submitRequest(selectedRequest.id);
                              addToast('Request submitted', 'success');
                              loadRequests();
                            } catch { addToast('Failed to submit', 'error'); }
                          }}>
                            <Send size={14} className="mr-1" /> Submit Request
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-400">
                    <div className="text-center">
                      <Star size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Select a request to view preferences</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* New/Modify Request Modal */}
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

          {/* Request metadata */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Request Reason *</label>
                <input
                  value={form.request_reason}
                  onChange={e => setForm(f => ({ ...f, request_reason: e.target.value }))}
                  placeholder="e.g. Transfer-in"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Required BHK Config</label>
                <input
                  value={form.required_bhk_config}
                  onChange={e => setForm(f => ({ ...f, required_bhk_config: e.target.value }))}
                  placeholder="e.g. 3 BHK"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Preferred Location</label>
                <input
                  value={form.preferred_location}
                  onChange={e => setForm(f => ({ ...f, preferred_location: e.target.value }))}
                  placeholder="e.g. Block A"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Preferred Move-in Date</label>
                <input
                  type="date"
                  value={form.move_in_date}
                  onChange={e => setForm(f => ({ ...f, move_in_date: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Family Members</label>
                <input
                  type="number"
                  min={1}
                  value={form.family_member_count}
                  onChange={e => setForm(f => ({ ...f, family_member_count: Number(e.target.value) }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes (optional)</label>
                <input
                  value={form.employee_notes}
                  onChange={e => setForm(f => ({ ...f, employee_notes: e.target.value }))}
                  placeholder="Any additional notes"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          {/* Split: quarters picker (left) + preferences cart (right) */}
          <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-0">
            {/* Left: available quarters */}
            <div className="flex flex-col border-r border-gray-100 min-h-0">
              <div className="px-4 pt-4 pb-3 border-b border-gray-100 bg-white">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={modalSearch}
                    onChange={e => setModalSearch(e.target.value)}
                    placeholder="Search available quarters…"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  <span className="font-medium text-gray-700">{modalQuarters.length}</span> available · click <span className="font-medium text-blue-700">Add</span> to push to preferences
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {modalLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                  ))
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
                          <span>{q.bhk_config}</span>
                          <span>{q.area_sqft} sq.ft</span>
                          <span className="font-medium text-gray-800">{fmtINR(q.monthly_rent)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => addPref(q)}
                        disabled={prefs.length >= 5 || !!prefs.find(p => p.quarter.id === q.id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                      >
                        <Plus size={12} className="inline" /> Add
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: preference cart */}
            <div className="flex flex-col min-h-0 bg-gray-50/50">
              <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Star size={14} className="text-amber-500" /> Your Preferences
                  </h3>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${prefs.length >= 5 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                    {prefs.length} / 5
                  </span>
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
                        <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
                          {p.rank}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm">{p.quarter.quarter_number}</div>
                        <div className="text-xs text-gray-500">{p.quarter.bhk_config} · {fmtINR(p.quarter.monthly_rent)}/mo</div>
                      </div>
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button onClick={() => movePref(i, 'up')} disabled={i === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded transition-colors">
                          <ArrowUp size={12} />
                        </button>
                        <button onClick={() => movePref(i, 'down')} disabled={i === prefs.length - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded transition-colors">
                          <ArrowDown size={12} />
                        </button>
                        <button onClick={() => removePref(p.quarter.id)} className="p-1 text-red-400 hover:text-red-600 rounded transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-gray-200 flex gap-2">
                <button
                  onClick={handleSaveDraft}
                  disabled={submitting}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Save as Draft
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || prefs.length === 0}
                  className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
