import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import {
  Search, UserCheck, Key, Calendar, Home, DoorOpen,
  MoreVertical, Users, Phone, Mail, CreditCard, FileText,
  ChevronRight, Building2,
} from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { allocationService } from '../services/allocationService';
import { propertyService } from '../services/propertyService';
import { BookingDTO, RoomDTO } from '../types';
import { formatDate } from '../utils/dateHelpers';
import { formatCurrency } from '../utils/formatters';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useNavigate } from 'react-router-dom';

export const CheckInPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const addToast = useUIStore((state) => state.addToast);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingDTO[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingDTO | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showGuestInfoModal, setShowGuestInfoModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<RoomDTO[]>([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

  // Action menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTodayBookings();
  }, []);

  useEffect(() => {
    const filtered = bookings.filter((b) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        b.bookingNumber.toLowerCase().includes(q) ||
        b.guestDetails.fullName?.toLowerCase().includes(q) ||
        b.property?.name.toLowerCase().includes(q)
      );
    });
    setFilteredBookings(filtered);
  }, [searchQuery, bookings]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
        setMenuPos(null);
      }
    };
    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openMenuId]);

  const loadTodayBookings = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [provisioned, allocated, checkedIn] = await Promise.all([
        bookingService.getBookings({ fromDate: today, status: 'PROVISIONED' }),
        bookingService.getBookings({ fromDate: today, status: 'ALLOCATED' }),
        bookingService.getBookings({ fromDate: today, status: 'CHECKED_IN' }),
      ]);
      const allBookings = [
        ...provisioned.filter((b) => b.checkInDate.split('T')[0] === today),
        ...allocated.filter((b) => b.checkInDate.split('T')[0] === today),
        ...checkedIn.filter((b) => b.checkInDate.split('T')[0] === today),
      ];
      setBookings(allBookings);
      setFilteredBookings(allBookings);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      addToast('Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = (booking: BookingDTO) => {
    setSelectedBooking(booking);
    setShowOtpModal(true);
    setOtpInput('');
  };

  const handleOpenAllocation = async (booking: BookingDTO) => {
    setSelectedBooking(booking);
    setProcessing(true);
    try {
      if (!booking.propertyId) throw new Error('Booking does not have a property ID');

      const rooms = await propertyService.getRoomsByProperty(booking.propertyId, {
        roomTypeId: booking.roomTypeId,
        status: 'AVAILABLE',
      });

      if (rooms.length === 0) {
        addToast('No available rooms found for this property and room type', 'error');
        setProcessing(false);
        return;
      }

      setAvailableRooms(rooms);
      setSelectedRoomIds([]);
      setShowAllocationModal(true);
    } catch (error: any) {
      addToast(error.message || 'Failed to load rooms', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenGuestInfo = (booking: BookingDTO) => {
    setSelectedBooking(booking);
    setShowGuestInfoModal(true);
    setOpenMenuId(null);
    setMenuPos(null);
  };

  const toggleRoomSelection = (roomId: string) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  const handleAllocateRooms = async () => {
    if (!selectedBooking || selectedRoomIds.length !== selectedBooking.quantity) {
      addToast(`Please select exactly ${selectedBooking?.quantity} room(s)`, 'error');
      return;
    }

    setProcessing(true);
    try {
      for (const roomId of selectedRoomIds) {
        await allocationService.createAllocation({ bookingId: selectedBooking.id, roomId }, user!.id);
      }
      await bookingService.updateBookingStatus(selectedBooking.id, 'ALLOCATED');
      addToast('Rooms allocated successfully', 'success');
      setShowAllocationModal(false);
      await loadTodayBookings();
      setShowOtpModal(true);
      setOtpInput('');
    } catch (error: any) {
      addToast(error.message || 'Allocation failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!selectedBooking) return;
    setProcessing(true);
    try {
      const isValid = await bookingService.verifyOTP(selectedBooking.id, otpInput);
      if (isValid) {
        await bookingService.updateBookingStatus(selectedBooking.id, 'CHECKED_IN');
        addToast('Guest checked in successfully', 'success');
        setShowOtpModal(false);
        setSelectedBooking(null);
        loadTodayBookings();
      } else {
        addToast('Invalid or expired OTP', 'error');
      }
    } catch {
      addToast('OTP verification failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const openMenu = (e: React.MouseEvent, bookingId: string) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, left: rect.right - 180 });
    setOpenMenuId(openMenuId === bookingId ? null : bookingId);
  };

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'error' | 'info' => {
    if (status === 'CHECKED_IN') return 'success';
    if (status === 'ALLOCATED') return 'info';
    if (status === 'PROVISIONED') return 'warning';
    return 'info';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'CHECKED_IN') return 'Checked In';
    if (status === 'ALLOCATED') return 'Allocated';
    if (status === 'PROVISIONED') return 'Pending Allocation';
    return status;
  };

  const checkedIn = bookings.filter((b) => b.status === 'CHECKED_IN').length;
  const pending = bookings.filter((b) => ['PROVISIONED', 'ALLOCATED'].includes(b.status)).length;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50/20">

      {/* Header */}
      <div className="flex-none bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2 flex-wrap">
            <button onClick={() => navigate('/dashboard')} className="hover:text-blue-600 transition-colors"><Home size={11} /></button>
            <ChevronRight size={10} />
            <span className="text-gray-500">My Workspace</span>
            <ChevronRight size={10} />
            <span className="text-gray-700 font-medium">Guest Check-In</span>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                <UserCheck className="w-4 h-4 text-white" />
              </div>
              Guest Check-In
            </h1>
            <div className="flex items-center gap-3 text-sm">
              <span className="px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-700 font-semibold text-xs">{pending} Pending</span>
              <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 font-semibold text-xs">{checkedIn} Checked In</span>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by booking number, guest name, or property..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600" />
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">No bookings found for today</h3>
              <p className="text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search criteria' : 'No bookings are scheduled for check-in today'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="flex">
                    {/* Left accent bar */}
                    <div className={`w-1 flex-none ${booking.status === 'CHECKED_IN' ? 'bg-emerald-500' : booking.status === 'ALLOCATED' ? 'bg-blue-500' : 'bg-amber-500'}`} />

                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-3">
                        {/* Left info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="font-mono text-sm font-bold text-gray-900">{booking.bookingNumber}</span>
                            <Badge variant={getStatusBadgeVariant(booking.status)} className="text-xs">{getStatusLabel(booking.status)}</Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-gray-700 font-semibold mb-1">
                            <Users size={13} className="text-gray-400 flex-shrink-0" />
                            {booking.guestDetails.fullName}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Building2 size={11} />{booking.property?.name}</span>
                            <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(booking.checkInDate)}</span>
                            <span>{booking.quantity} {booking.roomType?.name}</span>
                          </div>
                          {booking.guestDetails.phone && (
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                              <Phone size={10} />{booking.guestDetails.phone}
                            </div>
                          )}
                        </div>

                        {/* Right actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {booking.status === 'PROVISIONED' && (
                            <button
                              onClick={() => handleOpenAllocation(booking)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors shadow-sm"
                            >
                              <DoorOpen size={13} />Allocate Rooms
                            </button>
                          )}
                          {booking.status === 'ALLOCATED' && (
                            <button
                              onClick={() => handleCheckIn(booking)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                            >
                              <UserCheck size={13} />Check In
                            </button>
                          )}
                          {booking.status === 'CHECKED_IN' && (
                            <span className="flex items-center gap-1 text-xs text-emerald-700 font-semibold px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-xl">
                              <UserCheck size={12} />Checked In
                            </span>
                          )}
                          {/* Three-dot menu */}
                          <button
                            onClick={(e) => openMenu(e, booking.id)}
                            className={`p-1.5 rounded-lg border transition-colors ${openMenuId === booking.id ? 'bg-gray-100 border-gray-300 text-gray-700' : 'border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Portal dropdown menu */}
      {openMenuId && menuPos && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
          className="w-44 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden"
        >
          {(() => {
            const booking = filteredBookings.find((b) => b.id === openMenuId);
            if (!booking) return null;
            return (
              <>
                <button
                  onClick={() => handleOpenGuestInfo(booking)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <Users size={14} className="text-gray-400" />Guest Info
                </button>
                {booking.status === 'PROVISIONED' && (
                  <button
                    onClick={() => { handleOpenAllocation(booking); setOpenMenuId(null); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                  >
                    <DoorOpen size={14} className="text-gray-400" />Allocate Rooms
                  </button>
                )}
                {booking.status === 'ALLOCATED' && (
                  <button
                    onClick={() => { handleCheckIn(booking); setOpenMenuId(null); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <UserCheck size={14} className="text-gray-400" />Check In
                  </button>
                )}
              </>
            );
          })()}
        </div>,
        document.body
      )}

      {/* OTP Modal */}
      <Modal isOpen={showOtpModal} onClose={() => setShowOtpModal(false)} title="Verify Check-In OTP">
        <div className="space-y-6">
          <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1.5">Guest Information</p>
            <p className="text-base font-bold text-gray-900">{selectedBooking?.guestDetails.fullName}</p>
            <p className="text-sm text-gray-500">{selectedBooking?.bookingNumber}</p>
            {selectedBooking?.property?.name && (
              <p className="text-xs text-gray-400 mt-1">{selectedBooking.property.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Enter 6-Digit OTP</label>
            <Input
              type="text"
              maxLength={6}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="text-center text-2xl font-mono tracking-widest"
              icon={<Key className="w-5 h-5" />}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowOtpModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleVerifyOtp} disabled={otpInput.length !== 6 || processing} className="flex-1">
              {processing ? 'Processing...' : 'Complete Check-In'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Room Allocation Modal */}
      <Modal isOpen={showAllocationModal} onClose={() => setShowAllocationModal(false)} title="Allocate Rooms">
        {selectedBooking && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="mb-2">
                <p className="text-sm font-semibold text-gray-900">{selectedBooking.guestDetails.fullName}</p>
                <p className="text-xs text-gray-500">{selectedBooking.bookingNumber}</p>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700"><span className="font-medium">Required:</span> {selectedBooking.quantity} {selectedBooking.roomType?.name} room(s)</span>
                <span className="text-gray-700"><span className="font-medium">Selected:</span> {selectedRoomIds.length}</span>
              </div>
            </div>

            {availableRooms.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DoorOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No available rooms found for this room type</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {availableRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => toggleRoomSelection(room.id)}
                    disabled={!selectedRoomIds.includes(room.id) && selectedRoomIds.length >= selectedBooking.quantity}
                    className={`p-4 rounded-xl border-2 transition-all duration-150 text-left ${
                      selectedRoomIds.includes(room.id) ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    } ${!selectedRoomIds.includes(room.id) && selectedRoomIds.length >= selectedBooking.quantity ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="font-semibold text-gray-900">{room.roomNumber}</div>
                    <div className="text-xs text-gray-500 mt-1">Capacity: {room.capacity}</div>
                    <div className="text-xs text-gray-500">{formatCurrency(room.basePrice)}/night</div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowAllocationModal(false)} className="flex-1" disabled={processing}>Cancel</Button>
              <Button onClick={handleAllocateRooms} className="flex-1" disabled={processing || selectedRoomIds.length !== selectedBooking.quantity}>
                {processing ? 'Allocating...' : 'Allocate & Continue'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Guest Info Modal */}
      <Modal isOpen={showGuestInfoModal} onClose={() => setShowGuestInfoModal(false)} title="Guest Information">
        {selectedBooking && (
          <div className="space-y-5">
            {/* Header chip */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                {selectedBooking.guestDetails.fullName?.[0]?.toUpperCase() ?? 'G'}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-gray-900 text-sm truncate">{selectedBooking.guestDetails.fullName}</div>
                <div className="text-xs text-gray-500 font-mono">{selectedBooking.bookingNumber}</div>
              </div>
              <Badge variant={getStatusBadgeVariant(selectedBooking.status)} className="ml-auto text-xs flex-shrink-0">
                {getStatusLabel(selectedBooking.status)}
              </Badge>
            </div>

            {/* Contact details */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contact Details</div>
              <div className="grid grid-cols-1 gap-2">
                {selectedBooking.guestDetails.email && (
                  <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100 text-sm">
                    <Mail size={14} className="text-gray-400 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Email</div>
                      <div className="text-gray-800 font-medium">{selectedBooking.guestDetails.email}</div>
                    </div>
                  </div>
                )}
                {selectedBooking.guestDetails.phone && (
                  <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100 text-sm">
                    <Phone size={14} className="text-gray-400 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Phone</div>
                      <div className="text-gray-800 font-medium">{selectedBooking.guestDetails.phone}</div>
                    </div>
                  </div>
                )}
                {selectedBooking.guestDetails.address && (
                  <div className="flex items-start gap-2.5 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100 text-sm">
                    <Home size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Address</div>
                      <div className="text-gray-800 font-medium">{selectedBooking.guestDetails.address}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ID Proof */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">ID Proof</div>
              {selectedBooking.guestDetails.idProofType || selectedBooking.guestDetails.idProofNumber ? (
                <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100 text-sm">
                  <CreditCard size={14} className="text-gray-400 flex-shrink-0" />
                  <div>
                    {selectedBooking.guestDetails.idProofType && (
                      <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{selectedBooking.guestDetails.idProofType}</div>
                    )}
                    {selectedBooking.guestDetails.idProofNumber && (
                      <div className="text-gray-800 font-mono font-semibold">{selectedBooking.guestDetails.idProofNumber}</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="px-3 py-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 flex items-center gap-2">
                  <FileText size={13} />No ID proof on record
                </div>
              )}
            </div>

            {/* Stay Summary */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Stay</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Check-in', value: formatDate(selectedBooking.checkInDate) },
                  { label: 'Check-out', value: formatDate(selectedBooking.checkOutDate) },
                  { label: 'Room Type', value: selectedBooking.roomType?.name ?? '—' },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 border border-gray-100 rounded-xl p-2.5">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">{item.label}</div>
                    <div className="text-xs font-bold text-gray-800">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Guest count */}
            {(selectedBooking.guestDetails.numberOfGuests || selectedBooking.guestDetails.numberOfAdults) && (
              <div className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-sm">
                <Users size={14} className="text-blue-500 flex-shrink-0" />
                <div className="flex gap-4">
                  {selectedBooking.guestDetails.numberOfGuests && (
                    <div><span className="text-xs text-blue-400">Total:</span> <span className="font-semibold text-blue-900">{selectedBooking.guestDetails.numberOfGuests}</span></div>
                  )}
                  {selectedBooking.guestDetails.numberOfAdults && (
                    <div><span className="text-xs text-blue-400">Adults:</span> <span className="font-semibold text-blue-900">{selectedBooking.guestDetails.numberOfAdults}</span></div>
                  )}
                  {selectedBooking.guestDetails.numberOfChildren != null && selectedBooking.guestDetails.numberOfChildren > 0 && (
                    <div><span className="text-xs text-blue-400">Children:</span> <span className="font-semibold text-blue-900">{selectedBooking.guestDetails.numberOfChildren}</span></div>
                  )}
                </div>
              </div>
            )}

            <Button variant="outline" onClick={() => setShowGuestInfoModal(false)} className="w-full">Close</Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
