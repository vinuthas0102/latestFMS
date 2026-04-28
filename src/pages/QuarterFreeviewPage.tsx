import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Search, Home, Bed, Ruler,
  CheckCircle, MapPin, ChevronRight, Plus, Eye, SlidersHorizontal,
  Layers, ChevronDown, RotateCcw, Shield, History,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { ViewMode } from '../components/ui/ViewSwitcher';
import { QuarterListCard } from '../components/quarters/QuarterListCard';
import {
  QuarterFilterSidebar,
  QuarterSidebarFilters,
  QuarterSortOrder,
} from '../components/quarters/QuarterFilterSidebar';
import { quartersService, Quarter, QuarterFilters } from '../services/quartersService';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { ROUTES } from '../constants/routes';
import { ROLE_LABELS } from '../constants/roles';

// ── Role-aware welcome banner config ────────────────────────────

const QUARTERS_WELCOME: Record<string, {
  title: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
}> = {
  govt_official: {
    title: 'Quarters Allotment Portal',
    icon: <Shield className="w-5 h-5 text-white" />,
    gradient: 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500',
    iconBg: 'bg-gradient-to-br from-blue-700 to-cyan-600',
  },
  dept_user: {
    title: 'Browse Government Quarters',
    icon: <Home className="w-5 h-5 text-white" />,
    gradient: 'bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500',
    iconBg: 'bg-gradient-to-br from-teal-700 to-emerald-600',
  },
  public: {
    title: 'Government Quarters Directory',
    icon: <Building2 className="w-5 h-5 text-white" />,
    gradient: 'bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-500',
    iconBg: 'bg-gradient-to-br from-sky-600 to-blue-600',
  },
};

const QUARTERS_WELCOME_DEFAULT = {
  title: 'Browse Quarters',
  icon: <Home className="w-5 h-5 text-white" />,
  gradient: 'bg-gradient-to-r from-slate-600 via-slate-500 to-gray-500',
  iconBg: 'bg-gradient-to-br from-slate-700 to-gray-600',
};

// ── View switcher icons (inline, matching dashboard style) ───────

const CardIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);
const ListIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);
const TableIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>
    <line x1="9" y1="9" x2="9" y2="21"/>
  </svg>
);

const VIEW_OPTIONS: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
  { mode: 'card',  icon: <CardIcon />,  label: 'Cards' },
  { mode: 'list',  icon: <ListIcon />,  label: 'List'  },
  { mode: 'table', icon: <TableIcon />, label: 'Table' },
];

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


