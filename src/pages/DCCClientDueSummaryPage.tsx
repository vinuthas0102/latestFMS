import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Users, Phone, MapPin, Building2, Receipt,
  Calendar, Clock, Wallet, CheckCircle2, AlertTriangle,
  Eye, Loader2, ChevronRight, LayoutGrid, List, Table2,
  Filter, X, RotateCcw, Search,
} from 'lucide-react';
import { dccService } from '../services/dccService';
import { DCCDemandDetailModal } from './DCCDemandDetailPage';
import type { DccTile, DccDemandStatus } from '../types/dcc';
import {
  DCC_STATUS,
  fmtINR, fmtINRShort, fmtDateShort,
} from '../constants/dccTheme';

type ViewMode = 'card' | 'list' | 'table';

type KpiKey = 'ALL' | 'PAID' | 'OUTSTANDING' | 'OVERDUE';

interface LocalFilterState {
  statuses: DccDemandStatus[];
  demandTypeCodes: string[];
  objectTypes: string[];
  runDateFrom: string;
  runDateTo: string;
  dueDateFrom: string;
  dueDateTo: string;
}

const emptyFilterState: LocalFilterState = {
  statuses: [],
  demandTypeCodes: [],
  objectTypes: [],
  runDateFrom: '',
  runDateTo: '',
  dueDateFrom: '',
  dueDateTo: '',
};

const STATUS_OPTIONS: { value: DccDemandStatus; label: string }[] = [
  { value: 'DUE', label: 'Due' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'PAID', label: 'Paid' },
  { value: 'EXEMPTED', label: 'Exempted' },
];

const toggleArray = <T,>(arr: T[], val: T): T[] =>
  arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

const countActiveFilters = (s: LocalFilterState): number => {
  let n = 0;
  n += s.statuses.length;
  n += s.demandTypeCodes.length;
  n += s.objectTypes.length;
  if (s.runDateFrom || s.runDateTo) n++;
  if (s.dueDateFrom || s.dueDateTo) n++;
  return n;
};

// ── Label-value pair helper ──────────────────────────────────────────────────
const LV: React.FC<{ label: string; value: React.ReactNode; valueCls?: string }> = ({
  label, value, valueCls = 'text-slate-900',
}) => (
  <div className="flex flex-col gap-0.5 min-w-0">
    <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
    <span className={`text-xs font-semibold tabular-nums truncate ${valueCls}`}>{value}</span>
  </div>
);

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  active: boolean;
  onClick: () => void;
  accent: string;
  activeRing: string;
}> = ({ icon, label, value, active, onClick, accent, activeRing }) => (
  <button
    onClick={onClick}
    className={`bg-white rounded-lg border shadow-sm px-3 py-2.5 text-left transition-all duration-200 hover:shadow-md hover:border-slate-300 ${
      active ? `${activeRing} border-2` : 'border-slate-200'
    }`}
  >
    <div className="flex items-center gap-1.5 mb-0.5">
      <span className={accent}>{icon}</span>
      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
    </div>
    <div className="text-sm font-extrabold text-slate-900 tabular-nums">{value}</div>
  </button>
);

