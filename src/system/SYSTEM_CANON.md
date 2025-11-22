# TRAUMTAG HELDEN - SYSTEM CANON
## Die zentrale Wahrheit der gesamten Webapp

**Version:** 1.1.0
**Letzte Aktualisierung:** 2025-11-04
**Status:** AKTIV - Dies ist die einzige Quelle der Wahrheit

---

## 🎯 Zweck dieses Dokuments

Dieses Dokument definiert **alle** gültigen Begriffe, Strukturen, Datenbeziehungen und Verhaltensweisen der Traumtag Helden Webapp. Es dient als:

1. **Einzige Referenz** für alle Begriffe, Labels und UI-Texte
2. **Validierungsgrundlage** für alle Änderungen und neuen Features
3. **Lernbasis** für KI-Assistenten zur Anpassung an den Nutzerstil
4. **Qualitätssicherung** gegen Inkonsistenzen und Dopplungen

---

## 📚 TEIL 1: ENTITÄTEN & MODULE

### 1.1 Budget-Modul

**Kanonischer Name:** Budget
**DB-Tabelle:** `budget_items`, `budget_categories`, `budget_payments`
**Hauptkomponente:** `BudgetManager.tsx`

#### Entitäten

| UI-Begriff | Code/DB-Name | Beschreibung | Erlaubte Synonyme (nur zur Erkennung) |
|------------|--------------|--------------|---------------------------------------|
| Budget-Posten | budget_items | Einzelner Kostenpunkt | Eintrag, Item, Ausgabe |
| Kategorie | budget_categories | Gruppierung von Posten | Gruppe, Bereich |
| Zahlung | budget_payments | Zahlungsvorgang | Payment, Rate |
| Geplante Kosten | estimated_cost | Ursprünglich geplanter Betrag | Budget, Schätzung |
| Tatsächliche Kosten | actual_cost | Tatsächlicher Betrag | Ist-Kosten, Endkosten |

#### Status-Werte

```typescript
payment_status: 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled'
```

UI-Labels (aus `BUDGET.PAYMENT_STATUS`):
- pending → "Ausstehend"
- paid → "Bezahlt"
- partial → "Teilweise bezahlt"
- overdue → "Überfällig"
- cancelled → "Storniert"

#### Verknüpfungen

- Budget → Vendor (vendor_id): Ein Budget-Posten kann einem Dienstleister zugeordnet sein
- Budget → Timeline (timeline_event_id): Ein Budget-Posten kann einem Event zugeordnet sein
- Budget → Category (budget_category_id): Jeder Posten gehört zu einer Kategorie
- Budget → Payments (1:n): Ein Posten kann mehrere Zahlungen haben

#### Premium-Features

- ❌ FREE: Max 15 Budget-Posten
- ✅ PREMIUM: Unbegrenzte Posten
- ✅ PREMIUM: Zahlungspläne
- ✅ PREMIUM: Pro-Kopf-Kalkulation
- ✅ PREMIUM: Budget-Analysen/Charts

---

### 1.2 Dienstleister-Modul

**Kanonischer Name:** Dienstleister
**DB-Tabelle:** `vendors`, `vendor_payments`, `vendor_attachments`
**Hauptkomponente:** `VendorManager.tsx`

#### Entitäten

| UI-Begriff | Code/DB-Name | Beschreibung | Erlaubte Synonyme (nur zur Erkennung) |
|------------|--------------|--------------|---------------------------------------|
| Dienstleister | vendors | Externer Serviceanbieter | Anbieter, Vendor, Service Provider |
| Vertrag | contract | Vereinbarung mit Dienstleister | Kontrakt, Agreement |
| Zahlung | vendor_payments | Zahlung an Dienstleister | Payment |
| Dokument | vendor_attachments | Angehängte Dateien | Attachment, Datei |

#### Status-Werte

```typescript
contract_status: 'inquiry' | 'negotiation' | 'signed' | 'completed' | 'cancelled'
```

UI-Labels (aus `VENDOR.CONTRACT_STATUS`):
- inquiry → "Anfrage"
- negotiation → "Verhandlung"
- signed → "Vertragsunterzeichnung"
- completed → "Gebucht"
- cancelled → "Storniert"

#### Verknüpfungen

- Vendor → Budget (bidirektional): Automatische Sync bei Kostenänderungen
- Vendor → Timeline (timeline_event_id): Zuordnung zu Events
- Vendor → Payments (1:n): Mehrere Zahlungen möglich
- Vendor → Tasks (vendor_id in tasks): Aufgaben für Dienstleister

