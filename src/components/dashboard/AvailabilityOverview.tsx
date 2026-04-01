import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, TrendingUp, Building2 } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { PropertyDTO } from '../../types';
import { propertyService } from '../../services/propertyService';
import { availabilityService } from '../../services/availabilityService';
import { AvailabilityCalendarModal } from '../availability/AvailabilityCalendarModal';

interface PropertyAvailabilitySummary {
  property: PropertyDTO;
  availableDays: number;
  totalDays: number;
  availabilityPercentage: number;
  bookedDays: number;
  partialDays: number;
}

export const AvailabilityOverview: React.FC = () => {
  const [properties, setProperties] = useState<PropertyDTO[]>([]);
  const [availabilitySummaries, setAvailabilitySummaries] = useState<PropertyAvailabilitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<PropertyDTO | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  useEffect(() => {
    loadAvailabilityOverview();
  }, []);

  const loadAvailabilityOverview = async () => {
    try {
      setLoading(true);
      const allProperties = await propertyService.getProperties({ status: 'ACTIVE' });
      setProperties(allProperties);

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

      const summaries = await Promise.all(
        allProperties.slice(0, 8).map(async (property) => {
          try {
            const availability = await availabilityService.getPropertyAvailability(
              property.id,
              currentMonth,
              currentYear
            );

            const availableDays = availability.filter(day => day.status === 'available').length;
            const bookedDays = availability.filter(day => day.status === 'full').length;
            const partialDays = availability.filter(day => day.status === 'partial').length;

            return {
              property,
              availableDays,
              totalDays: daysInMonth,
              availabilityPercentage: Math.round((availableDays / daysInMonth) * 100),
              bookedDays,
              partialDays,
            };
          } catch (error) {
            console.error(`Failed to load availability for ${property.name}:`, error);
            return {
              property,
              availableDays: 0,
              totalDays: daysInMonth,
              availabilityPercentage: 0,
              bookedDays: 0,
              partialDays: 0,
            };
          }
        })
      );

      setAvailabilitySummaries(summaries.sort((a, b) => a.availabilityPercentage - b.availabilityPercentage));
    } catch (error) {
      console.error('Failed to load availability overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityColor = (percentage: number) => {
    if (percentage >= 70) return 'text-green-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAvailabilityBarColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getAvailabilityLabel = (percentage: number) => {
    if (percentage >= 70) return 'High Availability';
    if (percentage >= 40) return 'Moderate Availability';
    return 'Low Availability';
  };

  const handleViewCalendar = (property: PropertyDTO) => {
    setSelectedProperty(property);
    setShowCalendarModal(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar size={20} className="text-blue-600" />
            Property Availability Overview
          </h3>
        </CardHeader>
        <CardBody>
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600" />
            <p className="mt-4 text-gray-600">Loading availability...</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  const totalProperties = availabilitySummaries.length;
  const highAvailability = availabilitySummaries.filter(s => s.availabilityPercentage >= 70).length;
  const lowAvailability = availabilitySummaries.filter(s => s.availabilityPercentage < 40).length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar size={20} className="text-blue-600" />
              Property Availability Overview
            </h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-gray-600">{highAvailability} High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-gray-600">{lowAvailability} Low</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Building2 size={20} className="text-blue-600" />
                <span className="text-sm font-semibold text-gray-700">Total Properties</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{totalProperties}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={20} className="text-green-600" />
                <span className="text-sm font-semibold text-gray-700">High Availability</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{highAvailability}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={20} className="text-yellow-600" />
                <span className="text-sm font-semibold text-gray-700">Moderate</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {totalProperties - highAvailability - lowAvailability}
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={20} className="text-red-600" />
                <span className="text-sm font-semibold text-gray-700">Low Availability</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{lowAvailability}</p>
            </div>
          </div>

          <div className="space-y-3">
            {availabilitySummaries.map((summary) => (
              <div
                key={summary.property.id}
                className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{summary.property.name}</h4>
                      <span className={`text-sm font-semibold ${getAvailabilityColor(summary.availabilityPercentage)}`}>
                        {getAvailabilityLabel(summary.availabilityPercentage)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <MapPin size={14} />
                      <span>{summary.property.estate?.city || summary.property.address}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Available</span>
                        <span className="font-semibold text-green-700">{summary.availableDays} days</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Booked</span>
                        <span className="font-semibold text-red-700">{summary.bookedDays} days</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Partial</span>
                        <span className="font-semibold text-yellow-700">{summary.partialDays} days</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mt-2">
                        <div
                          className={`h-full ${getAvailabilityBarColor(summary.availabilityPercentage)} transition-all duration-500`}
                          style={{ width: `${summary.availabilityPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className={`text-center px-4 py-2 rounded-lg font-bold text-2xl ${getAvailabilityColor(summary.availabilityPercentage)} bg-white border-2`}>
                      {summary.availabilityPercentage}%
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<Calendar size={16} />}
                      onClick={() => handleViewCalendar(summary.property)}
                    >
                      View Calendar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {selectedProperty && (
        <AvailabilityCalendarModal
          isOpen={showCalendarModal}
          onClose={() => setShowCalendarModal(false)}
          property={selectedProperty}
        />
      )}
    </>
  );
};
