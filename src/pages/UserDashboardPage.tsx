import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Calendar,
  Camera,
  Search,
  Star,
  Shield,
  Users,
  Home,
  RotateCcw,
  SlidersHorizontal,
  Eye,
  X,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Badge } from '../components/ui/Badge';
import { ImageCarousel } from '../components/ui/ImageCarousel';
import { ViewSwitcher } from '../components/ui/ViewSwitcher';
import { SkeletonCard } from '../components/ui/Loading';
import { FadeIn } from '../components/animations/FadeIn';
import { propertyService } from '../services/propertyService';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useViewPreference } from '../hooks/useViewPreference';
import { PropertyDTO } from '../types';
import { ROUTES } from '../constants/routes';
import { ROLE_LABELS } from '../constants/roles';
import { requiresLoginForBooking, getModuleBadgeText, getModuleBadgeStyles } from '../utils/moduleHelpers';
import { formatCurrency } from '../utils/formatters';

const CATEGORY_LABELS: Record<string, { label: string; color: string; description: string }> = {
  A: {
    label: 'Category A',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Premium Government Facilities',
  },
  B: {
    label: 'Category B',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Standard Facilities',
  },
  C: {
    label: 'Category C',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    description: 'General Facilities',
  },
};

const ROLE_WELCOME: Record<string, { title: string; subtitle: string; icon: React.ReactNode }> = {
  govt_official: {
    title: 'Government Official Portal',
    subtitle: 'Access Category A and B facilities for official use',
    icon: <Shield className="w-7 h-7 text-white" />,
  },
  dept_user: {
    title: 'Department User Portal',
    subtitle: 'Browse and book Category B facilities',
    icon: <Users className="w-7 h-7 text-white" />,
  },
  public: {
    title: 'Community Facilities',
    subtitle: 'Discover and book available community venues',
    icon: <Home className="w-7 h-7 text-white" />,
  },
};