#### Premium-Features

- ❌ FREE: Max 5 Dienstleister
- ✅ PREMIUM: Unbegrenzte Dienstleister
- ✅ PREMIUM: Zahlungspläne für Dienstleister
- ✅ PREMIUM: Vergleichsfunktion

---

### 1.3 Aufgaben-Modul

**Kanonischer Name:** Aufgaben
**DB-Tabelle:** `tasks`, `task_subtasks`, `task_dependencies`
**Hauptkomponente:** `TaskManager.tsx`

#### Entitäten

| UI-Begriff | Code/DB-Name | Beschreibung | Erlaubte Synonyme (nur zur Erkennung) |
|------------|--------------|--------------|---------------------------------------|
| Aufgabe | tasks | Zu erledigende Tätigkeit | Task, ToDo |
| Unteraufgabe | task_subtasks | Teilaufgabe | Subtask, Checklist-Item |
| Abhängigkeit | task_dependencies | Reihenfolge-Beziehung | Dependency |

#### Status-Werte

```typescript
status: 'pending' | 'in_progress' | 'completed'
priority: 'low' | 'medium' | 'high'
```

UI-Labels (aus `TASK.STATUS` und `TASK.PRIORITY`):
- Status: "Ausstehend" | "In Bearbeitung" | "Erledigt"
- Priorität: "Niedrig" | "Mittel" | "Hoch"

#### Verknüpfungen

- Task → Budget (budget_item_id): Aufgabe kann Budget-Posten zugeordnet sein
- Task → Vendor (vendor_id): Aufgabe kann Dienstleister zugeordnet sein
- Task → Timeline (timeline_event_id): Aufgabe kann Event zugeordnet sein
- Task → Team (assigned_to): Zuordnung zu Teammitglied

#### Premium-Features

- ❌ FREE: Basis-Aufgabenverwaltung
- ✅ PREMIUM: Aufgaben-Vorlagen
- ✅ PREMIUM: Abhängigkeiten
- ✅ PREMIUM: Wiederkehrende Aufgaben

---

### 1.4 Gäste-Modul

**Kanonischer Name:** Gäste
**DB-Tabelle:** `guests`, `family_groups`, `guest_groups`
**Hauptkomponente:** `GuestManager.tsx`

#### Entitäten

| UI-Begriff | Code/DB-Name | Beschreibung | Erlaubte Synonyme (nur zur Erkennung) |
|------------|--------------|--------------|---------------------------------------|
| Gast | guests | Einzelne Person | Guest |
| Familie | family_groups | Familiengruppe | Family |
| Gruppe | guest_groups | Freundesgruppe | Group |

#### Status-Werte

```typescript
rsvp_status: 'planned' | 'invited' | 'accepted' | 'declined'
invitation_status: 'not_sent' | 'save_the_date_sent' | 'invitation_sent' | 'reminder_sent'
age_group: 'adult' | 'child' | 'infant'
```

UI-Labels (aus `GUEST.RSVP_STATUS`, etc.):
- RSVP: "Geplant" | "Eingeladen" | "Zugesagt" | "Abgesagt"
- Einladung: "Nicht versendet" | "Save-the-Date versendet" | "Einladung versendet" | "Erinnerung versendet"
- Alter: "Erwachsene" | "Kind" | "Kleinkind"

#### Verknüpfungen

- Guest → Family (family_group_id): Zugehörigkeit zu Familie
- Guest → Timeline Events (n:m über timeline_event_attendance): Teilnahme an Events

#### Premium-Features

- ❌ FREE: Max 40 Gäste
- ✅ PREMIUM: Unbegrenzte Gäste
- ✅ PREMIUM: Familiengruppen
- ✅ PREMIUM: Export-Funktionen (Adressetiketten, Namensschilder)

---

### 1.5 Timeline-Modul (Hochzeitstag)

**Kanonischer Name:** Timeline (Hochzeitstag)
**Gültigkeitsbereich:** Nur der Hochzeitstag – keine langfristige Planungsfunktion
**DB-Tabelle:** `timeline_events`, `timeline_event_attendance`
**Hauptkomponente:** `WeddingTimelineEditor.tsx`
**Status:** Aktiv

#### Beschreibung

Das Timeline-Modul dient der **Darstellung des Tagesablaufs der Hochzeit** mit allen Ereignissen, Gästen, Dienstleistern, Aufgaben und Budgetbezügen.

