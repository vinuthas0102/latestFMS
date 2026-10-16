import React from 'react';
import { Building2, MapPin } from 'lucide-react';
import { ALL_SITES, DashboardSite } from '../../types/dashboard';

interface SiteSelectorProps {
  selectedSite: DashboardSite;
  onSelectSite: (site: DashboardSite) => void;
}

export const SiteSelector: React.FC<SiteSelectorProps> = ({ selectedSite, onSelectSite }) => {
  return (
    <div className="flex w-full min-w-0 gap-1 pb-0.5">
      {ALL_SITES.map((site) => {
        const isActive = site === selectedSite;
        const isAll = site === 'All NMDC Sites';

        return (
          <button
            key={site}
            type="button"
            onClick={() => onSelectSite(site)}
            className={`flex min-w-0 flex-1 items-center gap-1 rounded-lg border-2 p-1.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
              isActive
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                isActive
                  ? isAll
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-700'
                  : isAll
                    ? 'bg-slate-100 text-slate-500'
                    : 'bg-slate-50 text-slate-400'
              }`}
            >
              {isAll ? <Building2 size={14} /> : <MapPin size={14} />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[8px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                {isAll ? 'Overview' : 'Project site'}
              </span>
              <span className={`block truncate text-xs font-bold ${isActive ? 'text-blue-700' : 'text-slate-800'}`}>
                {site}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
};
