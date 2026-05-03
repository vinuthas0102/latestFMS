import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Bed, Ruler, Layers, Info, Map, Plus, Home,
  Building2, CheckCircle, Wifi, Settings, IndianRupee,
  Zap, Droplets, Shield, FileText, AlertCircle, ChevronDown,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { PhotoGallery, PhotoLightbox } from '../components/ui/PhotoGallery';
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
        .replace(/^\{/, '').replace(/\}$/, '')
        .split(',')
        .map((s: string) => s.trim().replace(/^"|"$/g, ''))
        .filter(Boolean);
    }
  }
  if (Array.isArray(images) && (images as string[]).length > 0) return images as string[];
  return FALLBACK_IMAGES;
}

function fmtINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function getOccupancyBadge(status: string) {
  if (status === 'AVAILABLE') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (status === 'OCCUPIED') return 'bg-red-50 text-red-700 border border-red-200';
  return 'bg-amber-50 text-amber-700 border border-amber-200';
}

// ── Tab definitions ────────────────────────────────────────────────

type TabId = 'overview' | 'financials' | 'amenities' | 'images' | 'location' | 'action';

interface TabDef { id: TabId; label: string; icon: React.ReactNode }

const BASE_TABS: TabDef[] = [
  { id: 'overview',   label: 'Overview',    icon: <Info size={14} /> },
  { id: 'financials', label: 'Financials',  icon: <IndianRupee size={14} /> },
  { id: 'amenities',  label: 'Amenities',   icon: <CheckCircle size={14} /> },
  { id: 'images',     label: 'Photos',      icon: <Building2 size={14} /> },
  { id: 'location',   label: 'Location',    icon: <Map size={14} /> },
];

// ── Spec tile ─────────────────────────────────────────────────────

const SpecTile: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; accent?: string }> = ({
  icon, label, value, accent,
}) => (
  <div className={`rounded-xl border p-4 ${accent ? accent : 'bg-white border-gray-200'} shadow-sm`}>
    <div className="flex items-center gap-1.5 text-gray-400 mb-2">{icon}<span className="text-xs font-medium">{label}</span></div>
    <div className="text-sm font-bold text-gray-900">{value}</div>
  </div>
);

// ── Main page ──────────────────────────────────────────────────────

