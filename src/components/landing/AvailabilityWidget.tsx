import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Building2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { AvailabilityCalendarModal } from '../availability/AvailabilityCalendarModal';
import { PropertyDTO } from '../../types';
import { propertyService } from '../../services/propertyService';
import { availabilityService } from '../../services/availabilityService';
import { useAuthStore } from '../../stores/authStore';
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
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Check Property Availability</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            View real-time availability for our featured facilities
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {availabilitySummaries.map((summary) => (
            <div
              key={summary.property.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
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
                  <h3 className="text-xs font-bold text-gray-900 flex-1 line-clamp-1">
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

                <div className="flex gap-1.5">
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
