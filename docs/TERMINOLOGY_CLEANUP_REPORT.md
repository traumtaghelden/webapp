# 🧹 Traumtag Helden - Terminologie-Bereinigung & Vereinheitlichung

**Datum:** 2025-11-03
**Status:** PLAN ERSTELLT - IMPLEMENTIERUNG AUSSTEHEND

---

## 📋 EXECUTIVE SUMMARY

Die Webapp verwendet **inkonsistente Terminologie** zwischen Code (Englisch), Datenbank (Englisch) und UI (Deutsch). Dies führt zu:
- Verwirrung bei Entwicklern
- Erschwerte Wartbarkeit
- Doppelte Komponenten (BudgetManager x2)
- Fehlende Tabellen in der Datenbank

**Lösung:** Zentrales Glossar + Systematische Umstellung

---

## ✅ BEREITS UMGESETZT

### 1. Zentrales Terminologie-System erstellt
**Datei:** `src/constants/terminology.ts`

**Features:**
- ✅ Einheitlicher Wortschatz für alle Module
- ✅ Deutsch für UI, Englisch für Code
- ✅ DB-Mapping für Kompatibilität
- ✅ Verbotene Begriffe für Build-Check
- ✅ TypeScript Types für Type-Safety

**Verwendung:**
```typescript
import { BUDGET, VENDOR, TASK, GUEST, TIMELINE } from '@/constants/terminology';

// Statt:
<button>Budget-Posten hinzufügen</button>

// Jetzt:
<button>{BUDGET.ADD_ITEM}</button>
```

---

## 🎯 KANONISCHES VOKABULAR

### Budget-Modul
| Deutsch (UI) | Englisch (Code) | Datenbank |
|--------------|-----------------|-----------|
| Budget-Posten | BudgetItem | budget_items |
| Kategorie | BudgetCategory | budget_categories |
| Zahlung | BudgetPayment | budget_payments |
| Geplante Kosten | estimatedCost | estimated_cost |
| Tatsächliche Kosten | actualCost | actual_cost |

### Dienstleister-Modul
| Deutsch (UI) | Englisch (Code) | Datenbank |
|--------------|-----------------|-----------|
| Dienstleister | Vendor | vendors |
| Vertrag | Contract | contract_status |
| Zahlung | VendorPayment | vendor_payments* |
| Ansprechpartner | ContactName | contact_name |

*Tabelle fehlt noch!

### Timeline-Modul
| Deutsch (UI) | Englisch (Code) | Datenbank |
|--------------|-----------------|-----------|
| Event | TimelineEvent | wedding_timeline |
| Puffer | Buffer | wedding_timeline (type) |
| Block-Planung | BlockPlanning | timeline_block_* |

### Aufgaben-Modul
| Deutsch (UI) | Englisch (Code) | Datenbank |
|--------------|-----------------|-----------|
| Aufgabe | Task | tasks |
| Unteraufgabe | TaskSubtask | task_subtasks |
| Fällig am | dueDate | due_date |
| Priorität | Priority | priority |

### Gäste-Modul
| Deutsch (UI) | Englisch (Code) | Datenbank |
|--------------|-----------------|-----------|
| Gast | Guest | guests |
| Gruppe | GuestGroup | guest_groups |
| Familie | FamilyGroup | family_groups |
| RSVP-Status | rsvpStatus | rsvp_status |

---

## 🔴 KRITISCHE AKTIONEN (SOFORT)

### 1. Doppelte Manager entfernen (30 Min)

**Problem:** `BudgetManager.tsx` (956 Zeilen) und `BudgetManagerNew.tsx` (282 Zeilen) existieren

**Lösung:**
```bash
# 1. Prüfen was verwendet wird
grep -r "BudgetManagerNew" src/
# Ergebnis: Nur in Dashboard.tsx:6 und :820

# 2. Alten BudgetManager löschen
rm src/components/BudgetManager.tsx

# 3. BudgetManagerNew umbenennen
mv src/components/BudgetManagerNew.tsx src/components/BudgetManager.tsx

# 4. Dashboard.tsx anpassen
# Zeile 6 löschen: import BudgetManagerNew from './BudgetManagerNew';
# Zeile 820: BudgetManagerNew → BudgetManager
```

**Impact:** -956 Zeilen, +Klarheit

---

### 2. Fehlende Vendor-Tabellen erstellen (45 Min)

**Problem:** Code referenziert Tabellen, die nicht existieren:
- `vendor_payments`
- `vendor_attachments`
- `vendor_activity_log`

**Lösung:** Migration erstellen

