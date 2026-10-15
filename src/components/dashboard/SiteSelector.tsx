import React from 'react';
import { MapPin } from 'lucide-react';
import { DASHBOARD_SITES, DashboardSite } from '../../types/dashboard';

interface SiteSelectorProps {
  selectedSite: DashboardSite;
  onSelectSite: (site: DashboardSite) => void;
}

export const SiteSelector: React.FC<SiteSelectorProps> = ({ selectedSite, onSelectSite }) => {
  return (
    <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
      {DASHBOARD_SITES.map((site) => {
        const isActive = site === selectedSite;
        return (
          <button
            key={site}
            onClick={() => onSelectSite(site)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 border-2 ${
              isActive
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 -translate-y-0.5'
                : 'bg-white text-blue-700 border-blue-200 hover:border-blue-400 hover:shadow-sm hover:-translate-y-0.5'
            }`}
          >
            <MapPin size={18} className={isActive ? 'text-white' : 'text-blue-500'} />
            {site}
          </button>
        );
      })}
    </div>
  );
};
