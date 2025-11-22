# 🐛 Bugfix: TaskListView Crash behoben

**Datum:** 2025-11-06
**Status:** ✅ Behoben
**Build:** ✅ Erfolgreich

---

## Problem

**Fehler:** `Cannot read properties of undefined (reading 'filter')`

**Stack Trace:**
```
at UnifiedTable (UnifiedTable.tsx:21:3)
at TaskListView (TaskListView.tsx:37:3)
```

**Ursache:**
1. `UnifiedTable` verwendete `data.filter()` ohne zu prüfen ob `data` existiert
2. `TaskListView` wurde in `TaskManagerNew.tsx` mit nur 3 Props aufgerufen, erwartete aber 8 Props
3. `subtasks`, `budgetItems`, `vendors`, `teamRoles` waren `undefined`
4. Auf `undefined` wurde `.filter()` aufgerufen → Crash

---

## Lösung

### 1. UnifiedTable.tsx - Defensive Programmierung

**Änderungen:**
- `safeData = data || []` erstellt sichere Kopie
- Prüfung `if (!safeData || safeData.length === 0)` vor Rendering
- Default Empty State wenn keine Daten
- Alle `.map()` Aufrufe verwenden `safeData` statt `data`

**Code:**
```tsx
const safeData = data || [];

if (!safeData || safeData.length === 0) {
  if (emptyState) {
    return <>{emptyState}</>;
  }
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
      <p className="text-gray-500">Keine Daten verfügbar</p>
    </div>
  );
}

// Verwende safeData statt data
{safeData.map((item, index) => { ... })}
```

### 2. TaskListView.tsx - Flexible Props & Auto-Loading

**Änderungen:**

#### Props-Interface angepasst:
```tsx
interface TaskListViewProps {
  tasks: Task[];
  weddingId: string;
  onUpdate: () => void;
  // Alle anderen Props sind jetzt optional
  subtasks?: TaskSubtask[];
  budgetItems?: BudgetItem[];
  vendors?: Vendor[];
  teamRoles?: WeddingTeamRole[];
  onTaskClick?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onStatusChange?: (taskId: string, newStatus: ...) => void;
}
```

#### Auto-Loading hinzugefügt:
Wenn Props nicht bereitgestellt werden, lädt die Komponente die Daten selbst:

```tsx
useEffect(() => {
  if (!providedSubtasks || !providedTeamRoles) {
    loadAdditionalData();
  }
}, [weddingId]);

const loadAdditionalData = async () => {
  // Lädt fehlende Subtasks und TeamRoles aus DB
  const results = await Promise.all([
    supabase.from('task_subtasks').select('*'),
    supabase.from('wedding_team_roles').select('*')
  ]);
  // ... set state
};
```

#### Default Handler implementiert:
Wenn Callbacks nicht bereitgestellt werden, werden Default-Implementierungen verwendet:

```tsx
const handleDeleteTask = async (taskId: string) => {
  if (onDeleteTask) {
    onDeleteTask(taskId);
  } else {
    // Default: Direkt aus DB löschen
    await supabase.from('tasks').delete().eq('id', taskId);
    onUpdate();
  }
};
```

#### Safe Arrays:
```tsx
const safeSubtasks = subtasks || [];
const safeTeamRoles = teamRoles || [];

// Verwendet in allen .filter() und .find() Aufrufen
const taskSubtasks = safeSubtasks.filter(s => s.task_id === task.id);
const assignedRole = safeTeamRoles.find(r => r.name === task.assigned_to);
```

---

## Kompatibilität

Die Komponente funktioniert jetzt in beiden Modi:

### Modus 1: Mit allen Props (alter Code funktioniert weiter)
```tsx
<TaskListView
  tasks={tasks}
  subtasks={subtasks}
  budgetItems={budgetItems}
  vendors={vendors}
  teamRoles={teamRoles}
  onTaskClick={handleClick}
  onDeleteTask={handleDelete}
  onStatusChange={handleStatus}
/>
```

### Modus 2: Minimal (wie in TaskManagerNew.tsx verwendet)
```tsx
<TaskListView
  tasks={tasks}
  weddingId={weddingId}
  onUpdate={onUpdate}
/>
```
→ Lädt fehlende Daten automatisch aus der Datenbank

---

## Getestete Szenarien

✅ TaskListView mit minimalen Props (weddingId, tasks, onUpdate)
✅ TaskListView mit allen Props bereitgestellt
✅ UnifiedTable mit undefined data
✅ UnifiedTable mit leerem Array
✅ UnifiedTable mit Daten
✅ Build erfolgreich (1,133 KB)

---

## Verbesserungen

1. **Robustheit:** Komponente crasht nie mehr bei fehlenden Props
2. **Flexibilität:** Kann mit minimalen oder vollständigen Props verwendet werden
3. **Auto-Loading:** Lädt fehlende Daten selbstständig
4. **Fehlerbehandlung:** Alle DB-Queries mit try-catch und Logging
5. **Default-Handler:** Funktioniert auch ohne Callback-Props

---

## Weitere betroffene Dateien

- ✅ `src/components/common/UnifiedTable.tsx` - Null-Safe
- ✅ `src/components/Tasks/TaskListView.tsx` - Flexible Props + Auto-Loading

---

## Nächste Schritte

Empfehlung: Dieses Pattern auf andere Komponenten anwenden:
- `GuestListView` (falls vorhanden)
- `VendorListView` (falls vorhanden)
- `BudgetListView` (falls vorhanden)

Alle Listenkomponenten sollten:
1. Props optional machen (außer essenzielle wie `weddingId`)
2. Fehlende Daten selbst laden
3. Safe Array-Handling verwenden
4. Default-Handler implementieren

---

**Erstellt:** 2025-11-06
**Build-Status:** ✅ Erfolgreich (1,133.62 KB)
