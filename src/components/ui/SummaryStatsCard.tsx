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
  gradient = 'bg-gradient-to-r from-blue-500 to-teal-500',
  onClick,
  delay = 0,
  isActive = false,
}) => {
  const baseClasses = `${gradient} rounded-lg px-3 py-2 transition-all duration-300`;
  const interactiveClasses = onClick
    ? 'cursor-pointer hover:shadow-md hover:scale-105 active:scale-95'
    : '';
  const activeClasses = isActive
    ? 'ring-2 ring-white/60 ring-offset-1 shadow-md'
    : '';

  return (
    <FadeIn delay={delay}>
      <div
        className={`${baseClasses} ${interactiveClasses} ${activeClasses} relative overflow-hidden`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        <div className="flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-2 min-w-0">
            {Icon && (
              <div className="p-1 bg-white/20 backdrop-blur-sm rounded-md border border-white/30 flex-shrink-0">
                <Icon size={13} className="text-white" />
              </div>
            )}
            <p className="text-[11px] font-semibold text-white/90 uppercase tracking-wide truncate">
              {label}
            </p>
          </div>
          <p className="text-base font-bold text-white flex-shrink-0">
            <CountUp end={value} duration={1500} />
          </p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 pointer-events-none" />
      </div>
    </FadeIn>
  );
};
