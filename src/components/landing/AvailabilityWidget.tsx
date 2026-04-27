import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Building2, Eye } from 'lucide-react';
import { ViewSwitcher } from '../ui/ViewSwitcher';
import { AvailabilityCalendarModal } from '../availability/AvailabilityCalendarModal';
import { PropertyDTO } from '../../types';
import { propertyService } from '../../services/propertyService';
import { availabilityService } from '../../services/availabilityService';
import { useAuthStore } from '../../stores/authStore';
import { useViewPreference } from '../../hooks/useViewPreference';
import { requiresLoginForBooking, getBookingButtonText, getModuleBadgeText, getModuleBadgeStyles } from '../../utils/moduleHelpers';
import { ROUTES } from '../../constants/routes';

interface PropertyAvailabilitySummary {
  property: PropertyDTO;
  availableDays: number;
  totalDays: number;
  availabilityPercentage: number;
  nextAvailableDate: string | null;
}

export const AvailabilityWidget: React.FC<{ className?: string }> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [_properties, setProperties] = useState<PropertyDTO[]>([]);
  const [availabilitySummaries, setAvailabilitySummaries] = useState<PropertyAvailabilitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<PropertyDTO | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [viewMode, setViewMode] = useViewPreference('viewMode_availability', 'card');

  useEffect(() => {
    loadPropertiesWithAvailability();
  }, []);

  const loadPropertiesWithAvailability = async () => {
    try {
      setLoading(true);
      const allProperties = await propertyService.getProperties({ status: 'ACTIVE' });

      const featuredProperties = allProperties.filter(p => p.latitude && p.longitude).slice(0, 6);
      setProperties(featuredProperties);

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

      const summaries = await Promise.all(
        featuredProperties.map(async (property) => {
          try {
            const availability = await availabilityService.getPropertyAvailability(
              property.id,
              currentMonth,
              currentYear
            );

            const availableDays = availability.filter(day => day.status === 'available').length;
            const nextAvailable = availability.find(day =>
              day.status === 'available' && new Date(day.date) >= currentDate
            );

            return {
              property,
              availableDays,
              totalDays: daysInMonth,
              availabilityPercentage: Math.round((availableDays / daysInMonth) * 100),
              nextAvailableDate: nextAvailable?.date || null,
            };
          } catch (error) {
            console.error(`Failed to load availability for ${property.name}:`, error);
            return {
              property,
              availableDays: 0,
              totalDays: daysInMonth,
              availabilityPercentage: 0,
              nextAvailableDate: null,
            };
          }
        })
      );

      setAvailabilitySummaries(summaries);
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-100 text-green-800 border-green-200';
    if (percentage >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getAvailabilityBarColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleViewCalendar = (property: PropertyDTO) => {
    setSelectedProperty(property);
    setShowCalendarModal(true);
  };

  const handleBookNow = (property: PropertyDTO) => {
    const moduleCode = property.module?.code;
    const needsLogin = requiresLoginForBooking(moduleCode);

    if (needsLogin && !user) {
      navigate(`${ROUTES.LOGIN}?returnUrl=/properties/${property.id}?tab=booking`);
      return;
    }
    navigate(`/properties/${property.id}?tab=booking`);
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
          <p className="mt-4 text-gray-600">Loading availability...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">Check Property Availability</h2>
            <p className="text-lg text-gray-600">View real-time availability for our featured facilities</p>
          </div>
          <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />
        </div>

        {viewMode === 'card' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {availabilitySummaries.map((summary) => (
              <div
                key={summary.property.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
                onClick={() => navigate(`/properties/${summary.property.id}`)}
              >
                <div className="h-28 bg-gradient-to-br from-blue-400 to-teal-400 relative overflow-hidden">
                  {summary.property.images && summary.property.images.length > 0 ? (
                    <img
                      src={summary.property.images[0]}
                      alt={summary.property.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Building2 size={32} className="text-white opacity-50" />
                    </div>
                  )}
                  <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-xs font-semibold border ${getAvailabilityColor(summary.availabilityPercentage)}`}>
                    {summary.availabilityPercentage}%
                  </div>
                </div>

                <div className="p-2.5">
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <h3 className="text-xs font-bold text-gray-900 flex-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {summary.property.name}
                    </h3>
                    {getModuleBadgeText(summary.property.module?.code) && (
                      <span className={`px-1.5 py-0.5 rounded text-xs font-semibold border whitespace-nowrap ${getModuleBadgeStyles(summary.property.module?.code)}`}>
                        {getModuleBadgeText(summary.property.module?.code)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                    <MapPin size={11} />
                    <span className="truncate">{summary.property.estate?.city || summary.property.address}</span>
                  </div>

                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">This Month</span>
                      <span className="font-semibold text-gray-900">
                        {summary.availableDays}/{summary.totalDays}d
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full ${getAvailabilityBarColor(summary.availabilityPercentage)} transition-all duration-500`}
                        style={{ width: `${summary.availabilityPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white py-1 rounded font-semibold transition-colors"
                      onClick={() => handleBookNow(summary.property)}
                    >
                      Book
                    </button>
                    <button
                      className="flex-1 text-xs border border-gray-300 hover:bg-gray-50 text-gray-700 py-1 rounded font-medium transition-colors"
                      onClick={() => handleViewCalendar(summary.property)}
                    >
                      Cal
                    </button>
                    <button
                      className="flex-1 text-xs border border-gray-300 hover:bg-gray-50 text-gray-700 py-1 rounded font-medium transition-colors"
                      onClick={() => navigate(`/properties/${summary.property.id}`)}
                    >
                      Info
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'list' ? (
          <div className="flex flex-col gap-2">
            {availabilitySummaries.map((summary) => (
              <div
                key={summary.property.id}
                className="bg-white rounded-lg border border-gray-200 flex items-center gap-3 p-3 hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer group"
                onClick={() => navigate(`/properties/${summary.property.id}`)}
              >
                <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                  {summary.property.images && summary.property.images.length > 0 ? (
                    <img src={summary.property.images[0]} alt={summary.property.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 size={20} className="text-gray-300" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate mb-0.5">
                    {summary.property.name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1.5">
                    <MapPin size={11} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{summary.property.estate?.city || summary.property.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 max-w-[120px] bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full ${getAvailabilityBarColor(summary.availabilityPercentage)} transition-all duration-500`}
                        style={{ width: `${summary.availabilityPercentage}%` }}
                      />
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-semibold border ${getAvailabilityColor(summary.availabilityPercentage)}`}>
                      {summary.availabilityPercentage}% ({summary.availableDays}/{summary.totalDays}d)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleViewCalendar(summary.property)}
                    className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
                    title="View calendar"
                  >
                    <Calendar size={13} />
                  </button>
                  <button
                    onClick={() => navigate(`/properties/${summary.property.id}`)}
                    className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
                    title="View details"
                  >
                    <Eye size={13} />
                  </button>
                  <button
                    onClick={() => handleBookNow(summary.property)}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 rounded text-xs font-semibold transition-colors"
                  >
                    <Calendar size={11} />
                    {getBookingButtonText(summary.property.module?.code, !!user)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2.5 w-10"></th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Name</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden sm:table-cell">Module</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden lg:table-cell">Location</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden md:table-cell">Availability</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {availabilitySummaries.map((summary, index) => (
                    <tr
                      key={summary.property.id}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/properties/${summary.property.id}`)}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <td className="px-3 py-2.5 w-10">
                        <div className="w-9 h-9 rounded-md overflow-hidden bg-gray-100">
                          {summary.property.images && summary.property.images.length > 0 ? (
                            <img src={summary.property.images[0]} alt={summary.property.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Building2 size={16} className="text-gray-300" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {summary.property.name}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 hidden sm:table-cell">
                        {summary.property.module && (
                          <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                            {summary.property.module.name}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin size={11} className="text-gray-400 flex-shrink-0" />
                          <span className="truncate max-w-[140px]">{summary.property.estate?.city || summary.property.address}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full ${getAvailabilityBarColor(summary.availabilityPercentage)}`}
                              style={{ width: `${summary.availabilityPercentage}%` }}
                            />
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-semibold border ${getAvailabilityColor(summary.availabilityPercentage)}`}>
                            {summary.availabilityPercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => handleViewCalendar(summary.property)}
                            className="p-1.5 rounded border border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                            title="View calendar"
                          >
                            <Calendar size={13} />
                          </button>
                          <button
                            onClick={() => navigate(`/properties/${summary.property.id}`)}
                            className="p-1.5 rounded border border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                            title="View details"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => handleBookNow(summary.property)}
                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-semibold transition-colors"
                          >
                            <Calendar size={11} />
                            <span className="hidden sm:inline">{getBookingButtonText(summary.property.module?.code, !!user)}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedProperty && (
        <AvailabilityCalendarModal
          isOpen={showCalendarModal}
          onClose={() => setShowCalendarModal(false)}
          property={selectedProperty}
          onDateSelect={(date) => {
            navigate(`/properties/${selectedProperty.id}?checkIn=${date}`);
          }}
        />
      )}
    </>
  );
};
