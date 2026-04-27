import React, { useState } from 'react';
import { type LucideProps } from 'lucide-react';
import { CountUp } from '../animations/CountUp';

type LucideIcon = React.FC<LucideProps>;

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: string;
  subtitle?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  color = 'blue',
  subtitle,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const colorClasses = {
    blue:     'bg-gradient-to-r from-blue-500 to-teal-500',
    teal:     'bg-gradient-to-r from-teal-500 to-green-500',
    green:    'bg-gradient-to-r from-emerald-500 to-cyan-500',
    orange:   'bg-gradient-to-r from-orange-500 to-red-500',
    coral:    'bg-gradient-to-r from-orange-500 to-red-500',
    lavender: 'bg-gradient-to-r from-violet-500 to-blue-500',
    yellow:   'bg-gradient-to-r from-amber-500 to-orange-500',
    pink:     'bg-gradient-to-r from-rose-500 to-pink-500',
    cyan:     'bg-gradient-to-r from-sky-500 to-blue-600',
  };

  const gradientClass = colorClasses[color as keyof typeof colorClasses] ?? colorClasses.blue;
  const isNumeric = typeof value === 'number';

  return (
    <div
      className={`${gradientClass} rounded-lg px-3 py-2 ${
        onClick ? 'cursor-pointer' : ''
      } overflow-hidden relative group`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between relative z-10 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`p-1 bg-white/20 rounded-md border border-white/30 transition-all duration-300 shrink-0 ${
            isHovered ? 'scale-110' : ''
          }`}>
            <Icon size={13} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-white/90 uppercase tracking-wide leading-none truncate">{title}</p>
            {(trend || subtitle) && (
              <p className="text-[10px] text-white/70 leading-none mt-0.5 truncate">
                {trend ? `${trendUp ? '↑' : '↓'} ${trend}` : subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="text-base font-bold text-white leading-none flex-shrink-0">
          {isNumeric ? (
            <CountUp end={value as number} duration={1500} />
          ) : (
            value
          )}
        </div>
      </div>

      <div className={`absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transition-transform duration-700 ${
        isHovered ? 'translate-x-full' : '-translate-x-full'
      }`} style={{ pointerEvents: 'none' }} />
    </div>
  );
};
