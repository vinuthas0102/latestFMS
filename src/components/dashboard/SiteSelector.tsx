import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, MapPin, Building2 } from 'lucide-react';
import { ALL_SITES, DashboardSite } from '../../types/dashboard';

interface SiteSelectorProps {
  selectedSite: DashboardSite;
  onSelectSite: (site: DashboardSite) => void;
}

export const SiteSelector: React.FC<SiteSelectorProps> = ({ selectedSite, onSelectSite }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAllSites = selectedSite === 'All NMDC Sites';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition-all duration-200 hover:border-blue-300 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${isAllSites ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-700'}`}>
            {isAllSites ? <Building2 size={16} /> : <MapPin size={16} />}
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Project site</span>
            <span className="block truncate text-sm font-bold text-slate-800">{selectedSite}</span>
          </span>
        </span>
        <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {ALL_SITES.map((site) => {
            const isActive = site === selectedSite;
            const isAll = site === 'All NMDC Sites';
            return (
              <button
                key={site}
                type="button"
                onClick={() => {
                  onSelectSite(site);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left transition-colors ${
                  isActive ? 'bg-blue-50' : 'hover:bg-slate-50'
                }`}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${isAll ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                  {isAll ? <Building2 size={14} /> : <MapPin size={14} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-700">{site}</span>
                </span>
                {isActive && <Check size={16} className="shrink-0 text-blue-600" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
