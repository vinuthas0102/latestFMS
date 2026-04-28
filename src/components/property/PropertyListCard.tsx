import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Building2,
  Wifi,
  Car,
  Utensils,
  Waves,
  Wind,
  CheckCircle,
  ChevronRight,
  Users,
  BedDouble,
} from 'lucide-react';
import { PropertyDTO } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { requiresLoginForBooking, getModuleBadgeText, getModuleBadgeStyles } from '../../utils/moduleHelpers';

interface PropertyListCardProps {
  property: PropertyDTO;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  isLoggedIn: boolean;
  onBookClick: (e: React.MouseEvent, property: PropertyDTO) => void;
}

const CATEGORY_STYLES: Record<string, string> = {
  A: 'bg-amber-100 text-amber-800 border-amber-200',
  B: 'bg-blue-100 text-blue-800 border-blue-200',
  C: 'bg-gray-100 text-gray-700 border-gray-200',
};

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi size={13} />,
  parking: <Car size={13} />,
  breakfast: <Utensils size={13} />,
  pool: <Waves size={13} />,
  ac: <Wind size={13} />,
};

const AMENITY_KEYWORDS: Record<string, string[]> = {
  wifi: ['wifi', 'wi-fi', 'internet', 'wireless'],
  parking: ['parking', 'car park', 'garage'],
  breakfast: ['breakfast', 'dining', 'restaurant', 'food'],
  pool: ['pool', 'swimming'],
  ac: ['ac', 'air condition', 'cooling', 'hvac'],
};

function matchAmenity(amenityStr: string, keywords: string[]): boolean {
  const lower = amenityStr.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

function detectAmenities(amenities: string[]): string[] {
  const detected: string[] = [];
  for (const [key, keywords] of Object.entries(AMENITY_KEYWORDS)) {
    if (amenities.some((a) => matchAmenity(a, keywords))) {
      detected.push(key);
    }
  }
  return detected;
}

function isQuartersProperty(property: PropertyDTO): boolean {
  const name = property.module?.name?.toLowerCase() || '';
  const code = property.module?.code?.toLowerCase() || '';
  return name.includes('quarter') || code.includes('quarter') || code.includes('qtr');
}

export const PropertyListCard: React.FC<PropertyListCardProps> = ({
  property,
  checkIn,
  checkOut,
  guests,
  isLoggedIn,
  onBookClick,
}) => {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const cat = property.assetType?.category;
  const catStyle = cat ? CATEGORY_STYLES[cat] : null;
  const moduleBadgeText = getModuleBadgeText(property.module?.code);
  const moduleBadgeStyles = getModuleBadgeStyles(property.module?.code);
  const needsLogin = requiresLoginForBooking(property.module?.code) && !isLoggedIn;
  const detectedAmenities = detectAmenities(property.amenities || []);
  const showDatesGuests = !isQuartersProperty(property);

  const nightCount = checkIn && checkOut
    ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
    : null;

  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group flex flex-col sm:flex-row"
      onClick={() => navigate(`/properties/${property.id}`)}
    >
      {/* ── Left: Image ───────────────────────────────────────── */}
      <div className="relative sm:w-48 sm:min-w-[192px] h-48 sm:h-auto flex-shrink-0 bg-gray-100 overflow-hidden">
        {property.images.length > 0 && !imgError ? (
          <img
            src={property.images[0]}
            alt={property.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Building2 size={48} className="text-gray-300" />
          </div>
        )}

        {/* Photo count */}
        {property.images.length > 1 && !imgError && (
          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full font-medium">
            +{property.images.length - 1} photos
          </div>
        )}
      </div>

      {/* ── Centre: Details ───────────────────────────────────── */}
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        {/* Top row: name + category */}
        <div>
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            {property.module && (
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {property.module.name}
              </span>
            )}
            {catStyle && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${catStyle}`}>
                {cat === 'A' ? 'Category A' : cat === 'B' ? 'Category B' : 'Category C'}
              </span>
            )}
            {moduleBadgeText && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${moduleBadgeStyles}`}>
                {moduleBadgeText}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-blue-700 group-hover:text-blue-800 transition-colors leading-snug mb-1 line-clamp-1">
            {property.name}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-gray-500 text-xs mb-2">
            <MapPin size={12} className="flex-shrink-0 text-gray-400" />
            <span className="truncate">{property.estate?.city || property.address || 'Location not specified'}</span>
          </div>

          {/* Amenity chips */}
          {detectedAmenities.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              {detectedAmenities.map((key) => (
                <div key={key} className="flex items-center gap-1 text-gray-500 text-xs">
                  <span className="text-gray-400">{AMENITY_ICONS[key]}</span>
                  <span className="capitalize">{key === 'ac' ? 'Air conditioning' : key}</span>
                </div>
              ))}
            </div>
          )}

          {/* Room type / property type */}
          {property.propertyType && (
            <div className="flex items-center gap-1.5 text-xs text-gray-700 mb-2">
              <BedDouble size={13} className="text-gray-400" />
              <span className="font-medium">{property.propertyType.name}</span>
            </div>
          )}

          {/* Highlights */}
          <div className="space-y-1">
            {property.isExempt === false && (
              <div className="flex items-center gap-1.5 text-xs text-green-700">
                <CheckCircle size={12} className="flex-shrink-0" />
                <span>No restrictions apply</span>
              </div>
            )}
            {needsLogin ? (
              <div className="flex items-center gap-1.5 text-xs text-blue-700">
                <CheckCircle size={12} className="flex-shrink-0" />
                <span>Login required to book</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-green-700">
                <CheckCircle size={12} className="flex-shrink-0" />
                <span>Book online instantly</span>
              </div>
            )}
          </div>
        </div>

        {/* Description snippet */}
        {property.description && (
          <p className="text-xs text-gray-400 mt-2 line-clamp-1 leading-relaxed">
            {property.description}
          </p>
        )}
      </div>

      {/* ── Right: Price + CTA ───────────────────────────────── */}
      <div className="flex flex-col justify-between p-4 sm:border-l border-gray-100 sm:w-44 sm:min-w-[176px] flex-shrink-0">
        {/* Dates / guests context */}
        {showDatesGuests && (checkIn || guests) && (
          <div className="mb-3 text-xs text-gray-500 leading-relaxed text-right">
            {nightCount != null && nightCount > 0 && (
              <div>{nightCount} night{nightCount > 1 ? 's' : ''}</div>
            )}
            {guests && guests > 0 && (
              <div className="flex items-center gap-1 justify-end">
                <Users size={11} />
                {guests} adult{guests > 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 flex flex-col justify-center items-end gap-1">
          {property.minPrice != null ? (
            <>
              <p className="text-xs text-gray-500 text-right">From</p>
              <p className="text-xl font-bold text-gray-900 text-right leading-none">
                {formatCurrency(property.minPrice)}
              </p>
              <p className="text-xs text-gray-400 text-right">per night</p>
              {property.maxPrice != null && property.maxPrice !== property.minPrice && (
                <p className="text-xs text-gray-400 text-right">
                  up to {formatCurrency(property.maxPrice)}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm font-semibold text-gray-500 text-right">Price on request</p>
          )}

          {property.totalRooms != null && property.totalRooms > 0 && (
            <p className="text-xs text-gray-400 text-right mt-0.5">
              {property.totalRooms} rooms
            </p>
          )}
        </div>

        <button
          onClick={(e) => onBookClick(e, property)}
          className="mt-4 w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-md"
        >
          <Calendar size={14} />
          {needsLogin ? 'Login to Book' : 'See availability'}
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
};
