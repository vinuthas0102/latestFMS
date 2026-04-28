import React, { useState } from 'react';
import {
  MapPin,
  Bed,
  Ruler,
  Layers,
  Home,
  Plus,
  Eye,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import { Quarter } from '../../services/quartersService';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80',
  'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=600&q=80',
];

function resolveImage(q: Quarter, idx: number): string {
  let images = q.images;
  if (typeof images === 'string') {
    try {
      images = JSON.parse(images);
    } catch {
      images = (images as unknown as string)
        .replace(/^\{/, '')
        .replace(/\}$/, '')
        .split(',')
        .map((s: string) => s.trim().replace(/^"|"$/g, ''))
        .filter(Boolean);
    }
  }
  const first = Array.isArray(images) && images.length > 0 ? images[0] : null;
  return first || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
}

function fmtINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getOccupancyStyles(status: string) {
  if (status === 'AVAILABLE') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'OCCUPIED') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

interface QuarterListCardProps {
  quarter: Quarter;
  idx: number;
  onView: (q: Quarter) => void;
  onAddToRequest: (q: Quarter) => void;
}

export const QuarterListCard: React.FC<QuarterListCardProps> = ({
  quarter,
  idx,
  onView,
  onAddToRequest,
}) => {
  const [imgError, setImgError] = useState(false);
  const isAvailable = quarter.occupancy_status === 'AVAILABLE';

  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group flex flex-col sm:flex-row"
      onClick={() => onView(quarter)}
    >
      {/* ── Left: Image ─────────────────────────────────────────── */}
      <div className="relative sm:w-48 sm:min-w-[192px] h-48 sm:h-auto flex-shrink-0 bg-gray-100 overflow-hidden">
        {!imgError ? (
          <img
            src={resolveImage(quarter, idx)}
            alt={quarter.quarter_number}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Home size={48} className="text-gray-300" />
          </div>
        )}

        {/* Availability badge */}
        <div className="absolute top-3 left-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getOccupancyStyles(quarter.occupancy_status)}`}>
            {isAvailable ? 'Available' : 'Occupied'}
          </span>
        </div>

        {/* Quarter type badge */}
        <div className="absolute top-3 right-3">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800/80 text-white backdrop-blur-sm">
            {quarter.quarter_type}
          </span>
        </div>
      </div>

      {/* ── Centre: Details ──────────────────────────────────────── */}
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        <div>
          {/* Title row */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-blue-700 group-hover:text-blue-800 transition-colors leading-snug">
              {quarter.quarter_number}
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {quarter.quarter_type}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {quarter.bhk_config}
            </span>
          </div>

          {/* Address */}
          {quarter.address && (
            <div className="flex items-center gap-1 text-gray-500 text-xs mb-2">
              <MapPin size={12} className="flex-shrink-0 text-gray-400" />
              <span className="truncate">{quarter.address}</span>
            </div>
          )}

          {/* Specs chips */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mb-2.5">
            <span className="flex items-center gap-1">
              <Bed size={12} className="text-gray-400" />
              {quarter.bhk_config}
            </span>
            <span className="flex items-center gap-1">
              <Ruler size={12} className="text-gray-400" />
              {quarter.area_sqft} sq.ft
            </span>
            <span className="flex items-center gap-1">
              <Layers size={12} className="text-gray-400" />
              {quarter.furnishing_status}
            </span>
            <span className="text-gray-400">
              Blk {quarter.block_name || '—'} · Fl {quarter.floor_number}
            </span>
          </div>

          {/* Amenities */}
          {quarter.amenities?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {quarter.amenities.slice(0, 4).map((a) => (
                <span key={a} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
                  {a}
                </span>
              ))}
              {quarter.amenities.length > 4 && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  +{quarter.amenities.length - 4} more
                </span>
              )}
            </div>
          )}

          {/* Highlights */}
          <div className="space-y-1">
            {isAvailable ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700">
                <CheckCircle size={12} className="flex-shrink-0" />
                <span>Available now — apply via request</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <CheckCircle size={12} className="flex-shrink-0 text-gray-300" />
                <span>Currently occupied</span>
              </div>
            )}
          </div>
        </div>

        {/* Description snippet */}
        {quarter.description && (
          <p className="text-xs text-gray-400 mt-2 line-clamp-1 leading-relaxed">
            {quarter.description}
          </p>
        )}
      </div>

      {/* ── Right: Rent + CTA ────────────────────────────────────── */}
      <div
        className="flex flex-col justify-between p-4 sm:border-l border-gray-100 sm:w-44 sm:min-w-[176px] flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 flex flex-col justify-center items-end gap-1">
          <p className="text-xs text-gray-500 text-right">Monthly rent</p>
          <p className="text-xl font-bold text-gray-900 text-right leading-none">
            {fmtINR(quarter.monthly_rent)}
          </p>
          <p className="text-xs text-gray-400 text-right">per month</p>
          <p className="text-xs text-gray-400 text-right mt-0.5">
            {quarter.area_sqft} sq.ft · {quarter.bhk_config}
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {isAvailable && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddToRequest(quarter); }}
              className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-md"
            >
              <Plus size={14} />
              Add to Request
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onView(quarter); }}
            className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
          >
            <Eye size={13} />
            View Details
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
