import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Bed,
  Ruler,
  Layers,
  Info,
  Image as ImageIcon,
  Map,
  Plus,
  Home,
  Building2,
  ChevronDown,
  CheckCircle,
  Wifi,
  Settings,
  Calendar,
  IndianRupee,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { ImageCarousel } from '../components/ui/ImageCarousel';
import { GoogleMapComponent } from '../components/maps/GoogleMapComponent';
import { NearbyPlacesPanel } from '../components/maps/NearbyPlacesPanel';
import { quartersService, Quarter } from '../services/quartersService';
import { useAuthStore } from '../stores/authStore';
import { canManageProperties } from '../utils/permissions';
import { ROUTES } from '../constants/routes';

// ── Helpers ────────────────────────────────────────────────────────

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
  'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800&q=80',
];

function resolveImages(q: Quarter): string[] {
  let images: unknown = q.images;
  if (typeof images === 'string') {
    try {
      images = JSON.parse(images as string);
    } catch {
      images = (images as string)
        .replace(/^\{/, '')
        .replace(/\}$/, '')
        .split(',')
        .map((s: string) => s.trim().replace(/^"|"$/g, ''))
        .filter(Boolean);
    }
  }
  if (Array.isArray(images) && (images as string[]).length > 0) {
    return images as string[];
  }
  return FALLBACK_IMAGES;
}

function fmtINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getOccupancyBadge(status: string) {
  if (status === 'AVAILABLE') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (status === 'OCCUPIED') return 'bg-red-50 text-red-700 border border-red-200';
  return 'bg-amber-50 text-amber-700 border border-amber-200';
}

// ── Section definitions ────────────────────────────────────────────

