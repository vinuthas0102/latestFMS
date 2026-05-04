import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Images } from 'lucide-react';

interface ImageTileGridProps {
  images: string[];
  alt?: string;
  maxVisible?: number;
  cols?: 3 | 4;
}

export const ImageTileGrid: React.FC<ImageTileGridProps> = ({
  images,
  alt = 'Image',
  maxVisible = 6,
  cols = 4,
}) => {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 bg-gray-100 rounded-xl border border-gray-200">
        <Images size={24} className="text-gray-300" />
      </div>
    );
  }

  const visible = images.slice(0, maxVisible);
  const extra = images.length - maxVisible;

  const prev = () => setLightboxIdx(i => (i === null ? null : (i - 1 + images.length) % images.length));
  const next = () => setLightboxIdx(i => (i === null ? null : (i + 1) % images.length));

  const colClass = cols === 3 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <>
      <div className={`grid ${colClass} gap-1.5`}>
        {visible.map((src, idx) => {
          const isLast = idx === maxVisible - 1 && extra > 0;
          return (
            <button
              key={idx}
              onClick={() => setLightboxIdx(idx)}
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <img src={src} alt={`${alt} ${idx + 1}`} className="w-full h-full object-cover" />
              {isLast && (
                <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">+{extra + 1}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90" onClick={() => setLightboxIdx(null)}>
          <button
            onClick={e => { e.stopPropagation(); setLightboxIdx(null); }}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors z-10"
          >
            <X size={20} />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors z-10"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors z-10"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <div className="max-w-4xl max-h-[85vh] w-full px-16" onClick={e => e.stopPropagation()}>
            <img
              src={images[lightboxIdx]}
              alt={`${alt} ${lightboxIdx + 1}`}
              className="w-full h-full object-contain rounded-xl max-h-[80vh]"
            />
            <div className="text-center text-white/60 text-sm mt-3">
              {lightboxIdx + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
