import React from 'react';
import { type LucideProps } from 'lucide-react';
import { CountUp } from '../animations/CountUp';
import { FadeIn } from '../animations/FadeIn';

type LucideIcon = React.FC<LucideProps>;

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
  const baseClasses = `${gradient} rounded-xl p-3 transition-all duration-300`;
  const interactiveClasses = onClick
    ? 'cursor-pointer hover:shadow-lg hover:scale-105 active:scale-95'
    : '';
  const activeClasses = isActive
    ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg'
    : '';

  return (
    <FadeIn delay={delay}>
      <div
        className={`${baseClasses} ${interactiveClasses} ${activeClasses} relative overflow-hidden`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        <div className="flex items-center justify-between mb-1 relative z-10">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            {label}
          </p>
          {Icon && (
            <div className="p-1.5 bg-white/60 backdrop-blur-sm rounded-lg shadow-sm border border-white/80">
              <Icon size={14} className="text-gray-700" />
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-gray-900 relative z-10">
          <CountUp end={value} duration={1500} />
        </p>
        <div className="absolute bottom-0 right-0 w-20 h-20 bg-white/20 rounded-full blur-2xl -mb-10 -mr-10" />
      </div>
    </FadeIn>
  );
};
