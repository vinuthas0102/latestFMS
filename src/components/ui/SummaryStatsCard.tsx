import React from 'react';
import { type LucideProps, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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
  /** Optional secondary count shown on the right side of the tile */
  secondaryValue?: number;
  secondaryLabel?: string;
  /** Optional trend percentage: positive = up, negative = down, 0 = flat */
  trend?: number;
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
  secondaryValue,
  secondaryLabel,
  trend,
}) => {
  const interactiveClasses = onClick
    ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]'
    : '';
  const activeClasses = isActive
    ? 'ring-2 ring-white/70 ring-offset-2 shadow-lg scale-[1.02]'
    : 'shadow-sm';

  const TrendIcon = trend != null
    ? trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
    : null;

  const hasSecondary = secondaryValue != null || secondaryLabel;

  return (
    <FadeIn delay={delay}>
      <div
        className={`${gradient} ${interactiveClasses} ${activeClasses} rounded-xl relative overflow-hidden transition-all duration-200 flex flex-row min-h-[80px]`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {/* Decorative overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-black/10 pointer-events-none" />
        <div className="absolute -top-5 -right-5 w-20 h-20 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-4 -left-3 w-14 h-14 bg-black/8 rounded-full pointer-events-none" />

        {/* Icon column */}
        <div className="relative z-10 flex-shrink-0 flex items-center justify-center px-3 border-r border-white/20">
          {Icon ? (
            <div className="p-2 bg-white/25 backdrop-blur-sm rounded-xl border border-white/30">
              <Icon size={16} className="text-white" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30" />
          )}
        </div>

        {/* Main content */}
        <div className="relative z-10 flex-1 px-3 py-3 flex flex-col justify-center min-w-0 gap-1">
          {/* Value + trend badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-2xl font-black text-white leading-none tabular-nums">
              <CountUp end={value} duration={1200} />
            </p>
            {TrendIcon && trend != null && (
              <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                trend > 0
                  ? 'bg-white/20 text-white'
                  : trend < 0
                  ? 'bg-black/20 text-white/80'
                  : 'bg-white/10 text-white/60'
              }`}>
                <TrendIcon size={8} />
                {Math.abs(trend)}%
              </span>
            )}
          </div>

          {/* Label + subtitle */}
          <div>
            <p className="text-[10px] font-bold text-white/95 uppercase tracking-widest leading-tight truncate">
              {label}
            </p>
            {subtitle && (
              <p className="text-[10px] text-white/65 leading-tight mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Secondary metric column (optional) */}
        {hasSecondary && (
          <div className="relative z-10 flex-shrink-0 flex flex-col items-center justify-center px-3 border-l border-white/20 min-w-[48px]">
            {secondaryValue != null && (
              <p className="text-sm font-bold text-white leading-none tabular-nums">
                <CountUp end={secondaryValue} duration={1400} />
              </p>
            )}
            {secondaryLabel && (
              <p className="text-[9px] text-white/60 uppercase tracking-wide mt-0.5 text-center leading-tight whitespace-nowrap">
                {secondaryLabel}
              </p>
            )}
          </div>
        )}

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20" />
      </div>
    </FadeIn>
  );
};
