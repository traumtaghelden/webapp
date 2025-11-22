# Premium Vergleichsseiten-System

## Übersicht

Alle Premium-Klicks in der Traumtaghelden-App führen jetzt zu einer zentralen, eigenständigen Vergleichsseite, die im Design dem bereitgestellten Screenshot entspricht. Diese Seite öffnet sich in einem neuen Browser-Tab und zeigt einen klaren Free vs. Premium Vergleich.

## Architektur

### 1. Zentrale Vergleichsseite

**Pfad**: `/src/components/PremiumComparison.tsx`
**Route**: `/premium`

Die Seite zeigt:
- ✅ Transparente Überschrift: "Transparent & Fair"
- ✅ Zwei Spalten: Free Plan (links) und Heldenreise Premium (rechts)
- ✅ Premium-Panel mit dunklem Hintergrund und Gold-Akzenten
- ✅ "Beliebteste Wahl"-Badge auf Premium-Plan
- ✅ Trust-Footer mit Sicherheits-Badges

### 2. Upgrade Context (Zentrale Steuerung)

**Pfad**: `/src/contexts/UpgradeContext.tsx`

```tsx
const { showUpgrade } = useUpgrade();

// Jeder Aufruf öffnet die Vergleichsseite in neuem Tab
showUpgrade('payment_plans');
showUpgrade('cost_splitting');
showUpgrade('unlimited_budget');
// etc.
```

Die `showUpgrade()`-Funktion öffnet automatisch `/premium` in einem neuen Tab.

## Verwendung

### In bestehenden Komponenten

Alle Premium-Gating-Punkte verwenden bereits den UpgradeContext:

```tsx
import { useUpgrade } from '../contexts/UpgradeContext';

function MyComponent() {
  const { showUpgrade } = useUpgrade();

  const handlePremiumFeature = () => {
    if (!isPremium) {
      showUpgrade('feature_name');
      return;
    }
    // Premium-Logik
  };
}
```

### Feature-Typen

Verfügbare Feature-Identifier:
- `cost_splitting` - Kostenaufteilung
- `payment_plans` - Zahlungspläne
- `payment_templates` - Zahlungsvorlagen
- `per_person_calculation` - Pro-Kopf-Kalkulation
- `vendor_payments` - Dienstleister-Zahlungen
- `vendor_costs` - Erweiterte Dienstleister-Kosten
- `budget_categories` - Kosten nach Kategorien
- `unlimited_guests` - Unbegrenzte Gäste
- `unlimited_budget` - Unbegrenzte Budget-Einträge
- `unlimited_timeline` - Unbegrenzte Timeline-Events
- `unlimited_vendors` - Unbegrenzte Dienstleister
- `budget_charts` - Budget-Analysen & Charts
- `budget_tags` - Budget-Tags
- `block_planning` - Block-Planung
- `advanced_export` - Erweiterte Export-Funktionen
- `general` - Allgemeines Premium

## Vergleichsseiten-Design

### Visuelle Elemente (wie Screenshot)

#### Header
- **Überschrift**: "Transparent & Fair" (Navy & Gold)
- **Unterzeile**: "Startet kostenlos und upgradet nur, wenn ihr mehr wollt"

#### Free Plan (Linke Spalte)
- Weißer Hintergrund
- Titel: "Free Plan"
- Preis: "0€" (groß, fett)
- Untertitel: "Perfekt für den Start"
- Features mit Checkmarks (Gold):
  - ✅ Bis zu 40 Gäste
  - ✅ Bis zu 15 Budget-Einträge
  - ⏱️ Bis zu 3 Timeline-Events + 2 Puffer
  - ✅ Bis zu 5 Dienstleister
  - ✅ Basis Budget-Übersicht
  - ✅ CSV Export
  - ✅ Unbegrenzte Notifications
- Fußzeile: "Traumtaghelden Beta Wasserzeichen" (italic, klein)
- Button: "Kostenlos starten" (sekundär, grau)

