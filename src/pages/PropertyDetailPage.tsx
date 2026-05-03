import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Wifi, Calendar, ArrowLeft, Info, Layers,
  DollarSign, Map, BarChart3, Building2, Star,
  CheckCircle, Bed, Users, ChevronDown,
  CreditCard as EditIcon,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PhotoGallery, PhotoLightbox } from '../components/ui/PhotoGallery';
import { BookingFormSection } from '../components/property/BookingFormSection';
import { BasicInfoDisplay } from '../components/property/BasicInfoDisplay';
import { LocationDisplay } from '../components/property/LocationDisplay';
import { BlocksFloorsDisplay } from '../components/property/BlocksFloorsDisplay';
import { RoomsDisplay } from '../components/property/RoomsDisplay';
import { PricingDisplay } from '../components/property/PricingDisplay';
import { PropertyAvailabilityCalendar } from '../components/availability/PropertyAvailabilityCalendar';
import { RoomAvailabilityInsights } from '../components/availability/RoomAvailabilityInsights';
import { GoogleMapComponent } from '../components/maps/GoogleMapComponent';
import { NearbyPlacesPanel } from '../components/maps/NearbyPlacesPanel';
import { usePropertyStore } from '../stores/propertyStore';
import { useAuthStore } from '../stores/authStore';
import { usePropertyHierarchy } from '../hooks/usePropertyHierarchy';
import { canManageProperties } from '../utils/permissions';
import { getModuleBadgeText, getModuleBadgeStyles } from '../utils/moduleHelpers';

// ── Tab definitions ────────────────────────────────────────────────

type TabId = 'overview' | 'rooms' | 'availability' | 'location' | 'reviews' | 'book';

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  { id: 'overview',     label: 'Overview',      icon: <Info size={15} /> },
  { id: 'rooms',        label: 'Rooms & Pricing', icon: <Bed size={15} /> },
  { id: 'availability', label: 'Availability',  icon: <Calendar size={15} /> },
  { id: 'location',     label: 'Location',       icon: <Map size={15} /> },
  { id: 'reviews',      label: 'Reviews',        icon: <Star size={15} /> },
  { id: 'book',         label: 'Book Now',       icon: <Calendar size={15} /> },
];

// ── Reviews placeholder ────────────────────────────────────────────

