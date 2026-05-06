import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { SummaryStatsCard } from '../components/ui/SummaryStatsCard';
import { FilterDrawer } from '../components/ui/FilterDrawer';
import { ViewSwitcher } from '../components/ui/ViewSwitcher';
import { MandatorySearchBar } from '../components/ui/MandatorySearchBar';
import { DataTable } from '../components/ui/DataTable';
import { ListView, ListViewItem } from '../components/ui/ListView';
import { PhotoLightbox } from '../components/ui/PhotoGallery';
import SplitLayout from '../components/ui/SplitLayout';
import {
  Calendar, Eye, History, CheckCircle, Clock, XCircle,
  Home, MapPin, ArrowRight, CreditCard, Users,
  Building2, Images, ChevronRight, ChevronLeft, X,
  ExternalLink, Bed, Layers, Send, Plus, AlertTriangle,
  Wrench, Star, MessageSquare, RefreshCw, Ban, HelpCircle,
  ChevronDown, ChevronUp, Loader2, type LucideIcon,
} from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { bookingServiceRequestService } from '../services/bookingServiceRequestService';
import {
  BookingDTO, BookingStatus,
  BookingServiceRequestDTO, BookingServiceChatDTO,
  BookingServiceType, CreateBookingServiceRequestDTO,
} from '../types';
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

// ─── Booking list card (compact thumbnail style) ─────────────────────────────

interface BookingCardItemProps {
  booking: BookingDTO;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  activeServiceCount?: number;
}

const STATUS_ACCENT: Record<string, string> = {
  REQUESTED:   'bg-amber-400',
  PROVISIONED: 'bg-blue-400',
  ALLOCATED:   'bg-cyan-400',
  CHECKED_IN:  'bg-emerald-400',
  CHECKED_OUT: 'bg-green-400',
  CANCELLED:   'bg-red-400',
  REJECTED:    'bg-rose-400',
};

