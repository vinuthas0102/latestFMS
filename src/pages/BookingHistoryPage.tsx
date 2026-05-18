import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar, History, CheckCircle, XCircle, Home, ChevronRight,
  Building2, Eye, ChevronLeft, Search, SlidersHorizontal,
  CreditCard, MapPin, X, Download,
  ChevronDown, ChevronUp, FileText, Send, KeyRound, LogOut,
  Ban, Ruler, Bed, Layers, Images, Plus, Compass,
  Zap, Droplets, LayoutDashboard, MoreVertical, AlertTriangle,
  Wrench, RefreshCw, HelpCircle, Loader2,
} from 'lucide-react';
import { BookingServiceType } from '../types';
import { bookingService } from '../services/bookingService';
import { getProperties } from '../services/property/corePropertyService';
import { BookingDTO, BookingStatus, PropertyDTO } from '../types';
import { formatDate } from '../utils/dateHelpers';
import { formatCurrency } from '../utils/formatters';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { FadeIn } from '../components/animations/FadeIn';
import { CountUp } from '../components/animations/CountUp';
import { BookingDetailPanel } from '../components/booking/BookingDetailPanel';
import {
  getBookingStatusConfig, calcNights, getPropertyImage, BOOKING_STATUS_ACCENT,
} from '../utils/bookingFormatters';
import { FilterDrawer } from '../components/ui/FilterDrawer';
import SplitLayout from '../components/ui/SplitLayout';
import { downloadPageAsHtml } from '../utils/downloadHtml';
import { ROUTES } from '../constants/routes';
import { PropertyDetailModal } from '../components/property/PropertyDetailModal';
import { bookingServiceRequestService } from '../services/bookingServiceRequestService';

// ─── Types ────────────────────────────────────────────────────────────────────

type DpKey =
  | 'all' | 'upcoming' | 'checkedIn' | 'completed' | 'cancelled' | 'availableProperties'
  | 'draft' | 'submitted' | 'allotted' | 'occupied' | 'vacated' | 'declined';

interface DpCard {
  key: DpKey;
  label: string;
  description: string;
  count: number;
  gradient: string;
  icon: React.ReactNode;
  secondaryValue?: number;
  secondaryLabel?: string;
}

// ─── DP Status Card ───────────────────────────────────────────────────────────

