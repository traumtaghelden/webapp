import { Building2 } from 'lucide-react';

interface VendorAvatarProps {
  name: string;
  category: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isBooked?: boolean;
  isFavorite?: boolean;
  className?: string;
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  'Location': { bg: 'bg-blue-500', text: 'text-white' },
  'Catering': { bg: 'bg-green-500', text: 'text-white' },
  'Fotografie': { bg: 'bg-purple-500', text: 'text-white' },
  'Musik': { bg: 'bg-pink-500', text: 'text-white' },
  'Dekoration': { bg: 'bg-yellow-500', text: 'text-white' },
  'Floristik': { bg: 'bg-emerald-500', text: 'text-white' },
  'Transport': { bg: 'bg-indigo-500', text: 'text-white' },
  'Unterhaltung': { bg: 'bg-red-500', text: 'text-white' },
  'Video': { bg: 'bg-cyan-500', text: 'text-white' },
  'default': { bg: 'bg-gray-500', text: 'text-white' },
};

const sizeClasses = {
  sm: 'w-12 h-12 text-sm',
  md: 'w-16 h-16 text-lg',
  lg: 'w-24 h-24 text-2xl',
  xl: 'w-32 h-32 text-4xl',
};

export default function VendorAvatar({
  name,
  category,
  size = 'md',
  isBooked = false,
  isFavorite = false,
  className = ''
}: VendorAvatarProps) {
  const getInitials = (name: string): string => {
    const words = name.trim().split(' ').filter(Boolean);
    if (words.length === 0) return '??';
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(name);
  const colors = categoryColors[category] || categoryColors.default;

  return (
    <div className={`relative ${className}`}>
      <div
        className={`
          ${sizeClasses[size]}
          ${colors.bg}
          ${colors.text}
          rounded-full
          flex items-center justify-center
          font-bold
          shadow-lg
          transition-all duration-300
          ${isBooked ? 'ring-4 ring-green-400 ring-offset-2' : ''}
          ${isFavorite ? 'ring-4 ring-[#d4af37] ring-offset-2' : ''}
          relative
          overflow-hidden
        `}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        <span className="relative z-10">{initials}</span>

        {isBooked && (
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-transparent animate-pulse" />
        )}

        {isFavorite && !isBooked && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/20 to-transparent" />
        )}
      </div>

      {(isBooked || isFavorite) && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
          {isBooked ? (
            <div className="w-4 h-4 bg-green-500 rounded-full" />
          ) : (
            <div className="w-4 h-4 bg-[#d4af37] rounded-full" />
          )}
        </div>
      )}

      <div className={`
        absolute -bottom-2 left-1/2 transform -translate-x-1/2
        px-2 py-0.5 bg-white rounded-full shadow-md
        ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-xs' : 'text-sm'}
        font-semibold text-[#0a253c]
        whitespace-nowrap
        border-2 border-[#d4af37]/30
      `}>
        <Building2 className={`inline-block ${size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'} mr-1`} />
        {category}
      </div>
    </div>
  );
}
