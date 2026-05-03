import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { SummaryStatsCard } from '../components/ui/SummaryStatsCard';
import { FilterDrawer } from '../components/ui/FilterDrawer';
import { ViewSwitcher } from '../components/ui/ViewSwitcher';
import { DataTable } from '../components/ui/DataTable';
import { ListView, ListViewItem } from '../components/ui/ListView';
import {
  Calendar, Eye, History, CheckCircle, Clock, XCircle,
  Home, Filter, MapPin, ArrowRight, CreditCard, Users,
  Building2,
} from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { BookingDTO, BookingStatus } from '../types';
import { formatDate } from '../utils/dateHelpers';
import { formatCurrency } from '../utils/formatters';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { FadeIn } from '../components/animations/FadeIn';
import { useViewPreference } from '../hooks/useViewPreference';

const PROPERTY_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&q=80',
  'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&q=80',
  'https://images.unsplash.com/photo-1444201983204-c43cbd584d93?w=400&q=80',
  'https://images.unsplash.com/photo-1455587734955-081b22074882?w=400&q=80',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80',
];

function getPropertyImage(booking: BookingDTO, idx: number): string {
  const imgs = booking.property?.images;
  if (Array.isArray(imgs) && imgs.length > 0) return imgs[0];
  if (typeof imgs === 'string') {
    try {
      const parsed = JSON.parse(imgs);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    } catch { /* ignore */ }
  }
  return PROPERTY_FALLBACK_IMAGES[idx % PROPERTY_FALLBACK_IMAGES.length];
}

function getStatusConfig(status: BookingStatus) {
  switch (status) {
    case 'REQUESTED':
      return { label: 'Requested', bg: 'bg-amber-500', border: 'border-l-amber-400', dot: 'bg-amber-400' };
    case 'PROVISIONED':
      return { label: 'Provisioned', bg: 'bg-blue-500', border: 'border-l-blue-400', dot: 'bg-blue-400' };
    case 'ALLOCATED':
      return { label: 'Upcoming', bg: 'bg-cyan-500', border: 'border-l-cyan-400', dot: 'bg-cyan-400' };
    case 'CHECKED_IN':
      return { label: 'Checked In', bg: 'bg-emerald-500', border: 'border-l-emerald-400', dot: 'bg-emerald-400' };
    case 'CHECKED_OUT':
      return { label: 'Completed', bg: 'bg-green-500', border: 'border-l-green-400', dot: 'bg-green-400' };
    case 'CANCELLED':
      return { label: 'Cancelled', bg: 'bg-red-500', border: 'border-l-red-400', dot: 'bg-red-400' };
    case 'REJECTED':
      return { label: 'Rejected', bg: 'bg-rose-500', border: 'border-l-rose-400', dot: 'bg-rose-400' };
    default:
      return { label: status, bg: 'bg-gray-500', border: 'border-l-gray-300', dot: 'bg-gray-400' };
  }
}

function calcNights(checkIn: string, checkOut: string): number {
  try {
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
  } catch {
    return 1;
  }
}

