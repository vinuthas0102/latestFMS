import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMapComponent } from '../maps/GoogleMapComponent';
import { PropertyDTO } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Building2, MapPin } from 'lucide-react';
import { formatPriceRange } from '../../utils/formatters';

interface MapSearchViewProps {
  properties: PropertyDTO[];
  checkIn?: string;
  checkOut?: string;
}

export const MapSearchView: React.FC<MapSearchViewProps> = ({ properties, checkIn, checkOut }) => {
  const navigate = useNavigate();
  const [selectedProperty, setSelectedProperty] = useState<PropertyDTO | null>(null);

  const buildPropertyUrl = (propertyId: string) => {
    const params = new URLSearchParams();
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    const queryString = params.toString();
    return `/properties/${propertyId}${queryString ? `?${queryString}` : ''}`;
  };

  const propertiesWithCoords = properties.filter(
    (p) => p.latitude && p.longitude
  );

  const centerLat =
    propertiesWithCoords.length > 0
      ? propertiesWithCoords.reduce((sum, p) => sum + parseFloat(p.latitude as any), 0) /
        propertiesWithCoords.length
      : 28.6139;

  const centerLng =
    propertiesWithCoords.length > 0
      ? propertiesWithCoords.reduce((sum, p) => sum + parseFloat(p.longitude as any), 0) /
        propertiesWithCoords.length
      : 77.209;

  const markers = propertiesWithCoords.map((p) => ({
    lat: parseFloat(p.latitude as any),
    lng: parseFloat(p.longitude as any),
    title: p.name,
    propertyId: p.id,
    color: '#2563eb',
  }));

  const handleMarkerClick = (marker: any) => {
    const property = properties.find((p) => p.id === marker.propertyId);
    if (property) {
      setSelectedProperty(property);
    }
  };

  if (propertiesWithCoords.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <MapPin size={64} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Properties with Locations</h3>
        <p className="text-gray-600">
          None of the search results have location coordinates available
        </p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <GoogleMapComponent
          latitude={centerLat}
          longitude={centerLng}
          height="700px"
          markers={markers}
          onMarkerClick={handleMarkerClick}
        />
      </div>

      <div className="lg:col-span-1">
        {selectedProperty ? (
          <Card className="sticky top-24">
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
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <span className="text-sm text-gray-600">
                  {selectedProperty.minPrice !== selectedProperty.maxPrice ? 'Price range' : 'Price'}
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {formatPriceRange(selectedProperty.minPrice, selectedProperty.maxPrice)}
                </span>
              </div>
              <Button
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(buildPropertyUrl(selectedProperty.id));
                }}
              >
                View Details
              </Button>
            </div>
          </Card>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center sticky top-24">
            <MapPin size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">Click a marker to view property details</p>
          </div>
        )}
      </div>
    </div>
  );
};
