# Standardisiertes Modal-System - Traumtaghelden

## Übersicht

Alle Popups, Modale und Overlay-Fenster in der Traumtaghelden-Webapp folgen einem einheitlichen Design-Standard basierend auf dem „Neuen Budgetposten hinzufügen"-Modal.

## Standard-Komponenten

### 1. StandardModal (Basis-Komponente)

Pfad: `/src/components/StandardModal.tsx`

Die zentrale Modal-Komponente, die alle Standardelemente bereitstellt:

```tsx
import StandardModal, { ModalFooter, ModalButton } from './StandardModal';
import { MyIcon } from 'lucide-react';

function MyModal({ isOpen, onClose }) {
  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="Mein Modal-Titel"
      subtitle="Optionale Untertitel-Beschreibung"
      icon={MyIcon}
      maxWidth="4xl"  // sm, md, lg, xl, 2xl, 3xl, 4xl
      footer={
        <ModalFooter>
          <ModalButton variant="secondary" onClick={onClose}>
            Abbrechen
          </ModalButton>
          <ModalButton variant="primary" onClick={handleSave} icon={SaveIcon}>
            Speichern
          </ModalButton>
        </ModalFooter>
      }
    >
      {/* Modal Content */}
      <div className="space-y-6">
        {/* Ihre Inhalte hier */}
      </div>
    </StandardModal>
  );
}
```

## Design-Standard (Referenz)

### Visuelles Erscheinungsbild

✅ **Zentrierte Position** in der Bildschirmmitte (Desktop)
✅ **Abgedimmter Hintergrund** (`bg-black/50 backdrop-blur-sm`)
✅ **Abgerundete Ecken** (`rounded-2xl sm:rounded-3xl`)
✅ **Heller Hintergrund** (weißer Kartenhintergrund)
✅ **Goldene Header-Leiste** mit Icon und Titel
- Icon: Gradient von `#d4af37` zu `#f4d03f`
- Titel: Bold, `text-[#0a253c]`
- Untertitel: `text-[#666666]`
✅ **Schatten** (`shadow-2xl`)
✅ **Fixe Buttons** im Footer
- Primary: Gold-Gradient (`from-[#d4af37] to-[#f4d03f]`)
- Secondary: White mit Border (`border-[#d4af37]/30`)
✅ **Schließen-X** oben rechts, immer sichtbar
✅ **Sanfte Animation** (Fade-in & Scale-up)

### Verhalten

✅ **Sanftes Einblenden** mit `animate-in fade-in zoom-in-95 slide-in-from-bottom-4`
✅ **Body-Scroll deaktiviert** beim Öffnen
✅ **Keine Überlappungen** mit Navigation oder Header
✅ **Zentrierung** bei jeder Bildschirmgröße
✅ **Scrollbar** nur innerhalb des Modals bei Bedarf
✅ **Z-Index: 9999** für korrekte Layering

### Struktur

```
┌─────────────────────────────────────┐
│ Header (Sticky)                     │
│  ┌─┐ Titel                      [X] │
│  │🎨│ Untertitel                     │
│  └─┘                                │
├─────────────────────────────────────┤
│                                     │
│ Content (Scrollable)                │
│                                     │
│  - Gleichmäßige Abstände (p-4/p-6) │
│  - Klare Sektionen                  │
│  - Premium-Hinweise eingebettet     │
│                                     │
├─────────────────────────────────────┤
│ Footer (Sticky)                     │
│  [Sekundär]            [Primär] →  │
└─────────────────────────────────────┘
```

## Button-Varianten

### Primary Button
- Verwendung: Haupt-Aktion (Speichern, Bestätigen, Upgraden)
- Stil: Gold-Gradient mit Hover-Effekt
- Position: Rechts im Footer

### Secondary Button
- Verwendung: Abbruch, Zurück, Schließen
- Stil: White mit Border
- Position: Links im Footer

### Danger Button
- Verwendung: Löschen, Unwiderrufliche Aktionen
- Stil: Rot mit Hover-Effekt
- Position: Variabel

## Mobile-Optimierung

