# Hochzeitstag Timeline System - Dokumentation

## Übersicht

Das **Hochzeitstag Timeline System** ermöglicht die minutengenaue Planung des Hochzeitstages mit aufklappbaren Event-Blöcken, die jeweils 4 detaillierte Tabs enthalten:
- **Timeline** - Minutengenaue Events
- **Dienstleister** - Anbieter und Kontakte
- **Packliste** - Was muss mit
- **Checkliste** - Was muss erledigt werden

## Datenbankstruktur

### 1. `wedding_day_blocks`
Haupt-Event-Blöcke für den Hochzeitstag (z.B. Kirche, Sektempfang)

**Felder:**
- `id` (UUID, PK)
- `wedding_id` (UUID, FK → weddings)
- `title` (TEXT) - Block-Titel
- `description` (TEXT) - Optionale Beschreibung
- `event_type` (TEXT) - Typ für Farb-/Icon-Zuweisung
- `start_time` (TIME) - Startzeit (24h-Format)
- `end_time` (TIME) - Endzeit (24h-Format)
- `duration_minutes` (INTEGER) - Automatisch berechnet
- `location_name` (TEXT) - Location-Name
- `location_address` (TEXT) - Location-Adresse
- `color` (TEXT) - Hex-Farbe basierend auf Event-Typ
- `icon` (TEXT) - Lucide React Icon-Name
- `sort_order` (INTEGER) - Anzeigereihenfolge
- `is_expanded` (BOOLEAN) - UI-Status für aufgeklappt/zugeklappt
- `notes` (TEXT) - Zusätzliche Notizen

**Event-Typen und Farben:**
- `getting_ready` → #E8B4F5 (Rosa/Lila)
- `ceremony` → #A78BFA (Violett)
- `cocktail` → #F5B800 (Gold)
- `photoshoot` → #60A5FA (Blau)
- `dinner` → #F87171 (Rot)
- `party` → #34D399 (Grün)
- `transfer` → #94A3B8 (Grau)
- `other` → #FCD34D (Gelb)

### 2. `wedding_day_timeline_items`
Minutengenaue Events innerhalb jedes Blocks

**Felder:**
- `id` (UUID, PK)
- `block_id` (UUID, FK → wedding_day_blocks)
- `title` (TEXT) - Event-Titel
- `start_time` (TIME) - Startzeit
- `duration_minutes` (INTEGER) - Dauer
- `assigned_person` (TEXT) - Verantwortliche Person
- `notes` (TEXT) - Zusätzliche Notizen
- `sort_order` (INTEGER) - Anzeigereihenfolge

### 3. `wedding_day_vendors`
Dienstleister/Service-Provider für Blöcke

**Felder:**
- `id` (UUID, PK)
- `block_id` (UUID, FK → wedding_day_blocks)
- `vendor_id` (UUID, FK → vendors, optional)
- `vendor_name` (TEXT) - Name
- `role` (TEXT) - Rolle (z.B. "Fotograf", "Musiker")
- `arrival_time` (TIME) - Erwartete Ankunft
- `departure_time` (TIME) - Erwartete Abfahrt
- `contact_phone` (TEXT) - Kontaktnummer
- `is_confirmed` (BOOLEAN) - Bestätigungsstatus
- `notes` (TEXT) - Zusätzliche Notizen

### 4. `wedding_day_packing_list`
Items zum Einpacken für jeden Event-Block

**Felder:**
- `id` (UUID, PK)
- `block_id` (UUID, FK → wedding_day_blocks)
- `item_name` (TEXT) - Item-Name
- `quantity` (INTEGER) - Anzahl der Items
- `category` (TEXT) - Kategorie (ceremony, deco, emergency, other)
- `is_packed` (BOOLEAN) - Verpackungsstatus
- `assigned_to` (TEXT) - Verantwortlich für Verpackung
- `notes` (TEXT) - Zusätzliche Notizen
- `sort_order` (INTEGER) - Anzeigereihenfolge

**Kategorien:**
- `ceremony` → Zeremonie
- `deco` → Deko
- `emergency` → Notfall
- `other` → Sonstiges

### 5. `wedding_day_checklist`
Vor-Event-Checklisten-Items für jeden Block

**Felder:**
- `id` (UUID, PK)
- `block_id` (UUID, FK → wedding_day_blocks)
- `task_title` (TEXT) - Aufgaben-Titel
- `description` (TEXT) - Aufgaben-Beschreibung
- `is_completed` (BOOLEAN) - Erledigungsstatus
- `completed_at` (TIMESTAMPTZ) - Wann erledigt
- `completed_by` (TEXT) - Wer hat es erledigt
- `due_before_minutes` (INTEGER) - Minuten vor Block-Start
- `priority` (TEXT) - high, medium, low
- `assigned_to` (TEXT) - Verantwortliche Person
- `sort_order` (INTEGER) - Anzeigereihenfolge

