import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { SummaryStatsCard } from '../components/ui/SummaryStatsCard';
import { FilterDrawer } from '../components/ui/FilterDrawer';
import { ViewSwitcher } from '../components/ui/ViewSwitcher';
import { MandatorySearchBar } from '../components/ui/MandatorySearchBar';
import { DataTable } from '../components/ui/DataTable';
import { ListView, ListViewItem } from '../components/ui/ListView';
import SplitLayout from '../components/ui/SplitLayout';
import {
  Calendar, Eye, History, CheckCircle, XCircle,
  Home, ChevronRight, Building2,
} from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { BookingDTO, BookingStatus } from '../types';
import { formatDate } from '../utils/dateHelpers';
import { formatCurrency } from '../utils/formatters';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { FadeIn } from '../components/animations/FadeIn';
import { useViewPreference } from '../hooks/useViewPreference';
import { BookingCardItem } from '../components/booking/BookingCardItem';
import { BookingDetailPanel } from '../components/booking/BookingDetailPanel';
import { getBookingStatusConfig } from '../utils/bookingFormatters';

export const BookingHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const addToast = useUIStore((state) => state.addToast);
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | string[]>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewMode, setViewMode] = useViewPreference('bookingHistoryView', 'list');
  const [selectedBooking, setSelectedBooking] = useState<BookingDTO | null>(null);
  const [activeServiceCounts, setActiveServiceCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadBookings();
    const status = searchParams.get('status');
    if (status === 'upcoming') setStatusFilter(['ALLOCATED', 'PROVISIONED']);
    else if (status === 'cancelled') setStatusFilter(['CANCELLED', 'REJECTED']);
    else if (status === 'completed') setStatusFilter('CHECKED_OUT');
  }, []);

  useEffect(() => { filterBookings(); }, [bookings, statusFilter, searchQuery, dateFrom, dateTo]);

  const loadBookings = async () => {
    try {
      const data = await bookingService.getBookings({ userId: user!.id });
      setBookings(data);
    } catch {
      addToast('Failed to load booking history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;
    if (statusFilter !== 'all') {
      if (Array.isArray(statusFilter)) filtered = filtered.filter(b => statusFilter.includes(b.status));
      else filtered = filtered.filter(b => b.status === statusFilter);
    }
    if (searchQuery.trim()) {
      filtered = filtered.filter(b =>
        b.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.property?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (dateFrom) filtered = filtered.filter(b => new Date(b.checkInDate) >= new Date(dateFrom));
    if (dateTo) filtered = filtered.filter(b => new Date(b.checkOutDate) <= new Date(dateTo));
    setFilteredBookings(filtered);
  };

  const getStatusVariant = (status: BookingStatus): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'CHECKED_IN': case 'CHECKED_OUT': return 'success';
      case 'REQUESTED': case 'PROVISIONED': return 'warning';
      case 'CANCELLED': case 'REJECTED': return 'error';
      default: return 'info';
    }
  };

  const stats = {
    total: bookings.length,
    upcoming: bookings.filter(b => ['ALLOCATED', 'PROVISIONED'].includes(b.status)).length,
    checkedIn: bookings.filter(b => b.status === 'CHECKED_IN').length,
    completed: bookings.filter(b => b.status === 'CHECKED_OUT').length,
    cancelled: bookings.filter(b => ['CANCELLED', 'REJECTED'].includes(b.status)).length,
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const cancellationRate = stats.total > 0 ? Math.round((stats.cancelled / stats.total) * 100) : 0;
  const handleClearFilters = () => { setStatusFilter('all'); setSearchQuery(''); setDateFrom(''); setDateTo(''); };
  const drawerActiveCount = (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);
  const propertyNames = Array.from(new Set(bookings.map(b => b.property?.name).filter(Boolean))) as string[];
  const activeFilterCount = (statusFilter !== 'all' && statusFilter.length > 0 ? 1 : 0) + (searchQuery ? 1 : 0) + drawerActiveCount;

  const statusLabel = (() => {
    if (statusFilter === 'all') return null;
    if (Array.isArray(statusFilter)) {
      if (statusFilter.includes('ALLOCATED')) return 'Upcoming';
      if (statusFilter.includes('CANCELLED')) return 'Cancelled';
      return null;
    }
    if (statusFilter === 'CHECKED_IN') return 'Checked In';
    return getBookingStatusConfig(statusFilter as BookingStatus).label;
  })();

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50/20">
      {/* Frozen header */}
      <div className="flex-none bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm z-20">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2 flex-wrap">
            <button onClick={() => navigate('/dashboard')} className="hover:text-blue-600 transition-colors"><Home size={11} /></button>
            <ChevronRight size={10} />
            <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-blue-600 transition-colors">My Workspace</button>
            <ChevronRight size={10} />
            <button onClick={() => { setSelectedBooking(null); setStatusFilter('all'); }} className="text-gray-600 font-medium hover:text-blue-600 transition-colors">
              My Bookings
            </button>
            {statusLabel && (
              <>
                <ChevronRight size={10} />
                <button onClick={() => setSelectedBooking(null)} className="text-gray-700 font-medium hover:text-blue-600 transition-colors">{statusLabel}</button>
              </>
            )}
            {selectedBooking && (
              <>
                <ChevronRight size={10} />
                <span className="font-mono text-gray-700 font-medium truncate max-w-[140px]">#{selectedBooking.bookingNumber}</span>
              </>
            )}
          </div>

          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                <History className="w-4 h-4 text-white" />
              </div>
              Booking History
            </h1>
            <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />
          </div>

          <MandatorySearchBar
            fields={[
              {
                key: 'search', label: 'Search', type: 'text',
                placeholder: 'Booking number or property...', value: searchQuery, onChange: setSearchQuery,
                icon: <History size={14} />,
              },
              {
                key: 'status', label: 'Status', type: 'chips',
                value: Array.isArray(statusFilter)
                  ? (statusFilter.includes('ALLOCATED') ? 'upcoming' : statusFilter.includes('CANCELLED') ? 'cancelled' : 'all')
                  : statusFilter === 'CHECKED_OUT' ? 'completed' : statusFilter === 'REQUESTED' ? 'REQUESTED' : statusFilter,
                onChange: (v) => {
                  if (v === 'all') setStatusFilter('all');
                  else if (v === 'upcoming') setStatusFilter(['ALLOCATED', 'PROVISIONED']);
                  else if (v === 'completed') setStatusFilter('CHECKED_OUT');
                  else if (v === 'cancelled') setStatusFilter(['CANCELLED', 'REJECTED']);
                  else setStatusFilter(v);
                  setSelectedBooking(null);
                },
                options: [
                  { value: 'all', label: 'All' },
                  { value: 'upcoming', label: 'Upcoming' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                  { value: 'REQUESTED', label: 'Requested' },
                ],
              },
            ]}
            filterCount={drawerActiveCount}
            onFilterOpen={() => setIsFilterOpen(true)}
            className="mb-3"
          />

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <SummaryStatsCard label="My Bookings" value={stats.total} icon={History} gradient="bg-gradient-to-br from-blue-600 to-teal-500" onClick={() => { setStatusFilter('all'); setSelectedBooking(null); }} isActive={statusFilter === 'all'} delay={100} subtitle="All time" secondaryValue={stats.upcoming} secondaryLabel="Active" />
            <SummaryStatsCard label="Upcoming" value={stats.upcoming} icon={Calendar} gradient="bg-gradient-to-br from-sky-500 to-blue-600" onClick={() => { setStatusFilter(['ALLOCATED', 'PROVISIONED']); setSelectedBooking(null); }} isActive={Array.isArray(statusFilter) && statusFilter.includes('ALLOCATED')} delay={130} subtitle="Confirmed & allocated" secondaryValue={bookings.filter(b => b.status === 'PROVISIONED').length} secondaryLabel="Pending" />
            <SummaryStatsCard label="Checked In" value={stats.checkedIn} icon={CheckCircle} gradient="bg-gradient-to-br from-amber-500 to-orange-500" onClick={() => { setStatusFilter('CHECKED_IN'); setSelectedBooking(null); }} isActive={statusFilter === 'CHECKED_IN'} delay={160} subtitle="Currently staying" />
            <SummaryStatsCard label="Completed" value={stats.completed} icon={CheckCircle} gradient="bg-gradient-to-br from-emerald-500 to-cyan-500" onClick={() => { setStatusFilter('CHECKED_OUT'); setSelectedBooking(null); }} isActive={statusFilter === 'CHECKED_OUT'} delay={190} subtitle={`${completionRate}% completion`} trend={completionRate > 50 ? completionRate - 50 : -(50 - completionRate)} />
            <SummaryStatsCard label="Cancelled" value={stats.cancelled} icon={XCircle} gradient="bg-gradient-to-br from-rose-500 to-pink-500" onClick={() => { setStatusFilter(['CANCELLED', 'REJECTED']); setSelectedBooking(null); }} isActive={Array.isArray(statusFilter) && statusFilter.includes('CANCELLED')} delay={220} subtitle={`${cancellationRate}% of total`} secondaryValue={bookings.filter(b => b.status === 'REJECTED').length} secondaryLabel="Rejected" />
          </div>
        </div>
      </div>

      {/* Advanced filter drawer */}
      <FilterDrawer isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Advanced Filters" activeFilterCount={drawerActiveCount} onClearAll={() => { setDateFrom(''); setDateTo(''); }}>
        <div className="space-y-6">
          {propertyNames.length > 1 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Property</label>
              <select value={typeof searchQuery === 'string' && propertyNames.some(n => searchQuery === n) ? searchQuery : ''} onChange={e => setSearchQuery(e.target.value)} className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all">
                <option value="">All Properties</option>
                {propertyNames.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Check-in From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Check-out To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} min={dateFrom || undefined} className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
          </div>
        </div>
      </FilterDrawer>

      {/* Split-screen data area */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 h-full py-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 animate-pulse flex h-28 overflow-hidden">
                  <div className="w-40 bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 p-4 space-y-3"><div className="h-4 bg-gray-200 rounded w-1/3" /><div className="h-3 bg-gray-200 rounded w-1/2" /></div>
                </div>
              ))}
            </div>
          ) : (
            <SplitLayout
              storageKey="bhSplit"
              defaultSplit={65}
              minLeft={40}
              maxLeft={80}
              onClose={() => setSelectedBooking(null)}
              right={selectedBooking ? (
                <BookingDetailPanel
                  booking={selectedBooking}
                  userId={user!.id}
                  onClose={() => setSelectedBooking(null)}
                  onNavigate={(id) => navigate(`/bookings/${id}`)}
                  onServiceCountChange={(count) => setActiveServiceCounts(prev => ({ ...prev, [selectedBooking.id]: count }))}
                />
              ) : null}
              left={
                <div className="pr-1">
                  {filteredBookings.length === 0 ? (
                    <FadeIn delay={200}>
                      <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center shadow-sm">
                        <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600 font-semibold mb-1">No bookings found</p>
                        <p className="text-sm text-gray-400">Try adjusting your filters or search query.</p>
                        {activeFilterCount > 0 && <button onClick={handleClearFilters} className="mt-3 text-sm text-blue-600 hover:underline">Clear filters</button>}
                      </div>
                    </FadeIn>
                  ) : viewMode === 'card' ? (
                    <div className="space-y-3 pr-2">
                      {filteredBookings.map((booking, index) => (
                        <BookingCardItem
                          key={booking.id}
                          booking={booking}
                          index={index}
                          isSelected={selectedBooking?.id === booking.id}
                          onClick={() => setSelectedBooking(booking)}
                          activeServiceCount={activeServiceCounts[booking.id] ?? 0}
                        />
                      ))}
                    </div>
                  ) : viewMode === 'table' ? (
                    <FadeIn delay={300}>
                      <DataTable
                        columns={[
                          { key: 'bookingNumber', label: 'Booking #', sortable: true, width: '15%' },
                          { key: 'property', label: 'Property', sortable: false, render: b => <div className="flex items-center gap-2"><Building2 size={13} className="text-gray-400 flex-shrink-0" /><span className="truncate max-w-[160px]">{b.property?.name || 'N/A'}</span></div> },
                          { key: 'checkInDate', label: 'Check-in', sortable: true, render: b => formatDate(b.checkInDate) },
                          { key: 'checkOutDate', label: 'Check-out', sortable: true, render: b => formatDate(b.checkOutDate) },
                          { key: 'roomType', label: 'Room Type', sortable: false, render: b => b.roomType?.name || 'N/A' },
                          { key: 'status', label: 'Status', sortable: true, render: b => <Badge variant={getStatusVariant(b.status)} className="text-xs">{getBookingStatusConfig(b.status).label}</Badge> },
                          { key: 'totalAmount', label: 'Total', sortable: true, render: b => formatCurrency(b.totalAmount) },
                          {
                            key: 'actions', label: '', sortable: false, width: '8%',
                            render: b => (
                              <button className={`p-1.5 rounded-lg border transition-colors ${selectedBooking?.id === b.id ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200'}`} onClick={e => { e.stopPropagation(); setSelectedBooking(b); }}>
                                <Eye size={13} />
                              </button>
                            ),
                          },
                        ]}
                        data={filteredBookings}
                        keyExtractor={b => b.id}
                        onRowClick={b => setSelectedBooking(b)}
                        emptyMessage="No bookings found"
                      />
                    </FadeIn>
                  ) : (
                    <FadeIn delay={300}>
                      <ListView emptyMessage="No bookings found">
                        {filteredBookings.map(booking => (
                          <div
                            key={booking.id}
                            onClick={() => setSelectedBooking(booking)}
                            className={`cursor-pointer rounded-xl transition-all ${selectedBooking?.id === booking.id ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
                          >
                            <ListViewItem
                              icon={<Calendar size={18} />}
                              title={`#${booking.bookingNumber}`}
                              subtitle={`${booking.property?.name ?? ''} · ${formatDate(booking.checkInDate)} → ${formatDate(booking.checkOutDate)}`}
                              badge={<Badge variant={getStatusVariant(booking.status)} className="text-xs">{getBookingStatusConfig(booking.status).label}</Badge>}
                              rightContent={
                                <div className="text-right">
                                  <p className="text-sm font-bold text-gray-900">{formatCurrency(booking.totalAmount)}</p>
                                  <p className="text-xs text-gray-500">{booking.roomType?.name}</p>
                                </div>
                              }
                              onClick={() => setSelectedBooking(booking)}
                            />
                          </div>
                        ))}
                      </ListView>
                    </FadeIn>
                  )}
                </div>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};
