import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Search, Filter, Home, Bed, Ruler, IndianRupee, X,
  CheckCircle, Clock, MapPin, ChevronRight, Plus, Eye, SlidersHorizontal,
  Layers, Star, ChevronDown
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { ViewSwitcher, ViewMode } from '../components/ui/ViewSwitcher';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { quartersService, Quarter, QuarterFilters } from '../services/quartersService';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { ROUTES } from '../constants/routes';

const QUARTER_TYPES = ['Type-I', 'Type-II', 'Type-III', 'Type-IV', 'Type-V', 'Type-VI'];
const BHK_OPTIONS = ['1 BHK', '2 BHK', '3 BHK', '4 BHK'];
const FURNISHING_OPTIONS = ['Unfurnished', 'Semi-Furnished', 'Furnished'];

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80',
  'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=600&q=80',
];

function resolveImage(q: Quarter, idx: number): string {
  // images may be a real array, a PostgreSQL-stringified array, or null
  let images = q.images;
  if (typeof images === 'string') {
    try {
      images = JSON.parse(images);
    } catch {
      // strip pg-array braces: {url1,url2}
      images = (images as unknown as string)
        .replace(/^\{/, '')
        .replace(/\}$/, '')
        .split(',')
        .map((s: string) => s.trim().replace(/^"|"$/g, ''))
        .filter(Boolean);
    }
  }
  const first = Array.isArray(images) && images.length > 0 ? images[0] : null;
  return first || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
}

function fmtINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function getOccupancyBadge(status: string) {
  if (status === 'AVAILABLE') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (status === 'OCCUPIED') return 'bg-red-50 text-red-700 border border-red-200';
  return 'bg-amber-50 text-amber-700 border border-amber-200';
}

interface QuarterCardProps {
  quarter: Quarter;
  idx: number;
  onView: (q: Quarter) => void;
  onAddToRequest: (q: Quarter) => void;
}

const QuarterCard: React.FC<QuarterCardProps> = ({ quarter, idx, onView, onAddToRequest }) => (
  <article className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group">
    <div className="relative overflow-hidden aspect-[4/3]">
      <img
        src={resolveImage(quarter, idx)}
        alt={quarter.quarter_number}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length]; }}
      />
      <div className="absolute top-3 left-3">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getOccupancyBadge(quarter.occupancy_status)}`}>
          {quarter.occupancy_status === 'AVAILABLE' ? 'Available' : 'Occupied'}
        </span>
      </div>
      <div className="absolute top-3 right-3">
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800/80 text-white backdrop-blur-sm">
          {quarter.quarter_type}
        </span>
      </div>
    </div>
    <div className="p-4 flex flex-col flex-1">
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{quarter.quarter_number}</h3>
        <span className="text-xs text-gray-400 font-mono ml-2 shrink-0">
          Blk {quarter.block_name || '—'} · Fl {quarter.floor_number}
        </span>
      </div>
      {quarter.address && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
          <MapPin size={11} />
          <span className="truncate">{quarter.address}</span>
        </div>
      )}
      <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
        <span className="flex items-center gap-1"><Bed size={12} />{quarter.bhk_config}</span>
        <span className="flex items-center gap-1"><Ruler size={12} />{quarter.area_sqft} sq.ft</span>
        <span className="flex items-center gap-1"><Layers size={12} />{quarter.furnishing_status.replace('-', ' ')}</span>
      </div>
      {quarter.amenities?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {quarter.amenities.slice(0, 3).map(a => (
            <span key={a} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{a}</span>
          ))}
          {quarter.amenities.length > 3 && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{quarter.amenities.length - 3}</span>
          )}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
        <div>
          <span className="text-lg font-bold text-gray-900">{fmtINR(quarter.monthly_rent)}</span>
          <span className="text-xs text-gray-500">/mo</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onView(quarter)}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
            title="View details"
          >
            <Eye size={14} />
          </button>
          {quarter.occupancy_status === 'AVAILABLE' && (
            <button
              onClick={() => onAddToRequest(quarter)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={12} /> Add
            </button>
          )}
        </div>
      </div>
    </div>
  </article>
);

const QuarterListRow: React.FC<QuarterCardProps> = ({ quarter, idx, onView, onAddToRequest }) => (
  <div className="bg-white rounded-xl border border-gray-200 flex overflow-hidden hover:shadow-md transition-all duration-200 group">
    <div className="w-32 shrink-0 overflow-hidden">
      <img
        src={resolveImage(quarter, idx)}
        alt={quarter.quarter_number}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length]; }}
        style={{ minHeight: 80 }}
      />
    </div>
    <div className="flex-1 flex items-center gap-4 p-4 min-w-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-900 text-sm">{quarter.quarter_number}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getOccupancyBadge(quarter.occupancy_status)}`}>
            {quarter.occupancy_status === 'AVAILABLE' ? 'Available' : 'Occupied'}
          </span>
          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{quarter.quarter_type}</span>
        </div>
        {quarter.address && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
            <MapPin size={11} /><span className="truncate">{quarter.address}</span>
          </div>
        )}
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1"><Bed size={12} />{quarter.bhk_config}</span>
          <span className="flex items-center gap-1"><Ruler size={12} />{quarter.area_sqft} sq.ft</span>
          <span>Blk {quarter.block_name} · Fl {quarter.floor_number}</span>
          <span>{quarter.furnishing_status}</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-base font-bold text-gray-900">{fmtINR(quarter.monthly_rent)}<span className="text-xs text-gray-500 font-normal">/mo</span></div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button onClick={() => onView(quarter)} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-blue-600 transition-colors" title="View details">
          <Eye size={14} />
        </button>
        {quarter.occupancy_status === 'AVAILABLE' && (
          <button onClick={() => onAddToRequest(quarter)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors">
            <Plus size={12} /> Add
          </button>
        )}
      </div>
    </div>
  </div>
);

