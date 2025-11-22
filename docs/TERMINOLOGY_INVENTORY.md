# 📋 Traumtag Helden - Terminologie-Inventar

**Datum:** 2025-11-03
**Status:** Analyse-Phase

---

## 🔍 GEFUNDENE INKONSISTENZEN

### 1. BUDGET-MODUL

#### Hauptentität: Budget-Posten
**Variationen gefunden:**
- ✅ `BudgetItem` (TypeScript Interface - STANDARD)
- ✅ `budget_items` (Datenbank-Tabelle - STANDARD)
- ❌ `BudgetEntry` (gefunden in älteren Kommentaren)
- ❌ `CostItem` (nirgends aktiv, aber in Terminologie-Checks erwähnt)
- ❌ `Budgetposten` (UI-Text - INKONSISTENT)
- ❌ `Eintrag` (UI-Text - VAGE)

**UI-Texte:**
- "Neuen Budgetposten hinzufügen" ✅
- "Budget-Eintrag" ❌
- "Kosten-Item" ❌

#### Manager-Komponenten (KRITISCH - DUPLIKATE!)
- ✅ `BudgetManager.tsx` (956 Zeilen) - VERWENDET? ❌
- ✅ `BudgetManagerNew.tsx` (Aktiv in Dashboard.tsx:820)
- ❌ `BudgetManager.tsx.bak` (GELÖSCHT ✅)
- ❌ `BudgetManager.tsx.old` (GELÖSCHT ✅)

**PROBLEM:** Zwei aktive BudgetManager! Nur `BudgetManagerNew` wird genutzt.

#### Related Entities:
- `BudgetCategory` / `budget_categories` ✅ KONSISTENT
- `BudgetPayment` / `budget_payments` ✅ KONSISTENT
- `BudgetAttachment` / `budget_attachments` ✅ KONSISTENT
- `BudgetPartnerSplit` / `budget_partner_splits` ✅ KONSISTENT
- `BudgetTag` / `budget_tags` ✅ KONSISTENT
- `BudgetHistory` / `budget_history` ✅ KONSISTENT

---

### 2. TIMELINE-MODUL

#### Hauptentität: Timeline-Event
**Variationen gefunden:**
- ✅ `TimelineEvent` (TypeScript Interface - STANDARD)
- ✅ `wedding_timeline` (Datenbank-Tabelle - INKONSISTENT!)
- ❌ `Event` (zu generisch)
- ❌ `Termin` (Deutsch, gefunden in UI)
- ❌ `Block` (Verwechslung mit Block-Planning)

**Datenbank-Inkonsistenz:**
```
Interface: TimelineEvent
Tabelle:   wedding_timeline  ← PLURAL FEHLT!
```

**UI-Texte:**
- "Timeline-Event" ✅
- "Event" (zu vage) ❌
- "Termin" ❌
- "Zeitblock" ❌

#### Related Entities:
- `TimelineBlockSubtask` ✅ KONSISTENT
- `TimelineBlockChecklistItem` ✅ KONSISTENT
- `TimelineBlockItem` ✅ KONSISTENT
- `TimelineEventGuestAttendance` ✅ KONSISTENT

---

### 3. DIENSTLEISTER-MODUL

#### Hauptentität: Dienstleister
**Variationen gefunden:**
- ✅ `Vendor` (TypeScript Interface - ENGLISCH!)
- ✅ `vendors` (Datenbank-Tabelle - ENGLISCH!)
- ❌ `Dienstleister` (UI-Text - DEUTSCH!)
- ❌ `Anbieter` (gefunden in alten Kommentaren)
- ❌ `Service Provider` (nirgends)

**PROBLEM:** Code ENGLISCH, UI DEUTSCH!

**UI-Texte:**
- "Dienstleister" (konsistent deutsch) ✅
- "Vendor" (sollte nicht in UI sein) ❌

#### Related Entities:
- `VendorEventAssignment` ✅ KONSISTENT
- `VendorPayment` (vendor_payments Tabelle FEHLT in Schema!) ❌
- `VendorAttachment` (vendor_attachments Tabelle FEHLT!) ❌
- `VendorActivityLog` (vendor_activity_log Tabelle FEHLT!) ❌

---

### 4. AUFGABEN-MODUL

#### Hauptentität: Aufgabe
**Variationen gefunden:**
- ✅ `Task` (TypeScript Interface - ENGLISCH!)
- ✅ `tasks` (Datenbank-Tabelle - ENGLISCH!)
- ❌ `Aufgabe` (UI-Text - DEUTSCH!)
- ❌ `ToDo` (nirgends, aber häufiger Begriff)

**PROBLEM:** Code ENGLISCH, UI DEUTSCH!

**UI-Texte:**
- "Aufgabe" ✅ KONSISTENT deutsch
- "Task" ❌ sollte nicht in UI

#### Related Entities:
- `TaskSubtask` ✅ KONSISTENT
- `TaskDependency` ✅ KONSISTENT
- `RecurringTask` ✅ KONSISTENT
- `TaskComment` ✅ KONSISTENT
- `TaskAttachment` ✅ KONSISTENT

---