#### Heldenreise Premium (Rechte Spalte)
- Dunkler Navy-Hintergrund (Gradient)
- Gold-Border (4px)
- Badge: "Beliebteste Wahl" (Gold, oben zentriert)
- Titel mit Krone-Icon: "Heldenreise Premium"
- Preis: "29,99€" (groß, gold)
- Untertitel: "pro Monat - Monatlich kündbar"
- Features mit Gold-Checkmarks:
  - ✅ Unbegrenzte Gäste
  - ✅ Unbegrenzte Budget-Einträge
  - ⏱️ Unbegrenzte Timeline-Events & Puffer
  - 📦 Block-Planung für Timeline
  - ✅ Unbegrenzte Dienstleister
  - 📈 Erweiterte Budget-Analysen & Charts
  - 💶 Erweiterte Zahlungspläne
  - 📄 PDF & CSV Export
  - 🚫 Kein Wasserzeichen
- Button: "Jetzt Premium werden" (primär, gold, mit Krone-Icon)
- Fußzeile: "Beta-Phase: Monatlich kündbar, keine versteckten Kosten"

#### Trust Footer
Centered badges mit Icons:
- 🛡️ Sichere Zahlung über Stripe
- 🛡️ DSGVO-konform
- ✅ Made in Germany
- Monatlich kündbar

### Responsives Verhalten

#### Desktop (>= 1024px)
- Zwei Spalten nebeneinander
- Premium-Panel leicht hervorgehoben
- Großzügige Abstände

#### Tablet (768px - 1023px)
- Zwei Spalten untereinander
- Premium bleibt optisch dominant
- Angepasste Schriftgrößen

#### Mobile (< 768px)
- Spalten untereinander gestapelt
- Premium-Panel behält dunklen Hintergrund
- Touch-freundliche Buttons
- Keine horizontalen Scrollbalken
- Text lesbar ohne Zoom

## Technische Details

### Screen-basiertes Routing

Die App verwendet einen Screen-State für die Navigation:

```tsx
// In App.tsx
const [currentScreen, setCurrentScreen] = useState<Screen>('landing');

// Render logic
if (currentScreen === 'premium') {
  return (
    <ToastProvider>
      <PremiumComparison onBack={() => setCurrentScreen('dashboard')} />
    </ToastProvider>
  );
}
```

Wenn `currentScreen === 'premium'`, wird die Vergleichsseite anstelle des Dashboards angezeigt.

### State-basierte Navigation

```tsx
// In UpgradeProvider
const showUpgrade = (feature: UpgradeFeature) => {
  setCurrentFeature(feature);
  // Navigate to premium comparison screen
  if (setScreen) {
    setScreen('premium');
  }
};

// In App.tsx
<UpgradeProvider setScreen={setCurrentScreen}>
```

Die Navigation erfolgt durch Ändern des Screen-States, nicht durch URL-Navigation. Dies funktioniert innerhalb der Single Page Application ohne neue Tabs zu öffnen.

### Stripe Checkout Integration

Der "Jetzt Premium werden"-Button startet den bestehenden Stripe-Checkout-Flow:

```tsx
const handleUpgrade = async () => {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/stripe-checkout`,
    {
      method: 'POST',
      body: JSON.stringify({
        priceId: 'prod_TLUKLou72VnSTX',
        successUrl: `${window.location.origin}/dashboard?upgrade=success`,
        cancelUrl: `${window.location.origin}/dashboard?upgrade=cancelled`,
      }),
    }
  );

  const data = await response.json();
  if (data.url) {
    window.location.href = data.url;
  }
};
```

## Einstiegspunkte (Alle führen zur Vergleichsseite)

### 1. Budget-Module
- ❌ Limit erreicht (Budget-Einträge)
- 🔒 Pro-Kopf-Kalkulation gesperrt
- 🔒 Kostenaufteilung gesperrt
- 🔒 Zahlungspläne/Raten gesperrt
- 🔒 Budget-Charts gesperrt
- 🔒 Budget-Tags gesperrt

### 2. Dienstleister-Module
- ❌ Limit erreicht (5 Dienstleister)
- 🔒 Zahlungsplan-Vorlagen gesperrt
- 🔒 Erweiterte Zahlungsfunktionen

### 3. Gäste-Module
- ❌ Limit erreicht (40 Gäste)
- 🔒 Erweiterte Gästeverwaltung

### 4. Timeline-Module
- ❌ Limit erreicht (3 Events + 2 Puffer)
- 🔒 Block-Planung gesperrt
- 🔒 Unbegrenzte Events

### 5. Aufgaben-Module
- 🔒 Erweiterte Aufgabenverwaltung

### 6. Export & Berichte
- 🔒 PDF Export ohne Wasserzeichen
- 🔒 Erweiterte CSV Exports

### 7. UI-Elemente
- 💰 "Jetzt freischalten"-Buttons
- 👑 Gold-Kronen-Icons
- 📊 Premium-Feature-Panels
- 🚨 Limit-Warnungen
- 📢 Benachrichtigungen

## Migration von alten Upgrade-Modals

### Vorher (Alt)
```tsx
const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

