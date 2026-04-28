import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Calendar,
  Camera,
  History,
  ChevronRight,
  Shield,
  Users,
  Home,
  SlidersHorizontal,
  RotateCcw,
  X,
  Search,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ImageCarousel } from '../components/ui/ImageCarousel';
import { SkeletonCard } from '../components/ui/Loading';
import { FadeIn } from '../components/animations/FadeIn';
import { DataTable, Column } from '../components/ui/DataTable';
import { PropertyListCard } from '../components/property/PropertyListCard';
import { FilterSidebar, FilterSidebarState, SortOrder } from '../components/property/FilterSidebar';
import { useViewPreference } from '../hooks/useViewPreference';
import { propertyService } from '../services/propertyService';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { PropertyDTO } from '../types';
import { ROUTES } from '../constants/routes';
import { ROLE_LABELS } from '../constants/roles';
import { requiresLoginForBooking, getModuleBadgeText, getModuleBadgeStyles } from '../utils/moduleHelpers';
import { formatCurrency } from '../utils/formatters';

// ── Types ────────────────────────────────────────────────────────

type ViewMode = 'card' | 'list' | 'table';

// ── Constants ────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  A: { label: 'Category A', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  B: { label: 'Category B', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  C: { label: 'Category C', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

const ROLE_WELCOME: Record<string, {
  title: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
}> = {
  govt_official: {
    title: 'Government Official Portal',
    icon: <Shield className="w-5 h-5 text-white" />,
    gradient: 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500',
    iconBg: 'bg-gradient-to-br from-blue-700 to-cyan-600',
  },
  dept_user: {
    title: 'Department User Portal',
    icon: <Users className="w-5 h-5 text-white" />,
    gradient: 'bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500',
    iconBg: 'bg-gradient-to-br from-teal-700 to-emerald-600',
  },
  public: {
    title: 'Community Facilities',
    icon: <Home className="w-5 h-5 text-white" />,
    gradient: 'bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-500',
    iconBg: 'bg-gradient-to-br from-sky-600 to-blue-600',
  },
};

const CardIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);
const ListIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);
const TableIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>
    <line x1="9" y1="9" x2="9" y2="21"/>
  </svg>
);

const VIEW_OPTIONS: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
  { mode: 'card',  icon: <CardIcon />,  label: 'Cards' },
  { mode: 'list',  icon: <ListIcon />,  label: 'List' },
  { mode: 'table', icon: <TableIcon />, label: 'Table' },
];

// Roles that get the sidebar filter panel
const SIDEBAR_ROLES = new Set(['public', 'govt_official']);

// ── Default filter state ─────────────────────────────────────────

function defaultFilters(priceMin = 0, priceMax = 99999): FilterSidebarState {
  return {
    searchQuery: '',
    moduleFilter: 'all',
    categoryFilter: 'all',
    cityFilter: 'all',
    amenityFilters: [],
    minPriceFilter: priceMin,
    maxPriceFilter: priceMax,
    sortOrder: 'top_picks' as SortOrder,
  };
}

// ── Amenity keyword matching ─────────────────────────────────────

const AMENITY_KEY_MAP: Record<string, string[]> = {
  ac:        ['ac', 'air condition', 'cooling', 'hvac'],
  wifi:      ['wifi', 'wi-fi', 'internet', 'wireless'],
  parking:   ['parking', 'car park', 'garage'],
  breakfast: ['breakfast', 'dining', 'restaurant'],
  pool:      ['pool', 'swimming'],
};

function propertyHasAmenity(property: PropertyDTO, key: string): boolean {
  const keywords = AMENITY_KEY_MAP[key];
  if (!keywords) return false;
  return (property.amenities || []).some((a) =>
    keywords.some((kw) => a.toLowerCase().includes(kw))
  );
}

// ── Page component ────────────────────────────────────────────────

