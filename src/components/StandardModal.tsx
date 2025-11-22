import React, { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Video as LucideIcon } from 'lucide-react';
import { disableBodyScroll, enableBodyScroll, scrollToShowModal } from '../utils/scrollLockManager';
import { logger } from '../utils/logger';

interface StandardModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  showCloseButton?: boolean;
}

export default function StandardModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  maxWidth = '4xl',
  showCloseButton = true,
}: StandardModalProps) {
  const [isReady, setIsReady] = useState(false);
  const openTimestampRef = React.useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      openTimestampRef.current = Date.now();
      logger.info('StandardModal opened', 'StandardModal.useEffect', { title, timestamp: openTimestampRef.current });
      scrollToShowModal();
      disableBodyScroll();

      // Immediately ready - no delay
      setIsReady(true);
      logger.info('StandardModal ready for interactions', 'StandardModal.useEffect', { title });

      return () => {
        setIsReady(false);
        openTimestampRef.current = 0;
        logger.info('StandardModal cleanup', 'StandardModal.useEffect', { title });
        enableBodyScroll();
      };
    } else {
      // When modal closes, reset ready state
      setIsReady(false);
      openTimestampRef.current = 0;
    }
  }, [isOpen, title]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Allow closing modal by clicking on backdrop
    const timeSinceOpen = Date.now() - openTimestampRef.current;

    // Prevent accidental closes immediately after opening (within 200ms)
    if (timeSinceOpen < 200) {
      logger.info('StandardModal backdrop click ignored - too soon after opening', 'StandardModal.handleBackdropClick', { title, timeSinceOpen });
      return;
    }

    if (e.target === e.currentTarget) {
      logger.info('StandardModal backdrop clicked - closing modal', 'StandardModal.handleBackdropClick', { title, timeSinceOpen });
      onClose();
    }
  };

  const handleClose = () => {
    logger.info('StandardModal close button clicked', 'StandardModal.handleClose', { title });
    onClose();
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 modal-backdrop overflow-y-auto"
      style={{
        zIndex: 9999999,
        pointerEvents: 'auto',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-gradient-to-b from-[#0a253c] via-[#1a3a5c] to-[#0a253c] rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border-2 border-[#d4af37]/30 w-full h-full sm:h-auto sm:${maxWidthClasses[maxWidth]} sm:max-h-[90vh] flex flex-col relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 my-0 sm:my-8`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyMTIsIDE3NSwgNTUsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20 z-0 pointer-events-none"></div>

        {/* Header with Gold Gradient */}
        <div className="relative z-10 p-4 sm:p-6 border-b border-[#d4af37]/30 sticky top-0 bg-gradient-to-r from-[#0a253c]/95 to-[#1a3a5c]/95 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 pr-12 sm:pr-0 flex-1 min-w-0">
              <div className="relative bg-gradient-to-r from-[#d4af37] to-[#f4d03f] w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shadow-gold flex-shrink-0">
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">{title}</h2>
                {subtitle && (
                  <p className="text-sm text-white/70 mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>
            {showCloseButton && (
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-full transition-all hover:scale-110 absolute top-3 right-3 sm:top-auto sm:right-auto sm:static min-h-[44px] min-w-[44px] flex items-center justify-center touch:scale-110"
                aria-label="Schließen"
              >
                <X className="w-6 h-6 text-white/80 hover:text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-hide overscroll-contain">
          {children}
        </div>

        {/* Footer with Buttons */}
        {footer && (
          <div className="relative z-10 p-4 sm:p-6 border-t border-[#d4af37]/30 bg-gradient-to-r from-[#0a253c]/95 to-[#1a3a5c]/95 sticky bottom-0 backdrop-blur-sm">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Ensure modal portal container exists at the end of body
  let modalRoot = document.getElementById('modal-root');
  if (!modalRoot) {
    modalRoot = document.createElement('div');
    modalRoot.id = 'modal-root';
    modalRoot.style.position = 'fixed';
    modalRoot.style.top = '0';
    modalRoot.style.left = '0';
    modalRoot.style.width = '100%';
    modalRoot.style.height = '100%';
    modalRoot.style.zIndex = '2147483647';
    modalRoot.style.pointerEvents = 'none';
    document.body.appendChild(modalRoot);
  }

  return createPortal(modalContent, modalRoot);
}

interface ModalFooterProps {
  children: ReactNode;
}

export function ModalFooter({ children }: ModalFooterProps) {
  return (
    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
      {children}
    </div>
  );
}

interface ModalButtonProps {
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  children: ReactNode;
  icon?: LucideIcon;
  type?: 'button' | 'submit';
}

export function ModalButton({
  onClick,
  variant = 'secondary',
  disabled = false,
  children,
  icon: Icon,
  type = 'button',
}: ModalButtonProps) {
  const baseClasses = 'w-full sm:w-auto px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 min-h-[48px] touch:min-h-[48px] active:scale-95';

  const variantClasses = {
    primary: 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c] hover:shadow-gold-lg hover:scale-[1.02] active:scale-95 font-bold disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed disabled:opacity-50',
    secondary: 'bg-transparent border-2 border-[#d4af37]/40 text-white hover:border-[#d4af37] hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:scale-[1.02] active:scale-95 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed disabled:opacity-50',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      {Icon && <Icon className="w-5 h-5" />}
      <span>{children}</span>
    </button>
  );
}
