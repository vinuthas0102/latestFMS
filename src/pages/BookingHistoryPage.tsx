import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { SummaryStatsCard } from '../components/ui/SummaryStatsCard';
import { FilterDrawer } from '../components/ui/FilterDrawer';
import { ViewSwitcher } from '../components/ui/ViewSwitcher';
import { MandatorySearchBar } from '../components/ui/MandatorySearchBar';
import { DataTable } from '../components/ui/DataTable';
import { ListView, ListViewItem } from '../components/ui/ListView';
import { PhotoLightbox } from '../components/ui/PhotoGallery';
import {
  Calendar, Eye, History, CheckCircle, Clock, XCircle,
  Home, MapPin, ArrowRight, CreditCard, Users,
  Building2, Images, ChevronRight, ChevronLeft, X,
  ExternalLink, Bed, Layers,
} from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { BookingDTO, BookingStatus } from '../types';
import { formatDate } from '../utils/dateHelpers';
import { formatCurrency } from '../utils/formatters';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { FadeIn } from '../components/animations/FadeIn';
import { useViewPreference } from '../hooks/useViewPreference';

const PROPERTY_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&q=80',
  'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&q=80',
  'https://images.unsplash.com/photo-1444201983204-c43cbd584d93?w=400&q=80',
  'https://images.unsplash.com/photo-1455587734955-081b22074882?w=400&q=80',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80',
];

