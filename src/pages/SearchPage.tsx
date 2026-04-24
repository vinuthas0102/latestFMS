import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Calendar, Building2, Map, List } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useSearchStore } from '../stores/searchStore';
import { usePropertyStore } from '../stores/propertyStore';
import { useAuthStore } from '../stores/authStore';
import { formatPriceRange } from '../utils/formatters';
import { SkeletonCard } from '../components/ui/Loading';
import { MapSearchView } from '../components/search/MapSearchView';
import { requiresLoginForBooking, getBookingButtonText, getModuleBadgeText, getModuleBadgeStyles } from '../utils/moduleHelpers';
import { ROUTES } from '../constants/routes';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { results, loading, setFilters, search } = useSearchStore();
  const { modules, propertyTypes, roomTypes, fetchModules, fetchPropertyTypes, fetchRoomTypes, fetchAmenities } = usePropertyStore();

  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [propertyTypeId, setPropertyTypeId] = useState('');
  const [roomTypeId, setRoomTypeId] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [hasAutoSearched, setHasAutoSearched] = useState(false);

  useEffect(() => {
    fetchModules();
    fetchRoomTypes();
    fetchAmenities();
  }, []);

  useEffect(() => {
    if (moduleId) {
      fetchPropertyTypes(moduleId);
      setPropertyTypeId('');
    } else {
      fetchPropertyTypes();
    }
  }, [moduleId]);

  useEffect(() => {
    const urlLocation = searchParams.get('location');
    const urlCheckIn = searchParams.get('checkIn');
    const urlCheckOut = searchParams.get('checkOut');
    const urlFacilityType = searchParams.get('facilityType');

    if ((urlLocation || urlCheckIn || urlCheckOut || urlFacilityType) && !hasAutoSearched) {
      if (urlLocation) setLocation(urlLocation);
      if (urlCheckIn) setCheckIn(urlCheckIn);
      if (urlCheckOut) setCheckOut(urlCheckOut);

      setFilters({
        location: urlLocation || '',
        checkInDate: urlCheckIn || '',
        checkOutDate: urlCheckOut || '',
        moduleId: '',
        propertyTypeId: '',
        roomTypeId: '',
      });

      search();
      setHasAutoSearched(true);
    }
  }, [searchParams, hasAutoSearched]);

  const handleSearch = () => {
    setFilters({
      location,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      moduleId,
      propertyTypeId,
      roomTypeId,
    });
    search();
  };

  const handleBookNow = (property: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const moduleCode = property.module?.code;
    const needsLogin = requiresLoginForBooking(moduleCode);

    const params = new URLSearchParams();
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    params.set('tab', 'booking');
    const queryString = params.toString();

    if (needsLogin && !user) {
      navigate(`${ROUTES.LOGIN}?returnUrl=/properties/${property.id}?${queryString}`);
      return;
    }
    navigate(`/properties/${property.id}?${queryString}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="bg-gradient-to-br from-blue-600 to-teal-600 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 animate-fadeIn">Find Your Perfect Facility</h1>
          <p className="text-xl text-blue-100 mb-8 animate-slideUp">
            Search from thousands of available properties across the region
          </p>

          <Card className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input
                  placeholder="Location or property name"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  icon={<MapPin size={20} />}
                  className="bg-white"
                />
                <Input
                  type="date"
                  placeholder="Check-in date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  icon={<Calendar size={20} />}
                  className="bg-white"
                />
                <Input
                  type="date"
                  placeholder="Check-out date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  icon={<Calendar size={20} />}
                  className="bg-white"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Select
                  options={[
                    { value: '', label: 'All Modules' },
                    ...modules.map((m) => ({ value: m.id, label: m.name })),
                  ]}
                  value={moduleId}
                  onChange={(e) => setModuleId(e.target.value)}
                  className="bg-white"
                />
                <Select
                  options={[
                    { value: '', label: moduleId ? 'All Property Types' : 'Select module first...' },
                    ...propertyTypes.map((pt) => ({ value: pt.id, label: pt.name })),
                  ]}
                  value={propertyTypeId}
                  onChange={(e) => setPropertyTypeId(e.target.value)}
                  disabled={!moduleId && propertyTypes.length === 0}
                  className="bg-white"
                />
                <Select
                  options={[
                    { value: '', label: 'All Room Types' },
                    ...roomTypes.map((rt) => ({ value: rt.id, label: rt.name })),
                  ]}
                  value={roomTypeId}
                  onChange={(e) => setRoomTypeId(e.target.value)}
                  className="bg-white"
                />
              </div>
              <div className="mt-4">
                <Button
                  onClick={handleSearch}
                  className="w-full"
                  size="lg"
                  icon={<Search size={20} />}
                  loading={loading}
                >
                  Search Facilities
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {results.length} {results.length === 1 ? 'Property' : 'Properties'} Found
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  icon={<List size={18} />}
                >
                  List
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  icon={<Map size={18} />}
                >
                  Map
                </Button>
              </div>
            </div>

            {viewMode === 'map' ? (
              <MapSearchView properties={results} checkIn={checkIn} checkOut={checkOut} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((property, index) => (
                <Card
                  key={property.id}
                  hoverable
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (checkIn) params.set('checkIn', checkIn);
                    if (checkOut) params.set('checkOut', checkOut);
                    const queryString = params.toString();
                    navigate(`/properties/${property.id}${queryString ? `?${queryString}` : ''}`);
                  }}
                  className="overflow-hidden animate-slideUp"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="h-48 bg-gradient-to-br from-blue-400 to-teal-400 relative overflow-hidden">
                    {property.images.length > 0 ? (
                      <img
                        src={property.images[0]}
                        alt={property.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Building2 size={48} className="text-white opacity-50" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {property.module && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {property.module.name}
                        </span>
                      )}
                      {property.propertyType && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                          {property.propertyType.name}
                        </span>
                      )}
                      {getModuleBadgeText(property.module?.code) && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getModuleBadgeStyles(property.module?.code)}`}>
                          {getModuleBadgeText(property.module?.code)}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{property.name}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {property.description || 'No description available'}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <MapPin size={16} />
                      <span>{property.estate?.city || property.address}</span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-600">
                        {property.minPrice !== property.maxPrice ? 'Price range' : 'Price'}
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatPriceRange(property.minPrice, property.maxPrice)}
                      </span>
                    </div>
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={(e) => handleBookNow(property, e)}
                    >
                      {getBookingButtonText(property.module?.code, !!user)}
                    </Button>
                  </div>
                </Card>
              ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
