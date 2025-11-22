# Admin Dashboard - Kurzanleitung

## Zugriff zum Admin Dashboard

### 1. Admin-Rolle zuweisen (Einmalig per SQL)

Du musst dir selbst die Admin-Rolle zuweisen, indem du folgendes SQL-Statement in der Supabase SQL-Konsole ausführst:

```sql
-- Ersetze 'DEINE_EMAIL@EXAMPLE.COM' mit deiner tatsächlichen E-Mail-Adresse
UPDATE user_profiles
SET user_role = 'admin'
WHERE email = 'DEINE_EMAIL@EXAMPLE.COM';
```

**Wichtig:** Dies ist die **einzige** Möglichkeit, Admin-Rollen zuzuweisen. Es gibt keine UI dafür, um maximale Sicherheit zu gewährleisten.

### 2. Einloggen

Nach der Rollenzuweisung:
1. Logge dich mit deinem Account ein
2. Du wirst automatisch zum Admin-Dashboard weitergeleitet
3. Normale User sehen weiterhin das normale Dashboard

## Admin Dashboard Features

### 📊 Dashboard (Übersicht)

**KPI-Cards oben:**
- Gesamt-User (alle registrierten)
- Aktive Trials
- Premium-User
- MRR (Monthly Recurring Revenue)

**Heute-Statistiken:**
- Neue Registrierungen heute
- Ablaufende Trials heute
- Premium-Upgrades heute
- Kündigungen heute

**Warnungen & Alerts:**
- Trials die heute/morgen ablaufen (rot/orange)
- Failed Payments (rot)
- Geplante Löschungen in 24h (kritisch)

**Neueste Aktivität:**
- Liste der heute registrierten User

**Quick Actions:**
- Buttons zu den wichtigsten Bereichen

---

### 👥 Users Tab

**Haupt-Funktionen:**
- Tabelle mit allen Usern
- Such-Funktion (E-Mail oder Name)
- Filter nach Status (Trial, Premium, Expired, Grace Period)
- Sortierung nach allen Spalten
- Paginierung (20 User pro Seite)
- CSV-Export

**Quick-Filter:**
- "Expiring Soon" - Trials < 3 Tage
- "Premium Active" - Alle aktiven Premium
- "In Grace Period" - User vor Löschung

**User-Details:**
- Klick auf "Details" oder auf die Zeile öffnet User-Detail-Modal

---

### 🔍 User-Detail-Modal (Wichtigste Komponente!)

**Tab: Grunddaten**
- Name, E-Mail, User-ID
- Registrierungsdatum
- Rolle (user/admin)

**Tab: Subscription** (Hier passiert die meiste Arbeit!)

*Trial-Management:*
- Trial-Status und verbleibende Tage
- **"Trial verlängern"** Button
  - Auswahl: 7, 14 oder 30 Tage
  - Grund-Eingabe (erforderlich für Audit-Log)
  - Bestätigung

*Premium-Management:*
- Premium-Status anzeigen
- **"Premium aktivieren"** - Manuell Premium geben (z.B. Support-Case)
- **"Premium deaktivieren"** - Premium entfernen (User verliert Zugriff)

*Grace Period (falls vorhanden):*
- Countdown bis Löschung
- **"Löschung abbrechen"** - User behält alle Daten
- **"Grace Period verlängern"** - Löschung um X Tage verschieben

*Event-Historie:*
- Chronologische Liste aller Subscription-Events
- Stripe-Events und manuelle Admin-Aktionen

**Tab: Wedding-Daten** (Read-Only)
- Hochzeitsdatum
- Anzahl Gäste
- Budget (Summe)
- Anzahl Tasks
- Zuletzt bearbeitet

**Tab: Activity**
- Alle Admin-Aktionen an diesem User
- Wer hat was wann gemacht
- Details zu jeder Aktion (z.B. Grund für Trial-Verlängerung)

**Tab: Support-Notizen**
- Neue Notiz hinzufügen (Textarea)
- Alle bisherigen Notizen chronologisch
- Wer hat die Notiz geschrieben und wann

---

### ⏰ Trials Tab

