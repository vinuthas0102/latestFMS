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
  const baseClasses = `${gradient} rounded-lg px-3 py-2 transition-all duration-300`;
  const interactiveClasses = onClick
    ? 'cursor-pointer hover:shadow-md hover:scale-105 active:scale-95'
    : '';
  const activeClasses = isActive
    ? 'ring-2 ring-blue-500 ring-offset-1 shadow-md'
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
              <div className="p-1 bg-white/60 backdrop-blur-sm rounded-md shadow-sm border border-white/80 flex-shrink-0">
                <Icon size={13} className="text-gray-700" />
              </div>
            )}
            <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide truncate">
              {label}
            </p>
          </div>
          <p className="text-base font-bold text-gray-900 flex-shrink-0">
            <CountUp end={value} duration={1500} />
          </p>
        </div>
        <div className="absolute bottom-0 right-0 w-12 h-12 bg-white/20 rounded-full blur-xl -mb-6 -mr-6" />
      </div>
    </FadeIn>
  );
};