```sql
-- Migration: create_vendor_related_tables.sql

-- Vendor Payments
CREATE TABLE IF NOT EXISTS vendor_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  payment_date date,
  status text DEFAULT 'pending',
  payment_type text DEFAULT 'milestone',
  payment_method text DEFAULT 'bank_transfer',
  notes text,
  percentage_of_total numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_vendor_payments_vendor_id ON vendor_payments(vendor_id);
ALTER TABLE vendor_payments ENABLE ROW LEVEL SECURITY;

-- Vendor Attachments
CREATE TABLE IF NOT EXISTS vendor_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  file_type text,
  attachment_type text DEFAULT 'other',
  uploaded_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_vendor_attachments_vendor_id ON vendor_attachments(vendor_id);
ALTER TABLE vendor_attachments ENABLE ROW LEVEL SECURITY;

-- Vendor Activity Log
CREATE TABLE IF NOT EXISTS vendor_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL,
  field_changed text,
  old_value text,
  new_value text,
  changed_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_vendor_activity_vendor_id ON vendor_activity_log(vendor_id);
ALTER TABLE vendor_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies (analog zu budget_*)
-- ... (siehe vollständige Migration)
```

---

### 3. CategoryManager Duplikat prüfen (15 Min)

**Problem:** `CategoryManager.tsx` (595 Zeilen) und `BudgetCategoryManager.tsx` (595 Zeilen)

**Lösung:**
```bash
# Prüfen welche verwendet wird
rg "CategoryManager" src/ -l
rg "BudgetCategoryManager" src/ -l

# Wahrscheinlich:
# - CategoryManager.tsx = Alt/Unused
# - BudgetCategoryManager.tsx = Aktiv

# Wenn CategoryManager nicht verwendet:
rm src/components/CategoryManager.tsx
```

---

## 🟡 WICHTIGE AKTIONEN (DIESE WOCHE)

### 4. UI-Texte auf Terminologie-System umstellen (2-3 Tage)

**Strategie:**
1. **Phase 1: Budget-Modul** (4h)
   - BudgetManager.tsx
   - BudgetDetailModal.tsx
   - BudgetAddModal.tsx
   - BudgetTable.tsx

2. **Phase 2: Vendor-Modul** (3h)
   - VendorManager.tsx
   - VendorDetailModal.tsx
   - VendorCard.tsx

3. **Phase 3: Task/Guest/Timeline** (je 2h)
   - TaskManager.tsx
   - GuestManager.tsx
   - WeddingTimelineEditor.tsx

**Pattern:**
```typescript
// Vorher:
<h2>Neuen Budgetposten hinzufügen</h2>
<label>Geplante Kosten</label>
<button>Speichern</button>

// Nachher:
import { BUDGET, COMMON } from '@/constants/terminology';

<h2>{BUDGET.ADD_ITEM}</h2>
<label>{BUDGET.ESTIMATED_COST}</label>
<button>{COMMON.SAVE}</button>
```

---

### 5. Build-Check für verbotene Begriffe (1h)

**Ziel:** Verhindert künftige Terminologie-Abweichungen

**Implementation:**
```typescript
// scripts/check-terminology.ts
import { FORBIDDEN_TERMS } from '@/constants/terminology';

const checkFiles = async (pattern: string) => {
  const files = await glob(pattern);
  const violations: Array<{file: string; term: string; line: number}> = [];

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      FORBIDDEN_TERMS.forEach(term => {
        if (line.includes(term) && !line.includes('//')) {
          violations.push({
            file,
            term,
            line: index + 1
          });
        }
      });
    });
  }

  return violations;
};

// In package.json:
{
  "scripts": {
    "check:terms": "ts-node scripts/check-terminology.ts",
    "prebuild": "npm run check:terms"
  }
}
```

---

### 6. Datenbank-Feldnamen Mapping (2h)

**Problem:** UI zeigt deutsche Namen, Exports müssen englische DB-Felder verwenden

**Lösung:** Helper-Funktionen

```typescript
// utils/dbMapping.ts
import { DB_MAPPING } from '@/constants/terminology';

export const uiToDbField = (uiField: string): string => {
  return DB_MAPPING[uiField as keyof typeof DB_MAPPING] || uiField;
};

export const dbToUiField = (dbField: string): string => {
  const entry = Object.entries(DB_MAPPING).find(([_, db]) => db === dbField);
  return entry ? entry[0] : dbField;
};

// Verwendung in CSV Export:
const headers = [
  BUDGET.ITEM,           // "Budget-Posten"
  BUDGET.ESTIMATED_COST, // "Geplante Kosten"
  BUDGET.ACTUAL_COST     // "Tatsächliche Kosten"
];

const dbFields = headers.map(uiToDbField);
// ["budget_items", "estimated_cost", "actual_cost"]
```

---

