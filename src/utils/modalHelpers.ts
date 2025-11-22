/**
 * @deprecated Use scrollLockManager instead
 * This file is kept for backwards compatibility and redirects to the new centralized system
 */
import {
  disableBodyScroll as newDisableBodyScroll,
  enableBodyScroll as newEnableBodyScroll,
  scrollToShowModal as newScrollToShowModal,
  useModalScroll as newUseModalScroll
} from './scrollLockManager';

/**
 * Ensures a modal is fully visible by scrolling the page
 * to just below the navigation bar
 * @deprecated Use scrollLockManager.scrollToShowModal instead
 */
export function scrollToShowModal() {
  newScrollToShowModal();
}

/**
 * Prevents body scroll when modal is open
 * @deprecated Use scrollLockManager.disableBodyScroll instead
 */
export function disableBodyScroll() {
  newDisableBodyScroll();
}

/**
 * Re-enables body scroll when modal is closed
 * @deprecated Use scrollLockManager.enableBodyScroll instead
 */
export function enableBodyScroll() {
  newEnableBodyScroll();
}

/**
 * Hook for managing modal visibility and scroll behavior
 * @deprecated Use scrollLockManager.useModalScroll instead
 */
export function useModalScroll(isOpen: boolean) {
  newUseModalScroll(isOpen);
}
