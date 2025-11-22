import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import ModalConfirm from '../components/ModalConfirm';
import { logger } from '../utils/logger';

interface ModalOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ModalContextType {
  showAlert: (title: string, message: string, type?: 'danger' | 'warning' | 'info') => Promise<void>;
  showConfirm: (options: ModalOptions) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    type: 'danger' | 'warning' | 'info';
    isAlert: boolean;
    resolve?: (value: boolean) => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Abbrechen',
    type: 'info',
    isAlert: false,
  });

  useEffect(() => {
    return () => {
      if (modalState.resolve && modalState.isOpen) {
        modalState.resolve(false);
      }
    };
  }, []);

  const showAlert = (title: string, message: string, type: 'danger' | 'warning' | 'info' = 'info') => {
    return new Promise<void>((resolve) => {
      try {
        setModalState({
          isOpen: true,
          title,
          message,
          confirmText: 'OK',
          cancelText: '',
          type,
          isAlert: true,
          resolve: () => {
            resolve();
            return true;
          },
        });
      } catch (error) {
        logger.error('Error showing alert', 'ModalContext.showAlert', error);
        resolve();
      }
    });
  };

  const showConfirm = (options: ModalOptions) => {
    return new Promise<boolean>((resolve) => {
      try {
        setModalState({
          isOpen: true,
          title: options.title,
          message: options.message,
          confirmText: options.confirmText || 'Bestätigen',
          cancelText: options.cancelText || 'Abbrechen',
          type: options.type || 'warning',
          isAlert: false,
          resolve,
        });
      } catch (error) {
        logger.error('Error showing confirm', 'ModalContext.showConfirm', error);
        resolve(false);
      }
    });
  };

  const handleClose = () => {
    if (modalState.resolve) {
      modalState.resolve(false);
    }
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    if (modalState.resolve) {
      modalState.resolve(true);
    }
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <ModalConfirm
        isOpen={modalState.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        type={modalState.type}
      />
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
