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
  subtitle?: string;
}

export const SummaryStatsCard: React.FC<SummaryStatsCardProps> = ({
  label,
  value,
  icon: Icon,
  gradient = 'bg-gradient-to-br from-blue-500 to-teal-500',
  onClick,
  delay = 0,
  isActive = false,
  subtitle,
}) => {
  const interactiveClasses = onClick
    ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]'
    : '';
  const activeClasses = isActive
    ? 'ring-2 ring-white/70 ring-offset-2 shadow-lg'
    : 'shadow-sm';

  return (
    <FadeIn delay={delay}>
      <div
        className={`${gradient} ${interactiveClasses} ${activeClasses} rounded-xl px-4 py-4 relative overflow-hidden transition-all duration-200`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 pointer-events-none" />
        {/* Decorative circle */}
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-2">
          {/* Top: icon + big value */}
          <div className="flex items-start justify-between">
            {Icon && (
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 flex-shrink-0">
                <Icon size={16} className="text-white" />
              </div>
            )}
            <p className="text-3xl font-black text-white leading-none tabular-nums">
              <CountUp end={value} duration={1500} />
            </p>
          </div>

          {/* Label */}
          <div>
            <p className="text-[11px] font-bold text-white/95 uppercase tracking-widest leading-tight">
              {label}
            </p>
            {subtitle && (
              <p className="text-[11px] text-white/70 mt-0.5 leading-tight">
                {subtitle}
              </p>
            )}
          </div>

          {/* Bottom accent line */}
          <div className="h-px bg-white/20 mt-1" />
        </div>
      </div>
    </FadeIn>
  );
};