const BookingCardItem: React.FC<BookingCardItemProps> = ({ booking, index, isSelected, onClick, activeServiceCount = 0 }) => {
  const [thumbErr, setThumbErr] = useState(false);
  const statusCfg = getStatusConfig(booking.status);
  const nights = calcNights(booking.checkInDate, booking.checkOutDate);
  const thumbSrc = getPropertyImage(booking, index);
  const accentColor = STATUS_ACCENT[booking.status] ?? 'bg-gray-300';

  return (
    <FadeIn delay={index * 35}>
      <div
        onClick={onClick}
        className={`bg-white rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group flex min-h-[108px] ${
          isSelected ? 'ring-2 ring-blue-400 ring-offset-1 shadow-md border-blue-200' : 'border-gray-200 hover:-translate-y-px'
        }`}
      >
        {/* Status accent bar */}
        <div className={`w-1 flex-none ${accentColor} rounded-l-xl`} />

        {/* Thumbnail */}
        <div className="w-20 flex-none relative bg-gray-100 overflow-hidden">
          {!thumbErr ? (
            <img
              src={thumbSrc}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setThumbErr(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <Building2 size={22} className="text-gray-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>

        {/* Body */}
        <div className="flex-1 px-3 py-2.5 min-w-0 flex flex-col justify-between">
          {/* Row 1: booking number + status badge */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-mono text-[10px] font-semibold text-gray-400">#{booking.bookingNumber}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${statusCfg.bg} flex-shrink-0`}>
              {statusCfg.label}
            </span>
          </div>

          {/* Row 2: property name + room type */}
          <div className="mb-1">
            <div className="font-bold text-gray-900 text-sm leading-tight truncate">{booking.property?.name || 'Property'}</div>
            <div className="text-[11px] text-gray-400 truncate mt-0.5 flex items-center gap-1">
              <MapPin size={9} className="flex-shrink-0" />
              {booking.property?.address || 'No address'}
            </div>
          </div>

          {/* Row 3: meta chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
              <Calendar size={9} />{formatDate(booking.checkInDate)}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100">
              {nights}n
            </span>
            {booking.roomType?.name && (
              <span className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                <Bed size={9} />{booking.roomType.name}
              </span>
            )}
            {booking.quantity > 1 && (
              <span className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                <Users size={9} />{booking.quantity}
              </span>
            )}
            {activeServiceCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full border border-orange-100 font-semibold">
                <Wrench size={9} />{activeServiceCount}
              </span>
            )}
          </div>

          {/* Row 4: amount + date */}
          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-gray-100 mt-1.5">
            <span className="text-xs font-black text-gray-900">{formatCurrency(booking.totalAmount)}</span>
            <div className="flex items-center gap-1.5">
              {booking.paymentStatus === 'COMPLETED' ? (
                <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle size={8} />Paid
                </span>
              ) : booking.balanceAmount > 0 ? (
                <span className="text-[9px] text-amber-600 font-semibold flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                  <CreditCard size={8} />Pending
                </span>
              ) : null}
              <span className="text-[9px] text-gray-400">{formatDate(booking.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
};

// ─── Service type config ──────────────────────────────────────────────────────

const SERVICE_CONFIGS: Record<BookingServiceType, { label: string; icon: LucideIcon; color: string; bg: string; border: string }> = {
  GRIEVANCE:            { label: 'Grievance',            icon: AlertTriangle, color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200' },
  MAINTENANCE:          { label: 'Maintenance',          icon: Wrench,        color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  EXTENSION:            { label: 'Extension Request',    icon: RefreshCw,     color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  CANCELLATION_REQUEST: { label: 'Cancellation Request', icon: Ban,           color: 'text-rose-600',   bg: 'bg-rose-50',   border: 'border-rose-200' },
  GENERAL:              { label: 'General Enquiry',      icon: HelpCircle,    color: 'text-gray-600',   bg: 'bg-gray-50',   border: 'border-gray-200' },
};

const SERVICE_STATUS_BADGE: Record<string, string> = {
  OPEN:        'bg-amber-100 text-amber-700 border-amber-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
  RESOLVED:    'bg-emerald-100 text-emerald-700 border-emerald-200',
  CLOSED:      'bg-gray-100 text-gray-600 border-gray-200',
};

// ─── Right Detail Panel ───────────────────────────────────────────────────────

interface BookingDetailPanelProps {
  booking: BookingDTO;
  userId: string;
  onClose: () => void;
  onNavigate: (id: string) => void;
  onServiceCountChange?: (count: number) => void;
}

const BookingDetailPanel: React.FC<BookingDetailPanelProps> = ({ booking, userId, onClose, onNavigate, onServiceCountChange }) => {
  const addToast = useUIStore((s) => s.addToast);
  const statusCfg = getStatusConfig(booking.status);
  const nights = calcNights(booking.checkInDate, booking.checkOutDate);
  const images = getPropertyImages(booking);
  const hasFallback = images.length === 0;
  const displayImages = hasFallback ? [PROPERTY_FALLBACK_IMAGES[0]] : images;

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [imgErr, setImgErr] = useState(false);

  // Services state
  const [services, setServices] = useState<BookingServiceRequestDTO[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const [chats, setChats] = useState<Record<string, BookingServiceChatDTO[]>>({});
  const [chatInput, setChatInput] = useState<Record<string, string>>({});
  const [sendingChat, setSendingChat] = useState<Record<string, boolean>>({});
  const [historyMode, setHistoryMode] = useState(false);
  const [historySelectedId, setHistorySelectedId] = useState<string | null>(null);

  // New service form
  const [showNewServiceForm, setShowNewServiceForm] = useState(false);
  const [newServiceType, setNewServiceType] = useState<BookingServiceType | null>(null);
  const [newServiceSubject, setNewServiceSubject] = useState('');
  const [newServiceRemarks, setNewServiceRemarks] = useState('');
  const [newServiceUrgency, setNewServiceUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [submittingService, setSubmittingService] = useState(false);

  const canRaiseService = !['CANCELLED', 'REJECTED', 'CHECKED_OUT'].includes(booking.status);
  const activeServices = services.filter(s => ['OPEN', 'IN_PROGRESS'].includes(s.requestStatus));
  const historyServices = services.filter(s => ['RESOLVED', 'CLOSED'].includes(s.requestStatus));

  useEffect(() => {
    loadServices();
  }, [booking.id]);

  useEffect(() => {
    onServiceCountChange?.(activeServices.length);
  }, [activeServices.length]);

  const loadServices = async () => {
    setServicesLoading(true);
    try {
      const data = await bookingServiceRequestService.getServiceRequests(booking.id);
      setServices(data);
    } catch { /* silently ignore */ }
    finally { setServicesLoading(false); }
  };

  const loadChats = async (serviceId: string) => {
    try {
      const data = await bookingServiceRequestService.getServiceChats(serviceId);
      setChats(prev => ({ ...prev, [serviceId]: data }));
    } catch { /* silently ignore */ }
  };

  const handleExpandService = (serviceId: string) => {
    const next = expandedServiceId === serviceId ? null : serviceId;
    setExpandedServiceId(next);
    if (next && !chats[next]) loadChats(next);
  };

  const handleSendChat = async (serviceId: string) => {
    const msg = (chatInput[serviceId] || '').trim();
    if (!msg) return;
    setSendingChat(prev => ({ ...prev, [serviceId]: true }));
    try {
      const chat = await bookingServiceRequestService.addServiceChat(serviceId, userId, 'employee', msg);
      setChats(prev => ({ ...prev, [serviceId]: [...(prev[serviceId] || []), chat] }));
      setChatInput(prev => ({ ...prev, [serviceId]: '' }));
    } catch { addToast('Failed to send message', 'error'); }
    finally { setSendingChat(prev => ({ ...prev, [serviceId]: false })); }
  };

  const handleCloseService = async (serviceId: string) => {
    try {
      await bookingServiceRequestService.updateServiceStatus(serviceId, 'CLOSED');
      setServices(prev => prev.map(s => s.id === serviceId ? { ...s, requestStatus: 'CLOSED' } : s));
      if (expandedServiceId === serviceId) setExpandedServiceId(null);
      addToast('Service request closed', 'success');
    } catch { addToast('Failed to close request', 'error'); }
  };

  const handleSubmitNewService = async () => {
    if (!newServiceType || !newServiceSubject.trim() || !newServiceRemarks.trim()) {
      addToast('Please fill in all required fields', 'warning');
      return;
    }
    setSubmittingService(true);
    try {
      const req = await bookingServiceRequestService.createServiceRequest(userId, {
        bookingId: booking.id,
        serviceType: newServiceType,
        subject: newServiceSubject.trim(),
        remarks: newServiceRemarks.trim(),
        urgencyLevel: newServiceUrgency,
      });
      setServices(prev => [req, ...prev]);
      setShowNewServiceForm(false);
      setNewServiceType(null);
      setNewServiceSubject('');
      setNewServiceRemarks('');
      addToast('Service request raised successfully', 'success');
    } catch { addToast('Failed to submit service request', 'error'); }
    finally { setSubmittingService(false); }
  };

  const renderChat = (serviceId: string) => {
    const msgs = chats[serviceId] || [];
    return (
      <div className="mt-2 space-y-1.5">
        {msgs.length === 0 && (
          <div className="text-center text-xs text-gray-400 py-3">No messages yet. Start the conversation.</div>
        )}
        {msgs.map(msg => {
          const isEmployee = msg.authorRole === 'employee';
          return (
            <div key={msg.id} className={`flex ${isEmployee ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[82%] text-xs px-2.5 py-1.5 rounded-xl ${isEmployee ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                {msg.message}
                <div className={`text-[9px] mt-0.5 ${isEmployee ? 'text-blue-100' : 'text-gray-400'}`}>
                  {isEmployee ? 'You' : 'Manager'} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
          <textarea
            rows={2}
            placeholder="Type a message…"
            value={chatInput[serviceId] || ''}
            onChange={e => setChatInput(prev => ({ ...prev, [serviceId]: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(serviceId); } }}
            className="flex-1 text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-300"
          />
          <button
            onClick={() => handleSendChat(serviceId)}
            disabled={sendingChat[serviceId] || !(chatInput[serviceId] || '').trim()}
            className="self-end flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs rounded-lg transition-colors font-medium"
          >
            {sendingChat[serviceId] ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
          </button>
        </div>
      </div>
    );
  };

  const renderServiceCard = (svc: BookingServiceRequestDTO, showClose = true) => {
    const cfg = SERVICE_CONFIGS[svc.serviceType];
    const SvcIcon = cfg.icon;
    const isExpanded = expandedServiceId === svc.id;
    const showDetailRow = (svc.serviceType === 'GRIEVANCE' || svc.serviceType === 'MAINTENANCE') && (svc.subject || svc.urgencyLevel);
    const ctrlRef = `#${svc.id.slice(-6).toUpperCase()}`;
    return (
      <div key={svc.id} className={`rounded-xl border ${cfg.border} overflow-hidden`}>
        <div
          className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-gray-50/50 transition-colors ${isExpanded ? cfg.bg : 'bg-white'}`}
          onClick={() => handleExpandService(svc.id)}
        >
          <SvcIcon size={13} className={cfg.color} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-gray-900 truncate">{svc.subject || cfg.label}</div>
            {showDetailRow ? (
              <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                <span className="text-[10px] font-mono text-gray-400 shrink-0">{ctrlRef}</span>
                <span className="text-gray-300 text-[10px]">·</span>
                <span className="text-[10px] text-gray-400 truncate">{cfg.label}</span>
                {svc.urgencyLevel && svc.urgencyLevel !== 'LOW' && (
                  <>
                    <span className="text-gray-300 text-[10px]">·</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${svc.urgencyLevel === 'HIGH' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                      {svc.urgencyLevel}
                    </span>
                  </>
                )}
              </div>
            ) : (
              <div className="text-[10px] text-gray-400">{cfg.label}</div>
            )}
          </div>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${SERVICE_STATUS_BADGE[svc.requestStatus]}`}>
            {svc.requestStatus.replace('_', ' ')}
          </span>
          {isExpanded ? <ChevronUp size={12} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={12} className="text-gray-400 flex-shrink-0" />}
        </div>
        {isExpanded && (
          <div className={`px-3 pb-3 border-t ${cfg.border} ${cfg.bg}`}>
            {svc.remarks && (
              <p className="text-xs text-gray-600 mt-2 mb-1 leading-relaxed">{svc.remarks}</p>
            )}
            {svc.eoNotes && (
              <div className="bg-white/80 border border-gray-200 rounded-lg px-2.5 py-1.5 mb-2 text-xs text-gray-700">
                <span className="font-semibold text-gray-500 text-[10px]">Manager Notes: </span>{svc.eoNotes}
              </div>
            )}
            {renderChat(svc.id)}
            {showClose && ['OPEN', 'IN_PROGRESS'].includes(svc.requestStatus) && (
              <button
                onClick={(e) => { e.stopPropagation(); handleCloseService(svc.id); }}
                className="mt-2 text-[10px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 hover:underline"
              >
                <X size={9} /> Close Request
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div className="flex-none sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold text-gray-700">#{booking.bookingNumber}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${statusCfg.bg}`}>{statusCfg.label}</span>
            {activeServices.length > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200 flex items-center gap-0.5">
                <Wrench size={8} />{activeServices.length}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 truncate mt-0.5">{booking.property?.name || 'Booking Detail'}</div>
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
                { label: 'Check-in',  value: formatDate(booking.checkInDate),  cls: 'bg-gray-50 border-gray-100' },
                { label: 'Check-out', value: formatDate(booking.checkOutDate), cls: 'bg-gray-50 border-gray-100' },
                { label: 'Duration',  value: `${nights}n`, cls: 'bg-blue-50 border-blue-100 text-blue-700' },
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
                  { label: 'Name',   value: booking.guestDetails.fullName },
                  { label: 'Email',  value: booking.guestDetails.email },
                  { label: 'Phone',  value: booking.guestDetails.phone },
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

          {/* ── Active Services ──────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Services</div>
                {activeServices.length > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200">{activeServices.length}</span>
                )}
              </div>
              {historyServices.length > 0 && (
                <button onClick={() => setHistoryMode(!historyMode)} className="text-[10px] text-blue-600 hover:underline flex items-center gap-1">
                  <MessageSquare size={10} />{historyMode ? 'Active' : 'History'}
                </button>
              )}
            </div>

            {servicesLoading ? (
              <div className="flex items-center gap-2 py-4 text-gray-400 text-xs"><Loader2 size={13} className="animate-spin" />Loading...</div>
            ) : historyMode ? (
              /* History mode: two-column layout */
              <div className="flex gap-2 min-h-[120px]">
                <div className="w-2/5 space-y-1.5 overflow-y-auto">
                  {historyServices.map(svc => {
                    const cfg = SERVICE_CONFIGS[svc.serviceType];
                    const SvcIcon = cfg.icon;
                    const isSelected = historySelectedId === svc.id;
                    return (
                      <div
                        key={svc.id}
                        onClick={() => { setHistorySelectedId(svc.id); if (!chats[svc.id]) loadChats(svc.id); }}
                        className={`cursor-pointer rounded-lg border p-2 transition-colors ${isSelected ? `${cfg.bg} ${cfg.border}` : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <SvcIcon size={11} className={cfg.color} />
                          <span className="text-[10px] font-semibold text-gray-800 truncate flex-1">{svc.subject || cfg.label}</span>
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-px rounded-full border mt-1 inline-block ${SERVICE_STATUS_BADGE[svc.requestStatus]}`}>
                          {svc.requestStatus.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl border border-gray-100 p-2.5 overflow-y-auto">
                  {historySelectedId ? renderChat(historySelectedId) : (
                    <div className="flex items-center justify-center h-20 text-xs text-gray-400">Select a request</div>
                  )}
                </div>
              </div>
            ) : activeServices.length === 0 ? (
              <div className="bg-gray-50 rounded-xl border border-gray-100 py-6 text-center">
                <CheckCircle size={20} className="mx-auto text-gray-300 mb-1" />
                <p className="text-xs text-gray-400">No active service requests</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeServices.map(svc => renderServiceCard(svc, true))}
              </div>
            )}
          </div>

          {/* ── Raise New Service ────────────────────────────────── */}
          {canRaiseService && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Raise New Service</div>
              {!showNewServiceForm ? (
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(SERVICE_CONFIGS) as [BookingServiceType, typeof SERVICE_CONFIGS[BookingServiceType]][]).map(([type, cfg]) => {
                    const SvcIcon = cfg.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => { setNewServiceType(type); setShowNewServiceForm(true); }}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${cfg.border} ${cfg.bg} hover:shadow-sm transition-all group text-left`}
                      >
                        <SvcIcon size={14} className={cfg.color} />
                        <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">
                      {newServiceType ? SERVICE_CONFIGS[newServiceType].label : 'New Request'}
                    </span>
                    <button onClick={() => { setShowNewServiceForm(false); setNewServiceType(null); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                      <X size={13} />
                    </button>
                  </div>

                  {/* Service type selector */}
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Type</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(Object.entries(SERVICE_CONFIGS) as [BookingServiceType, typeof SERVICE_CONFIGS[BookingServiceType]][]).map(([type, cfg]) => {
                        const SvcIcon = cfg.icon;
                        return (
                          <button
                            key={type}
                            onClick={() => setNewServiceType(type)}
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-semibold transition-all ${newServiceType === type ? `${cfg.bg} ${cfg.border} ${cfg.color}` : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                          >
                            <SvcIcon size={11} />{cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Subject *</label>
                    <input
                      type="text"
                      placeholder="Brief summary…"
                      value={newServiceSubject}
                      onChange={e => setNewServiceSubject(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Details *</label>
                    <textarea
                      rows={3}
                      placeholder="Describe the issue or request…"
                      value={newServiceRemarks}
                      onChange={e => setNewServiceRemarks(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-300 bg-white"
                    />
                  </div>

                  {(newServiceType === 'GRIEVANCE' || newServiceType === 'MAINTENANCE') && (
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Urgency</label>
                      <div className="flex gap-2">
                        {(['LOW', 'MEDIUM', 'HIGH'] as const).map(u => (
                          <button
                            key={u}
                            onClick={() => setNewServiceUrgency(u)}
                            className={`flex-1 px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${
                              newServiceUrgency === u
                                ? u === 'HIGH' ? 'bg-red-100 border-red-300 text-red-700' : u === 'MEDIUM' ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-green-100 border-green-300 text-green-700'
                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { setShowNewServiceForm(false); setNewServiceType(null); setNewServiceSubject(''); setNewServiceRemarks(''); }}
                      className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitNewService}
                      disabled={submittingService || !newServiceType || !newServiceSubject.trim() || !newServiceRemarks.trim()}
                      className="flex-1 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-40 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      {submittingService ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                      Submit
                    </button>
                  </div>
                </div>
              )}
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
  const [activeServiceCounts, setActiveServiceCounts] = useState<Record<string, number>>({});


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
            <SplitLayout
              storageKey="bhSplit"
              defaultSplit={65}
              minLeft={40}
              maxLeft={80}
              onClose={() => setSelectedBooking(null)}
              right={selectedBooking ? (
                <BookingDetailPanel
                  booking={selectedBooking}
                  userId={user!.id}
                  onClose={() => setSelectedBooking(null)}
                  onNavigate={(id) => navigate(`/bookings/${id}`)}
                  onServiceCountChange={(count) => setActiveServiceCounts(prev => ({ ...prev, [selectedBooking.id]: count }))}
                />
              ) : null}
              left={
              <div className="pr-1">
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
                        activeServiceCount={activeServiceCounts[booking.id] ?? 0}
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
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};
