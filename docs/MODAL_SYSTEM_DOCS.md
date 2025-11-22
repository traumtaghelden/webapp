# Modal System Documentation

## Overview

An accessible, keyboard-friendly modal system for the Traumtag Helden homepage with automatic trigger binding and focus management.

## Features

- Focus trap with Tab/Shift+Tab navigation
- ESC and backdrop click to close
- Body scroll lock when modal is open
- Automatic focus restoration after close
- Auto-binding to header/footer links by text content
- Manual binding via `data-modal-target` attribute
- SSR/CSR safe
- ARIA attributes for screen readers (`role="dialog"`, `aria-modal="true"`)
- Event system for modal interactions

## Installation

The modal system is already integrated into the LandingPage component.

## Available Modals

1. **features** - App features overview
2. **pricing** - Free vs Premium plans
3. **howitworks** - Step-by-step onboarding guide
4. **faq** - Frequently asked questions
5. **impressum** - Legal company information
6. **privacy** - GDPR privacy information
7. **terms** - Terms of service
8. **login** - Login/registration form
9. **start** - Quick start form

## Usage

### Basic Usage

```tsx
import { openModal, closeModal } from '../lib/modalManager';

// Open a modal
openModal('features');

// Close the current modal
closeModal();
```

### In Components

```tsx
import { openModal } from '../lib/modalManager';

function MyComponent() {
  return (
    <button onClick={() => openModal('pricing')}>
      See Pricing
    </button>
  );
}
```

### Automatic Link Binding

Links with these texts are automatically bound to modals:

- "Features" → `features`
- "Preise" → `pricing`
- "So funktioniert's" → `howitworks`
- "FAQ" → `faq`
- "Login" → `login`
- "Kostenlos starten" → `start`
- "Impressum" → `impressum`
- "Datenschutz" → `privacy`
- "AGB" → `terms`

### Manual Binding

```html
<button data-modal-target="features">
  Open Features Modal
</button>
```

### Event Handling

Listen to modal events:

```tsx
import { onModalEvent } from '../lib/modalManager';

// Listen for upgrade click
const unsubscribe = onModalEvent('modal:pricing:upgrade', (data) => {
  console.log('User wants to upgrade!');
  // Handle upgrade flow
});

// Clean up
unsubscribe();
```

Available events:

- `modal:pricing:upgrade` - User clicked upgrade in pricing modal
- `modal:faq:more` - User wants more FAQ answers
- `modal:privacy:download` - User requests data export
- `auth:login` - Login form submitted
- `auth:register` - Registration form submitted
- `cta:start` - Quick start form submitted

### Emitting Events

```tsx
import { emitModalEvent } from '../lib/modalManager';

emitModalEvent('modal:pricing:upgrade', { plan: 'premium' });
```

## API Reference

### `openModal(id: ModalId)`

Opens a modal by ID.

```tsx
openModal('features');
```

### `closeModal()`

Closes the currently active modal.

```tsx
closeModal();
```

### `getActiveModal()`

Returns the ID of the currently active modal, or `null`.

```tsx
const activeModal = getActiveModal();
```

### `isModalOpen()`

Returns `true` if a modal is currently open.

```tsx
if (isModalOpen()) {
  // Do something
}
```

### `subscribe(listener: () => void)`

Subscribe to modal state changes. Returns unsubscribe function.

```tsx
const unsubscribe = subscribe(() => {
  console.log('Modal state changed');
});

// Later
unsubscribe();
```

### `attachModalTriggers(root?: HTMLElement)`

Attach modal triggers to elements. Call after DOM updates.

```tsx
import { attachModalTriggers } from '../lib/modalManager';

useEffect(() => {
  attachModalTriggers();
}, []);
```

### `onModalEvent(eventType, handler)`

Listen to specific modal events.

```tsx
const unsubscribe = onModalEvent('auth:login', (data) => {
  console.log('Login:', data);
});
```

### `emitModalEvent(eventType, data?)`

Emit a modal event.

```tsx
emitModalEvent('modal:pricing:upgrade', { plan: 'premium' });
```

## Accessibility

- All modals have `role="dialog"` and `aria-modal="true"`
- Focus is trapped within the modal
- First focusable element receives focus on open
- Focus returns to trigger element on close
- ESC key closes modal
- Backdrop click closes modal
- Screen reader friendly with proper ARIA labels

## Styling

Modals use the existing Tailwind CSS classes from the project:

- Gold gradient colors: `#d4af37` to `#f4d03f`
- Navy blue: `#0a253c`
- Background beige: `#f7f2eb`
- Animations: `modal-backdrop`, `modal-modern`, `animate-fade-in`

## Content Generation

All modal content is in German and tailored to the "Traumtag Helden" brand:

- Friendly, approachable tone ("Ihr" form)
- Heldenreise (hero's journey) metaphor
- Emphasis on "Struktur statt Stress"
- Clear, benefit-oriented copy
- Pixar/Disney inspired storytelling

## Examples

### Opening a modal from a button

```tsx
<button onClick={() => openModal('pricing')}>
  View Pricing
</button>
```

### Chaining modals

```tsx
// In PricingModal.tsx
<button onClick={() => openModal('features')}>
  See all features
</button>
```

### Handling form submissions

```tsx
import { onModalEvent } from '../lib/modalManager';

useEffect(() => {
  const handleLogin = onModalEvent('auth:login', async (credentials) => {
    // Handle login
    const result = await login(credentials);
    if (result.success) {
      closeModal();
    }
  });

  return handleLogin;
}, []);
```

## Troubleshooting

### Modal not opening

- Check that `ModalRoot` is mounted in your component tree
- Verify the modal ID is correct
- Check browser console for errors

### Focus trap not working

- Ensure modal has focusable elements
- Check that modal is properly rendered
- Verify no CSS is hiding focusable elements

### Links not auto-binding

- Verify `attachModalTriggers()` is called after DOM update
- Check link text matches exactly (case-insensitive)
- Try adding `data-modal-target` attribute manually

## File Structure

```
src/
├── lib/
│   └── modalManager.ts          # Core modal logic
├── components/
│   └── Modals/
│       ├── index.ts             # Exports
│       ├── ModalRoot.tsx        # Main modal renderer
│       ├── ModalBackdrop.tsx    # Backdrop component
│       ├── ModalContainer.tsx   # Modal wrapper
│       ├── FeaturesModal.tsx    # Features content
│       ├── PricingModal.tsx     # Pricing content
│       ├── HowItWorksModal.tsx  # How it works content
│       ├── FAQModal.tsx         # FAQ content
│       ├── ImpressumModal.tsx   # Impressum content
│       ├── PrivacyModal.tsx     # Privacy content
│       ├── TermsModal.tsx       # Terms content
│       ├── LoginModal.tsx       # Login/register form
│       └── StartModal.tsx       # Quick start form
```

## License

Part of the Traumtag Helden project.
