import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Wifi, Calendar, ArrowLeft, Building2, CreditCard as Edit, Info, Layers, Image, DollarSign, Map, BarChart3 } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { VerticalTabs } from '../components/ui/VerticalTabs';
import { PropertyHeroSection } from '../components/property/PropertyHeroSection';
import { BookingFormSection } from '../components/property/BookingFormSection';
import { BasicInfoDisplay } from '../components/property/BasicInfoDisplay';
import { LocationDisplay } from '../components/property/LocationDisplay';
import { BlocksFloorsDisplay } from '../components/property/BlocksFloorsDisplay';
import { RoomsDisplay } from '../components/property/RoomsDisplay';
import { ImagesDisplay } from '../components/property/ImagesDisplay';
import { PricingDisplay } from '../components/property/PricingDisplay';
import { PropertyAvailabilityCalendar } from '../components/availability/PropertyAvailabilityCalendar';
import { RoomAvailabilityInsights } from '../components/availability/RoomAvailabilityInsights';
import { GoogleMapComponent } from '../components/maps/GoogleMapComponent';
import { NearbyPlacesPanel } from '../components/maps/NearbyPlacesPanel';
import { usePropertyStore } from '../stores/propertyStore';
import { useAuthStore } from '../stores/authStore';
import { usePropertyHierarchy } from '../hooks/usePropertyHierarchy';
import { canManageProperties } from '../utils/permissions';

export const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProperty, fetchPropertyById, roomTypes, amenities } = usePropertyStore();
  const { user } = useAuthStore();

  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const initialTab = searchParams.get('tab') || (searchParams.get('checkIn') ? 'booking' : 'overview');
  const [activeTab, setActiveTab] = useState(initialTab);
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '');

  const { blocks, floors, rooms, loading: hierarchyLoading } = usePropertyHierarchy(id);

  React.useEffect(() => {
    if (id) fetchPropertyById(id);
  }, [id]);

  const canManage = user && canManageProperties(user.role);
  const isOtherFacilities = currentProperty?.module?.code === 'OTHER_FAC';
  const isGovtFacilities = currentProperty?.module?.code === 'GOVT_FAC';
  const requiresLogin = isGovtFacilities;

  if (!currentProperty) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600" />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Info size={20} /> },
    { id: 'structure', label: 'Structure', icon: <Layers size={20} /> },
    { id: 'images', label: 'Images', icon: <Image size={20} /> },
    { id: 'pricing', label: 'Pricing', icon: <DollarSign size={20} /> },
    { id: 'availability', label: 'Availability', icon: <Calendar size={20} /> },
    { id: 'room-insights', label: 'Room Insights', icon: <BarChart3 size={20} /> },
    { id: 'location', label: 'Location & Map', icon: <Map size={20} /> },
    { id: 'booking', label: 'Book Now', icon: <Calendar size={20} /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Property Overview</h2>
              <BasicInfoDisplay property={currentProperty} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Location</h3>
              <LocationDisplay property={currentProperty} />
            </div>
            {amenities.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {amenities.map((amenity) => (
                    <div key={amenity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Wifi size={18} className="text-blue-600" />
                      <span className="text-gray-700">{amenity.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'structure':
        return hierarchyLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Property Structure</h2>
              <BlocksFloorsDisplay blocks={blocks} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Rooms</h3>
              <RoomsDisplay rooms={rooms} blocks={blocks} floors={floors} />
            </div>
          </div>
        );

      case 'images':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Property Images</h2>
            <ImagesDisplay images={currentProperty.images} propertyName={currentProperty.name} />
          </div>
        );

      case 'pricing':
        return hierarchyLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pricing Details</h2>
            <PricingDisplay rooms={rooms} />
          </div>
        );

      case 'availability':
        return (
          <div>
            <PropertyAvailabilityCalendar
              propertyId={id!}
              onDateSelect={(date) => {
                if (!checkIn) {
                  setCheckIn(date);
                } else if (!checkOut && date > checkIn) {
                  setCheckOut(date);
                  setActiveTab('booking');
                } else {
                  setCheckIn(date);
                  setCheckOut('');
                }
              }}
              selectedStartDate={checkIn}
              selectedEndDate={checkOut}
            />
          </div>
        );

      case 'room-insights':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Room Availability Insights</h2>
            <RoomAvailabilityInsights propertyId={id!} />
          </div>
        );

      case 'location':
        return currentProperty.latitude && currentProperty.longitude ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Location & Nearby Places</h2>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <GoogleMapComponent
                  latitude={parseFloat(currentProperty.latitude as any)}
                  longitude={parseFloat(currentProperty.longitude as any)}
                  propertyName={currentProperty.name}
                  propertyAddress={currentProperty.address}
                  height="600px"
                />
              </div>
              <div className="lg:col-span-1">
                <NearbyPlacesPanel
                  latitude={parseFloat(currentProperty.latitude as any)}
                  longitude={parseFloat(currentProperty.longitude as any)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <MapPin size={48} className="mx-auto mb-3 opacity-30" />
            <p>Location coordinates not available for this property</p>
          </div>
        );

      case 'booking':
        return (
          <BookingFormSection
            propertyId={id!}
            roomTypes={roomTypes}
            isOtherFacilities={!!isOtherFacilities}
            isGovtFacilities={!!isGovtFacilities}
            requiresLogin={!!requiresLogin}
            isLoggedIn={!!user}
            initialCheckIn={checkIn}
            initialCheckOut={checkOut}
            showDatesPrefilled={!!(searchParams.get('checkIn') && searchParams.get('checkOut'))}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} icon={<ArrowLeft size={20} />}>
            Back
          </Button>
          {canManage && (
            <Button onClick={() => navigate(`/properties/${id}/edit`)} icon={<Edit size={20} />}>
              Edit Property
            </Button>
          )}
        </div>

        <div className="mb-8">
          <PropertyHeroSection
            name={currentProperty.name}
            address={currentProperty.address}
            city={currentProperty.estate?.city}
            status={currentProperty.status}
            images={currentProperty.images}
          />
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <VerticalTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
            </div>
          </div>

          <div className="lg:col-span-3">
            <Card className="animate-fadeIn">
              <CardBody className="p-6">
                {renderTabContent()}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
