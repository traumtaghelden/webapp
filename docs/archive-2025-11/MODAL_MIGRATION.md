# Modal Migration Guide

Diese App verwendet jetzt ein zentrales Modal-System anstelle von Browser-Alerts und -Confirms.

## Verwendung

### 1. Import des Hooks
```typescript
import { useConfirmDialog } from '../hooks/useConfirmDialog';
```

### 2. Im Component verwenden
```typescript
function MyComponent() {
  const { confirm, confirmDelete, alert, showConfirm, showAlert } = useConfirmDialog();

  // ...
}
```

### 3. Beispiele

#### Einfaches Confirm
```typescript
const handleDelete = async () => {
  // ALT: if (!confirm('Wirklich löschen?')) return;

  // NEU:
  const confirmed = await confirmDelete('Wirklich löschen?');
  if (!confirmed) return;

  // Löschlogik...
};
```

#### Custom Confirm
```typescript
const handleAction = async () => {
  const confirmed = await showConfirm({
    title: 'Benutzerdefinierter Titel',
    message: 'Deine Nachricht hier',
    confirmText: 'Ja, fortfahren',
    cancelText: 'Abbrechen',
    type: 'warning' // 'danger', 'warning', 'info'
  });

  if (!confirmed) return;
  // Aktion ausführen...
};
```

#### Alert
```typescript
const showMessage = async () => {
  // ALT: alert('Fehler aufgetreten');

  // NEU:
  await alert('Fehler aufgetreten', 'danger');
  // oder
  await showAlert('Hinweis', 'Nachricht', 'info');
};
```

## Noch zu migrieren

Die folgenden Dateien enthalten noch `confirm()` oder `alert()` Aufrufe:
- TaskDetailModal.tsx
- WeddingTimelineEditor.tsx
- CategoryManager.tsx
- BudgetCategoryManager.tsx
- BudgetTagManager.tsx
- BlockPlanningModal.tsx
- BlockPlanning/SubTimelineTab.tsx
- FamilyGuestForm.tsx
- GuestDetailModal.tsx
- TaskTemplateSelector.tsx
- BudgetDetailModal.tsx
- WeddingSettings.tsx
- DataExport.tsx
- Dashboard.tsx
- BudgetManager.tsx
- TeamManager.tsx

## Vorteile

- ✅ Konsistentes Design in der gesamten App
- ✅ Bessere UX durch schöne Modals
- ✅ Mehr Flexibilität (Icons, Farben, Typen)
- ✅ Zentrales Management
- ✅ Einfach zu warten und zu erweitern
