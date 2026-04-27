import React, { useState } from 'react';
import { ChevronRight, type LucideProps } from 'lucide-react';
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
    blue: {
      gradient: 'pastel-blue-gradient',
      icon: 'bg-blue-100 text-blue-600',
      glow: 'hover:shadow-blue-200/50',
    },
    teal: {
      gradient: 'pastel-teal-gradient',
      icon: 'bg-teal-100 text-teal-600',
      glow: 'hover:shadow-teal-200/50',
    },
    green: {
      gradient: 'pastel-green-gradient',
      icon: 'bg-green-100 text-green-600',
      glow: 'hover:shadow-green-200/50',
    },
    orange: {
      gradient: 'pastel-coral-gradient',
      icon: 'bg-orange-100 text-orange-600',
      glow: 'hover:shadow-orange-200/50',
    },
    coral: {
      gradient: 'pastel-coral-gradient',
      icon: 'bg-orange-100 text-orange-600',
      glow: 'hover:shadow-orange-200/50',
    },
    lavender: {
      gradient: 'pastel-lavender-gradient',
      icon: 'bg-purple-100 text-purple-600',
      glow: 'hover:shadow-purple-200/50',
    },
    yellow: {
      gradient: 'pastel-yellow-gradient',
      icon: 'bg-yellow-100 text-yellow-600',
      glow: 'hover:shadow-yellow-200/50',
    },
    pink: {
      gradient: 'pastel-pink-gradient',
      icon: 'bg-pink-100 text-pink-600',
      glow: 'hover:shadow-pink-200/50',
    },
    cyan: {
      gradient: 'pastel-cyan-gradient',
      icon: 'bg-cyan-100 text-cyan-600',
      glow: 'hover:shadow-cyan-200/50',
    },
  };

  const colorScheme = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;
  const isNumeric = typeof value === 'number';

  return (
    <div
      className={`${colorScheme.gradient} rounded-lg px-3 py-2 ${
        onClick ? 'cursor-pointer' : ''
      } overflow-hidden relative group`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between relative z-10 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`p-1 rounded-md backdrop-blur-sm border shadow-sm transition-all duration-300 shrink-0 ${
            colorScheme.icon
          } border-white/60 ${isHovered ? 'scale-110' : ''}`}>
            <Icon size={13} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide leading-none truncate">{title}</p>
            {(trend || subtitle) && (
              <p className="text-[10px] text-gray-400 leading-none mt-0.5 truncate">
                {trend ? `${trendUp ? '↑' : '↓'} ${trend}` : subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="text-base font-bold text-gray-900 leading-none flex-shrink-0">
          {isNumeric ? (
            <CountUp end={value as number} duration={1500} />
          ) : (
            value
          )}
        </div>
      </div>

      <div className={`absolute inset-0 bg-gradient-to-r from-white/0 via-white/50 to-white/0 transition-transform duration-700 ${
        isHovered ? 'translate-x-full' : '-translate-x-full'
      }`} style={{ pointerEvents: 'none' }} />

      <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
    </div>
  );
};
