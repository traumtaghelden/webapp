import { createContext, useContext, useState, ReactNode } from 'react';
import Toast, { ToastProps } from '../components/Toast';
import { logger } from '../utils/logger';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'premium' | 'email_confirmation';

interface ToastContextType {
  showToast: (type: ToastType, title: string, message: string, action?: { label: string; onClick: () => void }) => void;
  showLimitToast: (limitType: string, current: number, max: number, onUpgrade: () => void) => void;
  showUpgradeSuccessToast: () => void;
  showEmailConfirmationToast: (email: string, onResend?: () => void) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

const MAX_TOASTS = 5;

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Omit<ToastProps, 'onClose'>[]>([]);

  const showToast = (
    type: ToastType,
    title: string,
    message: string,
    action?: { label: string; onClick: () => void }
  ) => {
    try {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => {
        const newToasts = [...prev, { id, type, title, message, action }];
        return newToasts.slice(-MAX_TOASTS);
      });
    } catch (error) {
      logger.error('Error showing toast', 'ToastContext.showToast', error);
    }
  };

  const showLimitToast = (
    limitType: string,
    current: number,
    max: number,
    onUpgrade: () => void
  ) => {
    const limitLabels: Record<string, string> = {
      guests: 'Gäste',
      budget_items: 'Budget-Einträge',
      timeline_events: 'Timeline-Events',
      timeline_buffers: 'Puffer-Events',
      vendors: 'Dienstleister'
    };

    const label = limitLabels[limitType] || limitType;

    showToast(
      'premium',
      'Limit erreicht!',
      `Du hast das Maximum von ${max} ${label} erreicht. Upgrade auf Premium für unbegrenzten Zugang.`,
      {
        label: 'Jetzt upgraden',
        onClick: onUpgrade
      }
    );
  };

  const showUpgradeSuccessToast = () => {
    showToast(
      'success',
      'Willkommen bei Premium!',
      'Du hast jetzt Zugriff auf alle Premium-Features. Viel Spaß bei der Hochzeitsplanung!'
    );
  };

  const showEmailConfirmationToast = (email: string, onResend?: () => void) => {
    showToast(
      'email_confirmation',
      'E-Mail-Bestätigung erforderlich',
      `Wir haben einen Bestätigungs-Link an ${email} gesendet. Bitte überprüfen Sie Ihr Postfach (auch den Spam-Ordner) und bestätigen Sie Ihre E-Mail-Adresse.`,
      onResend ? {
        label: 'Erneut senden',
        onClick: onResend
      } : undefined
    );
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, showLimitToast, showUpgradeSuccessToast, showEmailConfirmationToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[10000] space-y-2 max-w-sm w-full">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
