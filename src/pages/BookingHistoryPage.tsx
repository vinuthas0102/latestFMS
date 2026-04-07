import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { SummaryStatsCard } from '../components/ui/SummaryStatsCard';
import { FilterDrawer } from '../components/ui/FilterDrawer';
import { ViewSwitcher, ViewMode } from '../components/ui/ViewSwitcher';
import { DataTable, Column } from '../components/ui/DataTable';
import { ListView, ListViewItem } from '../components/ui/ListView';
import { Calendar, MapPin, Eye, History, CheckCircle, Clock, XCircle, Home, ChevronDown, ChevronUp, Filter, RotateCcw } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { BookingDTO, BookingStatus } from '../types';
import { formatDate } from '../utils/dateHelpers';
import { formatCurrency } from '../utils/formatters';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { FadeIn } from '../components/animations/FadeIn';
import { useViewPreference } from '../hooks/useViewPreference';

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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useViewPreference('bookingHistoryView', 'card');

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

  const handleStatCardClick = (filter: string) => {
    setStatusFilter(filter);
  };

  const handleClearFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
  };

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/20">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FadeIn delay={0}>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <History className="w-7 h-7 text-white" />
                </div>
                Booking History
              </h1>
              <p className="text-gray-600">View and manage your past and upcoming bookings</p>
            </div>
            <div className="flex items-center gap-3">
              <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />
              <button
                onClick={() => setIsFilterOpen(true)}
                className="relative flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-lg hover:bg-white hover:shadow-md transition-all"
              >
                <Filter size={18} />
                <span className="font-medium text-sm">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <SummaryStatsCard
            label="Total Bookings"
            value={stats.total}
            icon={History}
            gradient="pastel-blue-gradient"
            onClick={() => handleStatCardClick('all')}
            isActive={statusFilter === 'all'}
            delay={100}
          />
          <SummaryStatsCard
            label="Upcoming"
            value={stats.upcoming}
            icon={Calendar}
            gradient="pastel-cyan-gradient"
            onClick={() => handleStatCardClick('ALLOCATED')}
            isActive={statusFilter === 'ALLOCATED'}
            delay={150}
          />
          <SummaryStatsCard
            label="Completed"
            value={stats.completed}
            icon={CheckCircle}
            gradient="pastel-green-gradient"
            onClick={() => handleStatCardClick('CHECKED_OUT')}
            isActive={statusFilter === 'CHECKED_OUT'}
            delay={200}
          />
          <SummaryStatsCard
            label="Cancelled"
            value={stats.cancelled}
            icon={XCircle}
            gradient="pastel-coral-gradient"
            onClick={() => handleStatCardClick('CANCELLED')}
            isActive={statusFilter === 'CANCELLED'}
            delay={250}
          />
        </div>

        <FilterDrawer
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          title="Booking Filters"
          onClearAll={handleClearFilters}
          activeFilterCount={activeFilterCount}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search
              </label>
              <Input
                type="text"
                placeholder="Booking number or property..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All Bookings', icon: History },
                  { value: 'REQUESTED', label: 'Requested', icon: Clock },
                  { value: 'ALLOCATED', label: 'Upcoming', icon: Calendar },
                  { value: 'CHECKED_OUT', label: 'Completed', icon: CheckCircle },
                  { value: 'CANCELLED', label: 'Cancelled', icon: XCircle },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setStatusFilter(value)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-all ${
                      statusFilter === value
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium text-sm">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </FilterDrawer>

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
        ) : viewMode === 'card' ? (
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
        ) : viewMode === 'table' ? (
          <FadeIn delay={300}>
            <DataTable
              columns={[
                {
                  key: 'bookingNumber',
                  label: 'Booking #',
                  sortable: true,
                  width: '15%',
                },
                {
                  key: 'property',
                  label: 'Property',
                  sortable: false,
                  render: (booking) => booking.property?.name || 'N/A',
                },
                {
                  key: 'checkInDate',
                  label: 'Check-in',
                  sortable: true,
                  render: (booking) => formatDate(booking.checkInDate),
                },
                {
                  key: 'checkOutDate',
                  label: 'Check-out',
                  sortable: true,
                  render: (booking) => formatDate(booking.checkOutDate),
                },
                {
                  key: 'roomType',
                  label: 'Room Type',
                  sortable: false,
                  render: (booking) => booking.roomType?.name || 'N/A',
                },
                {
                  key: 'status',
                  label: 'Status',
                  sortable: true,
                  render: (booking) => (
                    <Badge variant={getStatusVariant(booking.status)} className="text-xs">
                      {booking.status}
                    </Badge>
                  ),
                },
                {
                  key: 'totalAmount',
                  label: 'Total',
                  sortable: true,
                  render: (booking) => formatCurrency(booking.totalAmount),
                },
                {
                  key: 'actions',
                  label: 'Actions',
                  sortable: false,
                  width: '10%',
                  render: (booking) => (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/bookings/${booking.id}`);
                      }}
                    >
                      <Eye size={14} />
                    </Button>
                  ),
                },
              ]}
              data={filteredBookings}
              keyExtractor={(booking) => booking.id}
              onRowClick={(booking) => navigate(`/bookings/${booking.id}`)}
              emptyMessage="No bookings found"
            />
          </FadeIn>
        ) : (
          <FadeIn delay={300}>
            <ListView emptyMessage="No bookings found">
              {filteredBookings.map((booking) => (
                <ListViewItem
                  key={booking.id}
                  icon={<Calendar size={18} />}
                  title={booking.bookingNumber}
                  subtitle={`${booking.property?.name} • ${formatDate(booking.checkInDate)} to ${formatDate(booking.checkOutDate)}`}
                  badge={
                    <Badge variant={getStatusVariant(booking.status)} className="text-xs">
                      {booking.status}
                    </Badge>
                  }
                  rightContent={
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(booking.totalAmount)}</p>
                      <p className="text-xs text-gray-500">{booking.roomType?.name}</p>
                    </div>
                  }
                  onClick={() => navigate(`/bookings/${booking.id}`)}
                />
              ))}
            </ListView>
          </FadeIn>
        )}
      </div>
    </div>
  );
};
