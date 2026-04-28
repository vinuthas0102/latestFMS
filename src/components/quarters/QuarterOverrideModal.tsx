import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Search, Plus, AlertCircle, CheckCircle, ArrowLeftRight,
  Shuffle, PauseCircle, Star, Bed, Ruler, MapPin
} from 'lucide-react';
import { quartersService, QuarterAllotment, QuarterRequest, Quarter } from '../../services/quartersService';
import { useUIStore } from '../../stores/uiStore';

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80',
];
function getImage(q: Quarter, idx: number) {
  let images = q.images;
  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch {
      images = (images as unknown as string).replace(/^\{/, '').replace(/\}$/, '').split(',').map((s: string) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
    }
  }
  const first = Array.isArray(images) && images.length > 0 ? images[0] : null;
  return first || PLACEHOLDER_IMAGES[idx % PLACEHOLDER_IMAGES.length];
}
function fmtINR(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

type ActionType = 'pref' | 'new' | 'swap' | 'swapPref' | 'hold';

const ACTION_TABS: { key: ActionType; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    key: 'pref',
    label: 'Assign another preference',
    icon: <Star size={14} />,
    desc: 'Pick a different preference rank from Request A\'s list and apply. The previously allotted property returns to the available pool.',
  },
  {
    key: 'new',
    label: 'Assign new available property',
    icon: <Plus size={14} />,
    desc: 'Find any available quarter from the left panel and assign it directly to this request.',
  },
  {
    key: 'swap',
    label: 'Interchange with Request B',
    icon: <ArrowLeftRight size={14} />,
    desc: 'Select another allotment (Request B) from the left panel. A and B will swap their allotted quarters.',
  },
  {
    key: 'swapPref',
    label: "Swap B's property + assign B a new pref",
    icon: <Shuffle size={14} />,
    desc: "Take B's allotted quarter for A, then assign B one of B's other preferences. Select B from the left, then pick B's new preference from the right.",
  },
  {
    key: 'hold',
    label: 'Mark on Hold',
    icon: <PauseCircle size={14} />,
    desc: 'Pause allotment for this request. The quarter returns to the pool. Employee will be notified.',
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  allotment: QuarterAllotment | null;
  allCycleAllotments: QuarterAllotment[];
  eoAuthId: string;
  onOverrideSaved: () => void;
}

export const QuarterOverrideModal: React.FC<Props> = ({
  isOpen, onClose, allotment, allCycleAllotments, eoAuthId, onOverrideSaved,
}) => {
  const addToast = useUIStore(s => s.addToast);
  const [action, setAction] = useState<ActionType>('pref');
  const [justification, setJustification] = useState('');
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [selectedPrefRank, setSelectedPrefRank] = useState<number | null>(null);
  const [leftSearch, setLeftSearch] = useState('');
  const [availableQuarters, setAvailableQuarters] = useState<Quarter[]>([]);
  const [saving, setSaving] = useState(false);

  const reqA = allotment?.request as QuarterRequest | undefined;
  const reqAPrefs = (reqA?.preferences ?? []).sort((a, b) => a.preference_rank - b.preference_rank);
  const allottedQuarterId = allotment?.quarter?.id;

  useEffect(() => {
    if (!isOpen) return;
    setAction('pref');
    setJustification('');
    setSelectedLeftId(null);
    setSelectedPrefRank(null);
    setLeftSearch('');
  }, [isOpen, allotment?.id]);

  const loadAvailable = useCallback(async () => {
    try {
      const data = await quartersService.getQuarters({
        occupancy_status: 'AVAILABLE',
        search: leftSearch || undefined,
      });
      setAvailableQuarters(data);
    } catch { /* silent */ }
  }, [leftSearch]);

  useEffect(() => {
    if (isOpen && (action === 'new')) {
      const t = setTimeout(loadAvailable, 250);
      return () => clearTimeout(t);
    }
  }, [isOpen, action, loadAvailable]);

  if (!isOpen || !allotment) return null;

  const actionMeta = ACTION_TABS.find(a => a.key === action)!;

  // Left panel items by action
  const leftItems: React.ReactNode = (() => {
    if (action === 'new') {
      const filtered = availableQuarters.filter(q =>
        !leftSearch || q.quarter_number.toLowerCase().includes(leftSearch.toLowerCase()) || (q.address || '').toLowerCase().includes(leftSearch.toLowerCase())
      );
      return filtered.map((q, i) => (
        <div
          key={q.id}
          onClick={() => setSelectedLeftId(q.id)}
          className={`flex items-center gap-3 rounded-xl p-3 cursor-pointer border transition-all ${
            selectedLeftId === q.id ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'
          }`}
        >
          <img src={getImage(q, i)} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-gray-900">{q.quarter_number}</div>
            <div className="text-xs text-gray-500 truncate">{q.address || q.block_name}</div>
            <div className="flex gap-3 text-xs text-gray-600 mt-1">
              <span>{q.bhk_config}</span>
              <span>{q.area_sqft} sq.ft</span>
              <span className="font-medium text-gray-800">{fmtINR(q.monthly_rent)}</span>
            </div>
          </div>
          {selectedLeftId === q.id && <CheckCircle size={16} className="text-blue-600 shrink-0" />}
        </div>
      ));
    }

    if (action === 'swap' || action === 'swapPref') {
      const others = allCycleAllotments.filter(a => a.id !== allotment.id);
      const filtered = others.filter(a => {
        const q = a.quarter as Quarter | undefined;
        const r = a.request as QuarterRequest | undefined;
        if (!leftSearch) return true;
        return (
          q?.quarter_number.toLowerCase().includes(leftSearch.toLowerCase()) ||
          r?.request_number.toLowerCase().includes(leftSearch.toLowerCase())
        );
      });
      return filtered.map(a => {
        const q = a.quarter as Quarter | undefined;
        const r = a.request as QuarterRequest | undefined;
        return (
          <div
            key={a.id}
            onClick={() => setSelectedLeftId(a.id)}
            className={`flex items-center gap-3 rounded-xl p-3 cursor-pointer border transition-all ${
              selectedLeftId === a.id ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            {q && <img src={getImage(q, 0)} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-900">{q?.quarter_number ?? '—'}</div>
              <div className="text-xs font-mono text-gray-500">{r?.request_number}</div>
              <div className="text-xs text-gray-600 mt-1">{q?.bhk_config} · {fmtINR(q?.monthly_rent ?? 0)}</div>
            </div>
            {selectedLeftId === a.id && <CheckCircle size={16} className="text-blue-600 shrink-0" />}
          </div>
        );
      });
    }

    // pref / hold: show other allotments for context
    const others = allCycleAllotments.filter(a => a.id !== allotment.id).slice(0, 6);
    return others.map(a => {
      const q = a.quarter as Quarter | undefined;
      return (
        <div key={a.id} className="flex items-center gap-3 rounded-xl p-3 border border-gray-100 bg-white">
          {q && <img src={getImage(q, 0)} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-gray-900">{q?.quarter_number}</div>
            <div className="text-xs text-gray-500">{(a.request as QuarterRequest | undefined)?.request_number}</div>
          </div>
        </div>
      );
    });
  })();

  const canApply = (() => {
    if (!justification.trim()) return false;
    if (action === 'pref') return selectedPrefRank !== null;
    if (action === 'new') return !!selectedLeftId;
    if (action === 'swap' || action === 'swapPref') return !!selectedLeftId;
    if (action === 'hold') return true;
    return false;
  })();

  const handleApply = async () => {
    if (!canApply) return;
    setSaving(true);
    try {
      let newQuarterId: string | undefined;

      if (action === 'new' && selectedLeftId) {
        newQuarterId = selectedLeftId;
      } else if (action === 'pref' && selectedPrefRank !== null) {
        const pref = reqAPrefs.find(p => p.preference_rank === selectedPrefRank);
        newQuarterId = pref?.quarter_id;
      }

      await quartersService.saveOverride(eoAuthId, {
        allotment_id: allotment.id,
        request_a_id: reqA!.id,
        request_b_id: (action === 'swap' || action === 'swapPref')
          ? (allCycleAllotments.find(a => a.id === selectedLeftId)?.request as QuarterRequest | undefined)?.id
          : undefined,
        action_type: action.toUpperCase(),
        justification,
        new_quarter_id: newQuarterId,
      });

      addToast('Override applied successfully', 'success');
      onOverrideSaved();
      onClose();
    } catch {
      addToast('Failed to apply override', 'error');
    } finally {
      setSaving(false);
    }
  };

  const reqAAllottedQ = allotment.quarter as Quarter | undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Override Allotment</h2>
            <p className="text-xs text-gray-500 mt-0.5">All actions require EO justification and will be audit-logged.</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Request A Banner */}
        <div className="px-6 pt-3 pb-2">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4">
            {reqAAllottedQ && (
              <img src={getImage(reqAAllottedQ, 0)} alt="" className="w-20 h-16 rounded-lg object-cover shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-sm mb-2">Request A — being overridden</div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                {[
                  { label: 'Request ID', value: reqA?.request_number ?? '—' },
                  { label: 'Required Config', value: reqA?.required_bhk_config || '—' },
                  { label: 'Allotted Quarter', value: reqAAllottedQ?.quarter_number ?? '—' },
                  { label: 'Preference Used', value: `P-${reqAPrefs.find(p => p.quarter_id === allottedQuarterId)?.preference_rank ?? '?'}` },
                  { label: 'Status', value: allotment.approval_status },
                ].map(f => (
                  <div key={f.label}>
                    <div className="text-gray-500 text-[10px] uppercase tracking-wide mb-0.5">{f.label}</div>
                    <div className="font-semibold text-gray-800 truncate">{f.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 whitespace-nowrap shrink-0">
              Awaiting Override
            </span>
          </div>
        </div>

        {/* Action Tabs */}
        <div className="px-6 pb-2">
          <div className="flex gap-1 flex-wrap">
            {ACTION_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => { setAction(tab.key); setSelectedLeftId(null); setSelectedPrefRank(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  action === tab.key
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
            <AlertCircle size={12} className="inline mr-1 text-blue-500" />
            {actionMeta.desc}
          </div>
        </div>

        {/* Split Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-2 gap-0 min-h-0 border-t border-gray-100">
          {/* Left Panel */}
          <div className="flex flex-col border-r border-gray-100 min-h-0">
            <div className="px-4 pt-3 pb-2 border-b border-gray-100">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={leftSearch}
                  onChange={e => setLeftSearch(e.target.value)}
                  placeholder={action === 'new' ? 'Search available quarters…' : 'Search allotments…'}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="text-xs text-gray-500 mt-1.5">
                {action === 'new' ? 'Click to select an available quarter' : action === 'swap' || action === 'swapPref' ? 'Select Request B to interchange' : 'Other allotments in this cycle'}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {leftItems}
            </div>
          </div>

          {/* Right Panel: Request A preferences */}
          <div className="flex flex-col min-h-0 overflow-hidden">
            <div className="px-4 pt-3 pb-2 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                  <Star size={13} className="text-amber-500" />
                  {action === 'swap' || action === 'swapPref' ? 'Request B — Preferences' : 'Request A — Preferences'}
                </h3>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{reqAPrefs.length} prefs</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Currently allotted = <strong>P-{reqAPrefs.find(p => p.quarter_id === allottedQuarterId)?.preference_rank ?? '?'}</strong>.
                {action === 'pref' && ' Select a different rank and click Apply.'}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {reqAPrefs.map((pref, i) => {
                const q = pref.quarter as Quarter | undefined;
                const isCurrent = pref.quarter_id === allottedQuarterId;
                const isSelected = selectedPrefRank === pref.preference_rank;
                return (
                  <div
                    key={pref.id}
                    onClick={() => action === 'pref' && !isCurrent && setSelectedPrefRank(pref.preference_rank)}
                    className={`flex items-center gap-3 rounded-xl p-3 border transition-all ${
                      action === 'pref' && !isCurrent ? 'cursor-pointer' : ''
                    } ${
                      isCurrent
                        ? 'border-amber-300 bg-amber-50'
                        : isSelected
                        ? 'border-blue-400 bg-blue-50 shadow-sm'
                        : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    <div className="relative shrink-0">
                      {q && <img src={getImage(q, i)} alt="" className="w-14 h-14 rounded-lg object-cover" />}
                      <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
                        {pref.preference_rank}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900">{q?.quarter_number ?? '—'}</div>
                      {q?.address && <div className="text-xs text-gray-500 truncate">{q.address}</div>}
                      <div className="flex gap-3 text-xs text-gray-600 mt-1">
                        {q && <><span>{q.bhk_config}</span><span>{q.area_sqft} sq.ft</span></>}
                        {isCurrent && <span className="text-amber-700 font-medium">Currently Allotted</span>}
                      </div>
                    </div>
                    {action === 'pref' && !isCurrent && (
                      <input
                        type="radio"
                        name="ovpref"
                        checked={selectedPrefRank === pref.preference_rank}
                        onChange={() => setSelectedPrefRank(pref.preference_rank)}
                        className="w-4 h-4 shrink-0 accent-slate-800"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Justification + Apply */}
            <div className="p-4 border-t border-gray-200 space-y-3">
              <textarea
                value={justification}
                onChange={e => setJustification(e.target.value)}
                placeholder="EO Justification (mandatory)…"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  disabled={!canApply || saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckCircle size={15} />
                  {saving ? 'Applying…' : `Apply ${actionMeta.label}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
