import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, Send, Search, Filter, Building2, X, ArrowRightCircle,
  CalendarDays, Paperclip, Bed, Ruler, Layers, IndianRupee, CheckCircle2, MapPin,
} from 'lucide-react';
import { DocUpload } from '../ui/DocUpload';
import { fmtINR, getImage } from './quarterShared';
import { Quarter } from '../../services/quartersService';
import { UserDTO } from '../../types';
import { QUARTER_TYPE_OPTIONS } from '../../utils/quarterDisplay';

type UpgradeMode = 'AUTO' | 'SELECTED';

interface UpgradeSubmitInput {
  reason: string;
  remarks: string;
  required_bhk_config: string;
  move_in_date: string;
  document_url?: string;
  upgrade_mode: UpgradeMode;
  target_quarter_id: string | null;
}

interface Props {
  user: UserDTO | null;
  currentQuarter: Quarter | null;
  availableQuarters: Quarter[];
  quartersLoading: boolean;
  onClose: () => void;
  onSubmit: (input: UpgradeSubmitInput) => Promise<void>;
  addToast: (msg: string, type: 'success' | 'error' | 'warning') => void;
}

export const UpgradeRequestModal: React.FC<Props> = ({
  user, currentQuarter, availableQuarters, quartersLoading,
  onClose, onSubmit, addToast,
}) => {
  const [upgradeMode, setUpgradeMode] = useState<UpgradeMode>('AUTO');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [requiredBhk, setRequiredBhk] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState('');
  const [filterBhk, setFilterBhk] = useState('');
  const [filterFurnishing, setFilterFurnishing] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = availableQuarters
    .filter(q => {
      if (search) {
        const s = search.toLowerCase();
        if (
          !q.quarter_number?.toLowerCase().includes(s) &&
          !q.block_name?.toLowerCase().includes(s) &&
          !q.address?.toLowerCase().includes(s) &&
          !q.quarter_type?.toLowerCase().includes(s)
        ) return false;
      }
      if (filterBhk && q.quarter_type !== filterBhk) return false;
      if (filterFurnishing && q.furnishing_status !== filterFurnishing) return false;
      return true;
    })
    .sort((a, b) => {
      if (filterSortBy === 'rent_asc') return a.monthly_rent - b.monthly_rent;
      if (filterSortBy === 'rent_desc') return b.monthly_rent - a.monthly_rent;
      return 0;
    });

  const canSubmit = reason.trim().length > 0 && (upgradeMode === 'AUTO' || selectedQuarter !== null);

  const handleSubmit = async () => {
    if (!reason.trim()) { addToast('Please provide a reason for the upgrade', 'warning'); return; }
    if (upgradeMode === 'SELECTED' && !selectedQuarter) { addToast('Please select a target quarter', 'warning'); return; }
    setSubmitting(true);
    try {
      await onSubmit({
        reason, remarks, required_bhk_config: requiredBhk, move_in_date: moveInDate,
        document_url: docFile?.name,
        upgrade_mode: upgradeMode,
        target_quarter_id: upgradeMode === 'SELECTED' ? (selectedQuarter?.id ?? null) : null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] bg-gray-50 flex flex-col" style={{ fontFamily: 'inherit' }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-4 px-6 py-3.5 bg-white border-b border-gray-200 shadow-sm shrink-0">
        <button onClick={onClose}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors p-1.5 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={16} /><span>Back</span>
        </button>
        <div className="h-5 w-px bg-gray-200" />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-full bg-sky-600 flex items-center justify-center shrink-0">
            <ArrowRightCircle size={14} className="text-white" />
          </div>
          <h1 className="text-base font-bold text-gray-900">Upgrade Quarter Request</h1>
        </div>

        {user && (
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-sky-50 border border-sky-100 rounded-xl shrink-0">
            <div className="w-8 h-8 rounded-full bg-sky-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
              {user.fullName?.charAt(0) ?? 'U'}
            </div>
            <div className="text-left leading-snug">
              <div className="text-[13px] font-semibold text-sky-900 whitespace-nowrap leading-tight">{user.fullName}</div>
              <div className="text-[11px] text-sky-500 whitespace-nowrap leading-tight">{user.govtDepartment || '—'}</div>
            </div>
            <div className="w-px h-8 bg-sky-200 mx-1" />
            <div className="text-left leading-none">
              <div className="text-[9px] text-sky-400 uppercase tracking-wider font-semibold">EMP ID</div>
              <div className="text-[12px] font-semibold text-sky-900 whitespace-nowrap mt-0.5">{user.govtEmployeeId || '—'}</div>
            </div>
            {user.projectLocation && <>
              <div className="w-px h-8 bg-sky-200 mx-1" />
              <div className="text-left leading-none">
                <div className="text-[9px] text-sky-400 uppercase tracking-wider font-semibold">Location</div>
                <div className="text-[12px] font-semibold text-sky-900 whitespace-nowrap mt-0.5">{user.projectLocation}</div>
              </div>
            </>}
            {user.sapId && <>
              <div className="w-px h-8 bg-sky-200 mx-1" />
              <div className="text-left leading-none">
                <div className="text-[9px] text-sky-400 uppercase tracking-wider font-semibold">SAP ID</div>
                <div className="text-[12px] font-semibold text-sky-900 whitespace-nowrap mt-0.5">{user.sapId}</div>
              </div>
            </>}
          </div>
        )}

        <button onClick={handleSubmit} disabled={submitting || !canSubmit}
          className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 shrink-0">
          <Send size={14} />{submitting ? 'Submitting…' : 'Submit Upgrade Request'}
        </button>
      </div>

      {/* ── Top band: form ── */}
      <div className="shrink-0 bg-gray-50 border-b border-gray-200 px-6 py-4 space-y-4">

        {/* Mode toggle */}
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-2">Upgrade Mode <span className="text-red-500">*</span></div>
          <div className="inline-flex rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <button onClick={() => { setUpgradeMode('AUTO'); setSelectedQuarter(null); }}
              className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${upgradeMode === 'AUTO' ? 'bg-sky-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Building2 size={14} />Upgrade me to an available property
            </button>
            <button onClick={() => setUpgradeMode('SELECTED')}
              className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 border-l border-gray-200 ${upgradeMode === 'SELECTED' ? 'bg-sky-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Search size={14} />Upgrade me to my selected property
            </button>
          </div>
          {upgradeMode === 'AUTO'
            ? <p className="text-xs text-gray-400 mt-1.5">The Estate Manager will assign a suitable available quarter on your behalf.</p>
            : <p className="text-xs text-sky-600 mt-1.5">Browse and select the specific quarter you want to upgrade to below.</p>
          }
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Upgrade Reason <span className="text-red-500">*</span></label>
            <input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Family size increase"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 bg-white" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Preferred Quarter Type</label>
            <select value={requiredBhk} onChange={e => setRequiredBhk(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 bg-white">
              <option value="">Any</option>
              {QUARTER_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Preferred Move-in Date</label>
            <div className="relative">
              <CalendarDays size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="date" value={moveInDate} onChange={e => setMoveInDate(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 bg-white" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Remarks (optional)</label>
            <input value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Any additional notes"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 bg-white" />
          </div>
        </div>

        {/* Document upload */}
        <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <Paperclip size={13} className="text-gray-500" />
            <span className="text-xs font-bold text-gray-700">Supporting Document</span>
            <span className="text-xs text-gray-400 ml-1">(optional)</span>
          </div>
          <div className="px-4 py-3">
            <DocUpload value={docFile} onChange={setDocFile} optional />
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      {upgradeMode === 'SELECTED' ? (
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-0">

          {/* Col A: available quarters */}
          <div className="flex flex-col border-r border-gray-200 min-h-0 bg-white">
            <div className="px-4 pt-4 pb-3 border-b border-gray-200 bg-white shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Search size={15} className="text-gray-500" />Available Quarters
                  <span className="text-xs font-normal text-gray-400">({filtered.length})</span>
                </h2>
                <div className="relative" ref={filterRef}>
                  <button onClick={() => setFilterOpen(v => !v)}
                    className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      (filterBhk || filterFurnishing || filterSortBy)
                        ? 'bg-sky-50 border-sky-200 text-sky-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}>
                    <Filter size={13} />Filters
                    {(filterBhk || filterFurnishing || filterSortBy) && (
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 absolute -top-0.5 -right-0.5" />
                    )}
                  </button>
                  {filterOpen && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-gray-200 shadow-xl z-50 p-4 space-y-4">
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quarter Type</div>
                        <div className="flex flex-wrap gap-1.5">
                          {(['', ...QUARTER_TYPE_OPTIONS] as string[]).map(v => (
                            <button key={v} onClick={() => setFilterBhk(v)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${filterBhk === v ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                              {v || 'Any'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Furnishing</div>
                        <div className="flex flex-wrap gap-1.5">
                          {['', 'Furnished', 'Semi-Furnished', 'Unfurnished'].map(v => (
                            <button key={v} onClick={() => setFilterFurnishing(v)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${filterFurnishing === v ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                              {v || 'Any'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sort by</div>
                        <div className="flex flex-wrap gap-1.5">
                          {[{ value: '', label: 'Default' }, { value: 'rent_asc', label: 'Rent ↑' }, { value: 'rent_desc', label: 'Rent ↓' }].map(({ value, label }) => (
                            <button key={value} onClick={() => setFilterSortBy(value)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${filterSortBy === value ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                        <button onClick={() => { setFilterBhk(''); setFilterFurnishing(''); setFilterSortBy(''); }}
                          className="text-xs text-gray-500 hover:text-gray-800 transition-colors">Clear all</button>
                        <button onClick={() => setFilterOpen(false)}
                          className="px-3 py-1.5 bg-sky-600 text-white text-xs font-medium rounded-lg hover:bg-sky-700 transition-colors">Done</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by number, block, address…"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {quartersLoading ? (
                Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-16">
                  <Building2 size={32} className="mb-2 opacity-30" />
                  <p className="text-sm">No available quarters found</p>
                  <p className="text-xs mt-1">Try adjusting your search or filters</p>
                </div>
              ) : filtered.map((q, i) => {
                const isSelected = selectedQuarter?.id === q.id;
                return (
                  <div key={q.id} onClick={() => setSelectedQuarter(isSelected ? null : q)}
                    className={`flex items-center gap-3 border rounded-xl p-3 cursor-pointer transition-all ${
                      isSelected ? 'bg-sky-50 border-sky-300 shadow-sm ring-1 ring-sky-300' : 'bg-gray-50 border-gray-100 hover:bg-white hover:border-gray-200 hover:shadow-sm'
                    }`}>
                    <img src={getImage(q, i)} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm">{q.quarter_number}</div>
                      <div className="text-xs text-gray-500 truncate">{q.address || (q.block_name ? `Block ${q.block_name}` : '')}</div>
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-gray-600 mt-0.5">
                        {q.quarter_type && <span className="font-medium text-gray-700">{q.quarter_type}</span>}
                        {q.block_name && <span>Block {q.block_name}</span>}
                        {q.floor_number != null && <span>Fl. {q.floor_number}</span>}
                        <span className="font-semibold text-gray-900">{fmtINR(q.monthly_rent)}</span>
                      </div>
                    </div>
                    {isSelected
                      ? <CheckCircle2 size={18} className="text-sky-600 shrink-0" />
                      : <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
                    }
                  </div>
                );
              })}
            </div>
          </div>

          {/* Col B: comparison */}
          <div className="flex flex-col min-h-0 bg-gray-50">
            <div className="px-4 pt-4 pb-3 border-b border-gray-200 bg-white shrink-0">
              <h2 className="text-sm font-bold text-gray-800">Upgrade Comparison</h2>
              <p className="text-xs text-gray-500 mt-1">Your current quarter vs. your selected target</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Current Quarter (FROM)</div>
                {currentQuarter
                  ? <ComparisonCard quarter={currentQuarter} index={0} variant="from" />
                  : <div className="rounded-xl border border-gray-200 bg-white p-4 text-center text-xs text-gray-400">No current quarter data</div>
                }
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Target Quarter (TO)</span>
                  {selectedQuarter && (
                    <button onClick={() => setSelectedQuarter(null)}
                      className="text-red-400 hover:text-red-600 transition-colors flex items-center gap-0.5 text-[10px] font-medium">
                      <X size={10} /> Clear
                    </button>
                  )}
                </div>
                {selectedQuarter
                  ? <ComparisonCard quarter={selectedQuarter} index={1} variant="to" />
                  : (
                    <div className="rounded-xl border-2 border-dashed border-sky-200 bg-sky-50/50 p-6 text-center">
                      <Search size={24} className="mx-auto mb-2 text-sky-300" />
                      <p className="text-sm font-medium text-sky-600">Select a quarter from the list</p>
                      <p className="text-xs text-sky-400 mt-1">Click any available quarter on the left to select it as your upgrade target</p>
                    </div>
                  )
                }
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-sky-100 flex items-center justify-center mx-auto mb-4">
              <Building2 size={28} className="text-sky-600" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">Estate Manager Will Assign</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Your upgrade request will be reviewed by the Estate Manager, who will assign an appropriate available quarter based on your entitlement and availability.
            </p>
            <div className="mt-4 flex flex-col items-center gap-2">
              {requiredBhk && (
                <div className="flex items-center gap-1.5 text-xs text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-full">
                  <Bed size={11} /> Preferred: {requiredBhk}
                </div>
              )}
              {moveInDate && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                  <CalendarDays size={11} /> Move-in by: {moveInDate}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

const ComparisonCard: React.FC<{ quarter: Quarter; index: number; variant: 'from' | 'to' }> = ({ quarter, index, variant }) => (
  <div className={`rounded-xl border bg-white overflow-hidden shadow-sm ${variant === 'to' ? 'border-sky-300 ring-1 ring-sky-200' : 'border-gray-200'}`}>
    <div className="relative">
      <img src={getImage(quarter, index)} alt="" className="w-full h-28 object-cover" />
      <div className={`absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow ${variant === 'to' ? 'bg-sky-600' : 'bg-gray-700'}`}>
        {variant === 'to' ? 'Selected Target' : 'Current'}
      </div>
    </div>
    <div className="p-3 space-y-1.5">
      <div className="font-semibold text-gray-900 text-sm">{quarter.quarter_number}</div>
      {quarter.address && (
        <div className="flex items-start gap-1 text-xs text-gray-500">
          <MapPin size={10} className="mt-0.5 shrink-0" /><span className="line-clamp-2">{quarter.address}</span>
        </div>
      )}
      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs mt-1">
        {quarter.quarter_type && <span className="flex items-center gap-1 text-gray-700 font-medium"><Bed size={10} />{quarter.quarter_type}</span>}
        {quarter.area_sqft > 0 && <span className="flex items-center gap-1 text-gray-600"><Ruler size={10} />{quarter.area_sqft} sq.ft</span>}
        {quarter.floor_number != null && <span className="flex items-center gap-1 text-gray-600"><Layers size={10} />Fl. {quarter.floor_number}</span>}
        <span className={`flex items-center gap-0.5 font-semibold ${variant === 'to' ? 'text-sky-700' : 'text-gray-800'}`}>
          <IndianRupee size={10} />{fmtINR(quarter.monthly_rent).replace('₹', '')}/mo
        </span>
      </div>
      {quarter.furnishing_status && (
        <span className="inline-block text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{quarter.furnishing_status}</span>
      )}
    </div>
  </div>
);
