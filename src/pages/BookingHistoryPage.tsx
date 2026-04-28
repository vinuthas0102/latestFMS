import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SummaryStatsCard } from '../components/ui/SummaryStatsCard';
import { ViewSwitcher } from '../components/ui/ViewSwitcher';
import { DataTable } from '../components/ui/DataTable';
import { ListView, ListViewItem } from '../components/ui/ListView';
import { Calendar, Eye, History, CheckCircle, Clock, XCircle, Home, ChevronDown, ChevronUp, SlidersHorizontal, Search, X, RotateCcw } from 'lucide-react';
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
  const headerRef = useRef<HTMLDivElement>(null);
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | string[]>('all');
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

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFilterOpen(false); };
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleOutside);
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isFilterOpen]);

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

  const handleStatCardClick = (filter: string | string[]) => {
    setStatusFilter(filter);
  };

  const handleClearFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
  };

  const activeFilterCount = (statusFilter !== 'all' && statusFilter.length > 0 ? 1 : 0) + (searchQuery ? 1 : 0);

  const isFilterActive = (filterValue: string | string[]) => {
    if (filterValue === 'all') {
      return statusFilter === 'all';
    }
    if (Array.isArray(filterValue)) {
      return (
        Array.isArray(statusFilter) &&
        filterValue.length === statusFilter.length &&
        filterValue.every((status) => statusFilter.includes(status))
      );
    }
    return statusFilter === filterValue;
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50/20">
      <Header />

      {/* Frozen banner + filter panel */}
      <div className="flex-none z-20" ref={headerRef}>
        {/* Banner */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 overflow-hidden shadow-md">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-6 -right-6 w-40 h-40 bg-white rounded-full" />
            <div className="absolute -bottom-8 -left-8 w-60 h-60 bg-white rounded-full" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Title row */}
            <div className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-1.5 bg-white/20 rounded-lg shadow-md flex-shrink-0">
                  <History className="w-4 h-4 text-white" />
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <h1 className="text-sm font-bold text-white leading-none whitespace-nowrap">
                    Booking History
                  </h1>
                  {!loading && (
                    <span className="hidden sm:inline text-white/60 text-xs whitespace-nowrap">
                      — {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
                      {filteredBookings.length < bookings.length ? ` of ${bookings.length}` : ''}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Filter toggle */}
                <button
                  onClick={() => setIsFilterOpen((v) => !v)}
                  title="Search & Filter"
                  className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    isFilterOpen || activeFilterCount > 0
                      ? 'bg-white text-gray-800 border-white shadow-sm'
                      : 'bg-white/20 hover:bg-white/30 border-white/30 text-white'
                  }`}
                >
                  <SlidersHorizontal size={13} />
                  <span className="hidden sm:inline">Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-gray-900 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pb-2.5">
              <SummaryStatsCard
                label="Total Bookings"
                value={stats.total}
                icon={History}
                gradient="bg-gradient-to-r from-blue-500 to-teal-500"
                onClick={() => handleStatCardClick('all')}
                isActive={statusFilter === 'all'}
                delay={100}
              />
              <SummaryStatsCard
                label="Upcoming"
                value={stats.upcoming}
                icon={Calendar}
                gradient="bg-gradient-to-r from-sky-500 to-blue-600"
                onClick={() => handleStatCardClick(['ALLOCATED', 'PROVISIONED'])}
                isActive={Array.isArray(statusFilter) && statusFilter.includes('ALLOCATED') && statusFilter.includes('PROVISIONED')}
                delay={150}
              />
              <SummaryStatsCard
                label="Completed"
                value={stats.completed}
                icon={CheckCircle}
                gradient="bg-gradient-to-r from-emerald-500 to-cyan-500"
                onClick={() => handleStatCardClick('CHECKED_OUT')}
                isActive={statusFilter === 'CHECKED_OUT'}
                delay={200}
              />
              <SummaryStatsCard
                label="Cancelled"
                value={stats.cancelled}
                icon={XCircle}
                gradient="bg-gradient-to-r from-rose-500 to-pink-500"
                onClick={() => handleStatCardClick(['CANCELLED', 'REJECTED'])}
                isActive={Array.isArray(statusFilter) && statusFilter.includes('CANCELLED') && statusFilter.includes('REJECTED')}
                delay={250}
              />
            </div>
          </div>
        </div>

        {/* Collapsible filter panel */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isFilterOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="bg-white/95 backdrop-blur-md border-b border-gray-200/70 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative flex-1 min-w-[180px] max-w-sm">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Booking number or property..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-7 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>

                {/* Status chips */}
                <div className="flex items-center gap-1 flex-wrap">
                  {[
                    { value: 'all' as string | string[], label: 'All', icon: History },
                    { value: 'REQUESTED' as string | string[], label: 'Requested', icon: Clock },
                    { value: ['ALLOCATED', 'PROVISIONED'] as string[], label: 'Upcoming', icon: Calendar },
                    { value: 'CHECKED_OUT' as string | string[], label: 'Completed', icon: CheckCircle },
                    { value: ['CANCELLED', 'REJECTED'] as string[], label: 'Cancelled', icon: XCircle },
                  ].map(({ value, label, icon: Icon }) => {
                    const active = isFilterActive(value);
                    return (
                      <button
                        key={Array.isArray(value) ? value.join('-') : value}
                        onClick={() => setStatusFilter(value)}
                        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-all whitespace-nowrap ${
                          active
                            ? 'bg-gray-800 text-white border-gray-800 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <Icon size={11} />
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Clear */}
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all"
                  >
                    <RotateCcw size={11} />
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable data area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
              const getBorderClass = () => {
                if (booking.status === 'REQUESTED') return 'border-2 border-yellow-400';
                if (booking.status === 'CHECKED_OUT') return 'border-2 border-green-400';
                if (booking.status === 'CANCELLED' || booking.status === 'REJECTED') return 'border-2 border-red-400';
                if (booking.status === 'PROVISIONED') return 'border-2 border-blue-400';
                return 'border-2 border-cyan-400';
              };

              return (
                <FadeIn key={booking.id} delay={index * 50}>
                  <div className={`${getBorderClass()} bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow`}>
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
                        <div className="border border-gray-200 rounded-md p-2">
                          <span className="text-xs text-gray-500">Check-in</span>
                          <p className="text-xs font-semibold text-gray-900">{formatDate(booking.checkInDate)}</p>
                        </div>
                        <div className="border border-gray-200 rounded-md p-2">
                          <span className="text-xs text-gray-500">Check-out</span>
                          <p className="text-xs font-semibold text-gray-900">{formatDate(booking.checkOutDate)}</p>
                        </div>
                        <div className="border border-gray-200 rounded-md p-2">
                          <span className="text-xs text-gray-500">Room Type</span>
                          <p className="text-xs font-semibold text-gray-900">{booking.roomType?.name}</p>
                        </div>
                        <div className="border border-gray-200 rounded-md p-2">
                          <span className="text-xs text-gray-500">Total</span>
                          <p className="text-xs font-semibold text-gray-900">{formatCurrency(booking.totalAmount)}</p>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 space-y-2 animate-slideDown border-t border-gray-200 pt-3">
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
    </div>
  );
};
