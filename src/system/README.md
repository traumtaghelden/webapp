# TRAUMTAG HELDEN - SYSTEM FUNDAMENT

## 📖 Übersicht

Das System Fundament ist das **selbstlernende, selbstkorrigierende Herzstück** der Traumtag Helden Webapp. Es definiert und überwacht:

- ✅ **Alle Begriffe, Labels und UI-Texte** (eine einzige Wahrheit)
- ✅ **Alle Datenstrukturen und Verknüpfungen** (kanonische Relationen)
- ✅ **Alle Validierungsregeln** (automatische Qualitätssicherung)
- ✅ **Alle Lernmuster** (KI-Anpassung an Nutzerstil)

---

## 🗂️ Komponenten

### 1. System Canon (`SYSTEM_CANON.md`)

**Zweck:** Die zentrale Wahrheit der gesamten Webapp.

**Inhalt:**
- Glossar aller Entitäten und Begriffe
- Definition aller Datenbeziehungen
- UI-Regeln und Terminologie-Quellen
- Premium-Feature-Dokumentation
- KI-Lern-Anweisungen
- Validierungsregeln
- System-Architektur

**Verwendung:**
```bash
# Immer vor Implementierung lesen:
cat src/system/SYSTEM_CANON.md

# Bei Unklarheit:
grep -i "budget" src/system/SYSTEM_CANON.md
```

---

### 2. Validator (`validator.ts`)

**Zweck:** Automatische Validierung gegen den Canon.

**Features:**
- ✅ Terminologie-Prüfung
- ✅ Entity-Validierung
- ✅ Naming-Konsistenz-Check
- ✅ Premium-Limit-Prüfung
- ✅ Verknüpfungs-Validierung
- ✅ Intent-Erkennung
- ✅ Pattern-Learning

**Verwendung:**

```typescript
import {
  validateTerminology,
  validateEntity,
  validateNamingConsistency,
  recognizeIntent,
  patternLearner
} from '../system/validator';

// Terminologie prüfen
const result = validateTerminology({
  text: 'Neuer Anbieter', // ❌ verboten
  context: 'ui',
  location: 'VendorForm.tsx:42'
});

if (!result.valid) {
  console.error(result.message);
  console.log(result.suggestion); // "Verwende 'Dienstleister' (VENDOR.SINGULAR)"
}

// Entity validieren
const entityResult = validateEntity({
  entityType: 'vendor',
  data: {
    name: 'Fotograf Schmidt',
    category: 'photography',
    wedding_id: 'abc-123'
  },
  context: {
    module: 'vendor',
    isPremium: false,
    existingCount: 4 // OK, Limit ist 5
  }
});

// User-Intent erkennen
const intent = recognizeIntent("zeige mir alle offenen Zahlungen");
console.log(intent);
// {
//   intent: 'search',
//   module: 'budget',
//   entities: ['zahlungen'],
//   confidence: 0.85
// }

// Pattern lernen
patternLearner.addPattern({
  userId: 'user-123',
  timestamp: new Date().toISOString(),
  input: "zeige budget",
  intent: recognizeIntent("zeige budget"),
  wasSuccessful: true
});

// User-Präferenzen abrufen
const prefs = patternLearner.getUserPreferences('user-123');
console.log(prefs);
// {
//   favoriteModule: 'budget',
//   commonActions: ['add_item', 'view_details'],
//   averageConfidence: 0.92
// }
```

---

### 3. Build-Validierung (`scripts/validate-canon.ts`)

**Zweck:** Automatische Code-Prüfung vor jedem Build.

**Prüfungen:**
- ❌ Verbotene Begriffe (FORBIDDEN_TERMS)
- ⚠️  Hardcoded UI-Strings
- ⚠️  Naming-Inkonsistenzen (camelCase vs snake_case)

**Ausführung:**

```bash
# Manuell ausführen
npm run validate-canon

# Läuft automatisch vor Build
npm run build
```

**Output-Beispiel:**

```
🔍 Starte Canon-Validierung...

✅ Validierung abgeschlossen in 1.23s
📁 Dateien gescannt: 156
📊 Gefundene Issues: 3
   - ❌ Errors: 1
   - ⚠️  Warnings: 2
   - ℹ️  Infos: 0

❌ ERRORS:

   src/components/OldComponent.tsx:42:15
   Verbotener Begriff "Anbieter" gefunden
   💡 Verwende stattdessen: "Dienstleister (VENDOR.SINGULAR)"

⚠️  WARNINGS:

   src/components/BudgetForm.tsx:105:23
   Hardcoded UI-String gefunden: "Budget-Posten"
   💡 Verwende Konstanten aus terminology.ts

📄 Vollständiger Report gespeichert: validation-report.json
```