interface QuarterDetailModalProps {
  quarter: Quarter | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToRequest: (q: Quarter) => void;
}

const QuarterDetailModal: React.FC<QuarterDetailModalProps> = ({ quarter, isOpen, onClose, onAddToRequest }) => {
  if (!quarter) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" noPadding>
      <div className="flex flex-col">
        <div className="relative">
          <img
            src={resolveImage(quarter, 0)}
            alt={quarter.quarter_number}
            className="w-full h-64 object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGES[0]; }}
          />
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors">
            <X size={18} className="text-gray-700" />
          </button>
          <div className="absolute bottom-4 left-4 flex gap-2">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getOccupancyBadge(quarter.occupancy_status)}`}>
              {quarter.occupancy_status === 'AVAILABLE' ? 'Available' : 'Occupied'}
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800/80 text-white">
              {quarter.quarter_type}
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{quarter.quarter_number}</h2>
              {quarter.address && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                  <MapPin size={14} />{quarter.address}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{fmtINR(quarter.monthly_rent)}</div>
              <div className="text-xs text-gray-500">per month</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { icon: <Bed size={16} />, label: 'Configuration', value: quarter.bhk_config },
              { icon: <Ruler size={16} />, label: 'Area', value: `${quarter.area_sqft} sq.ft` },
              { icon: <Building2 size={16} />, label: 'Block / Floor', value: `${quarter.block_name || '—'} / ${quarter.floor_number}` },
              { icon: <Layers size={16} />, label: 'Furnishing', value: quarter.furnishing_status },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-gray-500 mb-1">{item.icon}<span className="text-xs">{item.label}</span></div>
                <div className="text-sm font-semibold text-gray-900">{item.value}</div>
              </div>
            ))}
          </div>

          {quarter.description && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{quarter.description}</p>
            </div>
          )}

          {quarter.amenities?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {quarter.amenities.map(a => (
                  <span key={a} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-full">{a}</span>
                ))}
              </div>
            </div>
          )}

          {quarter.occupancy_status === 'AVAILABLE' && (
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                Close
              </button>
              <button
                onClick={() => { onAddToRequest(quarter); onClose(); }}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus size={15} /> Add to Request
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export const QuarterFreeviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const addToast = useUIStore(s => s.addToast);

  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('card');
  const [detailQuarter, setDetailQuarter] = useState<Quarter | null>(null);

  // Filter panel state
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<QuarterFilters>({});

  // More-filters side drawer
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [pendingFilters, setPendingFilters] = useState<QuarterFilters>({});

  const load = useCallback(async (f: QuarterFilters) => {
    setLoading(true);
    try {
      const data = await quartersService.getQuarters({ ...f, search: search || undefined });
      setQuarters(data);
    } catch {
      addToast('Failed to load quarters', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, addToast]);

  useEffect(() => {
    const t = setTimeout(() => load(filters), 300);
    return () => clearTimeout(t);
  }, [filters, search, load]);

  const available = quarters.filter(q => q.occupancy_status === 'AVAILABLE').length;

  const handleAddToRequest = (q: Quarter) => {
    navigate(ROUTES.QUARTERS_REQUESTS, { state: { prefill: q } });
  };

  const applyMoreFilters = () => {
    setFilters(f => ({ ...f, ...pendingFilters }));
    setShowMoreFilters(false);
  };

  const clearAllFilters = () => {
    setSearch('');
    setFilters({});
    setPendingFilters({});
    setFilterPanelOpen(false);
  };

  const activeFilterCount = [
    search,
    filters.quarter_type,
    filters.occupancy_status,
    filters.bhk_config,
    filters.furnishing_status,
    filters.min_rent !== undefined ? 'y' : '',
    filters.max_rent !== undefined ? 'y' : '',
  ].filter(Boolean).length;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Frozen hero header */}
      <div className="flex-none bg-white/90 backdrop-blur-md border-b border-gray-200/60 shadow-sm z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-3">
          {/* Title row */}
          <div className="flex items-start justify-between mb-3 flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Home size={13} />
                <ChevronRight size={12} />
                <span>Property Inquiry</span>
                <ChevronRight size={12} />
                <span className="text-gray-800 font-medium">Browse Quarters</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Browse Quarters</h1>
              <p className="text-sm text-gray-500">Browse all available quarters. Add properties to your allotment request.</p>
            </div>
            <Button onClick={() => navigate(ROUTES.QUARTERS_REQUESTS)}>
              <Plus size={16} className="mr-1" /> My Requests
            </Button>
          </div>

          {/* Compact Stats Strip */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-2.5 mb-3 flex items-center gap-6 flex-wrap">
            {[
              { label: 'Total', value: quarters.length, color: 'text-gray-900' },
              { label: 'Available', value: available, color: 'text-emerald-700' },
              { label: 'Types', value: [...new Set(quarters.map(q => q.quarter_type))].length, color: 'text-blue-700' },
              { label: 'Occupied', value: quarters.length - available, color: 'text-amber-700' },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <div className="w-px h-5 bg-gray-200" />}
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-lg font-bold ${s.color}`}>{s.value}</span>
                  <span className="text-xs text-gray-500">{s.label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Filter controls */}
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setFilterPanelOpen(o => !o)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                  filterPanelOpen || activeFilterCount > 0
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:text-blue-700'
                }`}
              >
                <Filter size={15} />
                Search &amp; Filter
                {activeFilterCount > 0 && (
                  <span className={`text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold ${
                    filterPanelOpen ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
                  }`}>
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown size={14} className={`transition-transform ${filterPanelOpen ? 'rotate-180' : ''}`} />
              </button>

              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors">
                  <X size={12} /> Clear all
                </button>
              )}

              <div className="ml-auto">
                <ViewSwitcher currentView={view} onViewChange={setView} />
              </div>
            </div>

            {/* Expandable Filter Panel */}
            {filterPanelOpen && (
              <div className="mt-2 bg-white rounded-xl border border-gray-200 shadow-lg p-4 space-y-4 animate-slideDown">
                {/* Search */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Search</label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Quarter number, block, address…"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Quarter Type */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Quarter Type</label>
                    <div className="flex flex-wrap gap-1.5">
                      {QUARTER_TYPES.map(t => (
                        <button
                          key={t}
                          onClick={() => setFilters(f => ({ ...f, quarter_type: f.quarter_type === t ? undefined : t }))}
                          className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                            filters.quarter_type === t
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* BHK Config */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">BHK Config</label>
                    <div className="flex flex-wrap gap-1.5">
                      {BHK_OPTIONS.map(b => (
                        <button
                          key={b}
                          onClick={() => setFilters(f => ({ ...f, bhk_config: f.bhk_config === b ? undefined : b }))}
                          className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                            filters.bhk_config === b
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Furnishing */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Furnishing</label>
                    <div className="flex flex-wrap gap-1.5">
                      {FURNISHING_OPTIONS.map(f => (
                        <button
                          key={f}
                          onClick={() => setFilters(p => ({ ...p, furnishing_status: p.furnishing_status === f ? undefined : f }))}
                          className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                            filters.furnishing_status === f
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Availability + Rent */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Availability</label>
                      <button
                        onClick={() => setFilters(f => ({ ...f, occupancy_status: f.occupancy_status === 'AVAILABLE' ? undefined : 'AVAILABLE' }))}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                          filters.occupancy_status === 'AVAILABLE'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-600'
                        }`}
                      >
                        <CheckCircle size={11} /> Available only
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Monthly Rent</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={filters.min_rent ?? ''}
                          onChange={e => setFilters(f => ({ ...f, min_rent: e.target.value ? Number(e.target.value) : undefined }))}
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <span className="text-gray-400 text-xs">—</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={filters.max_rent ?? ''}
                          onChange={e => setFilters(f => ({ ...f, max_rent: e.target.value ? Number(e.target.value) : undefined }))}
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-gray-100">
                  <button onClick={clearAllFilters} className="text-xs text-gray-500 hover:text-red-600 mr-4 transition-colors">
                    Clear all filters
                  </button>
                  <button
                    onClick={() => setFilterPanelOpen(false)}
                    className="px-4 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable data area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-3 text-sm">
            <span className="text-gray-500">
              <span className="font-semibold text-gray-900">{quarters.length}</span> quarters found
              {filters.quarter_type && <> · type <span className="font-medium text-gray-800">{filters.quarter_type}</span></>}
              {filters.occupancy_status === 'AVAILABLE' && <> · <span className="text-emerald-700 font-medium">available only</span></>}
            </span>
          </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                <div className="bg-gray-200 aspect-[4/3]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : quarters.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
            <Building2 size={40} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-semibold text-gray-700 mb-1">No quarters found</h3>
            <p className="text-sm text-gray-500">Try adjusting your filters or search terms.</p>
            <button onClick={clearAllFilters} className="mt-4 text-sm text-blue-600 hover:underline">Clear filters</button>
          </div>
        ) : view === 'card' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {quarters.map((q, i) => (
              <QuarterCard key={q.id} quarter={q} idx={i} onView={setDetailQuarter} onAddToRequest={handleAddToRequest} />
            ))}
          </div>
        ) : view === 'list' ? (
          <div className="flex flex-col gap-3">
            {quarters.map((q, i) => (
              <QuarterListRow key={q.id} quarter={q} idx={i} onView={setDetailQuarter} onAddToRequest={handleAddToRequest} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['Quarter No.', 'Type', 'Config', 'Area', 'Block/Floor', 'Furnishing', 'Monthly Rent', 'Status', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {quarters.map((q, i) => (
                    <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{q.quarter_number}</td>
                      <td className="px-4 py-3 text-gray-600">{q.quarter_type}</td>
                      <td className="px-4 py-3 text-gray-600">{q.bhk_config}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{q.area_sqft} sq.ft</td>
                      <td className="px-4 py-3 text-gray-600">{q.block_name}/{q.floor_number}</td>
                      <td className="px-4 py-3 text-gray-600">{q.furnishing_status}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{fmtINR(q.monthly_rent)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getOccupancyBadge(q.occupancy_status)}`}>
                          {q.occupancy_status === 'AVAILABLE' ? 'Available' : 'Occupied'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setDetailQuarter(q)} className="p-1.5 rounded border border-gray-200 text-gray-500 hover:text-blue-600 transition-colors">
                            <Eye size={13} />
                          </button>
                          {q.occupancy_status === 'AVAILABLE' && (
                            <button onClick={() => handleAddToRequest(q)} className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors">
                              <Plus size={11} /> Add
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
      </div>

      <QuarterDetailModal
        quarter={detailQuarter}
        isOpen={!!detailQuarter}
        onClose={() => setDetailQuarter(null)}
        onAddToRequest={handleAddToRequest}
      />
    </div>
  );
};
