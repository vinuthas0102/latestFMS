import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Wifi,
  Calendar,
  ArrowLeft,
  CreditCard as Edit,
  Info,
  Layers,
  Image,
  DollarSign,
  Map,
  BarChart3,
  Building2,
  ChevronDown,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ImageCarousel } from '../components/ui/ImageCarousel';
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
import { getModuleBadgeText, getModuleBadgeStyles } from '../utils/moduleHelpers';

interface SectionDef {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const SECTIONS: SectionDef[] = [
  { id: 'overview',      label: 'Overview',       icon: <Info size={15} /> },
  { id: 'structure',     label: 'Structure',      icon: <Layers size={15} /> },
  { id: 'images',        label: 'Images',         icon: <Image size={15} /> },
  { id: 'pricing',       label: 'Pricing',        icon: <DollarSign size={15} /> },
  { id: 'availability',  label: 'Availability',   icon: <Calendar size={15} /> },
  { id: 'room-insights', label: 'Room Insights',  icon: <BarChart3 size={15} /> },
  { id: 'location',      label: 'Location',       icon: <Map size={15} /> },
  { id: 'booking',       label: 'Book Now',       icon: <Calendar size={15} /> },
];

function scrollToSection(sectionId: string) {
  const el = document.getElementById(`section-${sectionId}`);
  if (el) {
    const offset = 115;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}

// ── Sub-components ────────────────────────────────────────────────

interface SectionHeadingProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  accent?: boolean;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({ icon, title, subtitle, accent }) => (
  <div className="flex items-start gap-3 mb-5">
    <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${accent ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}>
      {icon}
    </div>
    <div>
      <h2 className={`text-xl font-bold ${accent ? 'text-blue-700' : 'text-gray-900'}`}>{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const SectionDivider: React.FC = () => (
  <div className="flex items-center gap-3 mb-10">
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
  </div>
);

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center py-16">
    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
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
  const [activeSection, setActiveSection] = useState('overview');
  const [navExpanded, setNavExpanded] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const { blocks, floors, rooms, loading: hierarchyLoading } = usePropertyHierarchy(id);

  useEffect(() => {
    if (id) fetchPropertyById(id);
  }, [id]);

  // Scroll to section from URL params once property loads
  useEffect(() => {
    if (!currentProperty) return;
    const tab = searchParams.get('tab');
    if (tab) {
      setTimeout(() => scrollToSection(tab), 400);
    } else if (searchParams.get('checkIn')) {
      setTimeout(() => scrollToSection('booking'), 400);
    }
  }, [currentProperty]);

  // IntersectionObserver — track active section as user scrolls
  const setupObserver = useCallback(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        let topmost: { id: string; top: number } | null = null;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id.replace('section-', '');
            const top = entry.boundingClientRect.top;
            if (!topmost || top < topmost.top) {
              topmost = { id: sectionId, top };
            }
          }
        });
        if (topmost) setActiveSection((topmost as { id: string }).id);
      },
      {
        threshold: 0.1,
        rootMargin: '-100px 0px -50% 0px',
      }
    );

    SECTIONS.forEach(({ id: sId }) => {
      const el = document.getElementById(`section-${sId}`);
      if (el) observerRef.current!.observe(el);
    });
  }, []);

  useEffect(() => {
    if (!currentProperty) return;
    const timer = setTimeout(setupObserver, 250);
    return () => {
      clearTimeout(timer);
      observerRef.current?.disconnect();
    };
  }, [currentProperty, setupObserver]);

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

  const moduleBadgeText = getModuleBadgeText(currentProperty.module?.code);
  const moduleBadgeStyles = getModuleBadgeStyles(currentProperty.module?.code);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* ── Sticky top navigation ─────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/92 backdrop-blur-md border-b border-gray-200/80 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back / Edit */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              icon={<ArrowLeft size={16} />}
              className="!py-1 !px-2.5 !text-sm"
            >
              Back
            </Button>
            {canManage && (
              <Button
                onClick={() => navigate(`/properties/${id}/edit`)}
                icon={<Edit size={15} />}
                className="!py-1 !px-2.5 !text-sm"
              >
                Edit
              </Button>
            )}
          </div>

          {/* Section pill strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none">
            {SECTIONS.map(({ id: sId, label, icon }) => {
              const isActive = activeSection === sId;
              const isBooking = sId === 'booking';
              return (
                <button
                  key={sId}
                  onClick={() => scrollToSection(sId)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 border ${
                    isActive
                      ? isBooking
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-gray-800 text-white border-gray-800 shadow-md'
                      : isBooking
                      ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {icon}
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Floating right section navigator ─────────────────── */}
      <div
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 hidden lg:block"
        onMouseEnter={() => setNavExpanded(true)}
        onMouseLeave={() => setNavExpanded(false)}
      >
        <div
          className={`flex flex-col gap-0.5 bg-white/96 backdrop-blur-sm shadow-xl border border-gray-200/80 rounded-l-2xl py-2.5 px-1.5 transition-all duration-300 ease-in-out ${
            navExpanded ? 'w-44' : 'w-11'
          }`}
        >
          {SECTIONS.map(({ id: sId, label, icon }) => {
            const isActive = activeSection === sId;
            const isBooking = sId === 'booking';
            return (
              <button
                key={sId}
                onClick={() => scrollToSection(sId)}
                title={!navExpanded ? label : undefined}
                className={`flex items-center gap-2.5 rounded-xl transition-all duration-200 overflow-hidden flex-shrink-0 ${
                  navExpanded ? 'px-2.5 py-2' : 'p-2 justify-center'
                } ${
                  isActive
                    ? isBooking
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-800 text-white shadow-sm'
                    : isBooking
                    ? 'text-blue-600 hover:bg-blue-50'
                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">{icon}</span>
                {navExpanded && (
                  <span className="text-xs font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                    {label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main scrollable content ───────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 pr-4 lg:pr-16">

        {/* Hero */}
        <div
          className="relative rounded-2xl overflow-hidden shadow-xl mb-10"
          style={{ height: 380 }}
        >
          {currentProperty.images.length > 0 ? (
            <ImageCarousel
              images={currentProperty.images}
              alt={currentProperty.name}
              className="h-full"
              showFullscreen
              autoPlay={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-teal-500">
              <Building2 size={96} className="text-white/40" />
            </div>
          )}

          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

          {/* Property info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge
                variant={currentProperty.status === 'PUBLISHED' ? 'success' : 'warning'}
                className="text-xs"
              >
                {currentProperty.status}
              </Badge>
              {currentProperty.module && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm border border-white/30 text-white">
                  {currentProperty.module.name}
                </span>
              )}
              {moduleBadgeText && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${moduleBadgeStyles}`}>
                  {moduleBadgeText}
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
              {currentProperty.name}
            </h1>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <MapPin size={14} className="flex-shrink-0" />
              <span>{currentProperty.estate?.city || currentProperty.address}</span>
            </div>
          </div>

          {/* Book Now CTA */}
          <button
            onClick={() => scrollToSection('booking')}
            className="absolute top-4 right-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Calendar size={15} />
            Book Now
            <ChevronDown size={13} />
          </button>
        </div>

        {/* ── 1. Overview ───────────────────────────────────────── */}
        <section id="section-overview" className="mb-12 scroll-mt-28">
          <SectionHeading icon={<Info size={20} />} title="Overview" />
          <div className="space-y-6">
            <BasicInfoDisplay property={currentProperty} />
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-3">Location Details</h3>
              <LocationDisplay property={currentProperty} />
            </div>
            {amenities.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-3">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {amenities.map((amenity) => (
                    <div
                      key={amenity.id}
                      className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-gray-200 shadow-sm"
                    >
                      <Wifi size={15} className="text-blue-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{amenity.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <SectionDivider />

        {/* ── 2. Structure ──────────────────────────────────────── */}
        <section id="section-structure" className="mb-12 scroll-mt-28">
          <SectionHeading
            icon={<Layers size={20} />}
            title="Structure"
            subtitle="Blocks, floors and room layout"
          />
          {hierarchyLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-6">
              <BlocksFloorsDisplay blocks={blocks} />
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-3">Rooms</h3>
                <RoomsDisplay rooms={rooms} blocks={blocks} floors={floors} />
              </div>
            </div>
          )}
        </section>

        <SectionDivider />

        {/* ── 3. Images ─────────────────────────────────────────── */}
        <section id="section-images" className="mb-12 scroll-mt-28">
          <SectionHeading icon={<Image size={20} />} title="Images" />
          <ImagesDisplay images={currentProperty.images} propertyName={currentProperty.name} />
        </section>

        <SectionDivider />

        {/* ── 4. Pricing ────────────────────────────────────────── */}
        <section id="section-pricing" className="mb-12 scroll-mt-28">
          <SectionHeading icon={<DollarSign size={20} />} title="Pricing" />
          {hierarchyLoading ? <LoadingSpinner /> : <PricingDisplay rooms={rooms} />}
        </section>

        <SectionDivider />

        {/* ── 5. Availability ───────────────────────────────────── */}
        <section id="section-availability" className="mb-12 scroll-mt-28">
          <SectionHeading
            icon={<Calendar size={20} />}
            title="Availability"
            subtitle="Select check-in and check-out dates — the page will scroll to the booking form automatically"
          />
          <PropertyAvailabilityCalendar
            propertyId={id!}
            onDateSelect={(date) => {
              if (!checkIn) {
                setCheckIn(date);
              } else if (!checkOut && date > checkIn) {
                setCheckOut(date);
                setTimeout(() => scrollToSection('booking'), 300);
              } else {
                setCheckIn(date);
                setCheckOut('');
              }
            }}
            selectedStartDate={checkIn}
            selectedEndDate={checkOut}
          />
        </section>

        <SectionDivider />

        {/* ── 6. Room Insights ──────────────────────────────────── */}
        <section id="section-room-insights" className="mb-12 scroll-mt-28">
          <SectionHeading icon={<BarChart3 size={20} />} title="Room Availability Insights" />
          <RoomAvailabilityInsights propertyId={id!} />
        </section>

        <SectionDivider />

        {/* ── 7. Location & Map ─────────────────────────────────── */}
        <section id="section-location" className="mb-12 scroll-mt-28">
          <SectionHeading icon={<Map size={20} />} title="Location & Nearby Places" />
          {currentProperty.latitude && currentProperty.longitude ? (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
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
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200">
              <MapPin size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-sm">Location coordinates not available for this property</p>
            </div>
          )}
        </section>

        <SectionDivider />

        {/* ── 8. Book Now ───────────────────────────────────────── */}
        <section id="section-booking" className="mb-8 scroll-mt-28">
          <SectionHeading
            icon={<Calendar size={20} />}
            title="Book Now"
            subtitle="Complete your reservation below"
            accent
          />
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
        </section>
      </div>
    </div>
  );
};
