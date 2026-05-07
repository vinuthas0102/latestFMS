import React, { useState, useEffect } from 'react';
import {
  X, ExternalLink, Building2, MapPin, Bed, Layers, Eye, ArrowRight,
  Images, CheckCircle, MessageSquare, Loader2, Send, ChevronDown, ChevronUp, Ban,
  AlertTriangle, Wrench, RefreshCw, HelpCircle, Plus,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { PhotoLightbox } from '../ui/PhotoGallery';
import { BookingDTO, BookingServiceRequestDTO, BookingServiceChatDTO, BookingServiceType } from '../../types';
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

// ── Props ───────────────────────────────────────────────────────────

interface BookingDetailPanelProps {
  booking: BookingDTO;
  userId: string;
  onClose: () => void;
  onNavigate: (id: string) => void;
  onServiceCountChange?: (count: number) => void;
}

export const BookingDetailPanel: React.FC<BookingDetailPanelProps> = ({
  booking, userId, onClose, onNavigate, onServiceCountChange,
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

  const [services, setServices] = useState<BookingServiceRequestDTO[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const [chats, setChats] = useState<Record<string, BookingServiceChatDTO[]>>({});
  const [chatInput, setChatInput] = useState<Record<string, string>>({});
  const [sendingChat, setSendingChat] = useState<Record<string, boolean>>({});
  const [historyMode, setHistoryMode] = useState(false);
  const [historySelectedId, setHistorySelectedId] = useState<string | null>(null);

  const [showNewServiceForm, setShowNewServiceForm] = useState(false);
  const [newServiceType, setNewServiceType] = useState<BookingServiceType | null>(null);
  const [newServiceSubject, setNewServiceSubject] = useState('');
  const [newServiceRemarks, setNewServiceRemarks] = useState('');
  const [newServiceUrgency, setNewServiceUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [submittingService, setSubmittingService] = useState(false);

  const canRaiseService = !['CANCELLED', 'REJECTED', 'CHECKED_OUT'].includes(booking.status);
  const activeServices = services.filter(s => ['OPEN', 'IN_PROGRESS'].includes(s.requestStatus));
  const historyServices = services.filter(s => ['RESOLVED', 'CLOSED'].includes(s.requestStatus));

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

          {/* Active Services */}
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

          {/* Raise New Service */}
          {canRaiseService && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Raise New Service</div>
              {!showNewServiceForm ? (
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(SERVICE_CONFIGS) as [BookingServiceType, ServiceConfigEntry][]).map(([type, cfg]) => {
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

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Type</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(Object.entries(SERVICE_CONFIGS) as [BookingServiceType, ServiceConfigEntry][]).map(([type, cfg]) => {
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