const StatusDpCard: React.FC<{
  card: DpCard;
  isActive: boolean;
  onClick: () => void;
  delay?: number;
}> = ({ card, isActive, onClick, delay = 0 }) => (
  <FadeIn delay={delay}>
    <div className="relative flex-none w-[200px]">
      <div
        onClick={onClick}
        className={`bg-gradient-to-br ${card.gradient} rounded-xl cursor-pointer transition-all duration-200 overflow-hidden flex min-h-[90px] ${
          isActive ? 'shadow-xl scale-[1.03]' : 'shadow-sm hover:shadow-lg hover:-translate-y-0.5'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-black/10 pointer-events-none" />
        <div className="absolute -top-5 -right-5 w-20 h-20 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-4 -left-3 w-14 h-14 bg-black/8 rounded-full pointer-events-none" />

        {/* Icon column */}
        <div className="relative z-10 flex-none flex items-center justify-center px-3 border-r border-white/20">
          <div className="p-2 bg-white/25 backdrop-blur-sm rounded-xl border border-white/30">
            {card.icon}
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex-1 px-3 py-3 flex flex-col justify-center min-w-0 gap-0.5">
          <p className="text-xl font-extrabold text-white leading-tight">
            <CountUp end={card.count} duration={1200} />
          </p>
          <p className="text-[10px] font-bold text-white/95 uppercase tracking-widest leading-tight truncate">
            {card.label}
          </p>
          <p className="text-[10px] text-white/65 leading-tight truncate">{card.description}</p>
        </div>

        {/* Secondary metric */}
        {card.secondaryValue != null && (
          <div className="relative z-10 flex-none flex flex-col items-center justify-center px-3 border-l border-white/20 min-w-[48px]">
            <p className="text-sm font-bold text-white leading-none tabular-nums">
              <CountUp end={card.secondaryValue} duration={1400} />
            </p>
            {card.secondaryLabel && (
              <p className="text-[9px] text-white/60 uppercase tracking-wide mt-0.5 text-center leading-tight whitespace-nowrap">
                {card.secondaryLabel}
              </p>
            )}
          </div>
        )}

        <div className={`absolute bottom-0 left-0 right-0 transition-all duration-200 ${isActive ? 'h-1 bg-white/60' : 'h-0.5 bg-white/20'}`} />
      </div>

      {isActive && (
        <>
          <div className="absolute -inset-[3px] rounded-[14px] ring-2 ring-white pointer-events-none" />
          <div className="absolute -inset-[5px] rounded-[16px] ring-2 ring-gray-800/30 pointer-events-none" />
        </>
      )}
    </div>
  </FadeIn>
);

// ─── Booking List Card ────────────────────────────────────────────────────────

const STATUS_BADGE_CLS: Record<string, string> = {
  REQUESTED:   'bg-amber-50 text-amber-700 border border-amber-200',
  PROVISIONED: 'bg-blue-50 text-blue-700 border border-blue-200',
  ALLOCATED:   'bg-cyan-50 text-cyan-700 border border-cyan-200',
  CHECKED_IN:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
  CHECKED_OUT: 'bg-green-50 text-green-700 border border-green-200',
  CANCELLED:   'bg-red-50 text-red-700 border border-red-200',
  REJECTED:    'bg-rose-50 text-rose-700 border border-rose-200',
};

const SVC_LABEL: Record<BookingServiceType, string> = {
  GRIEVANCE:            'Grievance',
  MAINTENANCE:          'Maintenance',
  EXTENSION:            'Extension Request',
  CANCELLATION_REQUEST: 'Cancellation Request',
  GENERAL:              'General Enquiry',
};

const ACTION_MENU_ITEMS: { type: BookingServiceType; label: string; Icon: React.FC<{ size?: number; className?: string }>; color: string }[] = [
  { type: 'GRIEVANCE',            label: 'Grievance',            Icon: AlertTriangle, color: 'text-red-600' },
  { type: 'MAINTENANCE',          label: 'Maintenance',          Icon: Wrench,        color: 'text-orange-600' },
  { type: 'EXTENSION',            label: 'Extension Request',    Icon: RefreshCw,     color: 'text-blue-600' },
  { type: 'CANCELLATION_REQUEST', label: 'Cancellation Request', Icon: Ban,           color: 'text-rose-600' },
  { type: 'GENERAL',              label: 'General Enquiry',      Icon: HelpCircle,    color: 'text-gray-600' },
];

const BookingListCard: React.FC<{
  booking: BookingDTO;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  activeServiceCount?: number;
  onRaiseService: (booking: BookingDTO, type: BookingServiceType) => void;
}> = ({ booking, index, isSelected, onClick, activeServiceCount = 0, onRaiseService }) => {
  const [thumbErr, setThumbErr] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const statusCfg = getBookingStatusConfig(booking.status);
  const nights = calcNights(booking.checkInDate, booking.checkOutDate);
  const thumbSrc = getPropertyImage(booking, index);
  const accentColor = BOOKING_STATUS_ACCENT[booking.status] ?? 'bg-gray-300';
  const canRaiseService = !['CANCELLED', 'REJECTED', 'CHECKED_OUT'].includes(booking.status);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const details = [
    { label: 'Property', value: booking.property?.name },
    { label: 'Check-in', value: formatDate(booking.checkInDate) },
    { label: 'Check-out', value: formatDate(booking.checkOutDate) },
    { label: 'Room Type', value: booking.roomType?.name },
    { label: 'Nights', value: String(nights) },
    { label: 'Amount', value: formatCurrency(booking.totalAmount) },
  ].filter(d => d.value);

  return (
    <FadeIn delay={index * 30}>
      <div
        onClick={onClick}
        className={`bg-white rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
          isSelected ? 'border-blue-400 shadow-lg ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex">
          {/* Accent bar */}
          <div className={`w-1 shrink-0 ${accentColor} rounded-l-xl`} />

          {/* Thumbnail */}
          <div className="w-24 shrink-0 relative group/thumb bg-gray-100" onClick={e => e.stopPropagation()}>
            {!thumbErr ? (
              <img
                src={thumbSrc}
                alt=""
                className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                style={{ minHeight: 88 }}
                onError={() => setThumbErr(true)}
              />
            ) : (
              <div className="w-full h-full min-h-[88px] flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <Building2 size={22} className="text-gray-300" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/25 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover/thumb:opacity-100 transition-opacity bg-white/90 rounded-full p-1.5 shadow-md">
                <Eye size={13} className="text-gray-700" />
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 px-3.5 py-1.5 min-w-0 flex flex-col justify-between gap-0">
            {/* Row 1: booking number + status badge */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-mono text-[10.5px] font-bold text-gray-700 tracking-wide">
                #{booking.bookingNumber}
              </span>
              <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_BADGE_CLS[booking.status] ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                {statusCfg.label}
              </span>
            </div>

            {/* Row 2: key-value details */}
            <div className="flex flex-wrap gap-x-5 gap-y-0.5 mb-1">
              {details.map((d, i) => (
                <div key={i} className="min-w-0">
                  <div className="text-[8px] font-semibold text-gray-400 uppercase tracking-wide leading-none">{d.label}</div>
                  <div className="text-[10.5px] font-medium text-gray-700 leading-snug truncate max-w-[180px]">{d.value}</div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-auto flex items-center gap-1 pt-0.5 border-t border-gray-100 overflow-hidden min-h-0">
              <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
                {activeServiceCount > 0 && (
                  <span className="relative text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border bg-orange-50 text-orange-700 border-orange-200 shrink-0 whitespace-nowrap">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                    </span>
                    {activeServiceCount} svc{activeServiceCount > 1 ? 's' : ''}
                  </span>
                )}

                {booking.paymentStatus === 'COMPLETED' ? (
                  <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 shrink-0">
                    <CheckCircle size={8} />Paid
                  </span>
                ) : booking.balanceAmount > 0 ? (
                  <span className="text-[9px] text-amber-600 font-semibold flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200 shrink-0">
                    <CreditCard size={8} />Balance due
                  </span>
                ) : null}

                {booking.property?.address && (
                  <span className="text-[9px] text-gray-400 flex items-center gap-0.5 shrink-0 whitespace-nowrap overflow-hidden max-w-[200px] truncate">
                    <MapPin size={8} className="shrink-0" />{booking.property.address}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                {/* Action menu */}
                {canRaiseService && (
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
                      className={`p-1 rounded-lg border transition-colors ${
                        menuOpen
                          ? 'bg-blue-50 border-blue-300 text-blue-600'
                          : 'border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200'
                      }`}
                      title="Actions"
                    >
                      <MoreVertical size={12} />
                    </button>
                    {menuOpen && (
                      <div className="absolute right-0 bottom-full mb-1 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                        <div className="px-3 py-1.5 border-b border-gray-100">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Raise Service</span>
                        </div>
                        {ACTION_MENU_ITEMS.map(({ type, label, Icon, color }) => (
                          <button
                            key={type}
                            onClick={e => { e.stopPropagation(); setMenuOpen(false); onRaiseService(booking, type); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left"
                          >
                            <Icon size={13} className={color} />
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={e => { e.stopPropagation(); onClick(); }}
                  className={`p-1 rounded-lg border transition-colors ${
                    isSelected
                      ? 'bg-blue-50 border-blue-300 text-blue-600'
                      : 'border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200'
                  }`}
                  title="View details"
                >
                  <Eye size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
};

// ─── Available Property Card ──────────────────────────────────────────────────

const PROP_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
];

function resolvePropertyImages(property: PropertyDTO, idx: number): string[] {
  const raw = property.images;
  const parsed: string[] = Array.isArray(raw) ? (raw as string[]).filter(Boolean) : [];
  const result = [...parsed];
  let fi = idx;
  while (result.length < 5) {
    result.push(PROP_FALLBACK_IMAGES[fi % PROP_FALLBACK_IMAGES.length]);
    fi++;
  }
  return result;
}

const AvailablePropertyCard: React.FC<{
  property: PropertyDTO;
  index: number;
  onView: () => void;
  onBook: () => void;
}> = ({ property, index, onView, onBook }) => {
  const [primaryImgError, setPrimaryImgError] = useState(false);
  const [thumbErrors, setThumbErrors] = useState<Record<number, boolean>>({});

  const allImages = resolvePropertyImages(property, index);
  const primaryImage = allImages[0];
  const thumbnails = allImages.slice(1, 5);

  const rawImgs = Array.isArray(property.images) ? (property.images as string[]).filter(Boolean) : [];
  const extraCount = rawImgs.length > 5 ? rawImgs.length - 4 : 0;

  const typeName = property.assetType?.name ?? property.propertyType?.name ?? 'Property';
  const amenities: string[] = Array.isArray((property as any).amenities) ? (property as any).amenities : [];

  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col sm:flex-row"
      onClick={onView}
    >
      {/* Left: Gallery Image Section */}
      <div className="relative flex-shrink-0 sm:w-64 md:w-72 flex flex-col bg-gray-100">
        <div className="relative overflow-hidden" style={{ height: '196px' }}>
          {!primaryImgError ? (
            <img
              src={primaryImage}
              alt={property.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setPrimaryImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <Building2 size={48} className="text-gray-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-3 left-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 bg-white/90 backdrop-blur-sm">
              Available
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800/85 text-white backdrop-blur-sm shadow-sm">
              {typeName}
            </span>
          </div>
        </div>
        <div className="flex h-[62px] border-t border-gray-200/60">
          {thumbnails.map((src, i) => {
            const isLast = i === 3;
            const showViewAll = isLast && extraCount > 0;
            return (
              <div key={i} className="relative flex-1 overflow-hidden border-r border-gray-200/60 last:border-r-0 bg-gray-100">
                {!thumbErrors[i] ? (
                  <img
                    src={src}
                    alt={`View ${i + 2}`}
                    className="w-full h-full object-cover brightness-95 group-hover:brightness-100 transition-all duration-300"
                    onError={() => setThumbErrors(prev => ({ ...prev, [i]: true }))}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <Images size={13} className="text-gray-400" />
                  </div>
                )}
                {showViewAll && (
                  <div className="absolute inset-0 bg-slate-900/72 flex flex-col items-center justify-center gap-0">
                    <span className="text-white text-[9px] font-black uppercase leading-tight tracking-widest">VIEW</span>
                    <span className="text-white text-[9px] font-black uppercase leading-tight tracking-widest">ALL</span>
                    {extraCount > 0 && <span className="text-white/70 text-[8px] font-semibold mt-0.5">+{extraCount}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Centre: Details */}
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h3 className="text-base font-bold text-blue-700 group-hover:text-blue-800 transition-colors leading-snug">
              {property.name}
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {typeName}
            </span>
            {property.estate?.name && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {property.estate.name}
              </span>
            )}
          </div>

          {property.address && (
            <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
              <MapPin size={12} className="flex-shrink-0 text-gray-400" />
              <span className="truncate">{property.address}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-600 mb-2">
            {property.totalRooms != null && (
              <span className="flex items-center gap-1.5">
                <Bed size={13} className="text-gray-400" />{property.totalRooms} Rooms
              </span>
            )}
            {(property as any).totalFloors != null && (
              <span className="flex items-center gap-1.5">
                <Layers size={13} className="text-gray-400" />{(property as any).totalFloors} Floors
              </span>
            )}
            {property.estate?.name && (
              <span className="flex items-center gap-1.5 text-gray-500">
                <Building2 size={11} className="text-gray-400" />{property.estate.name} Estate
              </span>
            )}
          </div>

          {amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {amenities.slice(0, 5).map((a: string) => (
                <span key={a} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
                  {a}
                </span>
              ))}
              {amenities.length > 5 && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  +{amenities.length - 5} more
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs">
            <CheckCircle size={12} className="text-emerald-500 flex-shrink-0" />
            <span className="text-emerald-700 font-medium">Available for booking</span>
          </div>
        </div>

        {property.description && (
          <p className="text-xs text-gray-400 mt-2.5 line-clamp-1 leading-relaxed border-t border-gray-100 pt-2">
            {property.description}
          </p>
        )}
      </div>

      {/* Right: CTA */}
      <div
        className="flex flex-col justify-end p-4 sm:border-l border-gray-100 sm:w-48 flex-shrink-0 bg-gray-50/40"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col gap-2 mt-4">
          <button
            onClick={e => { e.stopPropagation(); onBook(); }}
            className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-200"
          >
            <Plus size={14} />
            Book Now
          </button>
          <button
            onClick={e => { e.stopPropagation(); onView(); }}
            className="w-full flex items-center justify-center gap-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
          >
            <Eye size={13} />
            View Details
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const BookingHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const addToast = useUIStore((state) => state.addToast);

  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [dpFilter, setDpFilter] = useState<DpKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<BookingDTO | null>(null);
  const [activeServiceCounts, setActiveServiceCounts] = useState<Record<string, number>>({});

  const [availableProperties, setAvailableProperties] = useState<PropertyDTO[]>([]);
  const [avPropSearch, setAvPropSearch] = useState('');
  const [avPropLoading, setAvPropLoading] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Service form modal
  const [svcFormBooking, setSvcFormBooking] = useState<BookingDTO | null>(null);
  const [svcFormType, setSvcFormType] = useState<BookingServiceType | null>(null);
  const [svcFormSubject, setSvcFormSubject] = useState('');
  const [svcFormRemarks, setSvcFormRemarks] = useState('');
  const [svcFormUrgency, setSvcFormUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [svcFormSubmitting, setSvcFormSubmitting] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadBookings();
    loadAvailableProperties();
    const status = searchParams.get('status');
    if (status === 'upcoming') setDpFilter('upcoming');
    else if (status === 'cancelled') setDpFilter('cancelled');
    else if (status === 'completed') setDpFilter('completed');
  }, []);

  const loadBookings = async () => {
    try {
      const data = await bookingService.getBookings({ userId: user!.id });
      setBookings(data);
    } catch {
      addToast('Failed to load booking history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableProperties = async () => {
    setAvPropLoading(true);
    try {
      const data = await getProperties({ status: 'PUBLISHED', userRole: user?.role });
      setAvailableProperties(data);
    } catch {
      // silently fail
    } finally {
      setAvPropLoading(false);
    }
  };

  const openServiceForm = (booking: BookingDTO, type: BookingServiceType) => {
    setSvcFormBooking(booking);
    setSvcFormType(type);
    setSvcFormSubject('');
    setSvcFormRemarks('');
    setSvcFormUrgency('MEDIUM');
  };

  const closeServiceForm = () => {
    setSvcFormBooking(null);
    setSvcFormType(null);
    setSvcFormSubject('');
    setSvcFormRemarks('');
  };

  const handleSubmitService = async () => {
    if (!svcFormBooking || !svcFormType || !svcFormSubject.trim() || !svcFormRemarks.trim()) {
      addToast('Please fill in all required fields', 'warning');
      return;
    }
    setSvcFormSubmitting(true);
    try {
      await bookingServiceRequestService.createServiceRequest(user!.id, {
        bookingId: svcFormBooking.id,
        serviceType: svcFormType,
        subject: svcFormSubject.trim(),
        remarks: svcFormRemarks.trim(),
        urgencyLevel: svcFormUrgency,
      });
      addToast('Service request submitted successfully', 'success');
      // refresh count for this booking
      setActiveServiceCounts(prev => ({ ...prev, [svcFormBooking.id]: (prev[svcFormBooking.id] ?? 0) + 1 }));
      closeServiceForm();
    } catch {
      addToast('Failed to submit service request', 'error');
    } finally {
      setSvcFormSubmitting(false);
    }
  };

  const isGovtOfficial = user?.role === 'govt_official';

  const stats = {
    total: bookings.length,
    upcoming: bookings.filter(b => ['ALLOCATED', 'PROVISIONED'].includes(b.status)).length,
    checkedIn: bookings.filter(b => b.status === 'CHECKED_IN').length,
    completed: bookings.filter(b => b.status === 'CHECKED_OUT').length,
    cancelled: bookings.filter(b => ['CANCELLED', 'REJECTED'].includes(b.status)).length,
    rejected: bookings.filter(b => b.status === 'REJECTED').length,
    provisioned: bookings.filter(b => b.status === 'PROVISIONED').length,
    draft: bookings.filter(b => b.status === 'REQUESTED').length,
    submitted: bookings.filter(b => b.status === 'PROVISIONED').length,
    allotted: bookings.filter(b => b.status === 'ALLOCATED').length,
    occupied: bookings.filter(b => b.status === 'CHECKED_IN').length,
    vacated: bookings.filter(b => b.status === 'CHECKED_OUT').length,
    declined: bookings.filter(b => ['CANCELLED', 'REJECTED'].includes(b.status)).length,
  };

  const dpCards: DpCard[] = isGovtOfficial ? [
    {
      key: 'availableProperties',
      label: 'Available Properties',
      description: 'Browse & book',
      count: availableProperties.length,
      gradient: 'from-cyan-500 to-sky-400',
      icon: <Building2 size={16} className="text-white" />,
    },
    {
      key: 'draft',
      label: 'Draft',
      description: 'Not yet submitted',
      count: stats.draft,
      gradient: 'from-slate-500 to-slate-600',
      icon: <FileText size={16} className="text-white" />,
    },
    {
      key: 'submitted',
      label: 'Submitted',
      description: 'Pending review',
      count: stats.submitted,
      gradient: 'from-sky-500 to-blue-600',
      icon: <Send size={16} className="text-white" />,
    },
    {
      key: 'allotted',
      label: 'Allotted',
      description: 'Confirmed & allocated',
      count: stats.allotted,
      gradient: 'from-teal-500 to-emerald-500',
      icon: <KeyRound size={16} className="text-white" />,
    },
    {
      key: 'occupied',
      label: 'Occupied',
      description: 'Currently staying',
      count: stats.occupied,
      gradient: 'from-amber-500 to-orange-500',
      icon: <Home size={16} className="text-white" />,
    },
    {
      key: 'vacated',
      label: 'Vacated',
      description: 'Stay concluded',
      count: stats.vacated,
      gradient: 'from-emerald-500 to-cyan-500',
      icon: <LogOut size={16} className="text-white" />,
    },
    {
      key: 'declined',
      label: 'Declined',
      description: 'Not approved',
      count: stats.declined,
      gradient: 'from-rose-500 to-pink-500',
      icon: <Ban size={16} className="text-white" />,
    },
  ] : [
    {
      key: 'availableProperties',
      label: 'Available Properties',
      description: 'Browse & book',
      count: availableProperties.length,
      gradient: 'from-cyan-500 to-sky-400',
      icon: <Building2 size={16} className="text-white" />,
    },
    {
      key: 'all',
      label: 'My Bookings',
      description: 'All time',
      count: stats.total,
      gradient: 'from-blue-600 to-teal-500',
      icon: <History size={16} className="text-white" />,
      secondaryValue: stats.upcoming,
      secondaryLabel: 'Active',
    },
    {
      key: 'upcoming',
      label: 'Upcoming',
      description: 'Confirmed & allocated',
      count: stats.upcoming,
      gradient: 'from-sky-500 to-blue-600',
      icon: <Calendar size={16} className="text-white" />,
      secondaryValue: stats.provisioned,
      secondaryLabel: 'Pending',
    },
    {
      key: 'checkedIn',
      label: 'Checked In',
      description: 'Currently staying',
      count: stats.checkedIn,
      gradient: 'from-amber-500 to-orange-500',
      icon: <Home size={16} className="text-white" />,
    },
    {
      key: 'completed',
      label: 'Completed',
      description: 'Stay concluded',
      count: stats.completed,
      gradient: 'from-emerald-500 to-cyan-500',
      icon: <CheckCircle size={16} className="text-white" />,
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      description: 'Booking cancelled',
      count: stats.cancelled,
      gradient: 'from-rose-500 to-pink-500',
      icon: <XCircle size={16} className="text-white" />,
      secondaryValue: stats.rejected,
      secondaryLabel: 'Rejected',
    },
  ];

  const filteredBookings = React.useMemo(() => {
    let result = [...bookings];

    if (dpFilter === 'upcoming') result = result.filter(b => ['ALLOCATED', 'PROVISIONED'].includes(b.status));
    else if (dpFilter === 'checkedIn') result = result.filter(b => b.status === 'CHECKED_IN');
    else if (dpFilter === 'completed') result = result.filter(b => b.status === 'CHECKED_OUT');
    else if (dpFilter === 'cancelled') result = result.filter(b => ['CANCELLED', 'REJECTED'].includes(b.status));
    else if (dpFilter === 'draft') result = result.filter(b => b.status === 'REQUESTED');
    else if (dpFilter === 'submitted') result = result.filter(b => b.status === 'PROVISIONED');
    else if (dpFilter === 'allotted') result = result.filter(b => b.status === 'ALLOCATED');
    else if (dpFilter === 'occupied') result = result.filter(b => b.status === 'CHECKED_IN');
    else if (dpFilter === 'vacated') result = result.filter(b => b.status === 'CHECKED_OUT');
    else if (dpFilter === 'declined') result = result.filter(b => ['CANCELLED', 'REJECTED'].includes(b.status));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.bookingNumber.toLowerCase().includes(q) ||
        (b.property?.name ?? '').toLowerCase().includes(q)
      );
    }

    if (dateFrom) result = result.filter(b => new Date(b.checkInDate) >= new Date(dateFrom));
    if (dateTo) result = result.filter(b => new Date(b.checkOutDate) <= new Date(dateTo));

    result.sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sortOrder === 'newest' ? diff : -diff;
    });

    return result;
  }, [bookings, dpFilter, searchQuery, dateFrom, dateTo, sortOrder]);

  const filteredAvailableProperties = React.useMemo(() => {
    if (!avPropSearch.trim()) return availableProperties;
    const q = avPropSearch.toLowerCase();
    return availableProperties.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.address ?? '').toLowerCase().includes(q) ||
      (p.estate?.name ?? '').toLowerCase().includes(q)
    );
  }, [availableProperties, avPropSearch]);

  const drawerActiveCount = (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);
  const dpLabel = dpCards.find(c => c.key === dpFilter)?.label ?? 'My Bookings';

  const scrollCarousel = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' });
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50/20">
      {/* ── Frozen header ── */}
      <div className="flex-none px-4 sm:px-6 lg:px-8 pt-3 pb-0 z-20">
        <div className="max-w-[1800px] mx-auto">

          {/* Header card — matches Quarter Requests exactly */}
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-2 mb-2">

            {/* Row 1: breadcrumb + action buttons */}
            <div className="flex items-center justify-between gap-2 min-h-0">
              <div className="flex items-center gap-1 text-xs text-gray-400 min-w-0 flex-wrap">
                <button onClick={() => navigate(ROUTES.DASHBOARD)} className="hover:text-blue-600 transition-colors flex-shrink-0">
                  <Home size={11} />
                </button>
                <ChevronRight size={9} className="flex-shrink-0" />
                <button onClick={() => navigate(ROUTES.DASHBOARD)} className="text-gray-500 hover:text-blue-600 transition-colors flex-shrink-0">
                  Workspace
                </button>
                <ChevronRight size={9} className="flex-shrink-0" />
                <button
                  onClick={() => { setSelectedBooking(null); setDpFilter('all'); }}
                  className="text-gray-600 font-medium hover:text-blue-600 transition-colors flex-shrink-0"
                >
                  My Bookings
                </button>
                {dpFilter !== 'all' && (
                  <>
                    <ChevronRight size={9} className="flex-shrink-0" />
                    <button
                      onClick={() => setSelectedBooking(null)}
                      className="text-gray-700 font-medium hover:text-blue-600 transition-colors truncate max-w-[80px]"
                    >
                      {dpLabel}
                    </button>
                  </>
                )}
                {selectedBooking && (
                  <>
                    <ChevronRight size={9} className="flex-shrink-0" />
                    <span className="font-mono text-gray-700 font-medium truncate max-w-[100px]">
                      #{selectedBooking.bookingNumber}
                    </span>
                  </>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => downloadPageAsHtml('/bookings')}
                  title="Download Offline Copy"
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
                >
                  <Download size={14} />
                </button>
                <button
                  onClick={() => navigate(ROUTES.PROPERTIES)}
                  title="Browse Properties"
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
                >
                  <Eye size={14} />
                </button>
              </div>
            </div>

            {/* Row 2: user identity + page title — all inline */}
            <div className="flex items-center gap-2 mt-1.5 min-w-0">
              {user && (
                <>
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold text-[9px] flex-shrink-0">
                    {user.fullName?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <span className="text-xs font-semibold text-gray-700 truncate max-w-[140px]">{user.fullName}</span>
                  {user.email && (
                    <span className="text-[10px] text-gray-400 font-mono flex-shrink-0 hidden sm:inline">{user.email}</span>
                  )}
                  {user.role && (
                    <>
                      <span className="text-gray-200 flex-shrink-0">·</span>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">{user.role.replace('_', ' ')}</span>
                    </>
                  )}
                  <span className="text-gray-200 mx-1 flex-shrink-0">|</span>
                </>
              )}
              <h1 className="text-sm font-bold text-gray-900 leading-none flex-shrink-0">My Bookings</h1>
            </div>
          </div>

          {/* ── DP Carousel ── */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => scrollCarousel('left')}
              className="flex-none p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm"
            >
              <ChevronLeft size={14} />
            </button>

            <div
              ref={scrollRef}
              className="flex gap-3 overflow-x-auto flex-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {dpCards.map((card, i) => (
                <StatusDpCard
                  key={card.key}
                  card={card}
                  isActive={dpFilter === card.key}
                  onClick={() => { setDpFilter(card.key); setSelectedBooking(null); }}
                  delay={i * 40}
                />
              ))}
            </div>

            <button
              onClick={() => scrollCarousel('right')}
              className="flex-none p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Search / Filter bar */}
          {dpFilter !== 'availableProperties' ? (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="flex-1 min-w-[180px] relative">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <Search size={13} />
                </div>
                <div className="absolute left-8 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-gray-400 uppercase tracking-widest pointer-events-none leading-none">
                  Search
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Booking number or property..."
                  className="w-full pl-16 pr-8 py-2.5 text-[11px] bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Sort By chips */}
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5">
                <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mr-1">Sort By</span>
                {(['newest', 'oldest'] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => setSortOrder(opt)}
                    className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors capitalize ${
                      sortOrder === opt ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>

              {/* Advanced filter */}
              <button
                onClick={() => setIsFilterOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-[11px] font-semibold transition-all ${
                  drawerActiveCount > 0
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <SlidersHorizontal size={13} />
                Filter
                {drawerActiveCount > 0 && (
                  <span className="ml-0.5 bg-blue-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {drawerActiveCount}
                  </span>
                )}
              </button>
            </div>
          ) : (
            /* Available Properties search */
            <div className="relative">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <Search size={13} />
              </div>
              <div className="absolute left-8 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-gray-400 uppercase tracking-widest pointer-events-none leading-none">
                Search
              </div>
              <input
                type="text"
                value={avPropSearch}
                onChange={e => setAvPropSearch(e.target.value)}
                placeholder="Property name, estate, location..."
                className="w-full pl-16 pr-8 py-2.5 text-[11px] bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
              />
              {avPropSearch && (
                <button onClick={() => setAvPropSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={12} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Advanced filter drawer ── */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Advanced Filters"
        activeFilterCount={drawerActiveCount}
        onClearAll={() => { setDateFrom(''); setDateTo(''); }}
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Check-in From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Check-out To</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              min={dateFrom || undefined}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>
        </div>
      </FilterDrawer>

      {/* ── Property Detail Modal ── */}
      {selectedPropertyId && (
        <PropertyDetailModal
          isOpen={!!selectedPropertyId}
          onClose={() => setSelectedPropertyId(null)}
          propertyId={selectedPropertyId}
        />
      )}

      {/* ── Service Form Modal ── */}
      {svcFormBooking && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={closeServiceForm}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400 font-mono">#{svcFormBooking.bookingNumber}</p>
                <h3 className="text-sm font-bold text-gray-900 mt-0.5">
                  {svcFormType ? SVC_LABEL[svcFormType] : 'Raise Service'}
                </h3>
              </div>
              <button onClick={closeServiceForm} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Service type selector */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Service Type</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {ACTION_MENU_ITEMS.map(({ type, label, Icon, color }) => (
                    <button
                      key={type}
                      onClick={() => setSvcFormType(type)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                        svcFormType === type
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={13} className={svcFormType === type ? 'text-blue-600' : color} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Subject *</label>
                <input
                  type="text"
                  placeholder="Brief summary…"
                  value={svcFormSubject}
                  onChange={e => setSvcFormSubject(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-300 bg-white"
                />
              </div>

              {/* Details */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Details *</label>
                <textarea
                  rows={3}
                  placeholder="Describe the issue or request…"
                  value={svcFormRemarks}
                  onChange={e => setSvcFormRemarks(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-300 bg-white"
                />
              </div>

              {/* Urgency — only for grievance/maintenance */}
              {(svcFormType === 'GRIEVANCE' || svcFormType === 'MAINTENANCE') && (
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Urgency</label>
                  <div className="flex gap-2">
                    {(['LOW', 'MEDIUM', 'HIGH'] as const).map(u => (
                      <button
                        key={u}
                        onClick={() => setSvcFormUrgency(u)}
                        className={`flex-1 px-2 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          svcFormUrgency === u
                            ? u === 'HIGH' ? 'bg-red-100 border-red-300 text-red-700'
                              : u === 'MEDIUM' ? 'bg-amber-100 border-amber-300 text-amber-700'
                              : 'bg-green-100 border-green-300 text-green-700'
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={closeServiceForm}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitService}
                disabled={svcFormSubmitting || !svcFormType || !svcFormSubject.trim() || !svcFormRemarks.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
              >
                {svcFormSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Content area ── */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 h-full py-4">

          {dpFilter === 'availableProperties' ? (
            avPropLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 animate-pulse h-24" />
                ))}
              </div>
            ) : filteredAvailableProperties.length === 0 ? (
              <FadeIn delay={200}>
                <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center shadow-sm">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-dashed border-cyan-100 bg-cyan-50 mb-4">
                    <Building2 size={28} className="text-cyan-300" />
                  </div>
                  <p className="text-gray-600 font-semibold mb-1">No properties available</p>
                  <p className="text-sm text-gray-400">
                    {avPropSearch ? 'No properties match your search.' : 'Available properties will appear here once configured.'}
                  </p>
                  {avPropSearch && (
                    <button onClick={() => setAvPropSearch('')} className="mt-3 text-sm text-cyan-600 hover:underline">
                      Clear search
                    </button>
                  )}
                </div>
              </FadeIn>
            ) : (
              <div className="space-y-3 overflow-y-auto h-full pr-1">
                {filteredAvailableProperties.map((property, i) => (
                  <AvailablePropertyCard
                    key={property.id}
                    property={property}
                    index={i}
                    onView={() => setSelectedPropertyId(property.id)}
                    onBook={() => navigate(`/properties/${property.id}`)}
                  />
                ))}
              </div>
            )
          ) : loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 animate-pulse flex h-[108px] overflow-hidden">
                  <div className="w-1 bg-gray-200 flex-shrink-0 rounded-l-2xl" />
                  <div className="w-24 bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 p-4 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                    <div className="h-2.5 bg-gray-200 rounded w-1/2" />
                    <div className="h-2.5 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <SplitLayout
              storageKey="bhSplit"
              defaultSplit={65}
              minLeft={40}
              maxLeft={80}
              onClose={() => setSelectedBooking(null)}
              renderRight={selectedBooking ? (controls) => (
                <BookingDetailPanel
                  booking={selectedBooking}
                  userId={user!.id}
                  onClose={() => setSelectedBooking(null)}
                  onNavigate={(id) => navigate(`/bookings/${id}`)}
                  onServiceCountChange={(count) =>
                    setActiveServiceCounts(prev => ({ ...prev, [selectedBooking.id]: count }))
                  }
                  panelControls={controls}
                />
              ) : undefined}
              left={
                <div className="pr-1">
                  {filteredBookings.length === 0 ? (
                    <FadeIn delay={200}>
                      <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center shadow-sm">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-dashed border-gray-100 bg-gray-50 mb-4">
                          <History size={28} className="text-gray-300" />
                        </div>
                        <p className="text-gray-600 font-semibold mb-1">No bookings found</p>
                        <p className="text-sm text-gray-400">
                          {searchQuery || drawerActiveCount > 0
                            ? 'Try adjusting your filters or search query.'
                            : dpFilter === 'all'
                            ? 'Your booking history will appear here.'
                            : `No ${dpLabel.toLowerCase()} bookings.`}
                        </p>
                        {(searchQuery || drawerActiveCount > 0) && (
                          <button
                            onClick={() => { setSearchQuery(''); setDateFrom(''); setDateTo(''); }}
                            className="mt-3 text-sm text-blue-600 hover:underline"
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    </FadeIn>
                  ) : (
                    <div className="space-y-3">
                      {filteredBookings.map((booking, index) => (
                        <BookingListCard
                          key={booking.id}
                          booking={booking}
                          index={index}
                          isSelected={selectedBooking?.id === booking.id}
                          onClick={() => setSelectedBooking(booking)}
                          activeServiceCount={activeServiceCounts[booking.id] ?? 0}
                          onRaiseService={openServiceForm}
                        />
                      ))}
                    </div>
                  )}
                </div>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};
