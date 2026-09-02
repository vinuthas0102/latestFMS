import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, MessageSquare, Wallet, CalendarDays, ChevronUp, ChevronDown,
  Phone, Users, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import type { DccTile } from '../../types/dcc';
import {
  DCC_STATUS,
  fmtINR, fmtINRShort, fmtDateShort,
} from '../../constants/dccTheme';

export interface DemandListRecordProps {
  tile: DccTile;
  idx: number;
  onViewDetails: (tile: DccTile) => void;
  onPay?: (tile: DccTile) => void;
  onChat?: (tile: DccTile) => void;
  onShowDuePayment?: (tile: DccTile) => void;
  isChatActive?: boolean;
  canRecordPayment?: boolean;
}

export const DemandListRecord: React.FC<DemandListRecordProps> = ({
  tile, idx, onViewDetails, onPay, onChat, onShowDuePayment, isChatActive, canRecordPayment,
}) => {
  const [expanded, setExpanded] = useState(false);
  const st = DCC_STATUS[tile.status];
  const canPay = (tile.status === 'DUE' || tile.status === 'OVERDUE') && canRecordPayment;
  const canShowDue = tile.status === 'DUE' || tile.status === 'OVERDUE';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: Math.min(idx * 0.02, 0.1) }}
      className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden"
    >
      <div className="flex items-stretch gap-0">
        <div className={`w-1 shrink-0 ${st.dot}`} />

        <div className="flex-1 px-3 py-1.5">
          {/* ── Row 1: Identity + amount + key metrics inline ── */}
          <div className="flex items-center gap-2.5">
            {/* Status badge */}
            <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${st.bg} ${st.text} border ${st.border} shrink-0`}>
              {st.label}
            </span>

            {/* Title + ref */}
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-bold text-slate-900 truncate leading-tight">{tile.object_description || tile.object_ref}</h3>
              <p className="text-[9px] text-slate-400 truncate leading-tight">{tile.object_ref} · {tile.demand_type_label}</p>
            </div>

            {/* Inline metrics */}
            <div className="hidden md:flex items-center gap-3 shrink-0 text-[10px]">
              <div className="flex flex-col items-end leading-tight">
                <span className="text-[8px] font-bold uppercase text-slate-400">Run</span>
                <span className="text-slate-600 tabular-nums">{fmtDateShort(tile.demand_run_date)}</span>
              </div>
              <div className="flex flex-col items-end leading-tight">
                <span className="text-[8px] font-bold uppercase text-slate-400">Due</span>
                <span className={`tabular-nums ${tile.status === 'OVERDUE' ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>{fmtDateShort(tile.due_date)}</span>
              </div>
              <div className="flex flex-col items-end leading-tight">
                <span className="text-[8px] font-bold uppercase text-slate-400">Paid</span>
                <span className="text-emerald-600 tabular-nums">{tile.amount_paid > 0 ? fmtINRShort(tile.amount_paid) : '—'}</span>
              </div>
              {tile.overdue_amount > 0 && (
                <div className="flex flex-col items-end leading-tight">
                  <span className="text-[8px] font-bold uppercase text-slate-400">Penalty</span>
                  <span className="text-red-600 tabular-nums">{fmtINRShort(tile.overdue_amount)}</span>
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="text-right shrink-0">
              <div className="text-sm font-extrabold text-slate-900 tabular-nums leading-tight">{fmtINR(tile.amount_due)}</div>
              <div className="text-[8px] text-slate-400 leading-tight">of {fmtINRShort(tile.total_amount)}</div>
            </div>
          </div>

          {/* ── Row 2: Owner info + actions ── */}
          <div className="flex items-center gap-x-2.5 gap-y-0.5 flex-wrap mt-1 text-[10px] text-slate-600">
            <span className="flex items-center gap-0.5 min-w-0">
              <Users size={10} className="text-slate-400 shrink-0" />
              <span className="truncate font-medium max-w-[120px]">{tile.owner_name}</span>
            </span>
            <span className="flex items-center gap-0.5 shrink-0">
              <Phone size={10} className="text-slate-400" />
              <span className="truncate max-w-[100px]">{tile.owner_contact || '—'}</span>
            </span>
            {tile.overdue_amount > 0 && (
              <span className="flex items-center gap-0.5 shrink-0 text-red-600 font-semibold">
                <AlertTriangle size={10} /> {fmtINRShort(tile.overdue_amount)}
              </span>
            )}
            {tile.amount_paid > 0 && (
              <span className="flex items-center gap-0.5 shrink-0 text-emerald-600">
                <CheckCircle2 size={10} /> {fmtINRShort(tile.amount_paid)} pd
              </span>
            )}

            {/* Mobile-only compact metrics */}
            <div className="flex md:hidden items-center gap-2 text-[9px] text-slate-500 shrink-0">
              <span className="tabular-nums">Run: {fmtDateShort(tile.demand_run_date)}</span>
              <span className={`tabular-nums ${tile.status === 'OVERDUE' ? 'text-red-600' : ''}`}>Due: {fmtDateShort(tile.due_date)}</span>
            </div>

            <div className="ml-auto flex items-center gap-1 shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); onViewDetails(tile); }}
                title="View Details"
                className="flex items-center justify-center w-6 h-6 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-all"
              >
                <Eye size={12} />
              </button>
              {canPay && onPay && (
                <button
                  onClick={(e) => { e.stopPropagation(); onPay(tile); }}
                  title="Pay Now"
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                >
                  <Wallet size={10} /> Pay
                </button>
              )}
              {canShowDue && !canPay && onShowDuePayment && (
                <button
                  onClick={(e) => { e.stopPropagation(); onShowDuePayment(tile); }}
                  title="Due Payment"
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  <CalendarDays size={10} /> Due
                </button>
              )}
              {onChat && (
                <button
                  onClick={(e) => { e.stopPropagation(); onChat(tile); }}
                  title="Chat"
                  className={`flex items-center justify-center w-6 h-6 rounded-md transition-colors ${
                    isChatActive ? 'bg-slate-800 text-white' : 'text-slate-500 bg-white border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <MessageSquare size={11} />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
                title={expanded ? 'Show Less' : 'Show More'}
                className="flex items-center justify-center w-6 h-6 rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
              >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>
          </div>

          {/* Expanded section */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-1 border-t border-slate-100 pt-1.5 mt-1 bg-slate-50/40">
                  <div className="flex flex-col gap-0 min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400 leading-none mb-0.5">Txn Type</span>
                    <span className="text-[11px] font-semibold tabular-nums truncate leading-tight text-slate-500">{tile.demand_type_code}</span>
                  </div>
                  <div className="flex flex-col gap-0 min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400 leading-none mb-0.5">Last Paid</span>
                    <span className="text-[11px] font-semibold tabular-nums truncate leading-tight text-slate-900">{tile.last_paid_date ? fmtDateShort(tile.last_paid_date) : '—'}</span>
                  </div>
                  <div className="flex flex-col gap-0 min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400 leading-none mb-0.5">Last Amt</span>
                    <span className="text-[11px] font-semibold tabular-nums truncate leading-tight text-emerald-600">{tile.last_paid_amount && tile.last_paid_amount > 0 ? fmtINRShort(tile.last_paid_amount) : '—'}</span>
                  </div>
                  <div className="flex flex-col gap-0 min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400 leading-none mb-0.5">Avg OD Days</span>
                    <span className={`text-[11px] font-semibold tabular-nums truncate leading-tight ${tile.avg_overdue_days > 0 ? 'text-red-600' : 'text-slate-500'}`}>{tile.avg_overdue_days > 0 ? `${tile.avg_overdue_days}d` : '—'}</span>
                  </div>
                  <div className="flex flex-col gap-0 min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400 leading-none mb-0.5">Region</span>
                    <span className="text-[11px] font-semibold tabular-nums truncate leading-tight text-slate-500">{tile.region || '—'}</span>
                  </div>
                  <div className="flex flex-col gap-0 min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400 leading-none mb-0.5">Group</span>
                    <span className="text-[11px] font-semibold tabular-nums truncate leading-tight text-slate-500">{tile.group_name || '—'}</span>
                  </div>
                  <div className="flex flex-col gap-0 min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400 leading-none mb-0.5">Subgroup</span>
                    <span className="text-[11px] font-semibold tabular-nums truncate leading-tight text-slate-500">{tile.subgroup || '—'}</span>
                  </div>
                  <div className="flex flex-col gap-0 min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400 leading-none mb-0.5">Address</span>
                    <span className="text-[11px] font-semibold tabular-nums truncate leading-tight text-slate-500">{tile.owner_address || '—'}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default DemandListRecord;
