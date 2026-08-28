import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, IndianRupee, Phone, MapPin, Users, Building2,
  Calendar, Clock, AlertTriangle, CheckCircle2, Wallet, Download,
  Loader2, X, Percent, Layers, FileText, AlertCircle, History,
  MessageSquareWarning, ChevronDown, ChevronRight, Receipt,
  Plus, Save, FileSpreadsheet, Filter,
} from 'lucide-react';
import { dccService } from '../services/dccService';
import { ROUTES } from '../constants/routes';
import type { DccTile, DccPayment, DccDemand, DccInstallmentPlan, DccInstallmentRow } from '../types/dcc';
import type { PaymentMode } from '../types/payableCriteria';
import { ALL_PAYMENT_MODES, PAYMENT_MODE_LABELS } from '../types/payableCriteria';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

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

type Tab = 'overview' | 'payments' | 'installments' | 'dispute';

const inputCls = 'w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 bg-white text-gray-700 transition-colors';

export const DCCDemandDetailPage: React.FC = () => {
  const { demandId } = useParams<{ demandId: string }>();
  const navigate = useNavigate();

  const [demand, setDemand] = useState<DccDemand | null>(null);
  const [tile, setTile] = useState<DccTile | null>(null);
  const [payments, setPayments] = useState<DccPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Payment form
  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payMode, setPayMode] = useState<string>('EPAY');
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payRef, setPayRef] = useState('');
  const [payRemarks, setPayRemarks] = useState('');
  const [paying, setPaying] = useState(false);

  // Dispute form
  const [disputeDate, setDisputeDate] = useState(new Date().toISOString().slice(0, 10));
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeRemarks, setDisputeRemarks] = useState('');
  const [disputing, setDisputing] = useState(false);

  // Installment plan
  const [instPlan, setInstPlan] = useState<DccInstallmentPlan | null>(null);
  const [instRows, setInstRows] = useState<DccInstallmentRow[]>([]);
  const [instLoading, setInstLoading] = useState(false);
  const [showInstForm, setShowInstForm] = useState(false);
  const [payingRowId, setPayingRowId] = useState<string | null>(null);

  // Role-based permissions
  const { user } = useAuthStore();
  const canManagePlan = user?.role === 'manager' || user?.role === 'admin';

  // Installment form fields (rent tracker parity)
  const [instStartDate, setInstStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [instLateFee, setInstLateFee] = useState('0');
  const [instDueDaysLate, setInstDueDaysLate] = useState('0');
  const [instInterestPct, setInstInterestPct] = useState('0.00');
  const [instDiscountFullPct, setInstDiscountFullPct] = useState('0.00');
  const [instGstPct, setInstGstPct] = useState('0.00');
  const [instGstType, setInstGstType] = useState<'inclusive' | 'exclusive'>('inclusive');
  const [instNumInstallments, setInstNumInstallments] = useState(2);
  const [instRowFilter, setInstRowFilter] = useState('ALL');
  const [instSuccess, setInstSuccess] = useState<string | null>(null);

  const balancePayment = tile?.amount_due ?? 0;

  // Auto-generated installment schedule for the form table
  const instSchedule = useMemo(() => {
    const total = balancePayment;
    const n = instNumInstallments;
    if (n <= 0 || total <= 0) return [];
    const perPct = 100 / n;
    const perAmt = total / n;
    const isExcl = instGstType === 'exclusive';
    const gstRate = parseFloat(instGstPct) || 0;
    const lateFee = parseFloat(instLateFee) || 0;
    const dueDays = parseInt(instDueDaysLate) || 0;
    const discFullPct = parseFloat(instDiscountFullPct) || 0;

    const rows: Array<{
      row_number: number; label: string; percentage: number; amount: number;
      discount: number; penalty: number; gst_amount: number; net_payable: number;
      due_date: string; due_with_late_fee: string | null;
    }> = [];

    // Full payment row (row 0)
    const fullDisc = Math.round(total * discFullPct / 100);
    const fullGst = isExcl ? Math.round((total - fullDisc) * gstRate / 100) : 0;
    rows.push({
      row_number: 0, label: 'Full Payment', percentage: 100, amount: total,
      discount: fullDisc, penalty: 0, gst_amount: fullGst,
      net_payable: total - fullDisc + fullGst,
      due_date: instStartDate, due_with_late_fee: null,
    });

    // Installment rows
    for (let i = 1; i <= n; i++) {
      const due = new Date(instStartDate);
      due.setMonth(due.getMonth() + (i - 1));
      const dueWithLate = new Date(due);
      dueWithLate.setDate(dueWithLate.getDate() + dueDays);
      const instGst = isExcl ? Math.round(perAmt * gstRate / 100) : 0;
      rows.push({
        row_number: i, label: `Installment ${i}`, percentage: perPct, amount: perAmt,
        discount: 0, penalty: lateFee, gst_amount: instGst,
        net_payable: perAmt + instGst,
        due_date: due.toISOString().split('T')[0],
        due_with_late_fee: dueDays > 0 ? dueWithLate.toISOString().split('T')[0] : null,
      });
    }
    return rows;
  }, [balancePayment, instNumInstallments, instGstType, instGstPct, instLateFee, instDueDaysLate, instDiscountFullPct, instStartDate]);

  const instPctTotal = instSchedule.filter(r => r.row_number > 0).reduce((s, r) => s + r.percentage, 0);
  const instPctValid = Math.abs(instPctTotal - 100) < 0.01;
  const instAmtTotal = instSchedule.filter(r => r.row_number > 0).reduce((s, r) => s + r.amount, 0);
  const instAmtValid = Math.abs(instAmtTotal - balancePayment) < 0.50;

  const load = useCallback(async () => {
    if (!demandId) return;
    setLoading(true);
    setError(null);
    try {
      const [allTiles, pays, instData] = await Promise.all([
        dccService.getTiles({ object_id: undefined }),
        dccService.getPayments(demandId),
        dccService.getInstallmentPlan(demandId),
      ]);
      const foundTile = allTiles.find(t => t.id === demandId);
      setTile(foundTile ?? null);

      const { data: demandData } = await supabase
        .from('dcc_demands')
        .select('*, object:object_id(*, owner:owner_id(*)), owner:owner_id(*), demand_type:demand_type_id(*)')
        .eq('id', demandId)
        .maybeSingle();
      setDemand(demandData as DccDemand | null);

      setPayments(pays);
      setInstPlan(instData.plan);
      setInstRows(instData.rows);
      if (foundTile) {
        setPayAmount(foundTile.amount_due);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load demand');
    } finally {
      setLoading(false);
    }
  }, [demandId]);

  const loadInstallments = useCallback(async () => {
    if (!demandId) return;
    setInstLoading(true);
    try {
      const instData = await dccService.getInstallmentPlan(demandId);
      setInstPlan(instData.plan);
      setInstRows(instData.rows);
    } catch {
      // silent
    } finally {
      setInstLoading(false);
    }
  }, [demandId]);

  const handleCreatePlan = async () => {
    if (!demandId || !tile || !canManagePlan) return;
    if (!instStartDate) { setError('Installment start date is required'); return; }
    if (instNumInstallments < 1) { setError('Number of installments must be at least 1'); return; }
    if (!instPctValid) { setError(`Installment percentages must total 100% (currently ${instPctTotal.toFixed(2)}%)`); return; }
    if (!instAmtValid) { setError(`Installment amounts must total ${fmtINR(balancePayment)} (currently ${fmtINR(instAmtTotal)})`); return; }
    setInstLoading(true);
    setActionError(null);
    setInstSuccess(null);
    try {
      const config = {
        noOfInstallments: instNumInstallments,
        installmentStartDate: instStartDate,
        lateFee: parseFloat(instLateFee) || 0,
        dueDaysWithLateFee: parseInt(instDueDaysLate) || 0,
        interestPctPa: parseFloat(instInterestPct) || 0,
        discountFullPaymentPct: parseFloat(instDiscountFullPct) || 0,
        gstPct: parseFloat(instGstPct) || 0,
        gstType: instGstType,
        balancePayment,
      };
      const customRows = instSchedule.map(r => ({
        row_number: r.row_number,
        label: r.label,
        percentage: r.percentage,
        amount: r.amount,
        due_date: r.due_date,
        late_fee: r.penalty,
        due_date_with_late_fee: r.due_with_late_fee,
        gst_amount: r.gst_amount,
      }));
      await dccService.createInstallmentPlan(demandId, config, customRows);
      setShowInstForm(false);
      setInstSuccess('Installment plan created successfully.');
      await loadInstallments();
      await load();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Failed to create installment plan');
    } finally {
      setInstLoading(false);
    }
  };

  const handlePayInstallment = async (row: DccInstallmentRow) => {
    if (!demandId || !tile) return;
    setPayingRowId(row.id);
    setActionError(null);
    try {
      const payAmt = row.remaining_amount;
      await dccService.payInstallmentRow(row.id, payAmt, new Date().toISOString().slice(0, 10));
      await dccService.submitPayment(
        demandId, tile.object_id, payAmt, 'EPAY',
        new Date().toISOString().slice(0, 10),
        `Installment ${row.row_number}`, undefined,
      );
      await loadInstallments();
      await load();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Failed to pay installment');
    } finally {
      setPayingRowId(null);
    }
  };

  useEffect(() => { load(); }, [load]);

  const handlePay = async () => {
    if (!demandId || !tile || payAmount <= 0) return;
    setPaying(true);
    setActionError(null);
    try {
      await dccService.submitPayment(
        demandId,
        tile.object_id,
        payAmount,
        payMode,
        payDate,
        payRef || undefined,
        payRemarks || undefined,
      );
      setShowPayForm(false);
      setPayRef('');
      setPayRemarks('');
      await load();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const handleDispute = async () => {
    if (!demandId || !disputeReason.trim()) return;
    setDisputing(true);
    setActionError(null);
    try {
      await dccService.setDispute(demandId, disputeDate, disputeReason, disputeRemarks);
      await load();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Failed to set dispute');
    } finally {
      setDisputing(false);
    }
  };

  const handleDownload = () => {
    if (!tile) return;
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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <Loader2 size={24} className="animate-spin text-teal-500" />
      </div>
    );
  }

  if (error || !tile) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50 text-gray-500">
        <AlertTriangle size={28} className="mb-2 text-red-400" />
        <span className="text-sm font-medium">{error ?? 'Demand not found'}</span>
        <button onClick={() => navigate(ROUTES.DCC)} className="mt-3 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700">
          Back to DCC
        </button>
      </div>
    );
  }

  const st = STATUS[tile.status];
  const isPaidOrExempted = tile.status === 'PAID' || tile.status === 'EXEMPTED';
  const hasDispute = !!(demand?.dispute_date);

  const TABS: { key: Tab; label: string; icon: typeof History }[] = [
    { key: 'overview', label: 'Overview', icon: FileText },
    { key: 'payments', label: `Payments (${payments.length})`, icon: Receipt },
    { key: 'installments', label: `Installments (${showInstForm ? instNumInstallments : (instPlan?.no_of_installments ?? instRows.filter(r => r.row_number > 0).length)})`, icon: Layers },
    { key: 'dispute', label: hasDispute ? 'Dispute (Active)' : 'Dispute', icon: MessageSquareWarning },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-200 shrink-0">
        <button onClick={() => navigate(ROUTES.DCC)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0">
          <ArrowLeft size={16} />
        </button>
        <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shrink-0">
          <IndianRupee size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-gray-900 truncate">{tile.object_ref}</h1>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${st.bg} ${st.text}`}>
              {st.label}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate">{tile.demand_type_label} · {tile.object_type}</p>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 transition-colors"
        >
          <Download size={14} /> Statement
        </button>
        {!isPaidOrExempted && (
          <button
            onClick={() => setShowPayForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors shadow-sm"
          >
            <Wallet size={14} /> Pay Now
          </button>
        )}
      </div>

      {actionError && (
        <div className="mx-5 mt-3 flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <AlertCircle size={14} className="shrink-0" /> {actionError}
          <button onClick={() => setActionError(null)} className="ml-auto p-0.5 text-red-400 hover:text-red-600 transition-colors shrink-0">
            <X size={13} />
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto p-5">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Summary card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className={`h-1 ${st.dot}`} />
            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Amount</div>
                  <div className="text-lg font-extrabold text-gray-900">{fmtINR(tile.total_amount)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Amount Paid</div>
                  <div className="text-lg font-extrabold text-emerald-700">{fmtINR(tile.amount_paid)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Amount Due</div>
                  <div className="text-lg font-extrabold text-teal-700">{fmtINR(tile.amount_due)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Overdue</div>
                  <div className={`text-lg font-extrabold ${tile.overdue_amount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {tile.overdue_amount > 0 ? fmtINR(tile.overdue_amount) : '—'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs">
                  <Calendar size={13} className="text-gray-400" />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Run Date</div>
                    <div className="font-semibold text-gray-700">{fmtDate(tile.demand_run_date)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Clock size={13} className="text-gray-400" />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Due Date</div>
                    <div className={`font-semibold ${tile.status === 'OVERDUE' ? 'text-red-600' : 'text-gray-700'}`}>{fmtDate(tile.due_date)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <History size={13} className="text-gray-400" />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Last Paid</div>
                    <div className="font-semibold text-gray-700">{tile.last_paid_date ? `${fmtINR(tile.last_paid_amount ?? 0)} · ${fmtDate(tile.last_paid_date)}` : '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment form */}
          {showPayForm && !isPaidOrExempted && (
            <div className="bg-white rounded-2xl border border-teal-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-teal-600">
                <Wallet size={15} className="text-white" />
                <span className="text-sm font-bold text-white">Record Payment</span>
                <button onClick={() => setShowPayForm(false)} className="ml-auto p-1 text-white/70 hover:text-white">
                  <X size={15} />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Amount *</label>
                    <input type="number" value={payAmount} onChange={e => setPayAmount(Number(e.target.value))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Payment Mode *</label>
                    <select value={payMode} onChange={e => setPayMode(e.target.value)} className={inputCls}>
                      {ALL_PAYMENT_MODES.map(m => <option key={m} value={m}>{PAYMENT_MODE_LABELS[m]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Payment Date *</label>
                    <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Reference #</label>
                    <input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Optional" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Remarks</label>
                  <input value={payRemarks} onChange={e => setPayRemarks(e.target.value)} placeholder="Optional notes" className={inputCls} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handlePay}
                    disabled={paying || payAmount <= 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 disabled:opacity-40 transition-colors"
                  >
                    {paying ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    {paying ? 'Recording…' : 'Record Payment'}
                  </button>
                  <button onClick={() => setShowPayForm(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-gray-200">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                    active ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={14} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {activeTab === 'overview' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Object Details</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2"><Building2 size={13} className="text-gray-400" /><span className="text-gray-500">Object Ref:</span><span className="font-semibold text-gray-700">{tile.object_ref}</span></div>
                  <div className="flex items-center gap-2"><Building2 size={13} className="text-gray-400" /><span className="text-gray-500">Object Type:</span><span className="font-semibold text-gray-700">{tile.object_type}</span></div>
                  <div className="flex items-center gap-2"><MapPin size={13} className="text-gray-400" /><span className="text-gray-500">Region:</span><span className="font-semibold text-gray-700">{tile.region ?? '—'}</span></div>
                  <div className="flex items-center gap-2"><Building2 size={13} className="text-gray-400" /><span className="text-gray-500">Group:</span><span className="font-semibold text-gray-700">{tile.group_name ?? '—'}</span></div>
                </div>
                {tile.object_description && tile.object_description !== tile.object_ref && (
                  <p className="text-xs text-gray-500 mt-2">{tile.object_description}</p>
                )}
              </div>
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Owner Details</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2"><Users size={13} className="text-gray-400" /><span className="text-gray-500">Name:</span><span className="font-semibold text-gray-700">{tile.owner_name}</span></div>
                  <div className="flex items-center gap-2"><Phone size={13} className="text-gray-400" /><span className="text-gray-500">Contact:</span><span className="font-semibold text-gray-700">{tile.owner_contact || '—'}</span></div>
                  {tile.owner_address && <div className="flex items-center gap-2 col-span-2"><MapPin size={13} className="text-gray-400" /><span className="text-gray-500">Address:</span><span className="font-semibold text-gray-700">{tile.owner_address}</span></div>}
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Demand Info</h3>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div><span className="text-gray-500">Demand Type:</span> <span className="font-semibold text-gray-700">{tile.demand_type_label}</span></div>
                  <div><span className="text-gray-500">Generation Source:</span> <span className="font-semibold text-gray-700">{demand?.generation_source ?? '—'}</span></div>
                  <div><span className="text-gray-500">Avg Overdue Days:</span> <span className={`font-semibold ${tile.avg_overdue_days > 0 ? 'text-red-600' : 'text-gray-700'}`}>{tile.avg_overdue_days > 0 ? `${tile.avg_overdue_days}d` : '—'}</span></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                <Receipt size={15} className="text-gray-500" />
                <h3 className="text-sm font-bold text-gray-900">Payment History</h3>
                <span className="ml-auto text-[10px] text-gray-400">{payments.length} payment{payments.length !== 1 ? 's' : ''}</span>
              </div>
              {payments.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Receipt size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No payments recorded yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {payments.map(p => (
                    <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={15} className="text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-gray-900">{fmtINR(p.amount)}</div>
                        <div className="text-[10px] text-gray-500">
                          {PAYMENT_MODE_LABELS[p.payment_mode as PaymentMode] ?? p.payment_mode} · {fmtDate(p.payment_date)}
                          {p.reference_number && ` · Ref: ${p.reference_number}`}
                        </div>
                        {p.remarks && <div className="text-[10px] text-gray-400 mt-0.5">{p.remarks}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'installments' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
              {/* Header */}
              <div className="flex items-center gap-2">
                <Layers size={15} className="text-gray-500" />
                <h3 className="text-sm font-bold text-gray-900">Installment Plan</h3>
                {canManagePlan && !isPaidOrExempted && !showInstForm && (
                  <button
                    onClick={() => setShowInstForm(true)}
                    className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 text-[11px] font-semibold hover:bg-teal-100 transition-colors"
                  >
                    <Plus size={12} /> {instPlan ? 'Recreate Plan' : 'Create Plan'}
                  </button>
                )}
              </div>

              {/* Success message */}
              {instSuccess && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
                  <CheckCircle2 size={14} className="shrink-0" /> {instSuccess}
                </div>
              )}

              {/* Create / Recreate form */}
              {showInstForm && canManagePlan && !isPaidOrExempted && (
                <div className="bg-teal-50/50 border border-teal-200 rounded-xl p-4 space-y-4">
                  {/* Config fields */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Installment Start Date *</label>
                      <input type="date" value={instStartDate} onChange={e => setInstStartDate(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Late Fee (₹)</label>
                      <input type="number" min={0} value={instLateFee} onChange={e => setInstLateFee(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Due Days with Late Fee</label>
                      <select value={instDueDaysLate} onChange={e => setInstDueDaysLate(e.target.value)} className={inputCls}>
                        {[0, 5, 7, 10, 15, 20, 30].map(d => <option key={d} value={d}>{d} days</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Interest % p.a.</label>
                      <input type="number" step="0.01" min={0} value={instInterestPct} onChange={e => setInstInterestPct(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Discount if Full Payment %</label>
                      <input type="number" step="0.01" min={0} max={100} value={instDiscountFullPct} onChange={e => setInstDiscountFullPct(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">GST %</label>
                      <input type="number" step="0.01" min={0} max={100} value={instGstPct} onChange={e => setInstGstPct(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">GST Type</label>
                      <select value={instGstType} onChange={e => setInstGstType(e.target.value as 'inclusive' | 'exclusive')} className={inputCls}>
                        <option value="inclusive">Inclusive</option>
                        <option value="exclusive">Exclusive</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Balance Payment</label>
                      <div className="px-3 py-2 text-xs font-bold text-gray-700 bg-gray-50 rounded-lg border border-gray-200">{fmtINR(balancePayment)}</div>
                    </div>
                  </div>

                  {/* Term selector */}
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Term (No. of Installments):</label>
                    <select value={instNumInstallments} onChange={e => setInstNumInstallments(Number(e.target.value))} className={`${inputCls} w-32`}>
                      {[1, 2, 3, 4, 6, 8, 10, 12].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>

                  {/* Schedule table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="bg-gray-100 text-gray-600">
                          <th className="px-2 py-1.5 text-left font-bold">Installment</th>
                          <th className="px-2 py-1.5 text-right font-bold">Percentage</th>
                          <th className="px-2 py-1.5 text-right font-bold">Amount</th>
                          <th className="px-2 py-1.5 text-right font-bold">Discount</th>
                          <th className="px-2 py-1.5 text-right font-bold">Penalty</th>
                          <th className="px-2 py-1.5 text-right font-bold">GST Amount</th>
                          <th className="px-2 py-1.5 text-right font-bold">Net Payable</th>
                          <th className="px-2 py-1.5 text-left font-bold">Due Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {instSchedule.map(r => (
                          <tr key={r.row_number} className={r.row_number === 0 ? 'bg-teal-50/50' : ''}>
                            <td className="px-2 py-1.5 font-semibold text-gray-700">{r.label}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{r.percentage.toFixed(2)}%</td>
                            <td className="px-2 py-1.5 text-right tabular-nums font-semibold">{fmtINR(r.amount)}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{r.discount > 0 ? fmtINR(r.discount) : '—'}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{r.penalty > 0 ? fmtINR(r.penalty) : '—'}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{r.gst_amount > 0 ? fmtINR(r.gst_amount) : '—'}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums font-bold text-teal-700">{fmtINR(r.net_payable)}</td>
                            <td className="px-2 py-1.5 text-left text-gray-500">{fmtDate(r.due_date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Validation warnings */}
                  {!instPctValid && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-700">
                      <AlertTriangle size={12} /> Percentages total {instPctTotal.toFixed(2)}% — must equal 100%.
                    </div>
                  )}
                  {!instAmtValid && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-700">
                      <AlertTriangle size={12} /> Amounts total {fmtINR(instAmtTotal)} — must equal {fmtINR(balancePayment)}.
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreatePlan}
                      disabled={instLoading || !instPctValid || !instAmtValid || !instStartDate}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 disabled:opacity-40 transition-colors"
                    >
                      {instLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      {instLoading ? 'Creating…' : instPlan ? 'Recreate Plan' : 'Create Plan'}
                    </button>
                    <button onClick={() => { setShowInstForm(false); setInstSuccess(null); }} className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Read-only plan view */}
              {instLoading && !instPlan ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-teal-500" />
                </div>
              ) : instRows.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Layers size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No installment plan created yet.</p>
                  {canManagePlan ? (
                    <p className="text-[10px] mt-1">Click "Create Plan" to split this demand into installments.</p>
                  ) : (
                    <p className="text-[10px] mt-1">An Estate Manager has not created a plan for this demand yet.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Plan config chips */}
                  {instPlan && (
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-[10px] font-semibold text-gray-600">Start: {fmtDate(instPlan.installment_start_date)}</span>
                      <span className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-[10px] font-semibold text-gray-600">Late Fee: ₹{instPlan.late_fee}</span>
                      <span className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-[10px] font-semibold text-gray-600">Due Days: {instPlan.due_days_with_late_fee}</span>
                      <span className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-[10px] font-semibold text-gray-600">Interest: {instPlan.interest_pct_pa}% p.a.</span>
                      <span className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-[10px] font-semibold text-gray-600">Full Pay Disc: {instPlan.discount_full_payment_pct}%</span>
                      <span className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-[10px] font-semibold text-gray-600">GST: {instPlan.gst_pct}% ({instPlan.gst_type})</span>
                      <span className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-[10px] font-semibold text-gray-600">Balance: {fmtINR(instPlan.balance_payment)}</span>
                      <span className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-[10px] font-semibold text-gray-600">Installments: {instPlan.no_of_installments}</span>
                      <span className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-700">Paid: {instPlan.installments_paid}</span>
                      <span className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-[10px] font-semibold text-amber-700">Due: {instPlan.installments_due}</span>
                    </div>
                  )}

                  {/* Filter + Export row */}
                  <div className="flex items-center gap-2">
                    <Filter size={13} className="text-gray-400" />
                    <select value={instRowFilter} onChange={e => setInstRowFilter(e.target.value)} className={`${inputCls} w-40`}>
                      <option value="ALL">All Installments</option>
                      {instRows.filter(r => r.row_number > 0).map(r => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const csv = ['Action,Installment,Total Amount,Discount,Penalty,GST Amount,Due Date,Due with Late Fee,Paid Date,Paid Amount,Remaining,Status'];
                        instRows.forEach(r => {
                          csv.push([r.row_number === 0 ? 'Full Pay' : 'Pay', r.label, r.amount, r.late_fee > 0 ? r.late_fee : '', r.late_fee, r.gst_amount, r.due_date || '', r.due_date_with_late_fee || '', r.paid_date || '', r.paid_amt, r.remaining_amount, r.status].join(','));
                        });
                        const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = `Installments_${tile?.object_ref ?? 'plan'}.csv`;
                        document.body.appendChild(a); a.click(); document.body.removeChild(a);
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                      }}
                      className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-[11px] font-semibold hover:bg-gray-200 transition-colors"
                    >
                      <FileSpreadsheet size={12} /> Export
                    </button>
                  </div>

                  {/* Dense installment table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="bg-gray-100 text-gray-600">
                          <th className="px-2 py-1.5 text-left font-bold">Action</th>
                          <th className="px-2 py-1.5 text-left font-bold">Installment</th>
                          <th className="px-2 py-1.5 text-right font-bold">Total Amount</th>
                          <th className="px-2 py-1.5 text-right font-bold">Discount</th>
                          <th className="px-2 py-1.5 text-right font-bold">Penalty</th>
                          <th className="px-2 py-1.5 text-right font-bold">GST Amt</th>
                          <th className="px-2 py-1.5 text-left font-bold">Due Date</th>
                          <th className="px-2 py-1.5 text-left font-bold">Due w/ Late Fee</th>
                          <th className="px-2 py-1.5 text-left font-bold">Paid Date</th>
                          <th className="px-2 py-1.5 text-right font-bold">Paid Amt</th>
                          <th className="px-2 py-1.5 text-right font-bold">Remaining</th>
                          <th className="px-2 py-1.5 text-center font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {instRows
                          .filter(r => instRowFilter === 'ALL' || r.id === instRowFilter)
                          .map(row => {
                            const isPaid = row.status === 'PAID';
                            const isFullPayment = row.row_number === 0;
                            const canPay = !isPaid && row.remaining_amount > 0 && !isPaidOrExempted;
                            return (
                              <tr key={row.id} className={isPaid ? 'bg-emerald-50/40' : row.status === 'OVERDUE' ? 'bg-red-50/30' : ''}>
                                <td className="px-2 py-1.5">
                                  {canPay ? (
                                    <button
                                      onClick={() => handlePayInstallment(row)}
                                      disabled={payingRowId === row.id}
                                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-teal-600 text-white text-[9px] font-semibold hover:bg-teal-700 disabled:opacity-40 transition-colors"
                                    >
                                      {payingRowId === row.id ? <Loader2 size={10} className="animate-spin" /> : <Wallet size={10} />}
                                      {payingRowId === row.id ? 'Paying…' : 'Pay'}
                                    </button>
                                  ) : (
                                    <span className="text-gray-300">—</span>
                                  )}
                                </td>
                                <td className="px-2 py-1.5 font-semibold text-gray-700">{row.label}</td>
                                <td className="px-2 py-1.5 text-right tabular-nums font-bold">{fmtINR(row.amount)}</td>
                                <td className="px-2 py-1.5 text-right tabular-nums text-gray-400">{row.late_fee > 0 && row.row_number === 0 ? fmtINR(0) : '—'}</td>
                                <td className="px-2 py-1.5 text-right tabular-nums text-gray-400">{row.late_fee > 0 && row.row_number > 0 ? fmtINR(row.late_fee) : '—'}</td>
                                <td className="px-2 py-1.5 text-right tabular-nums text-gray-400">{row.gst_amount > 0 ? fmtINR(row.gst_amount) : '—'}</td>
                                <td className="px-2 py-1.5 text-left text-gray-500">{fmtDate(row.due_date)}</td>
                                <td className="px-2 py-1.5 text-left text-gray-500">{fmtDate(row.due_date_with_late_fee)}</td>
                                <td className="px-2 py-1.5 text-left text-gray-500">{fmtDate(row.paid_date)}</td>
                                <td className="px-2 py-1.5 text-right tabular-nums text-emerald-600 font-semibold">{row.paid_amt > 0 ? fmtINR(row.paid_amt) : '—'}</td>
                                <td className="px-2 py-1.5 text-right tabular-nums font-semibold text-gray-700">{row.remaining_amount > 0 ? fmtINR(row.remaining_amount) : '—'}</td>
                                <td className="px-2 py-1.5 text-center">
                                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    isPaid ? 'bg-emerald-100 text-emerald-700' :
                                    row.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                                    row.status === 'DUE' ? 'bg-amber-100 text-amber-700' :
                                    'bg-gray-100 text-gray-500'
                                  }`}>{row.status}</span>
                                </td>
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

          {activeTab === 'dispute' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquareWarning size={15} className="text-gray-500" />
                <h3 className="text-sm font-bold text-gray-900">Dispute</h3>
              </div>
              {hasDispute ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <AlertTriangle size={13} className="text-amber-600" />
                    <span className="font-bold text-amber-700">This demand is disputed</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    <div><span className="text-gray-400">Dispute Date:</span> {fmtDate(demand?.dispute_date ?? null)}</div>
                    <div className="mt-1"><span className="text-gray-400">Reason:</span> {demand?.dispute_reason}</div>
                    {demand?.dispute_remarks && <div className="mt-1"><span className="text-gray-400">Remarks:</span> {demand.dispute_remarks}</div>}
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-500">Mark this demand as disputed if the owner contests the amount or validity.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Dispute Date *</label>
                      <input type="date" value={disputeDate} onChange={e => setDisputeDate(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Reason *</label>
                      <input value={disputeReason} onChange={e => setDisputeReason(e.target.value)} placeholder="e.g. Wrong amount" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Remarks</label>
                    <textarea value={disputeRemarks} onChange={e => setDisputeRemarks(e.target.value)} placeholder="Additional details" className={inputCls + ' h-20 resize-none'} />
                  </div>
                  <button
                    onClick={handleDispute}
                    disabled={disputing || !disputeReason.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 disabled:opacity-40 transition-colors"
                  >
                    {disputing ? <Loader2 size={14} className="animate-spin" /> : <MessageSquareWarning size={14} />}
                    {disputing ? 'Saving…' : 'Mark as Disputed'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DCCDemandDetailPage;
