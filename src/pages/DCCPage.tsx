import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  IndianRupee, Phone, MapPin, AlertTriangle,
  CheckCircle2, Clock, Receipt, TrendingUp,
  Download, SlidersHorizontal, ChevronDown, ChevronUp,
  Wallet, Eye, Users, Sliders, Plus, FileText,
  LayoutGrid, List, Table2, Calendar, Building2, ChevronRight,
  ChevronLeft, MoreVertical, MessageSquare, Send, X, Loader2,
} from 'lucide-react';
import { dccService } from '../services/dccService';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import type {
  DccTile, DccTrackerSummary, DccDemandFilters,
  DccDemandType, DccObjectOwner, DccObject, DccDemandChat,
} from '../types/dcc';
import { FilterDrawer } from '../components/ui/FilterDrawer';
import { DCCReconciliationTab } from '../components/dcc/DCCReconciliationTab';
import { DCCReportsTab } from '../components/dcc/DCCReportsTab';
import { useViewPreference } from '../hooks/useViewPreference';
import { DataTable, type Column } from '../components/ui/DataTable';
import type { ViewMode } from '../components/ui/ViewSwitcher';
import SplitLayout from '../components/ui/SplitLayout';
import { ChatDeliveryModePicker } from '../components/ui/ChatDeliveryModePicker';
import type { ChatDeliveryMode } from '../types/quarters';

type DeliveryModes = ChatDeliveryMode[];


// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

