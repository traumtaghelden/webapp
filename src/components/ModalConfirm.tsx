import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import StandardModal, { ModalFooter, ModalButton } from './StandardModal';

interface ModalConfirmProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  variant?: 'danger' | 'warning' | 'info';
}

export default function ModalConfirm({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  message,
  confirmText = 'Bestätigen',
  cancelText = 'Abbrechen',
  type,
  variant,
}: ModalConfirmProps) {
  // Use variant if provided, otherwise fall back to type or 'warning'
  const modalType = variant || type || 'warning';

  const handleClose = () => {
    if (onCancel) {
      onCancel();
    } else if (onClose) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    await onConfirm();
  };

  const getIcon = () => {
    switch (modalType) {
      case 'danger':
        return AlertCircle;
      case 'warning':
        return AlertTriangle;
      case 'info':
        return CheckCircle;
      default:
        return AlertTriangle;
    }
  };

  const getColors = () => {
    switch (modalType) {
      case 'danger':
        return {
          bg: 'bg-red-500/20',
          border: 'border-red-500/50',
          icon: 'text-red-400',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500/50',
          icon: 'text-yellow-400',
        };
      case 'info':
        return {
          bg: 'bg-blue-500/20',
          border: 'border-blue-500/50',
          icon: 'text-blue-400',
        };
    }
  };

  const colors = getColors();
  const Icon = getIcon();

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      icon={Icon}
      maxWidth="md"
      footer={
        <ModalFooter>
          {cancelText && (
            <ModalButton variant="secondary" onClick={handleClose}>
              {cancelText}
            </ModalButton>
          )}
          <ModalButton
            variant={modalType === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
          >
            {confirmText}
          </ModalButton>
        </ModalFooter>
      }
    >
      <div className={`p-4 rounded-xl ${colors.bg} border-2 ${colors.border} backdrop-blur-sm`}>
        <div className="flex gap-3">
          <Icon className={`w-6 h-6 flex-shrink-0 ${colors.icon}`} />
          <p className="text-white/90 leading-relaxed">{message}</p>
        </div>
      </div>
    </StandardModal>
  );
}
