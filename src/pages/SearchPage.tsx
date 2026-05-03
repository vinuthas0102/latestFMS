import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Calendar, Building2, Map, List } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { FilterDrawer } from '../components/ui/FilterDrawer';
import { MandatorySearchBar } from '../components/ui/MandatorySearchBar';
import { useSearchStore } from '../stores/searchStore';
import { usePropertyStore } from '../stores/propertyStore';
import { useAuthStore } from '../stores/authStore';
import { SkeletonCard } from '../components/ui/Loading';
import { MapSearchView } from '../components/search/MapSearchView';
import { requiresLoginForBooking } from '../utils/moduleHelpers';
import { ROUTES } from '../constants/routes';
import { PropertyListCard } from '../components/property/PropertyListCard';
import { PropertyDTO } from '../types';

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
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
    setFilters({ location, checkInDate: checkIn, checkOutDate: checkOut, moduleId, propertyTypeId, roomTypeId });
    search();
  };

  const handleBookNow = (e: React.MouseEvent, property: PropertyDTO) => {
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

  const optionalFilterCount = (moduleId ? 1 : 0) + (propertyTypeId ? 1 : 0) + (roomTypeId ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero banner */}
      <div className="bg-gradient-to-br from-blue-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-1 animate-fadeIn">Find Your Perfect Facility</h1>
          <p className="text-sm text-blue-100 mb-5 animate-slideUp">
            Search from thousands of available properties across the region
          </p>

          {/* Mandatory search bar */}
          <MandatorySearchBar
            fields={[
              {
                key: 'location',
                label: 'Location',
                type: 'text',
                placeholder: 'City, property name or area...',
                value: location,
                onChange: setLocation,
                icon: <MapPin size={14} />,
              },
              {
                key: 'checkin',
                label: 'Check-in',
                type: 'date',
                value: checkIn,
                onChange: setCheckIn,
              },
              {
                key: 'checkout',
                label: 'Check-out',
                type: 'date',
                value: checkOut,
                onChange: setCheckOut,
              },
            ]}
            onSearch={handleSearch}
            searchLabel="Search"
            filterCount={optionalFilterCount}
            onFilterOpen={() => setIsFilterOpen(true)}
          />
        </div>
      </div>

      {/* Optional filter drawer */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Advanced Filters"
        activeFilterCount={optionalFilterCount}
        onClearAll={() => { setModuleId(''); setPropertyTypeId(''); setRoomTypeId(''); }}
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Facility Type</label>
            <select
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            >
              <option value="">All Facility Types</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Property Type</label>
            <select
              value={propertyTypeId}
              onChange={(e) => setPropertyTypeId(e.target.value)}
              disabled={!moduleId && propertyTypes.length === 0}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">{moduleId ? 'All Property Types' : 'Select facility type first'}</option>
              {propertyTypes.map((pt) => (
                <option key={pt.id} value={pt.id}>{pt.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Room Type</label>
            <select
              value={roomTypeId}
              onChange={(e) => setRoomTypeId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            >
              <option value="">All Room Types</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>{rt.name}</option>
              ))}
            </select>
          </div>
        </div>
      </FilterDrawer>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-10">
            <Building2 className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or use More Filters</p>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {results.length} {results.length === 1 ? 'Property' : 'Properties'} Found
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <List size={15} />
                  <span>List</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    viewMode === 'map'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Map size={15} />
                  <span>Map</span>
                </button>
              </div>
            </div>

            {viewMode === 'map' ? (
              <MapSearchView properties={results} checkIn={checkIn} checkOut={checkOut} />
            ) : (
              <div className="space-y-4">
                {results.map((property) => (
                  <PropertyListCard
                    key={property.id}
                    property={property}
                    checkIn={checkIn}
                    checkOut={checkOut}
                    isLoggedIn={!!user}
                    onBookClick={handleBookNow}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
