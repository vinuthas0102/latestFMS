import React, { useState, useEffect, useRef } from 'react';
import {
  ExternalLink, Building2, MapPin, Bed, Layers, Images,
  CheckCircle, MessageSquare, Loader2, Send, ChevronDown, ChevronUp, Ban,
  AlertTriangle, Wrench, RefreshCw, HelpCircle, X,
  FileText, Calendar, Users, CreditCard, MessageCircle,
  Paperclip,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { PhotoLightbox } from '../ui/PhotoGallery';
import { ChatDeliveryModePicker } from '../ui/ChatDeliveryModePicker';
import { BookingDTO, BookingServiceRequestDTO, BookingServiceChatDTO } from '../../types';
import type { ChatDeliveryMode } from '../../types/quarters';
import { formatDate } from '../../utils/dateHelpers';
import { formatCurrency } from '../../utils/formatters';
import { useUIStore } from '../../stores/uiStore';
import { bookingServiceRequestService } from '../../services/bookingServiceRequestService';
import {
  getBookingStatusConfig, calcNights, getPropertyImages, PROPERTY_FALLBACK_IMAGES,
} from '../../utils/bookingFormatters';

// ── Service configs ─────────────────────────────────────────────────

interface ServiceConfigEntry {
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
  color: string;
  bg: string;
  border: string;
}

const SERVICE_CONFIGS: Record<BookingServiceType, ServiceConfigEntry> = {
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

type TabKey = 'summary' | 'chat';

// ── Props ───────────────────────────────────────────────────────────

interface BookingDetailPanelProps {
  booking: BookingDTO;
  userId: string;
  onClose: () => void;
  onNavigate: (id: string) => void;
  onServiceCountChange?: (count: number) => void;
  panelControls?: React.ReactNode;
}

export const BookingDetailPanel: React.FC<BookingDetailPanelProps> = ({
  booking, userId, onClose, onNavigate, onServiceCountChange, panelControls,
}) => {
  const addToast = useUIStore((s) => s.addToast);
  const statusCfg = getBookingStatusConfig(booking.status);
  const nights = calcNights(booking.checkInDate, booking.checkOutDate);
  const images = getPropertyImages(booking);
  const hasFallback = images.length === 0;
  const displayImages = hasFallback ? [PROPERTY_FALLBACK_IMAGES[0]] : images;

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [imgErr, setImgErr] = useState(false);

  const [activeTab, setActiveTab] = useState<TabKey>('summary');

  // Services
  const [services, setServices] = useState<BookingServiceRequestDTO[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const [chats, setChats] = useState<Record<string, BookingServiceChatDTO[]>>({});
  const [chatInput, setChatInput] = useState<Record<string, string>>({});
  const [sendingChat, setSendingChat] = useState<Record<string, boolean>>({});

  // Direct chat (booking-level)
  const [directChatInput, setDirectChatInput] = useState('');
  const [directChatFile, setDirectChatFile] = useState<File | null>(null);
  const directChatFileRef = useRef<HTMLInputElement>(null);
  const [directChats, setDirectChats] = useState<BookingServiceChatDTO[]>([]);
  const [sendingDirectChat, setSendingDirectChat] = useState(false);
  const [directChatMode, setDirectChatMode] = useState<ChatDeliveryMode>('IN_APP');
  const [perServiceChatMode, setPerServiceChatMode] = useState<Record<string, ChatDeliveryMode>>({});

  const activeServices = services.filter(s => ['OPEN', 'IN_PROGRESS'].includes(s.requestStatus));

  const headerColor = (() => {
    const s = booking.status;
    if (['CHECKED_IN'].includes(s)) return 'bg-emerald-700';
    if (['CHECKED_OUT'].includes(s)) return 'bg-teal-700';
    if (['ALLOCATED', 'PROVISIONED'].includes(s)) return 'bg-blue-700';
    if (['CANCELLED', 'REJECTED'].includes(s)) return 'bg-rose-700';
    return 'bg-slate-700';
  })();

  useEffect(() => { loadServices(); }, [booking.id]);
  useEffect(() => { onServiceCountChange?.(activeServices.length); }, [activeServices.length]);

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
    const mode = perServiceChatMode[serviceId] ?? 'IN_APP';
    setSendingChat(prev => ({ ...prev, [serviceId]: true }));
    try {
      const chat = await bookingServiceRequestService.addServiceChat(serviceId, userId, 'employee', msg, [], mode);
      setChats(prev => ({ ...prev, [serviceId]: [...(prev[serviceId] || []), chat] }));
      setChatInput(prev => ({ ...prev, [serviceId]: '' }));
    } catch { addToast('Failed to send message', 'error'); }
    finally { setSendingChat(prev => ({ ...prev, [serviceId]: false })); }
  };

  const handleSendDirectChat = async () => {
    const msg = directChatInput.trim();
    if (!msg) return;
    setSendingDirectChat(true);
    try {
      const targetServiceId = activeServices[0]?.id;
      if (targetServiceId) {
        const chat = await bookingServiceRequestService.addServiceChat(targetServiceId, userId, 'employee', msg, [], directChatMode);
        setDirectChats(prev => [...prev, chat]);
      } else {
        setDirectChats(prev => [...prev, {
          id: `local-${Date.now()}`,
          serviceRequestId: '',
          authorId: userId,
          authorRole: 'employee',
          message: msg,
          documentUrls: [],
          deliveryMode: directChatMode,
          createdAt: new Date().toISOString(),
        } as BookingServiceChatDTO]);
      }
      setDirectChatInput('');
      setDirectChatFile(null);
    } catch { addToast('Failed to send message', 'error'); }
    finally { setSendingDirectChat(false); }
  };

  const handleCloseService = async (serviceId: string) => {
    try {
      await bookingServiceRequestService.updateServiceStatus(serviceId, 'CLOSED');
      setServices(prev => prev.map(s => s.id === serviceId ? { ...s, requestStatus: 'CLOSED' } : s));
      if (expandedServiceId === serviceId) setExpandedServiceId(null);
      addToast('Service request closed', 'success');
    } catch { addToast('Failed to close request', 'error'); }
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
        <div className="mt-2 pt-2 border-t border-gray-100">
          <ChatDeliveryModePicker
            value={perServiceChatMode[serviceId] ?? 'IN_APP'}
            onChange={m => setPerServiceChatMode(prev => ({ ...prev, [serviceId]: m }))}
            className="mb-2"
          />
          <div className="flex gap-2">
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
            {svc.remarks && <p className="text-xs text-gray-600 mt-2 mb-1 leading-relaxed">{svc.remarks}</p>}
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

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'summary', label: 'Summary', icon: <FileText size={12} /> },
    { key: 'chat', label: 'Chat', icon: <MessageCircle size={12} /> },
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* ── Colored header ── */}
      <div className={`flex items-center gap-2 px-3 py-2.5 sticky top-0 z-10 rounded-t-xl ${headerColor}`}>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-white truncate">#{booking.bookingNumber}</span>
          <span className="text-white/40 text-xs">·</span>
          <span className="text-xs font-semibold text-white/90 truncate">{booking.property?.name || 'Booking'}</span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white shrink-0">{statusCfg.label}</span>
        <button
          onClick={() => onNavigate(booking.id)}
          className="flex items-center gap-1 text-[10px] font-medium text-white/80 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-all shrink-0"
        >
          <ExternalLink size={10} />Full
        </button>
        {panelControls}
      </div>

      {/* ── Tab nav ── */}
      <div className="flex items-center gap-0.5 px-3 pt-2 pb-1 border-b border-gray-100 overflow-x-auto scrollbar-hide flex-none">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors relative ${
              activeTab === tab.key ? `${headerColor} text-white shadow-sm` : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            {tab.icon}{tab.label}
            {tab.badge != null && (
              <span className={`text-[9px] font-bold px-1 py-0 rounded-full ${activeTab === tab.key ? 'bg-white/30 text-white' : 'bg-orange-100 text-orange-600'}`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto">

        {/* SUMMARY TAB */}
        {activeTab === 'summary' && (
          <div className="px-4 py-4 space-y-4">
            {/* Image tiles */}
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

            {/* Property */}
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

            {/* Stay */}
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

            {/* Guest */}
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

            {/* Payment */}
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
          </div>
        )}


        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50 min-h-0">
              {directChats.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 bg-white rounded-xl border border-dashed border-gray-200">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2.5">
                    <Send size={16} className="text-gray-300" />
                  </div>
                  <div className="text-[13px] font-semibold text-gray-500">No messages yet</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Start the conversation below</div>
                </div>
              )}
              {directChats.map(msg => {
                const isEmployee = msg.authorRole === 'employee';
                return (
                  <div key={msg.id} className={`flex ${isEmployee ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] text-xs px-3 py-2 rounded-2xl leading-relaxed ${isEmployee ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'}`}>
                      {msg.message}
                      <div className={`text-[9px] mt-0.5 ${isEmployee ? 'text-blue-100' : 'text-gray-400'}`}>
                        {isEmployee ? 'You' : 'Manager'} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex-none border-t border-gray-100 px-4 py-3 bg-white">
              <ChatDeliveryModePicker value={directChatMode} onChange={setDirectChatMode} className="mb-2" />
              {directChatFile && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg mb-2">
                  <FileText size={13} className="text-blue-500 shrink-0" />
                  <span className="flex-1 min-w-0 text-[12px] font-medium text-blue-800 truncate">{directChatFile.name}</span>
                  <button type="button" onClick={() => setDirectChatFile(null)} className="p-0.5 rounded text-blue-400 hover:text-red-500 transition-colors shrink-0"><X size={12} /></button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <button type="button" onClick={() => directChatFileRef.current?.click()}
                  className="flex-none p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors" title="Attach file">
                  <Paperclip size={15} />
                </button>
                <input ref={directChatFileRef} type="file" accept="application/pdf,image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0] ?? null; setDirectChatFile(f); e.target.value = ''; }} />
                <textarea
                  value={directChatInput}
                  onChange={e => setDirectChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && directChatInput.trim()) { e.preventDefault(); handleSendDirectChat(); } }}
                  rows={1}
                  placeholder="Type a message… (Enter to send)"
                  className="flex-1 px-3.5 py-2.5 text-[13px] border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white leading-relaxed transition-colors"
                  style={{ minHeight: '40px', maxHeight: '80px' }}
                />
                <button onClick={handleSendDirectChat} disabled={!directChatInput.trim() || sendingDirectChat}
                  className="flex-none p-2.5 rounded-xl bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {lightboxOpen && (
        <PhotoLightbox
          images={displayImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
};