export const DCCClientDueSummaryPage: React.FC = () => {
  const { ownerId } = useParams<{ ownerId: string }>();
  const navigate = useNavigate();
  const [tiles, setTiles] = useState<DccTile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailDemandId, setDetailDemandId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [activeKpi, setActiveKpi] = useState<KpiKey>('ALL');
  const [filterState, setFilterState] = useState<LocalFilterState>(emptyFilterState);
  const [showFilter, setShowFilter] = useState(false);

  const load = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    setError(null);
    try {
      const allTiles = await dccService.getTiles();
      const ownerTiles = allTiles.filter((t) => t.owner_id === ownerId);
      setTiles(ownerTiles);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load demands');
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Derived data ────────────────────────────────────────────────────────────
  const first = tiles[0];
  const ownerName = first?.owner_name ?? 'Unknown Client';
  const ownerContact = first?.owner_contact ?? '';
  const ownerAddress = first?.owner_address ?? '';

  const demandTypeOptions = useMemo(() => {
    const map = new Map<string, string>();
    tiles.forEach(t => { if (t.demand_type_code) map.set(t.demand_type_code, t.demand_type_label || t.demand_type_code); });
    return Array.from(map.entries()).map(([code, label]) => ({ code, label }));
  }, [tiles]);

  const objectTypeOptions = useMemo(() => {
    const set = new Set<string>();
    tiles.forEach(t => { if (t.object_type) set.add(t.object_type); });
    return Array.from(set).sort();
  }, [tiles]);

  // Apply KPI selection + filter state
  const filteredTiles = useMemo(() => {
    let result = tiles;

    // KPI filter
    if (activeKpi === 'PAID') result = result.filter(t => t.status === 'PAID');
    else if (activeKpi === 'OUTSTANDING') result = result.filter(t => t.status === 'DUE' || t.status === 'OVERDUE');
    else if (activeKpi === 'OVERDUE') result = result.filter(t => t.status === 'OVERDUE');

    // Local filters
    if (filterState.statuses.length > 0) {
      result = result.filter(t => filterState.statuses.includes(t.status));
    }
    if (filterState.demandTypeCodes.length > 0) {
      result = result.filter(t => filterState.demandTypeCodes.includes(t.demand_type_code));
    }
    if (filterState.objectTypes.length > 0) {
      result = result.filter(t => filterState.objectTypes.includes(t.object_type));
    }
    if (filterState.runDateFrom) {
      result = result.filter(t => t.demand_run_date >= filterState.runDateFrom);
    }
    if (filterState.runDateTo) {
      result = result.filter(t => t.demand_run_date <= filterState.runDateTo);
    }
    if (filterState.dueDateFrom) {
      result = result.filter(t => t.due_date >= filterState.dueDateFrom);
    }
    if (filterState.dueDateTo) {
      result = result.filter(t => t.due_date <= filterState.dueDateTo);
    }
    return result;
  }, [tiles, activeKpi, filterState]);

  // Summary stats from ALL tiles (not filtered) for KPI cards
  const totalDemand = tiles.reduce((s, t) => s + t.total_amount, 0);
  const totalPaid = tiles.reduce((s, t) => s + t.amount_paid, 0);
  const totalOutstanding = tiles.reduce((s, t) => s + t.amount_due, 0);
  const overdueAmount = tiles.reduce((s, t) => s + t.overdue_amount, 0);
  const propertyCount = new Set(tiles.map((t) => t.object_id)).size;

  const activeFilterCount = countActiveFilters(filterState);

  const handleKpiClick = (key: KpiKey) => {
    setActiveKpi(prev => prev === key ? 'ALL' : key);
  };

  const handleClearFilters = () => {
    setFilterState(emptyFilterState);
    setActiveKpi('ALL');
  };

  // ── Card view (2-row label-value layout) ──────────────────────────────────
  const CardView: React.FC<{ tile: DccTile }> = ({ tile }) => {
    const st = DCC_STATUS[tile.status];
    return (
      <motion.button
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => setDetailDemandId(tile.id)}
        className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-left overflow-hidden group"
      >
        <div className={`h-0.5 ${st.dot} shrink-0`} />
        {/* Row 1: Identity + Amount */}
        <div className="px-3 py-2 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${st.bg} ${st.text} border ${st.border}`}>
                {st.label}
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{tile.demand_type_label}</span>
            </div>
            <h3 className="text-xs font-bold text-slate-900 truncate leading-snug">
              {tile.object_description || tile.object_ref}
            </h3>
            <p className="text-[10px] text-slate-500 truncate">{tile.object_ref} · {tile.object_type}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-extrabold text-slate-900 tabular-nums leading-tight">{fmtINR(tile.amount_due)}</div>
            <div className="text-[9px] text-slate-400">of {fmtINRShort(tile.total_amount)}</div>
          </div>
        </div>
        {/* Row 2: Label-value grid */}
        <div className="px-3 pb-2.5 pt-1 grid grid-cols-4 gap-x-2 gap-y-1.5 border-t border-slate-100">
          <LV label="Run Date" value={fmtDateShort(tile.demand_run_date)} />
          <LV label="Due Date" value={fmtDateShort(tile.due_date)} valueCls={tile.status === 'OVERDUE' ? 'text-red-600 font-semibold tabular-nums truncate' : 'text-slate-900'} />
          <LV label="Paid" value={tile.amount_paid > 0 ? fmtINRShort(tile.amount_paid) : '—'} valueCls="text-emerald-600" />
          <LV label="Overdue" value={tile.overdue_amount > 0 ? fmtINRShort(tile.overdue_amount) : '—'} valueCls="text-red-600" />
        </div>
      </motion.button>
    );
  };

  // ── List view (single-row dense) ──────────────────────────────────────────
  const ListView: React.FC<{ tile: DccTile }> = ({ tile }) => {
    const st = DCC_STATUS[tile.status];
    return (
      <motion.button
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        onClick={() => setDetailDemandId(tile.id)}
        className="w-full bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-left overflow-hidden group flex items-center gap-3 px-3 py-2"
      >
        <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${st.bg} ${st.text} border ${st.border} shrink-0`}>
          {st.label}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-bold text-slate-900 truncate leading-snug">{tile.object_description || tile.object_ref}</h3>
          <p className="text-[10px] text-slate-500 truncate">{tile.demand_type_label} · {tile.object_ref}</p>
        </div>
        <div className="hidden sm:flex items-center gap-4 shrink-0">
          <LV label="Run" value={fmtDateShort(tile.demand_run_date)} />
          <LV label="Due" value={fmtDateShort(tile.due_date)} valueCls={tile.status === 'OVERDUE' ? 'text-red-600 font-semibold tabular-nums truncate' : 'text-slate-900'} />
          <LV label="Paid" value={tile.amount_paid > 0 ? fmtINRShort(tile.amount_paid) : '—'} valueCls="text-emerald-600" />
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-extrabold text-slate-900 tabular-nums">{fmtINR(tile.amount_due)}</div>
        </div>
        <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
      </motion.button>
    );
  };

  // ── Table view ─────────────────────────────────────────────────────────────
  const TableView: React.FC = () => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="py-2 px-3 text-left font-bold text-slate-600">Property / Description</th>
              <th className="py-2 px-3 text-left font-bold text-slate-600">Demand Type</th>
              <th className="py-2 px-3 text-left font-bold text-slate-600">Run Date</th>
              <th className="py-2 px-3 text-left font-bold text-slate-600">Due Date</th>
              <th className="py-2 px-3 text-right font-bold text-slate-600">Total</th>
              <th className="py-2 px-3 text-right font-bold text-slate-600">Paid</th>
              <th className="py-2 px-3 text-right font-bold text-slate-600">Outstanding</th>
              <th className="py-2 px-3 text-center font-bold text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTiles.map(tile => {
              const st = DCC_STATUS[tile.status];
              return (
                <tr
                  key={tile.id}
                  onClick={() => setDetailDemandId(tile.id)}
                  className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="py-1.5 px-3">
                    <div className="text-xs font-semibold text-slate-900 truncate max-w-[200px]">{tile.object_description || tile.object_ref}</div>
                    <div className="text-[9px] text-slate-400 truncate max-w-[200px]">{tile.object_ref} · {tile.object_type}</div>
                  </td>
                  <td className="py-1.5 px-3">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{tile.demand_type_label}</span>
                  </td>
                  <td className="py-1.5 px-3 text-slate-600">{fmtDateShort(tile.demand_run_date)}</td>
                  <td className="py-1.5 px-3">
                    <span className={tile.status === 'OVERDUE' ? 'text-red-600 font-semibold' : 'text-slate-600'}>
                      {fmtDateShort(tile.due_date)}
                    </span>
                  </td>
                  <td className="py-1.5 px-3 text-right font-semibold text-slate-700 tabular-nums">{fmtINR(tile.total_amount)}</td>
                  <td className="py-1.5 px-3 text-right font-semibold text-emerald-600 tabular-nums">{fmtINR(tile.amount_paid)}</td>
                  <td className="py-1.5 px-3 text-right font-bold text-slate-900 tabular-nums">{fmtINR(tile.amount_due)}</td>
                  <td className="py-1.5 px-3 text-center">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${st.bg} ${st.text} border ${st.border}`}>
                      {st.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── Filter Drawer ──────────────────────────────────────────────────────────
  const FilterDrawer: React.FC = () => (
    <AnimatePresence>
      {showFilter && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={() => setShowFilter(false)}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-slate-50 shadow-2xl z-[61] flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700 shrink-0">
              <h2 className="text-sm font-bold text-white">Filter Demands</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterState(emptyFilterState)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold text-slate-300 border border-slate-600 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <RotateCcw size={12} /> Reset
                </button>
                <button
                  onClick={() => setShowFilter(false)}
                  className="flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {/* Status */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Status</p>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setFilterState(d => ({ ...d, statuses: toggleArray(d.statuses, s.value) }))}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                        filterState.statuses.includes(s.value)
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-400'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Demand Type */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Demand Type</p>
                <div className="flex flex-wrap gap-1.5">
                  {demandTypeOptions.map(dt => (
                    <button
                      key={dt.code}
                      onClick={() => setFilterState(d => ({ ...d, demandTypeCodes: toggleArray(d.demandTypeCodes, dt.code) }))}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                        filterState.demandTypeCodes.includes(dt.code)
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-400'
                      }`}
                    >
                      {dt.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Object Type */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Object Type</p>
                <div className="flex flex-wrap gap-1.5">
                  {objectTypeOptions.map(ot => (
                    <button
                      key={ot}
                      onClick={() => setFilterState(d => ({ ...d, objectTypes: toggleArray(d.objectTypes, ot) }))}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                        filterState.objectTypes.includes(ot)
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-400'
                      }`}
                    >
                      {ot}
                    </button>
                  ))}
                </div>
              </div>
              {/* Run Date Range */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Run Date Range</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filterState.runDateFrom}
                    onChange={e => setFilterState(d => ({ ...d, runDateFrom: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="date"
                    value={filterState.runDateTo}
                    onChange={e => setFilterState(d => ({ ...d, runDateTo: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              {/* Due Date Range */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Due Date Range</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filterState.dueDateFrom}
                    onChange={e => setFilterState(d => ({ ...d, dueDateFrom: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="date"
                    value={filterState.dueDateTo}
                    onChange={e => setFilterState(d => ({ ...d, dueDateTo: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
            <div className="px-4 py-3 bg-gradient-to-r from-slate-900 to-teal-900 border-t border-slate-700 shrink-0">
              <button
                onClick={() => setShowFilter(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg transition-all"
              >
                <Search size={16} /> Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // ── View mode selector ─────────────────────────────────────────────────────
  const ViewModeSelector: React.FC = () => {
    const modes: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
      { mode: 'card', icon: <LayoutGrid size={14} />, label: 'Cards' },
      { mode: 'list', icon: <List size={14} />, label: 'List' },
      { mode: 'table', icon: <Table2 size={14} />, label: 'Table' },
    ];
    return (
      <div className="inline-flex items-center bg-white rounded-lg border border-slate-200 p-0.5">
        {modes.map(({ mode, icon, label }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === mode
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            title={label}
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen flex flex-col bg-slate-50">
      {/* Header with client contact info */}
      <div className="flex items-start gap-3 px-4 py-2.5 bg-blue-800 border-b border-blue-900 shrink-0">
        <button
          onClick={() => navigate('/dcc')}
          className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors mt-1"
        >
          <ArrowLeft size={16} />
          <span className="text-xs font-semibold">Back</span>
        </button>
        <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
          <Users size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-white truncate">{ownerName}</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-300 mt-0.5">
            <span className="flex items-center gap-1">
              <Phone size={10} /> {ownerContact || '—'}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={10} /> <span className="truncate max-w-[260px]">{ownerAddress || '—'}</span>
            </span>
            <span className="flex items-center gap-1">
              <Building2 size={10} /> {propertyCount} {propertyCount === 1 ? 'Property' : 'Properties'}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards + Controls */}
      {!loading && !error && tiles.length > 0 && (
        <div className="px-4 pt-3 pb-2 shrink-0 space-y-2.5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <KpiCard
              icon={<Receipt size={11} />}
              label="Total Demand"
              value={fmtINR(totalDemand)}
              active={activeKpi === 'ALL'}
              onClick={() => handleKpiClick('ALL')}
              accent="text-slate-400"
              activeRing="ring-2 ring-blue-400"
            />
            <KpiCard
              icon={<CheckCircle2 size={11} />}
              label="Total Paid"
              value={fmtINR(totalPaid)}
              active={activeKpi === 'PAID'}
              onClick={() => handleKpiClick('PAID')}
              accent="text-emerald-500"
              activeRing="ring-2 ring-emerald-400"
            />
            <KpiCard
              icon={<Wallet size={11} />}
              label="Outstanding"
              value={fmtINR(totalOutstanding)}
              active={activeKpi === 'OUTSTANDING'}
              onClick={() => handleKpiClick('OUTSTANDING')}
              accent="text-red-500"
              activeRing="ring-2 ring-red-400"
            />
            <KpiCard
              icon={<AlertTriangle size={11} />}
              label="Overdue"
              value={fmtINR(overdueAmount)}
              active={activeKpi === 'OVERDUE'}
              onClick={() => handleKpiClick('OVERDUE')}
              accent="text-red-500"
              activeRing="ring-2 ring-red-400"
            />
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilter(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <Filter size={13} /> Filter
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {(activeFilterCount > 0 || activeKpi !== 'ALL') && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X size={12} /> Clear all
                </button>
              )}
              <span className="text-[11px] text-slate-400">
                {filteredTiles.length} of {tiles.length} demands
              </span>
            </div>
            <ViewModeSelector />
          </div>
        </div>
      )}

      {/* Demand List */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 pt-1">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="text-emerald-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-red-500">
            <AlertTriangle size={28} className="mb-2" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        ) : filteredTiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
            <div className="text-sm font-medium text-slate-600">
              {tiles.length === 0 ? 'No demands found for this client' : 'No demands match the selected filters'}
            </div>
            {(activeFilterCount > 0 || activeKpi !== 'ALL') && (
              <button
                onClick={handleClearFilters}
                className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                <RotateCcw size={12} /> Clear filters
              </button>
            )}
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {filteredTiles.map(tile => <CardView key={tile.id} tile={tile} />)}
          </div>
        ) : viewMode === 'list' ? (
          <div className="flex flex-col gap-2">
            {filteredTiles.map(tile => <ListView key={tile.id} tile={tile} />)}
          </div>
        ) : (
          <TableView />
        )}
      </div>

      {/* Filter Drawer */}
      <FilterDrawer />

      {/* Demand Detail Modal */}
      {detailDemandId && (
        <DCCDemandDetailModal
          demandId={detailDemandId}
          onClose={() => setDetailDemandId(null)}
        />
      )}
    </div>
  );
};

export default DCCClientDueSummaryPage;
