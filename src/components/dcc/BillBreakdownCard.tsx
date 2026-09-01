import React from 'react';
import { FileText, X } from 'lucide-react';
import { fmtINR } from '../../constants/dccTheme';
import type { ComputedBill, DemandComponentConfig } from '../../constants/demandComponents';

interface BillBreakdownCardProps {
  bill: ComputedBill;
  config: DemandComponentConfig;
  objectRef: string;
  objectDescription: string;
  objectType: string;
  demandRunDate: string;
  dueDate: string;
  fmtDateShort: (d: string | null) => string;
}

const LeaderDots: React.FC = () => (
  <span className="flex-1 mx-2 border-b border-dotted border-slate-300 translate-y-[-4px]" />
);

export const BillBreakdownCard: React.FC<BillBreakdownCardProps> = ({
  bill,
  config,
  objectRef,
  objectDescription,
  demandRunDate,
  dueDate,
  fmtDateShort,
}) => {
  const hasPenalty = bill.penalty > 0;
  const hasDiscount = bill.discount > 0;
  const hasPaid = bill.alreadyPaid > 0;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* ── Context Header ─────────────────────────────────────────── */}
      <div className="px-3 py-2.5 bg-slate-800 text-white">
        <div className="flex items-center gap-2 mb-1">
          <FileText size={13} className="text-slate-300" />
          <span className="text-xs font-bold">Bill Breakdown</span>
          <span className="ml-auto text-[10px] text-slate-400">
            Run: {fmtDateShort(demandRunDate)} · Due: {fmtDateShort(dueDate)}
          </span>
        </div>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {config.objectLabel}
          </span>
          <span className="text-xs font-semibold text-white truncate">
            {objectDescription || objectRef}
          </span>
          <span className="text-[10px] text-slate-500">· {objectRef}</span>
          <span className="ml-auto inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-700 text-slate-200">
            {config.transactionLabel}
          </span>
        </div>
      </div>

      {/* ── Dynamic Asset Line Items ──────────────────────────────── */}
      <div className="px-3 py-2.5 space-y-1">
        {bill.lineItems.map((li) => (
          <div key={li.key} className="flex items-baseline text-xs">
            <span className="text-slate-600 font-medium">{li.label}</span>
            <LeaderDots />
            <span className="font-mono font-bold text-slate-900 tabular-nums">{fmtINR(li.amount)}</span>
          </div>
        ))}

        {/* Subtotal */}
        <div className="flex items-baseline text-xs pt-1.5 border-t border-slate-100">
          <span className="text-slate-500 font-semibold">Subtotal</span>
          <LeaderDots />
          <span className="font-mono font-bold text-slate-700 tabular-nums">{fmtINR(bill.subtotal)}</span>
        </div>
      </div>

      {/* ── Adjustments & Penalties ────────────────────────────────── */}
      {(hasPenalty || hasDiscount || hasPaid) && (
        <div className="px-3 py-2.5 space-y-1 bg-slate-50/70 border-t border-slate-100">
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
            Adjustments & Penalties
          </div>

          {hasPenalty && (
            <div className="flex items-baseline text-xs">
              <span className="text-red-600 font-medium">
                Late Fee / Penalty <span className="text-red-400">(+)</span>
              </span>
              <LeaderDots />
              <span className="font-mono font-bold text-red-600 tabular-nums">{fmtINR(bill.penalty)}</span>
            </div>
          )}

          {hasDiscount && (
            <div className="flex items-baseline text-xs">
              <span className="text-emerald-600 font-medium">
                Early Payment Discount / Rebate <span className="text-emerald-400">(-)</span>
              </span>
              <LeaderDots />
              <span className="font-mono font-bold text-emerald-600 tabular-nums">-{fmtINR(bill.discount)}</span>
            </div>
          )}

          {hasPaid && (
            <div className="flex items-baseline text-xs">
              <span className="text-slate-600 font-medium">
                Less Already Paid <span className="text-slate-400">(-)</span>
              </span>
              <LeaderDots />
              <span className="font-mono font-bold text-slate-600 tabular-nums">-{fmtINR(bill.alreadyPaid)}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Total Net Amount Payable ───────────────────────────────── */}
      <div className="px-3 py-2.5 bg-slate-900">
        <div className="flex items-baseline">
          <span className="text-sm font-black text-white">Total Net Amount Payable</span>
          <span className="flex-1 mx-2 border-b border-dotted border-slate-600 translate-y-[-4px]" />
          <span className="text-lg font-black text-amber-400 font-mono tabular-nums">{fmtINR(bill.netPayable)}</span>
        </div>
        <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
          <span>Gross Demand: {fmtINR(bill.grossDemand)}</span>
          <span>Outstanding: {fmtINR(bill.netPayable)}</span>
        </div>
      </div>
    </div>
  );
};

export default BillBreakdownCard;
