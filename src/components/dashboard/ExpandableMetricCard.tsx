import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { MetricData } from '../../types/dashboard';

interface ExpandableMetricCardProps {
  metric: MetricData;
  onBreakdownClick: (metricKey: string, label: string, value: number | string) => void;
}

const COLOR_MAP: Record<string, { header: string; accent: string; ring: string }> = {
  blue:    { header: 'bg-blue-600',    accent: 'text-blue-600',    ring: 'ring-blue-200' },
  green:   { header: 'bg-green-600',   accent: 'text-green-600',   ring: 'ring-green-200' },
  teal:    { header: 'bg-teal-600',    accent: 'text-teal-600',    ring: 'ring-teal-200' },
  amber:   { header: 'bg-amber-500',   accent: 'text-amber-600',   ring: 'ring-amber-200' },
  indigo:  { header: 'bg-indigo-600',  accent: 'text-indigo-600',  ring: 'ring-indigo-200' },
  orange:  { header: 'bg-orange-500',  accent: 'text-orange-600',  ring: 'ring-orange-200' },
  rose:    { header: 'bg-rose-600',    accent: 'text-rose-600',    ring: 'ring-rose-200' },
  red:     { header: 'bg-red-600',     accent: 'text-red-600',     ring: 'ring-red-200' },
  cyan:    { header: 'bg-cyan-600',    accent: 'text-cyan-600',    ring: 'ring-cyan-200' },
  slate:   { header: 'bg-slate-600',   accent: 'text-slate-600',   ring: 'ring-slate-200' },
  purple:  { header: 'bg-purple-600',  accent: 'text-purple-600',  ring: 'ring-purple-200' },
  emerald: { header: 'bg-emerald-600', accent: 'text-emerald-600', ring: 'ring-emerald-200' },
  pink:    { header: 'bg-pink-600',    accent: 'text-pink-600',    ring: 'ring-pink-200' },
};

export const ExpandableMetricCard: React.FC<ExpandableMetricCardProps> = ({ metric, onBreakdownClick }) => {
  const [expanded, setExpanded] = useState(false);
  const colors = COLOR_MAP[metric.color] ?? COLOR_MAP.blue;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full ${colors.header} text-white px-4 py-3.5 flex items-center justify-between text-left transition-colors`}
      >
        <span className="font-semibold text-sm">{metric.label}</span>
        <span className="flex items-center gap-2 text-sm font-bold">
          {metric.total}
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {expanded && (
        <div className="px-4 py-2 animate-fadeIn">
          <ul className="divide-y divide-gray-100">
            {metric.details.map((item, idx) => (
              <li
                key={idx}
                onClick={() => onBreakdownClick(metric.key, item.label, item.value)}
                className={`flex items-center justify-between py-2.5 px-2 -mx-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${colors.accent}`}
              >
                <span className="text-sm font-medium text-gray-700 group-hover:${colors.accent}">
                  {item.label}
                </span>
                <span className="text-sm font-bold">{item.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
