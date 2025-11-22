# Support-Bereich - Setup-Anleitung

## Übersicht

Der Support-Bereich bietet drei Hauptfunktionen:
1. **FAQ** - 10 häufig gestellte Fragen mit Antworten (statisch)
2. **Anleitungen** - 6 Schritt-für-Schritt User-Guides (statisch)
3. **Kontakt** - Kontaktformular mit Brevo E-Mail-Integration

## Brevo API-Konfiguration

Um das Kontaktformular zu aktivieren, muss der Brevo API-Key konfiguriert werden:

### 1. Brevo API-Key erstellen

1. Melden Sie sich bei [Brevo](https://www.brevo.com/) an
2. Navigieren Sie zu **SMTP & API** → **API Keys**
3. Erstellen Sie einen neuen API-Key mit dem Namen "TraumtagHelden Support"
4. Kopieren Sie den generierten Key

### 2. API-Key in Supabase konfigurieren

**Option A: Über Supabase Dashboard**
1. Öffnen Sie Ihr Supabase-Projekt: https://app.supabase.com/project/ffzqrqybdaeqfmoewcrq
2. Navigieren Sie zu **Settings** → **Edge Functions**
3. Scrollen Sie zu **Secrets**
4. Fügen Sie ein neues Secret hinzu:
   - Name: `BREVO_API_KEY`
   - Value: `[Ihr Brevo API-Key]`

**Option B: Über Supabase CLI** (falls installiert)
```bash
supabase secrets set BREVO_API_KEY="[Ihr Brevo API-Key]"
```

### 3. Edge Function deployen

**Wichtig:** Die Edge Function muss nach dem Hinzufügen des API-Keys neu deployed werden.

```bash
# Via Supabase Dashboard:
# 1. Gehen Sie zu "Edge Functions"
# 2. Erstellen Sie eine neue Function namens "send-support-email"
# 3. Kopieren Sie den Code aus: supabase/functions/send-support-email/index.ts
# 4. Deployen Sie die Function
```

## Funktionsweise

### Kontaktformular
- Benutzer füllt Betreff, Nachricht und Priorität aus
- E-Mail-Adresse wird automatisch aus dem User-Profil geladen
- Formular sendet Daten an die Edge Function `send-support-email`
- Edge Function sendet formatierte E-Mail über Brevo API an: **sven@traumtaghelden.de**
- Benutzer erhält Success-Toast nach erfolgreichem Versand

### E-Mail-Format
Die versendeten E-Mails enthalten:
- Priorität (Niedrig 🟢 / Normal 🟡 / Hoch 🔴)
- Absender-E-Mail (mit Reply-To)
- Betreff
- Nachricht
- Zeitstempel

### Error-Handling
- Client-seitige Validierung (Mindestlänge 20 Zeichen)
- Toast-Benachrichtigungen bei Erfolg/Fehler
- Logging in Edge Function für Debugging

## Dateien

### Frontend-Komponenten
- `src/components/SupportPage.tsx` - Haupt-Support-Seite mit Tab-Navigation
- `src/components/Support/FAQTab.tsx` - FAQ-Bereich (10 statische Einträge)
- `src/components/Support/TutorialsTab.tsx` - Anleitungen (6 statische Guides)
- `src/components/Support/ContactTab.tsx` - Kontaktformular

### Backend
- `supabase/functions/send-support-email/index.ts` - Edge Function für E-Mail-Versand

### Navigation
- `src/components/VerticalSidebar.tsx` - Support-Link in Sidebar hinzugefügt
- `src/components/Dashboard.tsx` - Support-Route integriert

## FAQ-Inhalte

Die FAQ-Fragen decken folgende Themen ab:
1. Gästeliste erstellen
2. Budget verwalten
3. Dienstleister hinzufügen
4. Timeline-Funktionen
5. Heldenplan-Erklärung
6. Daten exportieren
7. Hochzeitsdaten ändern
8. Premium-Features
9. Budget-Dienstleister-Verknüpfung
10. Familien gruppieren

## Tutorials

Die 6 Anleitungen behandeln:
1. Erste Schritte nach dem Onboarding
2. Gäste hinzufügen und verwalten
3. Budget erstellen und tracken
4. Aufgaben planen und zuweisen
5. Dienstleister und Locations verwalten
6. Timeline für den Hochzeitstag erstellen

## Support-E-Mail-Adresse

Alle Support-Anfragen werden gesendet an: **sven@traumtaghelden.de**

Diese Adresse ist in der Edge Function hardcoded und kann bei Bedarf dort geändert werden.

## Troubleshooting

### "Email service not configured" Fehler
- Überprüfen Sie, ob der `BREVO_API_KEY` Secret gesetzt ist
- Stellen Sie sicher, dass die Edge Function neu deployed wurde nach dem Setzen des Secrets

### E-Mails kommen nicht an
- Prüfen Sie den Spam-Ordner
- Überprüfen Sie die Brevo-Konsole auf Fehler oder Limits
- Prüfen Sie die Edge Function Logs in Supabase

### Formular-Validierung schlägt fehl
- Nachricht muss mindestens 20 Zeichen lang sein
- Betreff darf nicht leer sein
- User muss angemeldet sein (E-Mail-Adresse wird automatisch geladen)
