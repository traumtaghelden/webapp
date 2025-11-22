import { useEffect } from 'react';
import { disableBodyScroll, enableBodyScroll } from '../../utils/scrollLockManager';

interface ModalBackdropProps {
  onClick: () => void;
}

export default function ModalBackdrop({ onClick }: ModalBackdropProps) {
  useEffect(() => {
    document.body.classList.add('modal-open');
    disableBodyScroll();

    return () => {
      document.body.classList.remove('modal-open');
      document.body.classList.remove('no-scroll');
      document.body.style.paddingRight = '';
      enableBodyScroll();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm modal-backdrop z-[9998]"
      onClick={onClick}
      aria-hidden="true"
      style={{ touchAction: 'none' }}
    />
  );
}
