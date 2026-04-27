import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, MapPin, Calendar, Camera, Filter, CheckCircle, Clock, Layers } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { SummaryStatsCard } from '../components/ui/SummaryStatsCard';
import { FilterDrawer } from '../components/ui/FilterDrawer';
import { ViewSwitcher } from '../components/ui/ViewSwitcher';
import { DataTable } from '../components/ui/DataTable';
import { ListView, ListViewItem } from '../components/ui/ListView';
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useViewPreference('propertiesView', 'card');

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

  const filteredProperties = properties.filter((property) => {
    const matchesStatus = filterStatus === 'all' || property.status === filterStatus;
    const matchesSearch = !searchQuery ||
      property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.estate?.city?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: properties.length,
    published: properties.filter((p) => p.status === 'PUBLISHED').length,
    draft: properties.filter((p) => p.status === 'DRAFT').length,
    totalRooms: properties.reduce((sum, p) => sum + (p.totalRooms || 0), 0),
  };

  const handleClearFilters = () => {
    setFilterStatus('all');
    setSearchQuery('');
  };

  const activeFilterCount = (filterStatus !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/20">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <FadeIn delay={0}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl shadow-lg">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                Property Management
              </h1>
              <p className="text-gray-600">Manage all facilities and assets</p>
            </div>
            <div className="flex items-center gap-3">
              <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />
              <button
                onClick={() => setIsFilterOpen(true)}
                className="relative flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-lg hover:bg-white hover:shadow-md transition-all"
              >
                <Filter size={18} />
                <span className="font-medium text-sm">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {canManage && (
                <Button onClick={() => navigate(ROUTES.PROPERTY_CREATE)} icon={<Plus size={20} />}>
                  New Property
                </Button>
              )}
            </div>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <SummaryStatsCard
            label="Total Properties"
            value={stats.total}
            icon={Building2}
            gradient="bg-gradient-to-r from-blue-500 to-teal-500"
            onClick={() => setFilterStatus('all')}
            isActive={filterStatus === 'all'}
            delay={100}
          />
          <SummaryStatsCard
            label="Published"
            value={stats.published}
            icon={CheckCircle}
            gradient="bg-gradient-to-r from-emerald-500 to-cyan-500"
            onClick={() => setFilterStatus('PUBLISHED')}
            isActive={filterStatus === 'PUBLISHED'}
            delay={150}
          />
          <SummaryStatsCard
            label="Draft"
            value={stats.draft}
            icon={Clock}
            gradient="bg-gradient-to-r from-amber-500 to-orange-500"
            onClick={() => setFilterStatus('DRAFT')}
            isActive={filterStatus === 'DRAFT'}
            delay={200}
          />
          <SummaryStatsCard
            label="Total Rooms"
            value={stats.totalRooms}
            icon={Layers}
            gradient="bg-gradient-to-r from-sky-500 to-blue-600"
            delay={250}
          />
        </div>

        <FilterDrawer
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          title="Property Filters"
          onClearAll={handleClearFilters}
          activeFilterCount={activeFilterCount}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search
              </label>
              <Input
                type="text"
                placeholder="Property name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All Properties', icon: Building2 },
                  { value: 'PUBLISHED', label: 'Published', icon: CheckCircle },
                  { value: 'DRAFT', label: 'Draft', icon: Clock },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setFilterStatus(value)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-all ${
                      filterStatus === value
                        ? 'bg-gradient-to-br from-green-500 to-teal-500 text-white shadow-md'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium text-sm">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </FilterDrawer>

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
            <ListView emptyMessage="No properties found">
              {filteredProperties.map((property) => (
                <ListViewItem
                  key={property.id}
                  icon={<Building2 size={18} />}
                  title={property.name}
                  subtitle={`${property.module?.name || 'N/A'} • ${property.estate?.city || property.address}`}
                  badge={
                    <Badge variant={property.status === 'PUBLISHED' ? 'success' : 'warning'} className="text-xs">
                      {property.status}
                    </Badge>
                  }
                  rightContent={
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{property.totalRooms || 0} rooms</p>
                        <p className="text-xs text-gray-500">{property.propertyType?.name}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookingClick(e as any, property);
                        }}
                      >
                        <Calendar size={14} />
                      </Button>
                    </div>
                  }
                  onClick={() => handleCardClick(property)}
                />
              ))}
            </ListView>
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
  );
};
