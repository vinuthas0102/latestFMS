import React from 'react';
import { Check, MapPin } from 'lucide-react';
import { DASHBOARD_SITES, DashboardSite } from '../../types/dashboard';

interface SiteSelectorProps {
  selectedSite: DashboardSite;
  onSelectSite: (site: DashboardSite) => void;
}

export const SiteSelector: React.FC<SiteSelectorProps> = ({ selectedSite, onSelectSite }) => {
  return (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4" role="tablist" aria-label="Project sites">
      {DASHBOARD_SITES.map((site) => {
        const isActive = site === selectedSite;
        return (
          <button
            key={site}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectSite(site)}
            className={`group flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:px-2.5 ${
              isActive
                ? 'border-blue-700 bg-blue-700 text-white shadow-lg shadow-blue-900/15'
                : 'border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md'
            }`}
          >
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${isActive ? 'bg-white/15' : 'bg-slate-100 group-hover:bg-blue-50'}`}>
              {isActive ? <Check size={16} strokeWidth={2.5} /> : <MapPin size={16} className="text-blue-700" />}
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-medium uppercase tracking-[0.12em] opacity-70">Project site</span>
              <span className="block truncate text-sm font-bold">{site}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
};
