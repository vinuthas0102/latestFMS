import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Home, ChevronRight, IndianRupee, Building2,
  Phone, User, MapPin, Calendar, CheckCircle2, AlertTriangle,
  Clock, Receipt, TrendingUp, Send, ChevronDown,
  BarChart2, LayoutGrid, CreditCard, TableProperties,
  MessageSquare, Eye, Wallet, Undo2, Search, X,
  Download, MoreVertical, Shield, Wrench, Zap, Layers,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES } from '../constants/routes';
import { quartersService } from '../services/quartersService';
import type {
  RentTile, RentDueDetail, RentPayment, RentClarification, RentTrackerSummary,
} from '../services/quartersService';
import { SummaryStatsCard } from '../components/ui/SummaryStatsCard';
import { MandatorySearchBar } from '../components/ui/MandatorySearchBar';
import SplitLayout from '../components/ui/SplitLayout';
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
  onClose: () => void; onSave: (override: number, remarks: string) => Promise<void>;
}
const DueDetailsModal: React.FC<DueDetailsModalProps> = ({ tile, detail, isEO, onClose, onSave }) => {
  const [override, setOverride] = useState(String(detail.penalty_override ?? detail.penalty_amount));
  const [remarks, setRemarks] = useState(detail.eo_remarks ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const overrideNum  = Math.min(Math.max(Number(override) || 0, 0), detail.penalty_amount);
  const overrideChanged = overrideNum !== detail.penalty_amount;
  const hasOverrideActive = detail.penalty_override !== null && detail.penalty_override < detail.penalty_amount;
  const canSave = !overrideChanged || remarks.trim().length > 0;
  const subtotal = detail.base_rent + detail.water_charges + detail.utility_charges
    + (tile.sd_amount ?? 0) + (tile.advance_amount ?? 0) + (tile.maintenance_charge ?? 0);
  const net = subtotal + overrideNum - detail.waiver_amount;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    await onSave(overrideNum, remarks.trim());
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <IndianRupee size={16} className="text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gray-900">Due Details — {tile.quarter_number}</span>
              <StatusBadge status={tile.status} />
            </div>
            <div className="text-xs text-gray-400">{fmtMonthFull(tile.month)} · {tile.tenant_name}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1.5">
          {/* Rent breakdown */}
          {[
            { label: 'Base Rent',       value: detail.base_rent },
            { label: 'Water Charges',   value: detail.water_charges },
            { label: 'Utility Charges', value: detail.utility_charges },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-gray-500">{label}</span>
              <span className="text-sm font-medium text-gray-800">{fmtINR(value)}</span>
            </div>
          ))}
          {/* Additional charge components from tile */}
          {(tile.sd_amount ?? 0) > 0 && (
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm text-gray-500 flex items-center gap-1.5"><Shield size={11} className="text-blue-400" />Security Deposit</span>
              <span className="text-sm font-medium text-blue-700">{fmtINR(tile.sd_amount ?? 0)}</span>
            </div>
          )}
          {(tile.advance_amount ?? 0) > 0 && (
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm text-gray-500 flex items-center gap-1.5"><Zap size={11} className="text-violet-400" />Advance Amount</span>
              <span className="text-sm font-medium text-violet-700">{fmtINR(tile.advance_amount ?? 0)}</span>
            </div>
          )}
          {(tile.maintenance_charge ?? 0) > 0 && (
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm text-gray-500 flex items-center gap-1.5"><Wrench size={11} className="text-orange-400" />Maintenance Charge</span>
              <span className="text-sm font-medium text-orange-700">{fmtINR(tile.maintenance_charge ?? 0)}</span>
            </div>
          )}
          {/* Sub-total */}
          <div className="flex items-center justify-between py-1.5 border-t border-dashed border-gray-200 mt-1">
            <span className="text-sm font-semibold text-gray-700">Sub-total</span>
            <span className="text-sm font-bold text-gray-900">{fmtINR(subtotal)}</span>
          </div>
          {/* Penalty row */}
          {detail.penalty_amount > 0 && (
            <div className="flex items-center justify-between py-1.5 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div>
                  <div className="text-sm text-gray-500 flex items-center gap-1.5">
                    Penalty
                    {hasOverrideActive && (
                      <span className="text-[9px] font-bold bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 border border-amber-200">OVERRIDE ACTIVE</span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400">{detail.months_overdue} month(s) overdue · {detail.penalty_rate}%/month</div>
                </div>
              </div>
              <span className={`text-sm font-semibold ${hasOverrideActive ? 'line-through text-gray-400' : 'text-red-600'}`}>{fmtINR(detail.penalty_amount)}</span>
            </div>
          )}
          {hasOverrideActive && (
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm text-amber-700">Override Applied</span>
              <span className="text-sm font-semibold text-amber-600">{fmtINR(detail.penalty_override!)}</span>
            </div>
          )}
          {detail.waiver_amount > 0 && (
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm text-gray-500">Waiver Applied</span>
              <span className="text-sm font-semibold text-emerald-600">−{fmtINR(detail.waiver_amount)}</span>
            </div>
          )}
          {/* Net payable */}
          <div className="flex items-center justify-between pt-3 mt-1 border-t-2 border-gray-200">
            <span className="text-sm font-bold text-gray-900">Net Payable</span>
            <span className="text-xl font-extrabold text-teal-700">{fmtINR(net)}</span>
          </div>

          {/* EO Override section */}
          {isEO && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
              <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">EO Penalty Override</div>
              <div className="flex items-center gap-3">
                <label className="text-xs text-gray-600 whitespace-nowrap">Override (₹)</label>
                <input
                  type="number"
                  value={override}
                  onChange={e => { setOverride(e.target.value); setSaved(false); }}
                  min={0} max={detail.penalty_amount}
                  className="flex-1 px-3 py-1.5 text-sm border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-300/50 bg-white"
                />
              </div>
              <div>
                <textarea
                  value={remarks}
                  onChange={e => { setRemarks(e.target.value); setSaved(false); }}
                  rows={2}
                  placeholder={overrideChanged ? 'Remarks required when overriding penalty…' : 'Optional remarks…'}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-amber-300/50 bg-white resize-none transition-colors ${
                    overrideChanged && !remarks.trim() ? 'border-red-300' : 'border-amber-200'
                  }`}
                />
                {overrideChanged && !remarks.trim() && (
                  <p className="text-[10px] text-red-500 mt-0.5">Remarks are required when overriding a penalty.</p>
                )}
              </div>
              <div className="text-[10px] text-amber-600 flex items-center gap-1">
                <AlertTriangle size={10} />
                Max override: {fmtINR(detail.penalty_amount)} (full waiver)
              </div>
            </div>
          )}

          {/* Success banner */}
          {saved && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 mt-2">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-emerald-700">Override saved successfully.</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Close
          </button>
          {isEO && (
            <button
              onClick={handleSave}
              disabled={saving || saved || !canSave}
              className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</>
              ) : saved ? (
                <><CheckCircle2 size={14} /> Saved</>
              ) : 'Update'}
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
interface UndoModalProps { payment: RentPayment; onClose: () => void; onConfirm: (reason: string) => void; }
const UndoModal: React.FC<UndoModalProps> = ({ payment, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const canConfirm = reason.trim().length > 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
            <Undo2 size={16} className="text-rose-700" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-gray-900">Undo Payment</div>
            <div className="text-xs text-gray-400">Receipt: {payment.receipt_ref || '—'}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-3">
            <p className="text-sm text-gray-700">Remove payment of <strong className="text-gray-900">{fmtINR(payment.amount)}</strong> made on <strong className="text-gray-900">{fmtDate(payment.payment_date)}</strong>?</p>
            <p className="text-xs text-rose-600 mt-1">Tile status will revert to <strong>Due</strong> or <strong>Partial</strong> depending on remaining payments.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reason for reversal <span className="text-red-500">*</span></label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={2}
              placeholder="e.g. Wrong tenant, duplicate entry, incorrect amount…"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-200/60 bg-white resize-none outline-none"
              autoFocus
            />
            {!canConfirm && <p className="text-[10px] text-gray-400 mt-0.5">Required before confirming reversal.</p>}
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-5 pt-1">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => canConfirm && onConfirm(reason.trim())}
            disabled={!canConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-sm font-bold transition-colors"
          >
            Undo Payment
          </button>
        </div>
      </div>
    </div>
  );
};

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

// ── Rent Chat Right Panel (replaces popup; lives inside SplitLayout) ──────────
const CLAR_MAX = 500;
interface RentChatPanelProps {
  tile: RentTile;
  clarifications: RentClarification[];
  clarMsg: string;
  isEO: boolean;
  controls: React.ReactNode;
  onChange: (v: string) => void;
  onSend: () => void;
}
const RentChatPanel: React.FC<RentChatPanelProps> = ({
  tile, clarifications, clarMsg, isEO, controls, onChange, onSend,
}) => {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [clarifications]);
  const selfRole = isEO ? 'EO' : 'TENANT';
  const charCount = clarMsg.length;
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-teal-700 text-white shrink-0">
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
          <MessageSquare size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate">{tile.quarter_number} · {fmtMonthFull(tile.month)}</div>
          <div className="text-[10px] text-teal-200 truncate">{tile.tenant_name} · Clarifications</div>
        </div>
        {controls}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/30 min-h-0">
        {clarifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <MessageSquare size={24} className="text-gray-200" />
            <span className="text-xs text-gray-400">No messages yet. Start the conversation.</span>
          </div>
        ) : clarifications.map(c => {
          const isSelf = c.author_role === selfRole;
          return (
            <div key={c.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                isSelf ? 'bg-teal-600 text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
              }`}>
                {!isSelf && (
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{c.author_name}</div>
                )}
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{c.message}</p>
                <div className={`text-[10px] mt-1.5 ${isSelf ? 'text-teal-200' : 'text-gray-400'}`}>
                  {fmtDate(c.created_at.slice(0, 10))}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input footer */}
      <div className="px-4 pt-3 pb-4 border-t border-gray-100 shrink-0 space-y-1.5 bg-white">
        <div className="flex gap-2 items-end">
          <textarea
            value={clarMsg}
            onChange={e => onChange(e.target.value.slice(0, CLAR_MAX))}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && clarMsg.trim()) { e.preventDefault(); onSend(); } }}
            placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
            rows={2}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-300/40 bg-white outline-none resize-none"
            autoFocus
          />
          <button
            onClick={onSend}
            disabled={!clarMsg.trim()}
            className="px-4 py-2 bg-teal-600 text-white rounded-xl disabled:opacity-40 hover:bg-teal-700 transition-colors shrink-0 self-end"
          >
            <Send size={14} />
          </button>
        </div>
        <div className={`text-[10px] text-right ${charCount > CLAR_MAX * 0.9 ? 'text-amber-500' : 'text-gray-400'}`}>
          {charCount} / {CLAR_MAX}
        </div>
      </div>
    </div>
  );
};