**Statistiken:**
- Aktive Trials gesamt
- Heute ablaufend (kritisch)
- Ablaufend in 3 Tagen (hohe Priorität)
- Ablaufend in 7 Tagen (mittlere Priorität)

**Filter:**
- Alle Trials
- Nur aktive
- Expiring Soon (< 7 Tage)
- Heute ablaufend
- Abgelaufene

**Tabelle:**
- Sortiert nach Ablaufdatum (nächste zuerst)
- Farbcodierung: Rot (< 1 Tag), Orange (< 3 Tage), Gelb (< 7 Tage)
- Countdown-Timer

**Hinweis:**
Trial-Verlängerungen machst du im User-Detail-Modal (Users-Tab).

---

### 👑 Premium Tab

**Übersicht:**
- Alle aktiven Premium-Subscriptions
- MRR-Berechnung
- Conversion-Rate

**Tabelle:**
- Name, E-Mail, Aktiviert am, Status
- Status-Badge (Active)

**Stripe-Integration:**
Premium-Management erfolgt über User-Detail-Modal.

---

### 🗑️ Deletions Tab

**Statistiken:**
- Geplante Löschungen gesamt
- Löschungen heute (kritisch)
- Löschungen diese Woche

**Tabelle:**
- User mit Grace Period
- Countdown bis Löschung
- Kritische Warnungen für Löschungen < 24h

**Aktionen:**
Löschungs-Management erfolgt über User-Detail-Modal:
- "Löschung abbrechen" - User behält Daten
- "Grace Period verlängern" - Verschieben um X Tage

---

### 📈 Analytics Tab

**Revenue-Metriken:**
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- ARPU (Average Revenue Per User)

**Conversion-Metriken:**
- Trial-zu-Premium Conversion-Rate (Prozent)
- Premium-Retention-Rate

**User-Wachstum:**
- Gesamt-User
- Aktive Trials
- Premium-User
- Neue heute

**User-Funnel:**
- Visualisierung von Registrierung bis Premium
- Prozentuale Darstellung jeder Stufe

---

### 🔗 Webhooks Tab

**Übersicht:**
- Total Events (alle Subscription-Events)
- Success (mit Stripe-ID)
- Manual (ohne Stripe-ID, Admin-Aktionen)
- Success-Rate

**Tabelle:**
- Timestamp, Event-Type, Stripe-ID, Status
- Letzte 100 Events

**Filter:**
- Alle Events
- Nur Success
- Nur Manual

---

## Häufigste Admin-Aufgaben

### 1. Trial verlängern (z.B. bei Support-Cases)

1. **Users-Tab** öffnen
2. User suchen (Suchfeld oder Filter)
3. "Details" klicken
4. **Tab: Subscription** öffnen
5. "Trial verlängern" klicken
6. Tage auswählen (7, 14 oder 30)
7. **Grund eingeben** (z.B. "Technisches Problem", "Support-Case", etc.)
8. "Bestätigen" klicken
9. ✅ Success-Toast erscheint

### 2. Premium manuell aktivieren

1. User-Details öffnen (siehe oben)
2. **Tab: Subscription** öffnen
3. "Premium aktivieren" klicken
4. Bestätigen
5. ✅ Success-Toast erscheint
6. User hat sofort Premium-Zugriff

### 3. Löschung abbrechen

1. **Deletions-Tab** öffnen (um User zu finden) ODER **Users-Tab** mit Filter "In Grace Period"
2. User-Details öffnen
3. **Tab: Subscription** öffnen
4. Grace Period Section
5. "Löschung abbrechen" klicken
6. Bestätigen
7. ✅ Success-Toast erscheint

### 4. Support-Notiz hinzufügen

1. User-Details öffnen
2. **Tab: Support-Notizen** öffnen
3. Notiz in Textarea eingeben
4. "Notiz speichern" klicken
5. ✅ Notiz erscheint sofort in der Liste

### 5. User-Daten exportieren

1. **Users-Tab** öffnen
2. Optional: Filter setzen (z.B. nur Premium)
3. "Export CSV" Button oben rechts klicken
4. CSV-Datei wird heruntergeladen

---

## Sicherheits-Features

### Audit-Log
- **Jede Admin-Aktion wird geloggt**
- Tabelle: `admin_audit_log`
- Enthält: Admin-ID, Action-Type, Target-User-ID, Details, Timestamp
- Sichtbar im User-Detail-Modal unter "Activity"

