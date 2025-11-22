import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps {
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: ReactNode;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  fullWidth?: boolean;
}

export default function Button({
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  icon: Icon,
  iconPosition = 'left',
  type = 'button',
  className = '',
  fullWidth = false,
}: ButtonProps) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm min-h-[40px]',
    md: 'px-6 py-3 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c] hover:shadow-gold-lg hover:scale-[1.02] active:scale-95 font-bold disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:opacity-50',
    secondary:
      'bg-white border-2 border-[#d4af37] text-[#0a253c] hover:bg-[#f7f2eb] hover:scale-[1.02] active:scale-95 font-semibold disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed',
    danger:
      'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:scale-[1.02] active:scale-95 font-bold disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed',
    ghost:
      'bg-transparent text-[#0a253c] hover:bg-[#f7f2eb] active:scale-95 font-medium disabled:text-gray-400 disabled:cursor-not-allowed',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        rounded-xl font-semibold transition-all duration-200
        flex items-center justify-center gap-2
        touch:min-h-[48px]
        ${className}
      `.trim()}
    >
      {Icon && iconPosition === 'left' && <Icon className={iconSizeClasses[size]} />}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && <Icon className={iconSizeClasses[size]} />}
    </button>
  );
}