// ── Tile Actions Menu — portal-based dropdown, immune to overflow-hidden ──────
interface TileActionsMenuProps {
  tile: RentTile;
  isEO: boolean;
  chatTileId: string | null;
  expandedId: string | null;
  activePanel: 'history' | null;
  onPayNow: (tile: RentTile) => void;
  onDueDetails: (tile: RentTile) => void;
  onHistoryPanel: (tile: RentTile) => void;
  onChatPanel: (tile: RentTile) => void;
}
const TileActionsMenu: React.FC<TileActionsMenuProps> = ({
  tile, isEO, chatTileId, expandedId, activePanel,
  onPayNow, onDueDetails, onHistoryPanel, onChatPanel,
}) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const hasDue = tile.status === 'DUE' || tile.status === 'OVERDUE' || tile.status === 'PARTIAL';
  const hasPayments = tile.status === 'PAID' || tile.status === 'PARTIAL';
  const showClar = tile.status !== 'EXEMPTED';
  const isHistoryOpen = expandedId === tile.id && activePanel === 'history';
  const isChatOpen = chatTileId === tile.id;

  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) { setOpen(false); return; }
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      const menuHeight = 80;
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow >= menuHeight ? rect.bottom + 4 : rect.top - menuHeight - 4;
      setMenuPos({ top, right: window.innerWidth - rect.right });
    }
    setOpen(true);
  };

  const close = () => setOpen(false);

  return (
    <div className="flex items-center gap-1.5">
      {/* Pay Now — primary CTA (tenant only) */}
      {!isEO && hasDue && (
        <button
          onClick={e => { e.stopPropagation(); onPayNow(tile); }}
          title="Pay Now"
          className="flex items-center justify-center p-1.5 rounded-lg bg-teal-600 text-white border border-teal-600 hover:bg-teal-700 transition-colors"
        >
          <Wallet size={12} />
        </button>
      )}

      {/* Inline chat icon */}
      {showClar && (
        <button
          onClick={e => { e.stopPropagation(); onChatPanel(tile); }}
          title="Clarifications"
          className={`p-1.5 rounded-lg border transition-colors ${
            isChatOpen
              ? 'bg-teal-600 text-white border-teal-600'
              : 'border-gray-200 text-gray-400 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200'
          }`}
        >
          <MessageSquare size={12} />
        </button>
      )}

      {/* Actions dropdown — only shown when there are items */}
      {(hasDue || hasPayments) && (
        <>
          <button
            ref={btnRef}
            onClick={openMenu}
            title="Actions"
            className={`flex items-center justify-center p-1.5 rounded-lg border transition-colors ${
              open ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <MoreVertical size={13} />
          </button>

          {open && menuPos && createPortal(
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-[9998]" onClick={close} />
              {/* Menu */}
              <div
                className="fixed z-[9999] bg-white rounded-xl border border-gray-200 shadow-xl py-1.5 min-w-[160px]"
                style={{ top: menuPos.top, right: menuPos.right }}
              >
                {hasDue && (
                  <button
                    onClick={e => { e.stopPropagation(); close(); onDueDetails(tile); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 hover:bg-amber-50 hover:text-amber-800 transition-colors text-left"
                  >
                    <IndianRupee size={12} className="text-amber-500 shrink-0" />
                    Due Details
                  </button>
                )}
                {hasPayments && (
                  <button
                    onClick={e => { e.stopPropagation(); close(); onHistoryPanel(tile); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs transition-colors text-left ${
                      isHistoryOpen ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-gray-700 hover:bg-teal-50 hover:text-teal-700'
                    }`}
                  >
                    <Receipt size={12} className="text-teal-500 shrink-0" />
                    Paid History
                  </button>
                )}
              </div>
            </>,
            document.body
          )}
        </>
      )}
    </div>
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
type DpFilter = 'all' | 'DUE' | 'OVERDUE' | 'EXEMPTED' | 'PAID' | 'PARTIAL'
  | 'RENT_OUTSTANDING' | 'SD_PENDING' | 'ADVANCE_PENDING' | 'MAINTENANCE_ARREARS' | 'PENALTY';