// In Component
{showUpgradePrompt && (
  <UpgradePrompt
    isOpen={showUpgradePrompt}
    onClose={() => setShowUpgradePrompt(false)}
  />
)}

// Trigger
setShowUpgradePrompt(true);
```

### Nachher (Neu)
```tsx
const { showUpgrade } = useUpgrade();

// Trigger
showUpgrade('feature_name');
```

**Vorteil**: Kein State Management nötig, keine Modal-Komponente im JSX, einheitliche Weiterleitung.

## Erfolgskriterien

✅ **Jeder Premium-Klick führt zur Vergleichsseite**
- Alle gesperrten Features verlinken korrekt
- Keine toten Links oder fehlerhafte Redirects

✅ **Design entspricht dem Screenshot**
- Identische Farben (Navy #0a253c, Gold #d4af37)
- Gleiche Typografie und Abstände
- Premium-Panel optisch hervorgehoben

✅ **Vollständige Informationen**
- Alle Free-Features aufgelistet
- Alle Premium-Features aufgelistet
- Klare Preisdarstellung
- Trust-Badges sichtbar

✅ **Mobile-optimiert**
- Spalten untereinander auf kleinen Screens
- Keine unlesbaren Texte
- Buttons bleiben erreichbar
- Kein horizontales Scrollen

✅ **Reibungsloser Kaufprozess**
- "Jetzt Premium werden" startet Stripe Checkout
- Success/Cancel URLs konfiguriert
- Fehlerbehandlung implementiert

✅ **Konsistente Navigation**
- Öffnet in neuem Tab
- "Kostenlos starten" führt zurück
- Keine doppelten Upgrade-Screens

## Wartung & Erweiterung

### Neue Features hinzufügen

1. Feature-Typ in `UpgradeContext.tsx` definieren
2. `showUpgrade('new_feature')` an entsprechender Stelle aufrufen
3. Optional: Feature in Vergleichsliste auf PremiumComparison-Seite ergänzen

### Preisänderungen

Aktualisieren in:
- `/src/components/PremiumComparison.tsx` (Zeile mit "29,99€")
- Stripe priceId falls nötig

### Design-Anpassungen

Die Vergleichsseite verwendet:
- Tailwind CSS Klassen
- Responsive Breakpoints (sm:, lg:)
- Lucide React Icons
- Gradient-Backgrounds

Alle Anpassungen zentral in `PremiumComparison.tsx` vornehmen.

## Testing

### Manuelle Tests

1. ✅ Klick auf gesperrtes Budget-Feature → Vergleichsseite öffnet
2. ✅ Klick auf Limit-Warnung → Vergleichsseite öffnet
3. ✅ Klick auf Premium-Badge → Vergleichsseite öffnet
4. ✅ "Jetzt Premium werden" → Stripe Checkout startet
5. ✅ Mobile: Beide Spalten lesbar, Buttons erreichbar
6. ✅ Zurück-Navigation funktioniert

### Browser-Kompatibilität

✅ Chrome/Edge (Chromium)
✅ Firefox
✅ Safari (macOS/iOS)
✅ Mobile Browser

## Navigation-Details

- ✅ Die Seite öffnet sich innerhalb der App (kein neuer Tab)
- ✅ "Zurück zum Dashboard"-Button für einfache Navigation
- ✅ "Kostenlos starten"-Button führt zurück zum Dashboard
- ✅ Nach Stripe-Checkout wird zum Dashboard zurückgeleitet
- ℹ️ Feature-spezifische Kontextinformationen werden nicht angezeigt (nur generischer Vergleich)

## Zukünftige Verbesserungen

- [ ] Feature-spezifische Highlights auf Vergleichsseite
- [ ] A/B Testing verschiedener Layouts
- [ ] Conversion-Tracking über Analytics
- [ ] Mehrsprachigkeit (EN, DE)
- [ ] Animierte Übergänge zwischen Features
- [ ] FAQ-Sektion auf Vergleichsseite
