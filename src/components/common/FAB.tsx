import { LucideIcon } from 'lucide-react';

interface FABProps {
  onClick: () => void;
  icon: LucideIcon;
  label?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  variant?: 'primary' | 'secondary';
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
}

export default function FAB({
  onClick,
  icon: Icon,
  label,
  position = 'bottom-right',
  variant = 'primary',
  showOnMobile = true,
  showOnDesktop = false,
}: FABProps) {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
  };

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-white shadow-gold-lg hover:shadow-gold-xl',
    secondary:
      'bg-white text-[#0a253c] shadow-lg border-2 border-[#d4af37]/30 hover:border-[#d4af37]',
  };

  const visibilityClasses = `
    ${showOnMobile ? 'block' : 'hidden'}
    ${showOnDesktop ? 'lg:block' : 'lg:hidden'}
  `;

  return (
    <button
      onClick={onClick}
      className={`
        fixed ${positionClasses[position]}
        ${variantClasses[variant]}
        ${visibilityClasses}
        w-14 h-14 sm:w-16 sm:h-16
        rounded-full
        flex items-center justify-center
        transition-all duration-300
        hover:scale-110 active:scale-95
        z-50
        group
        touch-manipulation
      `}
      aria-label={label}
    >
      <Icon className="w-6 h-6 sm:w-7 sm:h-7" />

      {/* Tooltip on hover (desktop only) */}
      {label && (
        <span className="absolute right-full mr-3 px-3 py-2 bg-[#0a253c] text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none hidden lg:block">
          {label}
        </span>
      )}

      {/* Ripple effect */}
      <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-active:opacity-100 group-active:scale-150 transition-all duration-300"></span>
    </button>
  );
}
