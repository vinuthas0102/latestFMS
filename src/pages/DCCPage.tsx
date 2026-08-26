import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  IndianRupee, Phone, MapPin, AlertTriangle,
  CheckCircle2, Clock, Receipt, TrendingUp, Search, X,
  Download, SlidersHorizontal, ChevronDown, ChevronUp,
  Wallet, Eye, Users, Sliders,
} from 'lucide-react';
import { dccService } from '../services/dccService';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import type {
  DccTile, DccTrackerSummary, DccDemandFilters,
  DccDemandType, DccObjectOwner, DccObject,
} from '../types/dcc';
import { FilterDrawer } from '../components/ui/FilterDrawer';

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── DP (Dashboard Panel) types ─────────────────────────────────────────────────
type DpKey = 'ALL' | 'PAID' | 'DUE' | 'OVERDUE';
interface DpConfig { key: DpKey; label: string; icon: typeof CheckCircle2; color: string; bg: string; }

const DPS: DpConfig[] = [
  { key: 'ALL',     label: 'All Demands',     icon: Receipt,      color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' },
  { key: 'PAID',    label: 'Total Paid',      icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  { key: 'DUE',     label: 'Total Due',       icon: Clock,        color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
  { key: 'OVERDUE', label: 'Total Overdue',   icon: AlertTriangle,color: 'text-red-700',     bg: 'bg-red-50 border-red-200' },
];

// ── Tile Component ─────────────────────────────────────────────────────────────
const DemandTile: React.FC<{
  tile: DccTile;
  onPay: (tile: DccTile) => void;
  onViewDetails: (tile: DccTile) => void;
  onDownload: (tile: DccTile) => void;
}> = ({ tile, onPay, onViewDetails, onDownload }) => {
  const [expanded, setExpanded] = useState(false);
  const st = STATUS[tile.status];

  return (
    <div className={`bg-white rounded-2xl border ${st.border} shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md`}>
      {/* Status strip */}
      <div className={`h-1 ${st.dot}`} />

      {/* Basic info */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${st.bg} ${st.text}`}>
                {st.label}
              </span>
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                {tile.demand_type_label}
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-900 mt-1 truncate">{tile.object_description || tile.object_ref}</h3>
            <p className="text-xs text-gray-500 truncate">{tile.object_ref} · {tile.object_type}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-lg font-extrabold text-gray-900 leading-tight">{fmtINR(tile.amount_due)}</div>
            <div className="text-[10px] text-gray-400">of {fmtINR(tile.total_amount)}</div>
          </div>
        </div>

        {/* Owner info */}
        <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
          <span className="flex items-center gap-1 min-w-0">
            <Users size={11} className="text-gray-400 shrink-0" />
            <span className="truncate font-medium">{tile.owner_name}</span>
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <Phone size={11} className="text-gray-400" />
            <span>{tile.owner_contact || '—'}</span>
          </span>
        </div>
      </div>

      {/* Demand info grid */}
      <div className="px-4 pb-2 grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Run Date</div>
          <div className="font-semibold text-gray-700">{fmtDate(tile.demand_run_date)}</div>
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Due Date</div>
          <div className={`font-semibold ${tile.status === 'OVERDUE' ? 'text-red-600' : 'text-gray-700'}`}>
            {fmtDate(tile.due_date)}
          </div>
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Overdue</div>
          <div className={`font-semibold ${tile.overdue_amount > 0 ? 'text-red-600' : 'text-gray-700'}`}>
            {tile.overdue_amount > 0 ? fmtINR(tile.overdue_amount) : '—'}
          </div>
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Last Paid</div>
          <div className="font-semibold text-emerald-700">{tile.last_paid_date ? fmtINR(tile.last_paid_amount ?? 0) : '—'}</div>
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Last Paid Date</div>
          <div className="font-semibold text-gray-700">{fmtDate(tile.last_paid_date)}</div>
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Avg Overdue Days</div>
          <div className={`font-semibold ${tile.avg_overdue_days > 0 ? 'text-red-600' : 'text-gray-700'}`}>
            {tile.avg_overdue_days > 0 ? `${tile.avg_overdue_days}d` : '—'}
          </div>
        </div>
      </div>

      {/* Expand/collapse */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] font-semibold text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? 'Less' : 'More'}
      </button>

      {expanded && (
        <div className="px-4 pb-2 text-xs text-gray-600 space-y-1 border-t border-gray-100 pt-2">
          <div className="flex gap-1"><MapPin size={11} className="text-gray-400 shrink-0 mt-0.5" /><span>{tile.owner_address || '—'}</span></div>
          {tile.region && <div><span className="text-gray-400">Region:</span> {tile.region}</div>}
          {tile.group_name && <div><span className="text-gray-400">Group:</span> {tile.group_name}</div>}
          {tile.subgroup && <div><span className="text-gray-400">Subgroup:</span> {tile.subgroup}</div>}
        </div>
      )}

      {/* Action buttons row */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-t border-gray-100 bg-gray-50/50">
        <button
          onClick={() => onViewDetails(tile)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Eye size={12} /> Details
        </button>
        {(tile.status === 'DUE' || tile.status === 'OVERDUE') && (
          <button
            onClick={() => onPay(tile)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
          >
            <Wallet size={12} /> Pay Now
          </button>
        )}
        <button
          onClick={() => onDownload(tile)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-gray-500 hover:bg-gray-100 transition-colors ml-auto"
        >
          <Download size={12} /> Statement
        </button>
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────────
export const DCCPage: React.FC = () => {
  const navigate = useNavigate();
  const [tiles, setTiles] = useState<DccTile[]>([]);
  const [summary, setSummary] = useState<DccTrackerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dpFilter, setDpFilter] = useState<DpKey>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<DccDemandFilters>({});
  const [demandTypes, setDemandTypes] = useState<DccDemandType[]>([]);
  const [owners, setOwners] = useState<DccObjectOwner[]>([]);
  const [objects, setObjects] = useState<DccObject[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, s, dt, ow, obj] = await Promise.all([
        dccService.getTiles(filters),
        dccService.getTrackerSummary(filters),
        dccService.listDemandTypes(),
        dccService.listObjectOwners(),
        dccService.listObjects(),
      ]);
      setTiles(t);
      setSummary(s);
      setDemandTypes(dt);
      setOwners(ow);
      setObjects(obj);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load demands');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  // Sub-DP breakdown by transaction type
  const subDpBreakdown = useMemo(() => {
    const map: Record<string, { count: number; amount: number }> = {};
    for (const t of tiles) {
      const key = t.demand_type_label || t.demand_type_code;
      if (!map[key]) map[key] = { count: 0, amount: 0 };
      map[key].count++;
      if (dpFilter === 'PAID') map[key].amount += t.amount_paid;
      else if (dpFilter === 'DUE') map[key].amount += t.status === 'DUE' ? t.amount_due : 0;
      else if (dpFilter === 'OVERDUE') map[key].amount += t.overdue_amount;
      else map[key].amount += t.total_amount;
    }
    return map;
  }, [tiles, dpFilter]);

  const filteredTiles = useMemo(() => {
    let result = tiles;
    if (dpFilter === 'PAID') result = result.filter(t => t.status === 'PAID');
    else if (dpFilter === 'DUE') result = result.filter(t => t.status === 'DUE');
    else if (dpFilter === 'OVERDUE') result = result.filter(t => t.status === 'OVERDUE');

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.object_ref.toLowerCase().includes(q) ||
        t.object_description.toLowerCase().includes(q) ||
        t.owner_name.toLowerCase().includes(q) ||
        t.demand_type_label.toLowerCase().includes(q)
      );
    }
    return result;
  }, [tiles, dpFilter, search]);

  const handlePay = (tile: DccTile) => {
    // Phase 5 will implement the full payment popup
    console.log('Pay', tile.id);
  };

  const handleViewDetails = (tile: DccTile) => {
    // Phase 5 will implement the due payment screen
    console.log('Details', tile.id);
  };

  const handleDownload = (tile: DccTile) => {
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

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Page header */}
      <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shrink-0">
          <IndianRupee size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900">Demand and Collection Center</h1>
          <p className="text-xs text-gray-500">Track all demands and collections across any object type</p>
        </div>
        <button
          onClick={() => navigate(ROUTES.DCC_RULE_SETUP)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 text-teal-700 text-xs font-semibold hover:bg-teal-100 transition-colors"
        >
          <Sliders size={14} /> Rule Setup
        </button>
        <button
          onClick={() => setShowFilters(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 transition-colors"
        >
          <SlidersHorizontal size={14} /> Filters
          {Object.values(filters).some(v => v !== null && v !== undefined && v !== '') && (
            <span className="w-2 h-2 rounded-full bg-teal-500" />
          )}
        </button>
      </div>

      {/* DPs */}
      <div className="px-5 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        {DPS.map(dp => {
          const Icon = dp.icon;
          const value =
            dp.key === 'ALL' ? tiles.length :
            dp.key === 'PAID' ? summary?.paid_count ?? 0 :
            dp.key === 'DUE' ? summary?.due_count ?? 0 :
            summary?.overdue_count ?? 0;
          const amount =
            dp.key === 'ALL' ? tiles.reduce((s, t) => s + t.total_amount, 0) :
            dp.key === 'PAID' ? summary?.total_paid ?? 0 :
            dp.key === 'DUE' ? summary?.total_due ?? 0 :
            summary?.total_overdue ?? 0;
          return (
            <button
              key={dp.key}
              onClick={() => setDpFilter(prev => prev === dp.key ? 'ALL' : dp.key)}
              className={`text-left rounded-xl border p-3 transition-all ${dp.bg} ${
                dpFilter === dp.key ? 'ring-2 ring-teal-400' : 'hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Icon size={14} className={dp.color} />
                <span className={`text-[10px] font-bold uppercase tracking-wide ${dp.color}`}>{dp.label}</span>
              </div>
              <div className={`text-xl font-extrabold ${dp.color}`}>{fmtINR(amount)}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{value} transaction{value !== 1 ? 's' : ''}</div>
            </button>
          );
        })}
      </div>

      {/* Collection rate banner */}
      {summary && (
        <div className="px-5 pb-2 shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <TrendingUp size={13} className="text-teal-600" />
            <span>Collection Rate: <span className="font-bold text-teal-700">{summary.collection_rate}%</span></span>
            <span className="text-gray-300">·</span>
            <span>Paid {fmtINR(summary.total_paid)} of {fmtINR(summary.total_paid + summary.total_due)}</span>
          </div>
        </div>
      )}

      {/* Sub-DP breakdown — shown when a DP is selected */}
      {dpFilter !== 'ALL' && Object.keys(subDpBreakdown).length > 0 && (
        <div className="px-5 pb-2 shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-700">Breakdown by Transaction Type — {DPS.find(d => d.key === dpFilter)?.label}</span>
            </div>
            <div className="space-y-1.5">
              {Object.entries(subDpBreakdown).map(([type, data]) => (
                <div key={type} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 font-medium">{type}</span>
                  <span className="text-gray-900 font-bold">{fmtINR(data.amount)}</span>
                  <span className="text-gray-400 text-[10px]">{data.count} txn{data.count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="px-5 pb-2 shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by object, owner, or demand type…"
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Tiles grid */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="w-6 h-6 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-red-500">
            <AlertTriangle size={28} className="mb-2" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        ) : filteredTiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
            <div className="text-sm font-medium text-gray-600">No demands found</div>
            <div className="text-xs mt-1">Try adjusting your filters or search.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredTiles.map(tile => (
              <DemandTile
                key={tile.id}
                tile={tile}
                onPay={handlePay}
                onViewDetails={handleViewDetails}
                onDownload={handleDownload}
              />
            ))}
          </div>
        )}
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onClearAll={() => { setFilters({}); }}
        activeFilterCount={Object.values(filters).filter(v => v !== null && v !== undefined && v !== '').length}
      >
        <div className="space-y-4">
          {/* Demand Type */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Demand Type</label>
            <select
              value={filters.demand_type_code ?? ''}
              onChange={e => setFilters(f => ({ ...f, demand_type_code: e.target.value || null }))}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white"
            >
              <option value="">All Types</option>
              {demandTypes.map(dt => <option key={dt.id} value={dt.code}>{dt.label}</option>)}
            </select>
          </div>
          {/* Object Owner */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Object Owner</label>
            <select
              value={filters.owner_id ?? ''}
              onChange={e => setFilters(f => ({ ...f, owner_id: e.target.value || null }))}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white"
            >
              <option value="">All Owners</option>
              {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          {/* Object */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Object</label>
            <select
              value={filters.object_id ?? ''}
              onChange={e => setFilters(f => ({ ...f, object_id: e.target.value || null }))}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white"
            >
              <option value="">All Objects</option>
              {objects.map(o => <option key={o.id} value={o.id}>{o.object_ref} — {o.description}</option>)}
            </select>
          </div>
          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
            <select
              value={filters.status ?? ''}
              onChange={e => setFilters(f => ({ ...f, status: (e.target.value || null) as DccDemandFilters['status'] }))}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="DUE">Due</option>
              <option value="OVERDUE">Overdue</option>
              <option value="PAID">Paid</option>
              <option value="EXEMPTED">Exempted</option>
            </select>
          </div>
          {/* Run date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Run Date From</label>
              <input type="date" value={filters.run_date_from ?? ''} onChange={e => setFilters(f => ({ ...f, run_date_from: e.target.value || null }))} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Run Date To</label>
              <input type="date" value={filters.run_date_to ?? ''} onChange={e => setFilters(f => ({ ...f, run_date_to: e.target.value || null }))} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white" />
            </div>
          </div>
          {/* Region / Group / Subgroup */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Region</label>
            <input value={filters.region ?? ''} onChange={e => setFilters(f => ({ ...f, region: e.target.value || null }))} placeholder="Region" className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Group</label>
              <input value={filters.group_name ?? ''} onChange={e => setFilters(f => ({ ...f, group_name: e.target.value || null }))} placeholder="Group" className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Subgroup</label>
              <input value={filters.subgroup ?? ''} onChange={e => setFilters(f => ({ ...f, subgroup: e.target.value || null }))} placeholder="Subgroup" className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white" />
            </div>
          </div>
        </div>
      </FilterDrawer>
    </div>
  );
};

export default DCCPage;
