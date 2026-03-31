import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Search, UserCheck, Key, Calendar, Home, Ligature as FileSignature, CheckCircle } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { BookingDTO } from '../types';
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
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [signature, setSignature] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

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
    if (booking.status === 'PROVISIONED') {
      addToast('This booking is awaiting room allocation', 'error');
      return;
    }
    setSelectedBooking(booking);
    setShowOtpModal(true);
    setOtpInput('');
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
        setShowOtpModal(false);
        setShowSignatureModal(true);
      } else {
        addToast('Invalid or expired OTP', 'error');
      }
    } catch (error) {
      addToast('OTP verification failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature('');
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL();
    setSignature(dataUrl);
  };

  const handleCompleteCheckIn = async () => {
    if (!selectedBooking || !signature) {
      addToast('Please capture guest signature', 'error');
      return;
    }

    saveSignature();
    setProcessing(true);

    try {
      await bookingService.updateBookingStatus(selectedBooking.id, 'CHECKED_IN');
      addToast('Guest checked in successfully', 'success');
      setShowSignatureModal(false);
      setSelectedBooking(null);
      loadTodayBookings();
    } catch (error) {
      addToast('Check-in failed', 'error');
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
                    <Button
                      onClick={() => handleCheckIn(booking)}
                      size="sm"
                      disabled={booking.status === 'PROVISIONED'}
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Check In
                    </Button>
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
              {processing ? 'Verifying...' : 'Verify OTP'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showSignatureModal} onClose={() => setShowSignatureModal(false)} title="Guest Signature">
        <div className="space-y-6">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-green-900">OTP Verified Successfully</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Guest Signature
            </label>
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                width={500}
                height={200}
                className="w-full bg-white cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>
            <div className="flex justify-end mt-2">
              <Button variant="ghost" size="sm" onClick={clearSignature}>
                Clear
              </Button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowSignatureModal(false);
                setShowOtpModal(false);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCompleteCheckIn}
              disabled={processing}
              className="flex-1"
            >
              <FileSignature className="w-4 h-4 mr-2" />
              {processing ? 'Processing...' : 'Complete Check-In'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