type StatusKey = DccTile['status'];
const STATUS: Record<StatusKey, { label: string; bg: string; text: string; border: string; dot: string }> = {
  DUE:      { label: 'Due',      bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-400' },
  OVERDUE:  { label: 'Overdue',  bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-500' },
  PAID:     { label: 'Paid',     bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  EXEMPTED: { label: 'Exempted', bg: 'bg-slate-50',   text: 'text-slate-600',   border: 'border-slate-200',   dot: 'bg-slate-400' },
};

// ── DP (Dashboard Panel) types ─────────────────────────────────────────────────
type DpKey = 'ALL' | 'PAID' | 'DUE' | 'OVERDUE';
interface DpConfig { key: DpKey; label: string; icon: typeof CheckCircle2; color: string; bg: string; gradient: string; accent: string; bar: string; ring: string; }

const DPS: DpConfig[] = [
  { key: 'ALL',     label: 'All Demands',     icon: Receipt,       color: 'text-blue-700',    bg: 'bg-blue-50',      gradient: 'from-blue-500 to-blue-600',     accent: 'bg-blue-500',    bar: 'bg-blue-400',    ring: 'ring-blue-400' },
  { key: 'PAID',    label: 'Total Paid',      icon: CheckCircle2,   color: 'text-emerald-700', bg: 'bg-emerald-50',   gradient: 'from-emerald-500 to-emerald-600', accent: 'bg-emerald-500', bar: 'bg-emerald-400', ring: 'ring-emerald-400' },
  { key: 'DUE',     label: 'Total Due',       icon: Clock,         color: 'text-amber-700',   bg: 'bg-amber-50',     gradient: 'from-amber-500 to-amber-600',   accent: 'bg-amber-500',   bar: 'bg-amber-400',  ring: 'ring-amber-400' },
  { key: 'OVERDUE', label: 'Total Overdue',   icon: AlertTriangle, color: 'text-red-700',     bg: 'bg-red-50',       gradient: 'from-red-500 to-red-600',       accent: 'bg-red-500',     bar: 'bg-red-400',    ring: 'ring-red-400' },
];

// ── Icon-only View Mode Toggle ──────────────────────────────────────────────────
const IconViewToggle: React.FC<{
  currentView: ViewMode;
  onViewChange: (v: ViewMode) => void;
}> = ({ currentView, onViewChange }) => {
  const views: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
    { mode: 'card', icon: LayoutGrid, label: 'Cards' },
    { mode: 'list', icon: List, label: 'List' },
    { mode: 'table', icon: Table2, label: 'Table' },
  ];
  return (
    <div className="inline-flex items-center bg-white rounded-lg border border-gray-200 p-0.5">
      {views.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => onViewChange(mode)}
          title={label}
          className={`p-1.5 rounded-md transition-all ${
            currentView === mode
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
};

// ── Compact 2-Row List Card ────────────────────────────────────────────────────
const DemandListCard: React.FC<{
  tile: DccTile;
  onPay: (tile: DccTile) => void;
  onViewDetails: (tile: DccTile) => void;
  onDownload: (tile: DccTile) => void;
  onChat: (tile: DccTile) => void;
  isChatActive: boolean;
}> = ({ tile, onPay, onViewDetails, onDownload, onChat, isChatActive }) => {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const st = STATUS[tile.status];
  const canPay = tile.status === 'DUE' || tile.status === 'OVERDUE';

  const openMenu = useCallback(() => {
    if (!menuBtnRef.current) return;
    const rect = menuBtnRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, left: Math.max(8, rect.right - 180) });
    setMenuOpen(true);
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md relative flex flex-col">
      <div className={`h-1 ${st.dot} shrink-0`} />

      {/* Row 1: Title + badges + amount */}
      <div className="px-4 pt-2.5 pb-1.5 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${st.bg} ${st.text}`}>
              {st.label}
            </span>
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
              {tile.demand_type_label}
            </span>
          </div>
          <h3 className="text-sm font-bold text-gray-900 truncate leading-snug">{tile.object_description || tile.object_ref}</h3>
          <p className="text-xs text-gray-500 truncate">{tile.object_ref} · {tile.object_type}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-extrabold text-gray-900 leading-tight">{fmtINR(tile.amount_due)}</div>
          <div className="text-[10px] text-gray-400">of {fmtINR(tile.total_amount)}</div>
        </div>
      </div>

      {/* Row 2: Owner + key dates + action icons */}
      <div className="px-4 pb-2 flex items-center gap-x-3 gap-y-1 text-xs text-gray-600">
        <span className="flex items-center gap-1 min-w-0">
          <Users size={11} className="text-gray-400 shrink-0" />
          <span className="truncate font-medium">{tile.owner_name}</span>
        </span>
        <span className="flex items-center gap-1 shrink-0">
          <Calendar size={11} className="text-gray-400" />
          <span className={tile.status === 'OVERDUE' ? 'text-red-600 font-semibold' : ''}>Due {fmtDate(tile.due_date)}</span>
        </span>
        {tile.overdue_amount > 0 && (
          <span className="flex items-center gap-1 shrink-0 text-red-600 font-semibold">
            <AlertTriangle size={11} /> {fmtINR(tile.overdue_amount)}
          </span>
        )}
        {tile.amount_paid > 0 && (
          <span className="flex items-center gap-1 shrink-0 text-emerald-600">
            <CheckCircle2 size={11} /> {fmtINR(tile.amount_paid)} paid
          </span>
        )}

        <div className="ml-auto flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onChat(tile); }}
            title="Chat"
            className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${isChatActive ? 'bg-teal-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <MessageSquare size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
            title={expanded ? 'Show Less' : 'Show More'}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <button
            ref={menuBtnRef}
            onClick={(e) => { e.stopPropagation(); menuOpen ? closeMenu() : openMenu(); }}
            title="Actions"
            className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <MoreVertical size={13} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-2.5 text-xs text-gray-600 space-y-1.5 border-t border-gray-100 pt-2 bg-gray-50/40">
          <div className="flex items-center gap-1.5">
            <Phone size={11} className="text-gray-400 shrink-0" />
            <span>{tile.owner_contact || '—'}</span>
          </div>
          <div className="flex items-start gap-1.5">
            <MapPin size={11} className="text-gray-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{tile.owner_address || '—'}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span><span className="text-gray-400">Run:</span> {fmtDate(tile.demand_run_date)}</span>
            {tile.region && <span><span className="text-gray-400">Region:</span> {tile.region}</span>}
            {tile.group_name && <span><span className="text-gray-400">Group:</span> {tile.group_name}</span>}
            {tile.subgroup && <span><span className="text-gray-400">Subgroup:</span> {tile.subgroup}</span>}
          </div>
          {tile.avg_overdue_days > 0 && (
            <div><span className="text-gray-400">Avg Overdue:</span> {tile.avg_overdue_days}d</div>
          )}
          {tile.last_paid_date && (
            <div><span className="text-gray-400">Last Paid:</span> {fmtINR(tile.last_paid_amount ?? 0)} on {fmtDate(tile.last_paid_date)}</div>
          )}
        </div>
      )}

      {menuOpen && menuPos && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={closeMenu} />
          <div
            className="fixed z-50 bg-white rounded-xl border border-gray-200 shadow-lg py-1 min-w-[180px]"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); closeMenu(); onViewDetails(tile); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Eye size={13} className="text-gray-400" /> View Details
            </button>
            {canPay && (
              <button
                onClick={(e) => { e.stopPropagation(); closeMenu(); onPay(tile); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-teal-700 hover:bg-teal-50 transition-colors"
              >
                <Wallet size={13} className="text-teal-500" /> Pay Now
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); closeMenu(); onDownload(tile); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download size={13} className="text-gray-400" /> Download Statement
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); closeMenu(); onChat(tile); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <MessageSquare size={13} className="text-gray-400" /> Open Chat
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

// ── DCC Chat Panel (split-screen right side) ───────────────────────────────────
const DccChatPanel: React.FC<{
  tile: DccTile;
  messages: DccDemandChat[];
  chatMsg: string;
  isSending: boolean;
  deliveryModes: DeliveryModes;
  onDeliveryModesChange: (m: DeliveryModes) => void;
  onChange: (v: string) => void;
  onSend: () => void;
}> = ({ tile, messages, chatMsg, isSending, deliveryModes, onDeliveryModesChange, onChange, onSend }) => {
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const st = STATUS[tile.status];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [tile.id]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (chatMsg.trim() && !isSending) onSend();
    }
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${st.bg} ${st.border} border`}>
            <Receipt size={14} className={st.text} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 leading-tight truncate max-w-[200px]">
              {tile.object_description || tile.object_ref}
            </p>
            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                {st.label}
              </span>
              <span className="text-[9px] font-semibold text-gray-500 truncate">{tile.owner_name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0 bg-gray-50/30">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
            <div className="w-12 h-12 rounded-full bg-teal-50 border-2 border-dashed border-teal-200 flex items-center justify-center">
              <MessageSquare size={20} className="text-teal-300" />
            </div>
            <p className="text-sm text-gray-400 font-medium">No messages yet</p>
            <p className="text-xs text-gray-300 text-center max-w-[200px]">
              Start a conversation about this demand
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isMine = msg.sender_role === 'manager';
              const prevMsg = messages[i - 1];
              const showDateSep = i === 0 || formatDate(msg.created_at) !== formatDate(prevMsg.created_at);
              return (
                <React.Fragment key={msg.id}>
                  {showDateSep && (
                    <div className="flex items-center gap-2 my-2">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">
                        {formatDate(msg.created_at)}
                      </span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                  )}
                  <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[82%] space-y-0.5">
                      {!isMine && (
                        <p className="text-[9px] font-semibold text-gray-400 px-1">Owner</p>
                      )}
                      <div className={`text-[12px] px-3 py-2 rounded-2xl leading-relaxed ${
                        isMine
                          ? 'bg-teal-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-800 rounded-bl-sm border border-gray-200'
                      }`}>
                        {msg.message}
                      </div>
                      <p className={`text-[9px] px-1 ${isMine ? 'text-right text-gray-400' : 'text-gray-400'}`}>
                        {formatTime(msg.created_at)}
                        {msg.delivery_mode && <span className="ml-1.5 text-gray-300">· {msg.delivery_mode}</span>}
                      </p>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={endRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-3">
        <div className="mb-2">
          <ChatDeliveryModePicker value={deliveryModes} onChange={onDeliveryModesChange} />
        </div>
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            rows={2}
            placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
            value={chatMsg}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 bg-gray-50 transition-colors placeholder-gray-400"
          />
          <button
            onClick={onSend}
            disabled={isSending || !chatMsg.trim()}
            className="flex items-center justify-center w-8 h-8 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors shrink-0 mb-0.5"
            title="Send"
          >
            {isSending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Tile Component ─────────────────────────────────────────────────────────────
const DemandTile: React.FC<{
  tile: DccTile;
  onPay: (tile: DccTile) => void;
  onViewDetails: (tile: DccTile) => void;
  onDownload: (tile: DccTile) => void;
}> = ({ tile, onPay, onViewDetails, onDownload }) => {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const st = STATUS[tile.status];
  const canPay = tile.status === 'DUE' || tile.status === 'OVERDUE';

  return (
    <div className={`bg-white rounded-2xl border ${st.border} shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md relative`}>
      {/* Status strip */}
      <div className={`h-1 ${st.dot}`} />

      {/* Row 1: Title + badges + amount */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${st.bg} ${st.text}`}>
                {st.label}
              </span>
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                {tile.demand_type_label}
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-900 truncate">{tile.object_description || tile.object_ref}</h3>
            <p className="text-xs text-gray-500 truncate">{tile.object_ref} · {tile.object_type}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-lg font-extrabold text-gray-900 leading-tight">{fmtINR(tile.amount_due)}</div>
            <div className="text-[10px] text-gray-400">of {fmtINR(tile.total_amount)}</div>
          </div>
        </div>
      </div>

      {/* Row 2: Owner + key dates */}
      <div className="px-4 pb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
        <span className="flex items-center gap-1 min-w-0">
          <Users size={11} className="text-gray-400 shrink-0" />
          <span className="truncate font-medium">{tile.owner_name}</span>
        </span>
        <span className="flex items-center gap-1 shrink-0">
          <Calendar size={11} className="text-gray-400" />
          <span className={tile.status === 'OVERDUE' ? 'text-red-600 font-semibold' : ''}>Due {fmtDate(tile.due_date)}</span>
        </span>
        {tile.overdue_amount > 0 && (
          <span className="flex items-center gap-1 shrink-0 text-red-600 font-semibold">
            <AlertTriangle size={11} /> {fmtINR(tile.overdue_amount)}
          </span>
        )}
        {tile.amount_paid > 0 && (
          <span className="flex items-center gap-1 shrink-0 text-emerald-600">
            <CheckCircle2 size={11} /> {fmtINR(tile.amount_paid)} paid
          </span>
        )}
      </div>

      {/* Expandable secondary info */}
      {expanded && (
        <div className="px-4 pb-2 text-xs text-gray-600 space-y-1 border-t border-gray-100 pt-2">
          <div className="flex items-center gap-1"><Phone size={11} className="text-gray-400" />{tile.owner_contact || '—'}</div>
          <div className="flex items-center gap-1"><MapPin size={11} className="text-gray-400" />{tile.owner_address || '—'}</div>
          <div className="flex gap-3">
            <span><span className="text-gray-400">Run:</span> {fmtDate(tile.demand_run_date)}</span>
            {tile.region && <span><span className="text-gray-400">Region:</span> {tile.region}</span>}
            {tile.group_name && <span><span className="text-gray-400">Group:</span> {tile.group_name}</span>}
          </div>
          {tile.avg_overdue_days > 0 && <div><span className="text-gray-400">Avg Overdue:</span> {tile.avg_overdue_days}d</div>}
        </div>
      )}

      {/* Action bar — icon-only buttons */}
      <div className="flex items-center gap-1 px-4 py-2 border-t border-gray-100 bg-gray-50/50">
        {canPay && (
          <button
            onClick={() => onPay(tile)}
            title="Pay Now"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors"
          >
            <Wallet size={14} />
          </button>
        )}
        <button
          onClick={() => onViewDetails(tile)}
          title="View Details"
          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Eye size={14} />
        </button>
        <button
          onClick={() => onDownload(tile)}
          title="Download Statement"
          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Download size={14} />
        </button>
        <button
          onClick={() => setExpanded(v => !v)}
          title={expanded ? 'Show Less' : 'Show More'}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {/* Kebab menu */}
        <div className="relative ml-auto">
          <button
            onClick={() => setMenuOpen(v => !v)}
            title="More Actions"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <MoreVertical size={14} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl border border-gray-200 shadow-lg py-1 min-w-[160px]">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onViewDetails(tile); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Eye size={13} /> View Details
                </button>
                {canPay && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onPay(tile); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-teal-700 hover:bg-teal-50 transition-colors"
                  >
                    <Wallet size={13} /> Pay Now
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDownload(tile); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Download size={13} /> Download Statement
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Table View ──────────────────────────────────────────────────────────────────
const DemandTable: React.FC<{
  tiles: DccTile[];
  onRowClick: (tile: DccTile) => void;
  onPay: (tile: DccTile) => void;
  onDownload: (tile: DccTile) => void;
}> = ({ tiles, onRowClick, onPay, onDownload }) => {
  const columns: Column<DccTile>[] = [
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: '90px',
      render: (t) => {
        const st = STATUS[t.status];
        return (
          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${st.bg} ${st.text}`}>
            {st.label}
          </span>
        );
      },
    },
    {
      key: 'object_description',
      label: 'Object',
      sortable: true,
      render: (t) => (
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 truncate">{t.object_description || t.object_ref}</div>
          <div className="text-xs text-gray-400 truncate">{t.object_ref} · {t.object_type}</div>
        </div>
      ),
    },
    {
      key: 'owner_name',
      label: 'Owner',
      sortable: true,
      render: (t) => (
        <div className="min-w-0">
          <div className="font-medium text-gray-700 truncate">{t.owner_name}</div>
          <div className="text-xs text-gray-400 truncate">{t.owner_contact || '—'}</div>
        </div>
      ),
    },
    {
      key: 'demand_type_label',
      label: 'Type',
      sortable: true,
      render: (t) => (
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          {t.demand_type_label}
        </span>
      ),
    },
    {
      key: 'demand_run_date',
      label: 'Run Date',
      sortable: true,
      render: (t) => <span className="text-xs text-gray-600">{fmtDate(t.demand_run_date)}</span>,
    },
    {
      key: 'due_date',
      label: 'Due Date',
      sortable: true,
      render: (t) => (
        <span className={`text-xs font-medium ${t.status === 'OVERDUE' ? 'text-red-600' : 'text-gray-600'}`}>
          {fmtDate(t.due_date)}
        </span>
      ),
    },
    {
      key: 'total_amount',
      label: 'Total',
      sortable: true,
      render: (t) => <span className="text-xs font-semibold text-gray-700">{fmtINR(t.total_amount)}</span>,
    },
    {
      key: 'amount_paid',
      label: 'Paid',
      sortable: true,
      render: (t) => <span className="text-xs font-semibold text-emerald-600">{fmtINR(t.amount_paid)}</span>,
    },
    {
      key: 'amount_due',
      label: 'Due Amt',
      sortable: true,
      render: (t) => <span className="text-xs font-bold text-gray-900">{fmtINR(t.amount_due)}</span>,
    },
    {
      key: 'overdue_amount',
      label: 'Overdue',
      sortable: true,
      render: (t) => (
        <span className={`text-xs font-semibold ${t.overdue_amount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
          {t.overdue_amount > 0 ? fmtINR(t.overdue_amount) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: (t) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); onRowClick(t); }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Eye size={12} />
          </button>
          {(t.status === 'DUE' || t.status === 'OVERDUE') && (
            <button
              onClick={(e) => { e.stopPropagation(); onPay(t); }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
            >
              <Wallet size={12} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDownload(t); }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Download size={12} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={tiles}
      keyExtractor={(t) => t.id}
      onRowClick={onRowClick}
      emptyMessage="No demands found"
    />
  );
};

// ── Sub-DP Carousel ────────────────────────────────────────────────────────────
const SubDpCarousel: React.FC<{
  breakdown: Record<string, { count: number; amount: number }>;
  dpAmt: number;
  subDpFilter: string | null;
  setSubDpFilter: (v: string | null) => void;
  subDpIcon: (type: string) => typeof Receipt;
  subDpColor: (type: string) => { bg: string; text: string; bar: string; ring: string; border: string; gradient: string };
}> = ({ breakdown, dpAmt, subDpFilter, setSubDpFilter, subDpIcon, subDpColor }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const scrollBy = (dir: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 220, behavior: 'smooth' });
  };

  const entries = Object.entries(breakdown);

  return (
    <div className="px-5 pb-2 shrink-0">
      <div className="flex items-center gap-2">
        {/* Left arrow */}
        <button
          onClick={() => scrollBy(-1)}
          className={`p-1.5 rounded-lg border border-gray-200 bg-white transition-all shrink-0 ${
            canLeft ? 'text-gray-600 hover:bg-gray-50 hover:shadow-sm' : 'text-gray-200 cursor-not-allowed'
          }`}
          disabled={!canLeft}
        >
          <ChevronLeft size={14} />
        </button>
        {/* Scrollable row */}
        <div
          ref={scrollRef}
          className="flex items-stretch gap-2.5 overflow-x-auto scroll-smooth snap-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {entries.map(([type, data]) => {
            const Icon = subDpIcon(type);
            const c = subDpColor(type);
            const pct = dpAmt > 0 ? Math.min(100, Math.round((data.amount / dpAmt) * 100)) : 0;
            const isSelected = subDpFilter === type;
            return (
              <button
                key={type}
                onClick={() => setSubDpFilter(isSelected ? null : type)}
                className={`group relative flex flex-col px-3.5 py-2.5 rounded-xl border-2 transition-all duration-300 overflow-hidden shrink-0 snap-start ${
                  isSelected
                    ? `${c.bg} ${c.border} ${c.ring} ring-2 shadow-md`
                    : `bg-white ${c.border} hover:shadow-md hover:-translate-y-0.5`
                }`}
                style={{ minWidth: '200px' }}
              >
                {/* Accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${c.gradient} transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-50 group-hover:opacity-90'}`} />
                {/* Row 1: Icon + Type label + Txn count */}
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br ${c.gradient} shadow-sm shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                      <Icon size={13} className="text-white" />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wide truncate ${isSelected ? c.text : 'text-gray-600'}`}>{type}</span>
                  </div>
                  <span className="text-[9px] text-gray-400 font-medium tabular-nums shrink-0">{data.count} txn{data.count !== 1 ? 's' : ''}</span>
                </div>
                {/* Row 2: Amount + Progress bar + pct */}
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={`text-sm font-extrabold tabular-nums leading-tight shrink-0 ${isSelected ? c.text : 'text-gray-800'}`}>{fmtINR(data.amount)}</span>
                  <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full ${c.bar} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`text-[9px] font-bold tabular-nums shrink-0 ${isSelected ? c.text : 'text-gray-400'}`}>{pct}%</span>
                </div>
              </button>
            );
          })}
        </div>
        {/* Right arrow */}
        <button
          onClick={() => scrollBy(1)}
          className={`p-1.5 rounded-lg border border-gray-200 bg-white transition-all shrink-0 ${
            canRight ? 'text-gray-600 hover:bg-gray-50 hover:shadow-sm' : 'text-gray-200 cursor-not-allowed'
          }`}
          disabled={!canRight}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────────
type DccMainTab = 'dashboard' | 'reconciliation' | 'reports';

export const DCCPage: React.FC = () => {
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState<DccMainTab>('dashboard');
  const [tiles, setTiles] = useState<DccTile[]>([]);
  const [summary, setSummary] = useState<DccTrackerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dpFilter, setDpFilter] = useState<DpKey>('ALL');
  const [subDpFilter, setSubDpFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useViewPreference('dccView', 'card');

  // Chat state
  const [chatTileId, setChatTileId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<DccDemandChat[]>([]);
  const [chatMsg, setChatMsg] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatDeliveryModes, setChatDeliveryModes] = useState<DeliveryModes>(['IN_APP']);

  // Filter state
  const [filters, setFilters] = useState<DccDemandFilters>({});
  const [demandTypes, setDemandTypes] = useState<DccDemandType[]>([]);
  const [owners, setOwners] = useState<DccObjectOwner[]>([]);
  const [objects, setObjects] = useState<DccObject[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, s, dt, ow, obj] = await Promise.all([
        dccService.getTiles(filters),
        dccService.getTrackerSummary(filters),
        dccService.listDemandTypes(),
        dccService.listObjectOwners(),
        dccService.listObjects(),
      ]);
      setTiles(t);
      setSummary(s);
      setDemandTypes(dt);
      setOwners(ow);
      setObjects(obj);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load demands');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  // Sub-DP breakdown by transaction type
  const subDpBreakdown = useMemo(() => {
    const map: Record<string, { count: number; amount: number }> = {};
    for (const t of tiles) {
      const key = t.demand_type_label || t.demand_type_code;
      if (!map[key]) map[key] = { count: 0, amount: 0 };
      map[key].count++;
      if (dpFilter === 'PAID') map[key].amount += t.amount_paid;
      else if (dpFilter === 'DUE') map[key].amount += t.status === 'DUE' ? t.amount_due : 0;
      else if (dpFilter === 'OVERDUE') map[key].amount += t.overdue_amount;
      else map[key].amount += t.total_amount;
    }
    return map;
  }, [tiles, dpFilter]);

  const filteredTiles = useMemo(() => {
    let result = tiles;
    if (dpFilter === 'PAID') result = result.filter(t => t.status === 'PAID');
    else if (dpFilter === 'DUE') result = result.filter(t => t.status === 'DUE');
    else if (dpFilter === 'OVERDUE') result = result.filter(t => t.status === 'OVERDUE');

    if (subDpFilter) {
      result = result.filter(t => (t.demand_type_label || t.demand_type_code) === subDpFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.object_ref.toLowerCase().includes(q) ||
        t.object_description.toLowerCase().includes(q) ||
        t.owner_name.toLowerCase().includes(q) ||
        t.demand_type_label.toLowerCase().includes(q)
      );
    }
    return result;
  }, [tiles, dpFilter, subDpFilter, search]);

  const handlePay = (tile: DccTile) => {
    navigate(`/dcc/demand/${tile.id}`);
  };

  const handleViewDetails = (tile: DccTile) => {
    navigate(`/dcc/demand/${tile.id}`);
  };

  const handleDownload = (tile: DccTile) => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Demand Statement — ${tile.object_ref}</title>
    <style>body{font-family:sans-serif;font-size:13px;color:#1f2937;margin:32px}h2{margin:0 0 4px}p{margin:2px 0;color:#6b7280;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#0f766e;color:#fff;padding:8px 10px;text-align:left}td{padding:7px 10px;border-bottom:1px solid #f3f4f6}.footer{margin-top:12px;text-align:right;font-weight:700;font-size:14px;color:#b45309}</style></head>
    <body><h2>Demand Statement — ${tile.object_ref}</h2>
    <p>Owner: ${tile.owner_name} · ${tile.owner_contact}</p>
    <p>Type: ${tile.demand_type_label} · Run Date: ${fmtDate(tile.demand_run_date)}</p>
    <table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>
    <tr><td>Total Amount</td><td>${fmtINR(tile.total_amount)}</td></tr>
    <tr><td>Amount Paid</td><td>${fmtINR(tile.amount_paid)}</td></tr>
    <tr><td>Amount Due</td><td>${fmtINR(tile.amount_due)}</td></tr>
    <tr><td>Due Date</td><td>${fmtDate(tile.due_date)}</td></tr>
    <tr><td>Overdue Amount</td><td>${fmtINR(tile.overdue_amount)}</td></tr>
    <tr><td>Last Paid</td><td>${tile.last_paid_date ? fmtINR(tile.last_paid_amount ?? 0) + ' on ' + fmtDate(tile.last_paid_date) : '—'}</td></tr>
    </tbody></table>
    <div class="footer">Total Outstanding: ${fmtINR(tile.amount_due)}</div>
    </body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Demand_${tile.object_ref}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // ── Chat handlers ────────────────────────────────────────────────────────────
  const chatTile = useMemo(() => tiles.find(t => t.id === chatTileId) ?? null, [tiles, chatTileId]);

  const handleOpenChat = useCallback((tile: DccTile) => {
    setChatTileId(tile.id);
    setChatMsg('');
  }, []);

  const handleCloseChat = useCallback(() => {
    setChatTileId(null);
    setChatMessages([]);
    setChatMsg('');
  }, []);

  useEffect(() => {
    if (!chatTileId) { setChatMessages([]); return; }
    let cancelled = false;
    (async () => {
      try {
        const msgs = await dccService.listChatMessages(chatTileId);
        if (!cancelled) setChatMessages(msgs);
      } catch { if (!cancelled) setChatMessages([]); }
    })();
    return () => { cancelled = true; };
  }, [chatTileId]);

  const handleSendChat = useCallback(async () => {
    if (!chatTileId || !chatMsg.trim()) return;
    setChatSending(true);
    try {
      const newMsg = await dccService.sendChatMessage(
        chatTileId, 'manager', chatMsg.trim(),
        chatDeliveryModes.length > 0 ? chatDeliveryModes.join(',') : null,
      );
      setChatMessages(prev => [...prev, newMsg]);
      setChatMsg('');
    } catch { /* ignore */ } finally {
      setChatSending(false);
    }
  }, [chatTileId, chatMsg, chatDeliveryModes]);

  const mainTabs: { key: DccMainTab; label: string; icon: typeof Receipt }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: Receipt },
    { key: 'reconciliation', label: 'Reconciliation', icon: TrendingUp },
    { key: 'reports', label: 'Reports', icon: FileText },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Page header */}
      <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shrink-0">
          <IndianRupee size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900">Demand and Collection Center</h1>
          <p className="text-xs text-gray-500">Track all demands and collections across any object type</p>
        </div>
        {/* Tab bar */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {mainTabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setMainTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  mainTab === t.key
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={13} /> {t.label}
              </button>
            );
          })}
        </div>
        {mainTab === 'dashboard' && (
          <>
            <button
              onClick={() => navigate(ROUTES.DCC_RULE_SETUP)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 text-teal-700 text-xs font-semibold hover:bg-teal-100 transition-colors"
            >
              <Sliders size={14} /> Rule Setup
            </button>
            <button
              onClick={() => navigate(ROUTES.DCC_GENERATE)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors shadow-sm"
            >
              <Plus size={14} /> Generate
            </button>
          </>
        )}
      </div>

      {/* Reconciliation Tab */}
      {mainTab === 'reconciliation' && <DCCReconciliationTab />}

      {/* Reports Tab */}
      {mainTab === 'reports' && <DCCReportsTab />}

      {/* Dashboard Tab */}
      {mainTab === 'dashboard' && (() => {
        const dashboardContent = (
      <div className="h-full flex flex-col bg-gray-50">
      {/* DPs — redesigned with gradient, animations, collection rate integrated */}
      <div className="px-5 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        {DPS.map(dp => {
          const Icon = dp.icon;
          const value =
            dp.key === 'ALL' ? tiles.length :
            dp.key === 'PAID' ? summary?.paid_count ?? 0 :
            dp.key === 'DUE' ? summary?.due_count ?? 0 :
            summary?.overdue_count ?? 0;
          const amount =
            dp.key === 'ALL' ? tiles.reduce((s, t) => s + t.total_amount, 0) :
            dp.key === 'PAID' ? summary?.total_paid ?? 0 :
            dp.key === 'DUE' ? summary?.total_due ?? 0 :
            summary?.total_overdue ?? 0;
          const isSelected = dpFilter === dp.key;
          // Collection rate per card
          const totalForRate =
            dp.key === 'ALL' ? (summary?.total_paid ?? 0) + (summary?.total_due ?? 0) :
            dp.key === 'PAID' ? (summary?.total_paid ?? 0) + (summary?.total_due ?? 0) :
            (summary?.total_paid ?? 0) + (summary?.total_due ?? 0);
          const ratePct = totalForRate > 0
            ? Math.round(((dp.key === 'ALL' || dp.key === 'PAID' ? summary?.total_paid ?? 0 : amount) / totalForRate) * 100)
            : 0;
          const displayRate = dp.key === 'OVERDUE' ? 100 - ratePct : ratePct;
          return (
            <button
              key={dp.key}
              onClick={() => { setDpFilter(prev => prev === dp.key ? 'ALL' : dp.key); setSubDpFilter(null); }}
              className={`group relative text-left rounded-2xl border-2 p-4 transition-all duration-300 overflow-hidden ${
                isSelected
                  ? `${dp.bg} border-current ${dp.ring} ring-2 shadow-lg`
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              {/* Accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${dp.gradient} transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-40 group-hover:opacity-80'}`} />
              {/* Row 1: Icon + Label + Txn count */}
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${dp.gradient} shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                    <Icon size={15} className="text-white" />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${dp.color}`}>{dp.label}</span>
                </div>
                <span className="text-[10px] text-gray-400 font-medium tabular-nums shrink-0">{value} txn{value !== 1 ? 's' : ''}</span>
              </div>
              {/* Row 2: Amount + Progress bar */}
              <div className="mt-2 flex items-center gap-2">
                <div className={`text-lg font-extrabold ${dp.color} transition-transform duration-300 group-hover:scale-105 origin-left leading-tight shrink-0`}>{fmtINR(amount)}</div>
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full ${dp.bar} rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${displayRate}%` }}
                  />
                </div>
                <span className="text-[9px] font-bold tabular-nums text-gray-400 shrink-0">{displayRate}%</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Sub-DP — single-row carousel with navigation arrows */}
      {dpFilter !== 'ALL' && Object.keys(subDpBreakdown).length > 0 && (() => {
        const dpAmt =
          dpFilter === 'PAID' ? summary?.total_paid ?? 0 :
          dpFilter === 'DUE' ? summary?.total_due ?? 0 :
          summary?.total_overdue ?? 0;
        const subDpIcon = (type: string): typeof Receipt => {
          const tl = type.toLowerCase();
          if (tl.includes('rent')) return Building2;
          if (tl.includes('tax')) return Receipt;
          if (tl.includes('fee')) return FileText;
          if (tl.includes('charge')) return IndianRupee;
          return Receipt;
        };
        const subDpColor = (type: string): { bg: string; text: string; bar: string; ring: string; border: string; gradient: string } => {
          const tl = type.toLowerCase();
          if (tl.includes('rent')) return { bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-500', ring: 'ring-blue-400', border: 'border-blue-300', gradient: 'from-blue-500 to-blue-600' };
          if (tl.includes('tax')) return { bg: 'bg-rose-50', text: 'text-rose-700', bar: 'bg-rose-500', ring: 'ring-rose-400', border: 'border-rose-300', gradient: 'from-rose-500 to-rose-600' };
          if (tl.includes('fee')) return { bg: 'bg-amber-50', text: 'text-amber-700', bar: 'bg-amber-500', ring: 'ring-amber-400', border: 'border-amber-300', gradient: 'from-amber-500 to-amber-600' };
          if (tl.includes('charge')) return { bg: 'bg-teal-50', text: 'text-teal-700', bar: 'bg-teal-500', ring: 'ring-teal-400', border: 'border-teal-300', gradient: 'from-teal-500 to-teal-600' };
          return { bg: 'bg-slate-50', text: 'text-slate-700', bar: 'bg-slate-500', ring: 'ring-slate-400', border: 'border-slate-300', gradient: 'from-slate-500 to-slate-600' };
        };
        return (
          <SubDpCarousel
            breakdown={subDpBreakdown}
            dpAmt={dpAmt}
            subDpFilter={subDpFilter}
            setSubDpFilter={setSubDpFilter}
            subDpIcon={subDpIcon}
            subDpColor={subDpColor}
          />
        );
      })()}

      {/* Controls row — icon-only view toggle + icon-only filters */}
      <div className="px-5 pb-2 shrink-0 flex items-center justify-between gap-3">
        <IconViewToggle currentView={viewMode} onViewChange={setViewMode} />
        <button
          onClick={() => setShowFilters(true)}
          title="Filters"
          className="relative p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
        >
          <SlidersHorizontal size={15} />
          {Object.values(filters).some(v => v !== null && v !== undefined && v !== '') && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-teal-500 border-2 border-white" />
          )}
        </button>
      </div>

      {/* Tiles grid / table / list */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="w-6 h-6 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-red-500">
            <AlertTriangle size={28} className="mb-2" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        ) : filteredTiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
            <div className="text-sm font-medium text-gray-600">No demands found</div>
            <div className="text-xs mt-1">Try adjusting your filters or search.</div>
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredTiles.map(tile => (
              <DemandTile
                key={tile.id}
                tile={tile}
                onPay={handlePay}
                onViewDetails={handleViewDetails}
                onDownload={handleDownload}
              />
            ))}
          </div>
        ) : viewMode === 'table' ? (
          <DemandTable
            tiles={filteredTiles}
            onRowClick={handleViewDetails}
            onPay={handlePay}
            onDownload={handleDownload}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {filteredTiles.map(tile => (
              <DemandListCard
                key={tile.id}
                tile={tile}
                onPay={handlePay}
                onViewDetails={handleViewDetails}
                onDownload={handleDownload}
                onChat={handleOpenChat}
                isChatActive={chatTileId === tile.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onClearAll={() => { setFilters({}); }}
        activeFilterCount={Object.values(filters).filter(v => v !== null && v !== undefined && v !== '').length}
      >
        <div className="space-y-4">
          {/* Demand Type */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Demand Type</label>
            <select
              value={filters.demand_type_code ?? ''}
              onChange={e => setFilters(f => ({ ...f, demand_type_code: e.target.value || null }))}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white"
            >
              <option value="">All Types</option>
              {demandTypes.map(dt => <option key={dt.id} value={dt.code}>{dt.label}</option>)}
            </select>
          </div>
          {/* Object Owner */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Object Owner</label>
            <select
              value={filters.owner_id ?? ''}
              onChange={e => setFilters(f => ({ ...f, owner_id: e.target.value || null }))}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white"
            >
              <option value="">All Owners</option>
              {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          {/* Object */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Object</label>
            <select
              value={filters.object_id ?? ''}
              onChange={e => setFilters(f => ({ ...f, object_id: e.target.value || null }))}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white"
            >
              <option value="">All Objects</option>
              {objects.map(o => <option key={o.id} value={o.id}>{o.object_ref} — {o.description}</option>)}
            </select>
          </div>
          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
            <select
              value={filters.status ?? ''}
              onChange={e => setFilters(f => ({ ...f, status: (e.target.value || null) as DccDemandFilters['status'] }))}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="DUE">Due</option>
              <option value="OVERDUE">Overdue</option>
              <option value="PAID">Paid</option>
              <option value="EXEMPTED">Exempted</option>
            </select>
          </div>
          {/* Run date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Run Date From</label>
              <input type="date" value={filters.run_date_from ?? ''} onChange={e => setFilters(f => ({ ...f, run_date_from: e.target.value || null }))} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Run Date To</label>
              <input type="date" value={filters.run_date_to ?? ''} onChange={e => setFilters(f => ({ ...f, run_date_to: e.target.value || null }))} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white" />
            </div>
          </div>
          {/* Region / Group / Subgroup */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Region</label>
            <input value={filters.region ?? ''} onChange={e => setFilters(f => ({ ...f, region: e.target.value || null }))} placeholder="Region" className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Group</label>
              <input value={filters.group_name ?? ''} onChange={e => setFilters(f => ({ ...f, group_name: e.target.value || null }))} placeholder="Group" className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Subgroup</label>
              <input value={filters.subgroup ?? ''} onChange={e => setFilters(f => ({ ...f, subgroup: e.target.value || null }))} placeholder="Subgroup" className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white" />
            </div>
          </div>
        </div>
      </FilterDrawer>
      </div>
    );
        return chatTile && chatTileId ? (
          <SplitLayout
            storageKey="dcc-chat-split"
            defaultSplit={62}
            onClose={handleCloseChat}
            right={
              <DccChatPanel
                tile={chatTile}
                messages={chatMessages}
                chatMsg={chatMsg}
                isSending={chatSending}
                deliveryModes={chatDeliveryModes}
                onDeliveryModesChange={setChatDeliveryModes}
                onChange={setChatMsg}
                onSend={handleSendChat}
              />
            }
            rightHeader={
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare size={13} className="text-teal-600 shrink-0" />
                <span className="text-xs font-bold text-gray-900 truncate">
                  {chatTile.object_description || chatTile.object_ref}
                </span>
              </div>
            }
            left={dashboardContent}
          />
        ) : dashboardContent;
      })()}
    </div>
  );
};

export default DCCPage;