---

### 4. KI-Instruktionen (`.bolt/SYSTEM_INSTRUCTIONS.md`)

**Zweck:** Permanente Anweisungen für KI-Assistenten.

**Inhalt:**
- Arbeitsprozess bei jedem Prompt
- Erkennungsmuster für User-Intents
- Implementierungs-Checklisten
- Lern-Mechanismus
- Antwort-Stil-Richtlinien
- Verbotene/Erlaubte Aktionen

**Verwendung:**

Diese Datei wird automatisch von KI-Assistenten (wie Claude) gelesen und befolgt. Sie definiert:

- **Wie** die KI auf Prompts reagiert
- **Was** sie prüft vor Implementierung
- **Wie** sie aus Interaktionen lernt
- **Welchen** Stil sie verwendet

---

## 🚀 Quick Start

### Für Entwickler:

1. **Vor Implementierung:**
   ```bash
   # Lies den Canon
   cat src/system/SYSTEM_CANON.md | grep -i "dein-modul"
   ```

2. **Während Implementierung:**
   ```typescript
   // Nutze immer Konstanten
   import { BUDGET, VENDOR, TASK } from '../constants/terminology';

   // ✅ Richtig
   <h2>{BUDGET.MODULE_NAME}</h2>

   // ❌ Falsch
   <h2>Budget</h2>
   ```

3. **Nach Implementierung:**
   ```bash
   # Validiere
   npm run validate-canon

   # Build
   npm run build
   ```

### Für KI-Assistenten:

1. **Vor jedem Prompt:**
   - Lies `.bolt/SYSTEM_INSTRUCTIONS.md`
   - Erkenne User-Intent mit `recognizeIntent()`

2. **Während Implementierung:**
   - Validiere mit `validator.ts`
   - Prüfe Canon bei Unklarheit

3. **Nach Implementierung:**
   - Logge Pattern mit `patternLearner`
   - Führe Build-Validierung aus

---

## 📋 Workflows

### Neues Feature implementieren

```bash
# 1. Canon prüfen
cat src/system/SYSTEM_CANON.md | grep -i "feature"

# 2. Code schreiben (mit Konstanten!)
# 3. Validieren
npm run validate-canon

# 4. Testen
npm run build

# 5. Bei neuem Begriff: Canon aktualisieren
# src/system/SYSTEM_CANON.md
# src/constants/terminology.ts
```

### Neuen Begriff hinzufügen

```typescript
// 1. In terminology.ts definieren
export const VENDOR = {
  // ... existing
  NEW_TERM: 'Neuer Begriff',
} as const;

// 2. In SYSTEM_CANON.md dokumentieren
// Siehe Abschnitt: "TEIL 1: ENTITÄTEN & MODULE"

// 3. DB_MAPPING aktualisieren (falls DB-Feld)
export const DB_MAPPING = {
  'Neuer Begriff': 'new_field',
} as const;

// 4. In Components verwenden
<button>{VENDOR.NEW_TERM}</button>

// 5. Validieren
npm run validate-canon
```

### User-Pattern analysieren

```typescript
import { patternLearner } from '../system/validator';

// Häufigste Befehle eines Users
const frequent = patternLearner.getFrequentPatterns('user-123', 10);
console.log(frequent);
// [
//   { input: "zeige budget", count: 45 },
//   { input: "neue aufgabe", count: 32 },
//   ...
// ]

// User-Präferenzen
const prefs = patternLearner.getUserPreferences('user-123');
console.log(prefs);
// {
//   favoriteModule: 'budget',
//   commonActions: ['add_item', 'edit_item', 'view_details'],
//   averageConfidence: 0.88
// }
```

---

## 🧪 Testing

### Unit Tests für Validator

```typescript
import { validateTerminology, recognizeIntent } from '../system/validator';

describe('Validator', () => {
  it('should detect forbidden terms', () => {
    const result = validateTerminology({
      text: 'Neuer Anbieter',
      context: 'ui',
      location: 'test'
    });

    expect(result.valid).toBe(false);
    expect(result.message).toContain('Verbotener Begriff');
  });

  it('should recognize budget navigation intent', () => {
    const intent = recognizeIntent('zeige budget');

    expect(intent.intent).toBe('navigate');
    expect(intent.module).toBe('budget');
    expect(intent.confidence).toBeGreaterThan(0.8);
  });
});
```