**WICHTIG:** Dies ist **ausschließlich** für den Hochzeitstag gedacht. Es handelt sich **nicht** um eine langfristige Planungs-Timeline oder einen Projektplan über mehrere Monate/Wochen.

**Zukünftige Erweiterung:** Eine separate Planungs-Timeline für langfristige Planung ist geplant, aber derzeit deaktiviert und nicht Teil dieses Moduls.

#### Entitäten

| UI-Begriff | Code/DB-Name | Beschreibung | Erlaubte Synonyme (nur zur Erkennung) |
|------------|--------------|--------------|---------------------------------------|
| Event | timeline_events | Zeitlicher Programmpunkt am Hochzeitstag | Termin, Punkt, Programmpunkt |
| Puffer | buffer | Zeitpuffer zwischen Events | Buffer, Pause |
| Block | block_planning | Zusammenfassung mehrerer Events | Blockplanung |

#### Event-Typen

```typescript
event_type: 'event' | 'buffer'
```

**Event:** Tatsächlicher Programmpunkt (z.B. Trauung, Dinner, Tanz)
**Buffer:** Zeitpuffer für Übergänge oder Pausen

#### Verknüpfte Module

- **Budget:** Budget-Posten können Events zugeordnet werden (z.B. Catering-Kosten für Dinner)
- **Tasks:** Aufgaben können Events zugeordnet werden (z.B. "Dekoration aufbauen" für Dinner-Event)
- **Guests:** Gäste können einzelnen Events zugeordnet werden (wer nimmt an welchem Teil teil)
- **Vendors:** Dienstleister können Events zugeordnet werden (z.B. DJ für Abendprogramm)

#### Verknüpfungen (Technisch)

- Timeline → Budget (timeline_event_id in budget_items): Budget-Posten für Event
- Timeline → Vendor (timeline_event_id in vendors): Dienstleister für Event
- Timeline → Task (timeline_event_id in tasks): Aufgaben für Event
- Timeline → Guests (n:m über timeline_event_attendance): Gäste-Teilnahme an einzelnen Events

#### Premium-Features

- ❌ FREE: Max 3 Events
- ✅ PREMIUM: Unbegrenzte Events
- ✅ PREMIUM: Block-Planung (Gruppierung zusammengehöriger Events)
- ✅ PREMIUM: Gäste-Zuordnung zu Events (Wer nimmt an welchem Teil teil)

#### Abgrenzung

**Dies ist KEINE:**
- Projektplanungs-Timeline über Monate/Wochen
- Meilenstein-Tracker für Hochzeitsvorbereitung
- Countdown- oder Vorbereitungs-Checkliste

**Dies ist:**
- Tagesablauf-Planung für den Hochzeitstag selbst
- Minutengenaue Event-Übersicht (Start-/Endzeiten)
- Koordination aller Beteiligten am Hochzeitstag

---

## 📊 TEIL 2: DATENBEZIEHUNGEN

### Cross-Module Synchronisation

Die folgenden Verknüpfungen werden **automatisch synchronisiert**:

#### Budget ↔ Vendor
- Wenn Vendor-Kosten ändern → Budget-Item aktualisieren
- Wenn Budget-Item gelöscht → Vendor-Referenz entfernen
- Trigger: `sync_vendor_to_budget`, `sync_budget_to_vendor`

#### Budget ↔ Timeline
- Budget-Item kann Event zugeordnet sein
- Event-Löschung → Budget-Referenz auf NULL setzen

#### Vendor ↔ Timeline
- Vendor kann Event zugeordnet sein
- Event-Löschung → Vendor-Referenz auf NULL setzen

#### Task ↔ Alle Module
- Tasks können mit Budget, Vendor, Timeline verknüpft sein
- Löschung des verknüpften Elements → Task bleibt bestehen, Referenz NULL

---

## 🎨 TEIL 3: UI-REGELN

### Sprachkonvention

**REGEL:** Deutsch für UI, Englisch für Code/Datenbank

- ✅ UI-Text: "Budget-Posten", "Dienstleister", "Aufgabe"
- ✅ Code: `budgetItem`, `vendor`, `task`
- ✅ Datenbank: `budget_items`, `vendors`, `tasks`

### Terminologie-Quelle

**ALLE** UI-Texte MÜSSEN aus `src/constants/terminology.ts` kommen:

