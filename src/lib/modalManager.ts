type ModalId =
  | 'features'
  | 'pricing'
  | 'howitworks'
  | 'faq'
  | 'impressum'
  | 'privacy'
  | 'terms'
  | 'login'
  | 'start';

type ModalEventType =
  | 'modal:pricing:upgrade'
  | 'modal:faq:more'
  | 'modal:privacy:download'
  | 'auth:login'
  | 'auth:register'
  | 'cta:start';

interface ModalState {
  activeModal: ModalId | null;
  previousFocusedElement: HTMLElement | null;
  isOpen: boolean;
}

const state: ModalState = {
  activeModal: null,
  previousFocusedElement: null,
  isOpen: false,
};

const listeners: Set<() => void> = new Set();
const eventListeners: Map<ModalEventType, Set<(data?: any) => void>> = new Map();

let focusTrapElements: HTMLElement[] = [];
let currentFocusIndex = 0;

function notifyListeners() {
  listeners.forEach(listener => listener());
}

function lockBodyScroll() {
  if (typeof document === 'undefined') return;

  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.paddingRight = `${scrollbarWidth}px`;
  document.body.classList.add('no-scroll');
}

function unlockBodyScroll() {
  if (typeof document === 'undefined') return;

  document.body.style.paddingRight = '';
  document.body.classList.remove('no-scroll');
}

function setupFocusTrap(modalElement: HTMLElement) {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  focusTrapElements = Array.from(modalElement.querySelectorAll<HTMLElement>(focusableSelectors));

  if (focusTrapElements.length > 0) {
    currentFocusIndex = 0;
    setTimeout(() => focusTrapElements[0]?.focus(), 50);
  }
}

function handleTabKey(e: KeyboardEvent, modalElement: HTMLElement) {
  if (focusTrapElements.length === 0) {
    setupFocusTrap(modalElement);
  }

  if (focusTrapElements.length === 0) return;

  if (e.shiftKey) {
    currentFocusIndex--;
    if (currentFocusIndex < 0) {
      currentFocusIndex = focusTrapElements.length - 1;
    }
  } else {
    currentFocusIndex++;
    if (currentFocusIndex >= focusTrapElements.length) {
      currentFocusIndex = 0;
    }
  }

  e.preventDefault();
  focusTrapElements[currentFocusIndex]?.focus();
}

export function openModal(id: ModalId) {
  if (typeof document === 'undefined') return;

  state.previousFocusedElement = document.activeElement as HTMLElement;
  state.activeModal = id;
  state.isOpen = true;

  lockBodyScroll();
  notifyListeners();

  setTimeout(() => {
    const modalElement = document.querySelector('[role="dialog"]');
    if (modalElement) {
      setupFocusTrap(modalElement as HTMLElement);
    }
  }, 100);
}

export function closeModal() {
  if (typeof document === 'undefined') return;

  state.activeModal = null;
  state.isOpen = false;
  focusTrapElements = [];
  currentFocusIndex = 0;

  unlockBodyScroll();
  notifyListeners();

  if (state.previousFocusedElement) {
    setTimeout(() => {
      state.previousFocusedElement?.focus();
      state.previousFocusedElement = null;
    }, 50);
  }
}

export function getActiveModal(): ModalId | null {
  return state.activeModal;
}

export function isModalOpen(): boolean {
  return state.isOpen;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitModalEvent(eventType: ModalEventType, data?: any) {
  const handlers = eventListeners.get(eventType);
  if (handlers) {
    handlers.forEach(handler => handler(data));
  }
}

export function onModalEvent(eventType: ModalEventType, handler: (data?: any) => void): () => void {
  if (!eventListeners.has(eventType)) {
    eventListeners.set(eventType, new Set());
  }

  const handlers = eventListeners.get(eventType)!;
  handlers.add(handler);

  return () => handlers.delete(handler);
}

export function handleModalKeyDown(e: KeyboardEvent, modalElement: HTMLElement) {
  if (e.key === 'Escape') {
    e.preventDefault();
    closeModal();
  } else if (e.key === 'Tab') {
    handleTabKey(e, modalElement);
  }
}

export function attachModalTriggers(root?: HTMLElement) {
  if (typeof document === 'undefined') return;

  const container = root || document;

  const modalMap: Record<string, ModalId> = {
    features: 'features',
    preise: 'pricing',
    'so funktioniert\'s': 'howitworks',
    'so funktionierts': 'howitworks',
    faq: 'faq',
    login: 'login',
    'kostenlos starten': 'start',
    impressum: 'impressum',
    datenschutz: 'privacy',
    agb: 'terms',
  };

  container.querySelectorAll('[data-modal-target]').forEach((element) => {
    const target = element.getAttribute('data-modal-target') as ModalId;

    element.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(target);
    });
  });

  container.querySelectorAll('a, button').forEach((element) => {
    const text = element.textContent?.toLowerCase().trim();

    if (text && modalMap[text]) {
      element.addEventListener('click', (e) => {
        const href = element.getAttribute('href');
        if (!href || href.startsWith('#') || href === '') {
          e.preventDefault();
          openModal(modalMap[text]);
        }
      });
    }
  });
}

export const ModalManager = {
  openModal,
  closeModal,
  getActiveModal,
  isModalOpen,
  subscribe,
  emitModalEvent,
  onModalEvent,
  handleModalKeyDown,
  attachModalTriggers,
};