### Was wird geloggt?
- Trial-Verlängerungen (inkl. Grund und Dauer)
- Premium-Aktivierungen (inkl. Grund)
- Premium-Deaktivierungen
- Löschungs-Abbrüche
- Grace-Period-Verlängerungen

### Support-Notizen
- Alle Notizen werden mit Admin-ID und Timestamp gespeichert
- Tabelle: `admin_support_notes`
- Nur Admins können Notizen lesen/schreiben
- Notizen können bearbeitet/gelöscht werden (nur von eigenem Admin)

---

## RLS-Sicherheit

Alle Admin-Funktionen sind durch Row Level Security (RLS) geschützt:

```sql
-- Nur Admins dürfen Admin-Daten lesen
CREATE POLICY "Admins can read all audit logs"
  ON admin_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_role = 'admin'
    )
  );
```

---

## Wichtige Hinweise

### ⚠️ Was du NICHT über UI machen kannst:
- Admin-Rolle zuweisen/entfernen (nur via SQL)
- User-E-Mail ändern (Sicherheitsrisiko)
- User-Passwort ändern (via Supabase Auth)
- Wedding-Daten editieren (User können das selbst)
- RLS-Policies ändern (nur via Migration)
- System-Konfiguration (nur ENV-Variablen)

### ✅ Was du über UI machen kannst:
- Trial verlängern
- Premium aktivieren/deaktivieren
- Löschungen abbrechen/verschieben
- Support-Notizen hinzufügen
- User-Details anzeigen
- Statistiken einsehen
- Daten exportieren

---

## Globale Suche

In der **Header-Leiste** gibt es ein Such-Feld:
- Suche nach E-Mail
- Funktioniert übergreifend (Dashboard + Users-Tab)
- Live-Suche (filtert sofort)

---

## Auto-Refresh

Das Dashboard aktualisiert sich automatisch:
- KPIs: Alle 60 Sekunden
- Activity-Feed: Alle 60 Sekunden
- Tabellen: Manuell (über Reload oder Aktion)

---

## Keyboard Shortcuts

Aktuell keine Shortcuts implementiert, aber geplant:
- `Ctrl + K` - Globale Suche fokussieren
- `Ctrl + 1-7` - Tab-Navigation
- `ESC` - Modal schließen

---

## Fehlerbehebung

### "Keine Admin-Rechte"
- Überprüfe in Supabase SQL:
  ```sql
  SELECT email, user_role FROM user_profiles WHERE email = 'DEINE_EMAIL';
  ```
- Sollte `user_role = 'admin'` anzeigen

### "RPC-Fehler: is_admin"
- Migration wurde nicht ausgeführt
- Führe Migration aus: `create_admin_helper_functions`

### "Kann User nicht laden"
- RLS-Policies fehlen oder falsch konfiguriert
- Überprüfe Policies in Supabase Studio

### Build-Fehler
- `npm run build` sollte ohne Fehler durchlaufen
- Falls Fehler: TypeScript-Fehler prüfen

---

## Nächste Schritte

### Empfohlene Erweiterungen:
1. **E-Mail-Benachrichtigungen**
   - Bei ablaufenden Trials
   - Bei Failed Payments
   - Bei kritischen Events

2. **Bulk-Aktionen erweitern**
   - Mehrere User gleichzeitig bearbeiten
   - Bulk Trial-Verlängerung

3. **Erweiterte Analytics**
   - Cohort-Analysis
   - Churn-Prediction
   - Revenue-Forecasting

4. **Webhook-Retry**
   - Fehlgeschlagene Webhooks erneut verarbeiten
   - Automatic Retry-Mechanismus

5. **Export-Formate**
   - Excel-Export mit Charts
   - PDF-Reports
   - Automatische E-Mail-Reports

---

## Support

Bei Fragen oder Problemen:
1. Prüfe das Audit-Log für Details
2. Schaue in die Browser-Console für Fehler
3. Überprüfe Supabase-Logs
4. Kontaktiere den Entwickler

---

**Viel Erfolg mit deinem Admin-Dashboard! 🎉**