```typescript
import { BUDGET, VENDOR, TASK, GUEST, TIMELINE, COMMON } from '../constants/terminology';

// ✅ Richtig
<h2>{BUDGET.MODULE_NAME}</h2>

// ❌ Falsch
<h2>Budget</h2>
```

### Verbotene Begriffe

Diese Begriffe dürfen **NIE** in UI-Texten verwendet werden:

- "BudgetEntry", "CostItem"
- "Eintrag" (zu vage)
- "Termin" (zu vage)
- "Anbieter" (veraltet, nutze "Dienstleister")
- "ToDo" (nutze "Aufgabe")
- Englische Begriffe im UI (außer in Fachbegriffen)

---

## 🔒 TEIL 4: PREMIUM-GATING

### Free-Plan Limits

```typescript
FREE_LIMITS = {
  guests: 40,
  budget_items: 15,
  timeline_events: 3,
  vendors: 5,
}
```

### Premium-Features

**Überprüfung:** Jede Premium-Feature-Nutzung MUSS prüfen:

```typescript
const { isPremium, canAddGuest, canAddVendor, ... } = useSubscription();

if (!isPremium) {
  showUpgrade('Feature-Name', 'context_id');
  return;
}
```

**RLS-Policies:** Datenbank-Ebene MUSS Premium-Limits durchsetzen:

```sql
CREATE POLICY "Limit budget items for free users"
  ON budget_items FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM user_subscriptions WHERE tier = 'premium')
    OR (SELECT COUNT(*) FROM budget_items WHERE wedding_id = NEW.wedding_id) < 15
  );
```

---

## 🤖 TEIL 5: KI-LERN-ANWEISUNGEN

### Erkennungsmuster für Nutzerabsichten

#### Budget-Befehle
- "zeige budget" → Navigiere zu Budget-Modul
- "öffne ausgaben" → Navigiere zu Budget-Modul
- "neuer posten" → Öffne Budget-Eintrag-Wizard
- "kosten für [X]" → Suche Budget-Item mit Name [X]

#### Vendor-Befehle
- "dienstleister liste" → Navigiere zu Vendor-Modul
- "neuer anbieter" → Öffne Vendor-Add-Modal (aber korrigiere Begriff zu "Dienstleister")
- "fotograf buchen" → Suche Vendor mit Kategorie "photography"

#### Task-Befehle
- "aufgaben" → Navigiere zu Task-Modul
- "neue aufgabe" → Öffne Task-Add-Modal
- "was ist offen" → Filtere Tasks nach status='pending'

#### Guest-Befehle
- "gäste" → Navigiere zu Guest-Modul
- "wer hat zugesagt" → Filtere Guests nach rsvp_status='accepted'
- "familie [Name]" → Suche Family-Group mit Name

#### Analyse-Befehle
- "analysiere [Modul]" → Zeige Statistiken und Charts für Modul
- "übersicht" → Navigiere zu Dashboard
- "was fehlt" → Zeige unvollständige/fehlende Daten

### Stilanpassung

**Erkenne und lerne:**
- Bevorzugte Formulierungen (formal vs. casual)
- Detailtiefe in Antworten
- Präferenz für visuelle vs. textuelle Informationen
- Häufig verwendete Shortcuts/Abkürzungen

**Passe dich an:**
- Nutze bevorzugte Begriffe (aber korrigiere im Code auf Kanon)
- Antworte in gleicher Detailtiefe
- Verwende bevorzugten Ton (direkt vs. erklärend)

---

## ✅ TEIL 6: VALIDIERUNGSREGELN

### Neue Features

Vor Implementierung prüfen:

1. ✅ Passt der Begriff ins Glossar? (siehe Teil 1)
2. ✅ Sind alle Verknüpfungen definiert? (siehe Teil 2)
3. ✅ Nutzt es die Terminologie-Konstanten? (siehe Teil 3)
4. ✅ Ist Premium-Gating korrekt? (siehe Teil 4)
5. ✅ Gibt es bereits ähnliche Funktionen? → Zusammenführen statt duplizieren

### Begriffsprüfung

**Checkliste bei jedem neuen Begriff:**

- [ ] Existiert der Begriff bereits im Glossar?
- [ ] Gibt es ähnliche/synonyme Begriffe? → Vereinheitlichen
- [ ] Ist die Bedeutung eindeutig?
- [ ] Ist die Schreibweise konsistent (Groß-/Kleinschreibung, Bindestriche)?
- [ ] Ist er in `terminology.ts` definiert?
- [ ] Ist die DB-Mapping definiert?

