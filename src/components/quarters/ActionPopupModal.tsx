import React, { useRef, useState } from 'react';
import {
  RefreshCw, LogOut, AlertCircle, Wrench, HardHat, Key,
  CalendarDays, Info, Paperclip, X, ChevronDown, ChevronUp,
  Building2, FileText, CheckCircle2,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { DocUpload } from '../ui/DocUpload';

type ActionType = 'EXTEND' | 'VACATE' | 'GRIEVANCE' | 'MAINTENANCE' | 'INSPECTION' | 'HANDOVER';

interface ActionPopup {
  type: ActionType | null;
  requestId: string | null;
  allotmentId: string | null;
}

export interface AllotmentInfo {
  quarterNumber: string;
  block: string;
  quarterType: string;
}

interface Props {
  actionPopup: ActionPopup;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
  reason: string;
  remarks: string;
  docUrl: File | null;
  date: string;
  subject: string;
  urgency: 'LOW' | 'NORMAL' | 'HIGH';
  inspectorName: string;
  condition: string;
  keyNumber: string;
  handoverDeadline: string;
  retentionReason: string;
  requestedMonths: number;
  allotmentInfo?: AllotmentInfo;
  onReasonChange: (v: string) => void;
  onRemarksChange: (v: string) => void;
  onDocChange: (f: File | null) => void;
  onDateChange: (v: string) => void;
  onSubjectChange: (v: string) => void;
  onUrgencyChange: (v: 'LOW' | 'NORMAL' | 'HIGH') => void;
  onInspectorNameChange: (v: string) => void;
  onConditionChange: (v: string) => void;
  onKeyNumberChange: (v: string) => void;
  onHandoverDeadlineChange: (v: string) => void;
  onRetentionReasonChange: (v: string) => void;
  onRequestedMonthsChange: (v: number) => void;
}

const TYPE_CONFIG: Record<ActionType, { title: string; color: string; icon: React.ReactNode }> = {
  EXTEND:      { title: 'Extension/Retention Request', color: 'text-amber-700',   icon: <RefreshCw size={18} className="text-amber-600" /> },
  VACATE:      { title: 'Vacate Request',               color: 'text-rose-700',    icon: <LogOut size={18} className="text-rose-600" /> },
  GRIEVANCE:   { title: 'Raise Grievance',              color: 'text-slate-700',   icon: <AlertCircle size={18} className="text-slate-600" /> },
  MAINTENANCE: { title: 'Maintenance Request',          color: 'text-teal-700',    icon: <Wrench size={18} className="text-teal-600" /> },
  INSPECTION:  { title: 'Start Inspection',             color: 'text-blue-700',    icon: <HardHat size={18} className="text-blue-600" /> },
  HANDOVER:    { title: 'Record Handover',              color: 'text-emerald-700', icon: <Key size={18} className="text-emerald-600" /> },
};

const RETENTION_REASONS = [
  'On retirement',
  'On death of employee',
  'On termination/resignation',
  'On transfer from Bacheli project to another place',
  'Other Extenuating Circumstances',
] as const;

const ELIGIBILITY_ROWS = [
  { desc: 'On retirement',                                      period: '02 months' },
  { desc: 'On death of employee',                               period: '02 months' },
  { desc: 'On termination/resignation',                         period: '01 month'  },
  { desc: 'On transfer from Bacheli project to another place',  period: '02 months' },
];

const PENAL_RENT_ROWS = [
  { type: 'Type - I',   rent: '₹5,000/-'  },
  { type: 'Type - II',  rent: '₹6,000/-'  },
  { type: 'Type - III', rent: '₹8,000/-'  },
  { type: 'Type - IV',  rent: '₹12,000/-' },
  { type: 'Type - V',   rent: '₹16,000/-' },
  { type: 'Type - VI',  rent: '₹20,000/-' },
];

function ExtendForm({
  allotmentInfo,
  retentionReason,
  requestedMonths,
  remarks,
  docUrl,
  submitting,
  onRetentionReasonChange,
  onRequestedMonthsChange,
  onRemarksChange,
  onDocChange,
  onClose,
  onSubmit,
}: {
  allotmentInfo?: AllotmentInfo;
  retentionReason: string;
  requestedMonths: number;
  remarks: string;
  docUrl: File | null;
  submitting: boolean;
  onRetentionReasonChange: (v: string) => void;
  onRequestedMonthsChange: (v: number) => void;
  onRemarksChange: (v: string) => void;
  onDocChange: (f: File | null) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [refExpanded, setRefExpanded] = useState(false);

  return (
    <div className="flex flex-col" style={{ maxHeight: '88vh' }}>

      {/* ── Sticky Header ───────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <RefreshCw size={16} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 leading-tight">Extension / Retention Request</h2>
            <p className="text-xs text-gray-400 mt-0.5 leading-tight">Submit a request to retain your quarter beyond the allotment period</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all shrink-0 ml-4"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Scrollable Body ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

        {/* Allocation Data */}
        {allotmentInfo && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 overflow-hidden">
            <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-amber-100">
              <Building2 size={13} className="text-amber-600 shrink-0" />
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Allocation Data</span>
              <span className="ml-auto text-[10px] text-amber-400 font-medium">Read-only</span>
            </div>
            <div className="px-4 py-3 grid grid-cols-3 gap-4">
              <div>
                <p className="text-[9px] font-semibold text-amber-500 uppercase tracking-wider mb-1">Quarter ID</p>
                <p className="text-sm font-bold text-gray-800">{allotmentInfo.quarterNumber || '—'}</p>
              </div>
              <div>
                <p className="text-[9px] font-semibold text-amber-500 uppercase tracking-wider mb-1">Block</p>
                <p className="text-sm font-bold text-gray-800">{allotmentInfo.block || '—'}</p>
              </div>
              <div>
                <p className="text-[9px] font-semibold text-amber-500 uppercase tracking-wider mb-1">Quarter Type</p>
                <p className="text-sm font-bold text-gray-800">{allotmentInfo.quarterType || '—'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Reference Info — collapsible */}
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setRefExpanded(p => !p)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Info size={13} className="text-blue-500 shrink-0" />
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Retention Reference — Eligibility & Penal Rent Tables</span>
            </div>
            {refExpanded
              ? <ChevronUp size={15} className="text-gray-400 shrink-0" />
              : <ChevronDown size={15} className="text-gray-400 shrink-0" />
            }
          </button>

          {refExpanded && (
            <div className="divide-y divide-gray-100">
              {/* Eligibility Table */}
              <div className="px-4 pt-3 pb-4">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2.5">Eligibility Period for Housing Acquisition</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left pb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide w-8">SL.</th>
                      <th className="text-left pb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Description</th>
                      <th className="text-right pb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Eligibility</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {ELIGIBILITY_ROWS.map((row, i) => (
                      <tr key={i}>
                        <td className="py-2 text-gray-300 font-medium text-xs">{i + 1}</td>
                        <td className="py-2 text-gray-700">{row.desc}</td>
                        <td className="py-2 text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">{row.period}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Penal Rent Table */}
              <div className="px-4 pt-3 pb-4">
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-2.5">Penal Rent Applicable (Table B)</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left pb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide w-8">SL.</th>
                      <th className="text-left pb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Type of House</th>
                      <th className="text-right pb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Penal Rent / Month</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {PENAL_RENT_ROWS.map((row, i) => (
                      <tr key={i}>
                        <td className="py-2 text-gray-300 font-medium text-xs">{i + 1}</td>
                        <td className="py-2 text-gray-700 font-medium">{row.type}</td>
                        <td className="py-2 text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700">{row.rent}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-3 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
                  Penal rent applies after the eligible free-retention period and increases by <strong className="text-gray-600">50% every six months</strong> on a cumulative basis.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Form Fields ─────────────────────────────────── */}
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0">Your Request Details</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Reason for Retention
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <select
                value={retentionReason}
                onChange={e => onRetentionReasonChange(e.target.value)}
                className="w-full appearance-none px-4 py-3 pr-10 text-sm text-gray-800 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 bg-white transition-colors"
              >
                {RETENTION_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Requested Months */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Requested Extension
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="relative w-36">
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={requestedMonths}
                  onChange={e => onRequestedMonthsChange(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-3 text-sm font-semibold text-gray-800 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 text-center"
                />
              </div>
              <span className="text-sm text-gray-500 font-medium">month{requestedMonths !== 1 ? 's' : ''}</span>
              <span className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100">Max: 24 months</span>
            </div>
          </div>

          {/* Justification */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Justification / Remarks</label>
            <textarea
              value={remarks}
              onChange={e => onRemarksChange(e.target.value)}
              rows={4}
              placeholder="Provide a detailed justification for retaining the quarter beyond the allotment period. Include any supporting circumstances relevant to your reason above."
              className="w-full px-4 py-3 text-sm text-gray-800 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 resize-none placeholder-gray-300 transition-colors"
            />
            <p className="mt-1.5 text-xs text-gray-400">{remarks.length} characters entered</p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Supporting Document
              <span className="ml-1.5 text-xs text-gray-400 font-normal">(Optional — medical certificate, transfer order, etc.)</span>
            </label>
            {docUrl ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <FileText size={14} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{docUrl.name}</p>
                  <p className="text-xs text-gray-400">{(docUrl.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={() => onDocChange(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-amber-400 hover:bg-amber-50/40 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
                  <Paperclip size={18} className="text-gray-400 group-hover:text-amber-600 transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-600 group-hover:text-amber-700 transition-colors">Click to upload document</p>
                  <p className="text-xs text-gray-400 mt-0.5">PDF, JPG, PNG — up to 10 MB</p>
                </div>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0] ?? null; onDocChange(f); e.target.value = ''; }}
            />
          </div>
        </div>
      </div>

      {/* ── Sticky Footer ────────────────────────────────── */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center gap-3 shrink-0">
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="flex-1 py-3 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Submitting…
            </>
          ) : (
            <>
              <CheckCircle2 size={16} />
              Submit Request
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function ActionPopupModal({
  actionPopup, onClose, onSubmit, submitting,
  reason, remarks, docUrl, date, subject, urgency,
  inspectorName, condition, keyNumber, handoverDeadline,
  retentionReason, requestedMonths, allotmentInfo,
  onReasonChange, onRemarksChange, onDocChange, onDateChange,
  onSubjectChange, onUrgencyChange, onInspectorNameChange,
  onConditionChange, onKeyNumberChange, onHandoverDeadlineChange,
  onRetentionReasonChange, onRequestedMonthsChange,
}: Props) {
  const type = actionPopup.type;

  if (type === 'EXTEND') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col" style={{ maxHeight: '88vh' }}>
          <ExtendForm
            allotmentInfo={allotmentInfo}
            retentionReason={retentionReason}
            requestedMonths={requestedMonths}
            remarks={remarks}
            docUrl={docUrl}
            submitting={submitting}
            onRetentionReasonChange={onRetentionReasonChange}
            onRequestedMonthsChange={onRequestedMonthsChange}
            onRemarksChange={onRemarksChange}
            onDocChange={onDocChange}
            onClose={onClose}
            onSubmit={onSubmit}
          />
        </div>
      </div>
    );
  }

  return (
    <Modal isOpen={!!type} onClose={onClose} size="sm" noPadding={false}>
      {type && (() => {
        const cfg = TYPE_CONFIG[type];
        const isGrievance   = type === 'GRIEVANCE';
        const isMaintenance = type === 'MAINTENANCE';
        const isInspection  = type === 'INSPECTION';
        const isHandover    = type === 'HANDOVER';

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {cfg.icon}
                <h3 className={`text-base font-bold ${cfg.color}`}>{cfg.title}</h3>
              </div>
              <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                <X size={16} />
              </button>
            </div>

            {isInspection && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Inspector Name *</label>
                  <input value={inspectorName} onChange={e => onInspectorNameChange(e.target.value)}
                    placeholder="Name of the inspecting officer"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Property Condition</label>
                  <div className="flex gap-2">
                    {(['Good', 'Fair', 'Poor'] as const).map(c => (
                      <button key={c} onClick={() => onConditionChange(c)}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                          condition === c
                            ? c === 'Good' ? 'bg-emerald-600 text-white border-emerald-600' : c === 'Poor' ? 'bg-red-600 text-white border-red-600' : 'bg-amber-500 text-white border-amber-500'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Opening Remarks</label>
                  <textarea value={remarks} onChange={e => onRemarksChange(e.target.value)} rows={2}
                    placeholder="Any initial observations…"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                </div>
              </>
            )}

            {isHandover && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Key Number *</label>
                  <input value={keyNumber} onChange={e => onKeyNumberChange(e.target.value)}
                    placeholder="Key / lock number"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Property Condition</label>
                  <div className="flex gap-2">
                    {(['Good', 'Fair', 'Poor'] as const).map(c => (
                      <button key={c} onClick={() => onConditionChange(c)}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                          condition === c
                            ? c === 'Good' ? 'bg-emerald-600 text-white border-emerald-600' : c === 'Poor' ? 'bg-red-600 text-white border-red-600' : 'bg-amber-500 text-white border-amber-500'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Handover Deadline</label>
                  <div className="relative">
                    <CalendarDays size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="date" value={handoverDeadline} onChange={e => onHandoverDeadlineChange(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Remarks (optional)</label>
                  <input value={remarks} onChange={e => onRemarksChange(e.target.value)}
                    placeholder="Additional remarks…"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
              </>
            )}

            {!isInspection && !isHandover && (
              <>
                {isGrievance && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Subject *</label>
                    <input value={subject} onChange={e => onSubjectChange(e.target.value)}
                      placeholder="Brief subject of your grievance"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500/20" />
                  </div>
                )}

                {isMaintenance && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Urgency Level</label>
                    <div className="flex gap-2">
                      {(['LOW', 'NORMAL', 'HIGH'] as const).map(u => (
                        <button key={u} onClick={() => onUrgencyChange(u)}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                            urgency === u
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
                  <textarea value={reason} onChange={e => onReasonChange(e.target.value)} rows={3}
                    placeholder={isGrievance ? 'Describe your grievance in detail…' : isMaintenance ? 'Describe the issue…' : 'Reason for this request…'}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Remarks (optional)</label>
                  <input value={remarks} onChange={e => onRemarksChange(e.target.value)}
                    placeholder="Additional remarks…"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>

                {type === 'VACATE' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Intended Vacate Date</label>
                    <div className="relative">
                      <CalendarDays size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="date" value={date} onChange={e => onDateChange(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                  </div>
                )}

                <DocUpload value={docUrl} onChange={onDocChange} label="Document" optional />
              </>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={onSubmit} disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>
        );
      })()}
    </Modal>
  );
}
