import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Search, UserCheck, Key, Calendar, Home, DoorOpen } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { allocationService } from '../services/allocationService';
import { propertyService } from '../services/propertyService';
import { BookingDTO, RoomDTO } from '../types';
import { formatDate } from '../utils/dateHelpers';
import { formatCurrency } from '../utils/formatters';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

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
  const [otpInput, setOtpInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<RoomDTO[]>([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

  useEffect(() => {
    loadTodayBookings();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = bookings.filter(
        (b) =>
          b.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.guestDetails.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.property?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBookings(filtered);
    } else {
      setFilteredBookings(bookings);
    }
  }, [searchQuery, bookings]);

  const loadTodayBookings = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const provisionedBookings = await bookingService.getBookings({
        fromDate: today,
        status: 'PROVISIONED',
      });
      const allocatedBookings = await bookingService.getBookings({
        fromDate: today,
        status: 'ALLOCATED',
      });
      const allBookings = [...provisionedBookings, ...allocatedBookings].filter(
        (booking) => booking.checkInDate.split('T')[0] === today
      );
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
      if (!booking.propertyId) {
        throw new Error('Booking does not have a property ID');
      }

      const rooms = await propertyService.getRoomsByProperty(
        booking.propertyId,
        { roomTypeId: booking.roomTypeId, status: 'AVAILABLE' }
      );

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
        await allocationService.createAllocation(
          { bookingId: selectedBooking.id, roomId },
          user!.id
        );
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

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'error' | 'info' => {
    if (status === 'ALLOCATED') return 'success';
    if (status === 'PROVISIONED') return 'warning';
    return 'info';
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
    } catch (error) {
      addToast('OTP verification failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Guest Check-In</h1>
          <p className="text-gray-600">Verify OTP and check in guests arriving today</p>
        </div>

        <Card className="mb-6">
          <div className="p-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search by booking number, guest name, or property..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search className="w-5 h-5" />}
                />
              </div>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <Card className="text-center py-12">
            <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found for today</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'Try adjusting your search criteria' : 'No bookings are scheduled for check-in today'}
            </p>
            {!searchQuery && (
              <p className="text-sm text-gray-500">
                Bookings must be approved and allocated before they appear here
              </p>
            )}
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{booking.bookingNumber}</h3>
                        <Badge variant={getStatusBadgeVariant(booking.status)}>{booking.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{booking.guestDetails.fullName}</p>
                      {booking.status === 'PROVISIONED' && (
                        <p className="text-xs text-amber-600 mt-1">⚠ Awaiting room allocation</p>
                      )}
                    </div>
                    {booking.status === 'PROVISIONED' ? (
                      <Button
                        onClick={() => handleOpenAllocation(booking)}
                        size="sm"
                        variant="secondary"
                      >
                        <DoorOpen className="w-4 h-4 mr-2" />
                        Allocate Rooms
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleCheckIn(booking)}
                        size="sm"
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Check In
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Home className="w-4 h-4 text-blue-600" />
                      <span>{booking.property?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>{formatDate(booking.checkInDate)}</span>
                    </div>
                    <div className="text-gray-700">
                      {booking.quantity} {booking.roomType?.name}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showOtpModal} onClose={() => setShowOtpModal(false)} title="Verify Check-In OTP">
        <div className="space-y-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">Guest Information</p>
            <p className="text-lg font-bold text-gray-900">{selectedBooking?.guestDetails.fullName}</p>
            <p className="text-sm text-gray-600">{selectedBooking?.bookingNumber}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter 6-Digit OTP
            </label>
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
            <Button
              variant="outline"
              onClick={() => setShowOtpModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerifyOtp}
              disabled={otpInput.length !== 6 || processing}
              className="flex-1"
            >
              {processing ? 'Processing...' : 'Complete Check-In'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAllocationModal}
        onClose={() => setShowAllocationModal(false)}
        title="Allocate Rooms"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="mb-2">
                <p className="text-sm font-medium text-gray-900">{selectedBooking.guestDetails.fullName}</p>
                <p className="text-xs text-gray-600">{selectedBooking.bookingNumber}</p>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">
                  <span className="font-medium">Required:</span> {selectedBooking.quantity}{' '}
                  {selectedBooking.roomType?.name} room(s)
                </span>
                <span className="text-gray-700">
                  <span className="font-medium">Selected:</span> {selectedRoomIds.length} room(s)
                </span>
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
                    disabled={
                      !selectedRoomIds.includes(room.id) &&
                      selectedRoomIds.length >= selectedBooking.quantity
                    }
                    className={`p-4 rounded-lg border-2 transition-all duration-150 ${
                      selectedRoomIds.includes(room.id)
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${
                      !selectedRoomIds.includes(room.id) &&
                      selectedRoomIds.length >= selectedBooking.quantity
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{room.roomNumber}</div>
                    <div className="text-sm text-gray-600">Capacity: {room.capacity}</div>
                    <div className="text-sm text-gray-600">{formatCurrency(room.basePrice)}/night</div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAllocationModal(false)}
                className="flex-1"
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAllocateRooms}
                className="flex-1"
                disabled={processing || selectedRoomIds.length !== selectedBooking.quantity}
              >
                {processing ? 'Allocating...' : 'Allocate & Continue'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