export const QuarterFreeviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const addToast = useUIStore(s => s.addToast);

  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('card');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Legacy top-panel filter (card + table views)
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<QuarterFilters>({});

  // Sidebar filter state (list view only)
  const [rentRange, setRentRange] = useState({ min: 0, max: 99999 });
  const [sidebarFilters, setSidebarFilters] = useState<QuarterSidebarFilters>({
    searchQuery: '',
    quarterTypes: [],
    bhkConfigs: [],
    furnishingStatuses: [],
    availableOnly: false,
    minRent: 0,
    maxRent: 99999,
    sortOrder: 'default' as QuarterSortOrder,
  });

  const load = useCallback(async (f: QuarterFilters) => {
    setLoading(true);
    try {
      const data = await quartersService.getQuarters({ ...f, search: search || undefined });
      setQuarters(data);
      if (data.length > 0) {
        const rents = data.map(q => q.monthly_rent);
        const minR = Math.min(...rents);
        const maxR = Math.max(...rents);
        setRentRange({ min: minR, max: maxR });
        setSidebarFilters(prev => ({
          ...prev,
          minRent: prev.minRent === 0 ? minR : prev.minRent,
          maxRent: prev.maxRent === 99999 ? maxR : prev.maxRent,
        }));
      }
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

  const isListView = view === 'list';

  // Sidebar filtering + sorting (list view only)
  const displayQuarters = useMemo(() => {
    if (!isListView) return quarters;
    const q = sidebarFilters.searchQuery.toLowerCase();
    let result = quarters.filter((quarter) => {
      if (sidebarFilters.searchQuery) {
        const match =
          quarter.quarter_number.toLowerCase().includes(q) ||
          quarter.block_name?.toLowerCase().includes(q) ||
          quarter.address?.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (sidebarFilters.quarterTypes.length > 0 && !sidebarFilters.quarterTypes.includes(quarter.quarter_type)) return false;
      if (sidebarFilters.bhkConfigs.length > 0 && !sidebarFilters.bhkConfigs.includes(quarter.bhk_config)) return false;
      if (sidebarFilters.furnishingStatuses.length > 0 && !sidebarFilters.furnishingStatuses.includes(quarter.furnishing_status)) return false;
      if (sidebarFilters.availableOnly && quarter.occupancy_status !== 'AVAILABLE') return false;
      if (quarter.monthly_rent < sidebarFilters.minRent || quarter.monthly_rent > sidebarFilters.maxRent) return false;
      return true;
    });
    switch (sidebarFilters.sortOrder) {
      case 'rent_asc':  result = result.slice().sort((a, b) => a.monthly_rent - b.monthly_rent); break;
      case 'rent_desc': result = result.slice().sort((a, b) => b.monthly_rent - a.monthly_rent); break;
      case 'area_desc': result = result.slice().sort((a, b) => b.area_sqft - a.area_sqft); break;
    }
    return result;
  }, [quarters, isListView, sidebarFilters]);

  const mapCenter = useMemo(() => {
    const first = quarters.find(q => q.metadata?.latitude && q.metadata?.longitude);
    if (!first) return null;
    return { lat: Number(first.metadata.latitude), lng: Number(first.metadata.longitude) };
  }, [quarters]);

  const handleViewQuarter = (q: Quarter) => {
    navigate(`/quarters/${q.id}`);
  };

  const handleAddToRequest = (q: Quarter) => {
    navigate(ROUTES.QUARTERS_REQUESTS, { state: { prefill: q } });
  };

  const clearAllFilters = () => {
    setSearch('');
    setFilters({});
    setFilterPanelOpen(false);
  };

  const clearSidebarFilters = () => {
    setSidebarFilters({
      searchQuery: '',
      quarterTypes: [],
      bhkConfigs: [],
      furnishingStatuses: [],
      availableOnly: false,
      minRent: rentRange.min,
      maxRent: rentRange.max,
      sortOrder: 'default' as QuarterSortOrder,
    });
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

  const sidebarActiveCount = useMemo(() => {
    let n = 0;
    if (sidebarFilters.searchQuery) n++;
    if (sidebarFilters.quarterTypes.length) n += sidebarFilters.quarterTypes.length;
    if (sidebarFilters.bhkConfigs.length) n += sidebarFilters.bhkConfigs.length;
    if (sidebarFilters.furnishingStatuses.length) n += sidebarFilters.furnishingStatuses.length;
    if (sidebarFilters.availableOnly) n++;
    if (rentRange.max > rentRange.min) {
      if (sidebarFilters.minRent > rentRange.min || sidebarFilters.maxRent < rentRange.max) n++;
    }
    return n;
  }, [sidebarFilters, rentRange]);

  const welcomeInfo = (user?.role && QUARTERS_WELCOME[user.role]) ?? QUARTERS_WELCOME_DEFAULT;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-sky-50/30">
      <Header />

      {/* ── Sticky header ─────────────────────────────────────── */}
      <div className="flex-none bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-3">

          {/* ── Gradient welcome banner ── */}
          <div className={`relative ${welcomeInfo.gradient} rounded-2xl px-4 py-3 mb-3 overflow-hidden shadow-lg`}>
            {/* Decorative circles */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute -top-6 -right-6 w-40 h-40 bg-white rounded-full" />
              <div className="absolute -bottom-8 -left-8 w-60 h-60 bg-white rounded-full" />
            </div>

            <div className="relative flex items-center justify-between gap-3">
              {/* Left: icon + title + role badge */}
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2 ${welcomeInfo.iconBg} rounded-lg shadow-md flex-shrink-0`}>
                  {welcomeInfo.icon}
                </div>
                <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                  <h1 className="text-base md:text-lg font-bold text-white leading-none whitespace-nowrap">
                    {welcomeInfo.title}
                  </h1>
                  {user && (
                    <span className="px-2 py-0.5 bg-white/25 backdrop-blur-sm rounded-full text-xs font-semibold border border-white/30 text-white whitespace-nowrap">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  )}
                  {user && (
                    <span className="hidden lg:inline text-white/70 text-xs truncate">
                      {user.fullName || user.email}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: view switcher + My Requests */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 p-1 gap-0.5">
                  {VIEW_OPTIONS.map(({ mode, icon, label }) => (
                    <button
                      key={mode}
                      onClick={() => setView(mode)}
                      title={label}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                        view === mode
                          ? 'bg-white text-gray-800 shadow-sm'
                          : 'text-white/80 hover:text-white hover:bg-white/15'
                      }`}
                    >
                      {icon}
                      <span className="hidden md:inline">{label}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => navigate(ROUTES.QUARTERS_REQUESTS)}
                  className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 hover:border-white/50 text-white rounded-xl font-medium text-xs md:text-sm transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                >
                  <History size={15} />
                  <span className="hidden sm:inline">My Requests</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Filter toolbar */}
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              {!isListView && (
                <>
                  <button
                    onClick={() => setFilterPanelOpen(o => !o)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all shadow-sm hover:shadow-md ${
                      filterPanelOpen || activeFilterCount > 0
                        ? 'bg-gray-800 text-white border-gray-800'
                        : 'bg-white/60 backdrop-blur-sm text-gray-700 border-gray-200 hover:bg-white'
                    }`}
                  >
                    <SlidersHorizontal size={15} />
                    Search &amp; Filter
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                        {activeFilterCount}
                      </span>
                    )}
                    <ChevronDown size={14} className={`transition-transform ml-1 ${filterPanelOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {activeFilterCount > 0 && (
                    <button onClick={clearAllFilters} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors px-2.5 py-2 rounded-lg hover:bg-gray-100">
                      <RotateCcw size={13} /> Clear
                    </button>
                  )}
                </>
              )}

              {isListView && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="font-semibold text-gray-800">{displayQuarters.length}</span> quarters found
                  {sidebarActiveCount > 0 && (
                    <span className="text-xs text-gray-400">(filtered from {quarters.length})</span>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 ml-2">
                    <SlidersHorizontal size={13} />
                    <span>Use sidebar to filter</span>
                  </div>
                  {sidebarActiveCount > 0 && (
                    <button onClick={clearSidebarFilters} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors px-2.5 py-2 rounded-lg hover:bg-gray-100 ml-1">
                      <RotateCcw size={12} /> Clear
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Expandable panel (card + table only) */}
            {!isListView && filterPanelOpen && (
              <div className="mt-2 bg-white rounded-xl border border-gray-200 shadow-lg p-4 space-y-4 animate-slideDown">
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
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Quarter Type</label>
                    <div className="flex flex-wrap gap-1.5">
                      {QUARTER_TYPES.map(t => (
                        <button key={t} onClick={() => setFilters(f => ({ ...f, quarter_type: f.quarter_type === t ? undefined : t }))}
                          className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${filters.quarter_type === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">BHK Config</label>
                    <div className="flex flex-wrap gap-1.5">
                      {BHK_OPTIONS.map(b => (
                        <button key={b} onClick={() => setFilters(f => ({ ...f, bhk_config: f.bhk_config === b ? undefined : b }))}
                          className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${filters.bhk_config === b ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'}`}>
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Furnishing</label>
                    <div className="flex flex-wrap gap-1.5">
                      {FURNISHING_OPTIONS.map(f => (
                        <button key={f} onClick={() => setFilters(p => ({ ...p, furnishing_status: p.furnishing_status === f ? undefined : f }))}
                          className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${filters.furnishing_status === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'}`}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Availability</label>
                      <button onClick={() => setFilters(f => ({ ...f, occupancy_status: f.occupancy_status === 'AVAILABLE' ? undefined : 'AVAILABLE' }))}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${filters.occupancy_status === 'AVAILABLE' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-600'}`}>
                        <CheckCircle size={11} /> Available only
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Monthly Rent</label>
                      <div className="flex items-center gap-2">
                        <input type="number" placeholder="Min" value={filters.min_rent ?? ''} onChange={e => setFilters(f => ({ ...f, min_rent: e.target.value ? Number(e.target.value) : undefined }))} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        <span className="text-gray-400 text-xs">—</span>
                        <input type="number" placeholder="Max" value={filters.max_rent ?? ''} onChange={e => setFilters(f => ({ ...f, max_rent: e.target.value ? Number(e.target.value) : undefined }))} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-2 border-t border-gray-100">
                  <button onClick={clearAllFilters} className="text-xs text-gray-500 hover:text-red-600 mr-4 transition-colors">Clear all filters</button>
                  <button onClick={() => setFilterPanelOpen(false)} className="px-4 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">Done</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Scrollable content area ──────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 ${isListView ? 'flex gap-0 items-start' : ''}`}>

          {/* Left sidebar (list view only) */}
          {isListView && (
            <div className={`flex-shrink-0 self-start sticky top-4 transition-all duration-300 ${sidebarCollapsed ? 'w-11' : 'w-72'}`}>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-hidden flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>
                <QuarterFilterSidebar
                  collapsed={sidebarCollapsed}
                  onCollapse={setSidebarCollapsed}
                  filters={sidebarFilters}
                  onChange={(patch) => setSidebarFilters(prev => ({ ...prev, ...patch }))}
                  onClear={clearSidebarFilters}
                  allQuarters={quarters}
                  rentRange={rentRange}
                  mapCenter={mapCenter}
                />
              </div>
            </div>
          )}

          {/* Main content */}
          <div className={`flex-1 min-w-0 ${isListView ? 'pl-5' : ''}`}>

            {/* Count row (card + table views) */}
            {!isListView && (
              <div className="flex items-center justify-between mb-3 text-sm">
                <span className="text-gray-500">
                  <span className="font-semibold text-gray-900">{quarters.length}</span> quarters found
                  {filters.quarter_type && <> · type <span className="font-medium text-gray-800">{filters.quarter_type}</span></>}
                  {filters.occupancy_status === 'AVAILABLE' && <> · <span className="text-emerald-700 font-medium">available only</span></>}
                </span>
              </div>
            )}

            {loading ? (
              isListView ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-200 animate-pulse flex h-40 overflow-hidden">
                      <div className="w-48 bg-gray-200 flex-shrink-0" />
                      <div className="flex-1 p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                        <div className="h-3 bg-gray-200 rounded w-3/4" />
                      </div>
                      <div className="w-44 p-4 space-y-3 border-l border-gray-100">
                        <div className="h-6 bg-gray-200 rounded w-full" />
                        <div className="h-10 bg-gray-200 rounded w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
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
              )
            ) : displayQuarters.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
                <Building2 size={40} className="mx-auto text-gray-300 mb-3" />
                <h3 className="text-base font-semibold text-gray-700 mb-1">No quarters found</h3>
                <p className="text-sm text-gray-500">Try adjusting your filters or search terms.</p>
                <button onClick={isListView ? clearSidebarFilters : clearAllFilters} className="mt-4 text-sm text-blue-600 hover:underline">Clear filters</button>
              </div>
            ) : isListView ? (
              <div className="space-y-4">
                {displayQuarters.map((q, i) => (
                  <QuarterListCard key={q.id} quarter={q} idx={i} onView={handleViewQuarter} onAddToRequest={handleAddToRequest} />
                ))}
              </div>
            ) : view === 'card' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayQuarters.map((q, i) => (
                  <QuarterCard key={q.id} quarter={q} idx={i} onView={handleViewQuarter} onAddToRequest={handleAddToRequest} />
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
                      {displayQuarters.map((q) => (
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
                              <button onClick={() => handleViewQuarter(q)} className="p-1.5 rounded border border-gray-200 text-gray-500 hover:text-blue-600 transition-colors"><Eye size={13} /></button>
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
      </div>

    </div>
  );
};
