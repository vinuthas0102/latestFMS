import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { availabilityService, DayAvailability } from '../../services/availabilityService';

interface PropertyAvailabilityCalendarProps {
  propertyId: string;
  onDateSelect?: (date: string) => void;
  selectedStartDate?: string;
  selectedEndDate?: string;
}

export const PropertyAvailabilityCalendar: React.FC<PropertyAvailabilityCalendarProps> = ({
  propertyId,
  onDateSelect,
  selectedStartDate,
  selectedEndDate,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAvailability();
  }, [propertyId, currentMonth, currentYear]);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const data = await availabilityService.getPropertyAvailability(
        propertyId,
        currentMonth,
        currentYear
      );
      setAvailability(data);
    } catch (error) {
      console.error('Failed to load availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('default', {
    month: 'long',
  });

  const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 hover:bg-green-200 text-green-800';
      case 'partial':
        return 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800';
      case 'full':
        return 'bg-red-100 hover:bg-red-200 text-red-800';
      case 'blocked':
        return 'bg-gray-200 hover:bg-gray-300 text-gray-600';
      default:
        return 'bg-gray-50 hover:bg-gray-100 text-gray-400';
    }
  };

  const isDateSelected = (date: string) => {
    if (!selectedStartDate || !selectedEndDate) return false;
    return date >= selectedStartDate && date <= selectedEndDate;
  };

  const getDayInfo = (day: number): DayAvailability | undefined => {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return availability.find((a) => a.date === dateStr);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Calendar size={24} className="text-blue-600" />
          Availability Calendar
        </h3>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handlePreviousMonth}>
            <ChevronLeft size={20} />
          </Button>
          <span className="text-lg font-medium text-gray-900 min-w-40 text-center">
            {monthName} {currentYear}
          </span>
          <Button variant="ghost" size="sm" onClick={handleNextMonth}>
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 rounded border border-green-300" />
          <span className="text-gray-700">Fully Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 rounded border border-yellow-300" />
          <span className="text-gray-700">Partially Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 rounded border border-red-300" />
          <span className="text-gray-700">Fully Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded border border-gray-400" />
          <span className="text-gray-700">Blocked (Special Dates)</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center font-semibold text-gray-700 py-2 text-sm">
              {day}
            </div>
          ))}

          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayInfo = getDayInfo(day);
            const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = isDateSelected(dateStr);
            const isPast = new Date(dateStr) < new Date(new Date().toDateString());

            return (
              <button
                key={day}
                onClick={() => onDateSelect && !isPast && onDateSelect(dateStr)}
                disabled={isPast}
                className={`
                  aspect-square rounded-lg border-2 transition-all duration-200
                  flex flex-col items-center justify-center
                  ${dayInfo ? getStatusColor(dayInfo.status) : 'bg-gray-50 text-gray-400'}
                  ${isSelected ? 'border-blue-600 ring-2 ring-blue-200' : 'border-transparent'}
                  ${isPast ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                  ${!isPast && 'hover:scale-105 hover:shadow-md'}
                `}
                title={
                  dayInfo
                    ? `${dayInfo.availableRooms} of ${dayInfo.totalRooms} rooms available`
                    : 'Loading...'
                }
              >
                <span className="font-semibold">{day}</span>
                {dayInfo && (
                  <span className="text-xs mt-1">
                    {dayInfo.availableRooms}/{dayInfo.totalRooms}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
