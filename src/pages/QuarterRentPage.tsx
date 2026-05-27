import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, ChevronRight, IndianRupee, ArrowLeft,
  Calendar, CheckCircle2, AlertTriangle, Clock,
  TrendingUp, Receipt, Building2, Download,
} from 'lucide-react';
import { ROUTES } from '../constants/routes';
import { quartersService } from '../services/quartersService';
import type { RentRecord, RentSummary, QuarterRequest } from '../services/quartersService';
import { useAuthStore } from '../stores/authStore';

function fmtINR(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function fmtMonth(m: string) {
  const [y, mo] = m.split('-');
  const date = new Date(Number(y), Number(mo) - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

type StatusCfg = { label: string; cls: string; icon: React.FC<{ size?: number; className?: string }> };
const STATUS_CONFIG: Record<RentRecord['status'], StatusCfg> = {
  PAID:    { label: 'Paid',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  PENDING: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200',       icon: Clock },
  OVERDUE: { label: 'Overdue', cls: 'bg-red-50 text-red-700 border-red-200',             icon: AlertTriangle },
};

type ActiveAllotment = {
  id: string;
  quarterNumber: string;
  bhkConfig: string;
  monthlyRent: number;
  possessionDate: string | null;
};

const OCCUPIED_STATUSES = [
  'OCCUPIED', 'EXTEND_REQUESTED', 'UPGRADE_REQUESTED', 'VACATE_REQUESTED',
  'GRIEVANCE_RAISED', 'MAINTENANCE_RAISED', 'EXCHANGE_REQUESTED',
];

export const QuarterRentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<RentSummary | null>(null);
  const [records, setRecords] = useState<RentRecord[]>([]);
  const [activeAllotment, setActiveAllotment] = useState<ActiveAllotment | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const requests: QuarterRequest[] = await quartersService.getMyRequests(user?.id ?? '');
        const occupied = requests.find(
          r => OCCUPIED_STATUSES.includes(r.request_status) && r.allotment?.possession_date
        );
        if (occupied?.allotment) {
          const a = occupied.allotment;
          setActiveAllotment({
            id: a.id,
            quarterNumber: a.quarter?.quarter_number ?? '—',
            bhkConfig: a.quarter?.bhk_config ?? '—',
            monthlyRent: a.quarter?.monthly_rent ?? 0,
            possessionDate: a.possession_date,
          });
          const { summary: s, records: r } = await quartersService.getRentData(a.id);
          setSummary(s);
          setRecords(r);
        }
      } catch {
        // silently fail — user sees empty state
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const summaryCards = summary
    ? [
        {
          label: 'Current Month Due',
          value: fmtINR(summary.current_month_due),
          sub: `Due by ${fmtDate(summary.next_due_date)}`,
          gradient: summary.outstanding_arrears > 0 ? 'from-amber-500 to-orange-500' : 'from-teal-600 to-emerald-600',
          icon: IndianRupee,
        },
        {
          label: 'Total Paid (YTD)',
          value: fmtINR(summary.total_paid_ytd),
          sub: `${summary.months_paid} month${summary.months_paid !== 1 ? 's' : ''} paid`,
          gradient: 'from-emerald-500 to-teal-500',
          icon: TrendingUp,
        },
        {
          label: 'Outstanding Arrears',
          value: fmtINR(summary.outstanding_arrears),
          sub: summary.outstanding_arrears > 0
            ? `${summary.months_overdue} month${summary.months_overdue !== 1 ? 's' : ''} overdue`
            : 'No arrears',
          gradient: summary.outstanding_arrears > 0 ? 'from-red-500 to-rose-600' : 'from-slate-500 to-slate-600',
          icon: summary.outstanding_arrears > 0 ? AlertTriangle : CheckCircle2,
        },
        {
          label: 'Last Payment',
          value: fmtDate(summary.last_payment_date),
          sub: 'Most recent receipt',
          gradient: 'from-sky-500 to-blue-600',
          icon: Receipt,
        },
        {
          label: 'Next Due Date',
          value: fmtDate(summary.next_due_date),
          sub: 'Pay before this date',
          gradient: 'from-slate-600 to-gray-700',
          icon: Calendar,
        },
        {
          label: 'Penalty Rate',
          value: summary.penalty_rate,
          sub: 'On delayed payments',
          gradient: 'from-rose-600 to-red-700',
          icon: AlertTriangle,
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
          <Home size={11} />
          <ChevronRight size={10} />
          <span>My Workspace</span>
          <ChevronRight size={10} />
          <button
            onClick={() => navigate(ROUTES.QUARTERS_REQUESTS)}
            className="text-blue-600 hover:underline font-medium"
          >
            Quarter Requests
          </button>
          <ChevronRight size={10} />
          <span className="text-gray-600 font-medium">Rent Summary</span>
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate(ROUTES.QUARTERS_REQUESTS)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 transition-all"
        >
          <ArrowLeft size={15} /> Back to Quarter Requests
        </button>

        {/* Page header */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl px-8 py-6 mb-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <IndianRupee size={24} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white">Rent Summary</h1>
              <p className="text-teal-100 text-sm mt-0.5">Monthly rent ledger &amp; payment history</p>
            </div>
            {activeAllotment && (
              <div className="hidden sm:flex items-center gap-3 bg-white/15 rounded-xl px-4 py-2.5">
                <Building2 size={16} className="text-white/80 shrink-0" />
                <div>
                  <div className="text-white font-bold text-sm">{activeAllotment.quarterNumber}</div>
                  <div className="text-teal-100 text-xs">
                    {activeAllotment.bhkConfig} · {fmtINR(activeAllotment.monthlyRent)}/mo
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-gray-200 animate-pulse" />
              ))}
            </div>
            <div className="h-64 rounded-2xl bg-gray-200 animate-pulse" />
          </div>
        ) : !activeAllotment ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-8 py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-200 mb-4">
              <Building2 size={28} className="text-gray-300" />
            </div>
            <h2 className="text-lg font-bold text-gray-700 mb-2">No Active Quarter Allotment</h2>
            <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">
              Rent records are available once you have an occupied quarter allotment.
            </p>
            <button
              onClick={() => navigate(ROUTES.QUARTERS_REQUESTS)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-sm transition-colors"
            >
              <ArrowLeft size={15} /> View Quarter Requests
            </button>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {summaryCards.map(({ label, value, sub, gradient, icon: Icon }) => (
                <div key={label} className={`bg-gradient-to-br ${gradient} rounded-2xl p-4 shadow-sm`}>
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center mb-2.5">
                    <Icon size={14} className="text-white" />
                  </div>
                  <div className="text-white font-bold text-sm leading-tight mb-0.5 truncate">{value}</div>
                  <div className="text-white/70 text-[10px] uppercase tracking-wide font-semibold mb-0.5">{label}</div>
                  <div className="text-white/60 text-[10px] leading-snug">{sub}</div>
                </div>
              ))}
            </div>

            {/* Quarter info strip */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-4 flex flex-wrap items-center gap-x-8 gap-y-2">
              <div className="flex items-center gap-2">
                <Building2 size={15} className="text-teal-600 shrink-0" />
                <span className="text-xs text-gray-500 font-medium">Quarter</span>
                <span className="text-sm font-bold text-gray-900">{activeAllotment.quarterNumber}</span>
              </div>
              <div className="h-4 w-px bg-gray-200 hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Type</span>
                <span className="text-sm font-semibold text-gray-800">{activeAllotment.bhkConfig}</span>
              </div>
              <div className="h-4 w-px bg-gray-200 hidden sm:block" />
              <div className="flex items-center gap-2">
                <IndianRupee size={13} className="text-teal-600 shrink-0" />
                <span className="text-xs text-gray-500 font-medium">Monthly Rent</span>
                <span className="text-sm font-bold text-teal-700">{fmtINR(activeAllotment.monthlyRent)}</span>
              </div>
              <div className="h-4 w-px bg-gray-200 hidden sm:block" />
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-gray-400 shrink-0" />
                <span className="text-xs text-gray-500 font-medium">In Possession Since</span>
                <span className="text-sm font-semibold text-gray-800">{fmtDate(activeAllotment.possessionDate)}</span>
              </div>
            </div>

            {/* Rent ledger */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full bg-teal-600" />
                  <h2 className="text-sm font-bold text-gray-800">Rent Ledger</h2>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                    {records.length} records
                  </span>
                </div>
                <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-teal-700 font-medium transition-colors">
                  <Download size={13} /> Export
                </button>
              </div>

              {records.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Receipt size={28} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No rent records found</p>
                </div>
              ) : (
                <>
                  <div className="hidden sm:grid grid-cols-6 gap-4 px-6 py-2.5 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <div className="col-span-2">Month</div>
                    <div className="text-right">Amount Due</div>
                    <div className="text-right">Amount Paid</div>
                    <div>Payment Date</div>
                    <div>Status</div>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {records.map((rec) => {
                      const cfg = STATUS_CONFIG[rec.status];
                      const StatusIcon = cfg.icon;
                      return (
                        <div
                          key={rec.id}
                          className="grid grid-cols-2 sm:grid-cols-6 gap-2 sm:gap-4 px-6 py-3.5 hover:bg-gray-50/60 transition-colors items-center"
                        >
                          <div className="col-span-2 sm:col-span-2">
                            <div className="text-sm font-semibold text-gray-900">{fmtMonth(rec.month)}</div>
                            {rec.receipt_ref && (
                              <div className="text-[10px] font-mono text-gray-400 mt-0.5">{rec.receipt_ref}</div>
                            )}
                            {rec.remarks && (
                              <div className="text-[10px] text-rose-500 mt-0.5">{rec.remarks}</div>
                            )}
                          </div>
                          <div className="sm:text-right">
                            <div className="text-[10px] text-gray-400 sm:hidden font-medium mb-0.5">Due</div>
                            <div className="text-sm font-semibold text-gray-700">{fmtINR(rec.amount_due)}</div>
                          </div>
                          <div className="sm:text-right">
                            <div className="text-[10px] text-gray-400 sm:hidden font-medium mb-0.5">Paid</div>
                            <div className={`text-sm font-bold ${rec.amount_paid > 0 ? 'text-emerald-700' : 'text-gray-300'}`}>
                              {rec.amount_paid > 0 ? fmtINR(rec.amount_paid) : '—'}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-400 sm:hidden font-medium mb-0.5">Payment Date</div>
                            <div className="text-xs text-gray-600">{fmtDate(rec.payment_date)}</div>
                          </div>
                          <div>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
                              <StatusIcon size={9} />
                              {cfg.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
};