const ReviewsTab: React.FC<{ propertyName: string }> = ({ propertyName }) => (
  <div className="space-y-8">
    {/* Overall rating hero */}
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
      <div className="text-center">
        <div className="text-6xl font-black text-amber-600 leading-none">4.2</div>
        <div className="flex items-center justify-center gap-0.5 mt-2">
          {[1,2,3,4,5].map(s => (
            <Star key={s} size={16} className={s <= 4 ? 'text-amber-500 fill-amber-500' : 'text-gray-300 fill-gray-300'} />
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-1">Based on 0 reviews</div>
      </div>
      <div className="flex-1 space-y-2 w-full">
        {[
          { label: 'Cleanliness', score: 4.4 },
          { label: 'Location',    score: 4.6 },
          { label: 'Value',       score: 4.0 },
          { label: 'Service',     score: 4.2 },
        ].map(({ label, score }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="text-xs text-gray-600 w-20 flex-shrink-0">{label}</span>
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full"
                style={{ width: `${(score / 5) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-700 w-6 text-right">{score}</span>
          </div>
        ))}
      </div>
    </div>

    {/* No reviews state */}
    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
      <Star size={48} className="mx-auto mb-4 text-gray-300" />
      <h3 className="text-lg font-semibold text-gray-700 mb-1">No reviews yet</h3>
      <p className="text-sm text-gray-400 mb-4">Be the first to share your experience at {propertyName}</p>
      <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">
        <Star size={14} /> Write a Review
      </button>
    </div>
  </div>
);

// ── Room cards ─────────────────────────────────────────────────────

interface RoomCardProps {
  room: { id: string; roomNumber: string; capacity: number; basePrice: number; amenities: string[]; roomType?: { name: string }; status: string };
  onBook: () => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onBook }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow">
    <div className="sm:w-36 h-24 sm:h-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
      <Bed size={32} className="text-gray-400" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h4 className="font-bold text-gray-900 text-sm">{room.roomType?.name || 'Standard Room'} — #{room.roomNumber}</h4>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
            <Users size={11} />
            <span>Sleeps {room.capacity}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xl font-black text-gray-900 leading-none">
            ₹{room.basePrice.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-gray-400">per night</div>
        </div>
      </div>
      {room.amenities.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {room.amenities.slice(0, 4).map(a => (
            <span key={a} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{a}</span>
          ))}
          {room.amenities.length > 4 && (
            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{room.amenities.length - 4}</span>
          )}
        </div>
      )}
      <button
        onClick={onBook}
        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
      >
        <Calendar size={11} /> Book This Room
      </button>
    </div>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────

export const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProperty, fetchPropertyById, roomTypes, amenities } = usePropertyStore();
  const { user } = useAuthStore();

  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '');
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const tabBarRef = useRef<HTMLDivElement>(null);

  const { blocks, floors, rooms, loading: hierarchyLoading } = usePropertyHierarchy(id);

  useEffect(() => {
    if (id) fetchPropertyById(id);
  }, [id]);

  // Handle URL tab param
  useEffect(() => {
    if (!currentProperty) return;
    const tab = searchParams.get('tab');
    if (tab === 'booking') setActiveTab('book');
    else if (tab && TABS.find(t => t.id === tab)) setActiveTab(tab as TabId);
  }, [currentProperty]);

  const scrollTabIntoView = useCallback((tabId: TabId) => {
    if (!tabBarRef.current) return;
    const el = tabBarRef.current.querySelector(`[data-tab="${tabId}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, []);

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    scrollTabIntoView(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const canManage = user && canManageProperties(user.role);
  const isOtherFacilities = currentProperty?.module?.code === 'OTHER_FAC';
  const isGovtFacilities = currentProperty?.module?.code === 'GOVT_FAC';
  const requiresLogin = isGovtFacilities;

  // ── Loading ────────────────────────────────────────────────────

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

  const moduleBadgeText = getModuleBadgeText(currentProperty.module?.code);
  const moduleBadgeStyles = getModuleBadgeStyles(currentProperty.module?.code);

  // Lightbox info panel
  const lightboxInfo = (
    <div className="p-6 text-white space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge variant={currentProperty.status === 'PUBLISHED' ? 'success' : 'warning'} className="text-xs">
          {currentProperty.status}
        </Badge>
        {currentProperty.module && (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-white">
            {currentProperty.module.name}
          </span>
        )}
      </div>
      <h2 className="text-xl font-bold leading-tight">{currentProperty.name}</h2>
      {currentProperty.address && (
        <div className="flex items-start gap-2 text-white/70 text-sm">
          <MapPin size={14} className="mt-0.5 flex-shrink-0" />
          <span>{currentProperty.address}</span>
        </div>
      )}
      {currentProperty.minPrice && (
        <div className="bg-white/10 rounded-xl p-3 border border-white/15">
          <div className="text-xs text-white/60 mb-0.5">Starting from</div>
          <div className="text-2xl font-black">₹{currentProperty.minPrice.toLocaleString('en-IN')}</div>
          <div className="text-xs text-white/60">per night</div>
        </div>
      )}
      <button
        onClick={() => handleTabChange('book')}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-colors"
      >
        Book Now
      </button>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* ── Sticky tab bar ─────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back / Edit row */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <div className="flex items-center gap-2">
              {currentProperty.minPrice && (
                <span className="text-sm text-gray-500 hidden sm:block">
                  From <span className="font-bold text-gray-900">₹{currentProperty.minPrice.toLocaleString('en-IN')}</span>/night
                </span>
              )}
              {canManage && (
                <Button
                  onClick={() => navigate(`/properties/${id}/edit`)}
                  icon={<EditIcon size={14} />}
                  className="!py-1 !px-3 !text-xs"
                >
                  Edit
                </Button>
              )}
            </div>
          </div>

          {/* Tab strip — underline style like Goibibo */}
          <div
            ref={tabBarRef}
            className="flex items-center overflow-x-auto scrollbar-none"
          >
            {TABS.map(({ id: tId, label, icon }) => {
              const isActive = activeTab === tId;
              const isBook = tId === 'book';
              return (
                <button
                  key={tId}
                  data-tab={tId}
                  onClick={() => handleTabChange(tId)}
                  className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 border-b-2 -mb-px ${
                    isActive
                      ? isBook
                        ? 'text-blue-700 border-blue-600'
                        : 'text-gray-900 border-gray-900'
                      : isBook
                      ? 'text-blue-600 border-transparent hover:border-blue-300 hover:text-blue-700'
                      : 'text-gray-500 border-transparent hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <span className={isActive ? '' : 'opacity-70'}>{icon}</span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">

        {/* Photo gallery — always visible at top */}
        <div className="mb-6">
          <PhotoGallery
            images={currentProperty.images}
            alt={currentProperty.name}
            heroHeight="420px"
            lightboxInfo={lightboxInfo}
          />
        </div>

        {/* Property title strip below gallery */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <Badge variant={currentProperty.status === 'PUBLISHED' ? 'success' : 'warning'} className="text-xs">
                {currentProperty.status}
              </Badge>
              {currentProperty.module && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                  {currentProperty.module.name}
                </span>
              )}
              {moduleBadgeText && (
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${moduleBadgeStyles}`}>
                  {moduleBadgeText}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              {currentProperty.name}
            </h1>
            <div className="flex items-center gap-1.5 mt-1.5 text-gray-500 text-sm">
              <MapPin size={14} className="flex-shrink-0" />
              <span>{currentProperty.estate?.city || currentProperty.address}</span>
            </div>
          </div>
          {currentProperty.minPrice && (
            <div className="flex-shrink-0 text-right">
              <div className="text-xs text-gray-400 uppercase tracking-wide">Starting from</div>
              <div className="text-3xl font-black text-gray-900 leading-none">
                ₹{currentProperty.minPrice.toLocaleString('en-IN')}
              </div>
              <div className="text-sm text-gray-400">per night</div>
              <button
                onClick={() => handleTabChange('book')}
                className="mt-2 inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
              >
                Book Now <ChevronDown size={14} />
              </button>
            </div>
          )}
        </div>

        {/* ── Tab Panels ────────────────────────────────────── */}

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* About */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Info size={18} className="text-blue-500" />
                About this property
              </h2>
              <BasicInfoDisplay property={currentProperty} />
            </section>

            {/* Amenities highlight grid */}
            {amenities.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-500" />
                  Amenities & Facilities
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {amenities.map((amenity) => (
                    <div
                      key={amenity.id}
                      className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-blue-200 hover:shadow-md transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Wifi size={15} className="text-blue-500" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 leading-tight">{amenity.name}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Property amenities (from property.amenities string array) */}
            {currentProperty.amenities?.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4">What's included</h2>
                <div className="flex flex-wrap gap-2">
                  {currentProperty.amenities.map((a) => (
                    <span key={a} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-sm font-medium">
                      <CheckCircle size={13} />
                      {a}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Structure */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Layers size={18} className="text-slate-500" />
                Property Structure
              </h2>
              {hierarchyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
                </div>
              ) : (
                <div className="space-y-4">
                  <BlocksFloorsDisplay blocks={blocks} />
                </div>
              )}
            </section>

            {/* Location summary */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin size={18} className="text-rose-500" />
                Location
              </h2>
              <LocationDisplay property={currentProperty} />
              <button
                onClick={() => handleTabChange('location')}
                className="mt-3 text-sm text-blue-600 hover:underline font-medium"
              >
                View on map →
              </button>
            </section>
          </div>
        )}

        {/* ROOMS & PRICING */}
        {activeTab === 'rooms' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Bed size={18} className="text-blue-500" />
                Rooms & Pricing
              </h2>
              {rooms.length > 0 && (
                <span className="text-sm text-gray-500">{rooms.length} room{rooms.length !== 1 ? 's' : ''} available</span>
              )}
            </div>

            {hierarchyLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                <Bed size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 font-medium">No room details available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onBook={() => handleTabChange('book')}
                  />
                ))}
              </div>
            )}

            {/* Full pricing table */}
            {!hierarchyLoading && rooms.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign size={16} className="text-emerald-500" />
                  Pricing Summary
                </h3>
                <PricingDisplay rooms={rooms} />
              </section>
            )}

            {/* Room insights */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-amber-500" />
                Room Availability Insights
              </h3>
              <RoomAvailabilityInsights propertyId={id!} />
            </section>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4">All Room Details</h3>
              <RoomsDisplay rooms={rooms} blocks={blocks} floors={floors} />
            </div>
          </div>
        )}

        {/* AVAILABILITY */}
        {activeTab === 'availability' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar size={18} className="text-blue-500" />
              Check Availability
            </h2>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <p className="text-sm text-gray-500 mb-4">
                Select check-in and check-out dates below. After choosing your dates the booking form will open automatically.
              </p>
              <PropertyAvailabilityCalendar
                propertyId={id!}
                onDateSelect={(date) => {
                  if (!checkIn) {
                    setCheckIn(date);
                  } else if (!checkOut && date > checkIn) {
                    setCheckOut(date);
                    setTimeout(() => handleTabChange('book'), 300);
                  } else {
                    setCheckIn(date);
                    setCheckOut('');
                  }
                }}
                selectedStartDate={checkIn}
                selectedEndDate={checkOut}
              />
              {checkIn && checkOut && (
                <div className="mt-4 flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-sm">
                    <span className="font-semibold text-blue-800">{checkIn}</span>
                    <span className="text-blue-500 mx-2">→</span>
                    <span className="font-semibold text-blue-800">{checkOut}</span>
                  </div>
                  <button
                    onClick={() => handleTabChange('book')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    Proceed to Book
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LOCATION */}
        {activeTab === 'location' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Map size={18} className="text-rose-500" />
              Location & Nearby Places
            </h2>
            {currentProperty.latitude && currentProperty.longitude ? (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                  <GoogleMapComponent
                    latitude={parseFloat(currentProperty.latitude as any)}
                    longitude={parseFloat(currentProperty.longitude as any)}
                    propertyName={currentProperty.name}
                    propertyAddress={currentProperty.address}
                    height="480px"
                  />
                </div>
                <div className="lg:col-span-1">
                  <NearbyPlacesPanel
                    latitude={parseFloat(currentProperty.latitude as any)}
                    longitude={parseFloat(currentProperty.longitude as any)}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                <MapPin size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 font-medium">Location coordinates not available</p>
              </div>
            )}
          </div>
        )}

        {/* REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Star size={18} className="text-amber-500" />
              Guest Reviews
            </h2>
            <ReviewsTab propertyName={currentProperty.name} />
          </div>
        )}

        {/* BOOK NOW */}
        {activeTab === 'book' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar size={18} className="text-blue-600" />
              Reserve Your Stay
            </h2>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-4">
                <h3 className="text-white font-bold text-lg">{currentProperty.name}</h3>
                <p className="text-blue-100 text-sm flex items-center gap-1 mt-0.5">
                  <MapPin size={13} />
                  {currentProperty.estate?.city || currentProperty.address}
                </p>
              </div>
              <div className="p-6">
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
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky "Book Now" bottom bar (visible on all tabs except book) ── */}
      {activeTab !== 'book' && currentProperty.status === 'PUBLISHED' && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 shadow-2xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div>
              <div className="font-bold text-gray-900 text-base">{currentProperty.name}</div>
              {currentProperty.minPrice && (
                <div className="text-sm text-gray-500">
                  From <span className="font-semibold text-gray-900">₹{currentProperty.minPrice.toLocaleString('en-IN')}</span>/night
                </div>
              )}
            </div>
            <button
              onClick={() => handleTabChange('book')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Calendar size={15} />
              Book Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
