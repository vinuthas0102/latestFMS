import React, { useEffect, useRef, useState } from 'react';
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
import { ViewMode } from '../components/ui/ViewSwitcher';
import { ListViewItem, ListView } from '../components/ui/ListView';
import { DataTable, Column } from '../components/ui/DataTable';
import { useViewPreference } from '../hooks/useViewPreference';
import { propertyService } from '../services/propertyService';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { PropertyDTO } from '../types';
import { ROUTES } from '../constants/routes';
import { ROLE_LABELS } from '../constants/roles';
import { requiresLoginForBooking, getModuleBadgeText, getModuleBadgeStyles } from '../utils/moduleHelpers';
import { formatCurrency } from '../utils/formatters';

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

// Inline SVG icons for view modes to avoid import overhead
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
  { mode: 'card', icon: <CardIcon />, label: 'Cards' },
  { mode: 'list', icon: <ListIcon />, label: 'List' },
  { mode: 'table', icon: <TableIcon />, label: 'Table' },
];

export const UserDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const addToast = useUIStore((state) => state.addToast);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  const [properties, setProperties] = useState<PropertyDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useViewPreference('dashboardView', 'card');

  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');

  const [availableModules, setAvailableModules] = useState<{ id: string; name: string }[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    loadProperties();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      data.forEach((p) => {
        if (p.module) modulesMap.set(p.module.id, { id: p.module.id, name: p.module.name });
        if (p.estate?.city) citiesSet.add(p.estate.city);
      });
      setAvailableModules(Array.from(modulesMap.values()));
      setAvailableCities(Array.from(citiesSet).sort());
    } catch {
      addToast('Failed to load properties', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.estate?.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = moduleFilter === 'all' || p.module?.id === moduleFilter;
    const matchesCategory = categoryFilter === 'all' || p.assetType?.category === categoryFilter;
    const matchesCity = cityFilter === 'all' || p.estate?.city === cityFilter;
    return matchesSearch && matchesModule && matchesCategory && matchesCity;
  });

  const handleBookClick = (e: React.MouseEvent, property: PropertyDTO) => {
    e.stopPropagation();
    const needsLogin = requiresLoginForBooking(property.module?.code);
    if (needsLogin && !user) {
      navigate(`${ROUTES.LOGIN}?returnUrl=/properties/${property.id}?tab=booking`);
      return;
    }
    navigate(`/properties/${property.id}?tab=booking`);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setModuleFilter('all');
    setCategoryFilter('all');
    setCityFilter('all');
  };

  const roleKey = user?.role || 'public';
  const welcomeInfo = ROLE_WELCOME[roleKey] || ROLE_WELCOME.public;

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    (moduleFilter !== 'all' ? 1 : 0) +
    (categoryFilter !== 'all' ? 1 : 0) +
    (cityFilter !== 'all' ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

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

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-sky-50/30">
      <Header />

      {/* Frozen header zone */}
      <div className="flex-none bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm z-20" ref={filterPanelRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-3">

          {/* === Single-line hero banner === */}
          <div className={`relative ${welcomeInfo.gradient} rounded-2xl px-4 py-3 mb-3 overflow-hidden shadow-lg`}>
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute -top-6 -right-6 w-40 h-40 bg-white rounded-full" />
              <div className="absolute -bottom-8 -left-8 w-60 h-60 bg-white rounded-full" />
            </div>

            <div className="relative flex items-center justify-between gap-3">
              {/* Left: icon + title + role badge + username */}
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
                      {ROLE_LABELS[user.role]}
                    </span>
                  )}
                  {user && (
                    <span className="hidden lg:inline text-white/70 text-xs truncate">
                      {user.fullName || user.email}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: view mode switcher + bookings button */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 p-1 gap-0.5">
                  {VIEW_OPTIONS.map(({ mode, icon, label }) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      title={label}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
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
                  className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 hover:border-white/50 text-white rounded-xl font-medium text-xs md:text-sm transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                >
                  <History size={15} />
                  <span className="hidden sm:inline">My Bookings</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* === Toolbar: count + filter button === */}
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              {loading ? 'Loading...' : (
                <>
                  <span className="font-semibold text-gray-800">{filteredProperties.length}</span>
                  {' '}{filteredProperties.length === 1 ? 'property' : 'properties'} available
                  {hasActiveFilters && (
                    <span className="ml-1.5 text-xs text-gray-400">
                      (filtered from {properties.length})
                    </span>
                  )}
                </>
              )}
            </p>

            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors px-2.5 py-2 rounded-lg hover:bg-gray-100"
                >
                  <RotateCcw size={13} />
                  <span>Clear</span>
                </button>
              )}
              <button
                onClick={() => setIsFilterOpen((v) => !v)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all border shadow-sm hover:shadow-md ${
                  isFilterOpen || hasActiveFilters
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white/60 backdrop-blur-sm text-gray-700 border-gray-200 hover:bg-white'
                }`}
              >
                <SlidersHorizontal size={16} />
                <span>Search & Filter</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* === Expandable filter panel === */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isFilterOpen ? 'max-h-[600px] opacity-100 mt-3' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <SlidersHorizontal size={15} className="text-gray-500" />
                  Search & Filter
                </h3>
                <button onClick={() => setIsFilterOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <X size={15} className="text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Search */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Search</label>
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Property name, location, or address..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-9 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 focus:bg-white transition-all"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Module / Type */}
                {availableModules.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Facility Type</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setModuleFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          moduleFilter === 'all'
                            ? 'bg-gray-800 text-white border-gray-800 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        All Types
                      </button>
                      {availableModules.map((mod) => (
                        <button
                          key={mod.id}
                          onClick={() => setModuleFilter(mod.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            moduleFilter === mod.id
                              ? 'bg-gray-800 text-white border-gray-800 shadow-sm'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {mod.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'all', label: 'All Categories', active: categoryFilter === 'all', cls: 'bg-gray-800 text-white border-gray-800', def: 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50' },
                      { value: 'A', label: 'Category A', active: categoryFilter === 'A', cls: 'bg-amber-600 text-white border-amber-600', def: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
                      { value: 'B', label: 'Category B', active: categoryFilter === 'B', cls: 'bg-blue-600 text-white border-blue-600', def: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
                      { value: 'C', label: 'Category C', active: categoryFilter === 'C', cls: 'bg-gray-600 text-white border-gray-600', def: 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100' },
                    ].map(({ value, label, active, cls, def }) => (
                      <button
                        key={value}
                        onClick={() => setCategoryFilter(value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-sm ${active ? cls : def}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location / City */}
                {availableCities.length > 0 && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Location</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setCityFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          cityFilter === 'all'
                            ? 'bg-gray-800 text-white border-gray-800 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        All Locations
                      </button>
                      {availableCities.map((city) => (
                        <button
                          key={city}
                          onClick={() => setCityFilter(city)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            cityFilter === city
                              ? 'bg-gray-800 text-white border-gray-800 shadow-sm'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <MapPin size={11} />
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {hasActiveFilters && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active &mdash; showing {filteredProperties.length} of {properties.length}
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-semibold transition-colors"
                  >
                    <RotateCcw size={12} />
                    Clear All
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable data area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredProperties.length === 0 ? (
            <FadeIn delay={200}>
              <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No properties found</h3>
                <p className="text-sm text-gray-500">
                  {hasActiveFilters ? 'Try adjusting your search or filters' : 'No properties are available for your access level'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </FadeIn>
          ) : viewMode === 'table' ? (
            <FadeIn delay={50}>
              <DataTable
                columns={tableColumns}
                data={filteredProperties}
                keyExtractor={(p) => p.id}
                onRowClick={(p) => navigate(`/properties/${p.id}`)}
                emptyMessage="No properties found"
              />
            </FadeIn>
          ) : viewMode === 'list' ? (
            <FadeIn delay={50}>
              <ListView emptyMessage="No properties found">
                {filteredProperties.map((property) => {
                  const cat = property.assetType?.category;
                  const catInfo = cat ? CATEGORY_LABELS[cat] : null;
                  return (
                    <ListViewItem
                      key={property.id}
                      icon={
                        property.images.length > 0
                          ? <img src={property.images[0]} alt={property.name} className="w-10 h-10 rounded-full object-cover" />
                          : <Building2 size={18} />
                      }
                      title={property.name}
                      subtitle={[property.estate?.city, property.address].filter(Boolean).join(' · ')}
                      badge={
                        <div className="flex items-center gap-1.5">
                          {property.module && <Badge variant="default" className="text-xs">{property.module.name}</Badge>}
                          {catInfo && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${catInfo.color}`}>
                              {catInfo.label}
                            </span>
                          )}
                        </div>
                      }
                      rightContent={
                        <div className="flex items-center gap-3">
                          {property.minPrice != null && (
                            <span className="text-sm font-semibold text-gray-900 hidden sm:block">
                              {formatCurrency(property.minPrice)}
                            </span>
                          )}
                          <button
                            onClick={(e) => handleBookClick(e, property)}
                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          >
                            <Calendar size={12} />
                            Book
                          </button>
                        </div>
                      }
                      onClick={() => navigate(`/properties/${property.id}`)}
                    />
                  );
                })}
              </ListView>
            </FadeIn>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProperties.map((property, index) => {
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
                            <Badge variant="default" className="text-xs">
                              {property.module.name}
                            </Badge>
                          )}
                          {property.propertyType && (
                            <Badge variant="success" className="text-xs">
                              {property.propertyType.name}
                            </Badge>
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
                              <p className="text-xs text-gray-500">{property.totalRooms} rooms available</p>
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
  );
};
