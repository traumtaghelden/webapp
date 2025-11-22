import { useState, useEffect, ReactNode } from 'react';

interface CompactKPICardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  color: 'yellow' | 'green' | 'blue' | 'red' | 'orange';
  delay?: number;
  onClick?: () => void;
}

export default function CompactKPICard({
  icon,
  label,
  value,
  subtitle,
  color,
  delay = 0,
  onClick
}: CompactKPICardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;

    const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
    if (isNaN(numericValue)) {
      return;
    }

    const duration = 800;
    const steps = 25;
    const increment = numericValue / steps;
    let current = 0;
    let step = 0;

    const counter = setInterval(() => {
      step++;
      current = Math.min(current + increment, numericValue);
      setDisplayValue(Math.round(current));

      if (step >= steps) {
        setDisplayValue(numericValue);
        clearInterval(counter);
      }
    }, duration / steps);

    return () => clearInterval(counter);
  }, [isVisible, value]);

  const colorStyles = {
    yellow: {
      bg: 'from-[#0a253c] via-[#1a3a5c] to-[#0a253c]',
      border: 'border-[#d4af37]/50',
      iconBg: 'from-[#d4af37] to-[#f4d03f]',
      textGradient: 'gradient-text-gold',
      glow: 'from-[#d4af37]/20'
    },
    green: {
      bg: 'from-[#0a253c] via-[#1a3a5c] to-[#0a253c]',
      border: 'border-green-500/50',
      iconBg: 'from-green-500 to-green-400',
      textGradient: 'text-green-400',
      glow: 'from-green-500/20'
    },
    blue: {
      bg: 'from-[#0a253c] via-[#1a3a5c] to-[#0a253c]',
      border: 'border-blue-500/50',
      iconBg: 'from-blue-500 to-blue-400',
      textGradient: 'text-blue-400',
      glow: 'from-blue-500/20'
    },
    red: {
      bg: 'from-[#0a253c] via-[#1a3a5c] to-[#0a253c]',
      border: 'border-red-500/50',
      iconBg: 'from-red-500 to-red-400',
      textGradient: 'text-red-400',
      glow: 'from-red-500/20'
    },
    orange: {
      bg: 'from-[#0a253c] via-[#1a3a5c] to-[#0a253c]',
      border: 'border-orange-500/50',
      iconBg: 'from-orange-500 to-orange-400',
      textGradient: 'text-orange-400',
      glow: 'from-orange-500/20'
    }
  };

  const styles = colorStyles[color];

  const formatDisplayValue = () => {
    if (typeof value === 'string') {
      if (value.includes('%')) return `${displayValue}%`;
      if (value.includes('€')) return `${displayValue.toLocaleString('de-DE')} €`;
      return displayValue.toLocaleString('de-DE');
    }
    return displayValue.toLocaleString('de-DE');
  };

  return (
    <div
      className={`transform transition-all duration-500 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div
        className={`
          group relative bg-gradient-to-br ${styles.bg} rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 shadow-md sm:shadow-lg
          border ${styles.border} overflow-hidden
          ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95 touch:min-h-[72px]' : 'min-h-[72px] sm:min-h-[88px] md:min-h-[96px]'}
          transition-all duration-300
        `}
        onClick={onClick}
      >
        <div className={`absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br ${styles.glow} to-transparent rounded-full blur-2xl animate-pulse`}></div>

        <div className="relative z-10 flex items-center gap-2 sm:gap-2.5 md:gap-3">
          {/* Icon links - zentriert */}
          <div className={`bg-gradient-to-r ${styles.iconBg} w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-md sm:rounded-lg flex items-center justify-center shadow-sm sm:shadow-md group-hover:scale-110 transition-all duration-300 flex-shrink-0`}>
            <div className="flex items-center justify-center [&>*]:w-3.5 [&>*]:h-3.5 sm:[&>*]:w-4 sm:[&>*]:h-4 md:[&>*]:w-5 md:[&>*]:h-5">
              {icon}
            </div>
          </div>

          {/* Zahl oben, Beschreibung darunter */}
          <div className="flex-1 min-w-0">
            <div className={`font-bold ${styles.textGradient} leading-none mb-0.5 sm:mb-1 overflow-hidden`}>
              <span className="block truncate text-lg sm:text-xl md:text-2xl lg:text-3xl">
                {formatDisplayValue()}
              </span>
            </div>
            <h3 className="text-white/90 font-semibold text-[9px] sm:text-[10px] md:text-xs mb-0 sm:mb-0.5 truncate leading-tight">{label}</h3>
            {subtitle && (
              <p className="text-white/60 text-[8px] sm:text-[9px] md:text-xs truncate leading-tight hidden sm:block">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
