import { useModal } from '../contexts/ModalContext';

export function useConfirmDialog() {
  const { showConfirm, showAlert } = useModal();

  const confirm = async (message: string): Promise<boolean> => {
    return await showConfirm({
      title: 'Bestätigung erforderlich',
      message,
      confirmText: 'Bestätigen',
      type: 'warning',
    });
  };

  const confirmDelete = async (message: string): Promise<boolean> => {
    return await showConfirm({
      title: 'Löschen bestätigen',
      message,
      confirmText: 'Löschen',
      type: 'danger',
    });
  };

  const alert = async (message: string, type: 'danger' | 'warning' | 'info' = 'info'): Promise<void> => {
    await showAlert('Hinweis', message, type);
  };

  return { confirm, confirmDelete, alert, showConfirm, showAlert };
}