export const UserDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const addToast = useUIStore((state) => state.addToast);

  const [properties, setProperties] = useState<PropertyDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [availableModules, setAvailableModules] = useState<{ id: string; name: string }[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useViewPreference('viewMode_dashboard', 'card');

  useEffect(() => {
    loadProperties();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    if (filterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterOpen]);

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
      data.forEach((p) => {
        if (p.module) modulesMap.set(p.module.id, { id: p.module.id, name: p.module.name });
      });
      setAvailableModules(Array.from(modulesMap.values()));
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
    return matchesSearch && matchesModule;
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
  };

  const roleKey = user?.role || 'public';
  const welcomeInfo = ROLE_WELCOME[roleKey] || ROLE_WELCOME.public;
  const hasActiveFilters = searchQuery || moduleFilter !== 'all';
  const activeFilterCount = (searchQuery ? 1 : 0) + (moduleFilter !== 'all' ? 1 : 0);

  const categoryStats = {
    A: properties.filter((p) => p.assetType?.category === 'A').length,
    B: properties.filter((p) => p.assetType?.category === 'B').length,
  };

  const PropertyCard = ({ property, index }: { property: PropertyDTO; index: number }) => {
    const category = property.assetType?.category;
    const categoryInfo = category ? CATEGORY_LABELS[category] : null;
    const moduleBadgeText = getModuleBadgeText(property.module?.code);
    const moduleBadgeStyles = getModuleBadgeStyles(property.module?.code);

    return (
      <FadeIn delay={index * 50}>
        <div
          className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
          onClick={() => navigate(`/properties/${property.id}`)}
        >
          <div className="h-28 relative overflow-hidden bg-gray-100">
            {property.images.length > 0 ? (
              <>
                <ImageCarousel
                  images={property.images}
                  alt={property.name}
                  className="h-28"
                  autoPlay={true}
                  autoPlayInterval={4000}
                />
                {property.images.length > 1 && (
                  <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <Camera className="w-2.5 h-2.5 text-white" />
                    <span className="text-white text-xs font-medium">{property.images.length}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <Building2 size={32} className="text-gray-300" />
              </div>
            )}
            {categoryInfo && (
              <div className="absolute top-2 right-2">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold border ${categoryInfo.color}`}>
                  {categoryInfo.label}
                </span>
              </div>
            )}
          </div>

          <div className="p-2.5">
            <div className="flex flex-wrap gap-1 mb-1">
              {property.module && (
                <Badge variant="default" className="text-xs">
                  {property.module.name}
                </Badge>
              )}
              {moduleBadgeText && (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${moduleBadgeStyles}`}>
                  {moduleBadgeText}
                </span>
              )}
            </div>

            <h3 className="text-xs font-bold text-gray-900 mb-0.5 group-hover:text-blue-600 transition-colors line-clamp-1">
              {property.name}
            </h3>

            <p className="text-xs text-gray-500 mb-1.5 line-clamp-1 leading-snug">
              {property.description || 'No description available'}
            </p>

            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
              <MapPin size={11} className="text-gray-400 flex-shrink-0" />
              <span className="truncate">{property.estate?.city || property.address}</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                {property.minPrice != null && (
                  <p className="text-xs font-semibold text-gray-900">
                    From {formatCurrency(property.minPrice)}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => handleBookClick(e, property)}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-xs font-semibold transition-all duration-200"
              >
                <Calendar size={11} />
                Book
              </button>
            </div>
          </div>
        </div>
      </FadeIn>
    );
  };

  const PropertyListRow = ({ property, index }: { property: PropertyDTO; index: number }) => {
    const category = property.assetType?.category;
    const categoryInfo = category ? CATEGORY_LABELS[category] : null;

    return (
      <FadeIn delay={index * 40}>
        <div
          className="bg-white rounded-lg border border-gray-200 flex items-center gap-3 p-2.5 hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer group"
          onClick={() => navigate(`/properties/${property.id}`)}
        >
          <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
            {property.images.length > 0 ? (
              <img src={property.images[0]} alt={property.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 size={20} className="text-gray-300" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              {property.module && (
                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                  {property.module.name}
                </span>
              )}
              {categoryInfo && (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold border ${categoryInfo.color}`}>
                  {categoryInfo.label}
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
              {property.name}
            </h3>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
              <MapPin size={11} className="text-gray-400 flex-shrink-0" />
              <span className="truncate">{property.estate?.city || property.address}</span>
            </div>
          </div>

          <div className="flex-shrink-0 text-right">
            {property.minPrice != null && (
              <p className="text-xs font-semibold text-gray-900 mb-1.5">
                From {formatCurrency(property.minPrice)}
              </p>
            )}
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => navigate(`/properties/${property.id}`)}
                className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
                title="View details"
              >
                <Eye size={13} />
              </button>
              <button
                onClick={(e) => handleBookClick(e, property)}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 rounded text-xs font-semibold transition-colors"
                title="Book"
              >
                <Calendar size={11} />
                Book
              </button>
            </div>
          </div>
        </div>
      </FadeIn>
    );
  };

  const PropertyTableRow = ({ property, index }: { property: PropertyDTO; index: number }) => {
    const category = property.assetType?.category;
    const categoryInfo = category ? CATEGORY_LABELS[category] : null;

    return (
      <tr
        className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
        onClick={() => navigate(`/properties/${property.id}`)}
        style={{ animationDelay: `${index * 30}ms` }}
      >
        <td className="px-3 py-2.5 w-10">
          <div className="w-9 h-9 rounded-md overflow-hidden bg-gray-100">
            {property.images.length > 0 ? (
              <img src={property.images[0]} alt={property.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 size={16} className="text-gray-300" />
              </div>
            )}
          </div>
        </td>
        <td className="px-3 py-2.5">
          <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {property.name}
          </span>
        </td>
        <td className="px-3 py-2.5 hidden sm:table-cell">
          {property.module && (
            <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
              {property.module.name}
            </span>
          )}
        </td>
        <td className="px-3 py-2.5 hidden md:table-cell">
          {categoryInfo && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold border ${categoryInfo.color}`}>
              {categoryInfo.label}
            </span>
          )}
        </td>
        <td className="px-3 py-2.5 hidden lg:table-cell">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin size={11} className="text-gray-400 flex-shrink-0" />
            <span className="truncate max-w-[140px]">{property.estate?.city || property.address}</span>
          </div>
        </td>
        <td className="px-3 py-2.5 hidden md:table-cell">
          {property.minPrice != null && (
            <span className="text-xs font-semibold text-gray-900">
              {formatCurrency(property.minPrice)}
            </span>
          )}
        </td>
        <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5 justify-end">
            <button
              onClick={() => navigate(`/properties/${property.id}`)}
              className="p-1.5 rounded border border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              title="View details"
            >
              <Eye size={13} />
            </button>
            <button
              onClick={(e) => handleBookClick(e, property)}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-semibold transition-colors"
              title="Book"
            >
              <Calendar size={11} />
              <span className="hidden sm:inline">Book</span>
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50/30">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <FadeIn delay={0}>
          <div className="relative" ref={filterRef}>
            <div className="relative bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl px-4 py-2.5 mb-3 overflow-hidden shadow-md">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -top-8 -right-8 w-64 h-64 bg-white rounded-full" />
              </div>
              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg flex-shrink-0">
                    {welcomeInfo.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h1 className="text-base font-bold text-white truncate">{welcomeInfo.title}</h1>
                      {user && (
                        <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs text-white/80 whitespace-nowrap">
                          {ROLE_LABELS[user.role]}
                        </span>
                      )}
                    </div>
                    <p className="text-white/60 text-xs truncate">{welcomeInfo.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {user?.role === 'govt_official' && (
                    <div className="hidden md:flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1.5">
                        <Star size={13} className="text-amber-300" />
                        <span className="text-white text-xs font-medium">{categoryStats.A} Cat A</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1.5">
                        <Building2 size={13} className="text-sky-300" />
                        <span className="text-white text-xs font-medium">{categoryStats.B} Cat B</span>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => setFilterOpen((prev) => !prev)}
                    className="relative flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                  >
                    <SlidersHorizontal size={14} />
                    <span className="hidden sm:inline">Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-slate-900 rounded-full text-xs flex items-center justify-center font-bold leading-none">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {filterOpen && (
              <div className="absolute right-0 top-full z-50 w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-3 mt-1">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-sm font-semibold text-gray-800">Filter Properties</span>
                  <button
                    onClick={() => setFilterOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="relative mb-3">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                    autoFocus
                  />
                </div>

                {availableModules.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1.5">Facility Type</p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setModuleFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          moduleFilter === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        All Types
                      </button>
                      {availableModules.map((mod) => (
                        <button
                          key={mod.id}
                          onClick={() => setModuleFilter(mod.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                            moduleFilter === mod.id ? 'bg-slate-800 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {mod.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="mt-3 flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    <RotateCcw size={11} />
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
        </FadeIn>

        <FadeIn delay={100}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {loading ? 'Loading...' : `${filteredProperties.length} ${filteredProperties.length === 1 ? 'property' : 'properties'} available`}
            </p>
            <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />
          </div>
        </FadeIn>

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
                {hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'No properties are available for your access level'}
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
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProperties.map((property, index) => (
              <PropertyCard key={property.id} property={property} index={index} />
            ))}
          </div>
        ) : viewMode === 'list' ? (
          <div className="flex flex-col gap-2">
            {filteredProperties.map((property, index) => (
              <PropertyListRow key={property.id} property={property} index={index} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2.5 w-10"></th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Name</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden sm:table-cell">Type</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden md:table-cell">Category</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden lg:table-cell">Location</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden md:table-cell">From</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProperties.map((property, index) => (
                    <PropertyTableRow key={property.id} property={property} index={index} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