export const UserDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const addToast = useUIStore((state) => state.addToast);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  const [properties, setProperties] = useState<PropertyDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useViewPreference('dashboardView', 'card') as [ViewMode, (v: ViewMode) => void];

  const [availableModules, setAvailableModules] = useState<{ id: string; name: string }[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 99999 });
  const [filters, setFilters] = useState<FilterSidebarState>(() => defaultFilters(0, 99999));

  // Legacy filter state for non-sidebar roles
  const [legacySearch, setLegacySearch] = useState('');
  const [legacyModule, setLegacyModule] = useState('all');
  const [legacyCategory, setLegacyCategory] = useState('all');
  const [legacyCity, setLegacyCity] = useState('all');

  const roleKey = user?.role || 'public';
  const welcomeInfo = ROLE_WELCOME[roleKey] || ROLE_WELCOME.public;
  const hasSidebar = SIDEBAR_ROLES.has(roleKey);

  useEffect(() => {
    loadProperties();
  }, [user]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFilterOpen(false); };
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleOutside);
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isFilterOpen]);

  const loadProperties = async () => {
    setLoading(true);
    try {
      const data = await propertyService.getProperties({
        status: 'PUBLISHED',
        isExempt: false,
        userRole: user?.role,
      });
      setProperties(data);

      const modulesMap = new Map<string, { id: string; name: string }>();
      const citiesSet = new Set<string>();
      let minP = Infinity;
      let maxP = 0;

      data.forEach((p) => {
        if (p.module) modulesMap.set(p.module.id, { id: p.module.id, name: p.module.name });
        if (p.estate?.city) citiesSet.add(p.estate.city);
        if (p.minPrice != null && p.minPrice < minP) minP = p.minPrice;
        if (p.maxPrice != null && p.maxPrice > maxP) maxP = p.maxPrice;
        if (p.minPrice != null && p.minPrice > maxP) maxP = p.minPrice;
      });

      const pMin = minP === Infinity ? 0 : minP;
      const pMax = maxP === 0 ? 99999 : maxP;

      setAvailableModules(Array.from(modulesMap.values()));
      setAvailableCities(Array.from(citiesSet).sort());
      setPriceRange({ min: pMin, max: pMax });
      setFilters(defaultFilters(pMin, pMax));
    } catch {
      addToast('Failed to load properties', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Filtering ────────────────────────────────────────────────

  const filteredProperties = useMemo(() => {
    if (hasSidebar) {
      return properties.filter((p) => {
        if (filters.searchQuery) {
          const q = filters.searchQuery.toLowerCase();
          const match =
            p.name.toLowerCase().includes(q) ||
            p.address?.toLowerCase().includes(q) ||
            p.estate?.city?.toLowerCase().includes(q);
          if (!match) return false;
        }
        if (filters.moduleFilter !== 'all' && p.module?.id !== filters.moduleFilter) return false;
        if (filters.categoryFilter !== 'all' && p.assetType?.category !== filters.categoryFilter) return false;
        if (filters.cityFilter !== 'all' && p.estate?.city !== filters.cityFilter) return false;
        if (filters.amenityFilters.length > 0) {
          if (!filters.amenityFilters.every((k) => propertyHasAmenity(p, k))) return false;
        }
        if (priceRange.max > priceRange.min) {
          const price = p.minPrice ?? p.maxPrice;
          if (price != null && (price < filters.minPriceFilter || price > filters.maxPriceFilter)) return false;
        }
        return true;
      });
    }
    return properties.filter((p) => {
      const q = legacySearch.toLowerCase();
      const matchSearch =
        !legacySearch ||
        p.name.toLowerCase().includes(q) ||
        p.address?.toLowerCase().includes(q) ||
        p.estate?.city?.toLowerCase().includes(q);
      return (
        matchSearch &&
        (legacyModule === 'all' || p.module?.id === legacyModule) &&
        (legacyCategory === 'all' || p.assetType?.category === legacyCategory) &&
        (legacyCity === 'all' || p.estate?.city === legacyCity)
      );
    });
  }, [properties, hasSidebar, filters, priceRange, legacySearch, legacyModule, legacyCategory, legacyCity]);

  // ── Sorting (sidebar roles) ──────────────────────────────────

  const displayProperties = useMemo(() => {
    if (!hasSidebar) return filteredProperties;
    const arr = [...filteredProperties];
    switch (filters.sortOrder) {
      case 'price_asc':  return arr.sort((a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity));
      case 'price_desc': return arr.sort((a, b) => (b.minPrice ?? -1) - (a.minPrice ?? -1));
      case 'name_asc':   return arr.sort((a, b) => a.name.localeCompare(b.name));
      default:           return arr;
    }
  }, [filteredProperties, hasSidebar, filters.sortOrder]);

  // ── Map centre from first geo-tagged property ────────────────

  const mapCenter = useMemo(() => {
    const first = properties.find((p) => p.latitude && p.longitude);
    if (!first) return null;
    return { lat: Number(first.latitude), lng: Number(first.longitude) };
  }, [properties]);

  // ── Actions ──────────────────────────────────────────────────

  const handleBookClick = (e: React.MouseEvent, property: PropertyDTO) => {
    e.stopPropagation();
    const needsLogin = requiresLoginForBooking(property.module?.code);
    if (needsLogin && !user) {
      navigate(`${ROUTES.LOGIN}?returnUrl=/properties/${property.id}?tab=booking`);
      return;
    }
    navigate(`/properties/${property.id}?tab=booking`);
  };

  const clearLegacy = () => {
    setLegacySearch('');
    setLegacyModule('all');
    setLegacyCategory('all');
    setLegacyCity('all');
  };

  const legacyActiveCount =
    (legacySearch ? 1 : 0) +
    (legacyModule !== 'all' ? 1 : 0) +
    (legacyCategory !== 'all' ? 1 : 0) +
    (legacyCity !== 'all' ? 1 : 0);

  // ── Table columns ─────────────────────────────────────────────

  const tableColumns: Column<PropertyDTO>[] = [
    {
      key: 'name',
      label: 'Property',
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          {p.images.length > 0 ? (
            <img src={p.images[0]} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Building2 size={18} className="text-gray-400" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900">{p.name}</p>
            <p className="text-xs text-gray-500">{p.estate?.city || p.address || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'module',
      label: 'Type',
      render: (p) => p.module ? (
        <Badge variant="default" className="text-xs">{p.module.name}</Badge>
      ) : <span className="text-gray-400 text-xs">—</span>,
    },
    {
      key: 'category',
      label: 'Category',
      render: (p) => {
        const cat = p.assetType?.category;
        const info = cat ? CATEGORY_LABELS[cat] : null;
        return info ? (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${info.color}`}>
            {info.label}
          </span>
        ) : <span className="text-gray-400 text-xs">—</span>;
      },
    },
    {
      key: 'totalRooms',
      label: 'Rooms',
      sortable: true,
      render: (p) => <span className="text-sm text-gray-700">{p.totalRooms ?? '—'}</span>,
    },
    {
      key: 'minPrice',
      label: 'From',
      sortable: true,
      render: (p) => p.minPrice != null ? (
        <span className="text-sm font-semibold text-gray-900">{formatCurrency(p.minPrice)}</span>
      ) : <span className="text-gray-400 text-xs">—</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (p) => (
        <button
          onClick={(e) => handleBookClick(e, p)}
          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
        >
          <Calendar size={12} />
          Book
        </button>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-sky-50/30">
      <Header />

      {/* ── Sticky header ────────────────────────────────────── */}
      <div className="flex-none z-20" ref={filterPanelRef}>
        {/* Banner */}
        <div className={`relative ${welcomeInfo.gradient} overflow-hidden shadow-md`}>
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-6 -right-6 w-40 h-40 bg-white rounded-full" />
            <div className="absolute -bottom-8 -left-8 w-60 h-60 bg-white rounded-full" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-3 py-2.5">
              {/* Left: identity */}
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-1.5 ${welcomeInfo.iconBg} rounded-lg shadow-md flex-shrink-0`}>
                  {welcomeInfo.icon}
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <h1 className="text-sm font-bold text-white leading-none whitespace-nowrap">
                    {welcomeInfo.title}
                  </h1>
                  {user && (
                    <span className="px-2 py-0.5 bg-white/25 backdrop-blur-sm rounded-full text-xs font-semibold border border-white/30 text-white whitespace-nowrap">
                      {ROLE_LABELS[user.role]}
                    </span>
                  )}
                  {user && (
                    <span className="hidden lg:inline text-white/70 text-xs truncate">
                      {user.fullName || user.email}
                    </span>
                  )}
                  {!loading && (
                    <span className="hidden sm:inline text-white/60 text-xs whitespace-nowrap">
                      — {displayProperties.length} {displayProperties.length === 1 ? 'property' : 'properties'}
                      {displayProperties.length < properties.length ? ` of ${properties.length}` : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Filter toggle button */}
                {(() => {
                  const activeCount = hasSidebar
                    ? [filters.searchQuery, filters.moduleFilter !== 'all', filters.categoryFilter !== 'all', filters.cityFilter !== 'all'].filter(Boolean).length
                    : legacyActiveCount;
                  return (
                    <button
                      onClick={() => setIsFilterOpen((v) => !v)}
                      title="Search & Filter"
                      className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        isFilterOpen || activeCount > 0
                          ? 'bg-white text-gray-800 border-white shadow-sm'
                          : 'bg-white/20 hover:bg-white/30 border-white/30 text-white'
                      }`}
                    >
                      <SlidersHorizontal size={13} />
                      <span className="hidden sm:inline">Filters</span>
                      {activeCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-gray-900 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow">
                          {activeCount}
                        </span>
                      )}
                    </button>
                  );
                })()}

                {/* View toggle */}
                <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 p-0.5 gap-0.5">
                  {VIEW_OPTIONS.map(({ mode, icon, label }) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      title={label}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                        viewMode === mode
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
                  onClick={() => navigate(ROUTES.BOOKINGS)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 hover:border-white/50 text-white rounded-lg font-medium text-xs transition-all duration-200 whitespace-nowrap"
                >
                  <History size={13} />
                  <span className="hidden sm:inline">My Bookings</span>
                  <ChevronRight size={11} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter dropdown panel */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isFilterOpen ? 'max-h-[260px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="bg-white/95 backdrop-blur-md border-b border-gray-200/70 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative flex-1 min-w-[180px] max-w-sm">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by name, location..."
                    value={hasSidebar ? filters.searchQuery : legacySearch}
                    onChange={(e) => hasSidebar
                      ? setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
                      : setLegacySearch(e.target.value)
                    }
                    className="w-full pl-7 pr-7 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
                  />
                  {(hasSidebar ? filters.searchQuery : legacySearch) && (
                    <button
                      onClick={() => hasSidebar
                        ? setFilters((prev) => ({ ...prev, searchQuery: '' }))
                        : setLegacySearch('')
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>

                {/* Facility Type */}
                {availableModules.length > 0 && (
                  <select
                    value={hasSidebar ? filters.moduleFilter : legacyModule}
                    onChange={(e) => hasSidebar
                      ? setFilters((prev) => ({ ...prev, moduleFilter: e.target.value }))
                      : setLegacyModule(e.target.value)
                    }
                    className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all cursor-pointer"
                  >
                    <option value="all">All Types</option>
                    {availableModules.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                )}

                {/* Category chips */}
                <div className="flex items-center gap-1">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'A', label: 'Cat A' },
                    { value: 'B', label: 'Cat B' },
                    { value: 'C', label: 'Cat C' },
                  ].map(({ value, label }) => {
                    const active = (hasSidebar ? filters.categoryFilter : legacyCategory) === value;
                    return (
                      <button
                        key={value}
                        onClick={() => hasSidebar
                          ? setFilters((prev) => ({ ...prev, categoryFilter: value }))
                          : setLegacyCategory(value)
                        }
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all whitespace-nowrap ${
                          active
                            ? 'bg-gray-800 text-white border-gray-800 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Location */}
                {availableCities.length > 0 && (
                  <select
                    value={hasSidebar ? filters.cityFilter : legacyCity}
                    onChange={(e) => hasSidebar
                      ? setFilters((prev) => ({ ...prev, cityFilter: e.target.value }))
                      : setLegacyCity(e.target.value)
                    }
                    className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all cursor-pointer"
                  >
                    <option value="all">All Locations</option>
                    {availableCities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                )}

                {/* Sort */}
                {hasSidebar && (
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => setFilters((prev) => ({ ...prev, sortOrder: e.target.value as SortOrder }))}
                    className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all cursor-pointer"
                  >
                    <option value="top_picks">Top Picks</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="name_asc">Name A–Z</option>
                  </select>
                )}

                {/* Clear */}
                {(hasSidebar
                  ? (filters.searchQuery || filters.moduleFilter !== 'all' || filters.categoryFilter !== 'all' || filters.cityFilter !== 'all')
                  : legacyActiveCount > 0
                ) && (
                  <button
                    onClick={hasSidebar ? () => setFilters(defaultFilters(priceRange.min, priceRange.max)) : clearLegacy}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all"
                  >
                    <RotateCcw size={11} />
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Scrollable content area ──────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 ${hasSidebar ? 'flex gap-0 items-start' : ''}`}>

          {/* Left sidebar */}
          {hasSidebar && (
            <div
              className={`flex-shrink-0 self-start sticky top-4 transition-all duration-300 ${
                sidebarCollapsed ? 'w-11' : 'w-72'
              }`}
            >
              <div
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-hidden flex flex-col"
                style={{ maxHeight: 'calc(100vh - 160px)' }}
              >
                <FilterSidebar
                  collapsed={sidebarCollapsed}
                  onCollapse={setSidebarCollapsed}
                  filters={filters}
                  onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
                  onClear={() => setFilters(defaultFilters(priceRange.min, priceRange.max))}
                  properties={properties}
                  filteredProperties={displayProperties}
                  priceRange={priceRange}
                  availableModules={availableModules}
                  availableCities={availableCities}
                  mapCenter={mapCenter}
                />
              </div>
            </div>
          )}

          {/* Main property list */}
          <div className={`flex-1 min-w-0 ${hasSidebar ? 'pl-5' : ''}`}>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : displayProperties.length === 0 ? (
              <FadeIn delay={200}>
                <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
                  <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No properties found</h3>
                  <p className="text-sm text-gray-500">
                    {hasSidebar
                      ? 'Try adjusting the filters in the sidebar'
                      : legacyActiveCount > 0
                      ? 'Try adjusting your search or filters'
                      : 'No properties are available for your access level'}
                  </p>
                </div>
              </FadeIn>
            ) : viewMode === 'table' ? (
              <FadeIn delay={50}>
                <DataTable
                  columns={tableColumns}
                  data={displayProperties}
                  keyExtractor={(p) => p.id}
                  onRowClick={(p) => navigate(`/properties/${p.id}`)}
                  emptyMessage="No properties found"
                />
              </FadeIn>
            ) : viewMode === 'list' ? (
              /* ── Booking.com-style list (all roles) ── */
              <FadeIn delay={50}>
                <div className="space-y-4">
                  {displayProperties.map((property) => (
                    <PropertyListCard
                      key={property.id}
                      property={property}
                      isLoggedIn={!!user}
                      onBookClick={handleBookClick}
                    />
                  ))}
                </div>
              </FadeIn>
            ) : (
              /* ── Card grid ─────────────────────────────────── */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayProperties.map((property, index) => {
                  const category = property.assetType?.category;
                  const categoryInfo = category ? CATEGORY_LABELS[category] : null;
                  const moduleBadgeText = getModuleBadgeText(property.module?.code);
                  const moduleBadgeStyles = getModuleBadgeStyles(property.module?.code);

                  return (
                    <FadeIn key={property.id} delay={index * 50}>
                      <div
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                        onClick={() => navigate(`/properties/${property.id}`)}
                      >
                        <div className="h-36 relative overflow-hidden bg-gray-100">
                          {property.images.length > 0 ? (
                            <>
                              <ImageCarousel
                                images={property.images}
                                alt={property.name}
                                className="h-36"
                                autoPlay={true}
                                autoPlayInterval={4000}
                              />
                              {property.images.length > 1 && (
                                <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                                  <Camera className="w-3 h-3 text-white" />
                                  <span className="text-white text-xs font-medium">{property.images.length}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                              <Building2 size={48} className="text-gray-300" />
                            </div>
                          )}
                          {categoryInfo && (
                            <div className="absolute top-3 right-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${categoryInfo.color}`}>
                                {categoryInfo.label}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {property.module && (
                              <Badge variant="default" className="text-xs">{property.module.name}</Badge>
                            )}
                            {property.propertyType && (
                              <Badge variant="success" className="text-xs">{property.propertyType.name}</Badge>
                            )}
                            {moduleBadgeText && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${moduleBadgeStyles}`}>
                                {moduleBadgeText}
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {property.name}
                          </h3>
                          <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                            {property.description || 'No description available'}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
                            <MapPin size={13} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">{property.estate?.city || property.address}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              {property.minPrice != null && (
                                <p className="text-sm font-semibold text-gray-900">
                                  From {formatCurrency(property.minPrice)}
                                  <span className="text-xs font-normal text-gray-500"> / night</span>
                                </p>
                              )}
                              {property.totalRooms != null && property.totalRooms > 0 && (
                                <p className="text-xs text-gray-500">{property.totalRooms} rooms</p>
                              )}
                            </div>
                            <button
                              onClick={(e) => handleBookClick(e, property)}
                              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 hover:shadow-md"
                            >
                              <Calendar size={14} />
                              Book Now
                            </button>
                          </div>
                        </div>
                      </div>
                    </FadeIn>
                  );
                })}
              </div>
            )}

            {/* Bottom bookings CTA */}
            {!loading && properties.length > 0 && (
              <FadeIn delay={300}>
                <div className="mt-6 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 rounded-lg">
                      <History size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">View Your Bookings</h3>
                      <p className="text-xs text-gray-500">Track your upcoming and past reservations</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate(ROUTES.BOOKINGS)}
                    className="flex items-center gap-2 flex-shrink-0"
                  >
                    <History size={16} />
                    My Booking History
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </FadeIn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
