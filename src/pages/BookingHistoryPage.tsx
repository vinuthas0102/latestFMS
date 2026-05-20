import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar, History, CheckCircle, XCircle, Home, ChevronRight,
  Building2, Eye, ChevronLeft, Search, SlidersHorizontal,
  CreditCard, MapPin, X, Download,
  ChevronDown, ChevronUp, FileText, Send, KeyRound, LogOut,
  Ban, Ruler, Bed, Layers, Images, Plus, Compass,
  Zap, Droplets, LayoutDashboard, MoreVertical, AlertTriangle,
  Wrench, RefreshCw, HelpCircle, Loader2, Receipt, Clock,
  Pencil, ShieldCheck, UserPlus, Users, CalendarCheck, ArrowRightLeft,
  BadgeCheck, DoorOpen, Banknote,
} from 'lucide-react';
import { BookingServiceType, BookingServiceRequestDTO } from '../types';
import { bookingService } from '../services/bookingService';
import { getProperties } from '../services/property/corePropertyService';
import { BookingDTO, BookingStatus, PropertyDTO } from '../types';
import { formatDate } from '../utils/dateHelpers';
import { formatCurrency } from '../utils/formatters';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { usePropertyStore } from '../stores/propertyStore';
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
import { paymentService, ManualPaymentMode } from '../services/paymentService';

// ─── Types ────────────────────────────────────────────────────────────────────

type DpKey =
  | 'all' | 'upcoming' | 'checkedIn' | 'completed' | 'cancelled' | 'availableProperties'
  | 'draft' | 'submitted' | 'allotted' | 'occupied' | 'vacated' | 'declined'
  | 'awaitingPayment';

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
  REQUESTED:        'bg-amber-50 text-amber-700 border border-amber-200',
  PROVISIONED:      'bg-blue-50 text-blue-700 border border-blue-200',
  AWAITING_PAYMENT: 'bg-orange-50 text-orange-700 border border-orange-200',
  ALLOCATED:        'bg-cyan-50 text-cyan-700 border border-cyan-200',
  CHECKED_IN:       'bg-emerald-50 text-emerald-700 border border-emerald-200',
  CHECKED_OUT:      'bg-green-50 text-green-700 border border-green-200',
  CANCELLED:        'bg-red-50 text-red-700 border border-red-200',
  REJECTED:         'bg-rose-50 text-rose-700 border border-rose-200',
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

const PAYMENT_ACTION_STATUSES: BookingStatus[] = [
  'REQUESTED', 'PROVISIONED', 'AWAITING_PAYMENT', 'ALLOCATED',
];

const MODIFIABLE_STATUSES: BookingStatus[] = ['REQUESTED', 'PROVISIONED', 'AWAITING_PAYMENT', 'ALLOCATED'];

// ─── Service sub-card colors ──────────────────────────────────────────────────

const SVC_ACCENT: Record<string, string> = {
  GRIEVANCE:            'bg-rose-400',
  MAINTENANCE:          'bg-orange-400',
  EXTENSION:            'bg-blue-400',
  CANCELLATION_REQUEST: 'bg-red-400',
  GENERAL:              'bg-slate-400',
};

const SVC_BG: Record<string, string> = {
  GRIEVANCE:            'bg-rose-50',
  MAINTENANCE:          'bg-orange-50',
  EXTENSION:            'bg-blue-50',
  CANCELLATION_REQUEST: 'bg-red-50',
  GENERAL:              'bg-slate-50',
};

const SVC_STATUS_CLS: Record<string, string> = {
  OPEN:        'bg-amber-100 text-amber-700 border-amber-200',
  IN_PROGRESS: 'bg-sky-100 text-sky-700 border-sky-200',
  RESOLVED:    'bg-emerald-100 text-emerald-700 border-emerald-200',
  CLOSED:      'bg-gray-100 text-gray-500 border-gray-200',
};

const SVC_SHORT_LABEL: Record<string, string> = {
  GRIEVANCE:            'Grievance',
  MAINTENANCE:          'Maint',
  EXTENSION:            'Ext',
  CANCELLATION_REQUEST: 'Cancel',
  GENERAL:              'General',
};

const SVC_CHIP_CLS: Record<string, string> = {
  GRIEVANCE:            'bg-rose-50 text-rose-600 border-rose-200',
  MAINTENANCE:          'bg-orange-50 text-orange-600 border-orange-200',
  EXTENSION:            'bg-blue-50 text-blue-600 border-blue-200',
  CANCELLATION_REQUEST: 'bg-red-50 text-red-600 border-red-200',
  GENERAL:              'bg-slate-50 text-slate-600 border-slate-200',
};

type ModifyMode = 'full' | 'extend' | 'room' | 'guest' | 'price' | 'adhoc';

const MODIFY_MODE_LABELS: Record<ModifyMode, string> = {
  full:   'Modify Booking',
  extend: 'Extend Stay',
  room:   'Change Room',
  guest:  'Change Guest Info',
  price:  'Change Pricing',
  adhoc:  'Ad-hoc Edit',
};

const SVC_TYPE_ICON: Record<string, React.FC<{ size?: number; className?: string }>> = {
  GRIEVANCE:            AlertTriangle,
  MAINTENANCE:          Wrench,
  EXTENSION:            RefreshCw,
  CANCELLATION_REQUEST: Ban,
  GENERAL:              HelpCircle,
};

const SVC_URGENCY_CLS: Record<string, string> = {
  HIGH:   'bg-red-100 text-red-700 border-red-200',
  MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
  LOW:    'bg-gray-100 text-gray-600 border-gray-200',
};

