import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, XCircle, Users, ChevronDown, ChevronUp, Calendar, User, Home, DollarSign } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { useBookingStore } from '../stores/bookingStore';
import { usePropertyStore } from '../stores/propertyStore';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { allocationService } from '../services/allocationService';
import { bookingService } from '../services/bookingService';
import { propertyService } from '../services/propertyService';
import { formatCurrency } from '../utils/formatters';
import { formatDate } from '../utils/dateHelpers';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '../constants/statuses';
import { BookingDTO, RoomDTO } from '../types';
import { FadeIn } from '../components/animations/FadeIn';

export const ManagerPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { bookings, fetchBookings } = useBookingStore();
  const addToast = useUIStore((state) => state.addToast);

  const [selectedBooking, setSelectedBooking] = useState<BookingDTO | null>(null);
  const [availableRooms, setAvailableRooms] = useState<RoomDTO[]>([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings({ status: 'REQUESTED' });
  }, []);

  const handleOpenAllocation = async (booking: BookingDTO) => {
    setSelectedBooking(booking);
    try {
      if (!booking.propertyId) {
        throw new Error('Booking does not have a property ID');
      }

      const rooms = await propertyService.getRoomsByProperty(
        booking.propertyId,
        { roomTypeId: booking.roomTypeId, status: 'AVAILABLE' }
      );

      if (rooms.length === 0) {
        addToast('No available rooms found for this property and room type', 'error');
        return;
      }

      setAvailableRooms(rooms);
      setSelectedRoomIds([]);
      setAllocationModalOpen(true);
    } catch (error: any) {
      addToast(error.message || 'Failed to load rooms', 'error');
    }
  };

  const handleAllocateRooms = async () => {
    if (!selectedBooking || selectedRoomIds.length !== selectedBooking.quantity) {
      addToast(`Please select exactly ${selectedBooking?.quantity} room(s)`, 'error');
      return;
    }

    try {
      for (const roomId of selectedRoomIds) {
        await allocationService.createAllocation(
          { bookingId: selectedBooking.id, roomId },
          user!.id
        );
      }

      await bookingService.updateBookingStatus(selectedBooking.id, 'ALLOCATED');

      addToast('Rooms allocated successfully', 'success');
      setAllocationModalOpen(false);
      fetchBookings({ status: 'REQUESTED' });
    } catch (error: any) {
      addToast(error.message || 'Allocation failed', 'error');
    }
  };

  const handleApprove = async (bookingId: string) => {
    try {
      await bookingService.updateBookingStatus(bookingId, 'PROVISIONED');
      addToast('Booking approved', 'success');
      fetchBookings({ status: 'REQUESTED' });
    } catch (error: any) {
      addToast(error.message || 'Approval failed', 'error');
    }
  };

  const handleReject = async () => {
    if (!selectedBooking || !rejectionReason) {
      addToast('Please provide a rejection reason', 'error');
      return;
    }

    try {
      await bookingService.updateBookingStatus(selectedBooking.id, 'REJECTED', rejectionReason);
      addToast('Booking rejected', 'success');
      setApprovalModalOpen(false);
      setRejectionReason('');
      fetchBookings({ status: 'REQUESTED' });
    } catch (error: any) {
      addToast(error.message || 'Rejection failed', 'error');
    }
  };

  const toggleRoomSelection = (roomId: string) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-cyan-50/20">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FadeIn delay={0}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
              Manager Dashboard
            </h1>
            <p className="text-gray-600">Review and allocate pending booking requests</p>
          </div>
        </FadeIn>

        <div className="grid gap-4">
          {bookings.length === 0 ? (
            <FadeIn delay={100}>
              <div className="pastel-blue-gradient rounded-xl p-12">
                <div className="text-center">
                  <Clock className="mx-auto text-gray-400 mb-4 animate-pulse-slow" size={48} />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending requests</h3>
                  <p className="text-gray-600">All booking requests have been processed</p>
                </div>
              </div>
            </FadeIn>
          ) : (
            bookings.map((booking, index) => {
              const isExpanded = expandedBookingId === booking.id;

              return (
                <FadeIn key={booking.id} delay={index * 80}>
                  <div className="pastel-cyan-gradient rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            {booking.bookingNumber}
                          </h3>
                          <Badge className={BOOKING_STATUS_COLORS[booking.status]}>
                            {BOOKING_STATUS_LABELS[booking.status]}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Home size={16} className="text-gray-400" />
                          {booking.property?.name}
                        </p>
                      </div>
                      <button
                        onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                        className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-2 border border-white/80">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <User size={14} />
                          <span>Guest</span>
                        </div>
                        <p className="font-semibold text-gray-900 text-sm">{booking.guestDetails.fullName}</p>
                      </div>
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-2 border border-white/80">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <Home size={14} />
                          <span>Room Type</span>
                        </div>
                        <p className="font-semibold text-gray-900 text-sm">{booking.roomType?.name}</p>
                      </div>
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-2 border border-white/80">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <Calendar size={14} />
                          <span>Rooms</span>
                        </div>
                        <p className="font-semibold text-gray-900 text-sm">{booking.quantity} room(s)</p>
                      </div>
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-2 border border-white/80">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <DollarSign size={14} />
                          <span>Amount</span>
                        </div>
                        <p className="font-semibold text-gray-900 text-sm">{formatCurrency(booking.totalAmount)}</p>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 space-y-3 animate-slideDown">
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/80">
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <Calendar size={16} />
                            <span className="font-medium">Stay Duration</span>
                          </div>
                          <p className="text-sm text-gray-900">
                            {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
                          </p>
                        </div>

                        {booking.specialRequirements && (
                          <div className="pastel-yellow-gradient rounded-lg p-3">
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">Special Requirements:</span>{' '}
                              {booking.specialRequirements}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApprove(booking.id)}
                        icon={<CheckCircle size={16} />}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenAllocation(booking)}
                        icon={<Users size={16} />}
                      >
                        Allocate Rooms
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setApprovalModalOpen(true);
                        }}
                        icon={<XCircle size={16} />}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </FadeIn>
              );
            })
          )}
        </div>
      </div>

      <Modal
        isOpen={allocationModalOpen}
        onClose={() => setAllocationModalOpen(false)}
        title="Allocate Rooms"
        size="lg"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Required:</span> {selectedBooking.quantity}{' '}
                {selectedBooking.roomType?.name} room(s)
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Selected:</span> {selectedRoomIds.length} room(s)
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {availableRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => toggleRoomSelection(room.id)}
                  className={`p-4 rounded-lg border-2 transition-all duration-150 ${
                    selectedRoomIds.includes(room.id)
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{room.roomNumber}</div>
                  <div className="text-sm text-gray-600">Capacity: {room.capacity}</div>
                  <div className="text-sm text-gray-600">{formatCurrency(room.basePrice)}/night</div>
                </button>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setAllocationModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleAllocateRooms} className="flex-1">
                Confirm Allocation
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={approvalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
        title="Reject Booking"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Please provide a reason for rejecting booking{' '}
            <span className="font-semibold">{selectedBooking?.bookingNumber}</span>
          </p>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason..."
          />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setApprovalModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReject} className="flex-1">
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
