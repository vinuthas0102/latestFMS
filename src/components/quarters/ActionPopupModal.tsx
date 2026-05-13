import React from 'react';
import { RefreshCw, LogOut, AlertCircle, Wrench, HardHat, Key, CalendarDays } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { DocUpload } from '../ui/DocUpload';

type ActionType = 'EXTEND' | 'VACATE' | 'GRIEVANCE' | 'MAINTENANCE' | 'INSPECTION' | 'HANDOVER';

interface ActionPopup {
  type: ActionType | null;
  requestId: string | null;
  allotmentId: string | null;
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
}

const TYPE_CONFIG: Record<ActionType, { title: string; color: string; icon: React.ReactNode }> = {
  EXTEND:      { title: 'Extension Request',    color: 'text-amber-700',   icon: <RefreshCw size={16} className="text-amber-600" /> },
  VACATE:      { title: 'Vacate Request',        color: 'text-rose-700',    icon: <LogOut size={16} className="text-rose-600" /> },
  GRIEVANCE:   { title: 'Raise Grievance',       color: 'text-slate-700',   icon: <AlertCircle size={16} className="text-slate-600" /> },
  MAINTENANCE: { title: 'Maintenance Request',   color: 'text-teal-700',    icon: <Wrench size={16} className="text-teal-600" /> },
  INSPECTION:  { title: 'Start Inspection',      color: 'text-blue-700',    icon: <HardHat size={16} className="text-blue-600" /> },
  HANDOVER:    { title: 'Record Handover',       color: 'text-emerald-700', icon: <Key size={16} className="text-emerald-600" /> },
};

export function ActionPopupModal({
  actionPopup, onClose, onSubmit, submitting,
  reason, remarks, docUrl, date, subject, urgency,
  inspectorName, condition, keyNumber, handoverDeadline,
  onReasonChange, onRemarksChange, onDocChange, onDateChange,
  onSubjectChange, onUrgencyChange, onInspectorNameChange,
  onConditionChange, onKeyNumberChange, onHandoverDeadlineChange,
}: Props) {
  const type = actionPopup.type;

  return (
    <Modal isOpen={!!type} onClose={onClose} size="sm" noPadding={false}>
      {type && (() => {
        const cfg = TYPE_CONFIG[type];
        const isGrievance   = type === 'GRIEVANCE';
        const isMaintenance = type === 'MAINTENANCE';
        const isInspection  = type === 'INSPECTION';
        const isHandover    = type === 'HANDOVER';
        const hasDate       = type === 'EXTEND' || type === 'VACATE';

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

                {hasDate && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      {type === 'EXTEND' ? 'Extension Until Date' : 'Intended Vacate Date'}
                    </label>
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