function computeSummaryFromTiles(tiles: RentTile[]): RentTrackerSummary {
  let total_due_count = 0, total_due_amount = 0;
  let arrears_count = 0, arrears_amount = 0;
  let exempted_count = 0, exempted_amount = 0;
  let paid_count = 0, paid_amount = 0;
  let partial_count = 0, partial_amount = 0;
  let sd_pending_count = 0, sd_pending_amount = 0;
  let advance_pending_count = 0, advance_pending_amount = 0;
  let maintenance_arrears_count = 0, maintenance_arrears_amount = 0;
  let penalty_accumulated_count = 0, penalty_accumulated_amount = 0;

  for (const t of tiles) {
    if      (t.status === 'DUE')      { total_due_count++; total_due_amount += t.total_due; }
    else if (t.status === 'OVERDUE')  { arrears_count++;   arrears_amount   += t.total_due; }
    else if (t.status === 'EXEMPTED') { exempted_count++;  exempted_amount  += t.base_rent; }
    else if (t.status === 'PAID')     { paid_count++;      paid_amount      += t.amount_paid; }
    else if (t.status === 'PARTIAL')  { partial_count++;   partial_amount   += t.amount_paid; }

    if ((t.sd_amount ?? 0) > 0 && (t.status === 'DUE' || t.status === 'OVERDUE' || t.status === 'PARTIAL')) {
      sd_pending_count++; sd_pending_amount += (t.sd_amount ?? 0);
    }
    if ((t.advance_amount ?? 0) > 0 && (t.status === 'DUE' || t.status === 'OVERDUE' || t.status === 'PARTIAL')) {
      advance_pending_count++; advance_pending_amount += (t.advance_amount ?? 0);
    }
    if ((t.maintenance_charge ?? 0) > 0 && (t.status === 'DUE' || t.status === 'OVERDUE' || t.status === 'PARTIAL')) {
      maintenance_arrears_count++; maintenance_arrears_amount += (t.maintenance_charge ?? 0);
    }
    if ((t.penalty_amount ?? 0) > 0 && (t.status === 'DUE' || t.status === 'OVERDUE' || t.status === 'PARTIAL')) {
      penalty_accumulated_count++; penalty_accumulated_amount += (t.penalty_override ?? t.penalty_amount ?? 0);
    }
  }

  const demand = total_due_amount + arrears_amount + paid_amount + partial_amount;
  const collection_rate = demand > 0 ? Math.round((paid_amount + partial_amount) / demand * 100) : 0;

  const total_outstanding_count = total_due_count + arrears_count + partial_count;
  const total_outstanding_amount = total_due_amount + arrears_amount + (tiles.filter(t => t.status === 'PARTIAL').reduce((s, t) => s + (t.total_due - t.amount_paid), 0));

  return {
    total_due_count, total_due_amount, arrears_count, arrears_amount,
    exempted_count, exempted_amount, paid_count, paid_amount,
    partial_count, partial_amount, collection_rate,
    total_outstanding_count, total_outstanding_amount,
    sd_pending_count, sd_pending_amount,
    advance_pending_count, advance_pending_amount,
    maintenance_arrears_count, maintenance_arrears_amount,
    penalty_accumulated_count, penalty_accumulated_amount,
  };
}