**Prioritäten:**
- `high` → Rot (#F87171)
- `medium` → Orange (#FB923C)
- `low` → Grün (#34D399)

## Komponenten-Struktur

### Hauptkomponenten

#### `WeddingDayTimeline.tsx`
- Hauptseite mit vertikaler Zeitachse (00:00 - 24:00 Uhr)
- Liste aller Event-Blöcke
- Statistiken (Anzahl Blöcke, erste/letzte Event-Zeit)
- "Block hinzufügen"-Funktionalität
- **Live-Tracking-Button** (grün, führt zur Live-Ansicht)

#### `EventBlock.tsx`
- Aufklappbare Event-Block-Karten
- Header mit Icon, Titel, Zeitspanne, Location
- Status-Anzeige (Timeline-Punkte, Dienstleister, Packlisten-Fortschritt, Checklisten-Fortschritt)
- 4-Tab-Navigation (Timeline, Dienstleister, Packliste, Checkliste)
- Edit/Delete-Buttons

#### `BlockEditModal.tsx`
- Modal zum Erstellen/Bearbeiten von Event-Blöcken
- Event-Typ-Auswahl mit automatischer Farb-/Icon-Zuweisung
- Zeitauswahl (24h-Format)
- Automatische Dauer-Berechnung
- Location-Eingabe

### Tab-Komponenten

#### `TimelineTab.tsx`
**Features:**
- Vertikale Mini-Timeline innerhalb des Blocks
- Timeline-Punkte mit Startzeit, Dauer, verantwortlicher Person
- Endzeit-Berechnung
- "Timeline-Punkt hinzufügen"-Modal
- Notizen-Unterstützung

#### `VendorsTab.tsx`
**Features:**
- Grid-Layout von Dienstleister-Karten
- Bestätigungs-Status-Toggle (bestätigt/ausstehend)
- Ankunfts- und Abfahrtszeiten
- Click-to-Call-Link für Telefonnummern
- "Dienstleister hinzufügen"-Modal
- Verknüpfung zu Vendor-Modul möglich

#### `PackingListTab.tsx`
**Features:**
- Kategoriebasierte Gruppierung
- Touch-freundliche Checkboxen
- Fortschrittsbalken mit Prozentanzeige
- Filter: "Nur ungepackte anzeigen"
- Kategorie-Filter (Alle, Zeremonie, Deko, Notfall, Sonstiges)
- Zuständige Personen-Zuweisung

#### `ChecklistTab.tsx`
**Features:**
- Prioritätsbasierte Sortierung (Hoch → Mittel → Niedrig)
- Fortschrittskreis mit Prozentanzeige
- Fälligkeit (Minuten vor Block-Start)
- Zeitstempel bei Erledigung
- Filter: Alle/Offen/Erledigt
- Touch-freundliche Checkboxen

### Live-Tracking-Komponente

#### `WeddingDayLiveTracking.tsx`
**Features:**
- Vollbild-Ansicht für den Hochzeitstag
- Aktueller Block prominent hervorgehoben
- Echtzeit-Status: "LÄUFT" (grün) oder "BALD" (blau)
- Fortschrittsbalken für aktuellen Block
- Nächste 3 Timeline-Punkte sichtbar
- Countdown zum nächsten Block
- Quick-Actions:
  - Checklisten-Items abhaken
  - Dienstleister anrufen (Click-to-Call)
- Aktive Dienstleister-Liste
- Warnung für nicht gepackte Items
- Tagesübersicht aller Blöcke
- Auto-Refresh alle 30 Sekunden
- "Zurück zur Planung"-Button

## Benutzerführung

### Planungsphase (WeddingDayTimeline)

1. **Event-Block erstellen:**
   - Klick auf "Block hinzufügen"
   - Event-Typ auswählen (automatische Farbe/Icon)
   - Titel, Zeiten, Location eingeben
   - Speichern

2. **Block befüllen:**
   - Block aufklappen
   - Tab wählen (Timeline/Dienstleister/Packliste/Checkliste)
   - Items hinzufügen, bearbeiten, löschen

3. **Timeline-Tab:**
   - "Hinzufügen" klicken
   - Titel, Startzeit, Dauer, Verantwortliche Person eingeben
   - Notizen optional
   - Speichern

4. **Dienstleister-Tab:**
   - "Hinzufügen" klicken
   - Name, Rolle, Ankunft/Abfahrt, Telefon eingeben
   - Bestätigungs-Checkbox aktivieren
   - Speichern

5. **Packliste-Tab:**
   - "Hinzufügen" klicken
   - Item-Name, Anzahl, Kategorie eingeben
   - Zuständige Person zuweisen
   - Später: Checkbox aktivieren wenn gepackt

6. **Checkliste-Tab:**
   - "Hinzufügen" klicken
   - Aufgaben-Titel, Beschreibung, Priorität eingeben
   - Fälligkeit (Minuten vor Block) festlegen
   - Zuständige Person zuweisen
   - Später: Checkbox aktivieren wenn erledigt

### Live-Tracking-Phase (am Hochzeitstag)

1. **Live-Tracking öffnen:**
   - Klick auf grünen "Live-Tracking"-Button
   - Vollbild-Ansicht wird angezeigt

2. **Aktuellen Block sehen:**
   - Großer Block oben zeigt aktuelles Event
   - Fortschrittsbalken zeigt Status
   - Nächste 3 Timeline-Punkte sichtbar

3. **Dienstleister kontaktieren:**
   - Liste der aktiven Dienstleister
   - Klick auf Telefon-Icon zum Anrufen

4. **Aufgaben abhaken:**
   - Offene Aufgaben in separater Box
   - Klick auf Checkbox zum Abhaken

5. **Warnungen beachten:**
   - Rot markierte Box zeigt nicht gepackte Items

6. **Tagesübersicht:**
   - Alle Blöcke am unteren Rand
   - Vergangene Blöcke grau/durchgestrichen
   - Aktueller Block gold hervorgehoben
   - Kommende Blöcke normal

7. **Zurück zur Planung:**
   - Klick auf "Zurück zur Planung"-Button oben links

## Technische Details

### State Management
- React State Hooks für lokale Komponenten-States
- Supabase Realtime für Echtzeit-Updates
- Lokale Caching für Offline-Fähigkeit (vorbereitet)

### Performance
- Lazy-Loading für Tabs
- Debounced Auto-Save (vorbereitet)
- Optimistic UI-Updates
- Virtualisierte Listen bei vielen Items (vorbereitet)

### Sicherheit
- Row Level Security (RLS) auf allen Tabellen
- Benutzer können nur ihre eigenen Wedding-Daten sehen
- Policies für SELECT, INSERT, UPDATE, DELETE

### Responsive Design
- Desktop: Volle Breite mit Zeitachse links
- Tablet: Angepasstes Layout
- Mobile: Ein-Spalten-Layout, horizontales Tab-Scrolling

### Toast-Benachrichtigungen
- **Success:** Grün (z.B. "Event-Block erstellt")
- **Error:** Rot (z.B. "Fehler beim Speichern")
- **Warning:** Orange (z.B. "Überschneidung erkannt")

## Zukünftige Erweiterungen

### Geplante Features (nicht implementiert)
- [ ] Drag & Drop für Block-Neuordnung
- [ ] Template-System (vordefinierte Tagesabläufe)
- [ ] Export als PDF/Druckansicht
- [ ] QR-Code für mobile Ansicht
- [ ] Push-Benachrichtigungen am Hochzeitstag
- [ ] Team-Synchronisation (mehrere Nutzer gleichzeitig)
- [ ] Fahrtzeit-Berechnung zwischen Locations
- [ ] Wetter-Integration
- [ ] Foto-Upload pro Timeline-Punkt (nach Hochzeit)

## Troubleshooting

### Problem: Blöcke werden nicht geladen
**Lösung:** Prüfen Sie, ob die Wedding-ID korrekt ist und RLS-Policies aktiviert sind.

### Problem: Live-Tracking zeigt falschen Block
**Lösung:** Auto-Refresh läuft alle 30 Sekunden. Warten Sie oder laden Sie die Seite neu.

### Problem: Checkboxen reagieren nicht
**Lösung:** Prüfen Sie die Netzwerkverbindung und Supabase-RLS-Policies.

### Problem: Fortschrittsbalken stimmt nicht
**Lösung:** Basiert auf aktueller Systemzeit. Prüfen Sie Gerät-Zeit-Einstellungen.

## Integration mit anderen Modulen

### Vendor-Modul
- Dienstleister aus Vendor-Modul wählbar
- Verknüpfung über `vendor_id`
- Kontaktdaten automatisch übernommen

### Budget-Modul (zukünftig)
- Kosten pro Block anzeigbar
- Dienstleister-Kosten verknüpft

### Aufgaben-Modul (zukünftig)
- Checklisten-Items als Aufgaben synchronisierbar
- Bidirektionale Synchronisation

## API-Endpunkte

Alle Operationen laufen über Supabase JavaScript Client:

```typescript
// Blocks laden
supabase.from('wedding_day_blocks').select('*').eq('wedding_id', weddingId)

// Block erstellen
supabase.from('wedding_day_blocks').insert({ ...data })

// Block aktualisieren
supabase.from('wedding_day_blocks').update({ ...data }).eq('id', blockId)

// Block löschen (CASCADE löscht alle verknüpften Daten)
supabase.from('wedding_day_blocks').delete().eq('id', blockId)
```

## Best Practices

1. **Vor dem Hochzeitstag:**
   - Alle Blöcke vollständig planen
   - Alle Checklisten erstellen
   - Alle Packlisten erstellen
   - Dienstleister bestätigen

2. **Am Hochzeitstag:**
   - Live-Tracking auf Tablet/Smartphone öffnen
   - Team-Mitgliedern Zugang geben
   - Regelmäßig Checklisten abhaken
   - Bei Verzögerungen: Zeiten anpassen

3. **Performance:**
   - Nicht mehr als 20 Blöcke pro Tag
   - Nicht mehr als 30 Timeline-Items pro Block
   - Regelmäßig abgehakte Items archivieren

## Support

Bei Fragen oder Problemen:
- Prüfen Sie diese Dokumentation
- Überprüfen Sie Browser-Console auf Fehler
- Kontaktieren Sie den Support mit Screenshots und Fehlermeldungen