export const BookingHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const addToast = useUIStore((state) => state.addToast);
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | string[]>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useViewPreference('bookingHistoryView', 'card');
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

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
      if (Array.isArray(statusFilter)) {
        filtered = filtered.filter((b) => statusFilter.includes(b.status));
      } else {
        filtered = filtered.filter((b) => b.status === statusFilter);
      }
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

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const cancellationRate = stats.total > 0 ? Math.round((stats.cancelled / stats.total) * 100) : 0;

  const handleStatCardClick = (filter: string | string[]) => setStatusFilter(filter);
  const handleClearFilters = () => { setStatusFilter('all'); setSearchQuery(''); };
  const activeFilterCount = (statusFilter !== 'all' && statusFilter.length > 0 ? 1 : 0) + (searchQuery ? 1 : 0);

  const isFilterActive = (filterValue: string | string[]) => {
    if (filterValue === 'all') return statusFilter === 'all';
    if (Array.isArray(filterValue)) {
      return (
        Array.isArray(statusFilter) &&
        filterValue.length === statusFilter.length &&
        filterValue.every((s) => statusFilter.includes(s))
      );
    }
    return statusFilter === filterValue;
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50/20">
      <Header />

      {/* Frozen hero header */}
      <div className="flex-none bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-0.5 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <History className="w-5 h-5 text-white" />
                </div>
                Booking History
              </h1>
              <p className="text-sm text-gray-500 ml-12">View and manage your past and upcoming bookings</p>
            </div>
            <div className="flex items-center gap-3">
              <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />
              <button
                onClick={() => setIsFilterOpen(true)}
                className="relative flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-lg hover:bg-white hover:shadow-md transition-all"
              >
                <Filter size={16} />
                <span className="font-medium text-sm">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Summary stat tiles — richer layout */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryStatsCard
              label="Total Bookings"
              value={stats.total}
              icon={History}
              gradient="bg-gradient-to-br from-blue-500 to-teal-500"
              onClick={() => handleStatCardClick('all')}
              isActive={statusFilter === 'all'}
              delay={100}
              subtitle="All time reservations"
            />
            <SummaryStatsCard
              label="Upcoming"
              value={stats.upcoming}
              icon={Calendar}
              gradient="bg-gradient-to-br from-sky-500 to-blue-600"
              onClick={() => handleStatCardClick(['ALLOCATED', 'PROVISIONED'])}
              isActive={Array.isArray(statusFilter) && statusFilter.includes('ALLOCATED') && statusFilter.includes('PROVISIONED')}
              delay={150}
              subtitle="Confirmed & allocated"
            />
            <SummaryStatsCard
              label="Completed"
              value={stats.completed}
              icon={CheckCircle}
              gradient="bg-gradient-to-br from-emerald-500 to-cyan-500"
              onClick={() => handleStatCardClick('CHECKED_OUT')}
              isActive={statusFilter === 'CHECKED_OUT'}
              delay={200}
              subtitle={`${completionRate}% completion rate`}
            />
            <SummaryStatsCard
              label="Cancelled"
              value={stats.cancelled}
              icon={XCircle}
              gradient="bg-gradient-to-br from-rose-500 to-pink-500"
              onClick={() => handleStatCardClick(['CANCELLED', 'REJECTED'])}
              isActive={Array.isArray(statusFilter) && statusFilter.includes('CANCELLED') && statusFilter.includes('REJECTED')}
              delay={250}
              subtitle={`${cancellationRate}% of total`}
            />
          </div>
        </div>
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
            <Input
              type="text"
              placeholder="Booking number or property..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <div className="space-y-2">
              {[
                { value: 'all' as string | string[], label: 'All Bookings', icon: History },
                { value: 'REQUESTED' as string | string[], label: 'Requested', icon: Clock },
                { value: ['ALLOCATED', 'PROVISIONED'] as string[], label: 'Upcoming', icon: Calendar },
                { value: 'CHECKED_OUT' as string | string[], label: 'Completed', icon: CheckCircle },
                { value: ['CANCELLED', 'REJECTED'] as string[], label: 'Cancelled', icon: XCircle },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={Array.isArray(value) ? value.join('-') : value}
                  onClick={() => setStatusFilter(value)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-all ${
                    isFilterActive(value)
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

      {/* Scrollable data area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 animate-pulse flex h-36 overflow-hidden">
                  <div className="w-40 bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                  <div className="w-36 p-4 space-y-2 border-l border-gray-100">
                    <div className="h-5 bg-gray-200 rounded w-full" />
                    <div className="h-8 bg-gray-200 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredBookings.length === 0 ? (
            <FadeIn delay={200}>
              <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center shadow-sm">
                <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-semibold mb-1">No bookings found</p>
                <p className="text-sm text-gray-400">Try adjusting your filters or search query.</p>
                {activeFilterCount > 0 && (
                  <button onClick={handleClearFilters} className="mt-3 text-sm text-blue-600 hover:underline">
                    Clear filters
                  </button>
                )}
              </div>
            </FadeIn>
          ) : viewMode === 'card' ? (
            <div className="space-y-3">
              {filteredBookings.map((booking, index) => {
                const statusCfg = getStatusConfig(booking.status);
                const nights = calcNights(booking.checkInDate, booking.checkOutDate);
                const imgSrc = getPropertyImage(booking, index);
                const hasImgError = imgErrors[booking.id];

                return (
                  <FadeIn key={booking.id} delay={index * 40}>
                    <div
                      className={`bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group flex flex-col sm:flex-row border-l-4 ${statusCfg.border}`}
                      onClick={() => navigate(`/bookings/${booking.id}`)}
                    >
                      {/* Property image */}
                      <div className="relative sm:w-40 md:w-44 h-36 sm:h-auto flex-shrink-0 bg-gray-100 overflow-hidden">
                        {!hasImgError ? (
                          <img
                            src={imgSrc}
                            alt={booking.property?.name || 'Property'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                            onError={() => setImgErrors(prev => ({ ...prev, [booking.id]: true }))}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                            <Building2 size={36} className="text-gray-300" />
                          </div>
                        )}
                        {/* Status pill */}
                        <div className="absolute bottom-2 left-2">
                          <span className={`${statusCfg.bg} text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shadow-sm`}>
                            {statusCfg.label}
                          </span>
                        </div>
                      </div>

                      {/* Main details */}
                      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                        <div>
                          {/* Booking number + property */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs text-gray-400 font-medium tracking-wider">
                                  #{booking.bookingNumber}
                                </span>
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusCfg.dot}`} />
                              </div>
                              <h3 className="text-sm font-bold text-gray-900 mt-0.5 truncate flex items-center gap-1.5">
                                <Home size={13} className="text-gray-400 flex-shrink-0" />
                                {booking.property?.name || 'Property'}
                              </h3>
                              {booking.property?.city && (
                                <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                                  <MapPin size={11} />
                                  <span>{booking.property.city}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Date + nights grid */}
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Check-in</p>
                              <p className="text-xs font-bold text-gray-800 mt-0.5">{formatDate(booking.checkInDate)}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Check-out</p>
                              <p className="text-xs font-bold text-gray-800 mt-0.5">{formatDate(booking.checkOutDate)}</p>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
                              <p className="text-[10px] text-blue-400 uppercase tracking-wide font-semibold">Duration</p>
                              <p className="text-xs font-bold text-blue-700 mt-0.5">{nights} night{nights !== 1 ? 's' : ''}</p>
                            </div>
                          </div>
                        </div>

                        {/* Room type + guest */}
                        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                          {booking.roomType?.name && (
                            <span className="flex items-center gap-1">
                              <Home size={11} className="text-gray-400" />
                              {booking.roomType.name}
                            </span>
                          )}
                          {booking.quantity > 0 && (
                            <span className="flex items-center gap-1">
                              <Users size={11} className="text-gray-400" />
                              {booking.quantity} room{booking.quantity !== 1 ? 's' : ''}
                            </span>
                          )}
                          {booking.guestDetails?.name && (
                            <span className="text-gray-400 truncate">
                              Guest: {booking.guestDetails.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: amount + action */}
                      <div
                        className="flex flex-col justify-between p-4 sm:border-l border-gray-100 sm:w-40 flex-shrink-0 bg-gray-50/40"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex flex-col items-end gap-1">
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Total</p>
                          <p className="text-xl font-black text-gray-900 leading-none">
                            {formatCurrency(booking.totalAmount)}
                          </p>
                          {booking.paidAmount > 0 && booking.paidAmount < booking.totalAmount && (
                            <div className="mt-1 text-right">
                              <p className="text-[10px] text-gray-400">Paid: {formatCurrency(booking.paidAmount)}</p>
                              <p className="text-[10px] text-amber-600 font-semibold">
                                Due: {formatCurrency(booking.balanceAmount)}
                              </p>
                            </div>
                          )}
                          {booking.balanceAmount > 0 && booking.paidAmount === 0 && (
                            <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 mt-1">
                              <CreditCard size={10} />
                              Payment pending
                            </span>
                          )}
                        </div>

                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/bookings/${booking.id}`); }}
                          className="mt-3 w-full flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:shadow-md"
                        >
                          <Eye size={12} />
                          Details
                          <ArrowRight size={11} />
                        </button>
                      </div>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          ) : viewMode === 'table' ? (
            <FadeIn delay={300}>
              <DataTable
                columns={[
                  { key: 'bookingNumber', label: 'Booking #', sortable: true, width: '15%' },
                  {
                    key: 'property',
                    label: 'Property',
                    sortable: false,
                    render: (booking) => (
                      <div className="flex items-center gap-2">
                        <Building2 size={13} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate max-w-[160px]">{booking.property?.name || 'N/A'}</span>
                      </div>
                    ),
                  },
                  { key: 'checkInDate', label: 'Check-in', sortable: true, render: (b) => formatDate(b.checkInDate) },
                  { key: 'checkOutDate', label: 'Check-out', sortable: true, render: (b) => formatDate(b.checkOutDate) },
                  { key: 'roomType', label: 'Room Type', sortable: false, render: (b) => b.roomType?.name || 'N/A' },
                  {
                    key: 'status',
                    label: 'Status',
                    sortable: true,
                    render: (b) => (
                      <Badge variant={getStatusVariant(b.status)} className="text-xs">
                        {getStatusConfig(b.status).label}
                      </Badge>
                    ),
                  },
                  { key: 'totalAmount', label: 'Total', sortable: true, render: (b) => formatCurrency(b.totalAmount) },
                  {
                    key: 'actions',
                    label: '',
                    sortable: false,
                    width: '8%',
                    render: (b) => (
                      <button
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
                        onClick={(e) => { e.stopPropagation(); navigate(`/bookings/${b.id}`); }}
                      >
                        <Eye size={13} />
                      </button>
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
                    subtitle={`${booking.property?.name} • ${formatDate(booking.checkInDate)} → ${formatDate(booking.checkOutDate)}`}
                    badge={
                      <Badge variant={getStatusVariant(booking.status)} className="text-xs">
                        {getStatusConfig(booking.status).label}
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
    </div>
  );
};
