# Budget Overview Carousel - Dokumentation

## Übersicht

Die `BudgetOverviewCarousel` Komponente ist eine moderne, interaktive Karussell-Ansicht für Budget-Kennzahlen mit Touch-Unterstützung, Swipe-Gesten und optionalem AutoPlay.

## Features

### ✅ Navigation

- **Desktop**: Klickbare Pfeile links/rechts zum Wechseln zwischen Panels
- **Mobile**: Intuitive Swipe-Gesten (Links/Rechts)
- **Tastatur**: Pfeiltasten (← →) zur Navigation
- **Indikatoren**: Klickbare Punkte unterhalb zur direkten Anwahl

### ✅ Animationen

- Sanfte Übergänge mit 500ms Dauer
- Easing-Funktion: `ease-out` für natürliche Bewegung
- Skalierungseffekt auf Desktop (aktives Panel größer)
- Opacity-Übergang für Nebenpanels

### ✅ Desktop-Layout

- Aktives Panel im Fokus (100% Größe)
- Nachbarpanels sichtbar und leicht verkleinert (90%)
- Smooth-Zoom-Effekt beim Wechsel
- Größere Icons und Text für das aktive Panel

### ✅ Mobile-Layout

- Vollbreiten-Ansicht pro Panel
- Touch-optimierte Bedienung
- Swipe-Distanz: 50px für zuverlässige Gestenerkennung
- Reduzierte Opacity für Nebenpanels (60%)

### ✅ AutoPlay (Optional)

- Aktivierbar über Props: `autoPlay={true}`
- Konfigurierbares Intervall: `autoPlayInterval={5000}` (in ms)
- Play/Pause Button zur manuellen Steuerung
- Automatische Pause bei inaktivem Tab (Visibility API)

### ✅ Accessibility

- ARIA Labels für alle interaktiven Elemente
- Tastaturnavigation vollständig unterstützt
- Focus-Management
- Screen-Reader-freundlich

## Verwendung

```tsx
import BudgetOverviewCarousel from './BudgetOverviewCarousel';

<BudgetOverviewCarousel
  panels={[
    {
      id: 'all',
      icon: DollarSign,
      label: 'Alle Posten',
      value: 42,
      color: '#d4af37',
      bgColor: 'bg-[#d4af37]/10',
      ringColor: 'ring-[#d4af37]',
      textColor: 'text-[#0a253c]',
      isActive: true,
      onClick: () => handleClick(),
    },
    // ... weitere Panels
  ]}
  autoPlay={false}
  autoPlayInterval={5000}
/>
```

## Props

| Prop | Typ | Standard | Beschreibung |
|------|-----|----------|--------------|
| `panels` | `Panel[]` | - | Array von Panel-Objekten (siehe unten) |
| `autoPlay` | `boolean` | `false` | AutoPlay aktivieren/deaktivieren |
| `autoPlayInterval` | `number` | `5000` | Intervall in Millisekunden zwischen automatischen Wechseln |

### Panel Interface

```typescript
interface Panel {
  id: string;              // Eindeutige ID
  icon: any;               // Lucide Icon Komponente
  label: string;           // Anzeigetext
  value: number;           // Zahlenwert
  color: string;           // Farbe (Hex oder Tailwind-Klasse)
  bgColor: string;         // Background-Farbe (Tailwind-Klasse)
  ringColor: string;       // Ring-Farbe für aktiven Zustand
  textColor: string;       // Text-Farbe (Tailwind-Klasse)
  isActive: boolean;       // Aktiver Filter-Status
  onClick: () => void;     // Click-Handler
}
```

## Interaktion

### Touch-Gesten
- **Swipe Links**: Nächstes Panel
- **Swipe Rechts**: Vorheriges Panel
- **Mindestdistanz**: 50px für zuverlässige Erkennung

### Maus-Gesten (Desktop)
- **Drag & Drop**: Ziehen zum Navigieren
- **Cursor**: `grab` beim Hovern, `grabbing` beim Ziehen
- **Click auf Panel**: onClick-Handler ausführen
- **Click auf Pfeile**: Navigation

### Tastatur
- **Pfeil Links (←)**: Vorheriges Panel
- **Pfeil Rechts (→)**: Nächstes Panel

## Performance-Optimierungen

- **Visibility-Check**: AutoPlay pausiert bei inaktivem Tab
- **Conditional Rendering**: Nur aktuelle + Nachbarpanels werden gerendert
- **CSS Transforms**: Hardwarebeschleunigung für Animationen
- **Event-Cleanup**: Alle Listener werden ordnungsgemäß entfernt

## Responsive Breakpoints

- **Mobile** (`< 768px`): Vollbreiten-Panel, reduzierte Opacity
- **Desktop** (`≥ 768px`): 3-Panel-Ansicht mit Fokus-Effekt

## Browser-Kompatibilität

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

## Bekannte Einschränkungen

- AutoPlay pausiert dauerhaft beim manuellen Eingriff (kann reaktiviert werden über Play-Button)
- Tastaturnavigation funktioniert nur wenn das Karussell im Viewport ist
- Maximale Panel-Anzahl: Unbegrenzt (empfohlen: 6-10 für beste UX)

## Zukünftige Erweiterungen

- [ ] Lazy Loading für viele Panels
- [ ] Swipe-Velocity für schnellere Navigation
- [ ] Snap-Points für präzisere Positionierung
- [ ] Touch-Feedback (Haptic Vibration auf Mobile)
- [ ] Prefetch/Preload für Nachbarpanels
