import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Home, ChevronRight, IndianRupee, ArrowLeft, Building2,
  Phone, User, MapPin, Calendar, CheckCircle2, AlertTriangle,
  Clock, Receipt, TrendingUp, Send, ChevronDown, ChevronUp,
  BarChart2, LayoutGrid, CreditCard, TableProperties,
  RefreshCcw, MessageSquare, Eye, Wallet, Undo2, Search, X,
  Filter, Download,
} from 'lucide-react';
import { ROUTES } from '../constants/routes';
import { quartersService } from '../services/quartersService';
import type {
  RentTile, RentDueDetail, RentPayment, RentClarification, RentTrackerSummary,
} from '../services/quartersService';
import { SummaryStatsCard } from '../components/ui/SummaryStatsCard';
import { useAuthStore } from '../stores/authStore';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtMonth = (m: string) => {
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
};
const fmtMonthFull = (m: string) => {
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

type StatusKey = RentTile['status'];
const STATUS: Record<StatusKey, { label: string; bg: string; text: string; border: string; dot: string }> = {
  DUE:      { label: 'Due',      bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-400' },
  OVERDUE:  { label: 'Overdue',  bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-500' },
  PAID:     { label: 'Paid',     bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  PARTIAL:  { label: 'Partial',  bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200',     dot: 'bg-sky-400' },
  EXEMPTED: { label: 'Exempted', bg: 'bg-slate-50',   text: 'text-slate-600',   border: 'border-slate-200',   dot: 'bg-slate-400' },
};
const STATUS_LEFT: Record<StatusKey, string> = {
  DUE: 'bg-amber-400', OVERDUE: 'bg-red-500', PAID: 'bg-emerald-500', PARTIAL: 'bg-sky-400', EXEMPTED: 'bg-slate-300',
};
const PAYMENT_MODES = ['ALL','ONLINE','CHEQUE','DD','CASH','AUTO_DEDUCTION','EXEMPTED'] as const;

// ── Due Details Modal ─────────────────────────────────────────────────────────
interface DueDetailsModalProps {
  tile: RentTile; detail: RentDueDetail; isEO: boolean;
  onClose: () => void; onSave: (override: number, remarks: string) => void;
}
const DueDetailsModal: React.FC<DueDetailsModalProps> = ({ tile, detail, isEO, onClose, onSave }) => {
  const [override, setOverride] = useState(String(detail.penalty_override ?? detail.penalty_amount));
  const [remarks, setRemarks] = useState(detail.eo_remarks);
  const net = detail.base_rent + detail.water_charges + detail.utility_charges + (Number(override) || 0) - detail.waiver_amount;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <IndianRupee size={16} className="text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-gray-900">Due Details — {tile.quarter_number}</div>
            <div className="text-xs text-gray-400">{fmtMonthFull(tile.month)} · {tile.tenant_name}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {[
            { label: 'Base Rent',        value: fmtINR(detail.base_rent) },
            { label: 'Water Charges',    value: fmtINR(detail.water_charges) },
            { label: 'Utility Charges',  value: fmtINR(detail.utility_charges) },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span className="text-sm text-gray-600">{label}</span>
              <span className="text-sm font-semibold text-gray-900">{value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
            <div>
              <div className="text-sm text-gray-600">Penalty</div>
              <div className="text-[10px] text-gray-400">{detail.months_overdue} month(s) overdue · {detail.penalty_rate}%/month</div>
            </div>
            <span className="text-sm font-semibold text-red-600">{fmtINR(detail.penalty_amount)}</span>
          </div>
          {detail.waiver_amount > 0 && (
            <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span className="text-sm text-gray-600">Waiver Applied</span>
              <span className="text-sm font-semibold text-emerald-600">-{fmtINR(detail.waiver_amount)}</span>
            </div>
          )}
          {isEO && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-2">
              <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">EO Penalty Override</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Override Amount (₹)</span>
                <input
                  type="number" value={override} onChange={e => setOverride(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-sm border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-200 bg-white"
                  min={0} max={detail.penalty_amount}
                />
              </div>
              <textarea
                value={remarks} onChange={e => setRemarks(e.target.value)} rows={2}
                placeholder="Remarks for override (required)"
                className="w-full px-2.5 py-1.5 text-xs border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-200 bg-white resize-none"
              />
              <div className="text-[10px] text-amber-600">Max override limit: {fmtINR(detail.penalty_amount)} (100%)</div>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-sm font-bold text-gray-900">Net Payable</span>
            <span className="text-lg font-extrabold text-teal-700">{fmtINR(net)}</span>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Close
          </button>
          {isEO && (
            <button
              onClick={() => onSave(Number(override) || 0, remarks)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-sm"
            >
              Update
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Pay Now Modal ─────────────────────────────────────────────────────────────
interface PayNowModalProps { tile: RentTile; onClose: () => void; onPay: (amount: number, mode: string) => void; }
const PAY_MODES = ['UPI','NET_BANKING','CARD','DD'] as const;
const PayNowModal: React.FC<PayNowModalProps> = ({ tile, onClose, onPay }) => {
  const [amount, setAmount] = useState(String(tile.total_due - tile.amount_paid));
  const [mode, setMode] = useState<string>('UPI');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
            <Wallet size={16} className="text-teal-700" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-gray-900">Pay Now</div>
            <div className="text-xs text-gray-400">{tile.quarter_number} · {fmtMonthFull(tile.month)}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Amount (₹)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full px-3 py-2.5 text-lg font-bold border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-200"
              min={1} max={tile.total_due - tile.amount_paid} />
            <div className="text-[10px] text-gray-400 mt-1">Total due: {fmtINR(tile.total_due - tile.amount_paid)}</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Payment Mode</label>
            <div className="grid grid-cols-2 gap-2">
              {PAY_MODES.map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${mode === m ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-teal-50 rounded-xl p-3 border border-teal-100">
            <div className="text-[10px] font-bold text-teal-700 uppercase tracking-wide mb-1">Demo Payment</div>
            <div className="text-xs text-teal-600">This is a demo payment screen. No real transaction will be processed.</div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => onPay(Number(amount) || 0, mode)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold shadow-sm"
          >
            Pay {fmtINR(Number(amount) || 0)}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Undo Confirm Modal ────────────────────────────────────────────────────────
interface UndoModalProps { payment: RentPayment; onClose: () => void; onConfirm: () => void; }
const UndoModal: React.FC<UndoModalProps> = ({ payment, onClose, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
          <Undo2 size={16} className="text-rose-700" />
        </div>
        <div>
          <div className="text-sm font-bold text-gray-900">Undo Payment</div>
          <div className="text-xs text-gray-400">Receipt: {payment.receipt_ref || '—'}</div>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-1">Remove this payment of <strong>{fmtINR(payment.amount)}</strong> made on <strong>{fmtDate(payment.payment_date)}</strong>?</p>
      <p className="text-xs text-rose-600 mb-5">Status will revert to <strong>Due</strong>. This action cannot be undone.</p>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
        <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold">Undo Payment</button>
      </div>
    </div>
  </div>
);

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: StatusKey }> = ({ status }) => {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

// ── Tenant Info Chip ──────────────────────────────────────────────────────────
const TenantChip: React.FC<{ tile: RentTile }> = ({ tile }) => (
  <div className="flex items-center gap-1.5">
    <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
      <span className="text-[9px] font-bold text-teal-700">{tile.tenant_name[0]}</span>
    </div>
    <div className="min-w-0">
      <div className="text-xs font-semibold text-gray-900 truncate leading-tight">{tile.tenant_name}</div>
      <div className="text-[10px] text-gray-400 leading-tight truncate">{tile.tenant_designation}</div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  Main Page
// ─────────────────────────────────────────────────────────────────────────────
type ViewMode = 'table' | 'tile' | 'card' | 'graph';
type DpFilter = 'all' | 'DUE' | 'OVERDUE' | 'EXEMPTED' | 'PAID' | 'PARTIAL';

export const QuarterRentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();

  const isEO = user?.role === 'admin' || user?.role === 'manager';
  const isTenant = user?.role === 'govt_official' || user?.role === 'dept_user';

  // ── Data state ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [tiles, setTiles] = useState<RentTile[]>([]);
  const [summary, setSummary] = useState<RentTrackerSummary | null>(null);

  // ── Filter / view state ─────────────────────────────────────────────────────
  const [dpFilter, setDpFilter] = useState<DpFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('tile');
  const [monthFrom, setMonthFrom] = useState('2026-05');
  const [monthTo, setMonthTo]     = useState('2026-05');
  const [locFilter, setLocFilter]    = useState('');
  const [modeFilter, setModeFilter]  = useState('ALL');
  const [tenantFilter, setTenantFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // ── Panel state ─────────────────────────────────────────────────────────────
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'history' | 'clarifications' | null>(null);
  const [expandedInfoIds, setExpandedInfoIds] = useState<Set<string>>(new Set());
  const [dueModal, setDueModal]   = useState<{ tile: RentTile; detail: RentDueDetail } | null>(null);
  const [payNowTile, setPayNowTile] = useState<RentTile | null>(null);
  const [undoPayment, setUndoPayment] = useState<{ tile: RentTile; payment: RentPayment } | null>(null);
  const [payments, setPayments]   = useState<RentPayment[]>([]);
  const [clarifications, setClarifications] = useState<RentClarification[]>([]);
  const [clarMsg, setClarMsg] = useState('');
  const [paySuccess, setPaySuccess] = useState(false);

  // ── Pre-filter from query param ─────────────────────────────────────────────
  const filterAllotmentId = searchParams.get('allotment_id');

  // ── Load data ───────────────────────────────────────────────────────────────
  const loadTiles = useCallback(async () => {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([
        quartersService.getRentTrackerTiles({ monthFrom, monthTo, location: locFilter, paymentMode: modeFilter, tenant: tenantFilter }),
        quartersService.getRentTrackerSummary(),
      ]);
      setTiles(t);
      setSummary(s);
    } finally {
      setLoading(false);
    }
  }, [monthFrom, monthTo, locFilter, modeFilter, tenantFilter]);

  useEffect(() => { loadTiles(); }, [loadTiles]);

  // ── Filtered tiles ──────────────────────────────────────────────────────────
  const displayTiles = useMemo(() => {
    let t = tiles;
    if (filterAllotmentId && isTenant) t = t.filter(x => x.allotment_id === filterAllotmentId);
    if (dpFilter !== 'all') t = t.filter(x => x.status === dpFilter);
    return t;
  }, [tiles, dpFilter, filterAllotmentId, isTenant]);

  // ── Graph data ──────────────────────────────────────────────────────────────
  const graphData = useMemo(() => {
    const byMonth: Record<string, { due: number; paid: number; exempted: number; overdue: number; partial: number; count: number }> = {};
    for (const t of tiles) {
      if (!byMonth[t.month]) byMonth[t.month] = { due: 0, paid: 0, exempted: 0, overdue: 0, partial: 0, count: 0 };
      byMonth[t.month][t.status === 'DUE' ? 'due' : t.status === 'PAID' ? 'paid' : t.status === 'EXEMPTED' ? 'exempted' : t.status === 'OVERDUE' ? 'overdue' : 'partial'] += t.total_due || t.base_rent;
      byMonth[t.month].count += 1;
    }
    return Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([month, data]) => ({
      month,
      total: data.due + data.paid + data.exempted + data.overdue + data.partial,
      ...data,
    }));
  }, [tiles]);

  const maxGraphVal = useMemo(() => Math.max(...graphData.map(g => g.total), 1), [graphData]);

  // ── Panel handlers ──────────────────────────────────────────────────────────
  const openPanel = useCallback(async (tile: RentTile, panel: 'history' | 'clarifications') => {
    if (expandedId === tile.id && activePanel === panel) {
      setExpandedId(null); setActivePanel(null); return;
    }
    setExpandedId(tile.id); setActivePanel(panel);
    if (panel === 'history') {
      const p = await quartersService.getRentPaymentHistory(tile.allotment_id, tile.month);
      setPayments(p);
    } else {
      const c = await quartersService.getRentClarifications(tile.allotment_id, tile.month);
      setClarifications(c);
    }
  }, [expandedId, activePanel]);

  const openDueDetails = useCallback(async (tile: RentTile) => {
    const detail = await quartersService.getRentDueDetail(tile.id);
    setDueModal({ tile, detail });
  }, []);

  const handleSaveOverride = useCallback(async (override: number, remarks: string) => {
    if (!dueModal) return;
    await quartersService.applyPenaltyOverride(dueModal.tile.id, override, remarks);
    setDueModal(null);
    loadTiles();
  }, [dueModal, loadTiles]);

  const sendClarification = useCallback(async (tile: RentTile) => {
    if (!clarMsg.trim()) return;
    const role = isEO ? 'EO' : 'TENANT';
    const name = isEO ? 'Estate Officer' : (user?.name ?? 'Tenant');
    const msg = await quartersService.postRentClarification(tile.allotment_id, tile.month, clarMsg.trim(), role, name);
    setClarifications(prev => [...prev, msg]);
    setClarMsg('');
  }, [clarMsg, isEO, user?.name]);

  const handleUndoPayment = useCallback(async () => {
    if (!undoPayment) return;
    await quartersService.undoRentPayment(undoPayment.tile.allotment_id, undoPayment.tile.month, undoPayment.payment.id);
    setUndoPayment(null);
    setExpandedId(null); setActivePanel(null);
    loadTiles();
  }, [undoPayment, loadTiles]);

  const handlePay = useCallback(async (amount: number, mode: string) => {
    if (!payNowTile) return;
    await quartersService.submitEPayment(payNowTile.allotment_id, payNowTile.month, amount, mode);
    setPayNowTile(null);
    setPaySuccess(true);
    setTimeout(() => setPaySuccess(false), 3000);
    loadTiles();
  }, [payNowTile, loadTiles]);

  const toggleInfo = useCallback((id: string) => {
    setExpandedInfoIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // ── Tile actions row ────────────────────────────────────────────────────────
  const renderActions = (tile: RentTile) => {
    const isPanelOpen = expandedId === tile.id;
    if (isEO) return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        <button onClick={() => openDueDetails(tile)}
          className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">
          <IndianRupee size={10} /> Due Details
        </button>
        <button onClick={() => openPanel(tile, 'history')}
          className={`flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${isPanelOpen && activePanel === 'history' ? 'bg-teal-600 text-white border-teal-600' : 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'}`}>
          <Receipt size={10} /> Paid History
        </button>
        <button onClick={() => openPanel(tile, 'clarifications')}
          className={`flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${isPanelOpen && activePanel === 'clarifications' ? 'bg-slate-700 text-white border-slate-700' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}>
          <MessageSquare size={10} /> Clarifications
        </button>
      </div>
    );
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        <button onClick={() => openDueDetails(tile)}
          className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100">
          <Eye size={10} /> Details
        </button>
        <button onClick={() => openPanel(tile, 'clarifications')}
          className={`flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${isPanelOpen && activePanel === 'clarifications' ? 'bg-slate-700 text-white border-slate-700' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}>
          <MessageSquare size={10} /> Clarifications
        </button>
        {(tile.status === 'DUE' || tile.status === 'OVERDUE' || tile.status === 'PARTIAL') && (
          <button onClick={() => setPayNowTile(tile)}
            className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-teal-600 text-white border border-teal-600 hover:bg-teal-700">
            <Wallet size={10} /> Pay Now
          </button>
        )}
      </div>
    );
  };

  // ── Expanded panel ──────────────────────────────────────────────────────────
  const renderPanel = (tile: RentTile) => {
    if (expandedId !== tile.id || !activePanel) return null;
    if (activePanel === 'history') return (
      <div className="relative ml-6 mt-2 mr-2 mb-2">
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-teal-200 rounded-full" />
        <div className="space-y-2 pl-5">
          {payments.length === 0 && (
            <div className="text-xs text-gray-400 py-2">No payments recorded yet.</div>
          )}
          {payments.map(p => (
            <div key={p.id} className="relative">
              <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-teal-200 rounded-full" />
              <div className="absolute -left-[22px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-teal-300 bg-white" />
              <div className="flex items-center gap-3 bg-white rounded-xl border border-teal-100 p-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <Receipt size={13} className="text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{fmtINR(p.amount)}</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-1.5 py-0.5 font-semibold">{p.payment_mode.replace('_', ' ')}</span>
                  </div>
                  <div className="text-[10px] text-gray-400">{fmtDate(p.payment_date)} · {p.receipt_ref || '—'}</div>
                  {p.remarks && <div className="text-[10px] text-gray-500 mt-0.5">{p.remarks}</div>}
                </div>
                {isEO && (
                  <button onClick={() => setUndoPayment({ tile, payment: p })}
                    className="flex items-center gap-1 text-[10px] text-rose-600 border border-rose-200 bg-rose-50 rounded-lg px-2 py-1 hover:bg-rose-100 font-semibold shrink-0">
                    <Undo2 size={10} /> Undo
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
    // Clarifications panel
    return (
      <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
          <MessageSquare size={12} className="text-slate-600" />
          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Clarifications</span>
        </div>
        <div className="px-3 py-2 space-y-2 max-h-48 overflow-y-auto">
          {clarifications.length === 0 && <div className="text-xs text-gray-400 py-2">No messages yet.</div>}
          {clarifications.map(c => (
            <div key={c.id} className={`flex ${c.author_role === 'EO' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-xl px-3 py-2 text-xs ${c.author_role === 'EO' ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-gray-800'}`}>
                <div className={`text-[9px] font-bold mb-0.5 ${c.author_role === 'EO' ? 'text-teal-200' : 'text-teal-600'}`}>{c.author_name}</div>
                <p>{c.message}</p>
                <div className={`text-[9px] mt-0.5 ${c.author_role === 'EO' ? 'text-teal-200' : 'text-gray-400'}`}>{fmtDate(c.created_at.slice(0, 10))}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 px-3 py-2 border-t border-slate-100">
          <input value={clarMsg} onChange={e => setClarMsg(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && clarMsg.trim()) sendClarification(tile); }}
            placeholder="Type a message…"
            className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-300/40 bg-white" />
          <button onClick={() => sendClarification(tile)} disabled={!clarMsg.trim()}
            className="px-3 py-1.5 bg-teal-600 text-white rounded-lg disabled:opacity-40 hover:bg-teal-700">
            <Send size={12} />
          </button>
        </div>
      </div>
    );
  };

  // ── Tile view — compact 2-row summary + expand/collapse detail ───────────────
  const renderTileCard = (tile: RentTile) => {
    const accentBar = STATUS_LEFT[tile.status];
    const isOpen = expandedInfoIds.has(tile.id);
    return (
      <div key={tile.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        {/* ── Always-visible compact row ── */}
        <div className="flex items-center">
          <div className={`w-1 self-stretch shrink-0 ${accentBar}`} />
          <div
            className="flex-1 flex items-center gap-3 px-4 py-3 min-w-0 cursor-pointer select-none"
            onClick={() => toggleInfo(tile.id)}
          >
            {/* Quarter + BHK */}
            <div className="min-w-0 w-28 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-gray-900 truncate">{tile.quarter_number}</span>
                <span className="text-[9px] bg-gray-100 text-gray-500 rounded px-1 py-0.5 font-semibold shrink-0">{tile.bhk_config}</span>
              </div>
              <div className="text-[10px] text-gray-400 truncate">{tile.block_name}</div>
            </div>
            {/* Tenant */}
            <div className="flex-1 min-w-0 hidden sm:block">
              <TenantChip tile={tile} />
            </div>
            {/* Month */}
            <div className="text-[10px] text-gray-400 shrink-0 hidden md:block w-16 text-center">
              {fmtMonth(tile.month)}
            </div>
            {/* Amount due */}
            <div className="shrink-0 text-right">
              <div className={`text-sm font-extrabold ${tile.status === 'PAID' ? 'text-emerald-700' : tile.status === 'EXEMPTED' ? 'text-slate-500' : 'text-amber-700'}`}>
                {fmtINR(tile.total_due)}
              </div>
              <div className="text-[9px] text-gray-400 mt-0.5">total due</div>
            </div>
            {/* Status badge */}
            <div className="shrink-0"><StatusBadge status={tile.status} /></div>
            {/* More toggle */}
            <button
              className="shrink-0 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              onClick={e => { e.stopPropagation(); toggleInfo(tile.id); }}
              aria-label={isOpen ? 'Collapse' : 'Expand'}
            >
              <ChevronDown size={13} className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── Expanded detail section ── */}
        {isOpen && (
          <div className="border-t border-gray-100 px-4 py-3 space-y-3 bg-gray-50/40">
            {/* Tenant row on mobile, extra info on all */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="sm:hidden"><TenantChip tile={tile} /></div>
              <div className="flex items-center gap-4 flex-wrap text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><Phone size={9} /> {tile.tenant_phone}</span>
                <span className="flex items-center gap-1"><MapPin size={9} /> {tile.location_area}</span>
                <span className="flex items-center gap-1"><Calendar size={9} /> Due: {fmtDate(tile.due_date)}</span>
                {tile.last_paid_date && (
                  <span className="flex items-center gap-1"><CheckCircle2 size={9} className="text-emerald-400" /> Paid: {fmtDate(tile.last_paid_date)}</span>
                )}
              </div>
            </div>
            {/* Finance mini-grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-lg bg-white border border-gray-100">
                <div className="text-[9px] text-gray-400 font-medium">Base Rent</div>
                <div className="text-xs font-bold text-gray-700">{fmtINR(tile.base_rent)}</div>
              </div>
              <div className={`text-center p-2 rounded-lg border ${tile.total_due > tile.amount_paid ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
                <div className="text-[9px] text-gray-400 font-medium">Total Due</div>
                <div className={`text-xs font-bold ${tile.total_due > tile.amount_paid ? 'text-amber-700' : 'text-emerald-700'}`}>{fmtINR(tile.total_due)}</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-white border border-gray-100">
                <div className="text-[9px] text-gray-400 font-medium">Paid</div>
                <div className="text-xs font-bold text-emerald-700">{tile.amount_paid > 0 ? fmtINR(tile.amount_paid) : '—'}</div>
              </div>
            </div>
            {/* Penalty / exemption notes */}
            {tile.penalty_amount > 0 && (tile.penalty_override === null || tile.penalty_override > 0) && (
              <div className="flex items-center gap-1.5 text-[10px] text-red-600">
                <AlertTriangle size={9} />
                Penalty: {fmtINR(tile.penalty_override ?? tile.penalty_amount)}
                {tile.penalty_override !== null && <span className="text-gray-400">(overridden)</span>}
              </div>
            )}
            {tile.exemption_reason && (
              <div className="text-[10px] text-slate-500 italic">Exemption: {tile.exemption_reason}</div>
            )}
            {/* Actions + panels */}
            {renderActions(tile)}
            {renderPanel(tile)}
          </div>
        )}
      </div>
    );
  };

  // ── Table row ──────────────────────────────────────────────────────────────
  const renderTableRow = (tile: RentTile) => (
    <React.Fragment key={tile.id}>
      <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100">
        <td className="px-4 py-3">
          <div className="text-xs font-bold text-gray-900">{tile.quarter_number}</div>
          <div className="text-[10px] text-gray-400">{tile.block_name} · {tile.location_area}</div>
        </td>
        <td className="px-4 py-3"><TenantChip tile={tile} /></td>
        <td className="px-4 py-3 text-xs font-medium text-gray-700">{fmtMonth(tile.month)}</td>
        <td className="px-4 py-3 text-xs font-semibold text-gray-900 text-right">{fmtINR(tile.base_rent)}</td>
        <td className="px-4 py-3 text-xs font-bold text-amber-700 text-right">{fmtINR(tile.total_due)}</td>
        <td className="px-4 py-3 text-xs font-semibold text-red-600 text-right">{tile.penalty_amount > 0 ? fmtINR(tile.penalty_override ?? tile.penalty_amount) : '—'}</td>
        <td className="px-4 py-3"><StatusBadge status={tile.status} /></td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1 flex-wrap">{renderActions(tile)}</div>
        </td>
      </tr>
      {expandedId === tile.id && activePanel && (
        <tr className="bg-gray-50/50">
          <td colSpan={8} className="px-4 py-0 pb-3">{renderPanel(tile)}</td>
        </tr>
      )}
    </React.Fragment>
  );

  // ── Card view — compact 3-row header + expand/collapse ──────────────────────
  const renderCardItem = (tile: RentTile) => {
    const accentBar = STATUS_LEFT[tile.status];
    const isOpen = expandedInfoIds.has(tile.id);
    const avatarBg = tile.status === 'PAID' ? 'bg-emerald-100' : tile.status === 'OVERDUE' ? 'bg-red-100' : tile.status === 'EXEMPTED' ? 'bg-slate-100' : 'bg-amber-100';
    const avatarText = tile.status === 'PAID' ? 'text-emerald-700' : tile.status === 'OVERDUE' ? 'text-red-700' : tile.status === 'EXEMPTED' ? 'text-slate-500' : 'text-amber-700';
    return (
      <div key={tile.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
        {/* ── Always-visible compact header (3 rows) ── */}
        <div
          className="p-4 cursor-pointer select-none"
          onClick={() => toggleInfo(tile.id)}
        >
          {/* Row 1: avatar + tenant name + status badge */}
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${avatarBg}`}>
              <span className={`text-xs font-extrabold ${avatarText}`}>{tile.tenant_name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-900 truncate leading-tight">{tile.tenant_name}</div>
              <div className="text-[10px] text-gray-400 truncate leading-tight">{tile.tenant_designation}</div>
            </div>
            <StatusBadge status={tile.status} />
          </div>
          {/* Row 2: quarter + location */}
          <div className={`mx-0 my-2 h-0.5 rounded-full ${accentBar}`} />
          <div className="flex items-center gap-3 text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><Building2 size={9} /> {tile.quarter_number} · {tile.block_name}</span>
            <span className="flex items-center gap-1 truncate"><MapPin size={9} /> {tile.location_area}</span>
          </div>
          {/* Row 3: due amount + month + chevron */}
          <div className="flex items-center justify-between mt-2">
            <div>
              <span className={`text-base font-extrabold ${tile.status === 'PAID' ? 'text-emerald-700' : tile.status === 'EXEMPTED' ? 'text-slate-500' : 'text-amber-700'}`}>
                {fmtINR(tile.total_due)}
              </span>
              <span className="text-[10px] text-gray-400 ml-1.5">due · {fmtMonth(tile.month)}</span>
            </div>
            <button
              className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              onClick={e => { e.stopPropagation(); toggleInfo(tile.id); }}
              aria-label={isOpen ? 'Collapse' : 'Expand'}
            >
              <ChevronDown size={13} className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── Expanded detail section ── */}
        {isOpen && (
          <div className="border-t border-gray-100 px-4 py-3 space-y-3 bg-gray-50/40">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5 text-gray-600"><IndianRupee size={10} /> Base: {fmtINR(tile.base_rent)}</div>
              <div className="flex items-center gap-1.5 font-bold text-amber-700"><IndianRupee size={10} /> Due: {fmtINR(tile.total_due)}</div>
              <div className="flex items-center gap-1.5 text-gray-500"><Phone size={10} /> {tile.tenant_phone}</div>
              <div className="flex items-center gap-1.5 text-gray-500"><Calendar size={10} /> {fmtDate(tile.due_date)}</div>
              {tile.last_paid_date && (
                <div className="flex items-center gap-1.5 text-emerald-600 col-span-2">
                  <CheckCircle2 size={10} /> Last paid: {fmtDate(tile.last_paid_date)}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-gray-500 col-span-2 truncate">
                <User size={10} /> {tile.tenant_dept}
              </div>
            </div>
            {tile.penalty_amount > 0 && (tile.penalty_override === null || tile.penalty_override > 0) && (
              <div className="flex items-center gap-1.5 text-[10px] text-red-600">
                <AlertTriangle size={9} />
                Penalty: {fmtINR(tile.penalty_override ?? tile.penalty_amount)}
                {tile.penalty_override !== null && <span className="text-gray-400">(overridden)</span>}
              </div>
            )}
            {tile.exemption_reason && (
              <div className="text-[10px] text-slate-500 italic">Exemption: {tile.exemption_reason}</div>
            )}
            {renderActions(tile)}
            {renderPanel(tile)}
          </div>
        )}
      </div>
    );
  };

  // ── Graph view ──────────────────────────────────────────────────────────────
  const renderGraph = () => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1 h-5 rounded-full bg-teal-600" />
        <h3 className="text-sm font-bold text-gray-800">Rent Collection — Monthly Overview</h3>
        <div className="ml-auto flex items-center gap-3 text-[10px]">
          {[['bg-amber-400','Due'],['bg-red-500','Overdue'],['bg-emerald-500','Paid'],['bg-sky-400','Partial'],['bg-slate-300','Exempted']].map(([c, l]) => (
            <span key={l} className="flex items-center gap-1"><span className={`w-2 h-2 rounded-sm ${c}`} />{l}</span>
          ))}
        </div>
      </div>
      {graphData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No data for selected range</div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[400px]">
            {/* Y axis labels */}
            <div className="flex gap-1 items-end h-52 mb-2">
              <div className="flex flex-col justify-between h-full pr-2 text-right shrink-0">
                {[maxGraphVal, maxGraphVal * 0.75, maxGraphVal * 0.5, maxGraphVal * 0.25, 0].map((v, i) => (
                  <span key={i} className="text-[9px] text-gray-300 leading-none">{v > 0 ? `₹${Math.round(v / 1000)}K` : '0'}</span>
                ))}
              </div>
              {/* Grid lines + bars */}
              <div className="flex-1 relative">
                {[0, 25, 50, 75, 100].map(p => (
                  <div key={p} className="absolute w-full border-t border-gray-100" style={{ bottom: `${p}%` }} />
                ))}
                <div className="flex items-end gap-2 h-full relative z-10">
                  {graphData.map(g => {
                    const totalH = (g.total / maxGraphVal) * 100;
                    const paidH  = (g.paid  / maxGraphVal) * 100;
                    const dueH   = (g.due   / maxGraphVal) * 100;
                    const overdueH  = (g.overdue  / maxGraphVal) * 100;
                    const partialH  = (g.partial  / maxGraphVal) * 100;
                    const exemptedH = (g.exempted / maxGraphVal) * 100;
                    return (
                      <div key={g.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group cursor-pointer"
                        onClick={() => { setMonthFrom(g.month); setMonthTo(g.month); setViewMode('tile'); }}>
                        <div className="text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity font-semibold whitespace-nowrap">
                          {fmtINR(g.total)} · {g.count}
                        </div>
                        <div className="w-full flex flex-col justify-end rounded-t-lg overflow-hidden border border-gray-100 hover:border-teal-300 transition-colors"
                          style={{ height: `${Math.max(totalH, 2)}%` }}>
                          {overdueH  > 0 && <div style={{ height: `${(overdueH / totalH) * 100}%` }}  className="bg-red-400 min-h-[2px]" />}
                          {dueH      > 0 && <div style={{ height: `${(dueH / totalH) * 100}%` }}      className="bg-amber-400 min-h-[2px]" />}
                          {partialH  > 0 && <div style={{ height: `${(partialH / totalH) * 100}%` }}  className="bg-sky-400 min-h-[2px]" />}
                          {exemptedH > 0 && <div style={{ height: `${(exemptedH / totalH) * 100}%` }} className="bg-slate-300 min-h-[2px]" />}
                          {paidH     > 0 && <div style={{ height: `${(paidH / totalH) * 100}%` }}     className="bg-emerald-400 min-h-[2px]" />}
                        </div>
                        <span className="text-[10px] font-semibold text-gray-500 mt-0.5">{fmtMonth(g.month)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <p className="text-[10px] text-gray-400 mt-3 text-center">Click any bar to view that month's data in tile view</p>
    </div>
  );

  // ── DP cards config ─────────────────────────────────────────────────────────
  const dpCards = summary ? [
    { label: 'Total Rent Due',   value: summary.total_due_count,   subtitle: fmtINR(summary.total_due_amount),   gradient: 'bg-gradient-to-r from-amber-500 to-orange-500',   dp: 'DUE'      as DpFilter, icon: IndianRupee },
    { label: 'Overdue/Arrears', value: summary.arrears_count,     subtitle: fmtINR(summary.arrears_amount),     gradient: 'bg-gradient-to-r from-red-500 to-rose-600',        dp: 'OVERDUE'  as DpFilter, icon: AlertTriangle },
    { label: 'Exempted',         value: summary.exempted_count,    subtitle: fmtINR(summary.exempted_amount),    gradient: 'bg-gradient-to-r from-slate-500 to-slate-600',     dp: 'EXEMPTED' as DpFilter, icon: Receipt },
    { label: 'Paid This Period', value: summary.paid_count,        subtitle: fmtINR(summary.paid_amount),        gradient: 'bg-gradient-to-r from-emerald-500 to-teal-600',    dp: 'PAID'     as DpFilter, icon: TrendingUp },
    { label: 'Partial Payments', value: summary.partial_count,     subtitle: fmtINR(summary.partial_amount),     gradient: 'bg-gradient-to-r from-sky-500 to-blue-600',        dp: 'PARTIAL'  as DpFilter, icon: Clock },
    { label: 'Collection Rate',  value: summary.collection_rate,   subtitle: 'of total demand met',              gradient: 'bg-gradient-to-r from-teal-600 to-emerald-600',    dp: 'all'      as DpFilter, icon: BarChart2 },
  ] : [];

  const views: { id: ViewMode; icon: React.FC<{ size?: number; className?: string }>; label: string }[] = [
    { id: 'table', icon: TableProperties, label: 'Table' },
    { id: 'tile',  icon: LayoutGrid,      label: 'Tile'  },
    { id: 'card',  icon: CreditCard,      label: 'Card'  },
    { id: 'graph', icon: BarChart2,       label: 'Graph' },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-5">
          <Home size={11} />
          <ChevronRight size={10} />
          <span>Workspace</span>
          <ChevronRight size={10} />
          <span className="text-gray-600 font-medium">Rent Tracker</span>
        </div>
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 transition-all">
          <ArrowLeft size={15} /> Back
        </button>

        {/* Page header */}
        <div className="bg-gradient-to-r from-teal-700 to-emerald-600 rounded-2xl px-8 py-6 mb-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <IndianRupee size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">Rent Tracker</h1>
              <p className="text-teal-100 text-sm mt-0.5">Quarters rent collection — demand, payments &amp; arrears</p>
            </div>
            <button onClick={() => {}} className="hidden sm:flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors border border-white/20">
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {/* Success toast */}
        {paySuccess && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-500 animate-in fade-in">
            <CheckCircle2 size={18} /> Payment recorded successfully
          </div>
        )}

        {/* DP Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-gray-200 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {dpCards.map((c, i) => (
              <SummaryStatsCard
                key={c.label} label={c.label} value={c.value} icon={c.icon}
                gradient={c.gradient} subtitle={c.subtitle} delay={i * 50}
                isActive={dpFilter === c.dp}
                onClick={() => setDpFilter(dpFilter === c.dp ? 'all' : c.dp)}
              />
            ))}
          </div>
        )}

        {/* Filter bar */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 mb-5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <Calendar size={13} className="text-gray-400 shrink-0" />
              <input type="month" value={monthFrom} onChange={e => setMonthFrom(e.target.value)}
                className="text-xs bg-transparent border-none outline-none text-gray-700 font-medium w-28" />
              <span className="text-gray-300 text-xs">–</span>
              <input type="month" value={monthTo} onChange={e => setMonthTo(e.target.value)}
                className="text-xs bg-transparent border-none outline-none text-gray-700 font-medium w-28" />
            </div>
            <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 min-w-[160px]">
              <Search size={13} className="text-gray-400 shrink-0" />
              <input value={tenantFilter} onChange={e => setTenantFilter(e.target.value)}
                placeholder="Search tenant…"
                className="flex-1 text-xs bg-transparent border-none outline-none text-gray-700" />
              {tenantFilter && <button onClick={() => setTenantFilter('')}><X size={11} className="text-gray-400" /></button>}
            </div>
            <button onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-colors ${showFilters ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              <Filter size={13} /> Filters {showFilters ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
            <button onClick={loadTiles}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-colors">
              <RefreshCcw size={12} /> Apply
            </button>
          </div>
          {showFilters && (
            <div className="flex gap-3 mt-3 flex-wrap pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Location</label>
                <input value={locFilter} onChange={e => setLocFilter(e.target.value)}
                  placeholder="Estate / Block…"
                  className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-200 w-36" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Payment Mode</label>
                <select value={modeFilter} onChange={e => setModeFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-200 bg-white">
                  {PAYMENT_MODES.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* View toggle + results */}
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">
              {loading ? '…' : `${displayTiles.length} record${displayTiles.length !== 1 ? 's' : ''}`}
              {dpFilter !== 'all' && <span className="ml-1 text-teal-600">· Filtered: {STATUS[dpFilter as StatusKey]?.label}</span>}
            </span>
            {dpFilter !== 'all' && (
              <button onClick={() => setDpFilter('all')} className="text-[10px] text-gray-400 hover:text-gray-700 flex items-center gap-0.5">
                <X size={10} /> Clear filter
              </button>
            )}
          </div>
          <div className="inline-flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
            {views.map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setViewMode(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === id ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <Icon size={13} /> <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 rounded-2xl bg-gray-200 animate-pulse" />)}
          </div>
        ) : displayTiles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-8 py-16 text-center">
            <Receipt size={28} className="text-gray-200 mx-auto mb-3" />
            <div className="text-sm font-semibold text-gray-500">No rent records match the current filters</div>
            <button onClick={() => { setDpFilter('all'); setTenantFilter(''); setLocFilter(''); setModeFilter('ALL'); }}
              className="mt-4 text-xs text-teal-600 hover:underline font-medium">Clear all filters</button>
          </div>
        ) : viewMode === 'graph' ? renderGraph()
          : viewMode === 'table' ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {['Quarter','Tenant','Month','Rent','Total Due','Penalty','Status','Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>{displayTiles.map(renderTableRow)}</tbody>
                </table>
              </div>
            </div>
          ) : viewMode === 'tile' ? (
            <div className="space-y-3">{displayTiles.map(t => renderTileCard(t))}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">{displayTiles.map(t => renderCardItem(t))}</div>
          )}

      </main>

      {/* Modals */}
      {dueModal && (
        <DueDetailsModal tile={dueModal.tile} detail={dueModal.detail} isEO={isEO}
          onClose={() => setDueModal(null)} onSave={handleSaveOverride} />
      )}
      {payNowTile && (
        <PayNowModal tile={payNowTile} onClose={() => setPayNowTile(null)} onPay={handlePay} />
      )}
      {undoPayment && (
        <UndoModal payment={undoPayment.payment} onClose={() => setUndoPayment(null)} onConfirm={handleUndoPayment} />
      )}
    </div>
  );
};
