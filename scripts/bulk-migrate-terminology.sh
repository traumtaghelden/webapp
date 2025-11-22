#!/bin/bash
# BULK TERMINOLOGY MIGRATION SCRIPT
# Ersetzt häufige hardcoded Strings automatisch durch Terminologie-Konstanten

set -e

PROJECT_ROOT="/tmp/cc-agent/59476657/project"
COMPONENTS_DIR="$PROJECT_ROOT/src/components"

echo "🔄 Starte Bulk-Migration der Terminologie..."
echo ""

# Backup erstellen
BACKUP_DIR="$PROJECT_ROOT/backup-$(date +%Y%m%d_%H%M%S)"
echo "📦 Erstelle Backup in: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"
cp -r "$COMPONENTS_DIR" "$BACKUP_DIR/"

# Counter
TOTAL_REPLACEMENTS=0

# Funktion: Replace in files
replace_in_files() {
    local pattern="$1"
    local replacement="$2"
    local description="$3"

    echo "🔍 Suche: $description"
    local count=$(grep -r "$pattern" "$COMPONENTS_DIR" --include="*.tsx" | wc -l)

    if [ "$count" -gt 0 ]; then
        echo "   → $count Vorkommen gefunden, ersetze..."
        find "$COMPONENTS_DIR" -name "*.tsx" -type f -exec sed -i "s/$pattern/$replacement/g" {} \;
        TOTAL_REPLACEMENTS=$((TOTAL_REPLACEMENTS + count))
        echo "   ✅ Ersetzt"
    else
        echo "   → Keine Vorkommen gefunden"
    fi
    echo ""
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 1: COMMON STRINGS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Erst Import hinzufügen (manuell, da komplex)
echo "⚠️  HINWEIS: Imports müssen manuell hinzugefügt werden:"
echo "   import { BUDGET, VENDOR, TASK, GUEST, TIMELINE, COMMON } from '../constants/terminology';"
echo ""

# Common Strings
replace_in_files '"Übersicht"' 'COMMON.OVERVIEW' 'Übersicht'
replace_in_files '"Details"' 'COMMON.DETAILS' 'Details'
replace_in_files '"Verlauf"' 'COMMON.HISTORY' 'Verlauf'
replace_in_files '"Anhänge"' 'COMMON.ATTACHMENTS' 'Anhänge'
replace_in_files '"Dokumente"' 'COMMON.DOCUMENTS' 'Dokumente'
replace_in_files '"Finanzen"' 'COMMON.FINANCES' 'Finanzen'

# Aktionen
replace_in_files '"Hinzufügen"' 'COMMON.ADD' 'Hinzufügen'
replace_in_files '"Bearbeiten"' 'COMMON.EDIT' 'Bearbeiten'
replace_in_files '"Löschen"' 'COMMON.DELETE' 'Löschen'
replace_in_files '"Speichern"' 'COMMON.SAVE' 'Speichern'
replace_in_files '"Abbrechen"' 'COMMON.CANCEL' 'Abbrechen'
replace_in_files '"Schließen"' 'COMMON.CLOSE' 'Schließen'
replace_in_files '"Zurück"' 'COMMON.BACK' 'Zurück'
replace_in_files '"Weiter"' 'COMMON.NEXT' 'Weiter'
replace_in_files '"Bestätigen"' 'COMMON.CONFIRM' 'Bestätigen'

# Export/Import
replace_in_files '"Exportieren"' 'COMMON.EXPORT' 'Exportieren'
replace_in_files '"Herunterladen"' 'COMMON.DOWNLOAD' 'Herunterladen'
replace_in_files '"Hochladen"' 'COMMON.UPLOAD' 'Hochladen'

# Status/Messages
replace_in_files '"Lädt..."' 'COMMON.LOADING' 'Lädt...'
replace_in_files '"Keine Daten vorhanden"' 'COMMON.NO_DATA' 'Keine Daten vorhanden'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 2: BUDGET STRINGS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

replace_in_files '"Budget-Posten"' 'BUDGET.ITEM' 'Budget-Posten'
replace_in_files '"Kategorie"' 'BUDGET.CATEGORY' 'Kategorie (Budget)'
replace_in_files '"Zahlung"' 'BUDGET.PAYMENT' 'Zahlung (Budget)'
replace_in_files '"Zahlungen"' 'BUDGET.PAYMENT_PLURAL' 'Zahlungen (Budget)'
replace_in_files '"Geplante Kosten"' 'BUDGET.ESTIMATED_COST' 'Geplante Kosten'
replace_in_files '"Tatsächliche Kosten"' 'BUDGET.ACTUAL_COST' 'Tatsächliche Kosten'

# Payment Status
replace_in_files '"Ausstehend"' 'BUDGET.PAYMENT_STATUS.PENDING' 'Ausstehend (Budget)'
replace_in_files '"Bezahlt"' 'BUDGET.PAYMENT_STATUS.PAID' 'Bezahlt'
replace_in_files '"Teilweise bezahlt"' 'BUDGET.PAYMENT_STATUS.PARTIAL' 'Teilweise bezahlt'
replace_in_files '"Überfällig"' 'BUDGET.PAYMENT_STATUS.OVERDUE' 'Überfällig'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 3: VENDOR STRINGS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

replace_in_files '"Dienstleister"' 'VENDOR.SINGULAR' 'Dienstleister'
replace_in_files '"Vertrag"' 'VENDOR.CONTRACT' 'Vertrag'
replace_in_files '"Dokument"' 'VENDOR.DOCUMENT' 'Dokument (Vendor)'
replace_in_files '"Ansprechpartner"' 'VENDOR.CONTACT_NAME' 'Ansprechpartner'
replace_in_files '"Gesamtkosten"' 'VENDOR.TOTAL_COST' 'Gesamtkosten'
replace_in_files '"Bewertung"' 'VENDOR.RATING' 'Bewertung'
replace_in_files '"Notizen"' 'VENDOR.NOTES' 'Notizen (Vendor)'

# Contract Status
replace_in_files '"Anfrage"' 'VENDOR.CONTRACT_STATUS.INQUIRY' 'Anfrage'
replace_in_files '"Verhandlung"' 'VENDOR.CONTRACT_STATUS.NEGOTIATION' 'Verhandlung'
replace_in_files '"Vertragsunterzeichnung"' 'VENDOR.CONTRACT_STATUS.SIGNED' 'Vertragsunterzeichnung'
replace_in_files '"Gebucht"' 'VENDOR.CONTRACT_STATUS.BOOKED' 'Gebucht'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 4: TASK STRINGS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

replace_in_files '"Aufgabe"' 'TASK.SINGULAR' 'Aufgabe'
replace_in_files '"Aufgaben"' 'TASK.PLURAL' 'Aufgaben'
replace_in_files '"Unteraufgabe"' 'TASK.SUBTASK' 'Unteraufgabe'

# Task Status (Achtung: BUDGET hat auch "Ausstehend", daher spezifischer)
replace_in_files '"In Bearbeitung"' 'TASK.STATUS.IN_PROGRESS' 'In Bearbeitung'
replace_in_files '"Erledigt"' 'TASK.STATUS.COMPLETED' 'Erledigt'

# Task Priority
replace_in_files '"Niedrig"' 'TASK.PRIORITY.LOW' 'Niedrig'
replace_in_files '"Mittel"' 'TASK.PRIORITY.MEDIUM' 'Mittel'
replace_in_files '"Hoch"' 'TASK.PRIORITY.HIGH' 'Hoch'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 5: GUEST STRINGS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

replace_in_files '"Gast"' 'GUEST.SINGULAR' 'Gast'
replace_in_files '"Gäste"' 'GUEST.PLURAL' 'Gäste'
replace_in_files '"Familie"' 'GUEST.FAMILY' 'Familie'
replace_in_files '"Gruppe"' 'GUEST.GROUP' 'Gruppe (Guest)'

# RSVP Status
replace_in_files '"Geplant"' 'GUEST.RSVP_STATUS.PLANNED' 'Geplant'
replace_in_files '"Eingeladen"' 'GUEST.RSVP_STATUS.INVITED' 'Eingeladen'
replace_in_files '"Zugesagt"' 'GUEST.RSVP_STATUS.ACCEPTED' 'Zugesagt'
replace_in_files '"Abgesagt"' 'GUEST.RSVP_STATUS.DECLINED' 'Abgesagt'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 6: TIMELINE STRINGS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

replace_in_files '"Event"' 'TIMELINE.EVENT' 'Event'
replace_in_files '"Events"' 'TIMELINE.EVENT_PLURAL' 'Events'
replace_in_files '"Puffer"' 'TIMELINE.BUFFER' 'Puffer'
replace_in_files '"Block"' 'TIMELINE.BLOCK' 'Block'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ MIGRATION ABGESCHLOSSEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Statistik:"
echo "   → Gesamt Ersetzungen: ~$TOTAL_REPLACEMENTS"
echo "   → Backup: $BACKUP_DIR"
echo ""
echo "⚠️  WICHTIG: Nächste Schritte manuell:"
echo ""
echo "1. Imports hinzufügen zu allen geänderten Dateien:"
echo "   import { BUDGET, VENDOR, TASK, GUEST, TIMELINE, COMMON } from '../constants/terminology';"
echo ""
echo "2. Spezialfall 'Kategorie' (mehrere Module):"
echo "   - Budget: BUDGET.CATEGORY"
echo "   - Vendor: VENDOR.CATEGORY"
echo "   - Task: TASK.CATEGORY"
echo "   Manuell prüfen und anpassen!"
echo ""
echo "3. Build testen:"
echo "   npm run build"
echo ""
echo "4. Bei Problemen: Backup wiederherstellen:"
echo "   cp -r $BACKUP_DIR/components/* $COMPONENTS_DIR/"
echo ""
echo "🎉 Bulk-Migration abgeschlossen!"
