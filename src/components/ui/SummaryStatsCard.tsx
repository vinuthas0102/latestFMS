import React from 'react';
import { Video as LucideIcon } from 'lucide-react';
import { CountUp } from '../animations/CountUp';
import { FadeIn } from '../animations/FadeIn';

interface SummaryStatsCardProps {
  label: string;
  value: number;
  icon?: LucideIcon;
  gradient?: string;
  onClick?: () => void;
  delay?: number;
  isActive?: boolean;
}

export const SummaryStatsCard: React.FC<SummaryStatsCardProps> = ({
  label,
  value,
  icon: Icon,
  gradient = 'pastel-blue-gradient',
  onClick,
  delay = 0,
  isActive = false,
}) => {
  const baseClasses = `${gradient} rounded-xl p-4 transition-all duration-300`;
  const interactiveClasses = onClick
    ? 'cursor-pointer hover:shadow-lg hover:scale-105 active:scale-95'
    : '';
  const activeClasses = isActive
    ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg'
    : '';

  return (
    <FadeIn delay={delay}>
      <div
        className={`${baseClasses} ${interactiveClasses} ${activeClasses}`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            {label}
          </p>
          {Icon && (
            <div className="p-1.5 bg-white/40 rounded-lg">
              <Icon size={16} className="text-gray-700" />
            </div>
          )}
        </div>
        <p className="text-3xl font-bold text-gray-900">
          <CountUp end={value} duration={1500} />
        </p>
      </div>
    </FadeIn>
  );
};
