import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Grid3x3 as Grid3X3, ZoomIn } from 'lucide-react';

interface PhotoGalleryProps {
  images: string[];
  alt?: string;
  /** Called when the "Show all photos" is clicked (opens lightbox). Can also be triggered programmatically. */
  onShowAll?: () => void;
}

interface LightboxProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
  infoPanel?: React.ReactNode;
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

export const PhotoLightbox: React.FC<LightboxProps> = ({
  images,
  initialIndex = 0,
  onClose,
  infoPanel,
}) => {
  const [active, setActive] = useState(initialIndex);
  const [thumbsRef, setThumbsRef] = useState<HTMLDivElement | null>(null);

  const prev = useCallback(() => setActive((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setActive((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, prev, next]);

  // Scroll thumbnail into view when active changes
  useEffect(() => {
    if (!thumbsRef) return;
    const el = thumbsRef.querySelector(`[data-idx="${active}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [active, thumbsRef]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/96 flex flex-col md:flex-row">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="Close gallery"
      >
        <X size={20} />
      </button>

      {/* Left: main image + thumbnail strip */}
      <div className={`flex flex-col ${infoPanel ? 'md:w-2/3' : 'w-full'} h-full`}>
        {/* Main image */}
        <div className="flex-1 relative flex items-center justify-center min-h-0 px-12">
          <img
            key={active}
            src={images[active]}
            alt={`${alt} ${active + 1}`}
            className="max-w-full max-h-full object-contain rounded-xl select-none"
            draggable={false}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = images[0]; }}
          />

          {/* Prev / Next */}
          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-2 p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
                aria-label="Previous photo"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={next}
                className="absolute right-2 p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
                aria-label="Next photo"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}

          {/* Counter */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-xs font-medium">
            {active + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div
            ref={setThumbsRef}
            className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none flex-shrink-0"
          >
            {images.map((src, i) => (
              <button
                key={i}
                data-idx={i}
                onClick={() => setActive(i)}
                className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all duration-150 ${
                  active === i ? 'border-white scale-105' : 'border-transparent opacity-60 hover:opacity-90'
                }`}
              >
                <img
                  src={src}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = images[0]; }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: info panel */}
      {infoPanel && (
        <div className="md:w-1/3 border-l border-white/10 bg-black/40 overflow-y-auto flex-shrink-0">
          {infoPanel}
        </div>
      )}
    </div>
  );
};

// ── Hero wall (Goibibo style) ─────────────────────────────────────────────────

const FALLBACK = 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80';

export const PhotoGallery: React.FC<PhotoGalleryProps & {
  /** Additional info rendered in the lightbox right panel */
  lightboxInfo?: React.ReactNode;
  /** Minimum height of the hero wall */
  heroHeight?: string;
}> = ({
  images,
  alt = 'Photo',
  lightboxInfo,
  heroHeight = '420px',
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxStart, setLightboxStart] = useState(0);

  const openLightbox = useCallback((idx: number) => {
    setLightboxStart(idx);
    setLightboxOpen(true);
  }, []);

  const src = (i: number) => images[i] ?? FALLBACK;
  const count = images.length;

  return (
    <>
      {/* Hero wall */}
      <div
        className="relative rounded-2xl overflow-hidden shadow-xl"
        style={{ height: heroHeight }}
      >
        {count === 0 ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-teal-500">
            <Grid3X3 size={64} className="text-white/30" />
          </div>
        ) : count === 1 ? (
          /* Single image: full width */
          <div className="w-full h-full group cursor-pointer" onClick={() => openLightbox(0)}>
            <img src={src(0)} alt={alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
        ) : (
          /* Multi-image: left hero + right 2x2 grid */
          <div className="flex h-full gap-1">
            {/* Main large image (left, 60%) */}
            <div
              className="relative flex-[3] overflow-hidden cursor-pointer group"
              onClick={() => openLightbox(0)}
            >
              <img
                src={src(0)}
                alt={alt}
                className="w-full h-full object-cover group-hover:brightness-95 transition-all duration-300"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK; }}
              />
              {/* Left/right arrows on main image */}
              <div className="absolute inset-0 flex items-center justify-between px-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="p-2 rounded-full bg-black/40 backdrop-blur-sm">
                  <ChevronLeft size={18} className="text-white" />
                </div>
                <div className="p-2 rounded-full bg-black/40 backdrop-blur-sm">
                  <ChevronRight size={18} className="text-white" />
                </div>
              </div>
            </div>

            {/* Right 2x2 grid (40%) */}
            <div className="flex-[2] grid grid-rows-2 grid-cols-2 gap-1">
              {[1, 2, 3, 4].map((offset) => {
                const imgIdx = offset;
                const isLast = offset === 4;
                const remaining = count - 4;
                return (
                  <div
                    key={offset}
                    className="relative overflow-hidden cursor-pointer group"
                    onClick={() => openLightbox(imgIdx < count ? imgIdx : 0)}
                  >
                    <img
                      src={imgIdx < count ? src(imgIdx) : src(0)}
                      alt={`${alt} ${offset + 1}`}
                      className="w-full h-full object-cover group-hover:brightness-90 transition-all duration-300"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK; }}
                    />
                    {isLast && remaining > 0 && (
                      <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1">
                        <ZoomIn size={22} className="text-white" />
                        <span className="text-white font-bold text-sm">+{remaining} more</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Show all photos button */}
        {count > 1 && (
          <button
            onClick={() => openLightbox(0)}
            className="absolute bottom-4 right-4 flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all duration-200 border border-gray-200"
          >
            <Grid3X3 size={15} />
            Show all {count} photos
          </button>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <PhotoLightbox
          images={images}
          initialIndex={lightboxStart}
          onClose={() => setLightboxOpen(false)}
          infoPanel={lightboxInfo}
        />
      )}
    </>
  );
};

// small alias for direct use
const alt = '';
export default PhotoGallery;