function getPropertyImages(booking: BookingDTO): string[] {
  const imgs = booking.property?.images;
  if (Array.isArray(imgs) && imgs.length > 0) return imgs;
  if (typeof imgs === 'string') {
    try {
      const parsed = JSON.parse(imgs);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { /* ignore */ }
  }
  return [];
}

function getPropertyImage(booking: BookingDTO, idx: number): string {
  const imgs = getPropertyImages(booking);
  if (imgs.length > 0) return imgs[0];
  return PROPERTY_FALLBACK_IMAGES[idx % PROPERTY_FALLBACK_IMAGES.length];
}

function getStatusConfig(status: BookingStatus) {
  switch (status) {
    case 'REQUESTED':    return { label: 'Requested',  bg: 'bg-amber-500',   border: 'border-l-amber-400',   dot: 'bg-amber-400',   badge: 'warning' as const };
    case 'PROVISIONED':  return { label: 'Provisioned', bg: 'bg-blue-500',   border: 'border-l-blue-400',    dot: 'bg-blue-400',    badge: 'info' as const };
    case 'ALLOCATED':    return { label: 'Upcoming',    bg: 'bg-cyan-500',   border: 'border-l-cyan-400',    dot: 'bg-cyan-400',    badge: 'info' as const };
    case 'CHECKED_IN':   return { label: 'Checked In',  bg: 'bg-emerald-500',border: 'border-l-emerald-400', dot: 'bg-emerald-400', badge: 'success' as const };
    case 'CHECKED_OUT':  return { label: 'Completed',   bg: 'bg-green-500',  border: 'border-l-green-400',   dot: 'bg-green-400',   badge: 'success' as const };
    case 'CANCELLED':    return { label: 'Cancelled',   bg: 'bg-red-500',    border: 'border-l-red-400',     dot: 'bg-red-400',     badge: 'error' as const };
    case 'REJECTED':     return { label: 'Rejected',    bg: 'bg-rose-500',   border: 'border-l-rose-400',    dot: 'bg-rose-400',    badge: 'error' as const };
    default:             return { label: status,        bg: 'bg-gray-500',   border: 'border-l-gray-300',    dot: 'bg-gray-400',    badge: 'info' as const };
  }
}

function calcNights(checkIn: string, checkOut: string): number {
  try {
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
  } catch { return 1; }
}

// ─── Booking list card ────────────────────────────────────────────────────────

interface BookingCardItemProps {
  booking: BookingDTO;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

const BookingCardItem: React.FC<BookingCardItemProps> = ({ booking, index, isSelected, onClick }) => {
  const [primaryErr, setPrimaryErr] = useState(false);
  const [thumbErrors, setThumbErrors] = useState<Record<number, boolean>>({});
  const statusCfg = getStatusConfig(booking.status);
  const nights = calcNights(booking.checkInDate, booking.checkOutDate);

  const rawImages = booking.property?.images;
  const images: string[] = Array.isArray(rawImages) ? rawImages : [];
  if (images.length === 0) images.push(PROPERTY_FALLBACK_IMAGES[index % PROPERTY_FALLBACK_IMAGES.length]);
  const primaryImage = images[0];
  const thumbnails = Array.from({ length: 4 }, (_, i) => images[i + 1] || '');
  const extraCount = images.length > 5 ? images.length - 4 : 0;

  return (
    <FadeIn delay={index * 40}>
      <div
        onClick={onClick}
        className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col sm:flex-row border-l-4 ${statusCfg.border} ${isSelected ? 'ring-2 ring-blue-400 ring-offset-1 shadow-lg' : 'border-gray-200 hover:-translate-y-0.5'}`}
      >
        {/* Gallery */}
        <div className="relative flex-shrink-0 sm:w-56 flex flex-col bg-gray-100">
          <div className="relative overflow-hidden" style={{ height: '160px' }}>
            {!primaryErr ? (
              <img src={primaryImage} alt={booking.property?.name || 'Property'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={() => setPrimaryErr(true)} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200"><Building2 size={32} className="text-gray-300" /></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-2 left-2">
              <span className={`${statusCfg.bg} text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shadow-sm`}>{statusCfg.label}</span>
            </div>
            <div className="absolute top-2 right-2">
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-sm">#{booking.bookingNumber}</span>
            </div>
          </div>
          <div className="flex h-12 border-t border-gray-200/60">
            {thumbnails.map((src, i) => {
              const isLast = i === 3;
              const showViewAll = isLast && extraCount > 0;
              return (
                <div key={i} className="relative flex-1 overflow-hidden border-r border-gray-200/60 last:border-r-0 bg-gray-100">
                  {src && !thumbErrors[i] ? (
                    <img src={src} alt="" className="w-full h-full object-cover brightness-90 group-hover:brightness-100 transition-all" onError={() => setThumbErrors(p => ({ ...p, [i]: true }))} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200"><Images size={11} className="text-gray-400" /></div>
                  )}
                  {showViewAll && (
                    <div className="absolute inset-0 bg-slate-900/72 flex items-center justify-center">
                      <span className="text-white text-[8px] font-black">+{extraCount}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main details */}
        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-0.5 truncate flex items-center gap-1.5">
              <Home size={12} className="text-gray-400 flex-shrink-0" />
              {booking.property?.name || 'Property'}
            </h3>
            {booking.property?.address && (
              <div className="flex items-center gap-1 mb-2 text-xs text-gray-400">
                <MapPin size={10} className="flex-shrink-0" /><span className="truncate">{booking.property.address}</span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-1.5">
              <div className="bg-gray-50 rounded-lg p-1.5 border border-gray-100">
                <p className="text-[9px] text-gray-400 uppercase tracking-wide font-semibold">Check-in</p>
                <p className="text-xs font-bold text-gray-800 mt-0.5">{formatDate(booking.checkInDate)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-1.5 border border-gray-100">
                <p className="text-[9px] text-gray-400 uppercase tracking-wide font-semibold">Check-out</p>
                <p className="text-xs font-bold text-gray-800 mt-0.5">{formatDate(booking.checkOutDate)}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-1.5 border border-blue-100">
                <p className="text-[9px] text-blue-400 uppercase tracking-wide font-semibold">Nights</p>
                <p className="text-xs font-bold text-blue-700 mt-0.5">{nights}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500 flex-wrap">
            {booking.roomType?.name && <span className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded-full"><Bed size={10} />{booking.roomType.name}</span>}
            {booking.quantity > 0 && <span className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded-full"><Users size={10} />{booking.quantity}</span>}
          </div>
        </div>

        {/* Amount */}
        <div className="flex flex-col justify-between p-3 sm:border-l border-gray-100 sm:w-32 flex-shrink-0 bg-gray-50/40" onClick={e => e.stopPropagation()}>
          <div className="flex flex-col items-end gap-0.5">
            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold">Total</p>
            <p className="text-base font-black text-gray-900 leading-none">{formatCurrency(booking.totalAmount)}</p>
            {booking.paymentStatus === 'COMPLETED' && (
              <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-1 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200"><CheckCircle size={8} />Paid</span>
            )}
            {booking.balanceAmount > 0 && booking.paidAmount === 0 && (
              <span className="text-[9px] text-amber-600 font-semibold flex items-center gap-0.5 mt-1 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200"><CreditCard size={8} />Pending</span>
            )}
          </div>
        </div>
      </div>
    </FadeIn>
  );
};

// ─── Right Detail Panel ───────────────────────────────────────────────────────

interface BookingDetailPanelProps {
  booking: BookingDTO;
  onClose: () => void;
  onNavigate: (id: string) => void;
}

const BookingDetailPanel: React.FC<BookingDetailPanelProps> = ({ booking, onClose, onNavigate }) => {
  const statusCfg = getStatusConfig(booking.status);
  const nights = calcNights(booking.checkInDate, booking.checkOutDate);
  const images = getPropertyImages(booking);
  const hasFallback = images.length === 0;
  const displayImages = hasFallback ? [PROPERTY_FALLBACK_IMAGES[0]] : images;

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [imgErr, setImgErr] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div className="flex-none sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="min-w-0 flex items-center gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold text-gray-700">#{booking.bookingNumber}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${statusCfg.bg}`}>{statusCfg.label}</span>
            </div>
            <div className="text-xs text-gray-500 truncate mt-0.5">{booking.property?.name || 'Booking Detail'}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => onNavigate(booking.id)}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-all border border-blue-200"
          >
            <ExternalLink size={11} /> Full Page
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Image tiles */}
        <div className="px-4 pt-4 pb-3">
          {!hasFallback ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {displayImages.slice(0, 5).map((img, i) => (
                <button
                  key={i}
                  onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                  className="relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group"
                >
                  <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                  {i === 4 && displayImages.length > 5 && (
                    <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-0.5">
                      <Images size={12} className="text-white" />
                      <span className="text-white text-xs font-bold">+{displayImages.length - 5}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="h-20 rounded-xl bg-gray-50 border border-gray-200 relative overflow-hidden">
              {!imgErr ? (
                <img src={PROPERTY_FALLBACK_IMAGES[0]} alt="" className="w-full h-full object-cover opacity-60" onError={() => setImgErr(true)} />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Building2 size={28} className="text-gray-300" /></div>
              )}
            </div>
          )}
        </div>

        <div className="px-4 pb-4 space-y-4">
          {/* Property info */}
          {booking.property && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Property</div>
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-3 space-y-1.5">
                <div className="font-bold text-gray-900 text-sm">{booking.property.name}</div>
                {booking.property.address && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin size={11} className="flex-shrink-0" />{booking.property.address}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {booking.roomType?.name && <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full"><Bed size={10} />{booking.roomType.name}</span>}
                  {booking.quantity > 0 && <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full"><Layers size={10} />{booking.quantity} room{booking.quantity !== 1 ? 's' : ''}</span>}
                </div>
              </div>
            </div>
          )}

          {/* Stay details */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Stay Details</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Check-in', value: formatDate(booking.checkInDate), cls: 'bg-gray-50 border-gray-100' },
                { label: 'Check-out', value: formatDate(booking.checkOutDate), cls: 'bg-gray-50 border-gray-100' },
                { label: 'Duration', value: `${nights} night${nights !== 1 ? 's' : ''}`, cls: 'bg-blue-50 border-blue-100' },
              ].map(item => (
                <div key={item.label} className={`${item.cls} rounded-xl p-2.5 border`}>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">{item.label}</div>
                  <div className="text-xs font-bold text-gray-800">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Guest info */}
          {booking.guestDetails && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Guest</div>
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-3 grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: 'Name', value: booking.guestDetails.fullName },
                  { label: 'Email', value: booking.guestDetails.email },
                  { label: 'Phone', value: booking.guestDetails.phone },
                  { label: 'Guests', value: booking.guestDetails.numberOfGuests ? `${booking.guestDetails.numberOfGuests}` : null },
                ].filter(i => i.value).map(item => (
                  <div key={item.label} className={item.label === 'Email' || item.label === 'Name' ? 'col-span-2' : ''}>
                    <div className="text-gray-400 mb-0.5">{item.label}</div>
                    <div className="font-semibold text-gray-800 truncate">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial summary */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Payment</div>
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-3 space-y-2">
              <div className="flex items-end justify-between">
                <span className="text-xs text-gray-500">Total Amount</span>
                <span className="text-lg font-black text-gray-900">{formatCurrency(booking.totalAmount)}</span>
              </div>
              {booking.paidAmount > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Paid</span>
                  <span className="font-semibold text-emerald-700">{formatCurrency(booking.paidAmount)}</span>
                </div>
              )}
              {booking.balanceAmount > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Balance Due</span>
                  <span className="font-semibold text-amber-700">{formatCurrency(booking.balanceAmount)}</span>
                </div>
              )}
              <div className="pt-1 border-t border-gray-200">
                <Badge variant={booking.paymentStatus === 'COMPLETED' ? 'success' : 'warning'} className="text-xs">
                  {booking.paymentStatus === 'COMPLETED' ? 'Paid in Full' : 'Payment Pending'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Special requirements */}
          {booking.specialRequirements && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Special Requirements</div>
              <div className="text-xs text-gray-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">{booking.specialRequirements}</div>
            </div>
          )}

          {/* Rejection reason */}
          {booking.rejectionReason && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              <div className="text-xs font-semibold text-red-700 mb-1">Rejection Reason</div>
              <div className="text-xs text-red-600">{booking.rejectionReason}</div>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={() => onNavigate(booking.id)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Eye size={14} /> View Full Details <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {lightboxOpen && (
        <PhotoLightbox images={displayImages} initialIndex={lightboxIndex} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

export const BookingHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const addToast = useUIStore((state) => state.addToast);
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | string[]>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewMode, setViewMode] = useViewPreference('bookingHistoryView', 'list');
  const [selectedBooking, setSelectedBooking] = useState<BookingDTO | null>(null);

  // Resizable split panel
  const containerRef = useRef<HTMLDivElement>(null);
  const [splitPct, setSplitPct] = useState(() => {
    try { return Number(localStorage.getItem('bhSplit') || '38'); } catch { return 38; }
  });
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const startX = e.clientX;
    const startPct = splitPct;
    const containerWidth = containerRef.current?.offsetWidth ?? 800;
    const onMove = (me: MouseEvent) => {
      const delta = ((me.clientX - startX) / containerWidth) * 100;
      const next = Math.max(25, Math.min(70, startPct + delta));
      setSplitPct(next);
    };
    const onUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      try { localStorage.setItem('bhSplit', String(Math.round(splitPct))); } catch {}
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  useEffect(() => {
    loadBookings();
    const status = searchParams.get('status');
    if (status === 'upcoming') setStatusFilter(['ALLOCATED', 'PROVISIONED']);
    else if (status === 'cancelled') setStatusFilter(['CANCELLED', 'REJECTED']);
    else if (status === 'completed') setStatusFilter('CHECKED_OUT');
  }, []);

  useEffect(() => { filterBookings(); }, [bookings, statusFilter, searchQuery, dateFrom, dateTo]);

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

  const filterBookings = () => {
    let filtered = bookings;
    if (statusFilter !== 'all') {
      if (Array.isArray(statusFilter)) filtered = filtered.filter(b => statusFilter.includes(b.status));
      else filtered = filtered.filter(b => b.status === statusFilter);
    }
    if (searchQuery.trim()) {
      filtered = filtered.filter(b =>
        b.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.property?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (dateFrom) filtered = filtered.filter(b => new Date(b.checkInDate) >= new Date(dateFrom));
    if (dateTo) filtered = filtered.filter(b => new Date(b.checkOutDate) <= new Date(dateTo));
    setFilteredBookings(filtered);
  };

  const getStatusVariant = (status: BookingStatus): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'CHECKED_IN': case 'CHECKED_OUT': return 'success';
      case 'REQUESTED': case 'PROVISIONED': return 'warning';
      case 'CANCELLED': case 'REJECTED': return 'error';
      default: return 'info';
    }
  };

  const stats = {
    total: bookings.length,
    upcoming: bookings.filter(b => ['ALLOCATED', 'PROVISIONED'].includes(b.status)).length,
    checkedIn: bookings.filter(b => b.status === 'CHECKED_IN').length,
    completed: bookings.filter(b => b.status === 'CHECKED_OUT').length,
    cancelled: bookings.filter(b => ['CANCELLED', 'REJECTED'].includes(b.status)).length,
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const cancellationRate = stats.total > 0 ? Math.round((stats.cancelled / stats.total) * 100) : 0;
  const handleClearFilters = () => { setStatusFilter('all'); setSearchQuery(''); setDateFrom(''); setDateTo(''); };
  const drawerActiveCount = (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);
  const propertyNames = Array.from(new Set(bookings.map(b => b.property?.name).filter(Boolean))) as string[];
  const activeFilterCount = (statusFilter !== 'all' && statusFilter.length > 0 ? 1 : 0) + (searchQuery ? 1 : 0) + drawerActiveCount;

  // Status filter label for breadcrumb
  const statusLabel = (() => {
    if (statusFilter === 'all') return null;
    if (Array.isArray(statusFilter)) {
      if (statusFilter.includes('ALLOCATED')) return 'Upcoming';
      if (statusFilter.includes('CANCELLED')) return 'Cancelled';
      return null;
    }
    if (statusFilter === 'CHECKED_IN') return 'Checked In';
    return getStatusConfig(statusFilter as BookingStatus).label;
  })();

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50/20">
      {/* Frozen header */}
      <div className="flex-none bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm z-20">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2 flex-wrap">
            <button onClick={() => navigate('/dashboard')} className="hover:text-blue-600 transition-colors"><Home size={11} /></button>
            <ChevronRight size={10} />
            <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-blue-600 transition-colors">My Workspace</button>
            <ChevronRight size={10} />
            <button onClick={() => { setSelectedBooking(null); setStatusFilter('all'); }} className="text-gray-600 font-medium hover:text-blue-600 transition-colors">
              My Bookings
            </button>
            {statusLabel && (
              <>
                <ChevronRight size={10} />
                <button onClick={() => setSelectedBooking(null)} className="text-gray-700 font-medium hover:text-blue-600 transition-colors">{statusLabel}</button>
              </>
            )}
            {selectedBooking && (
              <>
                <ChevronRight size={10} />
                <span className="font-mono text-gray-700 font-medium truncate max-w-[140px]">#{selectedBooking.bookingNumber}</span>
              </>
            )}
          </div>

          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                <History className="w-4 h-4 text-white" />
              </div>
              Booking History
            </h1>
            <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />
          </div>

          <MandatorySearchBar
            fields={[
              {
                key: 'search', label: 'Search', type: 'text',
                placeholder: 'Booking number or property...', value: searchQuery, onChange: setSearchQuery,
                icon: <History size={14} />,
              },
              {
                key: 'status', label: 'Status', type: 'chips',
                value: Array.isArray(statusFilter)
                  ? (statusFilter.includes('ALLOCATED') ? 'upcoming' : statusFilter.includes('CANCELLED') ? 'cancelled' : 'all')
                  : statusFilter === 'CHECKED_OUT' ? 'completed' : statusFilter === 'REQUESTED' ? 'REQUESTED' : statusFilter,
                onChange: (v) => {
                  if (v === 'all') setStatusFilter('all');
                  else if (v === 'upcoming') setStatusFilter(['ALLOCATED', 'PROVISIONED']);
                  else if (v === 'completed') setStatusFilter('CHECKED_OUT');
                  else if (v === 'cancelled') setStatusFilter(['CANCELLED', 'REJECTED']);
                  else setStatusFilter(v);
                  setSelectedBooking(null);
                },
                options: [
                  { value: 'all', label: 'All' },
                  { value: 'upcoming', label: 'Upcoming' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                  { value: 'REQUESTED', label: 'Requested' },
                ],
              },
            ]}
            filterCount={drawerActiveCount}
            onFilterOpen={() => setIsFilterOpen(true)}
            className="mb-3"
          />

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <SummaryStatsCard label="My Bookings" value={stats.total} icon={History} gradient="bg-gradient-to-br from-blue-600 to-teal-500" onClick={() => { setStatusFilter('all'); setSelectedBooking(null); }} isActive={statusFilter === 'all'} delay={100} subtitle="All time" secondaryValue={stats.upcoming} secondaryLabel="Active" />
            <SummaryStatsCard label="Upcoming" value={stats.upcoming} icon={Calendar} gradient="bg-gradient-to-br from-sky-500 to-blue-600" onClick={() => { setStatusFilter(['ALLOCATED', 'PROVISIONED']); setSelectedBooking(null); }} isActive={Array.isArray(statusFilter) && statusFilter.includes('ALLOCATED')} delay={130} subtitle="Confirmed & allocated" secondaryValue={bookings.filter(b => b.status === 'PROVISIONED').length} secondaryLabel="Pending" />
            <SummaryStatsCard label="Checked In" value={stats.checkedIn} icon={CheckCircle} gradient="bg-gradient-to-br from-amber-500 to-orange-500" onClick={() => { setStatusFilter('CHECKED_IN'); setSelectedBooking(null); }} isActive={statusFilter === 'CHECKED_IN'} delay={160} subtitle="Currently staying" />
            <SummaryStatsCard label="Completed" value={stats.completed} icon={CheckCircle} gradient="bg-gradient-to-br from-emerald-500 to-cyan-500" onClick={() => { setStatusFilter('CHECKED_OUT'); setSelectedBooking(null); }} isActive={statusFilter === 'CHECKED_OUT'} delay={190} subtitle={`${completionRate}% completion`} trend={completionRate > 50 ? completionRate - 50 : -(50 - completionRate)} />
            <SummaryStatsCard label="Cancelled" value={stats.cancelled} icon={XCircle} gradient="bg-gradient-to-br from-rose-500 to-pink-500" onClick={() => { setStatusFilter(['CANCELLED', 'REJECTED']); setSelectedBooking(null); }} isActive={Array.isArray(statusFilter) && statusFilter.includes('CANCELLED')} delay={220} subtitle={`${cancellationRate}% of total`} secondaryValue={bookings.filter(b => b.status === 'REJECTED').length} secondaryLabel="Rejected" />
          </div>
        </div>
      </div>

      {/* Advanced filter drawer */}
      <FilterDrawer isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Advanced Filters" activeFilterCount={drawerActiveCount} onClearAll={() => { setDateFrom(''); setDateTo(''); }}>
        <div className="space-y-6">
          {propertyNames.length > 1 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Property</label>
              <select value={typeof searchQuery === 'string' && propertyNames.some(n => searchQuery === n) ? searchQuery : ''} onChange={e => setSearchQuery(e.target.value)} className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all">
                <option value="">All Properties</option>
                {propertyNames.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Check-in From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Check-out To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} min={dateFrom || undefined} className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
          </div>
        </div>
      </FilterDrawer>

      {/* Split-screen data area */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 h-full py-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 animate-pulse flex h-28 overflow-hidden">
                  <div className="w-40 bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 p-4 space-y-3"><div className="h-4 bg-gray-200 rounded w-1/3" /><div className="h-3 bg-gray-200 rounded w-1/2" /></div>
                </div>
              ))}
            </div>
          ) : (
            <div
              ref={containerRef}
              className="flex gap-0 h-full"
              style={{ userSelect: isDragging ? 'none' : undefined }}
            >
              {/* Left panel */}
              <div
                style={{ width: selectedBooking ? `${splitPct}%` : '100%' }}
                className="flex-none overflow-y-auto transition-[width] duration-200"
              >
                {filteredBookings.length === 0 ? (
                  <FadeIn delay={200}>
                    <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center shadow-sm">
                      <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600 font-semibold mb-1">No bookings found</p>
                      <p className="text-sm text-gray-400">Try adjusting your filters or search query.</p>
                      {activeFilterCount > 0 && <button onClick={handleClearFilters} className="mt-3 text-sm text-blue-600 hover:underline">Clear filters</button>}
                    </div>
                  </FadeIn>
                ) : viewMode === 'card' ? (
                  <div className="space-y-3 pr-2">
                    {filteredBookings.map((booking, index) => (
                      <BookingCardItem
                        key={booking.id}
                        booking={booking}
                        index={index}
                        isSelected={selectedBooking?.id === booking.id}
                        onClick={() => setSelectedBooking(booking)}
                      />
                    ))}
                  </div>
                ) : viewMode === 'table' ? (
                  <FadeIn delay={300}>
                    <DataTable
                      columns={[
                        { key: 'bookingNumber', label: 'Booking #', sortable: true, width: '15%' },
                        { key: 'property', label: 'Property', sortable: false, render: b => <div className="flex items-center gap-2"><Building2 size={13} className="text-gray-400 flex-shrink-0" /><span className="truncate max-w-[160px]">{b.property?.name || 'N/A'}</span></div> },
                        { key: 'checkInDate', label: 'Check-in', sortable: true, render: b => formatDate(b.checkInDate) },
                        { key: 'checkOutDate', label: 'Check-out', sortable: true, render: b => formatDate(b.checkOutDate) },
                        { key: 'roomType', label: 'Room Type', sortable: false, render: b => b.roomType?.name || 'N/A' },
                        { key: 'status', label: 'Status', sortable: true, render: b => <Badge variant={getStatusVariant(b.status)} className="text-xs">{getStatusConfig(b.status).label}</Badge> },
                        { key: 'totalAmount', label: 'Total', sortable: true, render: b => formatCurrency(b.totalAmount) },
                        {
                          key: 'actions', label: '', sortable: false, width: '8%',
                          render: b => (
                            <button className={`p-1.5 rounded-lg border transition-colors ${selectedBooking?.id === b.id ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200'}`} onClick={e => { e.stopPropagation(); setSelectedBooking(b); }}>
                              <Eye size={13} />
                            </button>
                          ),
                        },
                      ]}
                      data={filteredBookings}
                      keyExtractor={b => b.id}
                      onRowClick={b => setSelectedBooking(b)}
                      emptyMessage="No bookings found"
                    />
                  </FadeIn>
                ) : (
                  <FadeIn delay={300}>
                    <ListView emptyMessage="No bookings found">
                      {filteredBookings.map(booking => (
                        <div
                          key={booking.id}
                          onClick={() => setSelectedBooking(booking)}
                          className={`cursor-pointer rounded-xl transition-all ${selectedBooking?.id === booking.id ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
                        >
                          <ListViewItem
                            icon={<Calendar size={18} />}
                            title={`#${booking.bookingNumber}`}
                            subtitle={`${booking.property?.name ?? ''} · ${formatDate(booking.checkInDate)} → ${formatDate(booking.checkOutDate)}`}
                            badge={<Badge variant={getStatusVariant(booking.status)} className="text-xs">{getStatusConfig(booking.status).label}</Badge>}
                            rightContent={
                              <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">{formatCurrency(booking.totalAmount)}</p>
                                <p className="text-xs text-gray-500">{booking.roomType?.name}</p>
                              </div>
                            }
                            onClick={() => setSelectedBooking(booking)}
                          />
                        </div>
                      ))}
                    </ListView>
                  </FadeIn>
                )}
              </div>

              {/* Drag handle */}
              {selectedBooking && (
                <div
                  onMouseDown={handleDragStart}
                  className="flex-none w-1.5 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors flex items-center justify-center group relative mx-1"
                >
                  <div className="absolute inset-y-0 -left-1 -right-1" />
                  <div className="w-0.5 h-8 bg-gray-400 group-hover:bg-blue-500 rounded-full transition-colors" />
                </div>
              )}

              {/* Right panel */}
              {selectedBooking && (
                <div
                  style={{ width: `${100 - splitPct - 1}%` }}
                  className="flex-none bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
                >
                  {/* Nudge controls */}
                  <div className="absolute right-4 top-1 flex gap-1 z-20 hidden lg:flex">
                    <button onClick={() => setSplitPct(p => Math.max(25, p - 5))} className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="Expand right panel">
                      <ChevronLeft size={14} />
                    </button>
                    <button onClick={() => setSplitPct(p => Math.min(70, p + 5))} className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="Expand left panel">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                  <BookingDetailPanel
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                    onNavigate={(id) => navigate(`/bookings/${id}`)}
                  />
                </div>
              )}

              {/* Placeholder when nothing selected */}
              {!selectedBooking && filteredBookings.length > 0 && (
                <div className="hidden lg:flex flex-col items-center justify-center text-center p-8 w-[62%] ml-2 bg-gray-50/60 rounded-xl border border-gray-200">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-3">
                    <History size={24} className="text-gray-300" />
                  </div>
                  <div className="text-sm font-semibold text-gray-400 mb-1">Select a booking</div>
                  <div className="text-xs text-gray-300">Click any booking on the left to view its details here</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
