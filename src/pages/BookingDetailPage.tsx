import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, Clock, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Loading';
import { Modal } from '../components/ui/Modal';
import { bookingService } from '../services/bookingService';
import { allocationService } from '../services/allocationService';
import { paymentService } from '../services/paymentService';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { BookingDTO, BookingAllocationDTO, TransactionDTO } from '../types';
import { formatCurrency } from '../utils/formatters';
import { formatDate, formatDateTime } from '../utils/dateHelpers';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '../constants/statuses';
import { ROUTES } from '../constants/routes';

export const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const addToast = useUIStore((state) => state.addToast);

  const [booking, setBooking] = useState<BookingDTO | null>(null);
  const [allocations, setAllocations] = useState<BookingAllocationDTO[]>([]);
  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const isOwner = booking?.userId === user?.id;
  const canApprove = isManager && booking?.status === 'REQUESTED';

  useEffect(() => {
    if (id) {
      loadBookingDetails();
    }
  }, [id]);

  const loadBookingDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [bookingData, allocationsData, transactionsData] = await Promise.all([
        bookingService.getBookingById(id),
        allocationService.getAllocations(id).catch(() => []),
        paymentService.getTransactions(id).catch(() => []),
      ]);

      if (!bookingData) {
        addToast('Booking not found', 'error');
        navigate(ROUTES.DASHBOARD);
        return;
      }

      setBooking(bookingData);
      setAllocations(allocationsData);
      setTransactions(transactionsData);
    } catch (error: any) {
      addToast(error.message || 'Failed to load booking details', 'error');
      navigate(ROUTES.DASHBOARD);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking || !cancellationReason) {
      addToast('Please provide a cancellation reason', 'error');
      return;
    }

    try {
      await bookingService.updateBookingStatus(booking.id, 'CANCELLED', cancellationReason);
      addToast('Booking cancelled successfully', 'success');
      setCancelModalOpen(false);
      loadBookingDetails();
    } catch (error: any) {
      addToast(error.message || 'Failed to cancel booking', 'error');
    }
  };

  const handleApproveBooking = async () => {
    if (!booking) return;

    try {
      await bookingService.updateBookingStatus(booking.id, 'PROVISIONED');
      addToast('Booking approved successfully', 'success');
      loadBookingDetails();
    } catch (error: any) {
      addToast(error.message || 'Failed to approve booking', 'error');
    }
  };

  const handleRejectBooking = async () => {
    if (!booking || !rejectionReason) {
      addToast('Please provide a rejection reason', 'error');
      return;
    }

    try {
      await bookingService.updateBookingStatus(booking.id, 'REJECTED', rejectionReason);
      addToast('Booking rejected', 'success');
      setRejectModalOpen(false);
      setRejectionReason('');
      loadBookingDetails();
    } catch (error: any) {
      addToast(error.message || 'Failed to reject booking', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Booking Not Found</h3>
                <p className="text-gray-600 mb-6">The booking you're looking for doesn't exist</p>
                <Button onClick={() => navigate(ROUTES.DASHBOARD)}>Back to Dashboard</Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  const canCancel = isOwner && ['REQUESTED', 'ALLOCATED', 'PROVISIONED'].includes(booking.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            icon={<ArrowLeft size={20} />}
          >
            Back
          </Button>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{booking.bookingNumber}</h1>
              <p className="text-gray-600">Booking Details & Status</p>
            </div>
            <Badge className={BOOKING_STATUS_COLORS[booking.status]} size="lg">
              {BOOKING_STATUS_LABELS[booking.status]}
            </Badge>
          </div>

          {booking.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-medium text-red-900">Rejection Reason</p>
                  <p className="text-sm text-red-800 mt-1">{booking.rejectionReason}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Property & Room Information</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Property</p>
                      <p className="font-semibold text-gray-900">{booking.property?.name}</p>
                      <p className="text-sm text-gray-600">{booking.property?.address}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Room Type</p>
                      <p className="font-semibold text-gray-900">{booking.roomType?.name}</p>
                      <p className="text-sm text-gray-600">Quantity: {booking.quantity} room(s)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Stay Duration</p>
                      <p className="font-semibold text-gray-900">
                        {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {Math.ceil(
                          (new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{' '}
                        night(s)
                      </p>
                    </div>
                  </div>

                  {booking.specialRequirements && (
                    <div className="flex items-start gap-3">
                      <FileText className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">Special Requirements</p>
                        <p className="text-gray-900 mt-1">{booking.specialRequirements}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Guest Information</h2>
              </CardHeader>
              <CardBody>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium text-gray-900">{booking.guestDetails.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{booking.guestDetails.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{booking.guestDetails.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Guest Count</p>
                    <p className="font-medium text-gray-900">{booking.guestDetails.guestCount}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {allocations.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-gray-900">Room Allocations</h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {allocations.map((allocation) => (
                      <div
                        key={allocation.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold">
                            {allocation.room?.roomNumber}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              Room {allocation.room?.roomNumber}
                            </p>
                            <p className="text-sm text-gray-600">
                              Capacity: {allocation.room?.capacity} | {formatCurrency(allocation.room?.basePrice || 0)}/night
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Allocated: {formatDateTime(allocation.allocatedAt)}
                            </p>
                          </div>
                        </div>
                        {allocation.checkInTime && (
                          <Badge variant="success">Checked In</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {transactions.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{transaction.transactionId}</p>
                          <p className="text-sm text-gray-600">{transaction.paymentMethod}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDateTime(transaction.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{formatCurrency(transaction.amount)}</p>
                          <Badge
                            variant={transaction.paymentStatus === 'SUCCESS' ? 'success' : 'error'}
                            size="sm"
                          >
                            {transaction.paymentStatus}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {booking.notes && (
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
                </CardHeader>
                <CardBody>
                  <p className="text-gray-700 whitespace-pre-wrap">{booking.notes}</p>
                </CardBody>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Payment Summary</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="font-bold text-gray-900">{formatCurrency(booking.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Paid Amount</span>
                    <span className="font-semibold text-green-600">{formatCurrency(booking.paidAmount)}</span>
                  </div>
                  <div className="h-px bg-gray-200" />
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">Balance Due</span>
                    <span className="font-bold text-xl text-gray-900">
                      {formatCurrency(booking.balanceAmount)}
                    </span>
                  </div>
                  <Badge
                    variant={
                      booking.paymentStatus === 'COMPLETED'
                        ? 'success'
                        : booking.paymentStatus === 'PARTIAL'
                        ? 'warning'
                        : 'error'
                    }
                    className="w-full justify-center"
                  >
                    {booking.paymentStatus}
                  </Badge>
                </div>
              </CardBody>
            </Card>

            {canApprove && (
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-gray-900">Booking Actions</h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    <Button
                      variant="primary"
                      onClick={handleApproveBooking}
                      className="w-full"
                      icon={<CheckCircle size={18} />}
                    >
                      Approve Booking
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => setRejectModalOpen(true)}
                      className="w-full"
                      icon={<XCircle size={18} />}
                    >
                      Reject Booking
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}

            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">OTP Details</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <p className="text-xs text-blue-800 mb-2">Check-in OTP</p>
                    <p className="text-3xl font-mono font-bold text-blue-900 tracking-wider">
                      {booking.otp}
                    </p>
                  </div>
                  {booking.otpExpiresAt && (
                    <p className="text-xs text-gray-500 text-center">
                      Expires: {formatDateTime(booking.otpExpiresAt)}
                    </p>
                  )}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Booking Timeline</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="text-gray-400" size={16} />
                    <div>
                      <p className="text-gray-500">Created</p>
                      <p className="font-medium text-gray-900">{formatDateTime(booking.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="text-gray-400" size={16} />
                    <div>
                      <p className="text-gray-500">Last Updated</p>
                      <p className="font-medium text-gray-900">{formatDateTime(booking.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {canCancel && (
              <Card>
                <CardBody>
                  <Button
                    variant="danger"
                    onClick={() => setCancelModalOpen(true)}
                    className="w-full"
                    icon={<XCircle size={18} />}
                  >
                    Cancel Booking
                  </Button>
                </CardBody>
              </Card>
            )}

            {isManager && booking.property && (
              <Card>
                <CardBody>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/properties/${booking.property.id}`)}
                    className="w-full"
                  >
                    View Property Details
                  </Button>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Booking"
      >
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              Are you sure you want to cancel booking{' '}
              <span className="font-semibold">{booking.bookingNumber}</span>?
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cancellation Reason *
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Please provide a reason for cancellation..."
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setCancelModalOpen(false);
                setCancellationReason('');
              }}
              className="flex-1"
            >
              Keep Booking
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelBooking}
              disabled={!cancellationReason}
              className="flex-1"
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setRejectionReason('');
        }}
        title="Reject Booking"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-900">
              Are you sure you want to reject booking{' '}
              <span className="font-semibold">{booking.bookingNumber}</span>?
            </p>
            <p className="text-xs text-red-800 mt-2">
              This action will notify the guest that their booking request has been declined.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason *
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setRejectModalOpen(false);
                setRejectionReason('');
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleRejectBooking}
              disabled={!rejectionReason}
              className="flex-1"
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