---

## 📊 Metriken & Monitoring

### Validierungs-Report

Nach jedem `npm run validate-canon` wird ein Report erstellt:

```json
{
  "timestamp": "2025-11-03T12:34:56.789Z",
  "filesScanned": 156,
  "totalIssues": 5,
  "errors": [
    {
      "file": "src/components/Old.tsx",
      "line": 42,
      "severity": "error",
      "message": "Verbotener Begriff",
      "suggestion": "Verwende VENDOR.SINGULAR"
    }
  ],
  "warnings": [...],
  "summary": {
    "hardcodedStrings": 2,
    "forbiddenTerms": 1,
    "namingInconsistencies": 2
  }
}
```

### Pattern-Statistiken

```typescript
// Export aller Patterns eines Users
const patterns = patternLearner.getFrequentPatterns('user-123', 100);

// Speichere als JSON
fs.writeFileSync('user-patterns.json', JSON.stringify(patterns, null, 2));
```

---

## 🔄 Wartung

### Wöchentlich

```bash
# Validiere gesamten Codebase
npm run validate-canon

# Prüfe auf neue Patterns
# Aktualisiere recognizeIntent() falls nötig
```

### Monatlich

```bash
# Exportiere User-Patterns
# Konsolidiere ähnliche Patterns
# Aktualisiere Canon mit Erkenntnissen
```

### Quartalsweise

```bash
# Vollständiger Canon-Review
# Glossar-Bereinigung
# Archiviere veraltete Patterns
```

---

## 🎯 Best Practices

### ✅ DO

1. **Immer** Konstanten aus `terminology.ts` verwenden
2. **Immer** `validator.ts` vor DB-Operations nutzen
3. **Immer** Canon prüfen bei Unklarheit
4. **Immer** Build-Validierung durchlaufen lassen
5. **Immer** neue Begriffe in Canon dokumentieren

### ❌ DON'T

1. **Nie** hardcoded UI-Strings (außer in `terminology.ts`)
2. **Nie** verbotene Begriffe verwenden (siehe `FORBIDDEN_TERMS`)
3. **Nie** Duplikate erstellen (prüfe Canon zuerst)
4. **Nie** Premium-Features ohne Gating
5. **Nie** DB-Änderungen ohne Migration

---

## 🆘 Troubleshooting

### "Verbotener Begriff gefunden"

```bash
# Prüfe welcher Begriff:
npm run validate-canon

# Finde korrekte Alternative:
cat src/system/SYSTEM_CANON.md | grep -i "dein-begriff"

# Ersetze in Code:
# "Anbieter" → VENDOR.SINGULAR
```

### "Hardcoded UI-String gefunden"

```typescript
// ❌ Vorher
<h2>Budget-Posten</h2>

// ✅ Nachher
import { BUDGET } from '../constants/terminology';
<h2>{BUDGET.ITEM}</h2>
```

### "Naming-Inkonsistenz gefunden"

```typescript
// ❌ Vorher (camelCase für DB-Tabelle)
const budgetItems = await supabase.from('budget_items').select();

// ✅ Nachher (snake_case beibehalten)
const budget_items = await supabase.from('budget_items').select();
// ODER PascalCase für TypeScript Interface
const budgetItems: BudgetItem[] = data;
```

---

## 📚 Referenzen

- **System Canon:** `src/system/SYSTEM_CANON.md`
- **Validator:** `src/system/validator.ts`
- **Terminologie:** `src/constants/terminology.ts`
- **KI-Instruktionen:** `.bolt/SYSTEM_INSTRUCTIONS.md`
- **Build-Validierung:** `scripts/validate-canon.ts`

---

## ✨ Zusammenfassung

Das System Fundament ist **ein lebendiges, lernendes System**, das:

1. ✅ **Konsistenz erzwingt** (automatische Validierung)
2. ✅ **Qualität sichert** (Canon als Wahrheit)
3. ✅ **Duplikate verhindert** (vor Implementierung prüfen)
4. ✅ **Lernfähig ist** (Pattern-Learning)
5. ✅ **Sich anpasst** (User-Präferenzen)

**Mission:** Nie wieder Inkonsistenzen, Dopplungen oder veraltete Begriffe. Ein System, das versteht und lernt.

---

**Ende der System-Dokumentation v1.0.0**
