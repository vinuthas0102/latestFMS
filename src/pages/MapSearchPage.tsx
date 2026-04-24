import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { GoogleMapComponent } from '../components/maps/GoogleMapComponent';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { PropertyDTO } from '../types';
import { locationSearchService } from '../services/locationSearchService';
import { propertyService } from '../services/propertyService';
import { Building2, MapPin, Calendar, Navigation } from 'lucide-react';
import { AvailabilityCalendarModal } from '../components/availability/AvailabilityCalendarModal';

export const MapSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [_properties, setProperties] = useState<PropertyDTO[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PropertyDTO[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(20);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarProperty, setCalendarProperty] = useState<PropertyDTO | null>(null);

  const defaultLat = parseFloat(searchParams.get('lat') || '28.6139');
  const defaultLng = parseFloat(searchParams.get('lng') || '77.209');

  useEffect(() => {
    loadAllProperties();
  }, []);

  useEffect(() => {
    if (searchLocation) {
      handleLocationSearch(searchLocation.lat, searchLocation.lng);
    }
  }, [searchLocation, radiusKm]);

  const loadAllProperties = async () => {
    try {
      setLoading(true);
      const allProperties = await propertyService.getProperties({ status: 'ACTIVE' });
      const propertiesWithCoords = allProperties.filter(p => p.latitude && p.longitude);
      setProperties(propertiesWithCoords);
      setFilteredProperties(propertiesWithCoords);
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSearch = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const nearbyProperties = await locationSearchService.searchPropertiesByLocation({
        latitude: lat,
        longitude: lng,
        radiusKm,
      });
      setFilteredProperties(nearbyProperties);
    } catch (error) {
      console.error('Failed to search properties by location:', error);
      setFilteredProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setSearchLocation({ lat, lng, address: 'Your Location' });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enable location services.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const centerLat = searchLocation?.lat || defaultLat;
  const centerLng = searchLocation?.lng || defaultLng;

  const markers = filteredProperties.map((p) => ({
    lat: parseFloat(p.latitude as any),
    lng: parseFloat(p.longitude as any),
    title: p.name,
    propertyId: p.id,
    color: '#2563eb',
  }));

  const handleMarkerClick = (marker: any) => {
    const property = filteredProperties.find((p) => p.id === marker.propertyId);
    if (property) {
      setSelectedProperty(property);
    }
  };

  const handleViewCalendar = (property: PropertyDTO) => {
    setCalendarProperty(property);
    setShowCalendarModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Map Search</h1>
          <p className="text-gray-600">Find properties by location</p>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-4">
          <Button
            onClick={handleUseMyLocation}
            icon={<Navigation size={18} />}
            variant="outline"
          >
            Use My Location
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 font-medium">Search Radius:</span>
            <Select
              value={radiusKm.toString()}
              onChange={(e) => setRadiusKm(parseInt(e.target.value))}
            >
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="20">20 km</option>
              <option value="50">50 km</option>
              <option value="100">100 km</option>
            </Select>
          </div>

          <Badge className="bg-blue-100 text-blue-800">
            {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} found
          </Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <GoogleMapComponent
              latitude={centerLat}
              longitude={centerLng}
              height="700px"
              markers={markers}
              onMarkerClick={handleMarkerClick}
              enableLocationSearch={true}
              onLocationSearch={(lat, lng, address) => {
                setSearchLocation({ lat, lng, address });
              }}
            />
          </div>

          <div className="lg:col-span-1 space-y-4 max-h-[700px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600" />
                <p className="mt-4 text-gray-600">Loading properties...</p>
              </div>
            ) : filteredProperties.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <MapPin size={48} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600">No properties found in this area</p>
                  <p className="text-sm text-gray-500 mt-2">Try increasing the search radius</p>
                </div>
              </Card>
            ) : selectedProperty ? (
              <Card className="sticky top-4">
                <div className="h-40 bg-gradient-to-br from-blue-400 to-teal-400 relative overflow-hidden">
                  {selectedProperty.images.length > 0 ? (
                    <img
                      src={selectedProperty.images[0]}
                      alt={selectedProperty.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Building2 size={48} className="text-white opacity-50" />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {selectedProperty.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {selectedProperty.description || 'No description available'}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <MapPin size={16} />
                    <span>{selectedProperty.estate?.city || selectedProperty.address}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      icon={<Calendar size={16} />}
                      onClick={() => handleViewCalendar(selectedProperty)}
                    >
                      Check Calendar
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/properties/${selectedProperty.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="text-center py-12">
                  <MapPin size={48} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600">Click a marker to view property details</p>
                </div>
              </Card>
            )}

            {!selectedProperty && filteredProperties.length > 0 && (
              <div className="space-y-3">
                {filteredProperties.slice(0, 10).map((property) => (
                  <Card
                    key={property.id}
                    className="hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => setSelectedProperty(property)}
                  >
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-1">{property.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={14} />
                        <span>{property.estate?.city}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {calendarProperty && (
        <AvailabilityCalendarModal
          isOpen={showCalendarModal}
          onClose={() => setShowCalendarModal(false)}
          property={calendarProperty}
          onDateSelect={(date) => {
            navigate(`/properties/${calendarProperty.id}?checkIn=${date}`);
          }}
        />
      )}
    </div>
  );
};