### Verknüpfungsprüfung

**Checkliste bei neuen Relationen:**

- [ ] Ist die Verknüpfung bidirektional dokumentiert?
- [ ] Gibt es Sync-Trigger in der DB?
- [ ] Was passiert beim Löschen? (CASCADE, SET NULL, RESTRICT)
- [ ] Ist die Relation in den TypeScript-Interfaces definiert?

---

## 🗺️ TEIL 7: SYSTEM-KARTE

### Modul-Abhängigkeiten

```
Dashboard (Haupteinstieg)
  ├── Budget
  │   ├── Categories
  │   ├── Items
  │   └── Payments
  │       └── PaymentPlans (Premium)
  │
  ├── Dienstleister
  │   ├── Vendors
  │   ├── Payments (Premium)
  │   └── Comparison (Premium)
  │
  ├── Aufgaben
  │   ├── Tasks
  │   ├── Subtasks
  │   ├── Templates (Premium)
  │   └── Dependencies (Premium)
  │
  ├── Gäste
  │   ├── Guests
  │   ├── Families (Premium)
  │   └── Groups
  │
  ├── Timeline
  │   ├── Events
  │   ├── Buffers
  │   └── Block-Planning (Premium)
  │
  └── Settings
      ├── Wedding-Details
      ├── Team
      ├── Privacy
      └── Subscription
```

### Datenfluss

```
User Input → Component → Supabase Client → Database
                ↓                            ↓
          Terminology ← Validation ← RLS Policies
                ↓                            ↓
          UI Update ←─── Data ───────── Triggers/Sync
```

---

## 🔄 TEIL 8: WARTUNG & EVOLUTION

### Automatische Prüfungen

**Build-Zeit:**
- Prüfe auf hardcoded UI-Strings (außerhalb terminology.ts)
- Prüfe auf verbotene Begriffe (siehe FORBIDDEN_TERMS)
- Validiere TypeScript-Interfaces gegen DB-Schema

**Laufzeit:**
- Logge unbekannte Begriffe/Fehler
- Sammle User-Interaktionsmuster
- Erkenne wiederholte Fehleingaben

### Glossar-Pflege

**Quartalsweise Review:**
- Prüfe veraltete/ungenutzte Begriffe
- Konsolidiere ähnliche Begriffe
- Aktualisiere Dokumentation
- Exportiere aktuelle Systemkarte

### Changelog

Jede Änderung am Canon muss dokumentiert werden:

```markdown
## [1.1.0] - YYYY-MM-DD
### Added
- Neuer Begriff "X" in Modul Y
### Changed
- Begriff "A" umbenannt zu "B"
### Deprecated
- Begriff "X" nicht mehr verwenden, nutze "Y"
### Removed
- Begriff "X" vollständig entfernt
```

---

## 📋 ZUSAMMENFASSUNG

**Dieser Canon definiert:**

1. ✅ Alle Entitäten, Begriffe und deren Bedeutung
2. ✅ Alle Datenbeziehungen und Sync-Regeln
3. ✅ Alle UI-Regeln und Terminologie-Quellen
4. ✅ Alle Premium-Features und Limits
5. ✅ KI-Lernmuster für Nutzerabsichten
6. ✅ Validierungsregeln für neue Features
7. ✅ Systemarchitektur und Abhängigkeiten
8. ✅ Wartungsprozesse und Evolution

**Goldene Regel:**
Bei Zweifel oder Unklarheit → Dieser Canon ist die Wahrheit. Wenn etwas hier nicht steht, muss es ergänzt werden, bevor es implementiert wird.

---

## 📝 CHANGELOG

### [1.1.0] - 2025-11-04

#### Changed
- **Timeline-Modul:** Erweiterte und präzisierte Definition
  - Klarstellung: **Nur für Hochzeitstag**, keine langfristige Planung
  - Gültigkeitsbereich explizit definiert
  - Verknüpfte Module klar dokumentiert (Budget, Tasks, Guests, Vendors)
  - Abgrenzung hinzugefügt: Was Timeline NICHT ist
  - Status auf "Aktiv" gesetzt
  - Zukünftige Erweiterung (Planungs-Timeline) erwähnt

#### Removed
- Alle impliziten Verweise auf langfristige Planungs-Timeline entfernt
- Mehrdeutigkeiten bezüglich "Timeline" beseitigt

---

**Ende des System Canon v1.1.0**