export const QuarterDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [quarter, setQuarter] = useState<Quarter | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryStart, setGalleryStart] = useState(0);
  const tabBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    quartersService.getQuarterById(id)
      .then(setQuarter)
      .catch(() => setQuarter(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const canManage = user && canManageProperties(user.role);
  const isGovtOfficial = user?.role === 'govt_official';

  // ── Loading ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-teal-600" />
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
          <button onClick={() => navigate(ROUTES.QUARTERS_FREEVIEW)} className="text-blue-600 hover:underline text-sm">
            Back to Browse Quarters
          </button>
        </div>
      </div>
    );
  }

  const images = resolveImages(quarter);
  const isAvailable = quarter.occupancy_status === 'AVAILABLE';
  const lat = quarter.metadata?.latitude ? Number(quarter.metadata.latitude) : null;
  const lng = quarter.metadata?.longitude ? Number(quarter.metadata.longitude) : null;
  const hasLocation = lat !== null && lng !== null;

  // Dynamic action tab label
  const actionLabel = canManage ? 'Manage' : isGovtOfficial ? 'Request' : 'Info';
  const tabs: TabDef[] = [
    ...BASE_TABS,
    { id: 'action', label: actionLabel, icon: canManage ? <Settings size={14} /> : <Plus size={14} /> },
  ];

  // Financials from metadata
  const electricityRate = quarter.metadata?.electricity_rate as string | undefined;
  const waterRate = quarter.metadata?.water_rate as string | undefined;
  const maintenanceCharge = quarter.metadata?.maintenance_charge as number | undefined;
  const depositMonths = quarter.metadata?.deposit_months as number | undefined;
  const rentEscalation = quarter.metadata?.rent_escalation_pct as number | undefined;

  // Lightbox info panel
  const lightboxInfoPanel = (
    <div className="p-6 text-white space-y-4">
      <div className="flex gap-2 flex-wrap">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getOccupancyBadge(quarter.occupancy_status)}`}>
          {isAvailable ? 'Available' : 'Occupied'}
        </span>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-white">
          {quarter.quarter_type}
        </span>
      </div>
      <h2 className="text-xl font-bold">{quarter.quarter_number}</h2>
      {quarter.address && (
        <div className="flex items-start gap-2 text-white/70 text-sm">
          <MapPin size={13} className="mt-0.5 flex-shrink-0" />
          <span>{quarter.address}</span>
        </div>
      )}
      <div className="bg-white/10 rounded-xl p-3 border border-white/15 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Configuration</span>
          <span className="font-bold">{quarter.bhk_config}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Area</span>
          <span className="font-bold">{quarter.area_sqft} sq.ft</span>
        </div>
        <div className="border-t border-white/10 pt-2 flex justify-between">
          <span className="text-white/60 text-sm">Monthly Rent</span>
          <span className="font-black text-lg text-emerald-300">{fmtINR(quarter.monthly_rent)}</span>
        </div>
      </div>
      {isGovtOfficial && isAvailable && (
        <button
          onClick={() => navigate(ROUTES.QUARTERS_REQUESTS, { state: { prefill: quarter } })}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-colors"
        >
          Add to Request
        </button>
      )}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* ── Sticky tab bar ─────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back / Action row */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <div className="flex items-center gap-2">
              {canManage && (
                <button
                  onClick={() => navigate(ROUTES.QUARTERS_MANAGER)}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg font-semibold text-xs shadow-sm transition-all"
                >
                  <Settings size={13} /> Quarter Manager
                </button>
              )}
              {isGovtOfficial && isAvailable && (
                <button
                  onClick={() => handleTabChange('action')}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-semibold text-xs shadow-sm transition-all"
                >
                  <Plus size={13} /> Add to Request
                </button>
              )}
            </div>
          </div>

          {/* Tab strip */}
          <div ref={tabBarRef} className="flex items-center overflow-x-auto scrollbar-none">
            {tabs.map(({ id: tId, label, icon }) => {
              const isActive = activeTab === tId;
              const isAction = tId === 'action';
              return (
                <button
                  key={tId}
                  onClick={() => handleTabChange(tId)}
                  className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 border-b-2 -mb-px ${
                    isActive
                      ? isAction
                        ? 'text-teal-700 border-teal-600'
                        : 'text-slate-900 border-slate-800'
                      : isAction
                      ? 'text-teal-600 border-transparent hover:border-teal-300'
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

        {/* Photo gallery — always visible */}
        <div className="mb-6">
          <PhotoGallery
            images={images}
            alt={quarter.quarter_number}
            heroHeight="400px"
            lightboxInfo={lightboxInfoPanel}
          />
        </div>

        {/* Quarter title strip */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getOccupancyBadge(quarter.occupancy_status)}`}>
                {isAvailable ? 'Available' : 'Occupied'}
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {quarter.quarter_type}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                {quarter.bhk_config}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{quarter.quarter_number}</h1>
            {quarter.address && (
              <div className="flex items-center gap-1.5 mt-1 text-gray-500 text-sm">
                <MapPin size={13} className="flex-shrink-0" />
                <span>{quarter.address}</span>
              </div>
            )}
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Monthly Rent</div>
            <div className="text-3xl font-black text-emerald-700 leading-none">
              {fmtINR(quarter.monthly_rent)}
            </div>
            <div className="text-sm text-gray-400">per month</div>
            {isGovtOfficial && isAvailable && (
              <button
                onClick={() => handleTabChange('action')}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
              >
                Request Quarter <ChevronDown size={13} />
              </button>
            )}
          </div>
        </div>

        {/* ── Tab Panels ────────────────────────────────────── */}

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Primary spec grid */}
            <section>
              <h2 className="text-base font-bold text-gray-800 mb-3">Quarter Specifications</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <SpecTile icon={<Bed size={14} />} label="Configuration" value={quarter.bhk_config} />
                <SpecTile icon={<Ruler size={14} />} label="Area" value={`${quarter.area_sqft} sq.ft`} />
                <SpecTile icon={<Building2 size={14} />} label="Block / Floor" value={`${quarter.block_name || '—'} / Fl. ${quarter.floor_number}`} />
                <SpecTile icon={<Layers size={14} />} label="Furnishing" value={quarter.furnishing_status} />
              </div>
            </section>

            <section>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <SpecTile icon={<Home size={14} />} label="Quarter Type" value={quarter.quarter_type} />
                <SpecTile
                  icon={<IndianRupee size={14} />}
                  label="Monthly Rent"
                  value={<span className="text-emerald-700">{fmtINR(quarter.monthly_rent)}</span>}
                  accent="bg-emerald-50 border-emerald-200"
                />
                <SpecTile
                  icon={<CheckCircle size={14} />}
                  label="Status"
                  value={
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${getOccupancyBadge(quarter.occupancy_status)}`}>
                      <CheckCircle size={10} />
                      {isAvailable ? 'Available' : 'Occupied'}
                    </span>
                  }
                />
              </div>
            </section>

            {/* Description */}
            {quarter.description && (
              <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                  <Info size={14} className="text-blue-500" /> Description
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{quarter.description}</p>
              </section>
            )}
          </div>
        )}

        {/* FINANCIALS */}
        {activeTab === 'financials' && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <IndianRupee size={18} className="text-emerald-600" /> Financial Details
            </h2>

            {/* Rent card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-emerald-800">Monthly Rent</h3>
                <span className="text-3xl font-black text-emerald-700">{fmtINR(quarter.monthly_rent)}</span>
              </div>
              <div className="text-xs text-emerald-600 bg-emerald-100 rounded-lg px-3 py-2">
                Rent is payable monthly in advance by the 5th of each month.
              </div>
            </div>

            {/* Charges breakdown */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-bold text-gray-800">Utility Charges</h3>
              </div>
              <div className="divide-y divide-gray-100">
                <div className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
                      <Zap size={14} className="text-yellow-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800">Electricity</div>
                      <div className="text-xs text-gray-400">Metered, as per actual consumption</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-gray-700">
                    {electricityRate ? `₹${electricityRate}/unit` : 'As per actual'}
                  </div>
                </div>
                <div className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Droplets size={14} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800">Water</div>
                      <div className="text-xs text-gray-400">Flat charge per month</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-gray-700">
                    {waterRate ? `₹${waterRate}/month` : 'Included'}
                  </div>
                </div>
                <div className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                      <Shield size={14} className="text-slate-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800">Maintenance</div>
                      <div className="text-xs text-gray-400">Common area upkeep</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-gray-700">
                    {maintenanceCharge ? fmtINR(maintenanceCharge) : 'Nil'}
                  </div>
                </div>
              </div>
            </div>

            {/* Deposit & escalation */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={15} className="text-slate-500" />
                  <h3 className="text-sm font-bold text-gray-800">Security Deposit</h3>
                </div>
                <div className="text-2xl font-black text-slate-700">
                  {depositMonths
                    ? `${depositMonths} month${depositMonths > 1 ? 's' : ''} rent`
                    : fmtINR(quarter.monthly_rent * 2)}
                </div>
                <div className="text-xs text-gray-400 mt-1">Refundable on vacating</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={15} className="text-amber-500" />
                  <h3 className="text-sm font-bold text-gray-800">Annual Escalation</h3>
                </div>
                <div className="text-2xl font-black text-amber-600">
                  {rentEscalation ? `${rentEscalation}%` : '5%'}
                </div>
                <div className="text-xs text-gray-400 mt-1">Per annum, effective April each year</div>
              </div>
            </div>

            {/* Payment info note */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <Info size={15} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700 leading-relaxed">
                All charges are subject to revision as per government orders. Rent arrears may attract interest as per departmental policy. Contact the Estate Office for the latest rates.
              </p>
            </div>
          </div>
        )}

        {/* AMENITIES */}
        {activeTab === 'amenities' && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-500" /> Amenities & Facilities
            </h2>

            {quarter.amenities?.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {quarter.amenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-teal-200 hover:shadow-md transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                        <Wifi size={14} className="text-teal-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 leading-tight">{amenity}</span>
                    </div>
                  ))}
                </div>

                {/* Standard government facilities note */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Standard Government Quarter Inclusions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'Piped water supply',
                      'Covered parking',
                      'Garbage collection',
                      'Common area lighting',
                      'Security personnel',
                      'Postal address',
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle size={13} className="text-teal-500 flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                <CheckCircle size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 font-medium">Amenity details not available</p>
                <p className="text-sm text-gray-400 mt-1">Contact the Estate Office for facility details</p>
              </div>
            )}
          </div>
        )}

        {/* IMAGES */}
        {activeTab === 'images' && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-gray-800">All Photos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((src, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl overflow-hidden border border-gray-200 cursor-pointer hover:border-teal-400 hover:shadow-md transition-all group"
                  onClick={() => { setGalleryStart(i); setGalleryOpen(true); }}
                >
                  <img
                    src={src}
                    alt={`${quarter.quarter_number} photo ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGES[0]; }}
                  />
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400 text-center">{images.length} photo{images.length !== 1 ? 's' : ''}</p>
          </div>
        )}

        {/* LOCATION */}
        {activeTab === 'location' && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Map size={18} className="text-rose-500" /> Location & Nearby Places
            </h2>
            {hasLocation ? (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                  <GoogleMapComponent
                    latitude={lat!}
                    longitude={lng!}
                    propertyName={quarter.quarter_number}
                    propertyAddress={quarter.address}
                    height="480px"
                  />
                </div>
                <div>
                  <NearbyPlacesPanel latitude={lat!} longitude={lng!} />
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                <MapPin size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">Location details not available</p>
              </div>
            )}
          </div>
        )}

        {/* ACTION */}
        {activeTab === 'action' && (
          <div className="space-y-6">
            {canManage ? (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <Settings size={18} className="text-slate-600" /> Manage Quarter
                </h2>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                      { label: 'Quarter No.',  value: quarter.quarter_number },
                      { label: 'Config',   value: quarter.bhk_config },
                      { label: 'Area',     value: `${quarter.area_sqft} sq.ft` },
                      { label: 'Rent',     value: fmtINR(quarter.monthly_rent) },
                    ].map((item) => (
                      <div key={item.label} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                        <div className="text-xs text-gray-500 mb-0.5">{item.label}</div>
                        <div className="text-sm font-bold text-gray-900">{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate(ROUTES.QUARTERS_MANAGER)}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-sm transition-colors shadow-md"
                  >
                    <Settings size={16} /> Go to Quarter Manager
                  </button>
                </div>
              </div>
            ) : isGovtOfficial ? (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <Plus size={18} className="text-blue-600" />
                  {isAvailable ? 'Request This Quarter' : 'Quarter Unavailable'}
                </h2>
                {isAvailable ? (
                  <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-teal-600 rounded-2xl p-8 shadow-xl text-white">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      {[
                        { label: 'Quarter',  value: quarter.quarter_number },
                        { label: 'Config',   value: quarter.bhk_config },
                        { label: 'Area',     value: `${quarter.area_sqft} sq.ft` },
                        { label: 'Rent',     value: fmtINR(quarter.monthly_rent) },
                      ].map((item) => (
                        <div key={item.label} className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                          <div className="text-xs text-blue-100 mb-0.5">{item.label}</div>
                          <div className="text-sm font-bold">{item.value}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => navigate(ROUTES.QUARTERS_REQUESTS, { state: { prefill: quarter } })}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-md"
                      >
                        <Plus size={16} /> Add to Allotment Request
                      </button>
                      <button
                        onClick={() => navigate(ROUTES.QUARTERS_REQUESTS)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white/15 border border-white/30 text-white rounded-xl font-medium text-sm hover:bg-white/25 transition-colors"
                      >
                        View My Requests
                      </button>
                    </div>
                    <p className="text-xs text-blue-200 mt-4">
                      This quarter will be added as a preference in your allotment request form.
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
                          This quarter is occupied at the moment. Browse other available quarters.
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
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <Info size={18} className="text-blue-500" /> Allotment Information
                </h2>
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
              </div>
            )}
          </div>
        )}
      </div>

      {/* Standalone lightbox for Images tab */}
      {galleryOpen && (
        <PhotoLightbox
          images={images}
          initialIndex={galleryStart}
          onClose={() => setGalleryOpen(false)}
          infoPanel={lightboxInfoPanel}
        />
      )}

      {/* Sticky rent bar for govt officials when not on action tab */}
      {isGovtOfficial && isAvailable && activeTab !== 'action' && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 shadow-2xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div>
              <div className="font-bold text-gray-900">{quarter.quarter_number}</div>
              <div className="text-sm text-gray-500">
                <span className="font-semibold text-emerald-700">{fmtINR(quarter.monthly_rent)}</span> /month · {quarter.bhk_config}
              </div>
            </div>
            <button
              onClick={() => handleTabChange('action')}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-all"
            >
              <Plus size={14} /> Add to Request
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
