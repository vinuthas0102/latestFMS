import React, { useRef } from 'react';
import { RefreshCw, LogOut, AlertCircle, Wrench, HardHat, Key, CalendarDays, Info, Paperclip, X } from 'lucide-react';
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
  EXTEND:      { title: 'Extension/Retention Request', color: 'text-amber-700',   icon: <RefreshCw size={16} className="text-amber-600" /> },
  VACATE:      { title: 'Vacate Request',               color: 'text-rose-700',    icon: <LogOut size={16} className="text-rose-600" /> },
  GRIEVANCE:   { title: 'Raise Grievance',              color: 'text-slate-700',   icon: <AlertCircle size={16} className="text-slate-600" /> },
  MAINTENANCE: { title: 'Maintenance Request',          color: 'text-teal-700',    icon: <Wrench size={16} className="text-teal-600" /> },
  INSPECTION:  { title: 'Start Inspection',             color: 'text-blue-700',    icon: <HardHat size={16} className="text-blue-600" /> },
  HANDOVER:    { title: 'Record Handover',              color: 'text-emerald-700', icon: <Key size={16} className="text-emerald-600" /> },
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <RefreshCw size={16} className="text-amber-600" />
        <h3 className="text-base font-bold text-amber-700">Extension/Retention Request</h3>
      </div>

      {/* Allocation Info */}
      {allotmentInfo && (
        <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wide mb-1.5">Allocation Data</div>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <div>
                <span className="text-[9px] font-semibold text-blue-400 uppercase tracking-wide block">Quarter ID</span>
                <span className="text-xs font-semibold text-blue-800">{allotmentInfo.quarterNumber || '—'}</span>
              </div>
              <div>
                <span className="text-[9px] font-semibold text-blue-400 uppercase tracking-wide block">Block</span>
                <span className="text-xs font-semibold text-blue-800">{allotmentInfo.block || '—'}</span>
              </div>
              <div>
                <span className="text-[9px] font-semibold text-blue-400 uppercase tracking-wide block">Type</span>
                <span className="text-xs font-semibold text-blue-800">{allotmentInfo.quarterType || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Retention Details section heading */}
      <div className="border-l-4 border-amber-400 pl-3">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Retention Details</span>
      </div>

      {/* Eligibility Period Table */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Info size={12} className="text-blue-500 shrink-0" />
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">Eligibility Period for Housing Acquisition</span>
        </div>
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wide w-7">SL.</th>
                <th className="text-left px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Description</th>
                <th className="text-right px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">Eligibility Period</th>
              </tr>
            </thead>
            <tbody>
              {ELIGIBILITY_ROWS.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                  <td className="px-3 py-2 text-gray-400 font-medium">{i + 1}</td>
                  <td className="px-3 py-2 text-gray-700">{row.desc}</td>
                  <td className="px-3 py-2 text-right">
                    <span className="inline-block bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full text-[10px]">{row.period}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Penal Rent Table B */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Info size={12} className="text-rose-500 shrink-0" />
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wide">Penal Rent Applicable (Table B)</span>
        </div>
        <div className="rounded-xl border border-rose-100 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-rose-50 border-b border-rose-100">
                <th className="text-left px-3 py-2 text-[10px] font-bold text-rose-400 uppercase tracking-wide w-7">SL.</th>
                <th className="text-left px-3 py-2 text-[10px] font-bold text-rose-400 uppercase tracking-wide">Type of House</th>
                <th className="text-right px-3 py-2 text-[10px] font-bold text-rose-400 uppercase tracking-wide">Penal Rent / Month</th>
              </tr>
            </thead>
            <tbody>
              {PENAL_RENT_ROWS.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-rose-50/30'}>
                  <td className="px-3 py-2 text-gray-400 font-medium">{i + 1}</td>
                  <td className="px-3 py-2 text-gray-700 font-medium">{row.type}</td>
                  <td className="px-3 py-2 text-right">
                    <span className="inline-block bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full text-[10px]">{row.rent}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed px-1">
          Penal rent is applicable after the eligible period. It will be increased by 50% every six months on a cumulative basis.
        </p>
      </div>

      {/* Reason for Retention */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Reason for Retention <span className="text-red-500">*</span>
        </label>
        <select
          value={retentionReason}
          onChange={e => onRetentionReasonChange(e.target.value)}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-white"
        >
          {RETENTION_REASONS.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Requested Extension (Months) */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Requested Extension (Months) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          min={1}
          max={24}
          value={requestedMonths}
          onChange={e => onRequestedMonthsChange(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        />
      </div>

      {/* Justification */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Justification / Remarks</label>
        <textarea
          value={remarks}
          onChange={e => onRemarksChange(e.target.value)}
          rows={3}
          placeholder="Provide detailed justification for retaining the quarter…"
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
        />
      </div>

      {/* Attach Proof Document */}
      <div>
        {docUrl ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
            <Paperclip size={13} className="text-amber-500 shrink-0" />
            <span className="flex-1 min-w-0 text-xs font-medium text-amber-800 truncate">{docUrl.name}</span>
            <button type="button" onClick={() => onDocChange(null)} className="p-0.5 rounded text-amber-400 hover:text-red-500 transition-colors shrink-0">
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50 transition-colors w-full"
          >
            <Paperclip size={14} className="shrink-0" />
            <span>Attach Proof Document</span>
            <span className="text-gray-400 font-normal">— Upload medical certificate, school admission proof, or transfer order (PDF/JPG)</span>
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

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button onClick={onSubmit} disabled={submitting}
          className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors">
          {submitting ? 'Submitting…' : 'Submit Request'}
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
      <Modal isOpen={true} onClose={onClose} size="md" noPadding={false}>
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
      </Modal>
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
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              {cfg.icon}
              <h3 className={`text-base font-bold ${cfg.color}`}>{cfg.title}</h3>
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
