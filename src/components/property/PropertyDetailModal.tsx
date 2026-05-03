import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, ArrowLeft, MapPin, Wifi, Calendar, Info, Layers, DollarSign, Map,
  BarChart3, Building2, Star, CheckCircle, Bed, Users, ExternalLink,
  CreditCard as EditIcon, ChevronDown,
} from 'lucide-react';
import { PhotoGallery, PhotoLightbox } from '../ui/PhotoGallery';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { BookingFormSection } from './BookingFormSection';
import { BasicInfoDisplay } from './BasicInfoDisplay';
import { LocationDisplay } from './LocationDisplay';
import { BlocksFloorsDisplay } from './BlocksFloorsDisplay';
import { RoomsDisplay } from './RoomsDisplay';
import { PricingDisplay } from './PricingDisplay';
import { PropertyAvailabilityCalendar } from '../availability/PropertyAvailabilityCalendar';
import { RoomAvailabilityInsights } from '../availability/RoomAvailabilityInsights';
import { GoogleMapComponent } from '../maps/GoogleMapComponent';
import { NearbyPlacesPanel } from '../maps/NearbyPlacesPanel';
import { PropertyDTO, RoomDTO, BlockDTO, FloorDTO } from '../../types';
import { propertyService } from '../../services/propertyService';
import { usePropertyStore } from '../../stores/propertyStore';
import { useAuthStore } from '../../stores/authStore';
import { canManageProperties } from '../../utils/permissions';
import { getModuleBadgeText, getModuleBadgeStyles, requiresLoginForBooking } from '../../utils/moduleHelpers';
import { ROUTES } from '../../constants/routes';

// ── Tab definitions ────────────────────────────────────────────────

type TabId = 'overview' | 'rooms' | 'availability' | 'location' | 'reviews' | 'book';

interface TabDef { id: TabId; label: string; icon: React.ReactNode }

const TABS: TabDef[] = [
  { id: 'overview',     label: 'Overview',        icon: <Info size={14} /> },
  { id: 'rooms',        label: 'Rooms & Pricing',  icon: <Bed size={14} /> },
  { id: 'availability', label: 'Availability',     icon: <Calendar size={14} /> },
  { id: 'location',     label: 'Location',          icon: <Map size={14} /> },
  { id: 'reviews',      label: 'Reviews',           icon: <Star size={14} /> },
  { id: 'book',         label: 'Book Now',          icon: <Calendar size={14} /> },
];

// ── Reviews placeholder ─────────────────────────────────────────────

