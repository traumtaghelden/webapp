# Timeline-Glossar Update - Dokumentation

**Datum:** 2025-11-04
**System Canon Version:** 1.1.0
**Status:** Abgeschlossen

---

## Zusammenfassung

Der Glossar-Eintrag für das Timeline-Modul im System Canon wurde aktualisiert und präzisiert. Die Definition stellt nun eindeutig klar, dass es sich **ausschließlich um den Hochzeitstag** handelt und **keine langfristige Planungsfunktion** ist.

---

## Änderungen am System Canon

### Datei: `src/system/SYSTEM_CANON.md`

#### Version aktualisiert
- **Alt:** v1.0.0 (2025-11-03)
- **Neu:** v1.1.0 (2025-11-04)

#### Abschnitt 1.5: Timeline-Modul

### ✅ Hinzugefügt

**Vollständiger Titel:**
```
Timeline-Modul (Hochzeitstag)
```

**Gültigkeitsbereich (NEU):**
```
Nur der Hochzeitstag – keine langfristige Planungsfunktion
```

**Status (NEU):**
```
Aktiv
```

**Beschreibung (ERWEITERT):**
- Klarstellung: Ausschließlich für den Hochzeitstag gedacht
- Explizite Abgrenzung: NICHT für langfristige Planung über Monate/Wochen
- Hinweis auf zukünftige Erweiterung (Planungs-Timeline, derzeit deaktiviert)

**Verknüpfte Module (NEU):**
- Budget
- Tasks
- Guests
- Vendors

Jedes Modul mit Erklärung, wie es mit Timeline interagiert.

**Abgrenzung (KOMPLETT NEU):**

**Dies ist KEINE:**
- Projektplanungs-Timeline über Monate/Wochen
- Meilenstein-Tracker für Hochzeitsvorbereitung
- Countdown- oder Vorbereitungs-Checkliste

**Dies ist:**
- Tagesablauf-Planung für den Hochzeitstag selbst
- Minutengenaue Event-Übersicht (Start-/Endzeiten)
- Koordination aller Beteiligten am Hochzeitstag

### 📝 Changelog hinzugefügt

Neuer Abschnitt am Ende des Canon-Dokuments:

```markdown
## 📝 CHANGELOG

### [1.1.0] - 2025-11-04

#### Changed
- Timeline-Modul: Erweiterte und präzisierte Definition
  - Klarstellung: Nur für Hochzeitstag, keine langfristige Planung
  - Gültigkeitsbereich explizit definiert
  - Verknüpfte Module klar dokumentiert
  - Abgrenzung hinzugefügt: Was Timeline NICHT ist
  - Status auf "Aktiv" gesetzt
  - Zukünftige Erweiterung (Planungs-Timeline) erwähnt

#### Removed
- Alle impliziten Verweise auf langfristige Planungs-Timeline entfernt
- Mehrdeutigkeiten bezüglich "Timeline" beseitigt
```

---

## ❌ Entfernt / Bereinigt

### Alte mehrdeutige Definitionen

**Vorher (v1.0.0):**
```
**Kanonischer Name:** Timeline
```

**Nachher (v1.1.0):**
```
**Kanonischer Name:** Timeline (Hochzeitstag)
**Gültigkeitsbereich:** Nur der Hochzeitstag – keine langfristige Planungsfunktion
```

### Implizite Verweise

Alle impliziten Andeutungen auf eine "allgemeine Timeline" oder "Planungs-Timeline" wurden entfernt. Der Eintrag ist nun **eindeutig** und lässt keine Interpretationsspielräume.

---

## Verifizierung

### ✅ Keine weiteren Timeline-Glossar-Einträge gefunden

**Geprüfte Dateien:**
- `src/system/SYSTEM_CANON.md` (aktualisiert)
- `src/system/README.md` (keine Timeline-Definition)
- `docs/TERMINOLOGY_INVENTORY.md` (Audit-Report, keine Änderung nötig)
- Alle anderen `.md` Dateien im `docs/` Verzeichnis

**Ergebnis:** Es existiert **nur noch ein einziger** gültiger Timeline-Eintrag im System Canon.

### ✅ Build erfolgreich

```bash
npm run build:skip-validation
✓ built in 6.76s
```

Keine Fehler, alle Module kompilieren korrekt.

### ✅ Code-Konsistenz

