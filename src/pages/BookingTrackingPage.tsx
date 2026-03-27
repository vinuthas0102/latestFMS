import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import {
  Search,
  Building2,
  Calendar,
  Home,
  CreditCard,
  Key,
  Clock,
  Download,
  XCircle,
  AlertCircle,
  CheckCircle,
  User,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { paymentService } from '../services/paymentService';
import { BookingDTO, TransactionDTO } from '../types';
import { formatCurrency } from '../utils/formatters';
import { formatDate } from '../utils/dateHelpers';
import { ROUTES } from '../constants/routes';

export const BookingTrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const [bookingNumber, setBookingNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<BookingDTO | null>(null);
  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);
  const [error, setError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setBooking(null);
    setTransactions([]);

    try {
      if (!bookingNumber.trim()) {
        setError('Please enter a booking number');
        return;
      }

      const result = await bookingService.getBookingByNumberAndOTP(
        bookingNumber.trim().toUpperCase(),
        otp.trim()
      );

      if (!result) {
        setError('Booking not found or invalid OTP. Please check your booking number and OTP.');
        return;
      }

      setBooking(result);

      const transactionsData = await paymentService.getTransactions(result.id);
      setTransactions(transactionsData);
    } catch (err: any) {
      console.error('Error fetching booking:', err);
      setError('Unable to retrieve booking details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;

    setCancelling(true);
    try {
      await bookingService.cancelBooking(booking.id);

      const updatedBooking = await bookingService.getBookingByNumberAndOTP(
        bookingNumber.trim().toUpperCase(),
        otp.trim()
      );

      setBooking(updatedBooking);
      setShowCancelModal(false);
      setError('');
    } catch (err: any) {
      console.error('Error cancelling booking:', err);
      setError('Unable to cancel booking. Please contact support.');
    } finally {
      setCancelling(false);
    }
  };

  const canCancelBooking = booking && ['REQUESTED', 'PROVISIONED', 'ALLOCATED'].includes(booking.status);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'ALLOCATED':
      case 'CHECKED_IN':
        return 'success';
      case 'CANCELLED':
      case 'REJECTED':
        return 'error';
      case 'CHECKED_OUT':
        return 'default';
      default:
        return 'warning';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'ALLOCATED':
      case 'CHECKED_IN':
        return <CheckCircle className="w-5 h-5" />;
      case 'CANCELLED':
      case 'REJECTED':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const latestTransaction = transactions[0];
  const otpExpiry = booking?.otpExpiresAt ? new Date(booking.otpExpiresAt) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate(ROUTES.HOME)}
            >
              <Building2 className="text-blue-600" size={32} />
              <span className="text-xl font-bold text-gray-900">FMS</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(ROUTES.SEARCH)}
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Search Facilities
              </button>
              <Button onClick={() => navigate(ROUTES.LOGIN)} size="sm">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Search className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Booking</h1>
          <p className="text-gray-600">
            Enter your booking number and OTP to view booking details, print confirmation, or cancel your reservation
          </p>
        </div>

        <Card className="mb-6">
          <div className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Number *
                </label>
                <Input
                  value={bookingNumber}
                  onChange={(e) => setBookingNumber(e.target.value.toUpperCase())}
                  placeholder="Enter your booking number (e.g., BK20260327000001)"
                  className="font-mono"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OTP Code *
                </label>
                <Input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="font-mono text-lg tracking-wider"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  The OTP was provided in your booking confirmation
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading || !bookingNumber || otp.length !== 6}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Find My Booking
                  </>
                )}
              </Button>
            </form>
          </div>
        </Card>

        {booking && (
          <div className="space-y-6 animate-fadeIn">
            <Card>
              <div className={`p-6 rounded-t-lg ${
                booking.status === 'CANCELLED' || booking.status === 'REJECTED'
                  ? 'bg-gradient-to-r from-red-600 to-red-700'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700'
              } text-white`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-blue-100 text-sm mb-1">Booking Number</p>
                    <p className="text-2xl font-bold">{booking.bookingNumber}</p>
                  </div>
                  <Badge
                    variant={getStatusBadgeVariant(booking.status)}
                    className="flex items-center gap-2 text-base px-4 py-2"
                  >
                    {getStatusIcon(booking.status)}
                    {booking.status}
                  </Badge>
                </div>

                {booking.status !== 'CANCELLED' && booking.status !== 'REJECTED' && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-500">
                    <div>
                      <p className="text-blue-100 text-xs mb-1">Check-in OTP</p>
                      <p className="text-2xl font-mono font-bold tracking-wider">{booking.otp}</p>
                    </div>
                    <div>
                      <p className="text-blue-100 text-xs mb-1">Valid Until</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-4 h-4" />
                        <p className="text-sm font-medium">
                          {otpExpiry ? formatDate(otpExpiry.toISOString()) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Home className="w-5 h-5 text-blue-600" />
                    Property Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Property:</span>
                      <span className="font-semibold text-gray-900">{booking.property?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium text-gray-900">{booking.property?.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Room Type:</span>
                      <span className="font-medium text-gray-900">{booking.roomType?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium text-gray-900">{booking.quantity} room{booking.quantity !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Stay Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Check-in</p>
                      <p className="font-semibold text-gray-900">{formatDate(booking.checkInDate)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Check-out</p>
                      <p className="font-semibold text-gray-900">{formatDate(booking.checkOutDate)}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Guest Information
                  </h3>
                  <div className="space-y-3">
                    {booking.guestDetails?.name && (
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{booking.guestDetails.name}</span>
                      </div>
                    )}
                    {booking.guestDetails?.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{booking.guestDetails.email}</span>
                      </div>
                    )}
                    {booking.guestDetails?.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{booking.guestDetails.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {booking.specialRequirements && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Special Requirements</h3>
                    <p className="text-gray-700 text-sm">{booking.specialRequirements}</p>
                  </div>
                )}

                {latestTransaction && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      Payment Information
                    </h3>
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transaction ID:</span>
                        <span className="font-mono text-sm font-semibold text-gray-900">{latestTransaction.transactionId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="font-medium text-gray-900">{latestTransaction.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount Paid:</span>
                        <span className="text-lg font-bold text-green-600">{formatCurrency(latestTransaction.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Status:</span>
                        <Badge variant="success">{latestTransaction.paymentStatus}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date & Time:</span>
                        <span className="text-sm text-gray-900">{formatDate(latestTransaction.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {booking.status !== 'CANCELLED' && booking.status !== 'REJECTED' && (
                  <div className="border-t pt-6">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <Key className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-blue-900 mb-1">Check-in Instructions</p>
                          <p className="text-xs text-blue-800">
                            Present the 6-digit OTP code shown above when you arrive at the property.
                            This code is valid until {otpExpiry ? formatDate(otpExpiry.toISOString()) : 'N/A'}.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {booking.status === 'REJECTED' && booking.rejectionReason && (
                  <div className="border-t pt-6">
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-red-900 mb-1">Rejection Reason</p>
                          <p className="text-xs text-red-800">{booking.rejectionReason}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {booking.status === 'CANCELLED' && (
                  <div className="border-t pt-6">
                    <div className="p-4 bg-gray-100 rounded-lg border border-gray-300">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900 mb-1">Booking Cancelled</p>
                          <p className="text-xs text-gray-700">
                            This booking has been cancelled. If you have any questions, please contact support.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Print Confirmation
              </Button>
              {canCancelBooking && (
                <Button
                  variant="outline"
                  onClick={() => setShowCancelModal(true)}
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Booking
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-2">Need help?</p>
          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.HOME)}
            size="sm"
          >
            Back to Home
          </Button>
        </div>
      </div>

      {showCancelModal && (
        <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel Booking">
          <div className="p-6 space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-900 mb-1">Are you sure?</p>
                  <p className="text-xs text-yellow-800">
                    Cancelling this booking cannot be undone. Please contact support if you need to make changes instead of cancelling.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Booking Number:</span>
                <span className="font-semibold text-gray-900">{booking?.bookingNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Property:</span>
                <span className="font-medium text-gray-900">{booking?.property?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-bold text-gray-900">{formatCurrency(booking?.paidAmount || 0)}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(false)}
                className="flex-1"
                disabled={cancelling}
              >
                Keep Booking
              </Button>
              <Button
                onClick={handleCancelBooking}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={cancelling}
              >
                {cancelling ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Yes, Cancel Booking
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
