# Cross-Module Synchronisation - Entwickler-Guide

## Übersicht

Das System synchronisiert automatisch Daten zwischen Task, Budget, Vendor und Timeline. Alle Änderungen werden bidirektional und in Echtzeit übertragen.

---

## 🔄 Automatische Synchronisationen

### 1. Vendor ↔ Budget

**Bereits implementiert** (siehe Migration `20251102110000_create_bidirectional_vendor_budget_sync.sql`)

#### Vendor → Budget
- Vendor mit Kosten erstellt → Budget-Item wird automatisch angelegt
- Vendor-Kosten geändert → Budget-Item wird aktualisiert
- Vendor gelöscht → Budget-Item wird gelöscht (CASCADE)

#### Budget → Vendor
- Budget-Item Betrag geändert → Vendor Gesamtkosten aktualisiert
- Budget-Item als bezahlt markiert → Vendor paid_amount aktualisiert
- Zahlungen werden bidirektional synchronisiert

### 2. Task ↔ Budget ↔ Timeline

**Neu implementiert** (siehe Migration `20251102_create_cross_module_sync_and_activity_log.sql`)

#### Task → Budget
```typescript
// Wenn Task abgeschlossen wird und mit Vendor verknüpft ist
// → Zugehörige Budget-Zahlungen werden automatisch als "bezahlt" markiert

// Beispiel: Task "Anzahlung Fotograf" wird abgeschlossen
// → Budget-Zahlung für Fotograf-Vendor wird automatisch auf "paid" gesetzt
```

#### Budget Payment → Task
```typescript
// Wenn Zahlung als "bezahlt" markiert wird
// → Zugehörige Tasks mit Bezug zu diesem Vendor werden abgeschlossen

// Beispiel: Zahlung im Budget markiert
// → Task "Fotograf bezahlen" wird automatisch als completed markiert
```

#### Timeline → Task
```typescript
// Wenn Timeline-Event-Datum geändert wird
// → Alle verknüpften Task due_dates werden aktualisiert

// Beispiel: Hochzeitstermin verschoben von 15.06. auf 22.06.
// → Tasks mit timeline_event_id werden automatisch auf neues Datum gesetzt
```

---

## 🧩 Neue UI-Komponenten

### 1. LinkedEntityChips

Zeigt verknüpfte Einträge als anklickbare Chips.

```typescript
import LinkedEntityChips from './components/LinkedEntityChips';

<LinkedEntityChips
  entities={[
    {
      id: 'vendor-123',
      type: 'vendor',
      name: 'FotoStudio Lichtblick',
      onClick: () => navigate(`/vendors/${id}`)
    },
    {
      id: 'budget-456',
      type: 'budget',
      name: 'Fotograf',
      onClick: () => navigate(`/budget/${id}`)
    }
  ]}
  compact={false}
  showCount={false}
/>
```

**Props:**
- `entities`: Array von LinkedEntity-Objekten
- `compact`: Zeigt nur Type-Labels (z.B. "Budget", "Aufgabe")
- `showCount`: Gruppiert nach Type und zeigt Anzahl
- `onShowAll`: Callback wenn "Alle anzeigen" geklickt wird

### 2. ActivityFeed

Zeigt Aktivitäts-Log für einen Eintrag.

```typescript
import ActivityFeed from './components/ActivityFeed';

<ActivityFeed
  entityType="vendor"
  entityId={vendorId}
  limit={20}
  compact={false}
/>
```

**Features:**
- Zeigt alle Aktionen (erstellt, aktualisiert, verknüpft, bezahlt)
- Relative Zeitangaben ("Vor 2 Std.")
- Zeigt verknüpfte Entities
- Expandierbar im compact-Modus

### 3. DeleteWithLinksDialog

Sicherer Lösch-Dialog mit Verknüpfungs-Warnung.

```typescript
import DeleteWithLinksDialog from './components/DeleteWithLinksDialog';

<DeleteWithLinksDialog
  isOpen={showDeleteDialog}
  entityType="vendor"
  entityId={vendorId}
  entityName="FotoStudio Lichtblick"
  onClose={() => setShowDeleteDialog(false)}
  onConfirm={async (options) => {
    if (options.unlinkOnly) {
      // Nur Verknüpfungen lösen
    } else if (options.cascadeDelete) {
      // Alles löschen
    }
    await performDelete();
  }}
/>
```