interface SectionDef {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const SECTIONS: SectionDef[] = [
  { id: 'overview', label: 'Overview',  icon: <Info size={15} /> },
  { id: 'images',   label: 'Images',    icon: <ImageIcon size={15} /> },
  { id: 'location', label: 'Location',  icon: <Map size={15} /> },
  { id: 'action',   label: 'Request',   icon: <Plus size={15} /> },
];

function scrollToSection(sectionId: string) {
  const el = document.getElementById(`section-${sectionId}`);
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 115;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}

// ── Shared sub-components ──────────────────────────────────────────

interface SectionHeadingProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  accent?: boolean;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({ icon, title, subtitle, accent }) => (
  <div className="flex items-start gap-3 mb-5">
    <div
      className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
        accent ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {icon}
    </div>
    <div>
      <h2 className={`text-xl font-bold ${accent ? 'text-blue-700' : 'text-gray-900'}`}>
        {title}
      </h2>
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

// ── Main page ──────────────────────────────────────────────────────

export const QuarterDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [quarter, setQuarter] = useState<Quarter | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [navExpanded, setNavExpanded] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!id) return;
    quartersService
      .getQuarterById(id)
      .then(setQuarter)
      .catch(() => setQuarter(null))
      .finally(() => setLoading(false));
  }, [id]);

  const setupObserver = useCallback(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        let topmost: { id: string; top: number } | null = null;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id.replace('section-', '');
            const top = entry.boundingClientRect.top;
            if (!topmost || top < topmost.top) topmost = { id: sectionId, top };
          }
        });
        if (topmost) setActiveSection((topmost as { id: string }).id);
      },
      { threshold: 0.1, rootMargin: '-100px 0px -50% 0px' }
    );
    SECTIONS.forEach(({ id: sId }) => {
      const el = document.getElementById(`section-${sId}`);
      if (el) observerRef.current!.observe(el);
    });
  }, []);

  useEffect(() => {
    if (!quarter) return;
    const timer = setTimeout(setupObserver, 250);
    return () => {
      clearTimeout(timer);
      observerRef.current?.disconnect();
    };
  }, [quarter, setupObserver]);

  const canManage = user && canManageProperties(user.role);
  const isGovtOfficial = user?.role === 'govt_official';
  const isAvailable = quarter?.occupancy_status === 'AVAILABLE';

  // ── Loading ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600" />
        </div>
      </div>
    );
  }

  if (!quarter) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <Building2 size={48} className="text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-700">Quarter not found</h2>
          <button
            onClick={() => navigate(ROUTES.QUARTERS_FREEVIEW)}
            className="text-blue-600 hover:underline text-sm"
          >
            Back to Browse Quarters
          </button>
        </div>
      </div>
    );
  }

  const images = resolveImages(quarter);
  const lat = quarter.metadata?.latitude ? Number(quarter.metadata.latitude) : null;
  const lng = quarter.metadata?.longitude ? Number(quarter.metadata.longitude) : null;
  const hasLocation = lat !== null && lng !== null;

  // Label for the action section tab — role-sensitive
  const actionLabel = canManage ? 'Manage' : 'Request';
  const sectionsWithActionLabel = SECTIONS.map((s) =>
    s.id === 'action' ? { ...s, label: actionLabel } : s
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* ── Sticky top navigation ──────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/92 backdrop-blur-md border-b border-gray-200/80 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back / Manage */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            {canManage && (
              <button
                onClick={() => navigate(ROUTES.QUARTERS_MANAGER)}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-1.5 rounded-xl font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Settings size={14} />
                Manage Quarters
              </button>
            )}
            {isGovtOfficial && isAvailable && (
              <button
                onClick={() => scrollToSection('action')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-xl font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Plus size={14} />
                Add to Request
              </button>
            )}
          </div>

          {/* Section pill strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none">
            {sectionsWithActionLabel.map(({ id: sId, label, icon }) => {
              const isActive = activeSection === sId;
              const isAction = sId === 'action';
              return (
                <button
                  key={sId}
                  onClick={() => scrollToSection(sId)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 border ${
                    isActive
                      ? isAction
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-gray-800 text-white border-gray-800 shadow-md'
                      : isAction
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

      {/* ── Floating right section navigator ──────────────────── */}
      <div
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 hidden lg:block"
        onMouseEnter={() => setNavExpanded(true)}
        onMouseLeave={() => setNavExpanded(false)}
      >
        <div
          className={`flex flex-col gap-0.5 bg-white/96 backdrop-blur-sm shadow-xl border border-gray-200/80 rounded-l-2xl py-2.5 px-1.5 transition-all duration-300 ease-in-out ${
            navExpanded ? 'w-36' : 'w-11'
          }`}
        >
          {sectionsWithActionLabel.map(({ id: sId, label, icon }) => {
            const isActive = activeSection === sId;
            const isAction = sId === 'action';
            return (
              <button
                key={sId}
                onClick={() => scrollToSection(sId)}
                title={!navExpanded ? label : undefined}
                className={`flex items-center gap-2.5 rounded-xl transition-all duration-200 overflow-hidden flex-shrink-0 ${
                  navExpanded ? 'px-2.5 py-2' : 'p-2 justify-center'
                } ${
                  isActive
                    ? isAction
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-800 text-white shadow-sm'
                    : isAction
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

      {/* ── Main scrollable content ────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 pr-4 lg:pr-16">

        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden shadow-xl mb-10" style={{ height: 380 }}>
          <ImageCarousel
            images={images}
            alt={quarter.quarter_number}
            className="h-full"
            showFullscreen
            autoPlay={false}
          />

          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

          {/* Badges */}
          <div className="absolute top-4 left-4 flex gap-2 pointer-events-none">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${getOccupancyBadge(quarter.occupancy_status)}`}>
              {isAvailable ? 'Available' : 'Occupied'}
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800/80 text-white backdrop-blur-sm">
              {quarter.quarter_type}
            </span>
          </div>

          {/* Title + address */}
          <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
              {quarter.quarter_number}
            </h1>
            {quarter.address && (
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <MapPin size={14} className="flex-shrink-0" />
                <span>{quarter.address}</span>
              </div>
            )}
          </div>

          {/* CTA overlay button */}
          {isGovtOfficial && isAvailable && (
            <button
              onClick={() => scrollToSection('action')}
              className="absolute top-4 right-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus size={15} />
              Add to Request
              <ChevronDown size={13} />
            </button>
          )}
        </div>

        {/* ── 1. Overview ──────────────────────────────────────── */}
        <section id="section-overview" className="mb-12 scroll-mt-28">
          <SectionHeading icon={<Info size={20} />} title="Overview" />

          <div className="space-y-6">
            {/* Primary spec grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: <Bed size={16} />,       label: 'Configuration', value: quarter.bhk_config },
                { icon: <Ruler size={16} />,     label: 'Area',          value: `${quarter.area_sqft} sq.ft` },
                { icon: <Building2 size={16} />, label: 'Block / Floor', value: `${quarter.block_name || '—'} / ${quarter.floor_number}` },
                { icon: <Layers size={16} />,    label: 'Furnishing',    value: quarter.furnishing_status },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-2">
                    {item.icon}
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900">{item.value}</div>
                </div>
              ))}
            </div>

            {/* Secondary info row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center gap-1.5 text-gray-400 mb-2">
                  <Home size={16} />
                  <span className="text-xs font-medium">Quarter Type</span>
                </div>
                <div className="text-sm font-bold text-gray-900">{quarter.quarter_type}</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center gap-1.5 text-gray-400 mb-2">
                  <IndianRupee size={16} />
                  <span className="text-xs font-medium">Monthly Rent</span>
                </div>
                <div className="text-sm font-bold text-emerald-700">
                  {fmtINR(quarter.monthly_rent)}
                  <span className="text-xs text-gray-400 font-normal"> /mo</span>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center gap-1.5 text-gray-400 mb-2">
                  <CheckCircle size={16} />
                  <span className="text-xs font-medium">Status</span>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${getOccupancyBadge(quarter.occupancy_status)}`}
                >
                  <CheckCircle size={11} />
                  {isAvailable ? 'Available' : 'Occupied'}
                </span>
              </div>
            </div>

            {/* Description */}
            {quarter.description && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Description</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{quarter.description}</p>
              </div>
            )}

            {/* Amenities */}
            {quarter.amenities?.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-3">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {quarter.amenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-gray-200 shadow-sm"
                    >
                      <Wifi size={15} className="text-blue-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <SectionDivider />

        {/* ── 2. Images ────────────────────────────────────────── */}
        <section id="section-images" className="mb-12 scroll-mt-28">
          <SectionHeading
            icon={<ImageIcon size={20} />}
            title="Images"
            subtitle="All photos of this quarter"
          />

          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden shadow-md">
              <ImageCarousel
                images={images}
                alt={quarter.quarter_number}
                className="h-80"
                showFullscreen
                autoPlay={false}
              />
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {images.map((src, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors cursor-pointer"
                  >
                    <img
                      src={src}
                      alt={`${quarter.quarter_number} ${i + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGES[0];
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="text-sm text-gray-500 text-center">
              {images.length} {images.length === 1 ? 'image' : 'images'} available
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ── 3. Location ──────────────────────────────────────── */}
        <section id="section-location" className="mb-12 scroll-mt-28">
          <SectionHeading icon={<Map size={20} />} title="Location & Nearby Places" />

          {hasLocation ? (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <GoogleMapComponent
                  latitude={lat!}
                  longitude={lng!}
                  propertyName={quarter.quarter_number}
                  propertyAddress={quarter.address}
                  height="480px"
                />
              </div>
              <div className="lg:col-span-1">
                <NearbyPlacesPanel latitude={lat!} longitude={lng!} />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 rounded-xl">
                  <MapPin size={20} className="text-gray-500" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Address</div>
                  <div className="text-sm text-gray-600">{quarter.address || 'Address not available'}</div>
                  {quarter.block_name && (
                    <div className="text-sm text-gray-500 mt-1">
                      Block {quarter.block_name} · Floor {quarter.floor_number}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        <SectionDivider />

        {/* ── 4. Action section (role-aware) ───────────────────── */}
        <section id="section-action" className="mb-8 scroll-mt-28">
          {canManage ? (
            // Admin / Manager — Edit / Manage panel
            <>
              <SectionHeading
                icon={<Settings size={20} />}
                title="Manage Quarter"
                subtitle="Manage this quarter's details, allotments, and tenant records"
                accent
              />
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Quarter',  value: quarter.quarter_number },
                    { label: 'Config',   value: quarter.bhk_config },
                    { label: 'Area',     value: `${quarter.area_sqft} sq.ft` },
                    { label: 'Rent',     value: `${fmtINR(quarter.monthly_rent)}/mo` },
                  ].map((item) => (
                    <div key={item.label} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                      <div className="text-sm font-bold text-gray-900">{item.value}</div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => navigate(ROUTES.QUARTERS_MANAGER)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-semibold text-sm transition-colors shadow-md hover:shadow-lg"
                  >
                    <Settings size={16} />
                    Go to Quarter Manager
                  </button>
                </div>
              </div>
            </>
          ) : isGovtOfficial ? (
            // Govt official — allotment request CTA
            <>
              <SectionHeading
                icon={<Calendar size={20} />}
                title="Request This Quarter"
                subtitle={
                  isAvailable
                    ? 'Submit an allotment request to apply for this quarter'
                    : 'This quarter is currently not available for allotment'
                }
                accent
              />

              {isAvailable ? (
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 shadow-xl text-white">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                      { label: 'Quarter',  value: quarter.quarter_number },
                      { label: 'Config',   value: quarter.bhk_config },
                      { label: 'Area',     value: `${quarter.area_sqft} sq.ft` },
                      { label: 'Rent',     value: `${fmtINR(quarter.monthly_rent)}/mo` },
                    ].map((item) => (
                      <div key={item.label} className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                        <div className="text-xs text-blue-100 mb-1">{item.label}</div>
                        <div className="text-sm font-bold">{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => navigate(ROUTES.QUARTERS_REQUESTS, { state: { prefill: quarter } })}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors shadow-md hover:shadow-lg"
                    >
                      <Plus size={16} />
                      Add to Allotment Request
                    </button>
                    <button
                      onClick={() => navigate(ROUTES.QUARTERS_REQUESTS)}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-white/15 border border-white/30 text-white rounded-xl font-medium text-sm hover:bg-white/25 transition-colors"
                    >
                      View My Requests
                    </button>
                  </div>
                  <p className="text-xs text-blue-200 mt-4">
                    "Add to Allotment Request" takes you to the Requests page with this quarter pre-selected as a preference.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gray-100 rounded-xl">
                      <Building2 size={20} className="text-gray-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Currently Occupied</div>
                      <p className="text-sm text-gray-600">
                        This quarter is occupied at the moment. Browse other available quarters or check back later.
                      </p>
                      <button
                        onClick={() => navigate(ROUTES.QUARTERS_FREEVIEW)}
                        className="mt-3 inline-flex items-center gap-1.5 text-sm bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg transition-colors font-medium"
                      >
                        Browse Available Quarters
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Other authenticated roles — read-only informational panel
            <>
              <SectionHeading
                icon={<Home size={20} />}
                title="Allotment Information"
                subtitle="How government quarters are allocated"
              />
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Home size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 mb-2">Official Allotment Process</div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Government quarters are allocated through an official allotment cycle process managed by the Estate Office. Only authorised government officials can submit allotment requests. Contact your department's administrative office for eligibility and process details.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
