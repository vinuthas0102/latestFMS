import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, MapPin, Calendar, Camera, CheckCircle, Clock, Layers, Search } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { SummaryStatsCard } from '../components/ui/SummaryStatsCard';
import { ViewSwitcher } from '../components/ui/ViewSwitcher';
import { MandatorySearchBar } from '../components/ui/MandatorySearchBar';
import { FilterDrawer } from '../components/ui/FilterDrawer';
import { DataTable } from '../components/ui/DataTable';
import { PropertyListCard } from '../components/property/PropertyListCard';
import { usePropertyStore } from '../stores/propertyStore';
import { useAuthStore } from '../stores/authStore';
import { canManageProperties } from '../utils/permissions';
import { SkeletonCard } from '../components/ui/Loading';
import { ImageCarousel } from '../components/ui/ImageCarousel';
import { PropertyQuickViewModal } from '../components/property/PropertyQuickViewModal';
import { PropertyDTO } from '../types';
import { ROUTES } from '../constants/routes';
import { FadeIn } from '../components/animations/FadeIn';
import { requiresLoginForBooking, getBookingButtonText, getModuleBadgeText, getModuleBadgeStyles } from '../utils/moduleHelpers';
import { useViewPreference } from '../hooks/useViewPreference';

export const PropertiesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { properties, loading, fetchProperties } = usePropertyStore();
  const [selectedProperty, setSelectedProperty] = useState<PropertyDTO | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useViewPreference('propertiesView', 'list');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [moduleFilter, setModuleFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'default' | 'name_asc' | 'newest'>('default');

  useEffect(() => {
    fetchProperties();
  }, []);

  const canManage = user && canManageProperties(user.role);

  const handleCardClick = (property: PropertyDTO) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProperty(null);
  };

  const handleBookingClick = (e: React.MouseEvent, property: PropertyDTO) => {
    e.stopPropagation();
    const moduleCode = property.module?.code;
    const needsLogin = requiresLoginForBooking(moduleCode);

    if (needsLogin && !user) {
      navigate(`${ROUTES.LOGIN}?returnUrl=/properties/${property.id}?tab=booking`);
      return;
    }
    navigate(`/properties/${property.id}?tab=booking`);
  };

  const availableModules = useMemo(() => (
    [...new Map(properties.filter(p => p.module).map(p => [p.module!.id, p.module!])).values()]
  ), [properties]);

  const availableCities = useMemo(() => (
    [...new Set(properties.map(p => p.estate?.city).filter(Boolean) as string[])].sort()
  ), [properties]);

  const drawerActiveCount = (moduleFilter !== 'all' ? 1 : 0) + (cityFilter !== 'all' ? 1 : 0) + (sortOrder !== 'default' ? 1 : 0);

  const filteredProperties = useMemo(() => {
    let result = properties.filter((property) => {
      const matchesStatus = filterStatus === 'all' || property.status === filterStatus;
      const matchesSearch = !searchQuery ||
        property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.estate?.city?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesModule = moduleFilter === 'all' || property.module?.id === moduleFilter;
      const matchesCity = cityFilter === 'all' || property.estate?.city === cityFilter;
      return matchesStatus && matchesSearch && matchesModule && matchesCity;
    });
    if (sortOrder === 'name_asc') result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [properties, filterStatus, searchQuery, moduleFilter, cityFilter, sortOrder]);

  const stats = {
    total: properties.length,
    published: properties.filter((p) => p.status === 'PUBLISHED').length,
    draft: properties.filter((p) => p.status === 'DRAFT').length,
    totalRooms: properties.reduce((sum, p) => sum + (p.totalRooms || 0), 0),
  };

  const handleClearFilters = () => {
    setFilterStatus('all');
    setSearchQuery('');
    setModuleFilter('all');
    setCityFilter('all');
    setSortOrder('default');
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-green-50/20">
      <Header />

      {/* Frozen hero header */}
      <div className="flex-none bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-3">
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-0.5 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl shadow-lg">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                Property Management
              </h1>
              <p className="text-sm text-gray-500 ml-12">Manage all facilities and assets</p>
            </div>
            <div className="flex items-center gap-3">
              <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />
              {canManage && (
                <Button onClick={() => navigate(ROUTES.PROPERTY_CREATE)} icon={<Plus size={18} />} size="sm">
                  New Property
                </Button>
              )}
            </div>
          </div>

          {/* Mandatory search bar */}
          <MandatorySearchBar
            fields={[
              {
                key: 'search',
                label: 'Search',
                type: 'text',
                placeholder: 'Property name or location...',
                value: searchQuery,
                onChange: setSearchQuery,
                icon: <Search size={14} />,
              },
              {
                key: 'status',
                label: 'Status',
                type: 'chips',
                value: filterStatus,
                onChange: setFilterStatus,
                options: [
                  { value: 'all', label: 'All' },
                  { value: 'PUBLISHED', label: 'Published' },
                  { value: 'DRAFT', label: 'Draft' },
                ],
              },
            ]}
            filterCount={drawerActiveCount}
            onFilterOpen={() => setIsFilterOpen(true)}
            className="mb-3"
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryStatsCard
              label="Total Properties"
              value={stats.total}
              icon={Building2}
              gradient="bg-gradient-to-r from-blue-600 to-teal-500"
              onClick={() => setFilterStatus('all')}
              isActive={filterStatus === 'all'}
              delay={100}
              subtitle="All facilities"
              secondaryValue={stats.published}
              secondaryLabel="Live"
            />
            <SummaryStatsCard
              label="Published"
              value={stats.published}
              icon={CheckCircle}
              gradient="bg-gradient-to-r from-emerald-500 to-cyan-500"
              onClick={() => setFilterStatus('PUBLISHED')}
              isActive={filterStatus === 'PUBLISHED'}
              delay={150}
              subtitle="Active & bookable"
              trend={stats.total > 0 ? Math.round((stats.published / stats.total) * 100) : 0}
            />
            <SummaryStatsCard
              label="Draft"
              value={stats.draft}
              icon={Clock}
              gradient="bg-gradient-to-r from-amber-500 to-orange-500"
              onClick={() => setFilterStatus('DRAFT')}
              isActive={filterStatus === 'DRAFT'}
              delay={200}
              subtitle="Pending publish"
              secondaryValue={stats.total > 0 ? Math.round((stats.draft / stats.total) * 100) : 0}
              secondaryLabel="%"
            />
            <SummaryStatsCard
              label="Total Rooms"
              value={stats.totalRooms}
              icon={Layers}
              gradient="bg-gradient-to-r from-sky-500 to-blue-600"
              delay={250}
              subtitle="Across all properties"
              secondaryValue={stats.total > 0 ? Math.round(stats.totalRooms / stats.total) : 0}
              secondaryLabel="Avg/prop"
            />
          </div>
        </div>
      </div>

      {/* Optional advanced filter drawer */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Advanced Filters"
        activeFilterCount={drawerActiveCount}
        onClearAll={() => { setModuleFilter('all'); setCityFilter('all'); setSortOrder('default'); }}
      >
        <div className="space-y-6">
          {availableModules.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Facility Type</label>
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              >
                <option value="all">All Types</option>
                {availableModules.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          {availableCities.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              >
                <option value="all">All Locations</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
            <div className="space-y-2">
              {[
                { value: 'default', label: 'Default' },
                { value: 'name_asc', label: 'Name A–Z' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSortOrder(value as typeof sortOrder)}
                  className={`w-full flex items-center px-4 py-2.5 rounded-lg text-left text-sm font-medium transition-all ${
                    sortOrder === value
                      ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FilterDrawer>

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
          <FadeIn delay={300}>
            <div className="pastel-lavender-gradient rounded-xl p-12 text-center">
              <Building2 className="mx-auto text-gray-400 mb-4 animate-pulse-slow" size={64} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties found</h3>
              <p className="text-gray-600 mb-6">{properties.length === 0 ? 'Create your first property to get started' : 'Try adjusting your filters'}</p>
              {canManage && properties.length === 0 && (
                <Button onClick={() => navigate('/properties/create')}>Create Property</Button>
              )}
            </div>
          </FadeIn>
        ) : viewMode === 'card' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProperties.map((property, index) => {
                const getGradientClass = () => {
                  if (property.status === 'PUBLISHED') return 'pastel-green-gradient';
                  if (property.status === 'DRAFT') return 'pastel-yellow-gradient';
                  return 'pastel-blue-gradient';
                };

                return (
                  <FadeIn key={property.id} delay={index * 60}>
                    <div
                      onClick={() => handleCardClick(property)}
                      className={`${getGradientClass()} rounded-xl overflow-hidden cursor-pointer`}
                    >
                      <div className="h-40 relative overflow-hidden">
                        {property.images.length > 0 ? (
                          <>
                            <ImageCarousel
                              images={property.images}
                              alt={property.name}
                              className="h-40"
                              autoPlay={true}
                              autoPlayInterval={3000}
                            />
                            {property.images.length > 1 && (
                              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                                <Camera className="w-3 h-3 text-white" />
                                <span className="text-white text-xs font-medium">{property.images.length}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className={`${getGradientClass()} flex items-center justify-center h-full`}>
                            <Building2 size={40} className="text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge variant={property.status === 'PUBLISHED' ? 'success' : 'warning'} className="text-xs">
                            {property.status}
                          </Badge>
                        </div>
                        <button
                          onClick={(e) => handleBookingClick(e, property)}
                          className="absolute bottom-2 right-2 bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-3 py-2 rounded-lg shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2 text-xs font-medium"
                          title={getBookingButtonText(property.module?.code, !!user)}
                        >
                          <Calendar className="w-3 h-3" />
                          <span>{requiresLoginForBooking(property.module?.code) && !user ? 'Login' : 'Book'}</span>
                        </button>
                      </div>
                      <div className="p-4 bg-white">
                        <div className="flex flex-wrap gap-1.5 mb-2">
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
                          {getModuleBadgeText(property.module?.code) && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getModuleBadgeStyles(property.module?.code)}`}>
                              {getModuleBadgeText(property.module?.code)}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-2">{property.name}</h3>
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                          {property.description || 'No description available'}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-white/50 rounded-md p-2">
                          <MapPin size={14} className="text-gray-400" />
                          <span className="truncate">{property.estate?.city || property.address}</span>
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                );
              })}
            </div>

            {selectedProperty && (
              <PropertyQuickViewModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                property={selectedProperty}
              />
            )}
          </>
        ) : viewMode === 'table' ? (
          <FadeIn delay={300}>
            <DataTable
              columns={[
                {
                  key: 'name',
                  label: 'Property Name',
                  sortable: true,
                  width: '25%',
                },
                {
                  key: 'module',
                  label: 'Module',
                  sortable: false,
                  render: (property) => property.module?.name || 'N/A',
                },
                {
                  key: 'propertyType',
                  label: 'Type',
                  sortable: false,
                  render: (property) => property.propertyType?.name || 'N/A',
                },
                {
                  key: 'location',
                  label: 'Location',
                  sortable: false,
                  render: (property) => property.estate?.city || property.address || 'N/A',
                },
                {
                  key: 'totalRooms',
                  label: 'Rooms',
                  sortable: true,
                  render: (property) => property.totalRooms || 0,
                },
                {
                  key: 'status',
                  label: 'Status',
                  sortable: true,
                  render: (property) => (
                    <Badge variant={property.status === 'PUBLISHED' ? 'success' : 'warning'} className="text-xs">
                      {property.status}
                    </Badge>
                  ),
                },
                {
                  key: 'actions',
                  label: 'Actions',
                  sortable: false,
                  width: '15%',
                  render: (property) => (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/properties/${property.id}`);
                        }}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => handleBookingClick(e as any, property)}
                      >
                        Book
                      </Button>
                    </div>
                  ),
                },
              ]}
              data={filteredProperties}
              keyExtractor={(property) => property.id}
              onRowClick={(property) => handleCardClick(property)}
              emptyMessage="No properties found"
            />
          </FadeIn>
        ) : (
          <FadeIn delay={300}>
            <div className="space-y-4">
              {filteredProperties.map((property) => (
                <PropertyListCard
                  key={property.id}
                  property={property}
                  isLoggedIn={!!user}
                  onBookClick={handleBookingClick}
                />
              ))}
            </div>
          </FadeIn>
        )}

        {selectedProperty && (
          <PropertyQuickViewModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            property={selectedProperty}
          />
        )}
        </div>
      </div>
    </div>
  );
};