### 5. GÄSTE-MODUL

#### Hauptentität: Gast
**Variationen gefunden:**
- ✅ `Guest` (TypeScript Interface - ENGLISCH!)
- ✅ `guests` (Datenbank-Tabelle - ENGLISCH!)
- ❌ `Gast` (UI-Text - DEUTSCH!)

**PROBLEM:** Code ENGLISCH, UI DEUTSCH!

**UI-Texte:**
- "Gast" ✅ KONSISTENT deutsch
- "Gäste" ✅ KONSISTENT deutsch
- "Guest" ❌ sollte nicht in UI

#### Related Entities:
- `GuestGroup` ✅ KONSISTENT
- `FamilyGroup` ✅ KONSISTENT

---

### 6. ZAHLUNGEN-TERMINOLOGIE

**Variationen gefunden:**
- `Payment` (Code) ✅
- `Zahlung` (UI - Deutsch) ✅
- `Rate` (UI - für Teilzahlungen) ⚠️
- `Teilzahlung` (UI) ✅

**Payment Types:**
- `deposit` → "Anzahlung" ✅
- `milestone` → "Teilzahlung" ✅
- `final` → "Restzahlung" ✅
- `monthly` → "Monatliche Rate" ✅

---

### 7. STATUS-FELDER

#### RSVP Status (Gäste):
**DB-Werte:**
- `planned` → "Geplant" ✅
- `invited` → "Eingeladen" ✅
- `accepted` → "Zugesagt" ✅
- `declined` → "Abgesagt" ✅

#### Payment Status:
**DB-Werte:**
- `pending` → "Ausstehend" ✅
- `paid` → "Bezahlt" ✅
- `partial` → "Teilweise bezahlt" ✅
- `overdue` → "Überfällig" ✅

#### Task Status:
**DB-Werte:**
- `pending` → "Ausstehend" ✅
- `in_progress` → "In Bearbeitung" ✅
- `completed` → "Erledigt" ✅

---

### 8. SUBSCRIPTION-TERMINOLOGIE

**Plan Names:**
- `free` → "Free" ✅
- `premium` → "Premium" ✅

**UI-Texte:**
- "Kostenlos" ❌ (sollte "Free" sein)
- "Free Plan" ✅
- "Premium" ✅

---

## 📊 DATEI-DUPLIKATE

### Components with Duplicates:
1. **BudgetManager**
   - `BudgetManager.tsx` (956 Zeilen) - ❌ NICHT VERWENDET
   - `BudgetManagerNew.tsx` - ✅ AKTIV verwendet

2. **CategoryManager**
   - `CategoryManager.tsx` (595 Zeilen) - ❓ Verwendung unklar
   - `BudgetCategoryManager.tsx` (595 Zeilen) - ✅ AKTIV?

---

## 🔗 VERKNÜPFUNGS-ANALYSE

### Budget ↔ Vendor:
- ✅ `budget_items.vendor_id` → `vendors.id`
- ✅ Sync-Trigger vorhanden
- ⚠️ UI zeigt nicht immer Live-Updates

### Budget ↔ Timeline:
- ✅ `budget_items.timeline_event_id` → `wedding_timeline.id`
- ⚠️ Keine Auto-Update bei Timeline-Änderung

### Task ↔ Budget:
- ✅ `tasks.budget_item_id` → `budget_items.id`
- ⚠️ Status-Sync unklar

### Task ↔ Timeline:
- ✅ `tasks.timeline_event_id` → `wedding_timeline.id`
- ⚠️ Keine Cascade-Updates

### Vendor ↔ Timeline:
- ✅ `vendors.timeline_event_id` → `wedding_timeline.id`
- ✅ `vendor_event_assignments` Tabelle vorhanden

---

## 🚨 KRITISCHE BEFUNDE

### 1. Sprach-Inkonsistenz (Code vs. UI)
**Problem:** Code ENGLISCH (Task, Guest, Vendor), UI DEUTSCH (Aufgabe, Gast, Dienstleister)
**Impact:** Verwirrt Entwickler, erschwert Debugging
**Lösung:** EINHEITLICH - Entweder alles EN oder DE

### 2. Doppelte Manager
**Problem:** `BudgetManager.tsx` und `BudgetManagerNew.tsx` existieren
**Impact:** Verwirrung, Code-Redundanz
**Lösung:** Alten löschen, New → Budget umbenennen

### 3. Tabellen-Namen Inkonsistenz
**Problem:** `TimelineEvent` Interface, aber `wedding_timeline` Tabelle
**Impact:** Code schwerer lesbar
**Lösung:** Umbenennen zu `timeline_events` oder Interface zu `WeddingTimeline`

### 4. Fehlende Tabellen
**Problem:** Vendor-Related Tabellen in Migrations erwähnt, aber nicht im Schema
- `vendor_payments`
- `vendor_attachments`
- `vendor_activity_log`

**Impact:** Features funktionieren nicht
**Lösung:** Migrations prüfen und Schema vervollständigen

---

## 📝 EMPFOHLENER KANON (Nächster Schritt)

Wird in `TERMINOLOGY_CANON.md` definiert.

