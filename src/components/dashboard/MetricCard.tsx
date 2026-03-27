import React, { useState } from 'react';
import { Video as LucideIcon, ChevronRight } from 'lucide-react';
import { CountUp } from '../animations/CountUp';

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
      className={`${colorScheme.gradient} rounded-xl shadow-sm border border-white/60 p-4 transition-all duration-300 ${
        onClick ? 'cursor-pointer card-interactive' : ''
      } ${colorScheme.glow} hover:shadow-lg hover:border-white/80 overflow-hidden relative group`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">{title}</p>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {isNumeric ? (
              <CountUp end={value as number} duration={1500} />
            ) : (
              value
            )}
          </div>
          {trend && (
            <div className="flex items-center gap-1">
              <span className={`text-xs font-semibold ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {trendUp ? '↑' : '↓'} {trend}
              </span>
              {subtitle && <span className="text-xs text-gray-500">• {subtitle}</span>}
            </div>
          )}
          {!trend && subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${colorScheme.icon} transition-transform duration-300 ${
          isHovered ? 'scale-110 rotate-3' : ''
        }`}>
          <Icon size={20} className="animate-pulse-slow" />
        </div>
      </div>

      {onClick && (
        <div className={`absolute bottom-2 right-2 transition-all duration-300 ${
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
        }`}>
          <ChevronRight size={16} className="text-gray-400" />
        </div>
      )}

      <div className={`absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 transition-transform duration-700 ${
        isHovered ? 'translate-x-full' : '-translate-x-full'
      }`} style={{ pointerEvents: 'none' }} />
    </div>
  );
};