const BookingListCard: React.FC<{
  booking: BookingDTO;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  activeServiceCount?: number;
  services?: BookingServiceRequestDTO[];
  onRaiseService: (booking: BookingDTO, type: BookingServiceType) => void;
  onPayNow: (booking: BookingDTO) => void;
  onRecordManualPayment: (booking: BookingDTO) => void;
  onCheckout: (booking: BookingDTO) => void;
  onModify: (booking: BookingDTO, mode?: ModifyMode) => void;
  onEarmark: (booking: BookingDTO) => void;
  onProcessCheckIn: (booking: BookingDTO) => void;
  isManager?: boolean;
  isGovtOfficial?: boolean;
  isUnderMaintenance?: boolean;
}> = ({ booking, index, isSelected, onClick, activeServiceCount = 0, services = [], onRaiseService, onPayNow, onRecordManualPayment, onCheckout, onModify, onEarmark, onProcessCheckIn, isManager, isGovtOfficial, isUnderMaintenance }) => {
  const [thumbErr, setThumbErr] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number; openUp: boolean } | null>(null);
  const [svcExpanded, setSvcExpanded] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const statusCfg = getBookingStatusConfig(booking.status);
  const nights = calcNights(booking.checkInDate, booking.checkOutDate);
  const thumbSrc = getPropertyImage(booking, index);
  const accentColor = BOOKING_STATUS_ACCENT[booking.status] ?? 'bg-gray-300';
  const isCheckedIn = booking.status === 'CHECKED_IN';
  const isVacated = booking.status === 'CHECKED_OUT';
  const isRequested = booking.status === 'REQUESTED';
  const isAllocated = booking.status === 'ALLOCATED';
  const canCheckout = isCheckedIn && (isManager || isGovtOfficial);
  const canRaiseService = !['CANCELLED', 'REJECTED'].includes(booking.status);
  const vacatedServiceItems = ACTION_MENU_ITEMS.filter(i => i.type === 'MAINTENANCE');
  const menuServiceItems = isVacated ? vacatedServiceItems : ACTION_MENU_ITEMS;
  const canPay = (booking.balanceAmount > 0) && PAYMENT_ACTION_STATUSES.includes(booking.status as BookingStatus);
  const isPrivileged = isManager || isGovtOfficial;
  const canModify = isPrivileged && MODIFIABLE_STATUSES.includes(booking.status as BookingStatus);
  const canEarmark = isManager && isRequested;
  const canProcessCheckIn = isManager && isAllocated;
  const canExtendStay = isManager && isCheckedIn;
  const canAdHocEdit = isManager && !['CANCELLED', 'REJECTED'].includes(booking.status);

  const hasAnyAction = canPay || canCheckout || canEarmark || canProcessCheckIn ||
    canExtendStay || canModify || (canAdHocEdit && isCheckedIn) ||
    (canRaiseService && menuServiceItems.length > 0);

  // Distinct service types present (for chips on toggle button)
  const uniqueSvcTypes = Array.from(new Set(services.map(s => s.serviceType))).slice(0, 3);
  const activeSvcCount = services.filter(s => s.requestStatus !== 'CLOSED').length;

  const openMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const extraItems = (canPay ? 1 : 0) + (canPay && isManager ? 1 : 0) + (canCheckout ? 1 : 0) + (canModify ? 1 : 0);
    const menuHeight = (menuServiceItems.length + extraItems) * 36 + 56;
    const openUp = rect.bottom + menuHeight > window.innerHeight;
    setMenuCoords({
      top: openUp ? rect.top - menuHeight - 4 : rect.bottom + 4,
      left: rect.right - 192,
      openUp,
    });
    setMenuOpen(v => !v);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    const closeOnScroll = () => setMenuOpen(false);
    document.addEventListener('mousedown', close);
    window.addEventListener('scroll', closeOnScroll, true);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', closeOnScroll, true);
    };
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
      <div>
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
              <div className="flex items-center gap-1">
                {isUnderMaintenance && isManager && (
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-300 flex items-center gap-1">
                    <Wrench size={9} />Under Maintenance
                  </span>
                )}
                <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_BADGE_CLS[booking.status] ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                  {statusCfg.label}
                </span>
              </div>
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
            <div className="mt-auto flex items-center gap-1 pt-0.5 border-t border-gray-100 min-h-0">
              <div className="flex items-center gap-1 min-w-0 flex-1">
                {services.length > 0 && (
                  <button
                    onClick={e => { e.stopPropagation(); setSvcExpanded(v => !v); }}
                    className={`shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border transition-colors whitespace-nowrap ${
                      svcExpanded
                        ? 'bg-teal-50 text-teal-700 border-teal-300'
                        : 'bg-white text-teal-700 border-teal-300 hover:bg-teal-50'
                    }`}
                  >
                    <Wrench size={9} className="shrink-0" />
                    {activeSvcCount} svc{activeSvcCount !== 1 ? 's' : ''}
                    {uniqueSvcTypes.map(type => (
                      <span key={type} className={`text-[9px] font-semibold px-1.5 py-0 rounded border ${SVC_CHIP_CLS[type] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {SVC_SHORT_LABEL[type] ?? type}
                      </span>
                    ))}
                    {svcExpanded ? <ChevronUp size={10} className="shrink-0" /> : <ChevronDown size={10} className="shrink-0" />}
                  </button>
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
                  <span className="text-[9px] text-gray-400 flex items-center gap-0.5 shrink-0 whitespace-nowrap truncate max-w-[160px]">
                    <MapPin size={8} className="shrink-0" />{booking.property.address}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                {/* Action menu */}
                {hasAnyAction && (
                  <>
                    <button
                      ref={btnRef}
                      onClick={openMenu}
                      className={`p-1 rounded-lg border transition-colors ${
                        menuOpen
                          ? 'bg-blue-50 border-blue-300 text-blue-600'
                          : 'border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200'
                      }`}
                      title="Actions"
                    >
                      <MoreVertical size={12} />
                    </button>
                    {menuOpen && menuCoords && createPortal(
                      <div
                        ref={dropdownRef}
                        style={{ position: 'fixed', top: menuCoords.top, left: menuCoords.left, width: 224, zIndex: 9999 }}
                        className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden py-1"
                        onClick={e => e.stopPropagation()}
                      >
                        {/* ── Booking Management ── */}
                        {(canEarmark || canProcessCheckIn || canExtendStay || canModify || canAdHocEdit) && (
                          <>
                            <div className="px-3 py-1.5 border-b border-gray-100">
                              <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Booking Management</span>
                            </div>
                            {canEarmark && (
                              <button
                                onClick={e => { e.stopPropagation(); setMenuOpen(false); onEarmark(booking); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-sky-700 hover:bg-sky-50 transition-colors text-left"
                              >
                                <ShieldCheck size={13} className="text-sky-500" />
                                Earmark / Provision Room
                              </button>
                            )}
                            {canProcessCheckIn && (
                              <button
                                onClick={e => { e.stopPropagation(); setMenuOpen(false); onProcessCheckIn(booking); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors text-left"
                              >
                                <DoorOpen size={13} className="text-emerald-500" />
                                Process Check-in
                              </button>
                            )}
                            {canExtendStay && (
                              <button
                                onClick={e => { e.stopPropagation(); setMenuOpen(false); onModify(booking, 'extend'); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-teal-700 hover:bg-teal-50 transition-colors text-left"
                              >
                                <CalendarCheck size={13} className="text-teal-500" />
                                Extend Stay
                              </button>
                            )}
                            {canModify && (
                              <button
                                onClick={e => { e.stopPropagation(); setMenuOpen(false); onModify(booking, 'full'); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors text-left"
                              >
                                <Pencil size={13} className="text-blue-500" />
                                Modify Booking
                              </button>
                            )}
                            {canAdHocEdit && !canModify && isCheckedIn && (
                              <button
                                onClick={e => { e.stopPropagation(); setMenuOpen(false); onModify(booking, 'adhoc'); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-violet-700 hover:bg-violet-50 transition-colors text-left"
                              >
                                <ArrowRightLeft size={13} className="text-violet-500" />
                                Ad-hoc Edit
                              </button>
                            )}
                            <div className="border-t border-gray-100 my-1" />
                          </>
                        )}

                        {/* ── Payment ── */}
                        {canPay && (
                          <>
                            <div className="px-3 py-1.5 border-b border-gray-100">
                              <span className="text-[9px] font-bold text-orange-500 uppercase tracking-widest">Payment</span>
                            </div>
                            <button
                              onClick={e => { e.stopPropagation(); setMenuOpen(false); onPayNow(booking); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-orange-700 hover:bg-orange-50 transition-colors text-left"
                            >
                              <CreditCard size={13} className="text-orange-500" />
                              Pay Online — ₹{booking.balanceAmount.toLocaleString('en-IN')}
                            </button>
                            {isManager && (
                              <button
                                onClick={e => { e.stopPropagation(); setMenuOpen(false); onRecordManualPayment(booking); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-teal-700 hover:bg-teal-50 transition-colors text-left"
                              >
                                <Receipt size={13} className="text-teal-500" />
                                Record Manual Payment
                              </button>
                            )}
                            <div className="border-t border-gray-100 my-1" />
                          </>
                        )}

                        {/* ── Checkout ── */}
                        {canCheckout && (
                          <>
                            <div className="px-3 py-1.5 border-b border-gray-100">
                              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Checkout</span>
                            </div>
                            <button
                              onClick={e => { e.stopPropagation(); setMenuOpen(false); onCheckout(booking); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors text-left"
                            >
                              <LogOut size={13} className="text-emerald-600" />
                              Complete Checkout
                            </button>
                            <div className="border-t border-gray-100 my-1" />
                          </>
                        )}

                        {/* ── Raise Service ── */}
                        <div className="px-3 py-1.5 border-b border-gray-100">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                            {isVacated ? 'Services' : 'Raise Service'}
                          </span>
                        </div>
                        {menuServiceItems.map(({ type, label, Icon, color }) => (
                          <button
                            key={type}
                            onClick={e => { e.stopPropagation(); setMenuOpen(false); onRaiseService(booking, type); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left"
                          >
                            <Icon size={13} className={color} />
                            {label}
                          </button>
                        ))}
                      </div>,
                      document.body
                    )}
                  </>
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

        {/* Indented service sub-cards — shown when toggle is expanded */}
        {svcExpanded && services.length > 0 && (
          <div className="relative ml-8 mt-1.5 mb-2 mr-3">
            {/* Vertical connector line */}
            <div className="absolute left-0 top-0 bottom-4 w-0.5 bg-teal-200 rounded-full" />
            <div className="space-y-2 pl-5">
              {services.map((svc, svcIdx) => {
                const isLast = svcIdx === services.length - 1;
                const SvcIcon = SVC_TYPE_ICON[svc.serviceType] ?? HelpCircle;
                const accentCls = SVC_ACCENT[svc.serviceType] ?? 'bg-slate-400';
                const bgCls = SVC_BG[svc.serviceType] ?? 'bg-slate-50';
                const statusCls = SVC_STATUS_CLS[svc.requestStatus] ?? 'bg-gray-100 text-gray-500 border-gray-200';
                const urgencyCls = SVC_URGENCY_CLS[svc.urgencyLevel] ?? 'bg-gray-100 text-gray-600 border-gray-200';
                return (
                  <div key={svc.id} className="relative">
                    {/* Horizontal nub */}
                    <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-teal-200 rounded-full" />
                    {/* Junction dot */}
                    <div className="absolute -left-[22px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 bg-white border-teal-300" />
                    {/* Cover bottom of vertical line for last item */}
                    {isLast && (
                      <div className="absolute -left-[1px] top-1/2 bottom-0 w-0.5 bg-white" />
                    )}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="flex min-h-[60px]">
                        {/* Left accent bar */}
                        <div className={`w-1 shrink-0 rounded-l-xl ${accentCls}`} />
                        {/* Icon zone */}
                        <div className={`w-11 shrink-0 flex items-center justify-center ${bgCls}`}>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${bgCls}`}>
                            <SvcIcon size={14} className="text-gray-600" />
                          </div>
                        </div>
                        {/* Body */}
                        <div className="flex-1 px-3 py-2.5 min-w-0">
                          <p className="text-xs font-semibold text-gray-700 truncate leading-snug">{svc.subject}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md border ${statusCls}`}>
                              {svc.requestStatus.replace('_', ' ')}
                            </span>
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md border ${SVC_CHIP_CLS[svc.serviceType] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                              {SVC_LABEL[svc.serviceType]}
                            </span>
                            {(svc.serviceType === 'GRIEVANCE' || svc.serviceType === 'MAINTENANCE') && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${urgencyCls}`}>
                                {svc.urgencyLevel}
                              </span>
                            )}
                            <span className="text-[9px] text-gray-400 flex items-center gap-0.5">
                              <Clock size={8} />{formatDate(svc.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
  onBookForEmployee?: () => void;
  isManager?: boolean;
}> = ({ property, index, onView, onBook, onBookForEmployee, isManager }) => {
  const [primaryImgError, setPrimaryImgError] = useState(false);
  const [thumbErrors, setThumbErrors] = useState<Record<number, boolean>>({});

  const allImages = resolvePropertyImages(property, index);
  const primaryImage = allImages[0];
  const thumbnails = allImages.slice(1, 5);

  const rawImgs = Array.isArray(property.images) ? (property.images as string[]).filter(Boolean) : [];
  const extraCount = rawImgs.length > 5 ? rawImgs.length - 4 : 0;

  const typeName = property.assetType?.name ?? property.propertyType?.name ?? 'Property';
  const amenityStore = usePropertyStore(s => s.amenities);
  const rawAmenityIds: string[] = Array.isArray((property as any).amenities) ? (property as any).amenities : [];
  const resolvedAmenityNames: string[] = rawAmenityIds
    .map(id => amenityStore.find(a => a.id === id)?.name ?? null)
    .filter((n): n is string => n !== null);

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

          {resolvedAmenityNames.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {resolvedAmenityNames.slice(0, 5).map((name: string) => (
                <span key={name} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
                  {name}
                </span>
              ))}
              {resolvedAmenityNames.length > 5 && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  +{resolvedAmenityNames.length - 5} more
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
          {isManager && onBookForEmployee && (
            <button
              onClick={e => { e.stopPropagation(); onBookForEmployee(); }}
              className="w-full flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-teal-200"
            >
              <UserPlus size={13} />
              Book for Emp / TP
            </button>
          )}
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
  const fetchAmenities = usePropertyStore(s => s.fetchAmenities);
  const amenitiesLoaded = usePropertyStore(s => s.amenities.length > 0);

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
  const [bookingServices, setBookingServices] = useState<Record<string, BookingServiceRequestDTO[]>>({});

  // Demo hardcoded maintenance IDs — vacated bookings that are under maintenance
  const [maintenanceBookingIds, setMaintenanceBookingIds] = useState<Set<string>>(
    () => new Set([
      'dffc4358-d2df-4264-9838-d402e0935bb7',
    ])
  );

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

  // Checkout modal
  const [checkoutBooking, setCheckoutBooking] = useState<BookingDTO | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Manual payment modal
  const [manualPayBooking, setManualPayBooking] = useState<BookingDTO | null>(null);
  const [manualPayAmount, setManualPayAmount] = useState('');
  const [manualPayMode, setManualPayMode] = useState<ManualPaymentMode>('NEFT');
  const [manualPayRef, setManualPayRef] = useState('');
  const [manualPayDate, setManualPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualPayNotes, setManualPayNotes] = useState('');
  const [manualPaySubmitting, setManualPaySubmitting] = useState(false);

  // Modify booking modal
  const [modifyBooking, setModifyBooking] = useState<BookingDTO | null>(null);
  const [modifyMode, setModifyMode] = useState<ModifyMode>('full');
  const [modifyCheckIn, setModifyCheckIn] = useState('');
  const [modifyCheckOut, setModifyCheckOut] = useState('');
  const [modifyQuantity, setModifyQuantity] = useState('1');
  const [modifyRoomNumber, setModifyRoomNumber] = useState('');
  const [modifyGuestName, setModifyGuestName] = useState('');
  const [modifyGuestPhone, setModifyGuestPhone] = useState('');
  const [modifyTotalAmount, setModifyTotalAmount] = useState('');
  const [modifyReason, setModifyReason] = useState('');
  const [modifyNotes, setModifyNotes] = useState('');
  const [modifyLoading, setModifyLoading] = useState(false);

  // Earmark / Provision modal
  const [earmarkBooking, setEarmarkBooking] = useState<BookingDTO | null>(null);
  const [earmarkRoomNumber, setEarmarkRoomNumber] = useState('');
  const [earmarkNote, setEarmarkNote] = useState('');
  const [earmarkLoading, setEarmarkLoading] = useState(false);

  // Process Check-in modal
  const [checkInBooking, setCheckInBooking] = useState<BookingDTO | null>(null);
  const [checkInGuestCount, setCheckInGuestCount] = useState('1');
  const [checkInIdType, setCheckInIdType] = useState('Aadhaar');
  const [checkInIdNumber, setCheckInIdNumber] = useState('');
  const [checkInAddress, setCheckInAddress] = useState('');
  const [checkInRoomNumber, setCheckInRoomNumber] = useState('');
  const [checkInActualDate, setCheckInActualDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkInExpectedOut, setCheckInExpectedOut] = useState('');
  const [checkInSecurityDeposit, setCheckInSecurityDeposit] = useState('');
  const [checkInDepositMode, setCheckInDepositMode] = useState<ManualPaymentMode>('CASH');
  const [checkInRemarks, setCheckInRemarks] = useState('');
  const [checkInLoading, setCheckInLoading] = useState(false);

  // Book for Employee / TP modal
  const [bookForEmpProperty, setBookForEmpProperty] = useState<PropertyDTO | null>(null);
  const [empGuestName, setEmpGuestName] = useState('');
  const [empGuestEmail, setEmpGuestEmail] = useState('');
  const [empGuestPhone, setEmpGuestPhone] = useState('');
  const [empDesignation, setEmpDesignation] = useState('');
  const [empDepartment, setEmpDepartment] = useState('');
  const [empIsTP, setEmpIsTP] = useState(false);
  const [empCheckIn, setEmpCheckIn] = useState('');
  const [empCheckOut, setEmpCheckOut] = useState('');
  const [empRoomTypeId, setEmpRoomTypeId] = useState('');
  const [empQuantity, setEmpQuantity] = useState('1');
  const [empPaymentMode, setEmpPaymentMode] = useState<'PAID' | 'COMPLIMENTARY' | 'ACCOUNT_TRANSFER'>('PAID');
  const [empRemarks, setEmpRemarks] = useState('');
  const [empLoading, setEmpLoading] = useState(false);


  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadBookings();
    loadAvailableProperties();
    if (!amenitiesLoaded) fetchAmenities().catch(() => {});
    const status = searchParams.get('status');
    if (status === 'upcoming') setDpFilter('upcoming');
    else if (status === 'cancelled') setDpFilter('cancelled');
    else if (status === 'completed') setDpFilter('completed');
  }, []);

  const loadBookings = async () => {
    try {
      const data = await bookingService.getBookings({ userId: user!.id });
      setBookings(data);
      // Bulk-fetch service records for all bookings in parallel
      const entries = await Promise.all(
        data.map(async (b) => {
          try {
            const svcs = await bookingServiceRequestService.getServiceRequests(b.id);
            return [b.id, svcs] as const;
          } catch {
            return [b.id, []] as const;
          }
        })
      );
      const svcMap: Record<string, BookingServiceRequestDTO[]> = {};
      for (const [id, svcs] of entries) {
        if (svcs.length > 0) svcMap[id] = svcs;
      }
      setBookingServices(svcMap);
      // Sync active service counts from real data
      const countMap: Record<string, number> = {};
      for (const [id, svcs] of entries) {
        const active = svcs.filter(s => s.requestStatus !== 'CLOSED').length;
        if (active > 0) countMap[id] = active;
      }
      setActiveServiceCounts(countMap);
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
      const created = await bookingServiceRequestService.createServiceRequest(user!.id, {
        bookingId: svcFormBooking.id,
        serviceType: svcFormType,
        subject: svcFormSubject.trim(),
        remarks: svcFormRemarks.trim(),
        urgencyLevel: svcFormUrgency,
      });
      addToast('Service request submitted successfully', 'success');
      setActiveServiceCounts(prev => ({ ...prev, [svcFormBooking.id]: (prev[svcFormBooking.id] ?? 0) + 1 }));
      if (created) {
        setBookingServices(prev => ({
          ...prev,
          [svcFormBooking.id]: [created, ...(prev[svcFormBooking.id] ?? [])],
        }));
      }
      if (svcFormType === 'MAINTENANCE' && svcFormBooking.status === 'CHECKED_OUT') {
        setMaintenanceBookingIds(prev => new Set([...prev, svcFormBooking.id]));
      }
      closeServiceForm();
    } catch {
      addToast('Failed to submit service request', 'error');
    } finally {
      setSvcFormSubmitting(false);
    }
  };

  const handlePayNow = (booking: BookingDTO) => {
    navigate(`/payment?bookingId=${booking.id}&amount=${booking.balanceAmount}&returnUrl=/bookings`);
  };

  const handleCheckout = (booking: BookingDTO) => {
    setCheckoutBooking(booking);
  };

  const processCheckout = async () => {
    if (!checkoutBooking) return;
    setCheckoutLoading(true);
    try {
      await bookingService.updateBookingStatus(checkoutBooking.id, 'CHECKED_OUT');
      addToast('Guest checked out successfully', 'success');
      setCheckoutBooking(null);
      loadBookings();
    } catch {
      addToast('Failed to process checkout', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const openManualPayModal = (booking: BookingDTO) => {
    setManualPayBooking(booking);
    setManualPayAmount(String(booking.balanceAmount));
    setManualPayMode('NEFT');
    setManualPayRef('');
    setManualPayDate(new Date().toISOString().split('T')[0]);
    setManualPayNotes('');
  };

  const handleSubmitManualPayment = async () => {
    if (!manualPayBooking) return;
    const amount = parseFloat(manualPayAmount);
    if (!amount || amount <= 0) { addToast('Enter a valid amount', 'warning'); return; }
    if (!manualPayRef.trim()) { addToast('Reference number is required', 'warning'); return; }
    setManualPaySubmitting(true);
    try {
      await paymentService.recordManualPayment({
        bookingId: manualPayBooking.id,
        amount,
        paymentMode: manualPayMode,
        referenceNumber: manualPayRef.trim(),
        paymentDate: manualPayDate,
        notes: manualPayNotes.trim(),
      });
      addToast('Manual payment recorded successfully', 'success');
      setManualPayBooking(null);
      loadBookings();
    } catch {
      addToast('Failed to record payment', 'error');
    } finally {
      setManualPaySubmitting(false);
    }
  };

  const openModifyModal = (booking: BookingDTO, mode: ModifyMode = 'full') => {
    setModifyBooking(booking);
    setModifyMode(mode);
    setModifyCheckIn(booking.checkInDate?.split('T')[0] ?? '');
    setModifyCheckOut(booking.checkOutDate?.split('T')[0] ?? '');
    setModifyQuantity(String(booking.quantity ?? 1));
    setModifyRoomNumber('');
    setModifyGuestName(booking.guestDetails?.fullName ?? '');
    setModifyGuestPhone(booking.guestDetails?.phone ?? '');
    setModifyTotalAmount(String(booking.totalAmount ?? ''));
    setModifyReason('');
    setModifyNotes(booking.notes ?? '');
  };

  const handleSubmitModify = async () => {
    if (!modifyBooking) return;
    if (['full', 'extend', 'adhoc'].includes(modifyMode)) {
      if (!modifyCheckIn || !modifyCheckOut) { addToast('Check-in and check-out dates are required', 'warning'); return; }
      if (new Date(modifyCheckOut) <= new Date(modifyCheckIn)) { addToast('Check-out must be after check-in', 'warning'); return; }
    }
    const qty = parseInt(modifyQuantity, 10);
    if (!qty || qty < 1) { addToast('Quantity must be at least 1', 'warning'); return; }
    setModifyLoading(true);
    try {
      const noteWithReason = [modifyReason.trim(), modifyNotes.trim()].filter(Boolean).join(' | ');
      await bookingService.updateBooking(modifyBooking.id, {
        checkInDate: modifyCheckIn || undefined,
        checkOutDate: modifyCheckOut || undefined,
        quantity: qty,
        notes: noteWithReason || modifyBooking.notes,
      });
      addToast('Booking updated successfully', 'success');
      setModifyBooking(null);
      loadBookings();
    } catch {
      addToast('Failed to update booking', 'error');
    } finally {
      setModifyLoading(false);
    }
  };

  const openEarmarkModal = (booking: BookingDTO) => {
    setEarmarkBooking(booking);
    setEarmarkRoomNumber('');
    setEarmarkNote('');
  };

  const handleSubmitEarmark = async () => {
    if (!earmarkBooking) return;
    setEarmarkLoading(true);
    try {
      const note = [
        earmarkRoomNumber ? `Room: ${earmarkRoomNumber}` : '',
        earmarkNote.trim(),
        'Earmarked by Estate Manager',
      ].filter(Boolean).join('. ');
      await bookingService.updateBookingStatus(earmarkBooking.id, 'PROVISIONED', note);
      addToast('Room earmarked — booking is now Provisional', 'success');
      setEarmarkBooking(null);
      loadBookings();
    } catch {
      addToast('Failed to earmark room', 'error');
    } finally {
      setEarmarkLoading(false);
    }
  };

  const openProcessCheckInModal = (booking: BookingDTO) => {
    setCheckInBooking(booking);
    setCheckInGuestCount('1');
    setCheckInIdType('Aadhaar');
    setCheckInIdNumber('');
    setCheckInAddress('');
    setCheckInRoomNumber('');
    setCheckInActualDate(new Date().toISOString().split('T')[0]);
    setCheckInExpectedOut(booking.checkOutDate?.split('T')[0] ?? '');
    setCheckInSecurityDeposit('');
    setCheckInDepositMode('CASH');
    setCheckInRemarks('');
  };

  const handleSubmitCheckIn = async () => {
    if (!checkInBooking) return;
    if (!checkInIdNumber.trim()) { addToast('ID proof number is required', 'warning'); return; }
    setCheckInLoading(true);
    try {
      const note = [
        checkInRoomNumber ? `Room: ${checkInRoomNumber}` : '',
        `Guests: ${checkInGuestCount}`,
        `ID: ${checkInIdType} ${checkInIdNumber}`,
        checkInAddress ? `Address: ${checkInAddress}` : '',
        checkInSecurityDeposit ? `Security deposit: ₹${checkInSecurityDeposit} (${checkInDepositMode})` : '',
        checkInRemarks,
      ].filter(Boolean).join('. ');
      await bookingService.updateBookingStatus(checkInBooking.id, 'CHECKED_IN', note);
      if (checkInExpectedOut && checkInExpectedOut !== checkInBooking.checkOutDate?.split('T')[0]) {
        await bookingService.updateBooking(checkInBooking.id, { checkOutDate: checkInExpectedOut });
      }
      addToast('Check-in processed successfully', 'success');
      setCheckInBooking(null);
      loadBookings();
    } catch {
      addToast('Failed to process check-in', 'error');
    } finally {
      setCheckInLoading(false);
    }
  };

  const openBookForEmpModal = (property: PropertyDTO) => {
    setBookForEmpProperty(property);
    setEmpGuestName('');
    setEmpGuestEmail('');
    setEmpGuestPhone('');
    setEmpDesignation('');
    setEmpDepartment('');
    setEmpIsTP(false);
    setEmpCheckIn('');
    setEmpCheckOut('');
    setEmpRoomTypeId('');
    setEmpQuantity('1');
    setEmpPaymentMode('PAID');
    setEmpRemarks('');
  };

  const handleSubmitBookForEmp = async () => {
    if (!bookForEmpProperty) return;
    if (!empGuestName.trim()) { addToast('Guest name is required', 'warning'); return; }
    if (!empCheckIn || !empCheckOut) { addToast('Check-in and check-out dates are required', 'warning'); return; }
    if (!empRoomTypeId) { addToast('Please select a room type', 'warning'); return; }
    setEmpLoading(true);
    try {
      const qty = parseInt(empQuantity, 10) || 1;
      const newBooking = await bookingService.createBooking(user!.id, {
        propertyId: bookForEmpProperty.id,
        roomTypeId: empRoomTypeId,
        quantity: qty,
        checkInDate: empCheckIn,
        checkOutDate: empCheckOut,
        guestDetails: {
          fullName: empGuestName.trim(),
          email: empGuestEmail.trim(),
          phone: empGuestPhone.trim(),
          designation: empDesignation.trim(),
          department: empDepartment.trim(),
        },
        specialRequirements: [
          empIsTP ? 'THIRD_PARTY_GUEST' : 'EMPLOYEE_BOOKING',
          `Payment: ${empPaymentMode}`,
          empRemarks.trim(),
        ].filter(Boolean).join('. '),
      });
      // Advance to PROVISIONED immediately (manager bypass)
      await bookingService.updateBookingStatus(newBooking.id, 'PROVISIONED', 'Manager-initiated booking. Room provisionally held.');
      addToast('Booking created and provisioned successfully', 'success');
      setBookForEmpProperty(null);
      loadBookings();
    } catch {
      addToast('Failed to create booking', 'error');
    } finally {
      setEmpLoading(false);
    }
  };

  const isGovtOfficial = user?.role === 'govt_official';
  const isManager = user?.role === 'manager';

  const stats = {
    total: bookings.length,
    upcoming: bookings.filter(b => ['ALLOCATED', 'PROVISIONED'].includes(b.status)).length,
    checkedIn: bookings.filter(b => b.status === 'CHECKED_IN').length,
    completed: bookings.filter(b => b.status === 'CHECKED_OUT').length,
    cancelled: bookings.filter(b => ['CANCELLED', 'REJECTED'].includes(b.status)).length,
    rejected: bookings.filter(b => b.status === 'REJECTED').length,
    provisioned: bookings.filter(b => b.status === 'PROVISIONED').length,
    draft: bookings.filter(b => b.status === 'REQUESTED').length,
    submitted: bookings.filter(b => ['PROVISIONED', 'AWAITING_PAYMENT'].includes(b.status)).length,
    allotted: bookings.filter(b => b.status === 'ALLOCATED').length,
    occupied: bookings.filter(b => b.status === 'CHECKED_IN').length,
    vacated: bookings.filter(b => b.status === 'CHECKED_OUT').length,
    declined: bookings.filter(b => ['CANCELLED', 'REJECTED'].includes(b.status)).length,
    awaitingPayment: bookings.filter(b => b.status === 'AWAITING_PAYMENT').length,
  };

  const dpCards: DpCard[] = isManager ? [
    {
      key: 'availableProperties',
      label: 'Available Properties',
      description: 'Browse & book',
      count: availableProperties.length,
      gradient: 'from-cyan-500 to-sky-400',
      icon: <Building2 size={16} className="text-white" />,
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
      key: 'cancelled',
      label: 'Cancelled',
      description: 'Booking cancelled',
      count: stats.cancelled,
      gradient: 'from-rose-500 to-pink-500',
      icon: <XCircle size={16} className="text-white" />,
    },
  ] : isGovtOfficial ? [
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
    else if (dpFilter === 'submitted') result = result.filter(b => ['PROVISIONED', 'AWAITING_PAYMENT'].includes(b.status));
    else if (dpFilter === 'allotted') result = result.filter(b => b.status === 'ALLOCATED');
    else if (dpFilter === 'occupied') result = result.filter(b => b.status === 'CHECKED_IN');
    else if (dpFilter === 'vacated') result = result.filter(b => b.status === 'CHECKED_OUT');
    else if (dpFilter === 'awaitingPayment') result = result.filter(b => b.status === 'AWAITING_PAYMENT');
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

      {/* ── Checkout Confirmation Modal ── */}
      {checkoutBooking && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setCheckoutBooking(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center">
                    <LogOut size={13} className="text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">Complete Checkout</h3>
                </div>
                <p className="text-xs text-gray-400 font-mono ml-8">#{checkoutBooking.bookingNumber}</p>
              </div>
              <button onClick={() => setCheckoutBooking(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Guest</span>
                  <span className="font-semibold text-gray-800">{checkoutBooking.guestDetails?.fullName ?? '—'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Property</span>
                  <span className="font-semibold text-gray-800 text-right max-w-[180px] truncate">{checkoutBooking.property?.name ?? '—'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Check-out Date</span>
                  <span className="font-semibold text-gray-800">{formatDate(checkoutBooking.checkOutDate)}</span>
                </div>
              </div>

              {checkoutBooking.balanceAmount > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-xs font-semibold text-red-800">Outstanding Balance — ₹{checkoutBooking.balanceAmount.toLocaleString('en-IN')}</p>
                  <p className="text-[11px] text-red-600 mt-0.5">Please collect payment before completing checkout.</p>
                </div>
              )}
            </div>

            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={() => setCheckoutBooking(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={processCheckout}
                disabled={checkoutLoading || checkoutBooking.balanceAmount > 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
              >
                {checkoutLoading ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                Confirm Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Manual Payment Modal ── */}
      {manualPayBooking && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setManualPayBooking(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-6 h-6 rounded-lg bg-teal-600 flex items-center justify-center">
                    <Receipt size={13} className="text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">Record Manual Payment</h3>
                </div>
                <p className="text-xs text-gray-400 font-mono ml-8">#{manualPayBooking.bookingNumber}</p>
              </div>
              <button onClick={() => setManualPayBooking(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Balance summary */}
            <div className="mx-5 mt-4 mb-0 p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-widest">Balance Due</p>
                <p className="text-xl font-extrabold text-orange-700">₹{manualPayBooking.balanceAmount.toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-orange-400">Total</p>
                <p className="text-sm font-bold text-orange-600">₹{manualPayBooking.totalAmount.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Amount (₹) *</label>
                <input
                  type="number"
                  value={manualPayAmount}
                  onChange={e => setManualPayAmount(e.target.value)}
                  placeholder="Enter amount"
                  min={1}
                  max={manualPayBooking.balanceAmount}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300 bg-white"
                />
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Payment Mode *</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['CASH', 'DD', 'CHEQUE', 'NEFT', 'RTGS', 'UPI'] as ManualPaymentMode[]).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setManualPayMode(mode)}
                      className={`py-1.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                        manualPayMode === mode
                          ? 'bg-teal-50 border-teal-300 text-teal-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                  Reference / Instrument No. *
                </label>
                <input
                  type="text"
                  value={manualPayRef}
                  onChange={e => setManualPayRef(e.target.value)}
                  placeholder={manualPayMode === 'CASH' ? 'Receipt number' : 'Transaction / DD / Cheque no.'}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300 bg-white"
                />
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Payment Date</label>
                <input
                  type="date"
                  value={manualPayDate}
                  onChange={e => setManualPayDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300 bg-white"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Remarks</label>
                <textarea
                  rows={2}
                  value={manualPayNotes}
                  onChange={e => setManualPayNotes(e.target.value)}
                  placeholder="Optional remarks…"
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300 bg-white"
                />
              </div>
            </div>

            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={() => setManualPayBooking(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitManualPayment}
                disabled={manualPaySubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
              >
                {manualPaySubmitting ? <Loader2 size={14} className="animate-spin" /> : <Receipt size={14} />}
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Earmark / Provision Modal ── */}
      {earmarkBooking && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setEarmarkBooking(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-6 h-6 rounded-lg bg-sky-600 flex items-center justify-center">
                    <ShieldCheck size={13} className="text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">Earmark / Provision Room</h3>
                </div>
                <p className="text-xs text-gray-400 font-mono ml-8">#{earmarkBooking.bookingNumber}</p>
              </div>
              <button onClick={() => setEarmarkBooking(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X size={16} /></button>
            </div>
            <div className="mx-5 mt-4 p-3 bg-sky-50 border border-sky-200 rounded-xl">
              <p className="text-xs font-semibold text-sky-700 mb-1">{earmarkBooking.property?.name ?? '—'}</p>
              <p className="text-[11px] text-sky-600">
                {earmarkBooking.guestDetails?.fullName ?? '—'} · {formatDate(earmarkBooking.checkInDate)} → {formatDate(earmarkBooking.checkOutDate)}
              </p>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Room Number (optional)</label>
                <input
                  type="text"
                  value={earmarkRoomNumber}
                  onChange={e => setEarmarkRoomNumber(e.target.value)}
                  placeholder="e.g. 204, Block A-101"
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Remarks (optional)</label>
                <textarea
                  rows={2}
                  value={earmarkNote}
                  onChange={e => setEarmarkNote(e.target.value)}
                  placeholder="e.g. Room reserved pending clearance, adjacent room arranged…"
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-300 bg-white"
                />
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-[11px] text-amber-700 font-medium">This will change the booking status to <strong>Provisional</strong>. The guest will be notified to proceed with payment.</p>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button onClick={() => setEarmarkBooking(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button
                onClick={handleSubmitEarmark}
                disabled={earmarkLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
              >
                {earmarkLoading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                Confirm Earmark
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Process Check-in Modal ── */}
      {checkInBooking && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setCheckInBooking(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center">
                    <DoorOpen size={13} className="text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">Process Check-in</h3>
                </div>
                <p className="text-xs text-gray-400 font-mono ml-8">#{checkInBooking.bookingNumber}</p>
              </div>
              <button onClick={() => setCheckInBooking(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X size={16} /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {/* Guest summary */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-xs font-semibold text-emerald-700">{checkInBooking.guestDetails?.fullName ?? '—'}</p>
                <p className="text-[11px] text-emerald-600">{checkInBooking.property?.name ?? '—'} · {formatDate(checkInBooking.checkInDate)} → {formatDate(checkInBooking.checkOutDate)}</p>
              </div>

              {/* Row 1: Room + Guest Count */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Room Number *</label>
                  <input
                    type="text"
                    value={checkInRoomNumber}
                    onChange={e => setCheckInRoomNumber(e.target.value)}
                    placeholder="e.g. 102, Block B-204"
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Actual No. of Guests</label>
                  <input
                    type="number"
                    min={1}
                    value={checkInGuestCount}
                    onChange={e => setCheckInGuestCount(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-300 bg-white"
                  />
                </div>
              </div>

              {/* ID Proof */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">ID Proof Type</label>
                  <select
                    value={checkInIdType}
                    onChange={e => setCheckInIdType(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-300 bg-white"
                  >
                    {['Aadhaar', 'Passport', 'Voter ID', 'Driving License', 'PAN Card', 'Employee ID'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">ID Number *</label>
                  <input
                    type="text"
                    value={checkInIdNumber}
                    onChange={e => setCheckInIdNumber(e.target.value)}
                    placeholder="xxxx xxxx xxxx"
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-300 bg-white"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Permanent Address</label>
                <textarea
                  rows={2}
                  value={checkInAddress}
                  onChange={e => setCheckInAddress(e.target.value)}
                  placeholder="Home / official address…"
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-300 bg-white"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Check-in Date</label>
                  <input
                    type="date"
                    value={checkInActualDate}
                    onChange={e => setCheckInActualDate(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Expected Check-out</label>
                  <input
                    type="date"
                    value={checkInExpectedOut}
                    onChange={e => setCheckInExpectedOut(e.target.value)}
                    min={checkInActualDate || undefined}
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-300 bg-white"
                  />
                </div>
              </div>

              {/* Security Deposit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Security Deposit (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={checkInSecurityDeposit}
                    onChange={e => setCheckInSecurityDeposit(e.target.value)}
                    placeholder="0"
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Deposit Mode</label>
                  <select
                    value={checkInDepositMode}
                    onChange={e => setCheckInDepositMode(e.target.value as ManualPaymentMode)}
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-300 bg-white"
                  >
                    {(['CASH', 'DD', 'CHEQUE', 'NEFT', 'RTGS', 'UPI'] as ManualPaymentMode[]).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Internal Remarks</label>
                <textarea
                  rows={2}
                  value={checkInRemarks}
                  onChange={e => setCheckInRemarks(e.target.value)}
                  placeholder="Optional remarks for records…"
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-300 bg-white"
                />
              </div>
            </div>
            <div className="px-5 pb-5 pt-3 border-t border-gray-100 flex gap-3 shrink-0">
              <button onClick={() => setCheckInBooking(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button
                onClick={handleSubmitCheckIn}
                disabled={checkInLoading || !checkInIdNumber.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
              >
                {checkInLoading ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
                Confirm Check-in
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Book for Employee / TP Modal ── */}
      {bookForEmpProperty && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setBookForEmpProperty(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-6 h-6 rounded-lg bg-teal-600 flex items-center justify-center">
                    <UserPlus size={13} className="text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">Book for Employee / TP</h3>
                </div>
                <p className="text-xs text-gray-500 ml-8">{bookForEmpProperty.name}</p>
              </div>
              <button onClick={() => setBookForEmpProperty(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X size={16} /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

              {/* Guest type toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setEmpIsTP(false)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-semibold transition-all ${!empIsTP ? 'bg-teal-50 border-teal-300 text-teal-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                >
                  <Users size={13} />Employee
                </button>
                <button
                  onClick={() => setEmpIsTP(true)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-semibold transition-all ${empIsTP ? 'bg-teal-50 border-teal-300 text-teal-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                >
                  <Building2 size={13} />Third Party (TP)
                </button>
              </div>

              {/* Guest details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    value={empGuestName}
                    onChange={e => setEmpGuestName(e.target.value)}
                    placeholder="Guest full name"
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Mobile</label>
                  <input
                    type="tel"
                    value={empGuestPhone}
                    onChange={e => setEmpGuestPhone(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Email</label>
                  <input
                    type="email"
                    value={empGuestEmail}
                    onChange={e => setEmpGuestEmail(e.target.value)}
                    placeholder="email@domain.gov.in"
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Designation</label>
                  <input
                    type="text"
                    value={empDesignation}
                    onChange={e => setEmpDesignation(e.target.value)}
                    placeholder={empIsTP ? 'Representative title' : 'e.g. Deputy Secretary'}
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">{empIsTP ? 'Organisation' : 'Department'}</label>
                  <input
                    type="text"
                    value={empDepartment}
                    onChange={e => setEmpDepartment(e.target.value)}
                    placeholder={empIsTP ? 'Organisation name' : 'e.g. Ministry of Finance'}
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300 bg-white"
                  />
                </div>
              </div>

              {/* Dates + Rooms */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Check-in *</label>
                  <input
                    type="date"
                    value={empCheckIn}
                    onChange={e => setEmpCheckIn(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Check-out *</label>
                  <input
                    type="date"
                    value={empCheckOut}
                    onChange={e => setEmpCheckOut(e.target.value)}
                    min={empCheckIn || undefined}
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Rooms</label>
                  <input
                    type="number"
                    min={1}
                    value={empQuantity}
                    onChange={e => setEmpQuantity(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300 bg-white"
                  />
                </div>
              </div>

              {/* Room Type */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Room Type *</label>
                <select
                  value={empRoomTypeId}
                  onChange={e => setEmpRoomTypeId(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300 bg-white"
                >
                  <option value="">Select room type…</option>
                  {(bookForEmpProperty.roomTypes ?? []).map((rt: any) => (
                    <option key={rt.id} value={rt.id}>{rt.name}</option>
                  ))}
                  {/* Fallback options if roomTypes not loaded on card */}
                  {(bookForEmpProperty.roomTypes ?? []).length === 0 && (
                    <>
                      <option value="7fc1c91a-4beb-4760-b149-3001a2310764">Standard</option>
                      <option value="deccd249-2c5a-41be-9c9a-139794277acb">Deluxe</option>
                      <option value="5fcb45e8-2857-419d-a7f6-d4a4741d30d1">Suite</option>
                    </>
                  )}
                </select>
              </div>

              {/* Payment mode */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Payment Arrangement</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PAID', 'COMPLIMENTARY', 'ACCOUNT_TRANSFER'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setEmpPaymentMode(mode)}
                      className={`py-1.5 px-2 rounded-xl border text-[11px] font-semibold transition-all ${
                        empPaymentMode === mode
                          ? 'bg-teal-50 border-teal-300 text-teal-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {mode === 'PAID' ? 'Guest Pays' : mode === 'COMPLIMENTARY' ? 'Complimentary' : 'Account Transfer'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Remarks</label>
                <textarea
                  rows={2}
                  value={empRemarks}
                  onChange={e => setEmpRemarks(e.target.value)}
                  placeholder="Optional remarks or special instructions…"
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300 bg-white"
                />
              </div>
            </div>
            <div className="px-5 pb-5 pt-3 border-t border-gray-100 flex gap-3 shrink-0">
              <button onClick={() => setBookForEmpProperty(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button
                onClick={handleSubmitBookForEmp}
                disabled={empLoading || !empGuestName.trim() || !empCheckIn || !empCheckOut || !empRoomTypeId}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
              >
                {empLoading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                Create Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Enhanced Modify Booking Modal ── */}
      {modifyBooking && (() => {
        const isCheckedInBooking = modifyBooking.status === 'CHECKED_IN';
        // For CHECKED_IN bookings: check-in date, guest info, and quantity are locked.
        // Only check-out date (extend), room number (change room), price, and notes remain editable.
        const checkedInLockedModes: ModifyMode[] = isCheckedInBooking
          ? ['extend', 'room', 'price', 'adhoc']
          : ['full', 'extend', 'room', 'guest', 'price', 'adhoc'];
        return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setModifyBooking(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
                    <Pencil size={13} className="text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">{MODIFY_MODE_LABELS[modifyMode]}</h3>
                </div>
                <p className="text-xs text-gray-400 font-mono ml-8">#{modifyBooking.bookingNumber}</p>
              </div>
              <button onClick={() => setModifyBooking(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X size={16} /></button>
            </div>

            {/* CHECKED_IN lock banner */}
            {isCheckedInBooking && (
              <div className="mx-5 mt-4 shrink-0 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                <ShieldCheck size={14} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  <span className="font-semibold">Guest is currently checked in.</span> Check-in date, guest identity and room count are locked. You may extend the stay, change the room, adjust pricing or add remarks.
                </p>
              </div>
            )}

            {/* Activity type selector */}
            {(!isCheckedInBooking && (modifyMode === 'full' || modifyMode === 'adhoc')) && (
              <div className="px-5 pt-4 pb-0 shrink-0">
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Edit Mode</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {([
                    { key: 'full' as ModifyMode, label: 'Full Edit', icon: Pencil },
                    { key: 'extend' as ModifyMode, label: 'Extend Stay', icon: CalendarCheck },
                    { key: 'room' as ModifyMode, label: 'Change Room', icon: ArrowRightLeft },
                    { key: 'guest' as ModifyMode, label: 'Guest Info', icon: Users },
                    { key: 'price' as ModifyMode, label: 'Change Price', icon: Banknote },
                    { key: 'adhoc' as ModifyMode, label: 'Ad-hoc', icon: Zap },
                  ]).map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setModifyMode(key)}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl border text-[10px] font-semibold transition-all ${
                        modifyMode === key
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={11} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* For CHECKED_IN: show allowed edit mode tabs */}
            {isCheckedInBooking && (
              <div className="px-5 pt-4 pb-0 shrink-0">
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Edit Mode</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {([
                    { key: 'extend' as ModifyMode, label: 'Extend Stay', icon: CalendarCheck },
                    { key: 'room' as ModifyMode, label: 'Change Room', icon: ArrowRightLeft },
                    { key: 'price' as ModifyMode, label: 'Change Price', icon: Banknote },
                    { key: 'adhoc' as ModifyMode, label: 'Ad-hoc', icon: Zap },
                  ]).map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setModifyMode(key)}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl border text-[10px] font-semibold transition-all ${
                        modifyMode === key
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={11} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {/* Property summary */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Property</span>
                  <span className="font-semibold text-gray-800 text-right max-w-[240px] truncate">{modifyBooking.property?.name ?? '—'}</span>
                </div>
                {modifyBooking.roomType?.name && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Room Type</span>
                    <span className="font-semibold text-gray-800">{modifyBooking.roomType.name}</span>
                  </div>
                )}
                {isCheckedInBooking && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Guest</span>
                    <span className="font-semibold text-gray-800">{modifyBooking.guestDetails?.fullName ?? '—'}</span>
                  </div>
                )}
              </div>

              {/* Check-in date — locked for CHECKED_IN */}
              {isCheckedInBooking && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Check-in (locked)</label>
                    <input
                      type="date"
                      value={modifyCheckIn}
                      readOnly
                      className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl bg-gray-100 cursor-not-allowed text-gray-500"
                    />
                  </div>
                  {/* Check-out — editable for extend/adhoc */}
                  {['extend', 'adhoc'].includes(modifyMode) && (
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">New Check-out *</label>
                      <input
                        type="date"
                        value={modifyCheckOut}
                        onChange={e => setModifyCheckOut(e.target.value)}
                        min={modifyCheckIn || undefined}
                        className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-300 bg-white"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Date fields — for non-CHECKED_IN full/extend/adhoc */}
              {!isCheckedInBooking && ['full', 'extend', 'adhoc'].includes(modifyMode) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                      {modifyMode === 'extend' ? 'Check-in (locked)' : 'Check-in *'}
                    </label>
                    <input
                      type="date"
                      value={modifyCheckIn}
                      onChange={e => setModifyCheckIn(e.target.value)}
                      readOnly={modifyMode === 'extend'}
                      className={`w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-300 ${modifyMode === 'extend' ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Check-out *</label>
                    <input
                      type="date"
                      value={modifyCheckOut}
                      onChange={e => setModifyCheckOut(e.target.value)}
                      min={modifyCheckIn || undefined}
                      className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-300 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Room number — for room/adhoc (all), extend excluded */}
              {checkedInLockedModes.includes(modifyMode) && ['room', 'adhoc'].includes(modifyMode) && (
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Room Number</label>
                  <input
                    type="text"
                    value={modifyRoomNumber}
                    onChange={e => setModifyRoomNumber(e.target.value)}
                    placeholder="e.g. 204, Block A-101"
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-300 bg-white"
                  />
                </div>
              )}
              {!isCheckedInBooking && ['room', 'full', 'adhoc'].includes(modifyMode) && (
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Room Number</label>
                  <input
                    type="text"
                    value={modifyRoomNumber}
                    onChange={e => setModifyRoomNumber(e.target.value)}
                    placeholder="e.g. 204, Block A-101"
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-300 bg-white"
                  />
                </div>
              )}

              {/* Guest info — locked for CHECKED_IN; shown otherwise for guest/full/adhoc */}
              {isCheckedInBooking ? (
                <div className="grid grid-cols-2 gap-3 opacity-50 pointer-events-none">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Guest Name (locked)</label>
                    <input type="text" value={modifyGuestName} readOnly className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl bg-gray-100 cursor-not-allowed text-gray-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Guest Mobile (locked)</label>
                    <input type="tel" value={modifyGuestPhone} readOnly className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl bg-gray-100 cursor-not-allowed text-gray-500" />
                  </div>
                </div>
              ) : (
                ['guest', 'full', 'adhoc'].includes(modifyMode) && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Guest Name</label>
                      <input
                        type="text"
                        value={modifyGuestName}
                        onChange={e => setModifyGuestName(e.target.value)}
                        className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Guest Mobile</label>
                      <input
                        type="tel"
                        value={modifyGuestPhone}
                        onChange={e => setModifyGuestPhone(e.target.value)}
                        className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-300 bg-white"
                      />
                    </div>
                  </div>
                )
              )}

              {/* Quantity — locked for CHECKED_IN; shown for full/adhoc otherwise */}
              {!isCheckedInBooking && ['full', 'adhoc'].includes(modifyMode) && (
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Rooms / Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={modifyQuantity}
                    onChange={e => setModifyQuantity(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-300 bg-white"
                  />
                </div>
              )}

              {/* Price — shown for price/full/adhoc in all statuses */}
              {['price', 'full', 'adhoc'].includes(modifyMode) && (
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Total Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={modifyTotalAmount}
                    onChange={e => setModifyTotalAmount(e.target.value)}
                    placeholder="Enter revised total"
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-300 bg-white"
                  />
                </div>
              )}

              {/* Reason — always shown */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Reason for Modification (audit log)</label>
                <input
                  type="text"
                  value={modifyReason}
                  onChange={e => setModifyReason(e.target.value)}
                  placeholder="e.g. Room 102 reported maintenance issue, guest shifted to 204"
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-300 bg-white"
                />
              </div>

              {/* Notes — always shown */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Additional Notes</label>
                <textarea
                  rows={2}
                  value={modifyNotes}
                  onChange={e => setModifyNotes(e.target.value)}
                  placeholder="Optional additional remarks…"
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-300 bg-white"
                />
              </div>
            </div>

            <div className="px-5 pb-5 pt-3 border-t border-gray-100 flex gap-3 shrink-0">
              <button onClick={() => setModifyBooking(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button
                onClick={handleSubmitModify}
                disabled={modifyLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
              >
                {modifyLoading ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={14} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
        );
      })()}

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
                    onBookForEmployee={() => openBookForEmpModal(property)}
                    isManager={isManager}
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
                          services={bookingServices[booking.id] ?? []}
                          onRaiseService={openServiceForm}
                          onPayNow={handlePayNow}
                          onRecordManualPayment={openManualPayModal}
                          onCheckout={handleCheckout}
                          onModify={openModifyModal}
                          onEarmark={openEarmarkModal}
                          onProcessCheckIn={openProcessCheckInModal}
                          isManager={isManager}
                          isGovtOfficial={isGovtOfficial}
                          isUnderMaintenance={maintenanceBookingIds.has(booking.id)}
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
