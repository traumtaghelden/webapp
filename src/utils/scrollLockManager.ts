/**
 * Centralized scroll lock manager to prevent conflicts between multiple modals
 * and components trying to control body scroll simultaneously.
 */

class ScrollLockManager {
  private lockCount = 0;
  private originalStyles: {
    overflow?: string;
    position?: string;
    top?: string;
    width?: string;
    paddingRight?: string;
  } = {};
  private originalHtmlOverflow?: string;
  private scrollPosition = 0;
  private isLocking = false;

  /**
   * Lock body scroll. Multiple calls are reference counted.
   */
  public lock(): void {
    // Prevent race conditions by checking if we're already locking
    if (this.isLocking) {
      return;
    }

    if (this.lockCount === 0) {
      this.isLocking = true;
      this.scrollPosition = window.scrollY;

      const body = document.body;
      const html = document.documentElement;

      this.originalStyles = {
        overflow: body.style.overflow,
        position: body.style.position,
        top: body.style.top,
        width: body.style.width,
        paddingRight: body.style.paddingRight,
      };
      this.originalHtmlOverflow = html.style.overflow;

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      body.style.position = 'fixed';
      body.style.top = `-${this.scrollPosition}px`;
      body.style.width = '100%';
      body.style.overflow = 'hidden';
      body.style.paddingRight = `${scrollbarWidth}px`;
      html.style.overflow = 'hidden';

      this.isLocking = false;
    }

    this.lockCount++;
  }

  /**
   * Unlock body scroll. Only unlocks when all locks are released.
   */
  public unlock(): void {
    if (this.lockCount > 0) {
      this.lockCount--;
    }

    if (this.lockCount === 0 && !this.isLocking) {
      const body = document.body;
      const html = document.documentElement;

      body.style.overflow = this.originalStyles.overflow || '';
      body.style.position = this.originalStyles.position || '';
      body.style.top = this.originalStyles.top || '';
      body.style.width = this.originalStyles.width || '';
      body.style.paddingRight = this.originalStyles.paddingRight || '';
      html.style.overflow = this.originalHtmlOverflow || '';

      window.scrollTo(0, this.scrollPosition);

      this.originalStyles = {};
      this.originalHtmlOverflow = undefined;
    }
  }

  /**
   * Force unlock all locks (use with caution, mainly for cleanup)
   */
  public forceUnlockAll(): void {
    if (this.lockCount > 0) {
      this.lockCount = 1;
      this.unlock();
    }
  }

  /**
   * Get current lock count
   */
  public getLockCount(): number {
    return this.lockCount;
  }

  /**
   * Check if scroll is currently locked
   */
  public isLocked(): boolean {
    return this.lockCount > 0;
  }
}

export const scrollLockManager = new ScrollLockManager();

export function disableBodyScroll(): void {
  scrollLockManager.lock();
}

export function enableBodyScroll(): void {
  scrollLockManager.unlock();
}

export function scrollToShowModal(): void {
  const navHeight = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--header-height') || '64'
  );

  if (window.scrollY < navHeight) {
    window.scrollTo({
      top: navHeight,
      behavior: 'smooth'
    });
  }
}

export function useModalScroll(isOpen: boolean): void {
  if (isOpen) {
    scrollToShowModal();
    disableBodyScroll();
  } else {
    enableBodyScroll();
  }
}
