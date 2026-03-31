import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { HorizontalSlider } from '../components/ui/HorizontalSlider';
import { Calendar, MapPin, Eye, History, CheckCircle, Clock, XCircle, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { BookingDTO, BookingStatus } from '../types';
import { formatDate } from '../utils/dateHelpers';
import { formatCurrency } from '../utils/formatters';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { FadeIn } from '../components/animations/FadeIn';
import { CountUp } from '../components/animations/CountUp';

export const BookingHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const addToast = useUIStore((state) => state.addToast);
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, statusFilter, searchQuery]);

  const loadBookings = async () => {
    try {
      const data = await bookingService.getBookings({ userId: user!.id });
      setBookings(data);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      addToast('Failed to load booking history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (b) =>
          b.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.property?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredBookings(filtered);
  };

  const getStatusVariant = (status: BookingStatus): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'CHECKED_IN':
      case 'CHECKED_OUT':
        return 'success';
      case 'REQUESTED':
      case 'PROVISIONED':
        return 'warning';
      case 'CANCELLED':
      case 'REJECTED':
        return 'error';
      case 'ALLOCATED':
        return 'info';
      default:
        return 'info';
    }
  };

  const stats = {
    total: bookings.length,
    upcoming: bookings.filter((b) => ['ALLOCATED', 'PROVISIONED'].includes(b.status)).length,
    completed: bookings.filter((b) => b.status === 'CHECKED_OUT').length,
    cancelled: bookings.filter((b) => ['CANCELLED', 'REJECTED'].includes(b.status)).length,
  };

  const statusFilterItems = [
    { id: 'all', label: 'All', icon: <History size={14} />, color: 'blue' },
    { id: 'REQUESTED', label: 'Requested', icon: <Clock size={14} />, color: 'yellow' },
    { id: 'ALLOCATED', label: 'Upcoming', icon: <Calendar size={14} />, color: 'cyan' },
    { id: 'CHECKED_OUT', label: 'Completed', icon: <CheckCircle size={14} />, color: 'green' },
    { id: 'CANCELLED', label: 'Cancelled', icon: <XCircle size={14} />, color: 'coral' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/20">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FadeIn delay={0}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <History className="w-7 h-7 text-white" />
              </div>
              Booking History
            </h1>
            <p className="text-gray-600">View and manage your past and upcoming bookings</p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <FadeIn delay={100}>
            <div className="pastel-blue-gradient rounded-xl p-4 card-interactive">
              <p className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900">
                <CountUp end={stats.total} duration={1500} />
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={150}>
            <div className="pastel-cyan-gradient rounded-xl p-4 card-interactive">
              <p className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Upcoming</p>
              <p className="text-3xl font-bold text-gray-900">
                <CountUp end={stats.upcoming} duration={1500} />
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={200}>
            <div className="pastel-green-gradient rounded-xl p-4 card-interactive">
              <p className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Completed</p>
              <p className="text-3xl font-bold text-gray-900">
                <CountUp end={stats.completed} duration={1500} />
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={250}>
            <div className="pastel-coral-gradient rounded-xl p-4 card-interactive">
              <p className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Cancelled</p>
              <p className="text-3xl font-bold text-gray-900">
                <CountUp end={stats.cancelled} duration={1500} />
              </p>
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={300}>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-sm border border-white/80 p-4 mb-6">
            <div className="mb-4">
              <Input
                type="text"
                placeholder="Search by booking number or property..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <HorizontalSlider
              items={statusFilterItems}
              selectedId={statusFilter}
              onSelect={setStatusFilter}
            />
          </div>
        </FadeIn>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <FadeIn delay={400}>
            <div className="pastel-lavender-gradient rounded-xl p-12 text-center">
              <History className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse-slow" />
              <p className="text-gray-600 font-medium">No bookings found</p>
            </div>
          </FadeIn>
        ) : (
          <div className="grid gap-3">
            {filteredBookings.map((booking, index) => {
              const isExpanded = expandedBookingId === booking.id;
              const getGradientClass = () => {
                if (booking.status === 'REQUESTED') return 'pastel-yellow-gradient';
                if (booking.status === 'CHECKED_OUT') return 'pastel-green-gradient';
                if (booking.status === 'CANCELLED' || booking.status === 'REJECTED') return 'pastel-coral-gradient';
                return 'pastel-cyan-gradient';
              };

              return (
                <FadeIn key={booking.id} delay={index * 50}>
                  <div className={`${getGradientClass()} rounded-xl p-4`}>
                    <div
                      className="cursor-pointer"
                      onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-base font-bold text-gray-900">{booking.bookingNumber}</h3>
                            <Badge variant={getStatusVariant(booking.status)} className="text-xs">
                              {booking.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Home size={14} />
                            {booking.property?.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="bg-white/40 rounded-md p-2">
                          <span className="text-xs text-gray-500">Check-in</span>
                          <p className="text-xs font-semibold text-gray-900">{formatDate(booking.checkInDate)}</p>
                        </div>
                        <div className="bg-white/40 rounded-md p-2">
                          <span className="text-xs text-gray-500">Check-out</span>
                          <p className="text-xs font-semibold text-gray-900">{formatDate(booking.checkOutDate)}</p>
                        </div>
                        <div className="bg-white/40 rounded-md p-2">
                          <span className="text-xs text-gray-500">Room Type</span>
                          <p className="text-xs font-semibold text-gray-900">{booking.roomType?.name}</p>
                        </div>
                        <div className="bg-white/40 rounded-md p-2">
                          <span className="text-xs text-gray-500">Total</span>
                          <p className="text-xs font-semibold text-gray-900">{formatCurrency(booking.totalAmount)}</p>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 space-y-2 animate-slideDown border-t border-white/60 pt-3">
                        {booking.balanceAmount > 0 && booking.status !== 'CANCELLED' && booking.status !== 'REJECTED' && (
                          <div className="bg-yellow-100/50 rounded-md p-3 border border-yellow-300/50">
                            <p className="text-xs text-yellow-800">
                              <span className="font-semibold">Balance Due:</span> {formatCurrency(booking.balanceAmount)}
                            </p>
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/bookings/${booking.id}`);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Full Details
                        </Button>
                      </div>
                    )}
                  </div>
                </FadeIn>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