export const QuarterRentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();

  const isEO = user?.role === 'admin' || user?.role === 'manager';
  const isTenant = user?.role === 'govt_official' || user?.role === 'dept_user';

  // ── Data state ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [tiles, setTiles] = useState<RentTile[]>([]);

  // ── Filter / view state ─────────────────────────────────────────────────────
  const [dpFilter, setDpFilter] = useState<DpFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('tile');
  const [monthFrom, setMonthFrom] = useState('2026-05');
  const [monthTo, setMonthTo]     = useState('2026-05');
  const [locFilter, setLocFilter]    = useState('');
  const [modeFilter, setModeFilter]  = useState('ALL');
  const [tenantFilter, setTenantFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // ── Panel / modal state ─────────────────────────────────────────────────────
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'history' | null>(null);
  const [expandedInfoIds, setExpandedInfoIds] = useState<Set<string>>(new Set());
  const [dueModal, setDueModal]   = useState<{ tile: RentTile; detail: RentDueDetail } | null>(null);
  const [chatTileId, setChatTileId] = useState<string | null>(null);
  const [payNowTile, setPayNowTile] = useState<RentTile | null>(null);
  const [undoPayment, setUndoPayment] = useState<{ tile: RentTile; payment: RentPayment } | null>(null);
  const [payments, setPayments]   = useState<RentPayment[]>([]);
  const [clarifications, setClarifications] = useState<RentClarification[]>([]);
  const [clarMsg, setClarMsg] = useState('');
  const [paySuccess, setPaySuccess] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  // ── Pre-filter from query param ─────────────────────────────────────────────
  const filterAllotmentId = searchParams.get('allotment_id');

  // ── Load data ───────────────────────────────────────────────────────────────
  const loadTiles = useCallback(async () => {
    setLoading(true);
    try {
      const t = await quartersService.getRentTrackerTiles({ monthFrom, monthTo, location: locFilter, paymentMode: modeFilter, tenant: tenantFilter });
      setTiles(t);
    } finally {
      setLoading(false);
    }
  }, [monthFrom, monthTo, locFilter, modeFilter, tenantFilter]);

  useEffect(() => { loadTiles(); }, [loadTiles]);

  // ── Summary derived from loaded tiles (always in sync with what is displayed) ─
  const summary = useMemo(() => tiles.length ? computeSummaryFromTiles(tiles) : null, [tiles]);

  // ── Filtered tiles ──────────────────────────────────────────────────────────
  const displayTiles = useMemo(() => {
    let t = tiles;
    if (filterAllotmentId && isTenant) t = t.filter(x => x.allotment_id === filterAllotmentId);
    if (dpFilter === 'DUE')                  t = t.filter(x => x.status === 'DUE');
    else if (dpFilter === 'OVERDUE')         t = t.filter(x => x.status === 'OVERDUE');
    else if (dpFilter === 'EXEMPTED')        t = t.filter(x => x.status === 'EXEMPTED');
    else if (dpFilter === 'PAID')            t = t.filter(x => x.status === 'PAID');
    else if (dpFilter === 'PARTIAL')         t = t.filter(x => x.status === 'PARTIAL');
    else if (dpFilter === 'RENT_OUTSTANDING') t = t.filter(x => x.status === 'DUE' || x.status === 'OVERDUE' || x.status === 'PARTIAL');
    else if (dpFilter === 'SD_PENDING')      t = t.filter(x => (x.sd_amount ?? 0) > 0 && (x.status === 'DUE' || x.status === 'OVERDUE' || x.status === 'PARTIAL'));
    else if (dpFilter === 'ADVANCE_PENDING') t = t.filter(x => (x.advance_amount ?? 0) > 0 && (x.status === 'DUE' || x.status === 'OVERDUE' || x.status === 'PARTIAL'));
    else if (dpFilter === 'MAINTENANCE_ARREARS') t = t.filter(x => (x.maintenance_charge ?? 0) > 0 && (x.status === 'DUE' || x.status === 'OVERDUE' || x.status === 'PARTIAL'));
    else if (dpFilter === 'PENALTY')         t = t.filter(x => (x.penalty_amount ?? 0) > 0 && (x.status === 'DUE' || x.status === 'OVERDUE' || x.status === 'PARTIAL'));
    return t;
  }, [tiles, dpFilter, filterAllotmentId, isTenant]);

  // ── Derived chat tile ───────────────────────────────────────────────────────
  const chatTile = useMemo(() => tiles.find(t => t.id === chatTileId) ?? null, [tiles, chatTileId]);

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
  const openHistoryPanel = useCallback(async (tile: RentTile) => {
    if (expandedId === tile.id && activePanel === 'history') {
      setExpandedId(null); setActivePanel(null); return;
    }
    setExpandedId(tile.id); setActivePanel('history');
    const p = await quartersService.getRentPaymentHistory(tile.allotment_id, tile.month);
    setPayments(p);
  }, [expandedId, activePanel]);

  const openChatPanel = useCallback(async (tile: RentTile) => {
    if (chatTileId === tile.id) { setChatTileId(null); setClarMsg(''); return; }
    const c = await quartersService.getRentClarifications(tile.allotment_id, tile.month);
    setClarifications(c);
    setChatTileId(tile.id);
    setClarMsg('');
  }, [chatTileId]);

  const openDueDetails = useCallback(async (tile: RentTile) => {
    const detail = await quartersService.getRentDueDetail(tile.id);
    setDueModal({ tile, detail });
  }, []);

  const handleSaveOverride = useCallback(async (override: number, remarks: string) => {
    if (!dueModal) return;
    await quartersService.applyPenaltyOverride(dueModal.tile.id, override, remarks);
    loadTiles();
  }, [dueModal, loadTiles]);

  const sendClarification = useCallback(async (tile: RentTile) => {
    if (!clarMsg.trim()) return;
    const role = isEO ? 'EO' : 'TENANT';
    const name = isEO ? 'Estate Officer' : (user?.fullName ?? 'Tenant');
    const msg = await quartersService.postRentClarification(tile.allotment_id, tile.month, clarMsg.trim(), role, name);
    setClarifications(prev => [...prev, msg]);
    setClarMsg('');
  }, [clarMsg, isEO, user?.fullName]);

  const handleUndoPayment = useCallback(async (reason: string) => {
    if (!undoPayment) return;
    await quartersService.undoRentPayment(undoPayment.tile.allotment_id, undoPayment.tile.month, undoPayment.payment.id, reason);
    setUndoPayment(null);
    setExpandedId(null); setActivePanel(null);
    loadTiles();
    showToast('Payment reversed — tile status updated.');
  }, [undoPayment, loadTiles, showToast]);

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

  // ── Paid history inline panel ──────────────────────────────────────────────
  const renderPanel = (tile: RentTile) => {
    if (expandedId !== tile.id || activePanel !== 'history') return null;
    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
    return (
      <div className="relative ml-6 mt-2 mr-2 mb-2">
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-teal-200 rounded-full" />
        <div className="space-y-2 pl-5">
          {payments.length === 0 ? (
            <div className="flex items-center gap-2 py-3 text-xs text-gray-400">
              <Receipt size={13} className="text-gray-300" />
              No payments recorded for this period.
            </div>
          ) : (
            <>
              {payments.map(p => (
                <div key={p.id} className="relative">
                  <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-teal-200 rounded-full" />
                  <div className="absolute -left-[22px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-teal-300 bg-white" />
                  <div className="flex items-center gap-3 bg-white rounded-xl border border-teal-100 p-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <Receipt size={13} className="text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900">{fmtINR(p.amount)}</span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-1.5 py-0.5 font-semibold">{p.payment_mode.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{fmtDate(p.payment_date)} · {p.receipt_ref || '—'}</div>
                      {p.remarks && <div className="text-[10px] text-gray-500 mt-0.5 italic">{p.remarks}</div>}
                      {p.recorded_by && (
                        <div className="text-[10px] text-gray-400 mt-0.5">Recorded by: {p.recorded_by}</div>
                      )}
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
              {payments.length > 1 && (
                <div className="flex items-center justify-between px-3 py-2 bg-teal-50 rounded-xl border border-teal-100">
                  <span className="text-xs font-semibold text-teal-700">Total Paid ({payments.length} payments)</span>
                  <span className="text-sm font-extrabold text-teal-700">{fmtINR(totalPaid)}</span>
                </div>
              )}
            </>
          )}
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
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-bold text-gray-900 truncate">{tile.quarter_number}</span>
                <span className="text-[9px] bg-gray-100 text-gray-500 rounded px-1 py-0.5 font-semibold shrink-0">{tile.bhk_config}</span>
                {tile.penalty_override !== null && tile.penalty_override < tile.penalty_amount && (
                  <span className="text-[9px] bg-amber-100 text-amber-700 border border-amber-200 rounded px-1 py-0.5 font-bold shrink-0">OVR</span>
                )}
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
            {/* Actions — always visible on the row */}
            <div className="shrink-0" onClick={e => e.stopPropagation()}>
              <TileActionsMenu
                tile={tile} isEO={isEO} chatTileId={chatTileId}
                expandedId={expandedId} activePanel={activePanel}
                onPayNow={setPayNowTile} onDueDetails={openDueDetails}
                onHistoryPanel={openHistoryPanel} onChatPanel={openChatPanel}
              />
            </div>
            {/* Expand toggle */}
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
          </div>
        )}
        {/* Paid history panel — visible without requiring expand */}
        {renderPanel(tile)}
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
          <TileActionsMenu
            tile={tile} isEO={isEO} chatTileId={chatTileId}
            expandedId={expandedId} activePanel={activePanel}
            onPayNow={setPayNowTile} onDueDetails={openDueDetails}
            onHistoryPanel={openHistoryPanel} onChatPanel={openChatPanel}
          />
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
          {/* Row 3: due amount + month + actions + chevron */}
          <div className="flex items-center justify-between mt-2">
            <div>
              <span className={`text-base font-extrabold ${tile.status === 'PAID' ? 'text-emerald-700' : tile.status === 'EXEMPTED' ? 'text-slate-500' : 'text-amber-700'}`}>
                {fmtINR(tile.total_due)}
              </span>
              <span className="text-[10px] text-gray-400 ml-1.5">due · {fmtMonth(tile.month)}</span>
            </div>
            <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
              <TileActionsMenu
                tile={tile} isEO={isEO} chatTileId={chatTileId}
                expandedId={expandedId} activePanel={activePanel}
                onPayNow={setPayNowTile} onDueDetails={openDueDetails}
                onHistoryPanel={openHistoryPanel} onChatPanel={openChatPanel}
              />
              <button
                className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                onClick={e => { e.stopPropagation(); toggleInfo(tile.id); }}
                aria-label={isOpen ? 'Collapse' : 'Expand'}
              >
                <ChevronDown size={13} className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
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
          </div>
        )}
        {/* Paid history panel — visible without requiring expand */}
        {renderPanel(tile)}
      </div>
    );
  };

  // ── Graph view ──────────────────────────────────────────────────────────────
  const renderGraph = () => {
    const BAR_GROUPS = [
      { key: 'due'      as const, label: 'Due',      color: 'bg-amber-400',   hoverColor: 'hover:bg-amber-500'   },
      { key: 'overdue'  as const, label: 'Overdue',  color: 'bg-red-500',     hoverColor: 'hover:bg-red-600'     },
      { key: 'paid'     as const, label: 'Paid',     color: 'bg-emerald-500', hoverColor: 'hover:bg-emerald-600' },
      { key: 'partial'  as const, label: 'Partial',  color: 'bg-sky-400',     hoverColor: 'hover:bg-sky-500'     },
      { key: 'exempted' as const, label: 'Exempted', color: 'bg-slate-300',   hoverColor: 'hover:bg-slate-400'   },
    ] as { key: keyof typeof graphData[0]; label: string; color: string; hoverColor: string }[];

    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1 h-5 rounded-full bg-teal-600" />
          <h3 className="text-sm font-bold text-gray-800">Payment Collection — Monthly Overview</h3>
          <div className="ml-auto flex items-center gap-3 text-[10px]">
            {BAR_GROUPS.map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1">
                <span className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                <span className="text-gray-600 font-medium">{label}</span>
              </span>
            ))}
          </div>
        </div>

        {graphData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-300 text-sm">No data for selected range</div>
        ) : (
          <div className="overflow-x-auto">
            <div style={{ minWidth: `${Math.max(400, graphData.length * 120)}px` }}>
              <div className="flex gap-1 items-end h-64 mb-1">
                {/* Y-axis labels */}
                <div className="flex flex-col justify-between h-full pr-2 text-right shrink-0 w-12">
                  {[maxGraphVal, maxGraphVal * 0.75, maxGraphVal * 0.5, maxGraphVal * 0.25, 0].map((v, i) => (
                    <span key={i} className="text-[9px] text-gray-400 leading-none">
                      {v > 0 ? `₹${Math.round(v / 1000)}K` : '0'}
                    </span>
                  ))}
                </div>

                {/* Chart area */}
                <div className="flex-1 relative h-full">
                  {/* Horizontal grid lines */}
                  {[0, 25, 50, 75, 100].map(p => (
                    <div key={p} className="absolute w-full border-t border-gray-100" style={{ bottom: `${p}%` }} />
                  ))}

                  {/* Month groups */}
                  <div className="flex items-end h-full gap-3 relative z-10">
                    {graphData.map(g => (
                      <div
                        key={g.month}
                        className="flex-1 flex flex-col h-full cursor-pointer"
                        onClick={() => { setMonthFrom(g.month); setMonthTo(g.month); setViewMode('tile'); }}
                      >
                        {/* Bars area */}
                        <div className="flex-1 flex items-end gap-[3px]">
                          {BAR_GROUPS.map(({ key, label, color, hoverColor }) => {
                            const val = g[key] as number;
                            const heightPct = maxGraphVal > 0 ? (val / maxGraphVal) * 100 : 0;
                            return (
                              <div key={key} className="flex-1 flex flex-col items-center justify-end h-full group/bar relative">
                                {/* Tooltip */}
                                {val > 0 && (
                                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none z-20 bg-gray-800 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap">
                                    {fmtINR(val)}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                                  </div>
                                )}
                                <div
                                  className={`w-full rounded-t-sm transition-all duration-200 ${color} ${hoverColor} ${val === 0 ? 'opacity-0' : ''}`}
                                  style={{ height: `${Math.max(heightPct, val > 0 ? 2 : 0)}%` }}
                                  title={`${label}: ${fmtINR(val)}`}
                                />
                              </div>
                            );
                          })}
                        </div>
                        {/* Month label */}
                        <div className="pt-2 text-center">
                          <span className="text-[10px] font-semibold text-gray-500">{fmtMonth(g.month)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <p className="text-[10px] text-gray-400 mt-2 text-center">Click any month to view that month's data in tile view</p>
      </div>
    );
  };

  // ── DP cards config ─────────────────────────────────────────────────────────
  const statusCards = summary ? [
    { label: 'Paid This Period', value: summary.paid_count,     subtitle: fmtINR(summary.paid_amount),     gradient: 'bg-gradient-to-r from-emerald-500 to-teal-600',  dp: 'PAID'     as DpFilter, icon: TrendingUp },
    { label: 'Partial Payments', value: summary.partial_count,  subtitle: fmtINR(summary.partial_amount),  gradient: 'bg-gradient-to-r from-sky-500 to-blue-600',       dp: 'PARTIAL'  as DpFilter, icon: Clock },
    { label: 'Exempted',         value: summary.exempted_count, subtitle: fmtINR(summary.exempted_amount), gradient: 'bg-gradient-to-r from-slate-500 to-slate-600',    dp: 'EXEMPTED' as DpFilter, icon: Receipt },
    { label: 'Collection Rate',  value: summary.collection_rate, subtitle: 'of total demand met',          gradient: 'bg-gradient-to-r from-teal-600 to-emerald-600',  dp: 'all'      as DpFilter, icon: BarChart2 },
  ] : [];

  // Sub-DP components under Total Outstanding
  const subDpCards = summary ? [
    { label: 'Rent Due',          value: summary.total_due_count + summary.arrears_count, subtitle: fmtINR(summary.total_due_amount + summary.arrears_amount),  dp: 'RENT_OUTSTANDING'    as DpFilter, icon: IndianRupee,  color: 'amber',   accentClass: 'border-amber-200 bg-amber-50 hover:bg-amber-100',  textClass: 'text-amber-700',  subColor: 'bg-amber-400' },
    { label: 'SD Pending',        value: summary.sd_pending_count,             subtitle: fmtINR(summary.sd_pending_amount),           dp: 'SD_PENDING'          as DpFilter, icon: Shield,        color: 'blue',    accentClass: 'border-blue-200 bg-blue-50 hover:bg-blue-100',      textClass: 'text-blue-700',   subColor: 'bg-blue-400' },
    { label: 'Adv. Pending',      value: summary.advance_pending_count,        subtitle: fmtINR(summary.advance_pending_amount),      dp: 'ADVANCE_PENDING'     as DpFilter, icon: Zap,           color: 'purple',  accentClass: 'border-violet-200 bg-violet-50 hover:bg-violet-100', textClass: 'text-violet-700', subColor: 'bg-violet-400' },
    { label: 'Maint. Arrears',    value: summary.maintenance_arrears_count,    subtitle: fmtINR(summary.maintenance_arrears_amount),  dp: 'MAINTENANCE_ARREARS' as DpFilter, icon: Wrench,        color: 'orange',  accentClass: 'border-orange-200 bg-orange-50 hover:bg-orange-100', textClass: 'text-orange-700', subColor: 'bg-orange-400' },
    { label: 'Penalty Acc.',      value: summary.penalty_accumulated_count,    subtitle: fmtINR(summary.penalty_accumulated_amount),  dp: 'PENALTY'             as DpFilter, icon: AlertTriangle, color: 'red',     accentClass: 'border-red-200 bg-red-50 hover:bg-red-100',         textClass: 'text-red-700',    subColor: 'bg-red-500' },
  ] : [];

  const views: { id: ViewMode; icon: LucideIcon; label: string }[] = [
    { id: 'table', icon: TableProperties, label: 'Table' },
    { id: 'tile',  icon: LayoutGrid,      label: 'Tile'  },
    { id: 'card',  icon: CreditCard,      label: 'Card'  },
    { id: 'graph', icon: BarChart2,       label: 'Graph' },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  const activeFilterCount = [locFilter, modeFilter !== 'ALL' ? modeFilter : ''].filter(Boolean).length;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-teal-50/20">

      {/* ── Frozen header — breadcrumb, title, DP cards only ── */}
      <div className="flex-none bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2 flex-wrap">
            <button onClick={() => navigate(ROUTES.DASHBOARD)} className="hover:text-teal-600 transition-colors"><Home size={11} /></button>
            <ChevronRight size={10} />
            <button onClick={() => navigate(ROUTES.DASHBOARD)} className="text-gray-500 hover:text-teal-600 transition-colors">My Workspace</button>
            <ChevronRight size={10} />
            <span className="text-gray-700 font-medium">Payment Tracker</span>
          </div>

          {/* Title row */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-0.5 flex items-center gap-2.5">
                <div className="p-1.5 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl shadow-lg">
                  <IndianRupee className="w-4 h-4 text-white" />
                </div>
                Payment Tracker
              </h1>
              <p className="text-sm text-gray-500 mt-0.5 ml-9">Rent, SD, advances, maintenance &amp; penalties across all property types</p>
            </div>
            <div className="flex items-center gap-3">
              {/* View switcher */}
              <div className="inline-flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
                {views.map(({ id, icon: Icon, label }) => (
                  <button key={id} onClick={() => setViewMode(id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === id ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Icon size={13} /> <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
              <button className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <Download size={14} /> Export
              </button>
            </div>
          </div>

          {/* DP Summary Cards — hero + sub-DPs + status row */}
          {loading ? (
            <div className="space-y-3">
              <div className="h-20 rounded-2xl bg-gray-200 animate-pulse" />
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-200 animate-pulse" />)}
              </div>
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-200 animate-pulse" />)}
              </div>
            </div>
          ) : summary ? (
            <div className="space-y-2">
              {/* Hero — Total Outstanding */}
              <button
                onClick={() => setDpFilter(dpFilter === 'RENT_OUTSTANDING' ? 'all' : 'RENT_OUTSTANDING')}
                className={`w-full text-left rounded-2xl p-4 transition-all border-2 ${
                  dpFilter === 'RENT_OUTSTANDING'
                    ? 'bg-gradient-to-r from-slate-800 to-slate-700 border-slate-600 shadow-lg ring-2 ring-slate-500/30'
                    : 'bg-gradient-to-r from-slate-800 to-slate-700 border-transparent hover:border-slate-500 shadow-md hover:shadow-lg'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <Layers size={18} className="text-white" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Total Outstanding</div>
                      <div className="text-2xl font-extrabold text-white leading-tight">{fmtINR(summary.total_outstanding_amount)}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-3xl font-black text-white/90">{summary.total_outstanding_count}</div>
                    <div className="text-[10px] text-slate-400 font-medium">records</div>
                  </div>
                </div>
              </button>

              {/* Sub-DPs — 5 components */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {subDpCards.map((c) => {
                  const Icon = c.icon;
                  const isActive = dpFilter === c.dp;
                  return (
                    <button
                      key={c.dp}
                      onClick={() => setDpFilter(dpFilter === c.dp ? 'all' : c.dp)}
                      className={`text-left rounded-xl px-3 py-2.5 border-2 transition-all ${c.accentClass} ${isActive ? 'border-current shadow ring-2 ring-current/20' : ''}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon size={11} className={`${c.textClass} shrink-0`} />
                        <span className={`text-[10px] font-bold uppercase tracking-wide ${c.textClass}`}>{c.label}</span>
                      </div>
                      <div className={`text-lg font-extrabold leading-tight ${c.textClass}`}>{c.value}</div>
                      <div className={`text-[10px] font-medium mt-0.5 ${c.textClass} opacity-80`}>{c.subtitle}</div>
                    </button>
                  );
                })}
              </div>

              {/* Proportional breakdown bar */}
              {summary.total_outstanding_amount > 0 && (() => {
                const total = summary.total_outstanding_amount;
                const rentAmt   = summary.total_due_amount + summary.arrears_amount;
                const sdAmt     = summary.sd_pending_amount;
                const advAmt    = summary.advance_pending_amount;
                const maintAmt  = summary.maintenance_arrears_amount;
                const penAmt    = summary.penalty_accumulated_amount;
                const segs = [
                  { pct: (rentAmt  / total) * 100, color: 'bg-amber-400',  label: 'Rent' },
                  { pct: (sdAmt    / total) * 100, color: 'bg-blue-400',   label: 'SD' },
                  { pct: (advAmt   / total) * 100, color: 'bg-violet-400', label: 'Adv' },
                  { pct: (maintAmt / total) * 100, color: 'bg-orange-400', label: 'Maint' },
                  { pct: (penAmt   / total) * 100, color: 'bg-red-500',    label: 'Penalty' },
                ].filter(s => s.pct > 0);
                return (
                  <div className="flex items-center gap-2">
                    <div className="flex flex-1 h-2 rounded-full overflow-hidden gap-px">
                      {segs.map((s, i) => (
                        <div key={i} className={`${s.color} transition-all duration-500`} style={{ width: `${s.pct}%` }} title={`${s.label}: ${s.pct.toFixed(1)}%`} />
                      ))}
                    </div>
                    <div className="flex items-center gap-2.5 text-[9px] text-gray-500 shrink-0">
                      {segs.map((s, i) => (
                        <span key={i} className="flex items-center gap-0.5">
                          <span className={`w-2 h-2 rounded-sm ${s.color}`} />{s.label}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Status row — 4 cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
                {statusCards.map((c, i) => (
                  <SummaryStatsCard
                    key={c.label} label={c.label} value={c.value} icon={c.icon}
                    gradient={c.gradient} subtitle={c.subtitle} delay={i * 50}
                    isActive={dpFilter === c.dp}
                    onClick={() => setDpFilter(dpFilter === c.dp ? 'all' : c.dp)}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Scrollable body wrapped in SplitLayout for chat right panel ── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <SplitLayout
          storageKey="rentTrackerSplit"
          defaultSplit={65}
          minLeft={40}
          maxLeft={85}
          onClose={() => { setChatTileId(null); setClarMsg(''); }}
          renderRight={chatTileId && chatTile ? (controls) => (
            <RentChatPanel
              tile={chatTile}
              clarifications={clarifications}
              clarMsg={clarMsg}
              isEO={isEO}
              controls={controls}
              onChange={setClarMsg}
              onSend={() => sendClarification(chatTile)}
            />
          ) : undefined}
          left={
            <div className="h-full overflow-y-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">

          {/* ── Filter bar — below DP cards ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3 mb-2">
            <MandatorySearchBar
              fields={[
                {
                  key: 'tenant',
                  label: 'Search',
                  type: 'text',
                  placeholder: 'Tenant name or quarter…',
                  value: tenantFilter,
                  onChange: setTenantFilter,
                  icon: <Search size={14} />,
                },
                {
                  key: 'status',
                  label: 'Status',
                  type: 'chips',
                  value: dpFilter,
                  onChange: (v) => setDpFilter(v as DpFilter),
                  options: [
                    { value: 'all',      label: 'All'      },
                    { value: 'DUE',      label: 'Due'      },
                    { value: 'OVERDUE',  label: 'Overdue'  },
                    { value: 'PAID',     label: 'Paid'     },
                    { value: 'PARTIAL',  label: 'Partial'  },
                    { value: 'EXEMPTED', label: 'Exempted' },
                  ],
                },
                {
                  key: 'monthFrom',
                  label: 'From Month',
                  type: 'date',
                  value: monthFrom + '-01',
                  onChange: (v) => setMonthFrom(v.slice(0, 7)),
                },
                {
                  key: 'monthTo',
                  label: 'To Month',
                  type: 'date',
                  value: monthTo + '-01',
                  onChange: (v) => setMonthTo(v.slice(0, 7)),
                },
                {
                  key: 'mode',
                  label: 'Payment Mode',
                  type: 'select',
                  value: modeFilter,
                  onChange: setModeFilter,
                  options: PAYMENT_MODES.map(m => ({ value: m, label: m.replace('_', ' ') })),
                },
              ]}
              onSearch={loadTiles}
              searchLabel="Apply"
              filterCount={activeFilterCount}
              onFilterOpen={() => setShowFilters(f => !f)}
            />

            {/* Secondary filter — location */}
            {showFilters && (
              <div className="flex items-center gap-3 flex-wrap pt-3 mt-1 border-t border-gray-100">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Location</span>
                <input value={locFilter} onChange={e => setLocFilter(e.target.value)}
                  placeholder="Estate / Block…"
                  className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-200 w-44" />
                {locFilter && (
                  <button onClick={() => setLocFilter('')} className="text-[10px] text-gray-400 hover:text-gray-700 flex items-center gap-0.5">
                    <X size={10} /> Clear
                  </button>
                )}
              </div>
            )}
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

        </div>
            </div>
          }
        />
      </div>

      {/* Toast notifications */}
      {paySuccess && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-500">
          <CheckCircle2 size={18} /> Payment recorded successfully
        </div>
      )}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border text-white ${
          toast.type === 'success' ? 'bg-emerald-600 border-emerald-500' : 'bg-red-600 border-red-500'
        }`}>
          <CheckCircle2 size={18} /> {toast.msg}
        </div>
      )}

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
