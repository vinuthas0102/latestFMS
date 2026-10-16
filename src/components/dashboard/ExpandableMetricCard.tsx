import React, { useState } from 'react';
import {
  AlertCircle,
  BedDouble,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Clock3,
  Home,
  IndianRupee,
  MessageSquareWarning,
  UserCog,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import type { MetricData } from '../../types/dashboard';

interface ExpandableMetricCardProps {
  metric: MetricData;
  index: number;
  onBreakdownClick: (metricKey: string, label: string, value: number | string) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  AlertCircle,
  BedDouble,
  Building2,
  CalendarDays,
  ClipboardList,
  Clock: Clock3,
  Home,
  IndianRupee,
  MessageSquareWarning,
  UserCog,
  Users,
  Wallet,
  Wrench,
};

const COLOR_MAP: Record<string, { icon: string; iconBg: string; bar: string; value: string }> = {
  blue: { icon: 'text-blue-700', iconBg: 'bg-blue-50', bar: 'bg-blue-600', value: 'text-blue-800' },
  green: { icon: 'text-emerald-700', iconBg: 'bg-emerald-50', bar: 'bg-emerald-600', value: 'text-emerald-800' },
  teal: { icon: 'text-teal-700', iconBg: 'bg-teal-50', bar: 'bg-teal-600', value: 'text-teal-800' },
  amber: { icon: 'text-amber-700', iconBg: 'bg-amber-50', bar: 'bg-amber-500', value: 'text-amber-800' },
  indigo: { icon: 'text-slate-700', iconBg: 'bg-slate-100', bar: 'bg-slate-700', value: 'text-slate-800' },
  orange: { icon: 'text-orange-700', iconBg: 'bg-orange-50', bar: 'bg-orange-500', value: 'text-orange-800' },
  rose: { icon: 'text-rose-700', iconBg: 'bg-rose-50', bar: 'bg-rose-600', value: 'text-rose-800' },
  red: { icon: 'text-red-700', iconBg: 'bg-red-50', bar: 'bg-red-600', value: 'text-red-800' },
  cyan: { icon: 'text-cyan-700', iconBg: 'bg-cyan-50', bar: 'bg-cyan-600', value: 'text-cyan-800' },
  slate: { icon: 'text-slate-700', iconBg: 'bg-slate-100', bar: 'bg-slate-600', value: 'text-slate-800' },
  purple: { icon: 'text-slate-700', iconBg: 'bg-slate-100', bar: 'bg-slate-700', value: 'text-slate-800' },
  emerald: { icon: 'text-emerald-700', iconBg: 'bg-emerald-50', bar: 'bg-emerald-600', value: 'text-emerald-800' },
  pink: { icon: 'text-rose-700', iconBg: 'bg-rose-50', bar: 'bg-rose-600', value: 'text-rose-800' },
};

export const ExpandableMetricCard: React.FC<ExpandableMetricCardProps> = ({ metric, index, onBreakdownClick }) => {
  const [expanded, setExpanded] = useState(false);
  const colors = COLOR_MAP[metric.color] ?? COLOR_MAP.blue;
  const Icon = ICON_MAP[metric.icon] ?? Building2;

  return (
    <article
      className="group relative self-start overflow-hidden rounded-lg border-2 border-slate-300 bg-white shadow-[0_4px_14px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-[0_10px_22px_rgba(15,23,42,0.1)] animate-slideUp"
      style={{ animationDelay: `${index * 45}ms`, animationFillMode: 'both' }}
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${colors.bar}`} />
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 px-3 pb-2.5 pt-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-inset"
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.iconBg} ${colors.icon} transition-transform duration-300 group-hover:scale-105`}>
          <Icon size={17} strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-slate-700">{metric.label}</span>
          <span className="mt-0.5 block text-[9px] font-medium uppercase tracking-[0.12em] text-slate-400">Portfolio indicator</span>
        </span>
        <span className={`text-lg font-bold tracking-tight ${colors.value}`}>{metric.total}</span>
        <ChevronDown size={15} className={`shrink-0 text-slate-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ${expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-slate-100 px-5 pb-4 pt-2">
            <ul className="divide-y divide-slate-100">
              {metric.details.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => onBreakdownClick(metric.key, item.label, item.value)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    <span className="text-xs font-medium text-slate-600">{item.label}</span>
                    <span className={`text-xs font-bold ${colors.value}`}>{item.value}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] font-medium text-slate-400">Select a breakdown to inspect records</p>
          </div>
        </div>
      </div>
    </article>
  );
};
