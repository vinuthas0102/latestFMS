import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CheckCircle, XCircle, Calendar, MapPin, Home, CreditCard, Key, Clock, Download } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { paymentService } from '../services/paymentService';
import { BookingDTO, TransactionDTO } from '../types';
import { formatCurrency } from '../utils/formatters';
import { formatDate } from '../utils/dateHelpers';
import { ROUTES } from '../constants/routes';

export const BookingConfirmationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingDTO | null>(null);
  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const success = searchParams.get('success') === 'true';
  const transactionId = searchParams.get('transactionId');
  const bookingId = searchParams.get('bookingId');

  useEffect(() => {
    if (bookingId) {
      loadBookingDetails();
    }
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      const [bookingData, transactionsData] = await Promise.all([
        bookingService.getBookingById(bookingId!),
        paymentService.getTransactions(bookingId!),
      ]);

      setBooking(bookingData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Failed to load booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  if (!success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-gray-600 mb-6">
            Your payment could not be processed. Please try again or contact support.
          </p>
          <div className="space-y-3">
            <Button onClick={() => navigate(ROUTES.DASHBOARD)} className="w-full">
              Back to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = `/payment?bookingId=${bookingId}&amount=${booking?.totalAmount || 0}&returnUrl=/booking-confirmation`}
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Booking not found</p>
      </div>
    );
  }

  const otpExpiry = booking.otpExpiresAt ? new Date(booking.otpExpiresAt) : null;
  const latestTransaction = transactions[0];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8 animate-fadeIn">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600">Your reservation has been successfully created and payment received</p>
        </div>

        <Card className="mb-6 animate-slideUp">
          <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-blue-100 text-sm mb-1">Booking Number</p>
                <p className="text-2xl font-bold">{booking.bookingNumber}</p>
              </div>
              <Badge variant="success" className="bg-green-500 text-white">Confirmed</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-500">
              <div>
                <p className="text-blue-100 text-xs mb-1">Check-in OTP</p>
                <p className="text-3xl font-mono font-bold tracking-wider">{booking.otp}</p>
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

            {latestTransaction && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Payment Receipt
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

            <div className="border-t pt-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Key className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">Important: Save Your Details</p>
                    <p className="text-xs text-blue-800 mb-2">
                      You will need the 6-digit OTP code shown above during check-in.
                      Please save this confirmation or take a screenshot for your records.
                    </p>
                    <p className="text-xs text-blue-800">
                      You can view your booking anytime using the booking number and OTP at{' '}
                      <button
                        onClick={() => navigate(ROUTES.BOOKING_TRACKING)}
                        className="underline font-semibold hover:text-blue-900"
                      >
                        Track Your Booking
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="flex-1"
          >
            Go to Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => window.print()}
          >
            <Download className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>
    </div>
  );
};
