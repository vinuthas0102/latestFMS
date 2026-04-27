import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Calendar,
  Camera,
  Search,
  History,
  ChevronRight,
  Star,
  Shield,
  Users,
  Home,
  RotateCcw,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ImageCarousel } from '../components/ui/ImageCarousel';
import { SkeletonCard } from '../components/ui/Loading';
import { FadeIn } from '../components/animations/FadeIn';
import { propertyService } from '../services/propertyService';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
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

  useEffect(() => {
    loadProperties();
  }, [user]);

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

  const categoryStats = {
    A: properties.filter((p) => p.assetType?.category === 'A').length,
    B: properties.filter((p) => p.assetType?.category === 'B').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50/30">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <FadeIn delay={0}>
          <div className="relative bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-4 mb-4 overflow-hidden shadow-xl">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-8 -right-8 w-64 h-64 bg-white rounded-full" />
              <div className="absolute -bottom-12 -left-12 w-96 h-96 bg-white rounded-full" />
            </div>
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl flex-shrink-0">
                  {welcomeInfo.icon}
                </div>
                <div>
                  <p className="text-white/70 text-sm font-medium mb-1">
                    {user ? `Welcome back, ${user.fullName || user.email}` : 'Welcome'}
                    {user && (
                      <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                        {ROLE_LABELS[user.role]}
                      </span>
                    )}
                  </p>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">{welcomeInfo.title}</h1>
                  <p className="text-white/70 text-sm mt-1">{welcomeInfo.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 flex items-center gap-2"
                  onClick={() => navigate(ROUTES.BOOKINGS)}
                >
                  <History size={18} />
                  <span>My Bookings</span>
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>

            {user?.role === 'govt_official' && (
              <div className="relative mt-6 flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                  <Star size={16} className="text-amber-300" />
                  <span className="text-white text-sm font-medium">
                    {categoryStats.A} Category A {categoryStats.A === 1 ? 'Property' : 'Properties'} Available
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                  <Building2 size={16} className="text-sky-300" />
                  <span className="text-white text-sm font-medium">
                    {categoryStats.B} Category B {categoryStats.B === 1 ? 'Property' : 'Properties'} Available
                  </span>
                </div>
              </div>
            )}
          </div>
        </FadeIn>

        <FadeIn delay={100}>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search properties by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
              />
            </div>
            {availableModules.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setModuleFilter('all')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    moduleFilter === 'all'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All Types
                </button>
                {availableModules.map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => setModuleFilter(mod.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      moduleFilter === mod.id
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {mod.name}
                  </button>
                ))}
              </div>
            )}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors px-2 py-2"
              >
                <RotateCcw size={14} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </FadeIn>

        <FadeIn delay={150}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {loading ? 'Loading...' : `${filteredProperties.length} ${filteredProperties.length === 1 ? 'property' : 'properties'} available`}
            </p>
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
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProperties.map((property, index) => {
              const category = property.assetType?.category;
              const categoryInfo = category ? CATEGORY_LABELS[category] : null;
              const moduleBadgeText = getModuleBadgeText(property.module?.code);
              const moduleBadgeStyles = getModuleBadgeStyles(property.module?.code);

              return (
                <FadeIn key={property.id} delay={index * 50}>
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
  );
};