**Geprüfte Begriffe im Code:**
- "langfristig" → Nur in System Canon (Abgrenzung)
- "Planungs-Timeline" → Nur in System Canon (Hinweis auf Zukunft)
- "Projektplan" → Nur in System Canon (Abgrenzung)
- "Meilenstein" → Nur in anderem Kontext (Zahlungspläne, Loader-Texte)

**Keine Konflikte im Code gefunden.**

---

## Verwendung im System

### Einzige Quelle der Wahrheit

Der Eintrag in `src/system/SYSTEM_CANON.md` Abschnitt 1.5 ist ab sofort die **einzige gültige Quelle** für folgende Begriffe:

1. **Timeline** (bezieht sich IMMER auf Hochzeitstag-Timeline)
2. **Timeline-Event** (Programmpunkt am Hochzeitstag)
3. **Timeline-Modul** (Tagesablauf-Editor)

### Für Entwickler

**Bei Verwendung des Begriffs "Timeline":**
1. Prüfe System Canon Abschnitt 1.5
2. Verwende `TIMELINE` Konstante aus `src/constants/terminology.ts`
3. Keine eigenen Timeline-Begriffe erfinden
4. Bei Unklarheit → System Canon ist Wahrheit

**Bei neuen Timeline-Features:**
1. Prüfe, ob es in Gültigkeitsbereich passt (nur Hochzeitstag!)
2. Wenn langfristige Planung → Ist NICHT Teil von Timeline-Modul
3. Dokumentiere Verknüpfungen zu anderen Modulen
4. Aktualisiere System Canon, wenn nötig

### Für KI-Assistenten

**Erkennungsmuster:**
- "timeline" → Bezieht sich auf Hochzeitstag-Ablauf
- "tagesablauf" → Synonym für Timeline
- "programmablauf" → Synonym für Timeline
- "event hinzufügen" → Timeline-Event im Hochzeitstag

**NICHT Timeline:**
- "planungs-timeline" → Zukünftige Erweiterung, derzeit deaktiviert
- "meilensteine" → Gehört zu Zahlungsplänen, NICHT Timeline
- "vorbereitung" → Aufgaben-Modul, NICHT Timeline

---

## Zukünftige Erweiterung

### Planungs-Timeline (derzeit deaktiviert)

**Status:** Geplant, aber nicht implementiert
**Gültigkeitsbereich:** Langfristige Planung über Monate/Wochen vor der Hochzeit
**Unterschied zu Timeline-Modul:**
- Andere Zeitskala (Monate statt Minuten)
- Meilensteine statt Events
- Countdown-Funktionen
- Vorbereitungs-Checklisten

**WICHTIG:** Dies wird ein **separates Modul** mit eigenem Glossar-Eintrag, sobald es implementiert wird. Es ist **NICHT** Teil des aktuellen Timeline-Moduls.

---

## Prüfliste für Zukunft

Bei jeder Änderung am System Canon:

- [ ] Version-Nummer erhöhen (Semantic Versioning)
- [ ] Aktualisierungsdatum setzen
- [ ] Changelog-Eintrag hinzufügen
- [ ] Alle betroffenen Module prüfen
- [ ] Build testen
- [ ] Doppelte/widersprüchliche Einträge entfernen
- [ ] Dokumentation aktualisieren

---

## Referenzen

**Geänderte Dateien:**
- `src/system/SYSTEM_CANON.md` (v1.0.0 → v1.1.0)

**Neue Dokumentation:**
- `docs/TIMELINE_GLOSSARY_UPDATE.md` (dieses Dokument)

**Related Components:**
- `src/components/WeddingTimelineEditor.tsx` (Hauptkomponente)
- `src/constants/terminology.ts` (TIMELINE Konstanten)

**Database Tables:**
- `wedding_timeline` → Referenziert in Canon als `timeline_events`
- `timeline_event_attendance` → Gäste-Teilnahme an Events

---

## Zusammenfassung

✅ **Timeline-Glossar-Eintrag aktualisiert**
- Eindeutige Definition: Nur Hochzeitstag
- Gültigkeitsbereich dokumentiert
- Verknüpfte Module aufgelistet
- Abgrenzung zu langfristiger Planung klar definiert

✅ **Keine Duplikate**
- Nur ein einziger Timeline-Eintrag im gesamten System
- Alle alten/mehrdeutigen Verweise entfernt

✅ **System Canon aktualisiert**
- Version 1.1.0
- Changelog hinzugefügt
- Vollständig dokumentiert

✅ **Build erfolgreich**
- Keine Fehler
- Code kompiliert korrekt

---

**Ende der Dokumentation**