**Features:**
- Zeigt alle verknüpften Einträge
- Zwei Optionen: "Nur diesen löschen" oder "Alles löschen"
- Warnung bei CASCADE-Delete
- Liste aller betroffenen Einträge

---

## 🔨 Hooks

### 1. useContextualCreate

Ermöglicht kontext-bewusstes Erstellen von Einträgen.

```typescript
import { useContextualCreate } from '../hooks/useContextualCreate';

const { createTask, createBudgetItem, createPayment, linkEntities } = useContextualCreate({
  weddingId,
  sourceType: 'vendor',
  sourceId: vendorId,
  vendorId: vendorId
});

// Task mit automatischer Vendor-Verknüpfung erstellen
const task = await createTask({
  title: 'Anzahlung überweisen',
  description: 'Rechnung vom 15.03.',
  due_date: '2024-04-01',
  priority: 'high'
});
// → Task wird automatisch mit vendorId verknüpft

// Zahlung erstellen (automatisch mit Budget-Item verknüpft)
const payment = await createPayment({
  amount: 500,
  due_date: '2024-04-01',
  notes: 'Anzahlung 50%'
});
// → Findet automatisch Budget-Item für Vendor und erstellt Zahlung
```

**Context-Parameter:**
- `weddingId`: Pflicht
- `sourceType`: 'task' | 'budget' | 'vendor' | 'timeline'
- `sourceId`: ID des Quell-Eintrags
- `vendorId`: Automatische Vendor-Verknüpfung
- `budgetItemId`: Automatische Budget-Verknüpfung
- `timelineEventId`: Automatische Timeline-Verknüpfung
- `taskId`: Automatische Task-Verknüpfung

### 2. useLinkProtection

Prüft Verknüpfungen vor dem Löschen.

```typescript
import { useLinkProtection } from '../hooks/useLinkProtection';

const {
  linkedEntities,
  hasLinks,
  loading,
  getDeleteMessage,
  performDelete,
  reload
} = useLinkProtection('vendor', vendorId);

// Prüfen ob Verknüpfungen existieren
if (hasLinks) {
  console.log(getDeleteMessage());
  // → "Dieser Eintrag ist verknüpft mit: 3 Aufgaben, 1 Budget-Posten, 2 Zahlungen"
}

// Löschen mit Options
await performDelete({
  unlinkOnly: true // Nur Verknüpfungen lösen
});

await performDelete({
  cascadeDelete: true // Alles löschen
});
```

**Rückgabe-Objekt:**
```typescript
{
  linkedEntities: {
    tasks: Array<{id, title}>,
    budgetItems: Array<{id, item_name}>,
    timelineEvents: Array<{id, title}>,
    payments: Array<{id, amount}>
  },
  hasLinks: boolean,
  loading: boolean,
  getDeleteMessage: () => string,
  performDelete: (options) => Promise<void>,
  reload: () => Promise<void>
}
```

---

## 📋 Aktivitäts-Logging

### Funktion

Jede wichtige Aktion wird automatisch geloggt:

```sql
-- Wird automatisch von Triggern aufgerufen
SELECT log_activity(
  p_wedding_id := '...',
  p_entity_type := 'task',
  p_entity_id := '...',
  p_action_type := 'completed',
  p_related_entity_type := 'payment',
  p_related_entity_id := '...',
  p_details := jsonb_build_object('auto_completed', true)
);
```

### Abrufen

```sql
-- Aktivitäten für eine Entity abrufen
SELECT * FROM get_entity_activities(
  p_entity_type := 'vendor',
  p_entity_id := 'vendor-id',
  p_limit := 50
);
```

### Action Types

- `created` - Erstellt
- `updated` - Aktualisiert
- `deleted` - Gelöscht
- `linked` - Verknüpft
- `unlinked` - Verknüpfung gelöst
- `status_changed` - Status geändert
- `payment_made` - Zahlung erfasst
- `completed` - Abgeschlossen
- `date_changed` - Datum geändert