✅ **Vollbild-Ansicht** auf mobilen Geräten
✅ **Sticky Header & Footer** bleiben sichtbar
✅ **Touch-freundliche Buttons** (größere Touch-Targets)
✅ **Responsive Abstände** (`p-4 sm:p-6`)
✅ **Kein horizontales Scrollen**
✅ **X-Button** absolut positioniert auf kleinen Bildschirmen

## Implementierte Beispiele

### 1. ContextualUpgradeModal
- **Pfad**: `/src/components/ContextualUpgradeModal.tsx`
- **Verwendung**: Premium-Upgrade-Hinweise
- **Features**: Kontextspezifischer Inhalt, expandierbare Benefits

### 2. BudgetAddModal (Referenz)
- **Pfad**: `/src/components/BudgetAddModal.tsx`
- **Verwendung**: Neuen Budget-Posten hinzufügen
- **Features**: Formulare, Premium-Panels, Zahlungsplanung

## Best Practices

### DO ✅

1. **Verwenden Sie StandardModal** für alle neuen Modals
2. **Halten Sie Header simpel** - Icon, Titel, optional Untertitel
3. **Strukturieren Sie Inhalte** mit `space-y-6` für Konsistenz
4. **Nutzen Sie ModalFooter** für Button-Platzierung
5. **Premium-Hinweise einbetten** als inline Panels
6. **Responsive Klassen nutzen** (`sm:`, `md:`, `lg:`)
7. **Icons verwenden** aus lucide-react für Konsistenz

### DON'T ❌

1. ❌ **Keine individuellen z-index Werte** - StandardModal managed das
2. ❌ **Keine custom Backdrop-Styles** - Verwenden Sie StandardModal
3. ❌ **Keine inline onClick-Schließungen** - Nutzen Sie onClose prop
4. ❌ **Keine Überlappungen** mit fixierten UI-Elementen
5. ❌ **Kein body-scroll vergessen** zu deaktivieren/aktivieren
6. ❌ **Keine abweichenden Button-Styles** - Nutzen Sie ModalButton

## Migration bestehender Modals

Für bestehende Modals, die noch nicht migriert sind:

1. Importieren Sie `StandardModal, { ModalFooter, ModalButton }`
2. Ersetzen Sie custom Modal-Wrapper durch `<StandardModal>`
3. Verwenden Sie `<ModalFooter>` für Button-Bereich
4. Ersetzen Sie custom Buttons durch `<ModalButton>`
5. Testen Sie auf Desktop & Mobile
6. Verifizieren Sie Z-Index und Scroll-Verhalten

## Technische Details

### Props von StandardModal

```typescript
interface StandardModalProps {
  isOpen: boolean;              // Modal sichtbar?
  onClose: () => void;          // Schließen-Handler
  title: string;                // Haupt-Titel
  subtitle?: string;            // Optionaler Untertitel
  icon: LucideIcon;            // Icon aus lucide-react
  children: ReactNode;         // Modal-Inhalt
  footer?: ReactNode;          // Optional: Footer mit Buttons
  maxWidth?: string;           // sm|md|lg|xl|2xl|3xl|4xl
  showCloseButton?: boolean;   // X-Button anzeigen (default: true)
}
```

### Props von ModalButton

```typescript
interface ModalButtonProps {
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  children: ReactNode;
  icon?: LucideIcon;
  type?: 'button' | 'submit';
}
```

## Accessibility (a11y)

✅ **Keyboard-Navigation** wird unterstützt
✅ **ESC-Taste** schließt Modal (implementieren per onClose)
✅ **Focus-Management** durch Portal
✅ **ARIA-Labels** auf Buttons
✅ **Scroll-Lock** verhindert Background-Scrolling

## Erfolgskriterien

✅ Jedes Modal öffnet sich mit derselben Optik und Animation
✅ Keine Überlappungen mit Navigation oder Header
✅ Einheitliche Abstände, Farben, Buttons und Schatten
✅ Desktop & Mobile verhalten sich flüssig und konsistent
✅ Premium-Hinweise wirken integriert, nicht störend
✅ Nutzer erkennt sofort: "Ich bin in einem Modal-Fenster"
✅ Build kompiliert ohne Fehler
