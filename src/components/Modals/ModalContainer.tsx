import { ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { handleModalKeyDown } from '../../lib/modalManager';
import { scrollToShowModal, disableBodyScroll, enableBodyScroll } from '../../utils/modalHelpers';

interface ModalContainerProps {
  children: ReactNode;
  onClose: () => void;
  title: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export default function ModalContainer({ children, onClose, title, maxWidth = 'lg' }: ModalContainerProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalRef.current) {
        handleModalKeyDown(e, modalRef.current);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Ensure modal is fully visible
    scrollToShowModal();
    disableBodyScroll();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      enableBodyScroll();
    };
  }, []);

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className={`fixed inset-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-auto ${maxWidthClasses[maxWidth]} sm:mx-auto p-0 sm:p-6 md:p-8 z-[9999] flex items-center justify-center`}
    >
      <div className="bg-gradient-to-br from-[#0A1F3D] via-[#1a3a5c] to-[#2a4a6c] w-full h-full sm:h-auto sm:rounded-3xl shadow-2xl sm:shadow-[0_20px_60px_rgba(212,175,55,0.15)] sm:max-h-[85vh] overflow-hidden modal-modern border-0 sm:border sm:border-gray-700/30" style={{ willChange: 'transform' }}>
        <div className="flex items-start gap-4 p-4 sm:p-6 border-b border-gray-700/50 sticky top-0 bg-gradient-to-r from-[#0A1F3D] to-[#1a3a5c] backdrop-blur-sm z-10" style={{ backfaceVisibility: 'hidden' }}>
          <div className="flex-1 min-w-0">
            <h2 id="modal-title" className="text-lg sm:text-xl md:text-2xl font-bold text-white pr-2">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-all touch-manipulation flex-shrink-0 text-gray-400 hover:text-white"
            aria-label="Modal schließen"
          >
            <X className="w-6 h-6 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-4.5rem)] sm:h-auto sm:max-h-[calc(85vh-5rem)] p-4 sm:p-6 md:p-8" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
