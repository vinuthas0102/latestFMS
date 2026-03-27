import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Users, Wifi, Calendar, ArrowLeft, Building2, CreditCard as Edit, Info, Layers, Image, DollarSign, Map } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { VerticalTabs } from '../components/ui/VerticalTabs';
import { usePropertyStore } from '../stores/propertyStore';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { bookingService } from '../services/bookingService';
import { propertyService } from '../services/propertyService';
import { bookingEligibilityService } from '../services/bookingEligibilityService';
import { formatCurrency } from '../utils/formatters';
import { canManageProperties } from '../utils/permissions';
import { GuestDetails, BlockDTO, FloorDTO, RoomDTO } from '../types';
import { ROUTES } from '../constants/routes';
import { BasicInfoDisplay } from '../components/property/BasicInfoDisplay';
import { LocationDisplay } from '../components/property/LocationDisplay';
import { BlocksFloorsDisplay } from '../components/property/BlocksFloorsDisplay';
import { RoomsDisplay } from '../components/property/RoomsDisplay';
import { ImagesDisplay } from '../components/property/ImagesDisplay';
import { PricingDisplay } from '../components/property/PricingDisplay';
import { PropertyAvailabilityCalendar } from '../components/availability/PropertyAvailabilityCalendar';
import { GoogleMapComponent } from '../components/maps/GoogleMapComponent';
import { NearbyPlacesPanel } from '../components/maps/NearbyPlacesPanel';

export const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProperty, fetchPropertyById, roomTypes, amenities } = usePropertyStore();
  const { user } = useAuthStore();
  const addToast = useUIStore((state) => state.addToast);

  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [blocks, setBlocks] = useState<BlockDTO[]>([]);
  const [floors, setFloors] = useState<FloorDTO[]>([]);
  const [rooms, setRooms] = useState<RoomDTO[]>([]);
  const [hierarchyLoading, setHierarchyLoading] = useState(true);

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [roomTypeId, setRoomTypeId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [requirements, setRequirements] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPropertyById(id);
      loadPropertyHierarchy();
    }
  }, [id]);

  const loadPropertyHierarchy = async () => {
    if (!id) return;

    setHierarchyLoading(true);
    try {
      const data = await propertyService.getPropertyHierarchy(id);
      setBlocks(data.blocks);
      setFloors(data.floors);
      setRooms(data.rooms);
    } catch (error) {
      console.error('Failed to load property hierarchy:', error);
    } finally {
      setHierarchyLoading(false);
    }
  };

  const canManage = user && canManageProperties(user.role);

  const handleBooking = async () => {
    if (!user) {
      addToast('Please login to make a booking', 'error');
      navigate(ROUTES.LOGIN);
      return;
    }

    if (!checkIn || !checkOut || !roomTypeId || !guestName || !guestEmail || !guestPhone) {
      addToast('Please fill all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const eligibility = await bookingEligibilityService.checkAvailability(
        user.id,
        id!,
        roomTypeId,
        checkIn,
        checkOut,
        quantity
      );

      if (!eligibility.canBook) {
        addToast(eligibility.reason || 'Cannot book for selected dates', 'error');
        setLoading(false);
        return;
      }

      const guestDetails: GuestDetails = {
        fullName: guestName,
        email: guestEmail,
        phone: guestPhone,
        numberOfGuests: quantity,
      };

      const booking = await bookingService.createBooking(user.id, {
        propertyId: id!,
        roomTypeId,
        quantity,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guestDetails,
        specialRequirements: requirements,
      });

      const paymentParams = new URLSearchParams({
        bookingId: booking.id,
        amount: booking.totalAmount.toString(),
        returnUrl: ROUTES.BOOKING_CONFIRMATION,
      });

      navigate(`${ROUTES.PAYMENT}?${paymentParams.toString()}`);
    } catch (error: any) {
      addToast(error.message || 'Booking failed', 'error');
    } finally {
      setLoading(false);
    }
  };

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
    { id: 'location', label: 'Location & Map', icon: <Map size={20} /> },
    { id: 'booking', label: 'Book Now', icon: <Calendar size={20} /> },
  ];

  const renderTabContent = () => {
    if (!currentProperty) return null;

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
                    <div
                      key={amenity.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
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
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
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
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
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
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Book This Property</h2>
            <Card>
              <CardBody>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="date"
                      label="Check-in Date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      icon={<Calendar size={20} />}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <Input
                      type="date"
                      label="Check-out Date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      icon={<Calendar size={20} />}
                      min={checkIn}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Room Type"
                      options={[
                        { value: '', label: 'Select room type' },
                        ...roomTypes.map((rt) => ({ value: rt.id, label: rt.name })),
                      ]}
                      value={roomTypeId}
                      onChange={(e) => setRoomTypeId(e.target.value)}
                    />
                    <Input
                      type="number"
                      label="Number of Rooms"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                      icon={<Users size={20} />}
                      min={1}
                    />
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Guest Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Full Name"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Enter guest name"
                      />
                      <Input
                        type="email"
                        label="Email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="guest@example.com"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <Input
                        type="tel"
                        label="Phone Number"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="+91 XXXXX XXXXX"
                      />
                      <Input
                        label="Special Requirements (Optional)"
                        value={requirements}
                        onChange={(e) => setRequirements(e.target.value)}
                        placeholder="Any special needs or requests"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleBooking}
                      size="lg"
                      loading={loading}
                      className="min-w-64"
                    >
                      Proceed to Payment
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
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
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            icon={<ArrowLeft size={20} />}
          >
            Back
          </Button>
          {canManage && (
            <Button
              onClick={() => navigate(`/properties/${id}/edit`)}
              icon={<Edit size={20} />}
            >
              Edit Property
            </Button>
          )}
        </div>

        {!currentProperty ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600" />
          </div>
        ) : (
          <div className="mb-8">
            <Card className="overflow-hidden">
              <div className="h-80 bg-gradient-to-br from-blue-400 to-teal-400 relative">
                {currentProperty.images.length > 0 ? (
                  <img
                    src={currentProperty.images[0]}
                    alt={currentProperty.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Building2 size={96} className="text-white opacity-50" />
                  </div>
                )}
              </div>
              <div className="p-6 bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {currentProperty.name}
                    </h1>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={18} />
                      <span>{currentProperty.estate?.city || currentProperty.address}</span>
                    </div>
                  </div>
                  <Badge variant={currentProperty.status === 'PUBLISHED' ? 'success' : 'warning'}>
                    {currentProperty.status}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        )}

        {currentProperty && (
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <VerticalTabs
                  tabs={tabs}
                  activeTab={activeTab}
                  onChange={setActiveTab}
                />
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
        )}
      </div>
    </div>
  );
};
