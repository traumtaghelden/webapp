import { X, Crown, CheckCircle, AlertTriangle, Info, XCircle, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'premium' | 'email_confirmation';
  title: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function Toast({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
  action
}: ToastProps) {
  // Longer duration for email confirmation toasts
  const effectiveDuration = type === 'email_confirmation' ? 8000 : duration;
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (effectiveDuration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, effectiveDuration);

      return () => clearTimeout(timer);
    }
  }, [effectiveDuration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-white" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-white" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-white" />;
      case 'premium':
        return <Crown className="w-5 h-5 text-white" />;
      case 'email_confirmation':
        return <Mail className="w-5 h-5 text-white" />;
      default:
        return <Info className="w-5 h-5 text-white" />;
    }
  };

  const getGradient = () => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-red-600';
      case 'warning':
        return 'bg-gradient-to-r from-amber-500 to-amber-600';
      case 'premium':
        return 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f]';
      case 'email_confirmation':
        return 'bg-gradient-to-r from-blue-600 to-blue-700';
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
    }
  };

  const getTextColor = () => {
    return type === 'premium' ? 'text-[#0a253c]' : 'text-white';
  };

  const getButtonClass = () => {
    if (type === 'premium') {
      return 'bg-[#0a253c] text-[#d4af37] hover:bg-[#1a3a5c]';
    }
    if (type === 'email_confirmation') {
      return 'bg-white text-blue-600 hover:bg-blue-50';
    }
    return 'bg-white/20 text-white hover:bg-white/30';
  };


  return (
    <div
      className={`
        ${getGradient()}
        rounded-xl p-4 shadow-lg
        transform transition-all duration-300
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
        min-w-[300px] max-w-[400px]
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-bold text-sm ${getTextColor()} mb-1`}>
            {title}
          </h4>
          <p className={`text-sm ${getTextColor()} ${type === 'premium' ? 'opacity-90' : 'opacity-95'}`}>
            {message}
          </p>
          {action && (
            <button
              onClick={() => {
                action.onClick();
                handleClose();
              }}
              className={`
                mt-2 px-3 py-1.5 rounded-lg text-xs font-bold
                transition-colors ${getButtonClass()}
              `}
            >
              {action.label}
            </button>
          )}
        </div>
        <button
          onClick={handleClose}
          className={`flex-shrink-0 ${getTextColor()} ${type === 'premium' ? 'hover:opacity-70' : 'hover:opacity-80'} transition-opacity`}
          aria-label="Schließen"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