---

## 🎯 Integration-Beispiele

### Vendor-Detail-Ansicht mit allen Features

```typescript
function VendorDetail({ vendorId }: { vendorId: string }) {
  const { createTask, createPayment } = useContextualCreate({
    weddingId,
    sourceType: 'vendor',
    sourceId: vendorId,
    vendorId
  });

  return (
    <div>
      {/* Verknüpfte Einträge anzeigen */}
      <LinkedEntityChips
        entities={linkedTasks.map(task => ({
          id: task.id,
          type: 'task',
          name: task.title,
          onClick: () => navigate(`/tasks/${task.id}`)
        }))}
      />

      {/* Aktivitäts-Feed */}
      <ActivityFeed
        entityType="vendor"
        entityId={vendorId}
        compact={true}
      />

      {/* Kontext-bewusste Aktionen */}
      <button onClick={async () => {
        const task = await createTask({
          title: 'Vertrag unterschreiben',
          priority: 'high',
          due_date: '2024-04-15'
        });
        // Task ist automatisch mit Vendor verknüpft
      }}>
        Neue Aufgabe
      </button>

      <button onClick={async () => {
        const payment = await createPayment({
          amount: 1000,
          due_date: '2024-05-01',
          notes: 'Schlusszahlung'
        });
        // Zahlung wird automatisch mit Budget-Item für Vendor verknüpft
      }}>
        Neue Zahlung
      </button>
    </div>
  );
}
```

### Budget-Ansicht mit Synchronisation

```typescript
function BudgetItemRow({ item }: { item: BudgetItem }) {
  const [vendor, setVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    if (item.vendor_id) {
      loadVendor(item.vendor_id);
    }
  }, [item.vendor_id]);

  return (
    <tr>
      <td>{item.item_name}</td>
      <td>{item.actual_cost}€</td>

      {/* Verknüpfung zum Vendor */}
      {vendor && (
        <LinkedEntityChips
          entities={[{
            id: vendor.id,
            type: 'vendor',
            name: vendor.name,
            onClick: () => navigate(`/vendors/${vendor.id}`)
          }]}
          compact
        />
      )}

      {/* Zeigt Sync-Status */}
      <td>
        {item.vendor_id && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            Sync aktiv
          </span>
        )}
      </td>
    </tr>
  );
}
```

### Task-Ansicht mit Timeline-Sync

```typescript
function TaskItem({ task }: { task: Task }) {
  const [timelineEvent, setTimelineEvent] = useState<TimelineEvent | null>(null);

  useEffect(() => {
    if (task.timeline_event_id) {
      loadTimelineEvent(task.timeline_event_id);
    }
  }, [task.timeline_event_id]);

  return (
    <div className="task-card">
      <h3>{task.title}</h3>
      <p>Fällig: {task.due_date}</p>

      {/* Warnung bei verschobenem Timeline-Event */}
      {timelineEvent && (
        <div className="alert alert-info">
          <Clock className="w-4 h-4" />
          <span>Automatisch aktualisiert durch Timeline-Änderung</span>
        </div>
      )}

      {/* Verknüpfte Entities */}
      <LinkedEntityChips
        entities={[
          task.vendor_id && { id: task.vendor_id, type: 'vendor', name: 'Dienstleister' },
          task.timeline_event_id && { id: task.timeline_event_id, type: 'timeline', name: timelineEvent?.title }
        ].filter(Boolean)}
      />
    </div>
  );
}
```

---

## ⚠️ Wichtige Hinweise

### 1. Zirkuläre Trigger vermeiden

Die Synchronisations-Trigger verwenden ein Flag-System, um Endlosschleifen zu verhindern:

```sql
-- In jedem Trigger
IF is_in_sync_operation() THEN
  RETURN NEW;
END IF;

PERFORM set_sync_flag(true);
-- ... Sync-Operationen ...
PERFORM set_sync_flag(false);
```

### 2. CASCADE vs. SET NULL

- **vendors** → **budget_items**: ON DELETE CASCADE (Budget wird mit Vendor gelöscht)
- **tasks.vendor_id**: ON DELETE SET NULL (Task bleibt, Verknüpfung wird gelöst)
- **tasks.timeline_event_id**: ON DELETE SET NULL