## 🟢 NICE-TO-HAVE (NÄCHSTE WOCHE)

### 7. Routen-Struktur vereinheitlichen

**Aktuell:** Unstrukturiert
**Ziel:** Sprechende, konsistente URLs

```typescript
// App.tsx oder Router
const routes = {
  budget: {
    overview: '/budget',
    posten: '/budget/posten',
    kategorien: '/budget/kategorien',
    zahlungen: '/budget/zahlungen',
  },
  dienstleister: {
    overview: '/dienstleister',
    details: '/dienstleister/:id',
  },
  timeline: {
    overview: '/timeline',
    event: '/timeline/event/:id',
    block: '/timeline/block/:id',
  },
  aufgaben: {
    overview: '/aufgaben',
    details: '/aufgaben/:id',
  },
  gaeste: {
    overview: '/gaeste',
    gruppen: '/gaeste/gruppen',
    familien: '/gaeste/familien',
  }
};
```

---

### 8. Kompatibilitäts-Layer für Migration

**Ziel:** Sanfte Migration ohne Breaking Changes

```typescript
// utils/compatibility.ts

/**
 * Mappt alte Feldnamen auf neue
 * Übergangsweise für 3 Monate
 */
export const legacyFieldMapping = {
  // Budget
  'budgetEntry': 'budget_items',
  'costItem': 'budget_items',
  'plannedCost': 'estimated_cost',

  // Timeline
  'termin': 'timeline_events',
  'zeitblock': 'timeline_events',

  // etc.
};

export const mapLegacyField = (field: string): string => {
  if (field in legacyFieldMapping) {
    console.warn(`Legacy field "${field}" used. Update to "${legacyFieldMapping[field]}"`);
    return legacyFieldMapping[field];
  }
  return field;
};
```

---

## 📊 GESCHÄTZTE ZEITEN

| Task | Zeit | Priorität |
|------|------|-----------|
| Doppelte Manager entfernen | 30 min | 🔴 HOCH |
| Vendor-Tabellen erstellen | 45 min | 🔴 HOCH |
| CategoryManager prüfen | 15 min | 🔴 HOCH |
| UI-Texte umstellen (Budget) | 4h | 🟡 MITTEL |
| UI-Texte umstellen (Vendor) | 3h | 🟡 MITTEL |
| UI-Texte umstellen (Rest) | 6h | 🟡 MITTEL |
| Build-Check implementieren | 1h | 🟡 MITTEL |
| DB-Mapping Helpers | 2h | 🟡 MITTEL |
| Routen-Struktur | 3h | 🟢 NIEDRIG |
| Kompatibilitäts-Layer | 2h | 🟢 NIEDRIG |
| **GESAMT** | **22h** | **~3 Tage** |

---

## ✅ AKZEPTANZKRITERIEN

Nach Abschluss MUSS gelten:

- [ ] **Ein Begriff pro Konzept** - Budget-Posten überall, nie Eintrag/Item
- [ ] **Keine Duplikate** - Nur 1 BudgetManager, 1 CategoryManager
- [ ] **Alle Tabellen existieren** - vendor_payments, vendor_attachments, vendor_activity_log
- [ ] **Zentrales Glossar** - Alle UI-Texte aus `terminology.ts`
- [ ] **Build-Check aktiv** - Verhindert verbotene Begriffe
- [ ] **E2E-Tests bestehen** - Keine Funktionalität gebrochen
- [ ] **Premium-Gates funktionieren** - Keine Umgehungen
- [ ] **Verknüpfungen intakt** - Budget ↔ Vendor ↔ Timeline ↔ Task

---

## 🚀 NÄCHSTE SCHRITTE

### Sofort (Heute):
1. Doppelte Manager entfernen (siehe Aktion #1)
2. Vendor-Tabellen Migration erstellen (siehe Aktion #2)
3. CategoryManager Duplikat prüfen (siehe Aktion #3)

### Diese Woche:
4. Budget-Modul auf Terminologie umstellen
5. Build-Check implementieren
6. Vendor-Modul auf Terminologie umstellen

### Nächste Woche:
7. Restliche Module umstellen
8. Routen-Struktur optimieren
9. Kompatibilitäts-Layer (falls nötig)
10. Vollständige E2E-Tests

---

## 📞 SUPPORT & FRAGEN

**Glossar:** `src/constants/terminology.ts`
**Inventar:** `docs/TERMINOLOGY_INVENTORY.md`
**Dieser Bericht:** `docs/TERMINOLOGY_CLEANUP_REPORT.md`

Bei Fragen zur Verwendung der Terminologie:
1. Prüfe `terminology.ts` für den korrekten Begriff
2. Verwende die exportierten Konstanten
3. NIE hardcoded Strings für UI-Texte