const ReviewsTab: React.FC<{ name: string }> = ({ name }) => (
  <div className="space-y-6">
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
      <div className="text-center">
        <div className="text-5xl font-black text-amber-600 leading-none">4.2</div>
        <div className="flex items-center justify-center gap-0.5 mt-2">
          {[1,2,3,4,5].map(s => (
            <Star key={s} size={15} className={s <= 4 ? 'text-amber-500 fill-amber-500' : 'text-gray-300 fill-gray-300'} />
          ))}
        </div>
        <div className="text-xs text-gray-400 mt-1">0 reviews</div>
      </div>
      <div className="flex-1 space-y-2 w-full">
        {[
          { label: 'Cleanliness', score: 4.4 },
          { label: 'Location',    score: 4.6 },
          { label: 'Value',       score: 4.0 },
          { label: 'Service',     score: 4.2 },
        ].map(({ label, score }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(score / 5) * 100}%` }} />
            </div>
            <span className="text-xs font-semibold text-gray-700 w-6 text-right">{score}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
      <Star size={40} className="mx-auto mb-3 text-gray-300" />
      <p className="text-sm font-semibold text-gray-600 mb-1">No reviews yet</p>
      <p className="text-xs text-gray-400 mb-3">Be the first to review {name}</p>
      <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors">
        <Star size={12} /> Write a Review
      </button>
    </div>
  </div>
);

// ── Room card ────────────────────────────────────────────────────────

const RoomCard: React.FC<{
  room: RoomDTO;
  onBook: () => void;
}> = ({ room, onBook }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4 hover:shadow-md transition-shadow">
    <div className="w-28 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
      <Bed size={26} className="text-gray-400" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div>
          <h4 className="font-bold text-gray-900 text-sm">{room.roomType?.name || 'Standard Room'} #{room.roomNumber}</h4>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
            <Users size={10} /><span>Sleeps {room.capacity}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-black text-gray-900">₹{room.basePrice.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-gray-400">per night</div>
        </div>
      </div>
      {room.amenities.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {room.amenities.slice(0, 3).map(a => (
            <span key={a} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">{a}</span>
          ))}
          {room.amenities.length > 3 && (
            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">+{room.amenities.length - 3}</span>
          )}
        </div>
      )}
      <button
        onClick={onBook}
        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
      >
        <Calendar size={10} /> Book
      </button>
    </div>
  </div>
);

// ── Main modal ───────────────────────────────────────────────────────

interface PropertyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  isOpen,
  onClose,
  propertyId,
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { roomTypes } = usePropertyStore();

  const [property, setProperty] = useState<PropertyDTO | null>(null);
  const [blocks, setBlocks] = useState<BlockDTO[]>([]);
  const [floors, setFloors] = useState<FloorDTO[]>([]);
  const [rooms, setRooms] = useState<RoomDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [amenities, setAmenities] = useState<{ id: string; name: string }[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const tabBarRef = useRef<HTMLDivElement>(null);
  const scrollBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !propertyId) return;
    setLoading(true);
    setActiveTab('overview');

    Promise.all([
      propertyService.getPropertyById(propertyId),
      propertyService.getPropertyHierarchy(propertyId),
    ])
      .then(([prop, hierarchy]) => {
        setProperty(prop);
        setBlocks(hierarchy.blocks);
        setFloors(hierarchy.floors);
        setRooms(hierarchy.rooms);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, propertyId]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Keyboard close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
    scrollBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (!isOpen) return null;

  const canManage = user && property && canManageProperties(user.role);
  const isOtherFacilities = property?.module?.code === 'OTHER_FAC';
  const isGovtFacilities = property?.module?.code === 'GOVT_FAC';
  const requiresLogin = !!isGovtFacilities;
  const moduleBadgeText = property ? getModuleBadgeText(property.module?.code) : null;
  const moduleBadgeStyles = property ? getModuleBadgeStyles(property.module?.code) : '';

  const lightboxInfo = property ? (
    <div className="p-6 text-white space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge variant={property.status === 'PUBLISHED' ? 'success' : 'warning'} className="text-xs">
          {property.status}
        </Badge>
        {property.module && (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-white">
            {property.module.name}
          </span>
        )}
      </div>
      <h2 className="text-xl font-bold leading-tight">{property.name}</h2>
      {property.address && (
        <div className="flex items-start gap-2 text-white/70 text-sm">
          <MapPin size={13} className="mt-0.5 flex-shrink-0" />
          <span>{property.address}</span>
        </div>
      )}
      {property.minPrice && (
        <div className="bg-white/10 rounded-xl p-3 border border-white/15">
          <div className="text-xs text-white/60 mb-0.5">Starting from</div>
          <div className="text-2xl font-black">₹{property.minPrice.toLocaleString('en-IN')}</div>
          <div className="text-xs text-white/60">per night</div>
        </div>
      )}
      <button
        onClick={() => handleTabChange('book')}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-colors"
      >
        Book Now
      </button>
    </div>
  ) : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[800] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="fixed inset-x-0 bottom-0 top-6 z-[801] flex items-end sm:items-center justify-center px-0 sm:px-4 lg:px-8">
        <div
          className="relative bg-gray-50 w-full max-w-5xl h-full sm:h-[94vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Sticky header ──────────────────────────────────── */}
          <div className="flex-none bg-white border-b border-gray-200">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={15} /> Close
              </button>
              <div className="flex items-center gap-2">
                {property?.minPrice && (
                  <span className="text-sm text-gray-500 hidden sm:block">
                    From <span className="font-bold text-gray-900">₹{property.minPrice.toLocaleString('en-IN')}</span>/night
                  </span>
                )}
                {property && (
                  <button
                    onClick={() => { navigate(`/properties/${propertyId}`); onClose(); }}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 border border-gray-200 hover:border-blue-200 transition-all"
                  >
                    <ExternalLink size={12} /> Full Page
                  </button>
                )}
                {canManage && property && (
                  <button
                    onClick={() => { navigate(`/properties/${propertyId}/edit`); onClose(); }}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 border border-gray-200 transition-all"
                  >
                    <EditIcon size={12} /> Edit
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Tab strip */}
            {property && (
              <div ref={tabBarRef} className="flex items-center overflow-x-auto scrollbar-none px-4">
                {TABS.map(({ id: tId, label, icon }) => {
                  const isActive = activeTab === tId;
                  const isBook = tId === 'book';
                  return (
                    <button
                      key={tId}
                      onClick={() => handleTabChange(tId)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 border-b-2 -mb-px ${
                        isActive
                          ? isBook ? 'text-blue-700 border-blue-600' : 'text-gray-900 border-gray-900'
                          : isBook ? 'text-blue-600 border-transparent hover:border-blue-300' : 'text-gray-500 border-transparent hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <span className={isActive ? '' : 'opacity-70'}>{icon}</span>
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Scrollable body ──────────────────────────────── */}
          <div ref={scrollBodyRef} className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600" />
              </div>
            ) : !property ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Building2 size={40} className="text-gray-300" />
                <p className="text-gray-500">Failed to load property details</p>
                <button onClick={onClose} className="text-sm text-blue-600 hover:underline">Close</button>
              </div>
            ) : (
              <div className="p-5 pb-24 space-y-5">
                {/* Photo gallery */}
                <PhotoGallery
                  images={property.images}
                  alt={property.name}
                  heroHeight="360px"
                  lightboxInfo={lightboxInfo}
                />

                {/* Title strip */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant={property.status === 'PUBLISHED' ? 'success' : 'warning'} className="text-xs">
                        {property.status}
                      </Badge>
                      {property.module && (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                          {property.module.name}
                        </span>
                      )}
                      {moduleBadgeText && (
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${moduleBadgeStyles}`}>
                          {moduleBadgeText}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{property.name}</h2>
                    <div className="flex items-center gap-1.5 mt-1 text-gray-500 text-sm">
                      <MapPin size={13} className="flex-shrink-0" />
                      <span>{property.estate?.city || property.address}</span>
                    </div>
                  </div>
                  {property.minPrice && (
                    <div className="flex-shrink-0 text-right">
                      <div className="text-xs text-gray-400">Starting from</div>
                      <div className="text-2xl font-black text-gray-900">₹{property.minPrice.toLocaleString('en-IN')}</div>
                      <div className="text-xs text-gray-400">per night</div>
                      <button
                        onClick={() => handleTabChange('book')}
                        className="mt-1.5 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        Book Now <ChevronDown size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* ── Tab panels ────────────────────────────── */}

                {/* OVERVIEW */}
                {activeTab === 'overview' && (
                  <div className="space-y-5">
                    <section className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Info size={15} className="text-blue-500" /> About
                      </h3>
                      <BasicInfoDisplay property={property} />
                    </section>

                    {property.amenities?.length > 0 && (
                      <section>
                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <CheckCircle size={15} className="text-emerald-500" /> What's included
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {property.amenities.map((a) => (
                            <span key={a} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
                              <CheckCircle size={11} />{a}
                            </span>
                          ))}
                        </div>
                      </section>
                    )}

                    <section className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <MapPin size={15} className="text-rose-500" /> Location
                      </h3>
                      <LocationDisplay property={property} />
                      <button onClick={() => handleTabChange('location')} className="mt-2 text-xs text-blue-600 hover:underline font-medium">
                        View on map →
                      </button>
                    </section>
                  </div>
                )}

                {/* ROOMS */}
                {activeTab === 'rooms' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Bed size={15} className="text-blue-500" /> Rooms & Pricing
                      </h3>
                      {rooms.length > 0 && <span className="text-xs text-gray-400">{rooms.length} room{rooms.length !== 1 ? 's' : ''}</span>}
                    </div>

                    {rooms.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <Bed size={36} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-sm text-gray-400">No room details available</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {rooms.map((room) => (
                          <RoomCard key={room.id} room={room} onBook={() => handleTabChange('book')} />
                        ))}
                      </div>
                    )}

                    {rooms.length > 0 && (
                      <>
                        <section className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                          <h4 className="text-xs font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <DollarSign size={13} className="text-emerald-500" /> Pricing Summary
                          </h4>
                          <PricingDisplay rooms={rooms} />
                        </section>
                        <section className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                          <h4 className="text-xs font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <BarChart3 size={13} className="text-amber-500" /> Availability Insights
                          </h4>
                          <RoomAvailabilityInsights propertyId={propertyId} />
                        </section>
                      </>
                    )}
                  </div>
                )}

                {/* AVAILABILITY */}
                {activeTab === 'availability' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Calendar size={15} className="text-blue-500" /> Check Availability
                    </h3>
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                      <PropertyAvailabilityCalendar
                        propertyId={propertyId}
                        onDateSelect={(date) => {
                          if (!checkIn) { setCheckIn(date); }
                          else if (!checkOut && date > checkIn) { setCheckOut(date); setTimeout(() => handleTabChange('book'), 300); }
                          else { setCheckIn(date); setCheckOut(''); }
                        }}
                        selectedStartDate={checkIn}
                        selectedEndDate={checkOut}
                      />
                      {checkIn && checkOut && (
                        <div className="mt-4 flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                          <div className="text-sm">
                            <span className="font-semibold text-blue-800">{checkIn}</span>
                            <span className="text-blue-400 mx-2">→</span>
                            <span className="font-semibold text-blue-800">{checkOut}</span>
                          </div>
                          <button onClick={() => handleTabChange('book')} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold">
                            Book
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* LOCATION */}
                {activeTab === 'location' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Map size={15} className="text-rose-500" /> Location & Nearby
                    </h3>
                    {property.latitude && property.longitude ? (
                      <div className="grid lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                          <GoogleMapComponent
                            latitude={parseFloat(property.latitude as any)}
                            longitude={parseFloat(property.longitude as any)}
                            propertyName={property.name}
                            propertyAddress={property.address}
                            height="400px"
                          />
                        </div>
                        <div>
                          <NearbyPlacesPanel
                            latitude={parseFloat(property.latitude as any)}
                            longitude={parseFloat(property.longitude as any)}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <MapPin size={36} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-sm text-gray-400">Location not available</p>
                      </div>
                    )}
                  </div>
                )}

                {/* REVIEWS */}
                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Star size={15} className="text-amber-500" /> Guest Reviews
                    </h3>
                    <ReviewsTab name={property.name} />
                  </div>
                )}

                {/* BOOK NOW */}
                {activeTab === 'book' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Calendar size={15} className="text-blue-600" /> Reserve Your Stay
                    </h3>
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-4">
                        <h4 className="text-white font-bold">{property.name}</h4>
                        <p className="text-blue-100 text-xs flex items-center gap-1 mt-0.5">
                          <MapPin size={11} />{property.estate?.city || property.address}
                        </p>
                      </div>
                      <div className="p-5">
                        <BookingFormSection
                          propertyId={propertyId}
                          roomTypes={roomTypes}
                          isOtherFacilities={!!isOtherFacilities}
                          isGovtFacilities={!!isGovtFacilities}
                          requiresLogin={requiresLogin}
                          isLoggedIn={!!user}
                          initialCheckIn={checkIn}
                          initialCheckOut={checkOut}
                          showDatesPrefilled={!!(checkIn && checkOut)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Sticky Book Now bar (all tabs except book) ── */}
          {property && activeTab !== 'book' && property.status === 'PUBLISHED' && (
            <div className="flex-none bg-white border-t border-gray-200 px-5 py-3 flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900 text-sm">{property.name}</div>
                {property.minPrice && (
                  <div className="text-xs text-gray-500">
                    From <span className="font-semibold text-gray-900">₹{property.minPrice.toLocaleString('en-IN')}</span>/night
                  </div>
                )}
              </div>
              <button
                onClick={() => handleTabChange('book')}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-sm transition-all"
              >
                <Calendar size={13} /> Book Now
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