### 3. Performance

- Alle Foreign Keys haben Indizes
- Activity Log hat Indizes auf wedding_id, entity, created_at
- Sync-Log wird für Auditing genutzt, aber nicht für Queries

### 4. Mobile-Optimierung

Alle Chips und Feeds sind Touch-optimiert:
- Mindestgröße 44x44px für Touch-Targets
- Swipe-Gesten werden nicht blockiert
- Kompakt-Modus für kleine Bildschirme

---

## 🚀 Nächste Schritte für Entwickler

1. **Vendor-Komponenten erweitern**
   - LinkedEntityChips in VendorDetailModal einbauen
   - ActivityFeed in Vendor-Sidebar
   - DeleteWithLinksDialog bei Vendor-Löschung

2. **Task-Komponenten erweitern**
   - useContextualCreate für "Neue Zahlung aus Task"
   - Timeline-Sync-Hinweise
   - Automatische Completion-Benachrichtigungen

3. **Budget-Komponenten erweitern**
   - Vendor-Chips in Tabelle
   - Payment-Creation aus Budget heraus
   - Sync-Status-Anzeige

4. **Timeline-Komponenten erweitern**
   - Datum-Änderungs-Warnungen
   - Verknüpfte Tasks/Budget anzeigen
   - Bulk-Date-Update mit Benachrichtigung

---

## 📊 Datenbankstruktur

### Neue Tabellen

```sql
-- Aktivitäts-Log (zentral für alle Module)
activity_log (
  id uuid,
  wedding_id uuid,
  entity_type text,  -- 'task' | 'budget' | 'vendor' | 'timeline'
  entity_id uuid,
  action_type text,  -- 'created' | 'updated' | 'deleted' | ...
  related_entity_type text,
  related_entity_id uuid,
  actor_name text,
  details jsonb,
  created_at timestamptz
)

-- Vendor-Budget-Sync-Log (für Debugging)
vendor_budget_sync_log (
  id uuid,
  operation text,
  source_table text,
  source_id uuid,
  target_table text,
  target_id uuid,
  sync_data jsonb,
  created_at timestamptz
)
```

### Neue Spalten

```sql
-- tasks
ALTER TABLE tasks ADD COLUMN timeline_event_id uuid REFERENCES wedding_timeline(id) ON DELETE SET NULL;

-- (vendor_id war bereits vorhanden)
```

---

## 🔍 Debugging

### Activity Log überprüfen

```sql
-- Alle Aktivitäten für einen Vendor
SELECT * FROM get_entity_activities('vendor', 'vendor-id', 100);

-- Letzte Sync-Operationen
SELECT * FROM vendor_budget_sync_log
ORDER BY created_at DESC
LIMIT 50;

-- Finde fehlgeschlagene Syncs
SELECT * FROM activity_log
WHERE details->>'error' IS NOT NULL;
```

### Trigger testen

```sql
-- Test: Vendor-Kosten ändern → Budget sollte aktualisiert werden
UPDATE vendors SET total_cost = 5000 WHERE id = 'vendor-id';

-- Prüfen ob Budget aktualisiert wurde
SELECT * FROM budget_items WHERE vendor_id = 'vendor-id';

-- Prüfen ob Log-Eintrag erstellt wurde
SELECT * FROM vendor_budget_sync_log WHERE source_id = 'vendor-id' ORDER BY created_at DESC LIMIT 1;
```

---

## ✅ Checkliste für neue Module

Wenn du ein neues Modul hinzufügst, das verknüpft werden soll:

- [ ] Foreign Keys mit ON DELETE SET NULL oder CASCADE
- [ ] Indizes auf Foreign Keys
- [ ] RLS-Policies aktualisieren
- [ ] Sync-Trigger erstellen (mit is_in_sync_operation() Check)
- [ ] Activity-Logging einbauen
- [ ] LinkedEntityChips-Support
- [ ] DeleteWithLinksDialog integrieren
- [ ] useContextualCreate-Support
- [ ] Mobile-Optimierung testen
- [ ] Dokumentation aktualisieren
