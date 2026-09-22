import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, User, FileText, X, Send, CheckSquare, Square, ChevronDown, Plus, Mail, Trash2 } from 'lucide-react';
import type { QuarterTenantRequest } from '../../../services/quartersService';

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

export const DISPATCH_TARGETS = [
  { id: 'emp', name: 'Suresh Nair (Employee)', role: 'Allottee', email: 'suresh.nair@gov.in' },
  { id: 'insp-001', name: 'Rajiv Sharma', role: 'Senior Inspector', email: 'rajiv.sharma@gov.in' },
  { id: 'eo', name: 'Estate Office', role: 'Estate Office', email: 'estate.office@gov.in' },
  { id: 'maint', name: 'Maintenance Cell', role: 'Maintenance', email: 'maintenance@gov.in' },
];

export interface AdhocRecipient {
  name: string;
  email: string;
}

interface Props {
  tr: QuarterTenantRequest;
  onClose: () => void;
  onSubmit: (data: { date: string; timeSlot: string; inspectorId: string; inspectorName: string; remarks: string; dispatchTargets: string[]; adhocRecipients: AdhocRecipient[] }) => void;
  submitting: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ScheduleInspectionModal: React.FC<Props> = ({ tr, onClose, onSubmit, submitting }) => {
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [inspectorId, setInspectorId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [dispatchIds, setDispatchIds] = useState<string[]>(['emp', 'eo']);
  const [adhocRecipients, setAdhocRecipients] = useState<AdhocRecipient[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [adhocName, setAdhocName] = useState('');
  const [adhocEmail, setAdhocEmail] = useState('');
  const [adhocError, setAdhocError] = useState('');
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const dropdownBtnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const q = tr.allotment?.quarter;
  const toggleDispatch = (id: string) => {
    setDispatchIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const computePanelPos = useCallback(() => {
    const btn = dropdownBtnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const panelMaxH = 320;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < panelMaxH + 16 && rect.top > panelMaxH + 16
      ? rect.top - panelMaxH - 8
      : rect.bottom + 8;
    setPanelPos({ top: Math.max(8, top), left: rect.left, width: rect.width });
  }, []);

  const openDropdown = () => {
    computePanelPos();
    setDropdownOpen(true);
  };

  const closeDropdown = () => {
    setDropdownOpen(false);
    setAdhocError('');
  };

  const toggleDropdown = () => {
    if (dropdownOpen) closeDropdown();
    else openDropdown();
  };

  // Close on click-outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (dropdownBtnRef.current?.contains(target)) return;
      closeDropdown();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  // Recompute / close on scroll and resize
  useEffect(() => {
    if (!dropdownOpen) return;
    const onScroll = (e: Event) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      closeDropdown();
    };
    const onResize = () => computePanelPos();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [dropdownOpen, computePanelPos]);

  const totalSelected = dispatchIds.length + adhocRecipients.length;

  const addAdhocRecipient = () => {
    setAdhocError('');
    const name = adhocName.trim();
    const email = adhocEmail.trim();
    if (!name) { setAdhocError('Please enter a name.'); return; }
    if (!email) { setAdhocError('Please enter an email address.'); return; }
    if (!EMAIL_RE.test(email)) { setAdhocError('Please enter a valid email address.'); return; }
    if (adhocRecipients.some(r => r.email.toLowerCase() === email.toLowerCase())) {
      setAdhocError('This email has already been added.'); return;
    }
    setAdhocRecipients(prev => [...prev, { name, email }]);
    setAdhocName('');
    setAdhocEmail('');
  };

  const removeAdhocRecipient = (idx: number) => {
    setAdhocRecipients(prev => prev.filter((_, i) => i !== idx));
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
      adhocRecipients,
    });
  };

  const panelContent = dropdownOpen && panelPos ? (
    <div
      ref={panelRef}
      className="fixed z-[60] bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
      style={{ top: panelPos.top, left: panelPos.left, width: panelPos.width }}
    >
      <div className="max-h-80 overflow-y-auto">
        {/* Preset targets */}
        <div className="px-3 pt-2.5 pb-1">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Preset Recipients</span>
        </div>
        {DISPATCH_TARGETS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => toggleDispatch(t.id)}
            className={`w-full flex items-center gap-3 px-3.5 py-2 transition-all ${
              dispatchIds.includes(t.id) ? 'bg-sky-50/60' : 'hover:bg-gray-50'
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

        {/* Ad-hoc recipients added */}
        {adhocRecipients.length > 0 && (
          <>
            <div className="mx-3 border-t border-gray-100 my-1.5" />
            <div className="px-3 pt-1 pb-1">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Custom Recipients</span>
            </div>
            {adhocRecipients.map((r, idx) => (
              <div key={idx} className="w-full flex items-center gap-3 px-3.5 py-2 bg-sky-50/40">
                <CheckSquare size={15} className="text-sky-600 shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-700 truncate flex items-center gap-1.5">
                    {r.name}
                    <span className="text-[8px] font-bold text-sky-600 bg-sky-100 rounded px-1 py-0.5 leading-none">CUSTOM</span>
                  </div>
                  <div className="text-[11px] text-gray-400 truncate">{r.email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => removeAdhocRecipient(idx)}
                  className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </>
        )}

        {/* Add ad-hoc recipient form */}
        <div className="mx-3 border-t border-gray-100 my-1.5" />
        <div className="px-3 pt-1.5 pb-1">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Add Custom Recipient</span>
        </div>
        <div className="px-3 pb-3 space-y-2">
          <input
            type="text"
            value={adhocName}
            onChange={e => { setAdhocName(e.target.value); setAdhocError(''); }}
            placeholder="Recipient name"
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-colors"
          />
          <input
            type="email"
            value={adhocEmail}
            onChange={e => { setAdhocEmail(e.target.value); setAdhocError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAdhocRecipient(); } }}
            placeholder="email@example.com"
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-colors"
          />
          {adhocError && <p className="text-[10px] text-red-500 font-medium">{adhocError}</p>}
          <button
            type="button"
            onClick={addAdhocRecipient}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-all"
          >
            <Plus size={13} />Add Recipient
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden" style={{ maxHeight: '94vh' }}>

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

          {/* Auto-Dispatch Targets — Multi-Select Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Auto-Dispatch Targets</label>
            <p className="text-[11px] text-gray-400 mb-2.5">Updates will be emailed to the selected recipients.</p>
            <button
              ref={dropdownBtnRef}
              type="button"
              onClick={toggleDropdown}
              className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm border rounded-xl transition-all bg-white ${
                dropdownOpen ? 'border-sky-400 ring-2 ring-sky-400/30' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Mail size={14} className="text-gray-400 shrink-0" />
                <span className="truncate text-gray-700">
                  {totalSelected === 0 ? 'Select recipients…' : `${totalSelected} recipient${totalSelected > 1 ? 's' : ''} selected`}
                </span>
              </div>
              <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
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

      {panelContent && createPortal(panelContent, document.body)}
    </div>
  );
};
