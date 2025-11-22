import { AlertTriangle } from 'lucide-react';
import StandardModal, { ModalFooter, ModalButton } from './StandardModal';

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDeleting?: boolean;
}

export default function ConfirmDeleteDialog({
  isOpen,
  title,
  message,
  itemName,
  onConfirm,
  onCancel,
  confirmText = 'Löschen',
  cancelText = 'Abbrechen',
  isDeleting = false,
}: ConfirmDeleteDialogProps) {
  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      icon={AlertTriangle}
      maxWidth="md"
      showCloseButton={!isDeleting}
      footer={
        <ModalFooter>
          <ModalButton
            variant="secondary"
            onClick={onCancel}
            disabled={isDeleting}
          >
            {cancelText}
          </ModalButton>
          <ModalButton
            variant="danger"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Wird gelöscht...' : confirmText}
          </ModalButton>
        </ModalFooter>
      }
    >
      <div className="space-y-4">
        <div className="bg-red-500/20 border-2 border-red-500/50 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-white/90 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>

        {itemName && (
          <div className="bg-white/10 border border-[#d4af37]/30 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-sm font-semibold text-white break-words">
              {itemName}
            </p>
          </div>
        )}

        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-3 backdrop-blur-sm">
          <p className="text-xs text-yellow-200 leading-relaxed">
            <span className="font-bold">⚠️ Hinweis:</span> Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
        </div>
      </div>
    </StandardModal>
  );
}
