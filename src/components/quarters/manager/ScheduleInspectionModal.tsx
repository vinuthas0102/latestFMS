import React, { useState } from 'react';
import { Calendar, Clock, User, FileText, X, Send, CheckSquare, Square } from 'lucide-react';
import type { QuarterTenantRequest, Quarter } from '../../../services/quartersService';

const TIME_SLOTS = [
  '09:00 AM – 11:00 AM',
  '11:00 AM – 01:00 PM',
  '02:00 PM – 04:00 PM',
  '03:00 PM – 05:00 PM',
  '04:00 PM – 06:00 PM',
];

const INSPECTORS = [
  { id: 'self', name: 'Self (Estate Manager)', role: 'Estate Manager' },
  { id: 'insp-001', name: 'Rajiv Sharma', role: 'Senior Inspector' },
  { id: 'insp-002', name: 'Priya Menon', role: 'Inspector' },
  { id: 'insp-003', name: 'Amit Verma', role: 'Inspector' },
  { id: 'insp-004', name: 'Kavitha Rao', role: 'Junior Inspector' },
];

const DISPATCH_TARGETS = [
  { id: 'emp', name: 'Suresh Nair (Employee)', role: 'Allottee', email: 'suresh.nair@gov.in' },
  { id: 'insp-001', name: 'Rajiv Sharma', role: 'Senior Inspector', email: 'rajiv.sharma@gov.in' },
  { id: 'eo', name: 'Estate Office', role: 'Estate Office', email: 'estate.office@gov.in' },
  { id: 'maint', name: 'Maintenance Cell', role: 'Maintenance', email: 'maintenance@gov.in' },
];

interface Props {
  tr: QuarterTenantRequest;
  onClose: () => void;
  onSubmit: (data: { date: string; timeSlot: string; inspectorId: string; inspectorName: string; remarks: string; dispatchTargets: string[] }) => void;
  submitting: boolean;
}

export const ScheduleInspectionModal: React.FC<Props> = ({ tr, onClose, onSubmit, submitting }) => {
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [inspectorId, setInspectorId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [dispatchIds, setDispatchIds] = useState<string[]>(['emp', 'eo']);

  const q = tr.allotment?.quarter;
  const toggleDispatch = (id: string) => {
    setDispatchIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const canSubmit = date && timeSlot && inspectorId;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const insp = INSPECTORS.find(i => i.id === inspectorId);
    onSubmit({
      date,
      timeSlot,
      inspectorId,
      inspectorName: insp?.name ?? '',
      remarks,
      dispatchTargets: dispatchIds,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden" style={{ maxHeight: '92vh' }}>

        <div className="shrink-0 bg-gradient-to-r from-sky-700 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <Calendar size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Schedule Inspection</h2>
              <p className="text-xs text-sky-200 mt-0.5 leading-tight">
                {q?.quarter_number ?? 'Quarter'}{q?.bhk_config ? ` · ${q.bhk_config}` : ''} · Vacate Request
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all shrink-0 ml-4">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Allottee & Quarter Info */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Vacate Request Details</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-gray-500">Allottee:</span> <span className="font-medium text-gray-800">Suresh Nair</span></div>
              <div><span className="text-gray-500">Quarter:</span> <span className="font-medium text-gray-800">{q?.quarter_number ?? '—'}</span></div>
              <div><span className="text-gray-500">Block:</span> <span className="font-medium text-gray-800">{q?.block_name ?? '—'}</span></div>
              <div><span className="text-gray-500">Type:</span> <span className="font-medium text-gray-800">{q?.bhk_config ?? '—'}</span></div>
            </div>
          </div>

          {/* Inspection Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Inspection Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-colors"
              />
            </div>
          </div>

          {/* Time Slot */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Inspection Time <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Clock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select value={timeSlot} onChange={e => setTimeSlot(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-colors appearance-none bg-white cursor-pointer">
                <option value="" disabled>Select a time slot…</option>
                {TIME_SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}
              </select>
            </div>
          </div>

          {/* Inspected By */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Inspected By (Lead Officer) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select value={inspectorId} onChange={e => setInspectorId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-colors appearance-none bg-white cursor-pointer">
                <option value="" disabled>Select an inspector…</option>
                {INSPECTORS.map(insp => <option key={insp.id} value={insp.id}>{insp.name} — {insp.role}</option>)}
              </select>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Inspection Remarks and Guidelines <span className="text-gray-400 font-normal">(Optional)</span></label>
            <div className="relative">
              <FileText size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
              <textarea
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                rows={3}
                placeholder="Enter any relevant remarks or guidelines for the inspection…"
                className="w-full pl-9 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 resize-none placeholder-gray-300 transition-colors"
              />
            </div>
          </div>

          {/* Auto-Dispatch Targets */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Auto-Dispatch Targets</label>
            <p className="text-[11px] text-gray-400 mb-2.5">Updates will be emailed to the selected recipients.</p>
            <div className="space-y-2">
              {DISPATCH_TARGETS.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleDispatch(t.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all ${
                    dispatchIds.includes(t.id)
                      ? 'bg-sky-50/60 border-sky-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {dispatchIds.includes(t.id)
                    ? <CheckSquare size={15} className="text-sky-600 shrink-0" />
                    : <Square size={15} className="text-gray-300 shrink-0" />
                  }
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-700 truncate">{t.name}</div>
                    <div className="text-[11px] text-gray-400 truncate">{t.email}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-bold hover:bg-sky-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Scheduling…
              </>
            ) : (
              <>
                <Send size={15} />
                Submit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
